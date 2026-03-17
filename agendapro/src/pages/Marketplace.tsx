import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Users, SlidersHorizontal, X, Star, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { categories } from '../data/mockData'

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
      // Fetch profiles + min price from services
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, profession, bio, city, state, avatar_url, cover_url, rating, review_count, slug, plan')
        .order('rating', { ascending: false })

      if (!profilesData) { setLoading(false); return }

      // Fetch min prices per profile
      const { data: pricesData } = await supabase
        .from('services')
        .select('profile_id, price')
        .eq('active', true)

      const priceMap = new Map<string, number>()
      if (pricesData) {
        for (const row of pricesData as { profile_id: string; price: number }[]) {
          const cur = priceMap.get(row.profile_id)
          if (cur === undefined || row.price < cur) priceMap.set(row.profile_id, row.price)
        }
      }

      setPros(profilesData.map(p => ({ ...p, min_price: priceMap.get(p.id) ?? null })) as Pro[])
      setLoading(false)
    }
    load()
  }, [])

  const cities = [...new Set(pros.map(p => p.city).filter(Boolean))] as string[]

  const filtered = pros
    .filter(p => {
      const matchSearch = !search ||
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.profession.toLowerCase().includes(search.toLowerCase())
      const matchCat = !selectedCategory ||
        categories.find(c => c.id === selectedCategory)?.name.toLowerCase() === p.profession.toLowerCase()
      const matchCity = !selectedCity || p.city === selectedCity
      return matchSearch && matchCat && matchCity
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
      if (sortBy === 'reviews') return (b.review_count ?? 0) - (a.review_count ?? 0)
      return 0
    })

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">Encontre Profissionais</h1>
          <p className="text-indigo-100 mb-6">Agende serviços com os melhores profissionais da sua região</p>
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 bg-white rounded-xl flex items-center px-4 gap-3 shadow-lg">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Buscar profissional ou serviço..."
                className="flex-1 py-3.5 outline-none text-slate-700 placeholder-slate-400"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')}><X size={16} className="text-slate-400" /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="bg-white text-indigo-600 px-4 py-3.5 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:bg-indigo-50 transition-colors">
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 flex-wrap mb-6">
          <button onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}>
            Todos
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${selectedCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}>
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cidade</label>
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400">
                <option value="">Todas as cidades</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Ordenar por</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400">
                <option value="rating">Melhor avaliação</option>
                <option value="reviews">Mais avaliações</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setSelectedCity(''); setSelectedCategory(''); setSearch('') }}
                className="text-sm text-indigo-600 hover:underline">Limpar filtros</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-slate-600 text-sm">{filtered.length} profissional{filtered.length !== 1 ? 'is' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <Search size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Nenhum profissional encontrado</p>
                <p className="text-sm mt-1">Tente outros filtros ou seja o primeiro da sua categoria!</p>
                <Link to="/register" className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
                  Cadastrar meu negócio
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(pro => (
                  <Link key={pro.id} to={`/professional/${pro.slug}`}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-100 overflow-hidden group">
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                      {pro.cover_url ? (
                        <img src={pro.cover_url} alt={pro.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-300">
                          <Users size={40} />
                        </div>
                      )}
                      {pro.plan === 'pro' && (
                        <span className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">PRO</span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        {pro.avatar_url ? (
                          <img src={pro.avatar_url} alt={pro.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow -mt-8 relative z-10 flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-500 border-2 border-white shadow -mt-8 relative z-10 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                            {pro.full_name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate">{pro.full_name}</h3>
                          <p className="text-indigo-600 text-sm font-medium truncate">{pro.profession}</p>
                        </div>
                      </div>
                      {pro.review_count > 0 && (
                        <div className="mt-3 flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={12} className={s <= Math.round(pro.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">{Number(pro.rating).toFixed(1)} ({pro.review_count})</span>
                        </div>
                      )}
                      {pro.bio && <p className="text-slate-500 text-sm mt-2 line-clamp-2">{pro.bio}</p>}
                      <div className="mt-3 flex items-center justify-between">
                        {(pro.city || pro.state) && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={11} /> {[pro.city, pro.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {pro.min_price != null && (
                          <span className="text-sm font-bold text-indigo-600">A partir de R${pro.min_price}</span>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Agendar agora →</span>
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
