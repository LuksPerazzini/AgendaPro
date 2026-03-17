import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, X, Zap, Shield, CreditCard, ArrowRight, Star, Users, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'

const STRIPE_PRO_MONTHLY = 'https://buy.stripe.com/test_pro_monthly'
const STRIPE_PRO_ANNUAL = 'https://buy.stripe.com/test_pro_annual'
const STRIPE_BUSINESS_MONTHLY = 'https://buy.stripe.com/test_business_monthly'
const STRIPE_BUSINESS_ANNUAL = 'https://buy.stripe.com/test_business_annual'

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    priceMonthly: 0,
    priceAnnual: 0,
    period: 'para sempre',
    desc: 'Para quem está começando',
    color: 'border-slate-200',
    headerBg: 'bg-slate-50',
    btnClass: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50',
    href: '/register',
    features: [
      { text: 'Perfil público básico', ok: true },
      { text: '20 agendamentos/mês', ok: true },
      { text: 'Calendário de disponibilidade', ok: true },
      { text: 'Avaliações de clientes', ok: true },
      { text: 'Link de agendamento único', ok: true },
      { text: 'Aparece no marketplace', ok: true },
      { text: 'WhatsApp automático', ok: false },
      { text: 'Ferramentas de marketing', ok: false },
      { text: 'Destaque no marketplace', ok: false },
      { text: 'Relatórios e analytics', ok: false },
      { text: 'Suporte prioritário', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 49,
    priceAnnual: 34,
    period: 'por mês',
    desc: 'Para crescer sem limites',
    color: 'border-indigo-500 ring-4 ring-indigo-100',
    headerBg: 'bg-indigo-600',
    btnClass: 'bg-indigo-600 text-white hover:bg-indigo-700',
    badge: '⭐ Mais popular',
    hrefMonthly: STRIPE_PRO_MONTHLY,
    hrefAnnual: STRIPE_PRO_ANNUAL,
    features: [
      { text: 'Perfil completo com fotos', ok: true },
      { text: 'Agendamentos ilimitados', ok: true },
      { text: 'Calendário avançado', ok: true },
      { text: 'Avaliações de clientes', ok: true },
      { text: 'Link de agendamento único', ok: true },
      { text: 'Aparece no marketplace', ok: true },
      { text: 'WhatsApp automático', ok: true },
      { text: 'Ferramentas de marketing', ok: true },
      { text: 'Destaque no marketplace', ok: true },
      { text: 'Relatórios e analytics', ok: true },
      { text: 'Suporte prioritário', ok: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    priceMonthly: 79,
    priceAnnual: 55,
    period: 'por mês',
    desc: 'Para equipes e salões',
    color: 'border-slate-200',
    headerBg: 'bg-slate-800',
    btnClass: 'bg-slate-800 text-white hover:bg-slate-700',
    hrefMonthly: STRIPE_BUSINESS_MONTHLY,
    hrefAnnual: STRIPE_BUSINESS_ANNUAL,
    features: [
      { text: 'Tudo do plano Pro', ok: true },
      { text: 'Até 5 profissionais', ok: true },
      { text: 'Dashboard de equipe', ok: true },
      { text: 'Relatórios consolidados', ok: true },
      { text: 'Marca personalizada', ok: true },
      { text: 'Aparece no marketplace', ok: true },
      { text: 'WhatsApp automático', ok: true },
      { text: 'Ferramentas de marketing', ok: true },
      { text: 'Destaque premium', ok: true },
      { text: 'Relatórios avançados', ok: true },
      { text: 'Suporte prioritário 24h', ok: true },
    ],
  },
]

const faqs = [
  { q: 'Preciso de cartão de crédito para o plano gratuito?', a: 'Não! O plano gratuito não exige nenhum dado de pagamento. Basta criar sua conta e começar a usar imediatamente.' },
  { q: 'Como funciona o período de teste do Pro?', a: 'Novos usuários têm 14 dias grátis no plano Pro. Sem cobranças durante o período de teste. Você só paga se decidir continuar.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multa ou burocracia. Basta acessar as configurações e cancelar. Você continua usando até o fim do período pago.' },
  { q: 'Como funciona o plano anual?', a: 'No plano anual você paga 10 meses e ganha 2 de brinde (30% de economia). O valor é cobrado uma única vez no início.' },
  { q: 'Os clientes pagam para agendar?', a: 'Nunca. O agendamento é sempre 100% gratuito para os clientes finais. Só o profissional paga pela assinatura da plataforma.' },
  { q: 'Preciso instalar algum app?', a: 'Não. O AgendaPro funciona totalmente no navegador, tanto no celular quanto no computador. Seus clientes também não precisam instalar nada.' },
  { q: 'Como integro com o WhatsApp?', a: 'No plano Pro, você conecta seu número de WhatsApp nas configurações e pronto. O sistema dispara as mensagens automaticamente para você.' },
  { q: 'O que acontece se eu ultrapassar 20 agendamentos no plano gratuito?', a: 'Novos agendamentos ficam pausados até o próximo mês. Você recebe uma notificação para fazer upgrade sem perder nenhum dado.' },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-16">
        <div className="max-w-4xl mx-auto px-4" style={{ textAlign: 'center' }}>
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-indigo-100 text-sm mb-5">
            <Zap size={14} /> Planos simples · Sem taxa de setup · Cancele quando quiser
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Escolha como quer crescer</h1>
          <p className="text-indigo-100 text-lg mb-8">Comece grátis. Faça upgrade quando precisar de mais.</p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-2xl p-1.5 mb-4">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${!annual ? 'bg-white text-indigo-700 shadow' : 'text-indigo-100 hover:text-white'}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${annual ? 'bg-white text-indigo-700 shadow' : 'text-indigo-100 hover:text-white'}`}
            >
              Anual
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">-30%</span>
            </button>
          </div>
          {annual && <p className="text-green-300 text-sm font-medium">✓ Você economiza até R$288 por ano</p>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-16">
        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map(plan => {
            const price = annual ? plan.priceAnnual : plan.priceMonthly
            const href = plan.id === 'free' ? '/register' : (annual ? plan.hrefAnnual : plan.hrefMonthly) || '/register'
            const isExternal = plan.id !== 'free'
            return (
              <div key={plan.id} className={`bg-white rounded-2xl border-2 overflow-hidden relative ${plan.color}`}>
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap z-10">
                    {plan.badge}
                  </div>
                )}
                <div className={`${plan.headerBg} px-7 pt-8 pb-6 ${plan.id === 'pro' ? 'text-white' : plan.id === 'business' ? 'text-white' : 'text-slate-800'}`}>
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className={`text-sm mb-4 ${plan.id === 'pro' ? 'text-indigo-200' : plan.id === 'business' ? 'text-slate-300' : 'text-slate-500'}`}>{plan.desc}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">R${price}</span>
                    {price > 0 && <span className={`text-sm ${plan.id === 'pro' ? 'text-indigo-200' : plan.id === 'business' ? 'text-slate-400' : 'text-slate-400'}`}>/mês{annual ? '*' : ''}</span>}
                  </div>
                  {annual && price > 0 && (
                    <p className={`text-xs mt-1 ${plan.id === 'pro' ? 'text-green-300' : 'text-green-400'}`}>
                      Cobrado R${price * 12}/ano · Economize R${(plan.priceMonthly - price) * 12}
                    </p>
                  )}
                </div>
                <div className="px-7 py-6">
                  {isExternal ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mb-6 transition-colors ${plan.btnClass}`}
                    >
                      <CreditCard size={16} />
                      {annual ? `Assinar por R$${price * 12}/ano` : `Assinar por R$${price}/mês`}
                    </a>
                  ) : (
                    <Link to={href} className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center mb-6 transition-colors ${plan.btnClass}`}>
                      Começar grátis
                    </Link>
                  )}
                  <div className="space-y-2.5">
                    {plan.features.map(f => (
                      <div key={f.text} className={`flex items-center gap-2.5 text-sm ${f.ok ? 'text-slate-700' : 'text-slate-300'}`}>
                        {f.ok ? <CheckCircle size={15} className="text-green-500 flex-shrink-0" /> : <X size={15} className="text-slate-300 flex-shrink-0" />}
                        {f.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6" style={{ textAlign: 'center' }}>
            {[
              { icon: <Shield size={24} className="text-indigo-600" />, title: 'Pagamento seguro', desc: 'Stripe · SSL · PCI DSS' },
              { icon: <Star size={24} className="text-amber-500" />, title: '4.9/5 estrelas', desc: '2.400+ avaliações' },
              { icon: <Users size={24} className="text-green-600" />, title: '2.400+ profissionais', desc: 'Ativos na plataforma' },
              { icon: <MessageCircle size={24} className="text-green-500" />, title: 'Suporte em PT', desc: 'Seg–Sex · 9h às 18h' },
            ].map(b => (
              <div key={b.title} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">{b.icon}</div>
                <div className="font-semibold text-slate-900 text-sm">{b.title}</div>
                <div className="text-xs text-slate-500">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 md:p-10 mb-12 text-white" style={{ textAlign: 'center' }}>
          <h2 className="text-2xl font-bold mb-2">Quanto você perde sem o Pro?</h2>
          <p className="text-indigo-100 mb-8">Cada falta não evitada = dinheiro no lixo</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            {[
              { label: 'Faltas evitadas/mês', value: '~8', sub: 'Com lembretes automáticos' },
              { label: 'Valor médio por serviço', value: 'R$70', sub: 'Ticket médio do setor' },
              { label: 'Prejuízo evitado/mês', value: 'R$560', sub: 'Que voltam para o seu bolso' },
            ].map(c => (
              <div key={c.label} className="bg-white/10 rounded-2xl p-5">
                <div className="text-3xl font-bold text-amber-300 mb-1">{c.value}</div>
                <div className="font-semibold mb-0.5">{c.label}</div>
                <div className="text-indigo-200 text-xs">{c.sub}</div>
              </div>
            ))}
          </div>
          <div className="bg-white/10 rounded-2xl p-4 max-w-lg mx-auto mb-6">
            <div className="text-lg font-bold">
              R$560 recuperados — R$49 do plano = <span className="text-amber-300">R$511 de lucro extra/mês</span>
            </div>
          </div>
          <a href={STRIPE_PRO_MONTHLY} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-amber-400 text-amber-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-300 transition-colors shadow-lg">
            Recuperar esse dinheiro agora <ArrowRight size={20} />
          </a>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8" style={{ textAlign: 'center' }}>
            Perguntas frequentes
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
