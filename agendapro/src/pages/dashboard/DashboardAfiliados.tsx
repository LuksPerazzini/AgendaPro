import { useEffect, useMemo, useState } from 'react'
import { Copy, Share2, Gift, Users, DollarSign, CheckCircle, Loader2, AlertCircle, TrendingUp, Clock3 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getReferralsForProfile, type ReferralRecord } from '../../lib/referrals'

export default function DashboardAfiliados() {
  const { user, profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [referrals, setReferrals] = useState<ReferralRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [legacyMode, setLegacyMode] = useState(false)

  const publicBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://agendapro-azure.vercel.app')
  const referralLink = profile?.slug ? `${publicBaseUrl}/register?ref=${profile.slug}` : ''

  useEffect(() => {
    if (!user || !profile) return

    let ignore = false

    const load = async () => {
      setLoading(true)
      setErrorMessage('')

      if (ignore) return

      try {
        const result = await getReferralsForProfile(profile.id, profile.slug)
        if (ignore) return

        setReferrals(result.records)
        setLegacyMode(result.mode === 'legacy')
        setLoading(false)
      } catch {
        if (ignore) return

        setErrorMessage('Não foi possível carregar suas indicações agora.')
        setLoading(false)
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [user, profile])

  const summary = useMemo(() => {
    const conversions = referrals.filter(referral => referral.status === 'converted')
    const thisMonth = referrals.filter(referral => {
      const createdAt = new Date(referral.created_at)
      const now = new Date()
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
    })
    const businessCount = conversions.filter(referral => referral.converted_plan === 'business').length
    const proCount = conversions.filter(referral => referral.converted_plan === 'pro').length
    const conversionRate = referrals.length > 0 ? Math.round((conversions.length / referrals.length) * 100) : 0
    const totalCredits = conversions.reduce((sum, referral) => sum + referral.credit_amount, 0)

    return {
      total: referrals.length,
      conversions: conversions.length,
      proCount,
      businessCount,
      thisMonth: thisMonth.length,
      conversionRate,
      totalCredits,
    }
  }, [referrals])

  const handleCopy = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    if (!referralLink) return
    const text = encodeURIComponent(
      `Conheco uma plataforma muito boa para organizar agendamentos.\n\nCrie sua conta por este link: ${referralLink}`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const stats = [
    { label: 'Indicações registradas', value: loading ? '-' : summary.total, icon: <Users size={20} className="text-indigo-600" />, bg: 'bg-indigo-50' },
    { label: 'Conversões pagas', value: loading ? '-' : summary.conversions, icon: <CheckCircle size={20} className="text-green-600" />, bg: 'bg-green-50' },
    { label: 'Créditos acumulados', value: loading ? '-' : `R$${summary.totalCredits.toLocaleString('pt-BR')}`, icon: <DollarSign size={20} className="text-amber-600" />, bg: 'bg-amber-50' },
    { label: 'Taxa de conversão', value: loading ? '-' : `${summary.conversionRate}%`, icon: <TrendingUp size={20} className="text-purple-600" />, bg: 'bg-purple-50' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Programa de Indicação</h1>
        <p className="mt-0.5 text-sm text-slate-500">Acompanhe cadastros e conversões reais do seu link</p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white md:p-8">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 text-4xl">💰</div>
            <h2 className="mb-2 text-2xl font-bold">Seu link de indicação está ativo</h2>
            <p className="mb-4 text-indigo-100">
              Toda conta criada com esse link passa por validação e fica registrada na tabela de indicações. Quando o indicado ativa um plano pago, os créditos reais entram aqui automaticamente.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: 'Novas este mês', value: loading ? '-' : String(summary.thisMonth) },
                { label: 'Planos Pro', value: loading ? '-' : String(summary.proCount) },
                { label: 'Planos Business', value: loading ? '-' : String(summary.businessCount) },
              ].map(tier => (
                <div key={tier.label} className="rounded-xl bg-white/10 px-3 py-2 text-center">
                  <div className="text-lg font-bold text-amber-300">{tier.value}</div>
                  <div className="text-xs text-indigo-200">{tier.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5">
            <div className="mb-2 text-sm font-medium text-indigo-200">Seu link de indicação</div>
            <div className="mb-3 truncate rounded-xl bg-white/10 px-4 py-3 font-mono text-sm">
              {referralLink || 'Carregando...'}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} disabled={!referralLink} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-50">
                <Copy size={14} /> {copied ? 'Copiado!' : 'Copiar link'}
              </button>
              <button onClick={handleWhatsApp} disabled={!referralLink} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-50">
                <Share2 size={14} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="mt-0.5 text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-bold text-slate-900">Histórico de indicações</h3>
            <p className="mt-1 text-sm text-slate-500">Cada linha representa uma indicação validada no banco</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-10 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Gift size={36} className="mx-auto mb-3" />
              <p className="font-medium">Nenhuma indicação ainda</p>
              <p className="mt-1 text-sm">Compartilhe seu link para começar a acompanhar novas contas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {referrals.map(referral => {
                const isConverted = referral.status === 'converted'
                return (
                  <div key={referral.id} className="flex items-center gap-4 p-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                      {referral.full_name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900">{referral.full_name}</div>
                      <div className="text-xs text-slate-500">
                        {referral.profession || 'Profissional'} · {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${isConverted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isConverted ? `Plano ${referral.converted_plan}` : 'Cadastro registrado'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isConverted ? `Credito R$${referral.credit_amount.toLocaleString('pt-BR')}` : 'Aguardando upgrade'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <h3 className="mb-5 font-bold text-slate-900">Como funciona</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">1</div>
              <div>
                <div className="font-medium text-slate-900">A pessoa entra pelo seu link</div>
                <div className="text-sm text-slate-500">Quando alguém cria a conta usando o seu link, o sistema reconhece que essa pessoa veio pela sua indicação.</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">2</div>
              <div>
                <div className="font-medium text-slate-900">A indicação fica registrada</div>
                <div className="text-sm text-slate-500">Assim que o cadastro é concluído, essa nova conta passa a aparecer no seu histórico de indicações.</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">3</div>
              <div>
                <div className="font-medium text-slate-900">Se virar cliente pagante, conta para você</div>
                <div className="text-sm text-slate-500">Se essa pessoa fizer upgrade para um plano pago, a indicação passa a contar como conversão.</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">4</div>
              <div>
                <div className="font-medium text-slate-900">Você acompanha tudo por aqui</div>
                <div className="text-sm text-slate-500">Nesta tela você vê quantas pessoas entraram pelo seu link, quantas viraram clientes pagantes e quanto isso gerou para você.</div>
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="mb-1 flex items-center gap-2 font-medium text-slate-800">
              <Clock3 size={14} /> Importante
            </div>
            {legacyMode
              ? <>As suas indicações continuam sendo contabilizadas normalmente, mesmo com a versão atual do sistema.</>
              : <>Os números desta tela são atualizados automaticamente conforme novas contas entram pelo seu link e fazem upgrade.</>}
          </div>
        </div>
      </div>
    </div>
  )
}
