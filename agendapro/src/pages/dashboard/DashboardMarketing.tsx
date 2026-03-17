import { useState } from 'react'
import { Share2, Tag, Image, Megaphone, Copy, ExternalLink, Gift, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function DashboardMarketing() {
  const { profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [coupon, setCoupon] = useState({ code: 'PROMO10', discount: '10', type: 'percent' })
  const [selectedPost, setSelectedPost] = useState(0)

  const bookingLink = profile?.slug
    ? `https://agendapro-azure.vercel.app/book/${profile.slug}`
    : 'Carregando...'

  const name = profile?.full_name ?? 'Profissional'
  const profession = profile?.profession ?? 'seus serviços'

  const posts = [
    `✨ Olá! Sou ${name}, especialista em ${profession}.\n\n🗓️ Agende agora pelo link:\n${bookingLink}\n\n📲 Atendimento prático e rápido!\n\n#Agendamento #${profession.replace(/\s/g, '')}`,
    `🔥 Promoção especial!\n\nUtilize o cupom ${coupon.code} e ganhe ${coupon.discount}${coupon.type === 'percent' ? '%' : ' reais'} de desconto.\n\n📲 Agende: ${bookingLink}\n\nVaga limitada! Não perca!`,
    `⭐ Obrigado a todos os clientes!\n\nSua confiança é o que me motiva a fazer cada vez melhor.\n\n🗓️ Agende seu horário: ${bookingLink}`,
  ]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tools = [
    { id: 'share', icon: <Share2 size={24} className="text-indigo-600" />, title: 'Link de agendamento', desc: 'Compartilhe seu link personalizado nas redes sociais', color: 'bg-indigo-50 border-indigo-200' },
    { id: 'coupon', icon: <Tag size={24} className="text-amber-600" />, title: 'Cupom de desconto', desc: 'Crie cupons para atrair novos clientes', color: 'bg-amber-50 border-amber-200' },
    { id: 'banner', icon: <Image size={24} className="text-purple-600" />, title: 'Banner promocional', desc: 'Gere banners para postar no Instagram e WhatsApp', color: 'bg-purple-50 border-purple-200' },
    { id: 'promo', icon: <Megaphone size={24} className="text-rose-600" />, title: 'Criar promoção', desc: 'Oferta especial por tempo limitado', color: 'bg-rose-50 border-rose-200' },
    { id: 'post', icon: <Zap size={24} className="text-green-600" />, title: 'Post para redes sociais', desc: 'Gere texto pronto para postar', color: 'bg-green-50 border-green-200' },
    { id: 'gift', icon: <Gift size={24} className="text-sky-600" />, title: 'Pacote especial', desc: 'Crie pacotes de serviços com desconto', color: 'bg-sky-50 border-sky-200' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
        <p className="text-slate-500 text-sm mt-0.5">Ferramentas para divulgar seu negócio</p>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
        <h2 className="font-bold text-lg mb-1">Seu link de agendamento</h2>
        <p className="text-indigo-100 text-sm mb-4">Compartilhe este link para que clientes agendem diretamente</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-sm font-mono truncate min-w-0">
            {bookingLink}
          </div>
          <button onClick={handleCopyLink} className="bg-white text-indigo-700 px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-indigo-50 transition-colors flex-shrink-0">
            <Copy size={14} /> {copied ? 'Copiado!' : 'Copiar'}
          </button>
          {profile?.slug && (
            <a href={`/book/${profile.slug}`} target="_blank" rel="noreferrer" className="bg-white/20 text-white px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-white/30 transition-colors flex-shrink-0">
              <ExternalLink size={14} /> Ver
            </a>
          )}
        </div>
        <div className="flex gap-3 mt-4 flex-wrap">
          {['WhatsApp', 'Instagram', 'Facebook', 'TikTok'].map(net => (
            <button key={net} onClick={() => navigator.clipboard.writeText(bookingLink)}
              className="bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium">
              {net}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tools.map(tool => (
          <button key={tool.id} className={`text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md ${tool.color}`}>
            <div className="mb-3">{tool.icon}</div>
            <h3 className="font-semibold text-slate-900 mb-1">{tool.title}</h3>
            <p className="text-sm text-slate-500">{tool.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Tag size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Criar cupom de desconto</h3>
              <p className="text-xs text-slate-500">Compartilhe com seus clientes</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Código do cupom</label>
              <input value={coupon.code} onChange={e => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 font-mono uppercase" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Desconto</label>
                <input type="number" value={coupon.discount} onChange={e => setCoupon({ ...coupon, discount: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
                <select value={coupon.type} onChange={e => setCoupon({ ...coupon, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400">
                  <option value="percent">Porcentagem (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-amber-50 rounded-xl text-center border border-amber-200">
            <div className="text-xs text-amber-600 mb-1">Prévia do cupom</div>
            <div className="text-2xl font-bold text-amber-700 font-mono">{coupon.code}</div>
            <div className="text-sm text-amber-600">{coupon.discount}{coupon.type === 'percent' ? '%' : ' reais'} de desconto</div>
          </div>
          <button onClick={() => navigator.clipboard.writeText(`Use o cupom ${coupon.code} e ganhe ${coupon.discount}${coupon.type === 'percent' ? '%' : ' reais'} de desconto! Agende: ${bookingLink}`)}
            className="w-full mt-4 bg-amber-500 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
            <Share2 size={14} /> Compartilhar cupom
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Posts para redes sociais</h3>
              <p className="text-xs text-slate-500">Textos prontos com seu link</p>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            {posts.map((_, i) => (
              <button key={i} onClick={() => setSelectedPost(i)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${selectedPost === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                Modelo {i + 1}
              </button>
            ))}
          </div>
          <textarea readOnly value={posts[selectedPost]} rows={8}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-none bg-slate-50 outline-none" />
          <button onClick={() => navigator.clipboard.writeText(posts[selectedPost])}
            className="w-full mt-3 bg-green-500 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
            <Copy size={14} /> Copiar texto
          </button>
        </div>
      </div>
    </div>
  )
}
