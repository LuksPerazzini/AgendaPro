import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Eye, EyeOff, Loader2, Search, Shield, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type ManagedProfile = {
  id: string
  full_name: string
  profession: string
  slug: string
  plan: 'free' | 'pro' | 'business'
  role: 'user' | 'admin'
  booking_enabled: boolean
  created_at: string
}

const planLabel: Record<ManagedProfile['plan'], string> = {
  free: 'Gratuito',
  pro: 'PRO',
  business: 'Business',
}

export default function DashboardAdminContas() {
  const { isAdmin, user } = useAuth()
  const [profiles, setProfiles] = useState<ManagedProfile[]>([])
  const [loading, setLoading] = useState(() => Boolean(user && isAdmin))
  const [search, setSearch] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !isAdmin) return

    let ignore = false

    const loadProfiles = async () => {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, profession, slug, plan, role, booking_enabled, created_at')
        .order('created_at', { ascending: false })

      if (ignore) return

      if (error) {
        setErrorMessage('Não foi possível carregar as contas agora.')
        setProfiles([])
        setLoading(false)
        return
      }

      setProfiles((data as ManagedProfile[] | null) ?? [])
      setLoading(false)
    }

    void loadProfiles()

    return () => {
      ignore = true
    }
  }, [isAdmin, user])

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return profiles

    return profiles.filter(profile =>
      profile.full_name.toLowerCase().includes(term) ||
      profile.profession.toLowerCase().includes(term) ||
      profile.slug.toLowerCase().includes(term),
    )
  }, [profiles, search])

  const stats = useMemo(() => {
    const professionals = profiles.filter(profile => profile.role !== 'admin')
    return {
      total: professionals.length,
      active: professionals.filter(profile => profile.booking_enabled).length,
      hidden: professionals.filter(profile => !profile.booking_enabled).length,
      admins: profiles.filter(profile => profile.role === 'admin').length,
    }
  }, [profiles])

  const toggleMarketplaceVisibility = async (profile: ManagedProfile) => {
    setActionId(profile.id)
    setErrorMessage('')

    const nextValue = !profile.booking_enabled
    const previous = profiles

    setProfiles(current =>
      current.map(item => item.id === profile.id ? { ...item, booking_enabled: nextValue } : item),
    )

    const { error } = await supabase
      .from('profiles')
      .update({ booking_enabled: nextValue })
      .eq('id', profile.id)

    setActionId(null)

    if (error) {
      setProfiles(previous)
      setErrorMessage('Não foi possível atualizar a visibilidade dessa conta no marketplace.')
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle size={16} />
            Área restrita
          </div>
          <p className="mt-2 text-sm">
            Esta tela está disponível apenas para contas com papel de administrador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Shield size={20} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Gestão de contas</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Veja os perfis cadastrados e controle quem aparece em Encontrar profissionais.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Profissionais', value: stats.total },
          { label: 'Perfis visíveis', value: stats.active },
          { label: 'Perfis ocultos', value: stats.hidden },
          { label: 'Admins', value: stats.admins },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="text-2xl font-bold text-slate-900">{loading ? '-' : card.value}</div>
            <div className="mt-1 text-sm text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar por nome, profissão ou slug..."
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Ocultar um perfil remove essa conta do marketplace sem apagar dados, histórico ou serviços.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <UserRound size={36} className="mx-auto mb-3" />
            <p className="font-medium">Nenhuma conta encontrada</p>
            <p className="mt-1 text-sm">Ajuste a busca para ver outros perfis cadastrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredProfiles.map(profile => {
              const isSelf = profile.id === user?.id
              const isHidden = !profile.booking_enabled
              const isAdminProfile = profile.role === 'admin'

              return (
                <div key={profile.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-base font-semibold text-slate-900">{profile.full_name}</div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isAdminProfile ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                        {isAdminProfile ? 'Admin' : planLabel[profile.plan]}
                      </span>
                      {isSelf && (
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          Sua conta
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {profile.profession || 'Profissional'} · /professional/{profile.slug}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Criado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isHidden ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isHidden ? 'Oculto do marketplace' : 'Visível no marketplace'}
                    </span>
                    {!isAdminProfile && (
                      <button
                        type="button"
                        onClick={() => void toggleMarketplaceVisibility(profile)}
                        disabled={actionId === profile.id}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                          isHidden
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {actionId === profile.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isHidden ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} />
                        )}
                        {isHidden ? 'Reativar perfil' : 'Ocultar do marketplace'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
