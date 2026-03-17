import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  size?: number
  showCount?: boolean
  count?: number
}

export default function StarRating({ rating, size = 14, showCount = false, count = 0 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'}
        />
      ))}
      <span className="text-sm font-semibold text-slate-700 ml-0.5">{rating.toFixed(1)}</span>
      {showCount && <span className="text-sm text-slate-500">({count})</span>}
    </div>
  )
}
