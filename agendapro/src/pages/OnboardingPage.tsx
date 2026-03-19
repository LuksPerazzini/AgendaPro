import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Plus, Trash2, Clock, Zap, Loader2, AlertCircle } from 'lucide-react'
import { categories } from '../data/mockData'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ReferralNotice from '../components/ReferralNotice'

const selectableCategories = [...categories, { id: 'outros', name: 'Outros', icon: '🧰', count: 0 }]

const steps = [
  { id: 1, title: 'Seu negocio', desc: 'Dados basicos do perfil' },
  { id: 2, title: 'Seus servicos', desc: 'O que voce oferece' },
  { id: 3, title: 'Seus horarios', desc: 'Quando voce atende' },
  { id: 4, title: 'Pronto!', desc: 'Seu perfil esta no ar' },
]

const weekDays = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo']

type OnboardingProfileDraft = {
  name: string
  category: string
  specialty: string
  city: string
  state: string
  phone: string
  description: string
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, profile: authProfile, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [prefillReady, setPrefillReady] = useState(false)

  const [profile, setProfile] = useState<OnboardingProfileDraft>({
    name: '',
    category: '',
    specialty: '',
    city: '',
    state: '',
    phone: '',
    description: '',
  })
  const [services, setServices] = useState([
    { id: '1', name: '', duration: '60', price: '', description: '' },
  ])
  const [schedule, setSchedule] = useState(
    Object.fromEntries(weekDays.map(day => [day, { active: day !== 'Domingo', start: '08:00', end: '18:00' }]))
  )

  useEffect(() => {
    if (!user || prefillReady) return

    let ignore = false

    const loadDraft = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, profession, bio, city, state, phone')
        .eq('id', user.id)
        .maybeSingle()

      if (!data || ignore) {
        if (!ignore) setPrefillReady(true)
        return
      }

      const matchedCategory = categories.find(category =>
        data.profession === category.name || data.profession?.startsWith(`${category.name} - `)
      )?.id ?? ''
      const fallbackSpecialty = matchedCategory
        ? data.profession.replace(`${categories.find(category => category.id === matchedCategory)?.name} - `, '')
        : data.profession && data.profession !== 'Profissional'
          ? data.profession
          : ''

      setProfile(current => ({
        ...current,
        name: current.name || data.full_name || authProfile?.full_name || '',
        category: current.category || (matchedCategory || (fallbackSpecialty ? 'outros' : '')),
        specialty: current.specialty || fallbackSpecialty,
        city: current.city || data.city || '',
        state: current.state || data.state || '',
        phone: current.phone || data.phone || authProfile?.phone || '',
        description: current.description || data.bio || '',
      }))

      setPrefillReady(true)
    }

    void loadDraft()

    return () => {
      ignore = true
    }
  }, [authProfile?.full_name, authProfile?.phone, prefillReady, user])

  const addService = () =>
    setServices([...services, { id: Date.now().toString(), name: '', duration: '60', price: '', description: '' }])

  const removeService = (id: string) => setServices(services.filter(service => service.id !== id))
  const updateService = (id: string, key: string, value: string) =>
    setServices(services.map(service => service.id === id ? { ...service, [key]: value } : service))

  const progress = ((step - 1) / 3) * 100

  const saveStep1 = async () => {
    if (!user) return

    setSaving(true)
    setError('')

    const profession = profile.category === 'outros'
      ? profile.specialty.trim()
      : selectableCategories.find(category => category.id === profile.category)?.name ?? profile.category
    const fullProfession = profile.category === 'outros'
      ? profession
      : profile.specialty.trim()
      ? `${profession} - ${profile.specialty.trim()}`
      : profession

    const { error: saveError } = await supabase
      .from('profiles')
      .update({
        full_name: profile.name.trim(),
        profession: fullProfession,
        bio: profile.description.trim() || null,
        phone: profile.phone.trim(),
        city: profile.city.trim(),
        state: profile.state.trim().toUpperCase() || null,
      })
      .eq('id', user.id)

    setSaving(false)

    if (saveError) {
      setError('Erro ao salvar seu perfil. Tente novamente.')
      return
    }

    await refreshProfile()
    setStep(2)
  }

  const saveStep2 = async () => {
    if (!user) return

    setSaving(true)
    setError('')

    const validServices = services.filter(service => service.name.trim() && service.price)
    if (validServices.length === 0) {
      setError('Adicione pelo menos um servico com nome e preco.')
      setSaving(false)
      return
    }

    const { error: saveError } = await supabase.from('services').insert(
      validServices.map(service => ({
        profile_id: user.id,
        name: service.name.trim(),
        description: service.description.trim() || null,
        price: parseFloat(service.price) || 0,
        duration_minutes: parseInt(service.duration, 10) || 60,
        active: true,
      }))
    )

    setSaving(false)

    if (saveError) {
      setError('Erro ao salvar seus servicos.')
      return
    }

    setStep(3)
  }

  const saveStep3 = async () => {
    if (!user) return

    setSaving(true)
    setError('')

    const { error: saveError } = await supabase
      .from('profiles')
      .update({ schedule })
      .eq('id', user.id)

    setSaving(false)

    if (saveError) {
      setError('Erro ao salvar seus horarios.')
      return
    }

    setStep(4)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">AgendaPro</span>
        </div>
        <span className="text-sm text-slate-500">Configuracao · {step} de 4</span>
      </div>
      <div className="h-1.5 bg-slate-200">
        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto flex-1 w-full max-w-2xl px-4 py-8">
        <ReferralNotice />

        <div className="mb-10 flex items-center justify-center gap-2">
          {steps.map((currentStep, index) => (
            <div key={currentStep.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${step === currentStep.id ? 'bg-indigo-600 text-white' : step > currentStep.id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                {step > currentStep.id ? <CheckCircle size={12} /> : <span>{currentStep.id}</span>}
                <span className="hidden sm:inline">{currentStep.title}</span>
              </div>
              {index < steps.length - 1 && <div className={`h-0.5 w-6 ${step > currentStep.id ? 'bg-green-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {step === 1 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-2xl font-bold text-slate-900">Conte sobre seu negocio</h2>
            <p className="mb-6 text-sm text-slate-500">Essas informacoes aparecem no seu perfil publico e ja deixei os campos preenchidos com o que voce acabou de cadastrar.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome profissional / negocio *</label>
                <input value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} placeholder="Ex: Joao Silva ou Barbearia do Joao" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Categoria *</label>
                <select value={profile.category} onChange={event => setProfile({ ...profile, category: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400">
                  <option value="">Selecione...</option>
                  {selectableCategories.map(category => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{profile.category === 'outros' ? 'Qual e a sua area?' : 'Especialidade'}</label>
                <input value={profile.specialty} onChange={event => setProfile({ ...profile, specialty: event.target.value })} placeholder={profile.category === 'outros' ? 'Ex: advogado, tatuador, fotografo...' : 'Ex: cortes modernos e barba'} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Cidade *</label>
                <input value={profile.city} onChange={event => setProfile({ ...profile, city: event.target.value })} placeholder="Sao Paulo" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Estado</label>
                <input value={profile.state} onChange={event => setProfile({ ...profile, state: event.target.value })} placeholder="SP" maxLength={2} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-indigo-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">WhatsApp *</label>
                <input value={profile.phone} onChange={event => setProfile({ ...profile, phone: event.target.value })} placeholder="(11) 99999-0000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Descricao do seu trabalho</label>
                <textarea value={profile.description} onChange={event => setProfile({ ...profile, description: event.target.value })} placeholder="Sua experiencia, diferenciais e o que faz seu atendimento ser especial..." rows={3} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
            </div>
            <button
              onClick={saveStep1}
              disabled={!profile.name || !profile.category || !profile.city || !profile.phone || (profile.category === 'outros' && !profile.specialty.trim()) || saving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {saving ? 'Salvando...' : 'Proximo: meus servicos'} {!saving && <ArrowRight size={18} />}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-2xl font-bold text-slate-900">Quais servicos voce oferece?</h2>
            <p className="mb-6 text-sm text-slate-500">Adicione pelo menos 1 servico para ativar seu agendamento online.</p>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={service.id} className="rounded-xl border-2 border-slate-100 p-4 transition-colors hover:border-indigo-100">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Servico {index + 1}</span>
                    {services.length > 1 && (
                      <button onClick={() => removeService(service.id)} className="rounded-lg p-1 text-rose-400 transition-colors hover:bg-rose-50">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <input value={service.name} onChange={event => updateService(service.id, 'name', event.target.value)} placeholder="Nome do servico (ex: corte masculino) *" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                    </div>
                    <div className="sm:col-span-2">
                      <input value={service.description} onChange={event => updateService(service.id, 'description', event.target.value)} placeholder="Descricao breve (opcional)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500"><Clock size={10} /> Duracao</label>
                      <select value={service.duration} onChange={event => updateService(service.id, 'duration', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400">
                        {['15', '30', '45', '60', '90', '120', '180', '240'].map(duration => <option key={duration} value={duration}>{duration} min</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Preco (R$) *</label>
                      <input type="number" value={service.price} onChange={event => updateService(service.id, 'price', event.target.value)} placeholder="50" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addService} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600">
              <Plus size={16} /> Adicionar outro servico
            </button>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50">Voltar</button>
              <button
                onClick={saveStep2}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? 'Salvando...' : <>Proximo: horarios <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-2xl font-bold text-slate-900">Quando voce atende?</h2>
            <p className="mb-6 text-sm text-slate-500">Defina os horarios que vao aparecer para seus clientes.</p>
            <div className="space-y-3">
              {weekDays.map(day => {
                const daySchedule = schedule[day]
                return (
                  <div key={day} className={`flex items-center gap-4 rounded-xl p-3 transition-colors ${daySchedule.active ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                    <button
                      onClick={() => setSchedule(current => ({ ...current, [day]: { ...current[day], active: !current[day].active } }))}
                      className={`relative flex h-5 w-10 flex-shrink-0 rounded-full transition-colors ${daySchedule.active ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${daySchedule.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className={`w-16 flex-shrink-0 text-sm font-medium ${daySchedule.active ? 'text-slate-900' : 'text-slate-400'}`}>{day}</span>
                    {daySchedule.active ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input type="time" value={daySchedule.start} onChange={event => setSchedule(current => ({ ...current, [day]: { ...current[day], start: event.target.value } }))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-400" />
                        <span className="text-sm text-slate-400">ate</span>
                        <input type="time" value={daySchedule.end} onChange={event => setSchedule(current => ({ ...current, [day]: { ...current[day], end: event.target.value } }))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-400" />
                      </div>
                    ) : (
                      <span className="text-sm italic text-slate-400">Fechado</span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50">Voltar</button>
              <button
                onClick={saveStep3}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? 'Salvando...' : <>Finalizar <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h2 className="mb-2 text-3xl font-bold text-slate-900">Seu perfil esta no ar!</h2>
            <p className="mb-8 text-slate-500">Agora seus clientes podem te encontrar e agendar online.</p>
            <div className="mb-6 rounded-2xl bg-indigo-50 p-5 text-left">
              <div className="mb-3 text-sm font-bold text-indigo-700">Proximos passos:</div>
              <div className="space-y-2">
                {[
                  'Compartilhe seu link no Instagram e WhatsApp',
                  'Peca para clientes atuais avaliarem voce',
                  'Personalize seu perfil com foto e banner',
                  'Use a central manual de WhatsApp para enviar mensagens prontas',
                ].map((tip, index) => (
                  <div key={tip} className="flex items-start gap-2 text-sm text-indigo-800">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold">{index + 1}</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-bold text-white transition-colors hover:bg-indigo-700"
            >
              Ir para meu painel <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
