import { useState, useEffect } from 'react'
import { Copy, Share2, Gift, Users, DollarSign, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type Referral = {
  id: string
  full_name: string
  plan: string
  created_at: string
}

export default function DashboardAfiliados() {
  const { user, profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  const referralLink = profile?.slug
    ? `https://agendapro-azure.vercel.app/register?ref=${profile.slug}`
    : ''

  useEffect(() => {
    if (!user || !profile) return
    const load = async () => {
      setLoading(true)
      // Busca usuários que se cadastraram com o ref deste perfil (slug)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, plan, created_at')
        .eq('referred_by', profile.slug)
        .order('created_at', { ascending: false })
      if (data) setReferrals(data as Referral[])
      setLoading(false)
    }
    load()
  }, [user, profile])

  const conversions = referrals.filter(r => r.plan !== 'free').length
  const creditsEarned = conversions * 25
  const nextThreshold = Math.ceil((conversions + 1) / 5) * 5
  const creditsToNext = (nextThreshold - conversions) * 25

  const handleCopy = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`🚀 Conheço uma plataforma incrível para organizar seus agendamentos!\n\nCrie sua conta grátis em: ${referralLink}\n\n✅ Você ainda ganha 14 dias do Pro de graça!`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const stats = [
    { label: 'Indicações feitas', value: loading ? '—' : referrals.length, icon: <Users size={20} className="text-indigo-600" />, bg: 'bg-indigo-50' },
    { label: 'Conversões Pro', value: loading ? '—' : conversions, icon: <CheckCircle size={20} className="text-green-600" />, bg: 'bg-green-50' },
    { label: 'Créditos ganhos', value: loading ? '—' : `R$${creditsEarned}`, icon: <DollarSign size={20} className="text-amber-600" />, bg: 'bg-amber-50' },
    { label: 'Para próximo prêmio', value: loading ? '—' : `R$${creditsToNext}`, icon: <Gift size={20} className="text-purple-600" />, bg: 'bg-purple-50' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Programa de Indicação</h1>
        <p className="text-slate-500 text-sm mt-0.5">Indique amigos e ganhe R$25 para cada assinatura Pro</p>
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 md:p-8 text-white mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-4xl mb-3">💰</div>
            <h2 className="text-2xl font-bold mb-2">Ganhe R$25 por indicação</h2>
            <p className="text-indigo-100 mb-4">
              Para cada profissional que você indicar e assinar o plano Pro, você recebe R$25 de crédito.
              Sem limite de indicações.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { label: '1 indicação', value: 'R$25' },
                { label: '5 indicações', value: 'R$125' },
                { label: '10 indicações', value: 'R$250' },
              ].map(t => (
                <div key={t.label} className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <div className="font-bold text-amber-300 text-lg">{t.value}</div>
                  <div className="text-indigo-200 text-xs">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-5">
            <div className="text-sm font-medium text-indigo-200 mb-2">Seu link de indicação</div>
            <div className="bg-white/10 rounded-xl px-4 py-3 text-sm font-mono mb-3 truncate">
              {referralLink || 'Carregando...'}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} disabled={!referralLink}
                className="flex-1 bg-white text-indigo-700 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors disabled:opacity-50">
                <Copy size={14} /> {copied ? 'Copiado!' : 'Copiar link'}
              </button>
              <button onClick={handleWhatsApp} disabled={!referralLink}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50">
                <Share2 size={14} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* History */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Histórico de indicações</h3>
          </div>

          {loading ? (
            <div className="p-10 flex items-center justify-center text-slate-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Gift size={36} className="mx-auto mb-3" />
              <p className="font-medium">Nenhuma indicação ainda</p>
              <p className="text-sm mt-1">Compartilhe seu link para começar a ganhar</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {referrals.map(r => {
                const isPro = r.plan !== 'free'
                return (
                  <div key={r.id} className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 flex-shrink-0">
                      {r.full_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm">{r.full_name}</div>
                      <div className="text-xs text-slate-500">
                        {isPro ? `Assinou ${r.plan.charAt(0).toUpperCase() + r.plan.slice(1)}` : 'Cadastrou (pendente)'} · {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className={`font-bold text-sm ${isPro ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isPro ? 'R$25' : 'Aguardando'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-5">Como funciona</h3>
          <div className="space-y-4">
            {[
              { step: '1', color: 'bg-indigo-100 text-indigo-700', title: 'Compartilhe seu link', desc: 'Envie pelo WhatsApp, Instagram ou onde preferir' },
              { step: '2', color: 'bg-amber-100 text-amber-700', title: 'Seu amigo se cadastra', desc: 'Ele cria a conta usando seu link de indicação' },
              { step: '3', color: 'bg-green-100 text-green-700', title: 'Ele assina o Pro', desc: 'Quando ele assinar qualquer plano pago' },
              { step: '4', color: 'bg-purple-100 text-purple-700', title: 'Você recebe R$25', desc: 'Crédito aplicado na sua próxima fatura' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4">
                <div className={`w-8 h-8 ${s.color} rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                  {s.step}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{s.title}</div>
                  <div className="text-sm text-slate-500">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 bg-amber-50 rounded-xl text-sm text-amber-800">
            <strong>Bônus:</strong> Seu amigo também ganha <strong>14 dias grátis no Pro</strong> ao se cadastrar pelo seu link!
          </div>
        </div>
      </div>
    </div>
  )
}
