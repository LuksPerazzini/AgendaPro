import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Phone, MessageCircle, Share2, Star, Clock, ChevronLeft, Calendar, CheckCircle, Image, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import StarRating from '../components/StarRating'

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
}

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  client_name: string | null
}

type Pro = {
  id: string
  full_name: string
  profession: string
  bio: string | null
  city: string | null
  state: string | null
  phone: string | null
  avatar_url: string | null
  cover_url: string | null
  rating: number
  review_count: number
  slug: string
  plan: string
  services: Service[]
  reviews: Review[]
  photos: string[]
}

export default function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>()
  const [pro, setPro] = useState<Pro | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'services' | 'photos' | 'reviews'>('services')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)

      // Try slug first, then by id
      const query = supabase
        .from('profiles')
        .select('id, full_name, profession, bio, city, state, phone, avatar_url, cover_url, rating, review_count, slug, plan')

      const { data: bySlug } = await query.eq('slug', id).single()
      const profileData = bySlug ?? (await supabase.from('profiles').select('id, full_name, profession, bio, city, state, phone, avatar_url, cover_url, rating, review_count, slug, plan').eq('id', id).single()).data

      if (!profileData) { setLoading(false); return }

      const [{ data: servicesData }, { data: reviewsData }] = await Promise.all([
        supabase.from('services').select('id, name, description, price, duration_minutes').eq('profile_id', profileData.id).eq('active', true),
        supabase.from('reviews').select('id, rating, comment, created_at, client_name').eq('profile_id', profileData.id).order('created_at', { ascending: false }),
      ])

      setPro({
        ...profileData,
        services: (servicesData ?? []) as Service[],
        reviews: (reviewsData ?? []) as Review[],
        photos: [],
      } as Pro)
      setLoading(false)
    }
    load()
  }, [id])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 size={32} className="animate-spin" />
    </div>
  )

  if (!pro) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Profissional não encontrado.</p>
      <Link to="/marketplace" className="text-indigo-600 mt-2 inline-block">← Voltar ao marketplace</Link>
    </div>
  )

  const avgRating = pro.reviews.length
    ? pro.reviews.reduce((acc, r) => acc + r.rating, 0) / pro.reviews.length
    : pro.rating ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative h-56 md:h-72 overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-600">
        {pro.cover_url && <img src={pro.cover_url} alt={pro.full_name} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Link to="/marketplace" className="absolute top-4 left-4 bg-white/20 backdrop-blur text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-white/30 transition-colors">
          <ChevronLeft size={16} /> Voltar
        </Link>
        <button onClick={handleShare} className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-white/30 transition-colors">
          <Share2 size={16} /> {copied ? 'Copiado!' : 'Compartilhar'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {pro.avatar_url ? (
              <img src={pro.avatar_url} alt={pro.full_name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md -mt-10" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-indigo-500 border-4 border-white shadow-md -mt-10 flex items-center justify-center text-white font-bold text-4xl flex-shrink-0">
                {pro.full_name[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{pro.full_name}</h1>
                {pro.plan === 'pro' && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">PRO</span>
                )}
              </div>
              <p className="text-indigo-600 font-medium">{pro.profession}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <StarRating rating={avgRating} showCount count={pro.review_count ?? pro.reviews.length} />
                {pro.services.length > 0 && (
                  <span className="text-slate-500 text-sm flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500" /> {pro.services.length} serviços
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {pro.phone && (
                <a
                  href={`https://wa.me/55${pro.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none bg-green-500 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
              )}
              <Link
                to={`/book/${pro.slug}`}
                className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
              >
                <Calendar size={18} /> Agendar
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(pro.city || pro.state) && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-indigo-600">{[pro.city, pro.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {pro.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm">{pro.phone}</span>
              </div>
            )}
          </div>
          {pro.bio && <p className="mt-4 text-slate-600 text-sm leading-relaxed">{pro.bio}</p>}
        </div>

        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 shadow-sm border border-slate-100">
          {(['services', 'photos', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {tab === 'services' ? `Serviços (${pro.services.length})` : tab === 'photos' ? 'Fotos' : `Avaliações (${pro.reviews.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'services' && (
          <div className="space-y-3">
            {pro.services.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p>Nenhum serviço cadastrado ainda</p>
              </div>
            ) : pro.services.map(service => (
              <div key={service.id} className="bg-white rounded-xl p-5 border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{service.name}</h4>
                  {service.description && <p className="text-slate-500 text-sm mt-0.5">{service.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {service.duration_minutes} min
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-indigo-600">R${service.price}</div>
                  <Link
                    to={`/book/${pro.slug}?service=${service.id}`}
                    className="mt-1 text-xs font-medium bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors inline-block"
                  >
                    Agendar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            {pro.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {pro.photos.map((photo, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-200">
                    <img src={photo} alt={`Foto ${i+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Image size={48} className="mx-auto mb-3" />
                <p>Nenhuma foto adicionada ainda</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-slate-900">{avgRating.toFixed(1)}</div>
                  <StarRating rating={avgRating} />
                  <div className="text-xs text-slate-500 mt-1">{pro.reviews.length} avaliações</div>
                </div>
                <div className="flex-1">
                  {[5,4,3,2,1].map(stars => {
                    const count = pro.reviews.filter(r => r.rating === stars).length
                    const pct = pro.reviews.length ? (count / pro.reviews.length) * 100 : 0
                    return (
                      <div key={stars} className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500 w-3">{stars}</span>
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-4">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {pro.reviews.length > 0 ? pro.reviews.map(review => (
              <div key={review.id} className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {(review.client_name ?? 'C')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{review.client_name ?? 'Cliente'}</span>
                      <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                      ))}
                    </div>
                    {review.comment && <p className="text-slate-600 text-sm">{review.comment}</p>}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-slate-400">
                <Star size={40} className="mx-auto mb-3" />
                <p>Sem avaliações ainda</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
