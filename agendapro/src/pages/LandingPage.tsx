import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Calendar, Star, TrendingUp, Shield, Smartphone,
  CheckCircle, ChevronRight, Users, Clock, DollarSign, MessageCircle,
  Play, X, BadgeCheck, Flame, Timer
} from 'lucide-react'
import { categories, mockProfessionals } from '../data/mockData'
import StarRating from '../components/StarRating'

export default function LandingPage() {
  const featured = mockProfessionals.filter(p => p.featured)
  const [showVideo, setShowVideo] = useState(false)
  const [billingAnnual, setBillingAnnual] = useState(false)

  return (
    <div className="min-h-screen w-full overflow-x-hidden">

      {/* Urgency Banner */}
      <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 px-4 text-sm font-medium">
        <Flame size={14} className="inline mr-1" />
        Oferta de lançamento: <strong>3 meses grátis no Pro</strong> para os próximos 50 cadastros.
        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">23 vagas restantes</span>
      </div>

      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="w-full max-w-4xl mx-auto" style={{ textAlign: 'center' }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BadgeCheck size={14} className="text-green-300" />
              <span>+2.000 profissionais já faturam mais com o AgendaPro</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Seu negócio merece uma
              <span className="text-amber-300"> agenda profissional</span>
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Pare de perder clientes por desorganização. O AgendaPro automatiza seus agendamentos,
              reduz faltas em <strong>70%</strong> e faz você faturar até <strong>3x mais</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="bg-amber-400 text-amber-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 shadow-xl">
                Começar grátis agora
                <ArrowRight size={20} />
              </Link>
              <button
                onClick={() => setShowVideo(true)}
                className="border-2 border-white/40 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Play size={18} className="fill-white" /> Ver como funciona
              </button>
            </div>
            <p className="text-indigo-200 text-sm mt-4 flex items-center justify-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle size={13} className="text-green-400" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1"><CheckCircle size={13} className="text-green-400" /> Configurado em 5 minutos</span>
              <span className="flex items-center gap-1"><CheckCircle size={13} className="text-green-400" /> Cancele quando quiser</span>
            </p>
          </div>

          {/* Social proof numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {[
              { value: '2.400+', label: 'Profissionais ativos', icon: '👨‍💼' },
              { value: '87.000+', label: 'Agendamentos/mês', icon: '📅' },
              { value: '4.9★', label: 'Avaliação na loja', icon: '⭐' },
              { value: 'R$0', label: 'Para começar hoje', icon: '🚀' },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-indigo-200 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-rose-400 text-sm font-bold uppercase tracking-wider">O problema</span>
              <h2 className="text-3xl font-bold mt-2 mb-6">Você ainda gerencia tudo pelo WhatsApp?</h2>
              <div className="space-y-3">
                {[
                  'Clientes somem depois de confirmar',
                  'Você perde tempo respondendo mensagens',
                  'Sua agenda vira uma bagunça',
                  'Falta de hora, você perde dinheiro',
                  'Nenhum controle do que entrou no mês',
                ].map(p => (
                  <div key={p} className="flex items-center gap-3 text-slate-300">
                    <X size={16} className="text-rose-400 flex-shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-green-400 text-sm font-bold uppercase tracking-wider">A solução</span>
              <h2 className="text-3xl font-bold mt-2 mb-6">Com o AgendaPro, tudo no automático</h2>
              <div className="space-y-3">
                {[
                  'Lembrete automático via WhatsApp — zero falta',
                  'Clientes agendam sozinhos pelo link',
                  'Agenda organizada em tempo real',
                  'Horário bloqueado automaticamente',
                  'Dashboard com faturamento do dia',
                ].map(p => (
                  <div key={p} className="flex items-center gap-3 text-slate-200">
                    <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors">
                Resolver meu problema agora <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10" style={{ textAlign: 'center' }}>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Para qual profissional você é?</h2>
            <p className="text-slate-600">Feito especialmente para prestadores de serviço como você</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/marketplace?category=${cat.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-xs font-medium text-slate-700 text-center group-hover:text-indigo-600">{cat.name}</span>
                <span className="text-xs text-slate-400">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16 bg-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
            <div className="mb-8" style={{ textAlign: 'center' }}>
              <span className="text-indigo-600 text-sm font-bold uppercase tracking-wider">Calculadora de ROI</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-2">Quanto você pode ganhar a mais?</h2>
              <p className="text-slate-500">Veja o impacto real do AgendaPro no seu faturamento</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { emoji: '✂️', role: 'Barbeiro', clients: 8, price: 50, extra: '+R$1.200/mês', desc: '8 clientes/dia × R$50 × 3 novos dias/semana' },
                { emoji: '💇', role: 'Cabeleireira', clients: 5, price: 120, extra: '+R$2.400/mês', desc: '5 clientes/dia × R$120 × 4 novos dias/mês' },
                { emoji: '⚡', role: 'Eletricista', clients: 3, price: 200, extra: '+R$1.800/mês', desc: '3 serviços extras × R$200 × 3 semanas' },
              ].map(r => (
                <div key={r.role} className="bg-slate-50 rounded-2xl p-6 text-center border-2 border-transparent hover:border-indigo-200 transition-colors">
                  <div className="text-4xl mb-2">{r.emoji}</div>
                  <div className="font-bold text-slate-900 text-lg">{r.role}</div>
                  <div className="text-3xl font-bold text-emerald-600 mt-2 mb-1">{r.extra}</div>
                  <div className="text-xs text-slate-500">{r.desc}</div>
                </div>
              ))}
            </div>
            <div className="bg-indigo-600 rounded-2xl p-6 text-white" style={{ textAlign: 'center' }}>
              <div className="text-indigo-200 text-sm mb-1">Investimento no Pro: R$49/mês</div>
              <div className="text-2xl font-bold">ROI médio: <span className="text-amber-300">2.400%</span> no primeiro mês</div>
              <div className="text-indigo-200 text-sm mt-1">Para cada R$1 investido, você retorna R$25</div>
              <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                Quero esse retorno <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14" style={{ textAlign: 'center' }}>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Pronto em 3 passos</h2>
            <p className="text-slate-600 text-lg">Do cadastro ao primeiro agendamento em menos de 5 minutos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: <Users size={28} className="text-indigo-600" />, title: 'Crie seu perfil', desc: 'Cadastre seus serviços, preços e horários. Personalize com fotos dos seus trabalhos.', time: '2 min' },
              { step: '02', icon: <Calendar size={28} className="text-indigo-600" />, title: 'Compartilhe seu link', desc: 'Cole no Instagram, WhatsApp, Google Meu Negócio. Clientes agendam em 30 segundos.', time: '1 min' },
              { step: '03', icon: <TrendingUp size={28} className="text-indigo-600" />, title: 'Receba e cresça', desc: 'Sistema confirma, lembra e organiza tudo. Você só atende e fatura.', time: 'automático' },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-indigo-400 mb-2 flex items-center justify-center gap-2">
                  PASSO {item.step}
                  <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                    <Timer size={10} /> {item.time}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-1">Profissionais em destaque</h2>
              <p className="text-slate-600">Os mais bem avaliados — já usando o AgendaPro</p>
            </div>
            <Link to="/marketplace" className="hidden md:flex items-center gap-1 text-indigo-600 font-medium hover:underline">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((pro) => (
              <Link key={pro.id} to={`/professional/${pro.id}`} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden group">
                <div className="relative h-40 overflow-hidden">
                  <img src={pro.coverImage} alt={pro.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {pro.plan === 'pro' && (
                    <span className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">PRO</span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <img src={pro.avatar} alt={pro.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow -mt-8 relative z-10" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{pro.name}</h3>
                      <p className="text-indigo-600 text-sm font-medium truncate">{pro.specialty}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StarRating rating={pro.rating} showCount count={pro.reviewCount} />
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Users size={12} /> {pro.completedServices} serviços
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-2 line-clamp-2">{pro.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">📍 {pro.city}, {pro.state}</span>
                    <span className="text-sm font-semibold text-indigo-600">
                      A partir de R${Math.min(...pro.services.map(s => s.price))}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8" style={{ textAlign: 'center' }}>
            <Link to="/marketplace" className="inline-flex items-center gap-2 text-indigo-600 font-medium border border-indigo-200 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
              Ver todos os profissionais <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14" style={{ textAlign: 'center' }}>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Tudo que você precisa, num só lugar</h2>
            <p className="text-slate-600">Sem integrar 5 ferramentas diferentes. Tudo aqui.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Calendar className="text-indigo-600" size={24} />, title: 'Calendário Inteligente', desc: 'Gerencie seus horários, bloqueie datas e visualize toda sua agenda em um clique.', badge: '' },
              { icon: <MessageCircle className="text-green-600" size={24} />, title: 'WhatsApp Automático', desc: 'Confirmações e lembretes automáticos. Reduza faltas em até 70%. Sem você digitar nada.', badge: 'PRO' },
              { icon: <Star className="text-amber-500" size={24} />, title: 'Avaliações Verificadas', desc: 'Construa sua reputação online com avaliações reais. Apareça no topo das buscas.', badge: '' },
              { icon: <Smartphone className="text-purple-600" size={24} />, title: '100% Mobile', desc: 'Seus clientes agendam em 30 segundos pelo celular, sem baixar nenhum app.', badge: '' },
              { icon: <TrendingUp className="text-indigo-600" size={24} />, title: 'Marketing Automático', desc: 'Banners, cupons, posts prontos para Instagram e WhatsApp com 1 clique.', badge: 'PRO' },
              { icon: <DollarSign className="text-emerald-600" size={24} />, title: 'Relatórios de Receita', desc: 'Saiba exatamente quanto entrou hoje, essa semana e esse mês. Sem surpresas.', badge: 'PRO' },
              { icon: <Shield className="text-slate-600" size={24} />, title: 'Pagamento Online', desc: 'Aceite Pix e cartão antes do atendimento. Acabe com os no-shows de vez.', badge: 'EM BREVE' },
              { icon: <Users className="text-indigo-600" size={24} />, title: 'CRM de Clientes', desc: 'Histórico completo, aniversários, preferências. Trate cada cliente como VIP.', badge: '' },
              { icon: <Clock className="text-rose-500" size={24} />, title: 'Página no Marketplace', desc: 'Apareça para clientes que buscam seu serviço na sua cidade. Tráfego grátis.', badge: '' },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all relative">
                {f.badge && (
                  <span className={`absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full ${f.badge === 'PRO' ? 'bg-amber-100 text-amber-700' : f.badge === 'EM BREVE' ? 'bg-slate-100 text-slate-500' : ''}`}>
                    {f.badge}
                  </span>
                )}
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — detailed */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14" style={{ textAlign: 'center' }}>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Profissionais reais, resultados reais</h2>
            <p className="text-slate-600">Mais de 2.000 profissionais já transformaram seus negócios</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Carlos Barbosa', role: 'Barbeiro · SP', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face', comment: 'Em 30 dias triplicei os agendamentos. Antes era tudo bagunça no WhatsApp. Agora a agenda enche sozinha e os clientes recebem lembrete automático. Zero falta.', result: '+R$3.200/mês', time: 'Usa há 8 meses' },
              { name: 'Ana Paula Costa', role: 'Cabeleireira · SP', img: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=60&h=60&fit=crop&crop=face', comment: 'Perdia 2 horas por dia só confirmando horário no WhatsApp. Hoje é tudo automático. Ganhei tempo e aumentei o faturamento em 40%. Melhor investimento que fiz.', result: '+R$2.800/mês', time: 'Usa há 6 meses' },
              { name: 'Roberto Elétrica', role: 'Eletricista · SP', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=60&h=60&fit=crop&crop=face', comment: 'Profissionalizei completamente meu atendimento. Consegui clientes corporativos que antes nem me ligavam. O marketplace me deu visibilidade que nunca tive.', result: '+R$4.100/mês', time: 'Usa há 4 meses' },
            ].map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">"{t.comment}"</p>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                      <div className="text-slate-400 text-xs">{t.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-600 font-bold text-sm">{t.result}</div>
                    <div className="text-slate-400 text-xs">{t.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview with toggle */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" style={{ textAlign: 'center' }}>
          <h2 className="text-3xl font-bold text-white mb-2">Comece grátis. Cresça com o Pro.</h2>
          <p className="text-indigo-100 text-lg mb-6">Sem surpresas. Cancele quando quiser.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-full p-1 mb-8">
            <button onClick={() => setBillingAnnual(false)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!billingAnnual ? 'bg-white text-indigo-700' : 'text-indigo-100'}`}>
              Mensal
            </button>
            <button onClick={() => setBillingAnnual(true)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${billingAnnual ? 'bg-white text-indigo-700' : 'text-indigo-100'}`}>
              Anual
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">-30%</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-left">
              <div className="text-white font-bold text-lg mb-1">Gratuito</div>
              <div className="text-indigo-200 text-sm mb-4">Sempre grátis · Sem cartão</div>
              <div className="text-4xl font-bold text-white mb-4">R$0</div>
              {['Perfil público básico', '20 agendamentos/mês', 'Calendário online', 'Avaliações de clientes', 'Link de agendamento'].map(f => (
                <div key={f} className="flex items-center gap-2 text-indigo-100 text-sm mb-2">
                  <CheckCircle size={14} className="text-green-400 flex-shrink-0" /> {f}
                </div>
              ))}
              <Link to="/register" className="mt-4 block w-full text-center bg-white/20 hover:bg-white/30 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                Criar conta grátis
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-6 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                MAIS POPULAR
              </div>
              <div className="text-indigo-700 font-bold text-lg mb-1">Pro ✨</div>
              <div className="text-slate-500 text-sm mb-4">Tudo ilimitado</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold text-slate-900">
                  R${billingAnnual ? '34' : '49'}
                </span>
                <span className="text-slate-400">/mês</span>
              </div>
              {billingAnnual && <div className="text-xs text-emerald-600 font-medium mb-3">Cobrado anualmente · Economize R$180/ano</div>}
              {!billingAnnual && <div className="text-xs text-slate-400 mb-3">ou R$34/mês no plano anual</div>}
              {['Agendamentos ilimitados', 'WhatsApp automático', 'Ferramentas de marketing', 'Destaque no marketplace', 'Relatórios avançados', 'Suporte prioritário'].map(f => (
                <div key={f} className="flex items-center gap-2 text-slate-700 text-sm mb-2">
                  <CheckCircle size={14} className="text-indigo-500 flex-shrink-0" /> {f}
                </div>
              ))}
              <Link to="/pricing" className="mt-4 block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                Assinar Pro — R${billingAnnual ? '34' : '49'}/mês
              </Link>
            </div>
          </div>
          <p className="text-indigo-200 text-xs">🔒 Pagamento seguro via Stripe · SSL · Cancele quando quiser</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4" style={{ textAlign: 'center' }}>
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold mb-4">Pronto para ter mais clientes e faturar mais?</h2>
          <p className="text-slate-400 mb-8 text-lg">Junte-se a mais de 2.400 profissionais que já transformaram seus negócios.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-indigo-500 transition-colors shadow-xl">
            Criar minha conta grátis <ArrowRight size={20} />
          </Link>
          <p className="text-slate-500 text-sm mt-4">Sem cartão · Configurado em 5 min · Suporte em português</p>
        </div>
      </section>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
          <div className="bg-white rounded-2xl p-4 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900">Como funciona o AgendaPro</span>
              <button onClick={() => setShowVideo(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <Play size={48} className="mx-auto mb-3 text-slate-400" />
                <p className="text-slate-400">Vídeo demonstrativo</p>
                <p className="text-slate-500 text-sm">(Adicione o link do seu vídeo aqui)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
