import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Users, SlidersHorizontal, X, Star, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { categories } from '../data/mockData'

const highlightedCategories = categories
const marketplaceCategories = [...highlightedCategories, { id: 'outros', name: 'Outros', icon: '🧰', count: 0 }]

type Pro = {
  id: string
  full_name: string
  profession: string
  bio: string | null
  city: string | null
  state: string | null
  avatar_url: string | null
  cover_url: string | null
  rating: number
  review_count: number
  slug: string
  plan: string
  min_price: number | null
  active_services: number
}

const planPriority: Record<string, number> = {
  business: 2,
  pro: 1,
  free: 0,
}

function getPlanPriority(plan: string) {
  return planPriority[plan] ?? 0
}

function getPrimaryProfessionName(profession: string) {
  return profession.split(' - ')[0].trim().toLowerCase()
}

export default function Marketplace() {
  const [pros, setPros] = useState<Pro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: profilesData } = await supabase
        .from('public_profiles')
        .select('id, full_name, profession, bio, city, state, avatar_url, cover_url, rating, review_count, slug, plan')
        .order('rating', { ascending: false })

      if (!profilesData) {
        setLoading(false)
        return
      }

      const { data: pricesData } = await supabase
        .from('services')
        .select('profile_id, price')
        .eq('active', true)

      const priceMap = new Map<string, number>()
      const activeServiceCountMap = new Map<string, number>()
      if (pricesData) {
        for (const row of pricesData as { profile_id: string; price: number }[]) {
          const currentValue = priceMap.get(row.profile_id)
          if (currentValue === undefined || row.price < currentValue) {
            priceMap.set(row.profile_id, row.price)
          }
          activeServiceCountMap.set(row.profile_id, (activeServiceCountMap.get(row.profile_id) ?? 0) + 1)
        }
      }

      setPros(
        profilesData
          .map(profile => ({
            ...profile,
            min_price: priceMap.get(profile.id) ?? null,
            active_services: activeServiceCountMap.get(profile.id) ?? 0,
          }))
          .filter(profile => profile.active_services > 0) as Pro[],
      )
      setLoading(false)
    }

    void load()
  }, [])

  const cities = useMemo(() => [...new Set(pros.map(pro => pro.city).filter(Boolean))] as string[], [pros])

  const filtered = useMemo(() => pros
    .filter(pro => {
      const normalizedSearch = search.toLowerCase()
      const matchSearch = !search ||
        pro.full_name.toLowerCase().includes(normalizedSearch) ||
        pro.profession.toLowerCase().includes(normalizedSearch)
      const primaryProfessionName = getPrimaryProfessionName(pro.profession)
      const matchCategory = !selectedCategory || (
        selectedCategory === 'outros'
          ? !highlightedCategories.some(category => category.name.toLowerCase() === primaryProfessionName)
          : highlightedCategories.find(category => category.id === selectedCategory)?.name.toLowerCase() === primaryProfessionName
      )
      const matchCity = !selectedCity || pro.city === selectedCity
      return matchSearch && matchCategory && matchCity
    })
    .sort((first, second) => {
      const planDiff = getPlanPriority(second.plan) - getPlanPriority(first.plan)
      if (planDiff !== 0) return planDiff
      if (sortBy === 'rating') return (second.rating ?? 0) - (first.rating ?? 0)
      if (sortBy === 'reviews') return (second.review_count ?? 0) - (first.review_count ?? 0)
      return 0
    }), [pros, search, selectedCategory, selectedCity, sortBy])

  return (
    <div className="page-enter min-h-screen w-full bg-transparent">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-3xl font-bold text-white">Encontre profissionais</h1>
          <p className="mb-6 text-indigo-100">Descubra profissionais da sua região e agende online em poucos passos.</p>
          <div className="flex max-w-2xl gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 shadow-lg">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar profissional ou serviço..."
                className="flex-1 py-3.5 text-slate-700 outline-none placeholder:text-slate-400"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
              {search && <button onClick={() => setSearch('')}><X size={16} className="text-slate-400" /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3.5 font-medium text-indigo-600 shadow-lg transition-colors hover:bg-indigo-50">
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setSelectedCategory('')} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${!selectedCategory ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300'}`}>
            Todos
          </button>
          {marketplaceCategories.map(category => (
            <button key={category.id} onClick={() => setSelectedCategory(category.id === selectedCategory ? '' : category.id)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === category.id ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300'}`}>
              <span>{category.icon}</span> {category.name}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="public-panel mb-6 grid grid-cols-1 gap-4 rounded-2xl p-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Cidade</label>
              <select value={selectedCity} onChange={event => setSelectedCity(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400">
                <option value="">Todas as cidades</option>
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Ordenar por</label>
              <select value={sortBy} onChange={event => setSortBy(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400">
                <option value="rating">Melhor avaliação</option>
                <option value="reviews">Mais avaliações</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setSelectedCity(''); setSelectedCategory(''); setSearch('') }} className="text-sm text-indigo-600 hover:underline">
                Limpar filtros
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-slate-600">{filtered.length} profissional{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <Search size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Nenhum profissional encontrado</p>
                <p className="mt-1 text-sm">Tente outros filtros ou seja o primeiro da sua categoria.</p>
                <Link to="/register" className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700">
                  Cadastrar meu negócio
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(pro => (
                  <Link
                    key={pro.id}
                    to={`/professional/${pro.slug}`}
                    className={`public-panel group overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
                      pro.plan === 'business'
                        ? 'border-slate-900/10 shadow-[0_30px_65px_-38px_rgba(15,23,42,0.4)] hover:shadow-[0_34px_75px_-40px_rgba(15,23,42,0.45)]'
                        : pro.plan === 'pro'
                          ? 'border-amber-200/70 shadow-[0_28px_60px_-36px_rgba(79,70,229,0.45)]'
                          : 'border-slate-100 hover:shadow-[0_28px_60px_-36px_rgba(79,70,229,0.2)]'
                    }`}
                  >
                    <div className={`relative h-44 overflow-hidden ${
                      pro.plan === 'business'
                        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900'
                        : pro.plan === 'pro'
                          ? 'bg-gradient-to-br from-amber-100 via-indigo-100 to-purple-100'
                          : 'bg-gradient-to-br from-indigo-100 via-sky-50 to-purple-100'
                    }`}>
                      {pro.cover_url ? (
                        <img src={pro.cover_url} alt={pro.full_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center ${
                          pro.plan === 'business' ? 'text-white/35' : 'text-indigo-300'
                        }`}>
                          <Users size={40} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
                      {pro.plan === 'business' && (
                        <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-900">
                          BUSINESS
                        </span>
                      )}
                      {pro.plan === 'pro' && (
                        <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-900">
                          PRO
                        </span>
                      )}
                      {pro.plan !== 'free' && (
                        <div className="absolute bottom-3 left-3 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          {pro.plan === 'business' ? 'Destaque premium' : 'Destaque no marketplace'}
                        </div>
                      )}
                    </div>
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        {pro.avatar_url ? (
                          <img src={pro.avatar_url} alt={pro.full_name} className="relative z-10 -mt-11 h-16 w-16 flex-shrink-0 rounded-[1.35rem] border-4 border-white object-cover shadow-[0_14px_28px_rgba(15,23,42,0.18)]" />
                        ) : (
                          <div className="relative z-10 -mt-11 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[1.35rem] border-4 border-white bg-indigo-500 text-lg font-bold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]">
                            {pro.full_name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="line-clamp-2 text-lg font-bold leading-6 text-slate-900">{pro.full_name}</h3>
                            {pro.plan === 'business' && (
                              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Business
                              </span>
                            )}
                            {pro.plan === 'pro' && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                Pro
                              </span>
                            )}
                          </div>
                          <p className={`mt-1 text-sm font-medium ${
                            pro.plan === 'business' ? 'text-slate-700' : 'text-indigo-600'
                          }`}>
                            {pro.profession}
                          </p>
                        </div>
                      </div>
                      {pro.review_count > 0 && (
                        <div className="mt-3 flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={12} className={star <= Math.round(pro.rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">{Number(pro.rating).toFixed(1)} ({pro.review_count})</span>
                        </div>
                      )}
                      {pro.bio && <p className="mt-3 min-h-[2.75rem] line-clamp-2 text-sm leading-6 text-slate-500">{pro.bio}</p>}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        {(pro.city || pro.state) && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin size={11} /> {[pro.city, pro.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {pro.min_price != null && (
                          <span className="text-sm font-bold text-indigo-600">A partir de R${pro.min_price}</span>
                        )}
                      </div>
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          pro.plan === 'business'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          Ver perfil completo
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

