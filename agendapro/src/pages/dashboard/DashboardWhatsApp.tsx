import { MessageCircle, Bell, CheckCircle, Settings, Zap } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function DashboardWhatsApp() {
  const { profile } = useAuth()
  const [settings, setSettings] = useState({
    confirmacao: true,
    lembrete24h: true,
    lembrete1h: false,
    cancelamento: true,
    avaliacaoPos: true,
  })

  const toggle = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key] }))

  const isProPlan = profile?.plan === 'pro' || profile?.plan === 'business'
  const phone = profile?.phone ?? null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Integração WhatsApp</h1>
        <p className="text-slate-500 text-sm mt-0.5">Automação de mensagens para seus clientes</p>
      </div>

      {!isProPlan && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <div className="text-2xl">🔒</div>
          <div>
            <div className="font-bold text-amber-800 mb-1">Recurso exclusivo do Plano Pro</div>
            <p className="text-sm text-amber-700 mb-3">A automação de WhatsApp está disponível apenas nos planos Pro e Business.</p>
            <Link to="/pricing" className="inline-block bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors">
              Fazer upgrade agora
            </Link>
          </div>
        </div>
      )}

      <div className={`bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-8 text-white ${!isProPlan ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MessageCircle size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{phone ? 'WhatsApp configurado' : 'WhatsApp não configurado'}</h2>
            <p className="text-green-100">
              {phone ? `Número: ${phone}` : 'Configure seu número em Configurações → Perfil'}
            </p>
          </div>
          {phone && isProPlan && (
            <span className="bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              Ativo
            </span>
          )}
        </div>
        {isProPlan && (
          <div className="grid grid-cols-3 gap-4 mt-5">
            {[
              { label: 'Mensagens enviadas', value: '0' },
              { label: 'Taxa de abertura', value: '—' },
              { label: 'Confirmações', value: '—' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-green-100">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`bg-white rounded-2xl border border-slate-100 p-6 mb-6 ${!isProPlan ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="font-bold text-slate-900 mb-1">Automações ativas</h3>
        <p className="text-sm text-slate-500 mb-5">Configure quais mensagens são enviadas automaticamente</p>
        <div className="space-y-4">
          {[
            { key: 'confirmacao', icon: <CheckCircle size={18} className="text-green-500" />, title: 'Confirmação de agendamento', desc: 'Enviada imediatamente após o cliente agendar' },
            { key: 'lembrete24h', icon: <Bell size={18} className="text-indigo-500" />, title: 'Lembrete 24h antes', desc: 'Lembrete enviado 24 horas antes do agendamento' },
            { key: 'lembrete1h', icon: <Bell size={18} className="text-amber-500" />, title: 'Lembrete 1h antes', desc: 'Lembrete enviado 1 hora antes do agendamento' },
            { key: 'cancelamento', icon: <Settings size={18} className="text-rose-500" />, title: 'Notificação de cancelamento', desc: 'Avisa o cliente quando o agendamento é cancelado' },
            { key: 'avaliacaoPos', icon: <Zap size={18} className="text-purple-500" />, title: 'Pedido de avaliação', desc: 'Pede avaliação após o atendimento ser concluído' },
          ].map(item => (
            <div key={item.key} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">{item.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="text-sm text-slate-500">{item.desc}</div>
              </div>
              <button onClick={() => toggle(item.key as keyof typeof settings)}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={`bg-white rounded-2xl border border-slate-100 p-6 ${!isProPlan ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="font-bold text-slate-900 mb-1">Templates de mensagem</h3>
        <p className="text-sm text-slate-500 mb-5">Personalize os textos enviados automaticamente</p>
        <div className="space-y-4">
          {[
            { label: 'Confirmação de agendamento', template: 'Olá, {nome}! Seu agendamento foi confirmado ✅\n\n📋 Serviço: {servico}\n📅 Data: {data} às {hora}\n\nAté lá! 😊' },
            { label: 'Lembrete 24h antes', template: 'Olá, {nome}! 🔔 Lembrete: você tem um agendamento amanhã.\n\n📋 {servico}\n🕐 {hora}\n\nAté amanhã!' },
          ].map(t => (
            <div key={t.label}>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t.label}</label>
              <textarea defaultValue={t.template} rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-none outline-none focus:border-indigo-400 transition-colors" />
            </div>
          ))}
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            Salvar templates
          </button>
        </div>
      </div>
    </div>
  )
}
