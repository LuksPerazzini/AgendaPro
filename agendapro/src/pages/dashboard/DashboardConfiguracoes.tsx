import { useEffect, useMemo, useState } from 'react'
import { User, Clock, Shield, Loader2, Check, AlertCircle, Save, Sparkles, ArrowRight, Star, ImagePlus, Lock, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

type TabId = 'perfil' | 'horarios' | 'plano'

type DaySchedule = { active: boolean; start: string; end: string }
type Schedule = Record<string, DaySchedule>

type ProfileExtra = {
  bio: string | null
  phone: string | null
  city: string | null
  state: string | null
  avatar_url?: string | null
  cover_url?: string | null
  public_phone?: boolean
  booking_enabled?: boolean
  booking_requires_confirmation?: boolean
  schedule?: Schedule | null
  photos?: string[] | null
}

const weekDays = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo']
const weekDayLabels: Record<string, string> = {
  Segunda: 'Segunda',
  Terca: 'Terça',
  Quarta: 'Quarta',
  Quinta: 'Quinta',
  Sexta: 'Sexta',
  Sabado: 'Sábado',
  Domingo: 'Domingo',
}

const defaultSchedule: Schedule = {
  Segunda: { active: true, start: '08:00', end: '18:00' },
  Terca: { active: true, start: '08:00', end: '18:00' },
  Quarta: { active: true, start: '08:00', end: '18:00' },
  Quinta: { active: true, start: '08:00', end: '18:00' },
  Sexta: { active: true, start: '08:00', end: '18:00' },
  Sabado: { active: true, start: '08:00', end: '14:00' },
  Domingo: { active: false, start: '09:00', end: '12:00' },
}

const validTabs: TabId[] = ['perfil', 'horarios', 'plano']

function normalizeSchedule(schedule?: Schedule | null) {
  if (!schedule) return defaultSchedule

  return weekDays.reduce<Schedule>((acc, day) => {
    acc[day] = {
      active: schedule[day]?.active ?? defaultSchedule[day].active,
      start: schedule[day]?.start ?? defaultSchedule[day].start,
      end: schedule[day]?.end ?? defaultSchedule[day].end,
    }
    return acc
  }, {} as Schedule)
}

function ScheduleToggle({
  checked,
  onToggle,
  label,
  interactive = true,
}: {
  checked: boolean
  onToggle?: () => void
  label: string
  interactive?: boolean
}) {
  const className = [
    'relative inline-flex h-7 w-14 flex-shrink-0 items-center rounded-full border px-1 transition-all duration-200',
    interactive ? 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer' : 'pointer-events-none',
    checked
      ? 'border-indigo-500 bg-gradient-to-r from-indigo-600 to-violet-500 shadow-[0_8px_20px_rgba(79,70,229,0.28)]'
      : 'border-slate-200 bg-slate-100 shadow-inner',
  ].join(' ')

  const content = (
    <>
      <span
        className={[
          'absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-[left] duration-200',
          checked ? 'left-8' : 'left-1',
        ].join(' ')}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${checked ? 'bg-indigo-500' : 'bg-slate-300'}`} />
      </span>
      <span
        className={[
          'pointer-events-none absolute inset-y-0 flex items-center text-[10px] font-bold uppercase tracking-wide transition-all duration-200',
          checked ? 'left-2 justify-start text-white/90' : 'right-2 justify-end text-slate-400',
        ].join(' ')}
      >
        {checked ? 'ON' : 'OFF'}
      </span>
    </>
  )

  if (!interactive) {
    return (
      <span
        role="presentation"
        aria-hidden="true"
        className={className}
      >
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={className}
    >
      {content}
    </button>
  )
}

function normalizePhotoList(photos?: string[] | null) {
  if (!Array.isArray(photos)) return ['']

  const cleaned = photos
    .filter((photo): photo is string => typeof photo === 'string')
    .map(photo => photo.trim())
    .filter(Boolean)
    .slice(0, 6)

  return cleaned.length > 0 ? cleaned : ['']
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Falha ao ler a imagem selecionada.'))
    reader.readAsDataURL(file)
  })
}

function ProfileBooleanToggle({ checked, onToggle, label, description }: { checked: boolean; onToggle: () => void; label: string; description: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${checked ? 'border-indigo-200 bg-indigo-50/70' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
    >
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="mt-0.5 text-xs text-slate-500">{description}</div>
      </div>
      <ScheduleToggle checked={checked} label={label} interactive={false} />
    </button>
  )
}

export default function DashboardConfiguracoes() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const initialTab = searchParams.get('tab')
  const activeTab = validTabs.includes(initialTab as TabId) ? (initialTab as TabId) : 'perfil'

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [photosSchemaReady, setPhotosSchemaReady] = useState(true)
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    profession: '',
    bio: '',
    phone: '',
    city: '',
    state: '',
    avatar_url: '',
    cover_url: '',
    public_phone: false,
    booking_enabled: true,
    booking_requires_confirmation: true,
  })
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule)
  const [photos, setPhotos] = useState<string[]>([''])

  const isPremiumPlan = profile?.plan === 'pro' || profile?.plan === 'business'
  const filledPhotos = photos.map(photo => photo.trim()).filter(Boolean)

  useEffect(() => {
    if (!user || !profile) return
    let ignore = false

    const loadExtra = async () => {
      setLoadingData(true)
      setErrorMessage('')

      const profileWithPhotos = await supabase
        .from('profiles')
        .select('bio, phone, city, state, avatar_url, cover_url, public_phone, booking_enabled, booking_requires_confirmation, schedule, photos')
        .eq('id', user.id)
        .single()

      const profileWithoutPhotos = profileWithPhotos.error
        ? await supabase
            .from('profiles')
            .select('bio, phone, city, state, avatar_url, cover_url, public_phone, booking_enabled, booking_requires_confirmation, schedule')
            .eq('id', user.id)
            .single()
        : null

      const profileLegacy = !profileWithPhotos.data && !profileWithoutPhotos?.data
        ? await supabase
            .from('profiles')
            .select('bio, phone, city, state, avatar_url, cover_url, public_phone, booking_enabled, schedule')
            .eq('id', user.id)
            .single()
        : null

      const profileData = profileWithPhotos.data ?? profileWithoutPhotos?.data ?? profileLegacy?.data ?? null
      const profileError = profileData ? null : (profileWithPhotos.error ?? profileWithoutPhotos?.error ?? profileLegacy?.error ?? null)

      if (ignore) return

      if (profileError) {
        setErrorMessage('Não foi possível carregar todas as configurações agora.')
      }

      const extra = profileData as ProfileExtra | null
      setPhotosSchemaReady(Boolean(profileWithPhotos.data) || !profileWithPhotos.error)

      setForm({
        full_name: profile.full_name ?? '',
        profession: profile.profession ?? '',
        bio: extra?.bio ?? '',
        phone: extra?.phone ?? '',
        city: extra?.city ?? '',
        state: extra?.state ?? '',
        avatar_url: extra?.avatar_url ?? profile.avatar_url ?? '',
        cover_url: extra?.cover_url ?? '',
        public_phone: extra?.public_phone ?? false,
        booking_enabled: extra?.booking_enabled ?? true,
        booking_requires_confirmation: extra?.booking_requires_confirmation ?? true,
      })
      setSchedule(normalizeSchedule(extra?.schedule))
      setPhotos(normalizePhotoList(extra?.photos))
      setLoadingData(false)
    }
    void loadExtra()

    return () => {
      ignore = true
    }
  }, [user, profile])

  const profileStatusText = useMemo(() => {
    if (saving) return 'Salvando...'
    if (saved) return 'Alterações salvas'
    return 'Salvar alterações'
  }, [saved, saving])

  const changeTab = (tab: TabId) => {
    setSearchParams(tab === 'perfil' ? {} : { tab })
  }

  useEffect(() => {
    if (initialTab === 'servicos') {
      navigate('/dashboard/servicos', { replace: true })
    }
  }, [initialTab, navigate])

  const saveProfile = async () => {
    if (!user) return

    if (!form.full_name.trim() || !form.profession.trim()) {
      setErrorMessage('Preencha nome completo e profissão antes de salvar o perfil.')
      return
    }

    setSaving(true)
    setErrorMessage('')

    const profilePayload = {
      full_name: form.full_name.trim(),
      profession: form.profession.trim(),
      bio: form.bio.trim() || null,
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      cover_url: form.cover_url.trim() || null,
      public_phone: form.public_phone,
      booking_enabled: form.booking_enabled,
      booking_requires_confirmation: form.booking_requires_confirmation,
    }

    let { error } = await supabase
      .from('profiles')
      .update(profilePayload)
      .eq('id', user.id)

    if (error?.message?.includes('booking_requires_confirmation')) {
      const legacyUpdate = await supabase
        .from('profiles')
        .update({
          full_name: profilePayload.full_name,
          profession: profilePayload.profession,
          bio: profilePayload.bio,
          phone: profilePayload.phone,
          city: profilePayload.city,
          state: profilePayload.state,
          avatar_url: profilePayload.avatar_url,
          cover_url: profilePayload.cover_url,
          public_phone: profilePayload.public_phone,
          booking_enabled: profilePayload.booking_enabled,
        })
        .eq('id', user.id)

      error = legacyUpdate.error
    }

    if (!error && isPremiumPlan) {
      const photoUpdate = await supabase
        .from('profiles')
        .update({
          photos: filledPhotos,
        })
        .eq('id', user.id)

      if (photoUpdate.error) {
        setPhotosSchemaReady(false)
        setSaving(false)
        setErrorMessage('Seus dados foram salvos, mas a galeria ainda precisa do schema novo no Supabase para funcionar.')
        return
      }

      setPhotosSchemaReady(true)
    }

    setSaving(false)

    if (error) {
      setErrorMessage('Não foi possível salvar o perfil. Tente novamente.')
      return
    }

    await refreshProfile()
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const updatePhoto = (index: number, value: string) => {
    setPhotos(current => current.map((photo, photoIndex) => (photoIndex === index ? value : photo)))
  }

  const addPhotoField = () => {
    setPhotos(current => (current.length >= 6 ? current : [...current, '']))
  }

  const removePhotoField = (index: number) => {
    setPhotos(current => {
      const next = current.filter((_, photoIndex) => photoIndex !== index)
      return next.length > 0 ? next : ['']
    })
  }

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    setPhotos(current => {
      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const setPrimaryPhoto = (index: number) => {
    movePhoto(index, 0)
  }

  const uploadPhoto = async (index: number, file?: File | null) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Escolha um arquivo de imagem valido para a galeria.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Cada foto deve ter no maximo 2 MB para manter o perfil leve.')
      return
    }

    try {
      setErrorMessage('')
      const dataUrl = await readFileAsDataUrl(file)
      if (!dataUrl) throw new Error('Imagem vazia.')
      updatePhoto(index, dataUrl)
    } catch {
      setErrorMessage('Não foi possível carregar essa imagem agora. Tente outra foto.')
    }
  }

  const uploadProfileImage = async (field: 'avatar_url' | 'cover_url', file?: File | null) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Escolha um arquivo de imagem valido.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Cada imagem deve ter no maximo 2 MB.')
      return
    }

    try {
      setErrorMessage('')
      const dataUrl = await readFileAsDataUrl(file)
      if (!dataUrl) throw new Error('Imagem vazia.')
      setForm(current => ({ ...current, [field]: dataUrl }))
    } catch {
      setErrorMessage('Não foi possível carregar essa imagem agora. Tente outra foto.')
    }
  }

  const handlePhotoDrop = (targetIndex: number) => {
    if (draggedPhotoIndex === null) return
    movePhoto(draggedPhotoIndex, targetIndex)
    setDraggedPhotoIndex(null)
  }

  const saveSchedule = async () => {
    if (!user) return

    const invalidDay = weekDays.find(day => schedule[day].active && schedule[day].start >= schedule[day].end)
    if (invalidDay) {
      setErrorMessage(`O horário de ${invalidDay} precisa terminar depois do início.`)
      return
    }

    setSavingSchedule(true)
    setErrorMessage('')

    const { error } = await supabase.from('profiles').update({ schedule }).eq('id', user.id)

    setSavingSchedule(false)

    if (error) {
      setErrorMessage('Não foi possível salvar os horários. Tente novamente.')
      return
    }

    setScheduleSaved(true)
    window.setTimeout(() => setScheduleSaved(false), 2000)
  }

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: <User size={16} /> },
    { id: 'horarios', label: 'Horários', icon: <Clock size={16} /> },
    { id: 'plano', label: 'Meu Plano', icon: <Shield size={16} /> },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="mt-0.5 text-sm text-slate-500">Gerencie seu perfil e preferências</p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl border border-slate-100 bg-white p-1 shadow-sm sm:w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => changeTab(tab.id as TabId)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : activeTab === 'perfil' ? (
        <div className="max-w-3xl rounded-2xl border border-slate-100 bg-white p-4 sm:p-6">
          <div className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
            <div className="relative h-36 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600">
              {form.cover_url && <img src={form.cover_url} alt="Banner do perfil" className="h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition-colors hover:bg-white">
                  <ImagePlus size={14} />
                  Upload banner
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={event => void uploadProfileImage('cover_url', event.target.files?.[0] ?? null)}
                  />
                </label>
                {form.cover_url && (
                  <button
                    type="button"
                    onClick={() => setForm(current => ({ ...current, cover_url: '' }))}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900/70 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-900"
                  >
                    <X size={14} />
                    Remover banner
                  </button>
                )}
              </div>
            </div>

            <div className="relative flex flex-col gap-4 px-5 pb-5 pt-0 sm:flex-row sm:items-end">
              <div className="-mt-10 flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-indigo-500 text-3xl font-bold text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)]">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Foto do perfil" className="h-full w-full object-cover" />
                ) : (
                  form.full_name[0]?.toUpperCase() ?? '?'
                )}
              </div>

              <div className="min-w-0 flex-1 pt-4 sm:pt-0">
                <div className="font-bold text-slate-900">{form.full_name || 'Seu nome'}</div>
                <div className="text-sm text-slate-500">{form.profession || 'Sua profissão'}</div>
                <div className={`mt-1 text-xs font-medium ${profile?.plan === 'free' ? 'text-slate-400' : 'text-amber-500'}`}>
                  {profile?.plan === 'pro' ? 'Plano PRO' : profile?.plan === 'business' ? 'Business' : 'Plano Gratuito'}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:pb-1">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                  <ImagePlus size={16} />
                  Upload foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={event => void uploadProfileImage('avatar_url', event.target.files?.[0] ?? null)}
                  />
                </label>
                {form.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setForm(current => ({ ...current, avatar_url: '' }))}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <X size={16} />
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Link da foto do perfil</label>
              <input value={form.avatar_url} onChange={event => setForm(current => ({ ...current, avatar_url: event.target.value }))} placeholder="https://sua-imagem.com/avatar.jpg" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Link do banner</label>
              <input value={form.cover_url} onChange={event => setForm(current => ({ ...current, cover_url: event.target.value }))} placeholder="https://sua-imagem.com/banner.jpg" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
              <input value={form.full_name} onChange={event => setForm(current => ({ ...current, full_name: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Profissão / Especialidade</label>
              <input value={form.profession} onChange={event => setForm(current => ({ ...current, profession: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Descrição</label>
              <textarea value={form.bio} onChange={event => setForm(current => ({ ...current, bio: event.target.value }))} rows={3} placeholder="Conte um pouco sobre você e seus serviços..." className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Cidade</label>
                <input value={form.city} onChange={event => setForm(current => ({ ...current, city: event.target.value }))} placeholder="São Paulo" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Estado</label>
                <input value={form.state} onChange={event => setForm(current => ({ ...current, state: event.target.value }))} placeholder="SP" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">WhatsApp</label>
              <input value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} placeholder="(11) 99999-0000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
            </div>

            <div className="space-y-3 pt-2">
              <ProfileBooleanToggle
                checked={form.public_phone}
                onToggle={() => setForm(current => ({ ...current, public_phone: !current.public_phone }))}
                label="Mostrar WhatsApp no perfil público"
                description="Quando ligado, visitantes do seu perfil poderão ver seu telefone."
              />
              <ProfileBooleanToggle
                checked={form.booking_enabled}
                onToggle={() => setForm(current => ({ ...current, booking_enabled: !current.booking_enabled }))}
                label="Aceitar novos agendamentos online"
                description="Desligue se quiser pausar o link público sem apagar seu perfil."
              />
              <ProfileBooleanToggle
                checked={form.booking_requires_confirmation}
                onToggle={() => setForm(current => ({ ...current, booking_requires_confirmation: !current.booking_requires_confirmation }))}
                label="Pedir minha confirmação antes de fechar"
                description={form.booking_requires_confirmation
                  ? 'Quando ligado, novos agendamentos entram como pedido e você confirma depois.'
                  : 'Quando desligado, novos agendamentos entram confirmados automaticamente.'}
              />
            </div>

            <div className="pt-2">
              {isPremiumPlan ? (
                <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                        <ImagePlus size={14} />
                        Galeria do perfil
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-slate-900">Mostre melhor seu trabalho no perfil público</h3>
                      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                        Escolha fotos do seu computador ou cole um link de imagem. Essas fotos aparecem na aba "Fotos" do seu perfil público.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
                      <span className="font-semibold text-slate-900">{filledPhotos.length}</span> foto{filledPhotos.length === 1 ? '' : 's'} pronta{filledPhotos.length === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {!photosSchemaReady && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                        As fotos ainda não estão sendo guardadas no banco deste projeto. Para elas continuarem salvas depois, aplique a coluna <span className="font-semibold">photos</span> e a view atualizada do arquivo <span className="font-semibold">supabase-schema.sql</span>.
                      </div>
                    )}

                    {photos.map((photo, index) => (
                      <div
                        key={`${index}-${photo}`}
                        draggable={Boolean(photo.trim())}
                        onDragStart={() => setDraggedPhotoIndex(index)}
                        onDragOver={event => event.preventDefault()}
                        onDragEnd={() => setDraggedPhotoIndex(null)}
                        onDrop={() => handlePhotoDrop(index)}
                        className={`rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm ring-1 ring-indigo-100 transition-all ${draggedPhotoIndex === index ? 'opacity-70 ring-2 ring-indigo-300' : ''}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                            <ImagePlus size={16} />
                            Fazer upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={event => void uploadPhoto(index, event.target.files?.[0] ?? null)}
                            />
                          </label>

                          <input
                            value={photo}
                            onChange={event => updatePhoto(index, event.target.value)}
                            placeholder="Ou cole um link de imagem"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                          />

                          <button
                            type="button"
                            onClick={() => removePhotoField(index)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                            aria-label={`Remover foto ${index + 1}`}
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {photo.trim() && (
                          <>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {index === 0 ? (
                                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                  <Star size={12} />
                                  Foto principal
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryPhoto(index)}
                                  className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50"
                                >
                                  <Star size={12} />
                                  Definir principal
                                </button>
                              )}

                              <span className="text-xs text-slate-400">
                                Arraste para reorganizar a ordem da galeria
                              </span>
                            </div>

                            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                              <img src={photo} alt={`Preview da foto ${index + 1}`} className="h-40 w-full object-cover" />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs leading-5 text-slate-500">
                      Use imagens do seu espaco, resultados, ambiente ou atendimento. Para manter a tela leve, cada upload aceita ate 2 MB.
                    </p>
                    <button
                      type="button"
                      onClick={addPhotoField}
                      disabled={photos.length >= 6}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ImagePlus size={16} />
                      Adicionar foto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                        <Lock size={14} />
                        Galeria exclusiva do plano pago
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-slate-900">Mostre seu trabalho com mais impacto</h3>
                      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
            No Pro e no Business você libera a aba de fotos no perfil público e consegue mostrar melhor seu ambiente, resultados e estilo de atendimento.
                      </p>
                    </div>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Ver plano com galeria
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => void saveProfile()} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-70">
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {profileStatusText}
          </button>
        </div>
      ) : activeTab === 'horarios' ? (
        <div className="max-w-2xl rounded-2xl border border-slate-100 bg-white p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
            <h3 className="font-bold text-slate-900">Horários de funcionamento</h3>
            <p className="mt-1 text-sm text-slate-500">Ajuste os dias e horários em que seu agendamento fica disponível.</p>
            </div>
            <div className="hidden rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 sm:block">
              Liga e desliga com um toque
            </div>
          </div>
          <div className="space-y-3">
            {weekDays.map(day => (
              <div key={day} className={`flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3 transition-colors ${schedule[day].active ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-200 bg-slate-50'}`}>
                <ScheduleToggle
                  checked={schedule[day].active}
                  onToggle={() => setSchedule(current => ({ ...current, [day]: { ...current[day], active: !current[day].active } }))}
                label={`Alternar horário de ${day}`}
                />
                <span className={`w-20 text-sm font-semibold ${schedule[day].active ? 'text-slate-900' : 'text-slate-400'}`}>{weekDayLabels[day] ?? day}</span>
                {schedule[day].active ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="time" value={schedule[day].start} onChange={event => setSchedule(current => ({ ...current, [day]: { ...current[day], start: event.target.value } }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-400" />
                    <span className="text-sm font-medium text-slate-400">até</span>
                    <input type="time" value={schedule[day].end} onChange={event => setSchedule(current => ({ ...current, [day]: { ...current[day], end: event.target.value } }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-400" />
                  </div>
                ) : (
                  <span className="text-sm font-medium italic text-slate-400">Fechado</span>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => void saveSchedule()} disabled={savingSchedule} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-70">
            {savingSchedule ? <Loader2 size={14} className="animate-spin" /> : scheduleSaved ? <Check size={14} /> : <Save size={14} />}
              {scheduleSaved ? 'Horários salvos!' : savingSchedule ? 'Salvando...' : 'Salvar horários'}
          </button>
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className={`mb-6 rounded-2xl p-6 text-white ${profile?.plan === 'free' ? 'bg-gradient-to-r from-slate-600 to-slate-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-sm text-indigo-200">Plano atual</div>
                <div className="text-2xl font-bold">
                  {profile?.plan === 'pro' ? 'PRO' : profile?.plan === 'business' ? 'Business' : 'Gratuito'}
                </div>
                {profile?.plan === 'free' && <div className="mt-1 text-sm text-slate-200">Ideal para começar, publicar seu perfil e usar o fluxo principal do app.</div>}
            {profile?.plan === 'pro' && <div className="mt-1 text-sm text-indigo-100">Plano com mais destaque visual e galeria de fotos no perfil público.</div>}
                {profile?.plan === 'business' && <div className="mt-1 text-sm text-indigo-100">Conta posicionada no plano mais alto atual, com prioridade maior e galeria liberada no perfil.</div>}
              </div>
              <Shield size={40} className="text-white/30" />
            </div>
          </div>
          {profile?.plan === 'free' ? (
            <div className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(135deg,_#f8fbff_0%,_#eef2ff_45%,_#ffffff_100%)] p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-200/40 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-violet-200/30 blur-2xl" />

              <div className="relative">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                  <Sparkles size={14} />
                  Upgrade para parecer mais profissional
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-3xl font-black tracking-tight text-slate-900">Plano Pro</h3>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        Recomendado
                      </span>
                    </div>

                    <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Seu perfil já funciona no gratuito. O Pro entra quando você quer passar mais confiança, mostrar melhor seu trabalho e aparecer com mais destaque para quem está escolhendo um profissional.
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Hoje no gratuito</div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="mb-3 h-20 rounded-xl bg-slate-200" />
                          <div className="-mt-8 flex items-end gap-3">
                            <div className="h-12 w-12 rounded-xl border-4 border-white bg-slate-300 shadow-sm" />
                            <div className="pb-1 text-sm font-semibold text-slate-700">Perfil basico</div>
                          </div>
                          <div className="mt-3 text-xs leading-5 text-slate-500">
                            Agenda funcionando, mas com menos destaque visual.
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-indigo-200 bg-[linear-gradient(180deg,_rgba(99,102,241,0.08)_0%,_rgba(139,92,246,0.05)_100%)] p-4">
                        <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Com o Pro</div>
                        <div className="rounded-2xl border border-indigo-200 bg-white p-4">
                          <div className="mb-3 flex h-20 items-end rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 p-2">
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-amber-700">PRO</span>
                          </div>
                          <div className="-mt-8 flex items-end gap-3">
                            <div className="h-12 w-12 rounded-xl border-4 border-white bg-indigo-500 shadow-lg" />
                            <div className="pb-1 text-sm font-semibold text-slate-900">Perfil com mais impacto</div>
                          </div>
                          <div className="mt-3 text-xs leading-5 text-slate-600">
                            Mais destaque, mais confianca e galeria para mostrar seu trabalho.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {[
                    'Selo PRO no perfil público',
                        'Selo PRO nos cards do marketplace',
                        'Prioridade sobre contas gratuitas no marketplace',
                    'Galeria de fotos no perfil público',
                        'Seu perfil fica mais forte no primeiro clique',
                    'Mesmo fluxo do app sem perder o que você já configurou',
                      ].map(benefit => (
                        <div key={benefit} className="flex items-start gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-indigo-100">
                          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <Check size={14} />
                          </div>
                          <span className="text-sm font-medium leading-5 text-slate-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_20px_50px_rgba(99,102,241,0.12)] backdrop-blur">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-500">O que muda no Pro</div>
                      <Star size={16} className="text-amber-500" />
                    </div>

                    <div className="mb-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-white">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">Upgrade</div>
                      <div className="mt-1 text-2xl font-black">Seu perfil mais profissional</div>
                      <div className="mt-1 text-sm text-indigo-100">Ideal para quem quer mostrar melhor o trabalho e deixar o perfil mais forte dentro do AgendaPro.</div>
                    </div>

                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-indigo-500" />
                        <span>Seu perfil passa a mostrar mais autoridade logo no primeiro clique.</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-indigo-500" />
                    <span>Você mantém a mesma base de agenda, clientes, marketing e relatórios que já conhece.</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-indigo-500" />
                    <span>Agora você também pode montar uma galeria com fotos para ajudar o cliente a confiar antes de agendar.</span>
                      </div>
                    </div>

                    <Link
                      to="/pricing"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
                    >
                      Quero destacar meu perfil
                      <ArrowRight size={16} />
                    </Link>

                    <p className="mt-3 text-center text-xs text-slate-400">
                      Quando o gratuito ja estiver funcionando, o Pro entra para deixar seu perfil mais forte e mais facil de escolher.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white p-6">
              <h3 className="mb-4 font-bold text-slate-900">O que seu plano representa hoje</h3>
              <div className="space-y-2">
                {(
                  profile?.plan === 'business'
                    ? [
                        'Tudo o que ja existe no Pro',
                        'Conta marcada como Business no sistema',
                    'Upgrade Business contabilizado nas indicações',
                        'Prioridade premium no marketplace',
                    'Galeria de fotos liberada no perfil público',
                    'Mesma base atual de agenda, marketing e relatórios',
                        'Plano mais alto disponivel hoje dentro do produto',
                      ]
                    : [
                        'Conta marcada como Pro no sistema',
                    'Selo PRO no perfil público',
                        'Selo PRO exibido no marketplace',
                    'Galeria de fotos liberada no perfil público',
                    'Plano pago reconhecido nas indicações',
                    'Mesmo fluxo atual de agenda, marketing e relatórios',
                      ]
                ).map(benefit => (
                  <div key={benefit} className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <span className="text-xs text-green-600">✓</span>
                    </div>
                    {benefit}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                {profile?.plan === 'business'
                  ? 'Os recursos exclusivos de equipe do Business ainda estao em evolucao, mas sua conta ja fica no nivel mais alto disponivel hoje dentro do produto.'
                  : 'Hoje o Pro reforça a apresentação do seu perfil dentro da plataforma e ainda libera a galeria de fotos do perfil público.'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
