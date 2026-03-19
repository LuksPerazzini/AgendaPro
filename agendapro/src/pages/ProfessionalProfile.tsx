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

const publicProfileSelectWithPhotos = 'id, full_name, profession, bio, city, state, phone, avatar_url, cover_url, rating, review_count, slug, plan, photos'
const publicProfileSelectLegacy = 'id, full_name, profession, bio, city, state, phone, avatar_url, cover_url, rating, review_count, slug, plan'

function normalizePhotos(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
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

      const bySlugWithPhotos = await supabase
        .from('public_profiles')
        .select(publicProfileSelectWithPhotos)
        .eq('slug', id)
        .single()

      const bySlugLegacy = bySlugWithPhotos.error
        ? await supabase
            .from('public_profiles')
            .select(publicProfileSelectLegacy)
            .eq('slug', id)
            .single()
        : null

      const profileBySlug = bySlugWithPhotos.data ?? bySlugLegacy?.data ?? null

      const byIdWithPhotos = profileBySlug
        ? null
        : await supabase
            .from('public_profiles')
            .select(publicProfileSelectWithPhotos)
            .eq('id', id)
            .single()

      const byIdLegacy = !profileBySlug && byIdWithPhotos?.error
        ? await supabase
            .from('public_profiles')
            .select(publicProfileSelectLegacy)
            .eq('id', id)
            .single()
        : null

      const profileData = profileBySlug ?? byIdWithPhotos?.data ?? byIdLegacy?.data ?? null

      if (!profileData) {
        setLoading(false)
        return
      }

      const [{ data: servicesData }, { data: reviewsData }] = await Promise.all([
        supabase.from('services').select('id, name, description, price, duration_minutes').eq('profile_id', profileData.id).eq('active', true),
        supabase.from('reviews').select('id, rating, comment, created_at, client_name').eq('profile_id', profileData.id).order('created_at', { ascending: false }),
      ])

      setPro({
        ...profileData,
        services: (servicesData ?? []) as Service[],
        reviews: (reviewsData ?? []) as Review[],
        photos: normalizePhotos((profileData as { photos?: unknown }).photos),
      } as Pro)
      setLoading(false)
    }

    void load()
  }, [id])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <Loader2 size={32} className="animate-spin" />
      </div>
    )
  }

  if (!pro) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Profissional não encontrado.</p>
        <Link to="/marketplace" className="mt-2 inline-block text-indigo-600">Voltar ao marketplace</Link>
      </div>
    )
  }

  const avgRating = pro.reviews.length
    ? pro.reviews.reduce((acc, review) => acc + review.rating, 0) / pro.reviews.length
    : pro.rating ?? 0

  const isPro = pro.plan === 'pro'
  const isBusiness = pro.plan === 'business'

  return (
    <div className="page-enter min-h-screen bg-transparent">
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-600 md:h-72">
        {pro.cover_url && <img src={pro.cover_url} alt={pro.full_name} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Link to="/marketplace" className="absolute left-4 top-4 flex items-center gap-1 rounded-lg bg-white/20 px-3 py-2 text-sm text-white backdrop-blur transition-colors hover:bg-white/30">
          <ChevronLeft size={16} /> Voltar
        </Link>
        <button onClick={handleShare} className="absolute right-4 top-4 flex items-center gap-1 rounded-lg bg-white/20 px-3 py-2 text-sm text-white backdrop-blur transition-colors hover:bg-white/30">
          <Share2 size={16} /> {copied ? 'Copiado!' : 'Compartilhar'}
        </button>
      </div>

      <div className="relative z-10 mx-auto mt-2 max-w-4xl px-4 pb-16 sm:mt-0 sm:px-6 md:-mt-2">
        <div className="public-panel mb-6 rounded-[2rem] p-6 shadow-[0_28px_65px_-42px_rgba(15,23,42,0.3)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
              {pro.avatar_url ? (
                <img src={pro.avatar_url} alt={pro.full_name} className="-mt-4 h-24 w-24 flex-shrink-0 rounded-3xl border-4 border-white object-cover shadow-[0_18px_34px_rgba(15,23,42,0.18)] sm:-mt-6 sm:h-28 sm:w-28" />
              ) : (
                <div className="-mt-4 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-indigo-500 text-4xl font-bold text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)] sm:-mt-6 sm:h-28 sm:w-28">
                  {pro.full_name[0]?.toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-3xl font-black leading-tight text-slate-900 sm:text-[2.15rem]">{pro.full_name}</h1>
                  {isPro && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">PRO</span>
                  )}
                  {isBusiness && (
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">BUSINESS</span>
                  )}
                </div>

                <p className="mt-2 text-base font-semibold text-indigo-600 sm:text-lg">{pro.profession}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <div className="flex items-center gap-2">
                    <StarRating rating={avgRating} showCount count={pro.review_count ?? pro.reviews.length} />
                  </div>
                  {pro.services.length > 0 && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                      <CheckCircle size={14} className="text-green-500" /> {pro.services.length} serviços ativos
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Agendamento online disponível
                  </span>
                  {pro.city && (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      {pro.city}{pro.state ? `, ${pro.state}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:justify-end">
              {pro.phone && (
                <a
                  href={`https://wa.me/55${pro.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-medium text-white transition-colors hover:bg-green-600 lg:flex-none"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
              )}
              <Link
                to={`/book/${pro.slug}`}
                className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700 lg:flex-none"
              >
                <Calendar size={18} /> Agendar
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
            {(pro.city || pro.state) && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-slate-400" />
                <span className="text-sm text-indigo-600">{[pro.city, pro.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {pro.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={16} className="flex-shrink-0 text-slate-400" />
                <span className="text-sm">{pro.phone}</span>
              </div>
            )}
          </div>
          {pro.bio && <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">{pro.bio}</p>}

          {(isPro || isBusiness) && (
            <div className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
              isBusiness
                ? 'border-slate-200 bg-slate-50 text-slate-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              <div className="font-semibold">
                {isBusiness ? 'Perfil Business em destaque' : 'Perfil Pro em destaque'}
              </div>
              <p className="mt-1 leading-6">
                {isBusiness
                  ? 'Esse profissional aparece com prioridade premium dentro da plataforma e carrega o plano mais alto disponível hoje.'
                  : 'Esse profissional aparece com destaque no marketplace e mostra um posicionamento mais forte dentro da plataforma.'}
              </p>
            </div>
          )}
        </div>

        <div className="public-panel mb-6 flex gap-1 rounded-2xl p-1 shadow-sm ring-1 ring-slate-100">
          {(['services', 'photos', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              {tab === 'services' ? `Serviços (${pro.services.length})` : tab === 'photos' ? 'Fotos' : `Avaliações (${pro.reviews.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'services' && (
          <div className="space-y-4">
            {pro.services.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p>Nenhum serviço cadastrado ainda</p>
              </div>
            ) : pro.services.map(service => (
              <div key={service.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{service.name}</h4>
                  {service.description && <p className="mt-0.5 text-sm text-slate-500">{service.description}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} /> {service.duration_minutes} min
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-indigo-600">R${service.price}</div>
                  <Link
                    to={`/book/${pro.slug}?service=${service.id}`}
                    className="mt-1 inline-block rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
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
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {pro.photos.map((photo, index) => (
                  <div key={index} className="group aspect-square overflow-hidden rounded-2xl bg-slate-200 shadow-sm ring-1 ring-slate-100">
                    <img src={photo} alt={`Foto ${index + 1}`} className="h-full w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Image size={48} className="mx-auto mb-3" />
                <p>Nenhuma foto adicionada ainda</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="public-panel rounded-2xl p-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-slate-900">{avgRating.toFixed(1)}</div>
                  <StarRating rating={avgRating} />
                  <div className="mt-1 text-xs text-slate-500">{pro.reviews.length} avaliações</div>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map(stars => {
                    const count = pro.reviews.filter(review => review.rating === stars).length
                    const pct = pro.reviews.length ? (count / pro.reviews.length) * 100 : 0
                    return (
                      <div key={stars} className="mb-1 flex items-center gap-2">
                        <span className="w-3 text-xs text-slate-500">{stars}</span>
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <div className="h-2 flex-1 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-4 text-xs text-slate-400">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {pro.reviews.length > 0 ? pro.reviews.map(review => (
              <div key={review.id} className="public-panel rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {(review.client_name ?? 'C')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{review.client_name ?? 'Cliente'}</span>
                      <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="mb-2 mt-0.5 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={12} className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
                      ))}
                    </div>
                    {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-slate-400">
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

