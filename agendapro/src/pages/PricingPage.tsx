import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react'

const STRIPE_PRO_MONTHLY = 'https://buy.stripe.com/test_pro_monthly'
const STRIPE_PRO_ANNUAL = 'https://buy.stripe.com/test_pro_annual'
const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    priceMonthly: 0,
    priceAnnual: 0,
    desc: 'Para tirar sua agenda do papel, publicar seu perfil e começar a receber agendamentos.',
    color: 'border-slate-200',
    glow: '',
    accent: 'text-slate-900',
    headerTone: 'bg-slate-50 text-slate-900',
    buttonClass: 'border border-indigo-200 text-indigo-700 hover:bg-indigo-50',
    href: '/register',
    cta: 'Começar grátis',
    features: [
      { text: 'Perfil público com serviços e informações básicas', ok: true },
      { text: 'Link de agendamento online para compartilhar', ok: true },
      { text: 'Agenda, clientes e serviços no mesmo painel', ok: true },
      { text: 'Avaliações de clientes com página pública', ok: true },
      { text: 'Presença no marketplace', ok: true },
      { text: 'Central manual de WhatsApp com mensagens prontas', ok: true },
      { text: 'Cupons, posts prontos e link de divulgação', ok: true },
      { text: 'Relatórios do seu desempenho no painel', ok: true },
      { text: 'Galeria de fotos no perfil público', ok: false },
      { text: 'Recursos exclusivos para multiunidade', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 49,
    priceAnnual: 34,
    desc: 'Para profissionais que querem passar mais confiança, destacar o perfil e transformar o link em uma vitrine profissional.',
    color: 'border-indigo-500',
    glow: 'shadow-[0_28px_70px_-34px_rgba(79,70,229,0.45)] ring-1 ring-indigo-200',
    accent: 'text-indigo-700',
    headerTone: 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white',
    buttonClass: 'bg-indigo-600 text-white hover:bg-indigo-700',
    badge: 'Mais popular',
    hrefMonthly: STRIPE_PRO_MONTHLY,
    hrefAnnual: STRIPE_PRO_ANNUAL,
    cta: 'Quero destacar meu perfil',
    features: [
      { text: 'Tudo do plano Gratuito', ok: true },
      { text: 'Selo PRO exibido no perfil público', ok: true },
      { text: 'Selo PRO visível nos cards do marketplace', ok: true },
      { text: 'Prioridade sobre contas gratuitas no marketplace', ok: true },
      { text: 'Galeria de fotos no perfil público', ok: true },
      { text: 'Perfil mais forte para gerar mais confiança no primeiro clique', ok: true },
      { text: 'Plano reconhecido nas indicações como conversão paga', ok: true },
      { text: 'Central manual de WhatsApp, marketing e relatórios', ok: true },
      { text: 'Mesmo fluxo que você já usa, agora com mais presença e destaque', ok: true },
      { text: 'Automacao real de WhatsApp incluida no envio', ok: false },
      { text: 'Gestao de equipe com varios profissionais', ok: false },
    ],
  },
]

const faqs = [
  {
    q: 'Preciso de cartão de crédito para usar o plano gratuito?',
    a: 'Não. O plano gratuito pode ser usado sem informar cartão. Basta criar a conta e publicar sua agenda.',
  },
  {
    q: 'O que muda de verdade quando eu subo para o Pro?',
    a: 'O Pro libera galeria de fotos no perfil, selo PRO visível, mais destaque no marketplace e a mesma base do painel que você já usa hoje.',
  },
  {
    q: 'Vou perder meus dados se fizer upgrade depois?',
    a: 'Não. O upgrade acontece no mesmo perfil, com os mesmos serviços, clientes e configurações que você já cadastrou.',
  },
  {
    q: 'O que meus clientes passam a ver no Pro?',
    a: 'Eles veem um perfil com selo PRO, galeria de fotos liberada e mais destaque dentro do marketplace do app.',
  },
  {
    q: 'O plano gratuito continua funcionando bem sozinho?',
    a: 'Sim. Ele já permite publicar o perfil, compartilhar o link de agendamento, organizar agenda, clientes e serviços no mesmo painel.',
  },
  {
    q: 'Como funciona o WhatsApp dentro do app hoje?',
    a: 'Hoje o app oferece uma central manual com templates, atalhos e abertura de mensagens prontas. O envio automático real ainda não está incluído.',
  },
]

