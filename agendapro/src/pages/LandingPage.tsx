import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Star,
  TrendingUp,
  Shield,
  Smartphone,
  CheckCircle,
  Users,
  Clock,
  DollarSign,
  MessageCircle,
  X,
  BadgeCheck,
  Flame,
  Timer,
} from 'lucide-react'
import { categories, mockProfessionals } from '../data/mockData'
import StarRating from '../components/StarRating'

const landingCategories = [...categories, { id: 'outros', name: 'Outros', icon: '🧰', count: 0 }]

export default function LandingPage() {
  const featured = mockProfessionals.filter(professional => professional.featured)
  const [showVideo, setShowVideo] = useState(false)
  const [billingAnnual, setBillingAnnual] = useState(false)

  return (
    <div className="min-h-screen w-full overflow-x-hidden page-enter">
      <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 py-2.5 text-center text-sm font-medium text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 leading-relaxed">
          <Flame size={14} className="shrink-0" />
          <span>Comece no</span>
          <strong>Plano Gratuito</strong>
          <span>e evolua para o Pro quando quiser destacar mais o seu perfil.</span>
        </div>
      </div>

      <section className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_32%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/10 to-transparent" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-16 pt-16 sm:px-6 md:pb-24 md:pt-24 lg:px-8 lg:pt-28">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            <div className="public-chip mb-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white">
              <BadgeCheck size={14} className="text-green-300" />
              <span>Agenda, perfil público, clientes e divulgação no mesmo lugar</span>
            </div>

            <h1 className="max-w-4xl text-[2.7rem] font-black leading-[1.08] tracking-tight text-white sm:text-[3.8rem] md:text-[4.3rem] lg:text-[4.6rem]">
              <span className="block">Seu negócio merece</span>
              <span className="block">uma agenda realmente</span>
              <span className="block">profissional</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-indigo-100 sm:text-lg md:text-[1.15rem]">
              Organize sua rotina, centralize seus agendamentos e transforme seu link de atendimento em uma vitrine mais profissional. O AgendaPro ajuda você a trabalhar com mais clareza e presença digital.
            </p>

            <div className="mt-10 flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:justify-center">
              <Link to="/register" className="flex min-h-[60px] flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-8 py-4 text-lg font-bold text-amber-950 shadow-[0_22px_40px_-24px_rgba(251,191,36,0.8)] transition-all hover:-translate-y-0.5 hover:bg-amber-300">
                Criar agenda grátis agora
                <ArrowRight size={20} />
              </Link>
              <Link to="/marketplace" className="flex min-h-[60px] flex-1 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/16">
                Encontrar profissionais
              </Link>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-indigo-50 backdrop-blur-sm">
              <CheckCircle size={14} className="text-green-300" />
              Comece no gratuito, sem cartão e com publicação rápida
            </div>

            <div className="mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-indigo-100">
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-300" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-300" /> Publicação em poucos minutos</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-300" /> Sem fidelidade longa</span>
            </div>
          </div>

          <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { value: 'Perfil', label: 'público profissional', icon: '👤' },
              { value: 'Agenda', label: 'online para compartilhar', icon: '📅' },
              { value: 'Clientes', label: 'e serviços no painel', icon: '🧾' },
            ].map(stat => (
              <div key={stat.label} className="flex min-h-[148px] flex-col items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/14 px-5 py-6 text-center shadow-[0_24px_55px_-34px_rgba(15,23,42,0.45)] backdrop-blur-md">
                <div className="mb-3 text-2xl drop-shadow-sm">{stat.icon}</div>
                <div className="text-3xl font-black tracking-tight text-white drop-shadow-[0_4px_14px_rgba(15,23,42,0.28)] sm:text-[2rem]">{stat.value}</div>
                <div className="mt-1 text-sm font-medium text-indigo-50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-18 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          <div className="space-y-5">
            <span className="text-sm font-bold uppercase tracking-[0.24em] text-rose-400">O problema</span>
            <h2 className="text-3xl font-bold leading-tight">Você ainda gerencia tudo pelo WhatsApp?</h2>
            <div className="space-y-3">
              {[
                'Clientes somem depois de confirmar',
                'Você perde tempo respondendo mensagens',
                'Sua agenda vira uma bagunça',
                'Falta de horário e você perde dinheiro',
                'Nenhum controle do que entrou no mês',
              ].map(problem => (
                <div key={problem} className="flex items-center gap-3 text-slate-300">
                  <X size={16} className="shrink-0 text-rose-400" />
                  <span>{problem}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5 rounded-3xl border border-white/8 bg-white/5 p-8 backdrop-blur-sm">
            <span className="text-sm font-bold uppercase tracking-[0.24em] text-green-400">A solução</span>
            <h2 className="text-3xl font-bold leading-tight">Com o AgendaPro, sua rotina fica mais organizada</h2>
            <div className="space-y-3">
              {[
                'Clientes agendam sozinhos pelo seu link',
                'Agenda organizada em um painel simples',
                'Horarios e disponibilidade mais claros',
                'Relatorios e acompanhamento no dashboard',
              ].map(solution => (
                <div key={solution} className="flex items-center gap-3 text-slate-100">
                  <CheckCircle size={16} className="shrink-0 text-green-400" />
                  <span>{solution}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-500">
              Quero organizar minha agenda <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-center text-center">
            <h2 className="max-w-2xl text-3xl font-bold leading-tight text-slate-900">Para qual profissional você é?</h2>
            <p className="mt-3 max-w-[44rem] text-base leading-8 text-slate-600">Feito para prestadores de serviço que querem vender mais, organizar a rotina e transmitir mais profissionalismo desde o primeiro contato.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9">
            {landingCategories.map(category => (
              <Link
                key={category.id}
                to={`/marketplace?category=${category.id}`}
                className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-2xl border border-transparent px-3 py-4 text-center transition-all hover:border-indigo-200 hover:bg-indigo-50"
              >
                <span className="text-3xl">{category.icon}</span>
                <span className="min-h-[2.5rem] text-center text-xs font-medium leading-5 text-slate-700">{category.name}</span>
                <span className="text-xs text-slate-400">{category.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-indigo-50 py-18">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="public-panel rounded-[2rem] p-8 md:p-12">
            <div className="mb-10 text-center">
              <span className="text-sm font-bold uppercase tracking-[0.24em] text-indigo-600">Calculadora de ROI</span>
              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold leading-tight text-slate-900">Quanto voce pode ganhar a mais?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-500">Veja exemplos simples de como uma operacao mais organizada pode ajudar no seu dia a dia e melhorar sua apresentacao profissional.</p>
            </div>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { emoji: '✂️', role: 'Barbeiro', extra: 'Agenda mais clara', desc: 'Organize horarios, servicos e clientes em um unico lugar.' },
                { emoji: '💇', role: 'Cabeleireira', extra: 'Mais presenca online', desc: 'Compartilhe seu link e passe uma imagem mais profissional.' },
                { emoji: '⚡', role: 'Eletricista', extra: 'Rotina centralizada', desc: 'Acompanhe agendamentos, clientes e servicos com menos bagunca.' },
              ].map(result => (
                <div key={result.role} className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-6 text-center transition-colors hover:border-indigo-200">
                  <div className="mb-2 text-4xl">{result.emoji}</div>
                  <div className="text-lg font-bold text-slate-900">{result.role}</div>
                  <div className="mt-2 mb-1 text-3xl font-bold text-emerald-600">{result.extra}</div>
                  <div className="mx-auto max-w-[15rem] text-xs leading-6 text-slate-500">{result.desc}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-indigo-600 p-6 text-center text-white">
              <div className="mb-1 text-sm text-indigo-200">Plano Pro a partir de R$49 por mes</div>
              <div className="text-2xl font-bold">Mais organizacao, mais presenca e uma experiencia melhor para o cliente</div>
              <div className="mt-1 text-sm text-indigo-200">O ganho real depende da sua rotina, do seu volume de clientes e da forma como voce usa a plataforma.</div>
              <Link to="/register" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-indigo-700 transition-colors hover:bg-indigo-50">
                Quero testar no meu negocio <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 flex flex-col items-center text-center">
            <h2 className="max-w-2xl text-3xl font-bold leading-tight text-slate-900">Pronto em 3 passos</h2>
            <p className="mt-3 max-w-[44rem] text-lg leading-8 text-slate-600">Do cadastro ao primeiro agendamento em menos de 5 minutos, com uma experiencia simples tanto para voce quanto para o cliente.</p>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              { step: '01', icon: <Users size={28} className="text-indigo-600" />, title: 'Crie seu perfil', desc: 'Cadastre servicos, precos e horarios. Personalize com fotos e apresentacao profissional.', time: '2 min' },
              { step: '02', icon: <Calendar size={28} className="text-indigo-600" />, title: 'Compartilhe seu link', desc: 'Cole no Instagram, WhatsApp ou Google. Seus clientes agendam em poucos toques.', time: '1 min' },
              { step: '03', icon: <TrendingUp size={28} className="text-indigo-600" />, title: 'Receba e acompanhe', desc: 'Visualize seus agendamentos, clientes e resultados em um painel mais organizado.', time: 'Painel pronto' },
            ].map(item => (
              <div key={item.step} className="relative mx-auto flex max-w-sm flex-col items-center text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                  {item.icon}
                </div>
                <div className="mb-2 flex items-center justify-center gap-2 text-xs font-bold text-indigo-400">
                  PASSO {item.step}
                  <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                    <Timer size={10} /> {item.time}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="max-w-[19rem] leading-8 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-center text-center">
            <h2 className="max-w-2xl text-3xl font-bold leading-tight text-slate-900">Profissionais em destaque</h2>
            <p className="mt-3 max-w-[44rem] text-base leading-8 text-slate-600">Os mais bem avaliados que ja usam o AgendaPro e passam mais confianca logo no primeiro clique.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map(professional => (
              <Link key={professional.id} to={`/professional/${professional.id}`} className="public-panel group overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-34px_rgba(79,70,229,0.4)]">
                <div className="relative h-40 overflow-hidden">
                  <img src={professional.coverImage} alt={professional.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {professional.plan === 'pro' && (
                    <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-amber-900">PRO</span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <img src={professional.avatar} alt={professional.name} className="relative z-10 -mt-8 h-12 w-12 rounded-full border-2 border-white object-cover shadow" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-slate-900">{professional.name}</h3>
                      <p className="truncate text-sm font-medium text-indigo-600">{professional.specialty}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StarRating rating={professional.rating} showCount count={professional.reviewCount} />
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <Users size={12} /> {professional.completedServices} servicos
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{professional.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">📍 {professional.city}, {professional.state}</span>
                    <span className="text-sm font-semibold text-indigo-600">
                      A partir de R${Math.min(...professional.services.map(service => service.price))}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-6 py-3 font-medium text-indigo-600 transition-colors hover:bg-indigo-50">
              Explorar profissionais agora <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 flex flex-col items-center text-center">
            <h2 className="max-w-2xl text-3xl font-bold leading-tight text-slate-900">Tudo que voce precisa, num so lugar</h2>
            <p className="mt-3 max-w-[46rem] text-base leading-8 text-slate-600">Sem depender de varias ferramentas desconectadas para operar o negocio e acompanhar o que realmente importa.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Calendar className="text-indigo-600" size={24} />, title: 'Calendario inteligente', desc: 'Gerencie horarios, bloqueie datas e visualize sua agenda completa em poucos toques.', badge: '' },
              { icon: <MessageCircle className="text-green-600" size={24} />, title: 'Central WhatsApp', desc: 'Use templates e atalhos para abrir mensagens prontas no WhatsApp sem custo adicional.', badge: '' },
              { icon: <Star className="text-amber-500" size={24} />, title: 'Avaliacoes verificadas', desc: 'Construa reputacao online com feedback real de clientes satisfeitos.', badge: '' },
              { icon: <Smartphone className="text-purple-600" size={24} />, title: '100% mobile', desc: 'Seus clientes agendam direto pelo celular, sem precisar baixar aplicativo.', badge: '' },
              { icon: <TrendingUp className="text-indigo-600" size={24} />, title: 'Ferramentas de marketing', desc: 'Crie cupons, copie posts prontos e divulgue seu link com mais rapidez.', badge: '' },
              { icon: <DollarSign className="text-emerald-600" size={24} />, title: 'Relatorios de receita', desc: 'Acompanhe faturamento e atendimentos concluidos direto no painel.', badge: '' },
              { icon: <Shield className="text-slate-600" size={24} />, title: 'Pagamento online', desc: 'Aceite Pix e cartao antes do atendimento para reduzir desistencias.', badge: 'EM BREVE' },
              { icon: <Users className="text-indigo-600" size={24} />, title: 'CRM de clientes', desc: 'Tenha historico, preferencias e relacionamento mais profissional com cada cliente.', badge: '' },
              { icon: <Clock className="text-rose-500" size={24} />, title: 'Pagina no marketplace', desc: 'Apareca para clientes que buscam seu servico na sua cidade.', badge: '' },
            ].map(feature => (
              <div key={feature.title} className="relative flex min-h-[210px] flex-col items-center rounded-[1.75rem] border border-slate-100 bg-white p-6 text-center transition-all hover:border-indigo-200 hover:shadow-md">
                {feature.badge && (
                  <span className={`absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-bold ${feature.badge === 'PRO' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {feature.badge}
                  </span>
                )}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mx-auto max-w-[18rem] text-sm leading-7 text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 flex flex-col items-center text-center">
            <h2 className="max-w-2xl text-3xl font-bold leading-tight text-slate-900">Profissionais reais, resultados reais</h2>
            <p className="mt-3 max-w-[46rem] text-base leading-8 text-slate-600">Profissionais usam o AgendaPro para organizar a rotina, fortalecer o perfil online e facilitar o agendamento com clientes.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { name: 'Carlos Barbosa', role: 'Barbeiro - SP', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face', comment: 'Antes eu me perdia entre mensagens, horarios e confirmacoes. Hoje consigo visualizar melhor minha agenda e passar uma imagem mais profissional para os clientes.', result: 'Rotina mais organizada', time: 'Usa ha 8 meses' },
              { name: 'Ana Paula Costa', role: 'Cabeleireira - SP', img: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=60&h=60&fit=crop&crop=face', comment: 'Gostei porque ficou mais facil compartilhar meu link, mostrar meus servicos e acompanhar o que esta acontecendo no dia sem depender de varias ferramentas.', result: 'Mais clareza no dia a dia', time: 'Usa ha 6 meses' },
              { name: 'Roberto Eletrica', role: 'Eletricista - SP', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=60&h=60&fit=crop&crop=face', comment: 'Meu atendimento ficou mais profissional. Ter perfil publico, agenda e clientes no mesmo lugar me ajudou bastante a organizar a operacao.', result: 'Perfil mais forte', time: 'Usa ha 4 meses' },
            ].map(testimonial => (
              <div key={testimonial.name} className="flex h-full flex-col rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="mb-6 flex-1 text-left leading-8 text-slate-700">"{testimonial.comment}"</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    <img src={testimonial.img} alt={testimonial.name} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="text-xs text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-600">{testimonial.result}</div>
                    <div className="text-xs text-slate-400">{testimonial.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-indigo-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-2 text-3xl font-bold text-white">Comece gratis. Evolua no seu ritmo.</h2>
          <p className="mb-6 text-lg text-indigo-100">Sem surpresas. Sem fidelidade longa.</p>

          <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/10 p-1">
            <button onClick={() => setBillingAnnual(false)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${!billingAnnual ? 'bg-white text-indigo-700' : 'text-indigo-100'}`}>
              Mensal
            </button>
            <button onClick={() => setBillingAnnual(true)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${billingAnnual ? 'bg-white text-indigo-700' : 'text-indigo-100'}`}>
              Anual
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900">-30%</span>
            </button>
          </div>

          <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-6 text-left backdrop-blur-sm">
              <div className="mb-1 text-lg font-bold text-white">Gratuito</div>
              <div className="mb-4 text-sm text-indigo-200">Sempre gratis - Sem cartao</div>
              <div className="mb-4 text-4xl font-bold text-white">R$0</div>
              {['Perfil publico basico', 'Calendario online', 'Avaliacoes de clientes', 'Link de agendamento', 'Central manual de WhatsApp'].map(feature => (
                <div key={feature} className="mb-2 flex items-center gap-2 text-sm text-indigo-100">
                  <CheckCircle size={14} className="shrink-0 text-green-400" /> {feature}
                </div>
              ))}
              <Link to="/register" className="mt-4 block w-full rounded-xl bg-white/20 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-white/30">
                Criar conta gratis
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 text-left">
              <div className="absolute right-0 top-0 rounded-bl-xl bg-amber-400 px-4 py-1.5 text-xs font-bold text-amber-900">
                MAIS POPULAR
              </div>
              <div className="mb-1 text-lg font-bold text-indigo-700">Pro ✨</div>
              <div className="mb-4 text-sm text-slate-500">Unico plano pago em destaque hoje, feito para reforcar sua presenca no app</div>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">R${billingAnnual ? '34' : '49'}</span>
                <span className="text-slate-400">/mes</span>
              </div>
              {billingAnnual ? (
                <div className="mb-3 text-xs font-medium text-emerald-600">Cobrado anualmente - Economize R$180 por ano</div>
              ) : (
                <div className="mb-3 text-xs text-slate-400">ou R$34 por mes no plano anual</div>
              )}
              {['Tudo do gratuito', 'Selo PRO no perfil', 'Selo PRO no marketplace', 'Galeria de fotos no perfil', 'Ferramentas de marketing', 'Relatorios no painel'].map(feature => (
                <div key={feature} className="mb-2 flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle size={14} className="shrink-0 text-indigo-500" /> {feature}
                </div>
              ))}
              <Link to="/pricing" className="mt-4 block w-full rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-indigo-700">
                Assinar Pro - R${billingAnnual ? '34' : '49'}/mes
              </Link>
            </div>
          </div>
          <p className="text-xs text-indigo-200">Pagamento seguro via Stripe - SSL - Sem fidelidade longa</p>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-4 text-4xl">🚀</div>
          <h2 className="mb-4 text-3xl font-bold">Pronto para organizar melhor sua operacao?</h2>
          <p className="mb-8 text-lg text-slate-400">Crie seu perfil, publique sua agenda e evolua com mais clareza dentro do app.</p>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-10 py-4 text-lg font-bold text-white shadow-xl transition-colors hover:bg-indigo-500">
            Criar minha conta e publicar agenda <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-sm text-slate-500">Sem cartao - Publicacao rapida - Suporte em portugues</p>
        </div>
      </section>

      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowVideo(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4" onClick={event => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold text-slate-900">Como funciona o AgendaPro</span>
              <button onClick={() => setShowVideo(false)} className="rounded-lg p-1 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video rounded-xl bg-slate-900">
              <div className="flex h-full flex-col items-center justify-center text-center text-white">
                <Calendar size={48} className="mb-3 text-slate-400" />
                <p className="text-slate-400">Video demonstrativo</p>
                <p className="text-sm text-slate-500">Adicione o link do seu video aqui</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
