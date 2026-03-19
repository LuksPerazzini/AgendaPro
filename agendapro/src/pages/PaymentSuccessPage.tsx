import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, MessageCircle, Star, TrendingUp, Calendar, Shield } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={42} className="text-green-500" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Bem-vindo ao Pro!</h1>
          <p className="mb-6 text-slate-500">
            Seu pagamento foi confirmado. Sua conta agora aparece com o plano Pro dentro da plataforma.
          </p>

          <div className="mb-6 rounded-2xl bg-indigo-50 p-5 text-left">
            <div className="mb-3 text-sm font-bold text-indigo-700">O que ja esta disponivel na sua conta:</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Star size={14} className="text-amber-500" />, text: 'Selo PRO no perfil' },
                { icon: <Shield size={14} className="text-indigo-600" />, text: 'Plano pago ativo' },
                { icon: <CheckCircle size={14} className="text-emerald-600" />, text: 'Galeria no perfil publico' },
                { icon: <TrendingUp size={14} className="text-indigo-600" />, text: 'Marketing no painel' },
                { icon: <Calendar size={14} className="text-indigo-600" />, text: 'Agenda no mesmo fluxo' },
                { icon: <MessageCircle size={14} className="text-green-600" />, text: 'Central WhatsApp' },
                { icon: <CheckCircle size={14} className="text-emerald-600" />, text: 'Conta pronta para uso' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 text-sm text-indigo-800">
                  {item.icon}
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white transition-colors hover:bg-indigo-700"
          >
            Ir para meu painel
            <ArrowRight size={20} />
          </Link>
        </div>

        <div className="rounded-2xl bg-amber-400 p-5 text-center text-amber-900">
          <div className="mb-1 text-lg font-bold">Indique e ganhe R$25</div>
          <p className="mb-3 text-sm text-amber-800">
            Quando um amigo entrar pelo seu link e assinar o Pro, voce recebe R$25 de credito.
          </p>
          <Link
            to="/dashboard/afiliados"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-900 px-5 py-2.5 text-sm font-bold text-amber-100 transition-colors hover:bg-amber-800"
          >
            Ver meu link de indicacao
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