const trustBadges = [
  {
    icon: <Shield size={22} className="text-indigo-600" />,
    title: 'Pagamento seguro',
    desc: 'Checkout protegido e ambiente confiavel para assinatura.',
  },
  {
    icon: <Star size={22} className="text-amber-500" />,
    title: 'Percepção premium',
    desc: 'Sua página transmite mais confiança logo no primeiro contato.',
  },
  {
    icon: <Users size={22} className="text-emerald-600" />,
    title: 'Uso simples no dia a dia',
    desc: 'O foco do produto hoje está em organizar a operação e fortalecer a apresentação do perfil.',
  },
  {
    icon: <MessageCircle size={22} className="text-green-500" />,
    title: 'Fluxo manual de WhatsApp',
    desc: 'Templates e atalhos prontos para abrir mensagens sem depender de automação paga.',
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="page-enter min-h-screen bg-transparent">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-900 to-purple-900 py-20 text-white sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_32%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/15 to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="public-chip mb-7 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white">
            <Sparkles size={14} className="text-amber-300" />
            Comece rapido no gratuito e suba para o Pro quando quiser parecer mais profissional.
          </div>

          <h1 className="mx-auto max-w-4xl text-[2.35rem] font-black leading-[1.12] tracking-tight text-white sm:text-[3.35rem] md:text-[3.85rem]">
            <span className="block">Seu perfil pode ate</span>
            <span className="block">estar no ar hoje,</span>
            <span className="block">mas o Pro faz ele vender melhor</span>
          </h1>

          <div className="mt-6 flex justify-center">
            <p className="max-w-[46rem] text-center text-base leading-8 text-indigo-100 sm:text-lg md:text-[1.08rem]">
              No gratuito voce organiza sua operacao. No Pro voce passa mais confianca, ganha destaque no app e mostra melhor seu trabalho para o cliente decidir mais rapido.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 p-1.5 backdrop-blur-sm">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${!annual ? 'bg-white text-indigo-700 shadow' : 'text-indigo-100 hover:text-white'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${annual ? 'bg-white text-indigo-700 shadow' : 'text-indigo-100 hover:text-white'}`}
              >
                Anual
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900">economize ate 30%</span>
              </button>
            </div>

            <div className="flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-indigo-100">
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-300" /> Sem fidelidade longa</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-300" /> Upgrade no momento certo</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-300" /> Mais confianca para converter melhor</span>
            </div>

            <p className="max-w-2xl text-center text-sm font-medium leading-6 text-amber-200">
              {annual ? 'No anual, o custo mensal cai e a margem melhora logo no primeiro ciclo.' : 'Se voce quer operar com mais margem ao longo do ano, o anual entrega o melhor custo.'}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-8 max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-6 md:grid-cols-2">
          {plans.map(plan => {
            const price = annual ? plan.priceAnnual : plan.priceMonthly
            const href = plan.id === 'free' ? '/register' : (annual ? plan.hrefAnnual : plan.hrefMonthly) || '/register'
            const isExternal = plan.id !== 'free'

            return (
              <div
                key={plan.id}
                className={`public-panel relative flex h-full flex-col overflow-hidden rounded-[2rem] border ${plan.color} ${plan.glow} transition-all duration-300 hover:-translate-y-1`}
              >
                {plan.badge && (
                  <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-amber-950 shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <div className={`${plan.headerTone} flex min-h-[365px] flex-col items-center px-7 pb-8 pt-12 text-center sm:px-8`}>
                  <div className="flex flex-1 w-full flex-col items-center justify-center gap-4">
                    <div className="flex min-h-[130px] flex-col items-center text-center">
                      <h2 className="text-[2rem] font-bold leading-tight">{plan.name}</h2>
                      <p className={`mt-3 max-w-[17rem] text-sm leading-7 ${plan.id === 'free' ? 'text-slate-500' : 'text-white/80'}`}>
                        {plan.desc}
                      </p>
                    </div>
                    <div className={`shrink-0 rounded-2xl bg-white/12 px-3 py-2 text-sm font-semibold backdrop-blur-sm ${plan.id === 'free' ? 'bg-white text-slate-700' : 'text-white'}`}>
                      {plan.id === 'pro' ? 'Perfil profissional' : 'Comeco rapido'}
                    </div>
                  </div>

                  <div className="mt-9 flex min-h-[68px] items-end justify-center gap-2 text-center">
                    <span className="text-5xl font-black tracking-tight">R${price}</span>
                    {price > 0 && <span className={`pb-1 text-sm ${plan.id === 'free' ? 'text-slate-400' : 'text-white/75'}`}>/mes</span>}
                  </div>

                  <p className={`mx-auto mt-4 flex min-h-[64px] max-w-[15rem] items-center justify-center text-center text-sm leading-7 ${plan.id === 'free' ? 'text-slate-500' : 'text-white/80'}`}>
                    {plan.id === 'free'
                      ? 'Ideal para comecar sem risco e validar sua rotina antes de investir.'
                      : annual
                        ? `Cobrado como R$${price * 12}/ano para reduzir o custo mensal e ganhar previsibilidade.`
                        : `Tambem disponivel no anual por R$${plan.priceAnnual}/mes equivalente.`}
                  </p>
                </div>

                <div className="flex flex-1 flex-col px-7 py-8 text-center sm:px-8">
                  {isExternal ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={`mb-8 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition-all hover:-translate-y-0.5 ${plan.buttonClass}`}
                    >
                      <CreditCard size={16} />
                      {plan.cta}
                    </a>
                  ) : (
                    <Link
                      to={href}
                      className={`mb-8 flex min-h-[56px] w-full items-center justify-center rounded-2xl px-4 text-sm font-bold transition-all hover:-translate-y-0.5 ${plan.buttonClass}`}
                    >
                      {plan.cta}
                    </Link>
                  )}

                  <div className="space-y-4 text-left">
                    {plan.features.filter(feature => feature.ok).map(feature => (
                      <div key={feature.text} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                        <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-500" />
                        <span className="block pr-1">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                    {plan.id === 'free' && 'Bom para organizar a operacao e colocar seu link no ar.'}
                    {plan.id === 'pro' && 'Ideal para quem quer deixar de parecer basico e passar uma imagem mais profissional no app.'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <section className="mt-14 public-panel rounded-[2rem] p-6 md:p-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {trustBadges.map(item => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-white/70 p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] bg-gradient-to-r from-indigo-700 via-indigo-700 to-purple-700 px-6 py-10 text-white md:px-10 md:py-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100 backdrop-blur-sm">
              <Zap size={14} className="text-amber-300" />
              O que muda quando seu perfil fica mais forte?
            </div>
            <h2 className="mt-5 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">Uma agenda vazia custa mais caro do que o plano certo</h2>
            <p className="mt-4 max-w-[48rem] text-base leading-8 text-indigo-100 md:text-lg">
              O maior ganho do plano Pro hoje esta em percepcao profissional, confianca e destaque dentro da plataforma.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                { value: 'Perfil', label: 'mais forte no app', sub: 'Com selo, galeria e uma apresentacao mais profissional.' },
                { value: 'Mais', label: 'destaque no marketplace', sub: 'Seu perfil aparece acima das contas gratuitas.' },
                { value: 'Mesmo', label: 'fluxo que voce ja conhece', sub: 'Sem mudar sua rotina, so melhorando sua percepcao.' },
              ].map(card => (
                <div key={card.label} className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-amber-300">{card.value}</div>
                  <div className="mt-2 font-semibold">{card.label}</div>
                  <div className="mt-2 text-sm leading-6 text-indigo-100">{card.sub}</div>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white/10 px-5 py-4 text-lg font-bold leading-8 backdrop-blur-sm">
              Se hoje voce quer vender melhor no primeiro clique, o Pro e o plano para deixar seu perfil mais bonito, mais confiavel e mais facil de escolher.
            </div>

            <a
              href={annual ? STRIPE_PRO_ANNUAL : STRIPE_PRO_MONTHLY}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-8 py-4 text-lg font-bold text-amber-950 shadow-[0_22px_40px_-24px_rgba(251,191,36,0.85)] transition-all hover:-translate-y-0.5 hover:bg-amber-300"
            >
              Quero meu perfil profissional
              <ArrowRight size={20} />
            </a>
          </div>
        </section>

        <section className="mt-14 public-panel rounded-[2rem] p-6 md:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <span className="text-sm font-bold uppercase tracking-[0.24em] text-indigo-600">Antes e depois</span>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900">O que o cliente percebe quando voce sobe para o Pro</h2>
              <div className="mt-3 flex justify-center">
                <p className="max-w-[44rem] text-center text-base leading-8 text-slate-500">
                  O gratuito coloca sua agenda no ar. O Pro ajuda seu perfil a parecer mais confiavel, mais completo e mais facil de escolher.
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  Perfil basico
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div className="flex h-28 items-start rounded-2xl bg-gradient-to-r from-slate-200 to-slate-100 p-3">
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                      Basico
                    </span>
                  </div>
                  <div className="-mt-4 flex items-end gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-300 text-lg font-bold text-slate-600 shadow-sm">
                      A
                    </div>
                    <div className="min-w-0 pb-1">
                      <div className="font-bold text-slate-900">Seu nome</div>
                      <div className="text-sm text-slate-500">Seu servico</div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm leading-6 text-slate-500">
                    <div>Perfil no ar para comecar a divulgar seu link</div>
                    <div>Apresentacao mais simples e sem galeria de fotos</div>
                    <div>Presenca padrao no marketplace</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-indigo-200 bg-[linear-gradient(180deg,_rgba(99,102,241,0.08)_0%,_rgba(139,92,246,0.05)_100%)] p-6 shadow-[0_24px_60px_-40px_rgba(79,70,229,0.4)]">
                <div className="mb-4 inline-flex rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
                  Perfil Pro
                </div>
                <div className="rounded-[1.5rem] border border-indigo-200 bg-white p-5">
                  <div className="flex h-28 items-start rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 p-3">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-sm">
                      PRO
                    </span>
                  </div>
                  <div className="-mt-4 flex items-end gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-indigo-500 text-lg font-bold text-white shadow-lg">
                      A
                    </div>
                    <div className="min-w-0 pb-1">
                      <div className="font-bold text-slate-900">Seu nome</div>
                      <div className="text-sm text-indigo-600">Seu servico</div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                    <div>Selo Pro visivel para passar mais confianca</div>
                    <div>Galeria liberada para mostrar seu ambiente e resultados</div>
                    <div>Mais destaque dentro do marketplace</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="public-panel rounded-[2rem] p-6 md:p-8">
            <div className="mx-auto max-w-xl text-center">
              <span className="text-sm font-bold uppercase tracking-[0.24em] text-indigo-600">Comparacao rapida</span>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900">Qual plano combina melhor com o seu momento?</h2>
              <p className="mt-3 max-w-xl text-base leading-8 text-slate-500">
                O gratuito ja coloca sua operacao no ar. O Pro entra quando voce quer melhorar a apresentacao do perfil e ganhar mais destaque dentro do app.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-2xl space-y-4 text-center">
              {[
                {
                  title: 'Gratuito',
                  desc: 'Melhor para quem quer publicar o perfil, receber agendamentos e organizar a rotina sem custo.',
                },
                {
                  title: 'Pro',
                  desc: 'Melhor para quem quer liberar galeria, exibir selo PRO e aparecer com mais destaque no marketplace.',
                },
              ].map(item => (
                <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="public-panel rounded-[2rem] p-6 text-center md:p-8">
            <span className="text-sm font-bold uppercase tracking-[0.24em] text-indigo-600">Perguntas frequentes</span>
            <h2 className="mx-auto mt-3 max-w-md text-3xl font-bold leading-tight text-slate-900">Tire as duvidas antes de assinar</h2>
            <div className="mx-auto mt-8 max-w-2xl space-y-3">
              {faqs.map((faq, index) => (
                <div key={faq.q} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="font-semibold text-slate-900">{faq.q}</span>
                    {openFaq === index ? (
                      <ChevronUp size={18} className="shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown size={18} className="shrink-0 text-slate-400" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-7 text-slate-600">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
