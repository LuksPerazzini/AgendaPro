import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, MessageCircle, Star, Zap, Users, TrendingUp, Calendar } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={42} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bem-vindo ao Pro! 🎉</h1>
          <p className="text-slate-500 mb-6">Seu pagamento foi confirmado. Todas as funcionalidades Pro já estão ativas.</p>

          <div className="bg-indigo-50 rounded-2xl p-5 text-left mb-6">
            <div className="text-indigo-700 font-bold text-sm mb-3">✨ O que você desbloqueou agora:</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <MessageCircle size={14} className="text-green-600" />, text: 'WhatsApp automático' },
                { icon: <Star size={14} className="text-amber-500" />, text: 'Destaque no marketplace' },
                { icon: <TrendingUp size={14} className="text-indigo-600" />, text: 'Ferramentas de marketing' },
                { icon: <Calendar size={14} className="text-indigo-600" />, text: 'Agendamentos ilimitados' },
                { icon: <Users size={14} className="text-purple-600" />, text: 'Relatórios avançados' },
                { icon: <Zap size={14} className="text-amber-500" />, text: 'Suporte prioritário' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 text-sm text-indigo-800">
                  {item.icon} {item.text}
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/dashboard"
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            Ir para meu painel <ArrowRight size={20} />
          </Link>
        </div>

        {/* Referral Bonus */}
        <div className="bg-amber-400 rounded-2xl p-5 text-center text-amber-900">
          <div className="font-bold text-lg mb-1">💰 Indique e ganhe R$25</div>
          <p className="text-amber-800 text-sm mb-3">Para cada amigo que assinar o Pro, você recebe R$25 de crédito</p>
          <Link to="/dashboard/afiliados" className="inline-flex items-center gap-2 bg-amber-900 text-amber-100 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-800 transition-colors">
            Ver meu link de indicação <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
