import { useEffect, useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type Review = {
  id: string
  client_name: string
  rating: number
  comment: string | null
  created_at: string
}

export default function DashboardAvaliacoes() {
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('reviews')
        .select('id, client_name, rating, comment, created_at')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setReviews(data as Review[])
      setLoading(false)
    }
    load()
  }, [user])

  const avgRating = profile?.rating ? Number(profile.rating) : 0
  const reviewCount = profile?.review_count ?? 0

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Avaliações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Veja o que seus clientes falam sobre você</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-6xl font-bold text-slate-900">{reviewCount > 0 ? avgRating.toFixed(1) : '—'}</div>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={16} className={s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
              ))}
            </div>
            <div className="text-sm text-slate-500 mt-1">{reviewCount} avaliações</div>
          </div>
          <div className="flex-1">
            {ratingCounts.map(({ stars, count }) => {
              const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0
              return (
                <div key={stars} className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-0.5 w-20">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={10} className={s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                    ))}
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                    <div className="bg-amber-400 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-slate-500 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <Star size={40} className="mx-auto mb-3" />
          <p className="font-medium">Nenhuma avaliação ainda</p>
          <p className="text-sm mt-1">Quando clientes avaliarem seu serviço, aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 flex-shrink-0">
                  {review.client_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{review.client_name}</span>
                    <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={12} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                    ))}
                  </div>
                  {review.comment && <p className="text-slate-600 text-sm">{review.comment}</p>}
                  <button className="mt-2 text-xs text-indigo-600 hover:underline">Responder</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
