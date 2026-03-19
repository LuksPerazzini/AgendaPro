import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Copy, Loader2, MessageCircle, Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getWhatsAppLink, hasReachablePhone } from '../../lib/whatsapp'

type Review = {
  id: string
  appointment_id: string | null
  client_name: string
  rating: number
  comment: string | null
  created_at: string
}

type CompletedAppointment = {
  id: string
  client_name: string
  client_phone: string
  date: string
  time: string
  services: { name: string }[] | null
}

function formatReviewDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "d 'de' MMM", { locale: ptBR })
}

function formatReviewTime(value: string) {
  return value.slice(0, 5)
}

export default function DashboardAvaliacoes() {
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [pendingReviews, setPendingReviews] = useState<CompletedAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)

      const [{ data: reviewData }, { data: completedAppointments }] = await Promise.all([
        supabase
          .from('reviews')
          .select('id, appointment_id, client_name, rating, comment, created_at')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('appointments')
          .select('id, client_name, client_phone, date, time, services(name)')
          .eq('profile_id', user.id)
          .eq('status', 'completed')
          .order('date', { ascending: false })
          .order('time', { ascending: false }),
      ])

      const nextReviews = (reviewData as Review[] | null) ?? []
      const reviewedAppointmentIds = new Set(nextReviews.map(review => review.appointment_id).filter(Boolean))
      const nextPending = ((completedAppointments as CompletedAppointment[] | null) ?? []).filter(
        appointment => !reviewedAppointmentIds.has(appointment.id),
      )

      setReviews(nextReviews)
      setPendingReviews(nextPending)
      setLoading(false)
    }

    void load()
  }, [user])

  const avgRating = profile?.rating ? Number(profile.rating) : 0
  const reviewCount = profile?.review_count ?? 0

  const ratingCounts = useMemo(
    () => [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: reviews.filter(review => review.rating === stars).length,
    })),
    [reviews],
  )

  const copyReply = async (review: Review) => {
    const reply = `Oi, ${review.client_name}! Muito obrigado pela sua avaliação de ${review.rating} estrela${review.rating > 1 ? 's' : ''}. Fico feliz em saber da sua experiência.`
    await navigator.clipboard.writeText(reply)
    setCopiedId(review.id)
    window.setTimeout(() => setCopiedId(current => (current === review.id ? null : current)), 2000)
  }

  const copyReviewLink = async (appointmentId: string) => {
    const url = `${window.location.origin}/review/${appointmentId}`
    await navigator.clipboard.writeText(url)
    setCopiedId(appointmentId)
    window.setTimeout(() => setCopiedId(current => (current === appointmentId ? null : current)), 2000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Avaliações</h1>
        <p className="mt-0.5 text-sm text-slate-500">Acompanhe o que já chegou e envie novos pedidos de avaliação</p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-slate-900">{reviewCount > 0 ? avgRating.toFixed(1) : '-'}</div>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={16} className={star <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
              ))}
            </div>
            <div className="mt-1 text-sm text-slate-500">{reviewCount} avaliações</div>
          </div>
          <div className="flex-1">
            {ratingCounts.map(({ stars, count }) => {
              const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0
              return (
                <div key={stars} className="mb-2 flex items-center gap-3">
                  <div className="flex w-20 items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={10} className={star <= stars ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
                    ))}
                  </div>
                  <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-sm text-slate-500">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6">
        <div className="mb-5">
          <h3 className="font-bold text-slate-900">Pedir avaliação</h3>
          <p className="mt-1 text-sm text-slate-500">Esses atendimentos já foram concluídos e ainda podem receber uma avaliação</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : pendingReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-400">
            Nenhum pedido pendente de avaliação no momento.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReviews.map(appointment => {
              const reviewUrl = `${window.location.origin}/review/${appointment.id}`
              const whatsappMessage = `Oi, ${appointment.client_name}! Obrigado pelo atendimento. Se puder, me avalie por aqui: ${reviewUrl}`
              const whatsappUrl = getWhatsAppLink(appointment.client_phone, whatsappMessage)

              return (
                <div key={appointment.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{appointment.client_name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {appointment.services?.[0]?.name ?? 'Serviço'} - {formatReviewDate(appointment.date)} - {formatReviewTime(appointment.time)}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{appointment.client_phone}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copyReviewLink(appointment.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        {copiedId === appointment.id ? <CheckCircle size={14} /> : <Copy size={14} />}
                        {copiedId === appointment.id ? 'Link copiado' : 'Copiar link'}
                      </button>
                      <a
                        href={whatsappUrl ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white transition-colors ${hasReachablePhone(appointment.client_phone) ? 'bg-green-600 hover:bg-green-700' : 'pointer-events-none bg-slate-300'}`}
                      >
                        <MessageCircle size={14} />
                        Enviar pelo WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-400">
          <Star size={40} className="mx-auto mb-3" />
          <p className="font-medium">Nenhuma avaliação ainda</p>
          <p className="mt-1 text-sm">Quando clientes avaliarem seu serviço, elas aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
                  {review.client_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{review.client_name}</span>
                    <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="mb-2 mt-0.5 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={12} className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
                    ))}
                  </div>
                  {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
                  <button onClick={() => void copyReply(review)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline">
                    {copiedId === review.id ? <CheckCircle size={13} /> : <Copy size={13} />}
                    {copiedId === review.id ? 'Resposta copiada' : 'Copiar resposta'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
