import { useEffect, useState } from 'react'
import { Share2, Tag, Image, Megaphone, Copy, ExternalLink, Gift, Zap, CheckCircle, Loader2, Save, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

type CouponSettings = {
  code: string
  discount: string
  type: 'percent' | 'fixed'
}

type MarketingSettings = {
  coupon: CouponSettings
  selectedPost: number
}

type MarketingProfileRow = {
  marketing_settings?: Partial<MarketingSettings> | null
}

const defaultCoupon: CouponSettings = { code: 'PROMO10', discount: '10', type: 'percent' }
function normalizeMarketingSettings(value?: Partial<MarketingSettings> | null): MarketingSettings {
  return {
    coupon: { ...defaultCoupon, ...(value?.coupon ?? {}) },
    selectedPost: typeof value?.selectedPost === 'number' ? value.selectedPost : 0,
  }
}

export default function DashboardMarketing() {
  const { user, profile, isAdmin } = useAuth()
  const [copied, setCopied] = useState(false)
  const [coupon, setCoupon] = useState<CouponSettings>(defaultCoupon)
  const [selectedPost, setSelectedPost] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(() => Boolean(user))
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const publicBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://agendapro-azure.vercel.app')
  const bookingLink = !isAdmin && profile?.slug ? `${publicBaseUrl}/book/${profile.slug}` : 'Perfil de teste sem link público'

  const name = profile?.full_name ?? 'Profissional'
  const profession = profile?.profession ?? 'seus serviços'

  useEffect(() => {
    if (!user) return

    let ignore = false

    const loadSettings = async () => {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('profiles')
        .select('marketing_settings')
        .eq('id', user.id)
        .maybeSingle()

      if (ignore) return

      if (error) {
        setErrorMessage('Não foi possível carregar os dados de marketing.')
        setLoading(false)
        return
      }

      const row = data as MarketingProfileRow | null
      const settings = normalizeMarketingSettings(row?.marketing_settings)
      setCoupon(settings.coupon)
      setSelectedPost(settings.selectedPost)
      setLoading(false)
    }

    void loadSettings()

    return () => {
      ignore = true
    }
  }, [user])

  const showFeedback = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2500)
  }

  const persistMarketing = async (nextCoupon: CouponSettings, nextSelectedPost: number) => {
    if (!user) return

    setSaving(true)
    setErrorMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        marketing_settings: {
          coupon: nextCoupon,
          selectedPost: nextSelectedPost,
        },
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      setErrorMessage('Não foi possível salvar as configurações de marketing.')
      return
    }

    showFeedback('Configurações de marketing salvas.')
  }

  const posts = [
    `Olá! Sou ${name}, especialista em ${profession}.\n\nAgende agora pelo link:\n${bookingLink}\n\nAtendimento prático e rápido!`,
    `Promoção especial!\n\nUtilize o cupom ${coupon.code} e ganhe ${coupon.discount}${coupon.type === 'percent' ? '%' : ' reais'} de desconto.\n\nAgende: ${bookingLink}\n\nVaga limitada!`,
    `Obrigado a todos os clientes!\n\nSua confiança é o que me motiva a fazer cada vez melhor.\n\nAgende seu horário: ${bookingLink}`,
  ]

  const tools = [
    { id: 'share', icon: <Share2 size={24} className="text-indigo-600" />, title: 'Link de agendamento', desc: 'Leva você direto para o link principal', color: 'bg-indigo-50 border-indigo-200' },
    { id: 'coupon', icon: <Tag size={24} className="text-amber-600" />, title: 'Cupom de desconto', desc: 'Abre o criador de cupom logo abaixo', color: 'bg-amber-50 border-amber-200' },
    { id: 'banner', icon: <Image size={24} className="text-purple-600" />, title: 'Banner promocional', desc: 'Copia um texto base para usar no banner', color: 'bg-purple-50 border-purple-200' },
    { id: 'promo', icon: <Megaphone size={24} className="text-rose-600" />, title: 'Criar promoção', desc: 'Seleciona um post promocional pronto', color: 'bg-rose-50 border-rose-200' },
    { id: 'post', icon: <Zap size={24} className="text-green-600" />, title: 'Post para redes sociais', desc: 'Vai para os modelos de post prontos', color: 'bg-green-50 border-green-200' },
    { id: 'gift', icon: <Gift size={24} className="text-sky-600" />, title: 'Pacote especial', desc: 'Prepara um cupom especial para divulgar pacote', color: 'bg-sky-50 border-sky-200' },
  ]

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    showFeedback('Link copiado com sucesso.')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNetworkShare = (network: string) => {
    const socialText = `Olá! Agende seu horário comigo por aqui: ${bookingLink}`

    if (network === 'WhatsApp') {
      const text = encodeURIComponent(socialText)
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
      showFeedback('WhatsApp aberto com sua mensagem pronta.')
      return
    }

    if (network === 'Facebook') {
      const shareUrl = encodeURIComponent(bookingLink)
      const quote = encodeURIComponent(socialText)
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${quote}`, '_blank', 'noopener,noreferrer')
      showFeedback('Facebook aberto para compartilhar seu link.')
      return
    }

    if (network === 'Instagram') {
      navigator.clipboard.writeText(socialText)
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
      showFeedback('Texto copiado e Instagram aberto para você colar na legenda ou no story.')
      return
    }

    navigator.clipboard.writeText(socialText)
    window.open('https://www.tiktok.com/upload?lang=pt-BR', '_blank', 'noopener,noreferrer')
    showFeedback('Texto copiado e TikTok aberto para você montar a publicação.')
  }

  const applyToolSelection = (toolId: string) => {
    if (toolId === 'share') {
      scrollToSection('marketing-link')
      showFeedback('Area do link aberta para compartilhamento.')
      return { nextCoupon: coupon, nextSelectedPost: selectedPost }
    }

    if (toolId === 'coupon') {
      scrollToSection('marketing-coupon')
      showFeedback('Criador de cupom aberto.')
      return { nextCoupon: coupon, nextSelectedPost: selectedPost }
    }

    if (toolId === 'banner') {
      navigator.clipboard.writeText(`Banner promocional\n\n${name} - ${profession}\nAgende em: ${bookingLink}`)
      showFeedback('Texto base de banner copiado.')
      return { nextCoupon: coupon, nextSelectedPost: selectedPost }
    }

    if (toolId === 'promo') {
      scrollToSection('marketing-posts')
      showFeedback('Modelo promocional selecionado.')
      return { nextCoupon: coupon, nextSelectedPost: 1 }
    }

    if (toolId === 'post') {
      scrollToSection('marketing-posts')
      showFeedback('Modelos de post abertos.')
      return { nextCoupon: coupon, nextSelectedPost: 0 }
    }

    scrollToSection('marketing-coupon')
    showFeedback('Cupom de pacote preparado para você.')
    return {
      nextCoupon: { code: 'PACOTE15', discount: '15', type: 'percent' as const },
      nextSelectedPost: selectedPost,
    }
  }

  const handleToolClick = async (toolId: string) => {
    const { nextCoupon, nextSelectedPost } = applyToolSelection(toolId)
    setCoupon(nextCoupon)
    setSelectedPost(nextSelectedPost)
    await persistMarketing(nextCoupon, nextSelectedPost)
  }

  const handleCouponChange = (field: keyof CouponSettings, value: string) => {
    setCoupon(current => ({ ...current, [field]: value } as CouponSettings))
  }

  const handlePostSelect = async (index: number) => {
    setSelectedPost(index)
    await persistMarketing(coupon, index)
  }

  const handleSaveCoupon = async () => {
    await persistMarketing(coupon, selectedPost)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
        <p className="mt-0.5 text-sm text-slate-500">Ferramentas para divulgar seu negócio</p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      {feedback && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle size={16} /> {feedback}
        </div>
      )}

      <div id="marketing-link" className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="mb-1 text-lg font-bold">Seu link de agendamento</h2>
            <p className="text-sm text-indigo-100">Compartilhe este link para que clientes agendem diretamente</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {loading ? 'Carregando preferências' : saving ? 'Salvando no perfil' : 'Salvo no perfil'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1 truncate rounded-xl bg-white/10 px-4 py-3 font-mono text-sm backdrop-blur">
            {bookingLink}
          </div>
          <button onClick={handleCopyLink} className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50">
            <Copy size={14} /> {copied ? 'Copiado!' : 'Copiar'}
          </button>
          {profile?.slug && (
            <a href={`/book/${profile.slug}`} target="_blank" rel="noreferrer" className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/30">
              <ExternalLink size={14} /> Ver
            </a>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {['WhatsApp', 'Instagram', 'Facebook', 'TikTok'].map(network => (
            <button key={network} onClick={() => handleNetworkShare(network)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20">
              {network}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(tool => (
          <button key={tool.id} onClick={() => void handleToolClick(tool.id)} className={`rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md ${tool.color}`}>
            <div className="mb-3">{tool.icon}</div>
            <h3 className="mb-1 font-semibold text-slate-900">{tool.title}</h3>
            <p className="text-sm text-slate-500">{tool.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div id="marketing-coupon" className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Tag size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Criar cupom de desconto</h3>
              <p className="text-xs text-slate-500">Compartilhe com seus clientes</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Código do cupom</label>
              <input value={coupon.code} onChange={event => handleCouponChange('code', event.target.value.toUpperCase())} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono uppercase outline-none focus:border-amber-400" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Desconto</label>
                <input type="number" value={coupon.discount} onChange={event => handleCouponChange('discount', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
                <select value={coupon.type} onChange={event => handleCouponChange('type', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400">
                  <option value="percent">Porcentagem (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <div className="mb-1 text-xs text-amber-600">Previa do cupom</div>
            <div className="font-mono text-2xl font-bold text-amber-700">{coupon.code}</div>
            <div className="text-sm text-amber-600">{coupon.discount}{coupon.type === 'percent' ? '%' : ' reais'} de desconto</div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={() => { navigator.clipboard.writeText(`Use o cupom ${coupon.code} e ganhe ${coupon.discount}${coupon.type === 'percent' ? '%' : ' reais'} de desconto! Agende: ${bookingLink}`); showFeedback('Texto do cupom copiado.'); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600">
              <Share2 size={14} /> Compartilhar cupom
            </button>
            <button onClick={() => void handleSaveCoupon()} disabled={saving || loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-70">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar
            </button>
          </div>
        </div>

        <div id="marketing-posts" className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Zap size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Posts para redes sociais</h3>
              <p className="text-xs text-slate-500">Textos prontos com seu link</p>
            </div>
          </div>
          <div className="mb-3 flex gap-2">
            {posts.map((_, index) => (
              <button key={index} onClick={() => void handlePostSelect(index)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selectedPost === index ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                Modelo {index + 1}
              </button>
            ))}
          </div>
          <textarea readOnly value={posts[selectedPost]} rows={8} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" />
          <button onClick={() => { navigator.clipboard.writeText(posts[selectedPost]); showFeedback('Texto do post copiado.'); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600">
            <Copy size={14} /> Copiar texto
          </button>
        </div>
      </div>
    </div>
  )
}

