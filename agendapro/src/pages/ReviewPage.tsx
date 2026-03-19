import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Loader2, Send, Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { supabase } from '../lib/supabase'

type ReviewRequest = {
  appointment_id: string
  profile_id: string
  professional_name: string
  professional_slug: string
  service_name: string
  client_name: string
  appointment_date: string
  appointment_time: string
  review_exists: boolean
}

function formatReviewDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

function formatReviewTime(time: string) {
  return time.slice(0, 5)
}

export default function ReviewPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<ReviewRequest | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!appointmentId) return

    let ignore = false

    const loadRequest = async () => {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase.rpc('get_public_review_request', {
        review_appointment_id: appointmentId,
      })

      if (ignore) return

      if (error) {
        setErrorMessage('Não foi possível carregar esse pedido de avaliação.')
        setLoading(false)
        return
      }

      const nextRequest = (data?.[0] as ReviewRequest | undefined) ?? null
      setRequest(nextRequest)
      setLoading(false)
    }

    void loadRequest()

    return () => {
      ignore = true
    }
  }, [appointmentId])

  const canSubmit = useMemo(() => Boolean(request) && !request?.review_exists && !submitted, [request, submitted])

  const handleSubmit = async () => {
    if (!request || !appointmentId) return

    setSaving(true)
    setErrorMessage('')

    const { error } = await supabase.from('reviews').insert({
      profile_id: request.profile_id,
      appointment_id: appointmentId,
      client_name: request.client_name,
      rating,
      comment: comment.trim() || null,
    })

    setSaving(false)

    if (error) {
      setErrorMessage(
        error.code === '23505'
          ? 'Essa avaliação já foi enviada anteriormente.'
          : 'Não foi possível enviar sua avaliação agora. Tente novamente.',
      )
      return
    }

    setSubmitted(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-slate-400">
        <Loader2 size={30} className="animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Link de avaliação indisponível</h1>
          <p className="mt-3 text-sm text-slate-500">
            Esse pedido de avaliação não foi encontrado ou o atendimento ainda não foi concluído.
          </p>
          <Link to="/marketplace" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            Voltar ao marketplace
          </Link>
        </div>
      </div>
    )
  }

  if (request.review_exists || submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Avaliação recebida</h1>
          <p className="mt-3 text-sm text-slate-500">
            Obrigado por avaliar {request.professional_name}. Sua opinião ajuda outros clientes e fortalece o perfil profissional.
          </p>
          <Link to={`/professional/${request.professional_slug}`} className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            Ver perfil profissional
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-600 to-sky-500 p-8 text-white shadow-sm">
        <h1 className="text-3xl font-bold">Como foi seu atendimento?</h1>
        <p className="mt-2 text-sm text-indigo-100">
          Sua avaliação para {request.professional_name} leva menos de 1 minuto.
        </p>
        <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm">
          <div><strong>Serviço:</strong> {request.service_name}</div>
          <div><strong>Data:</strong> {formatReviewDate(request.appointment_date)} as {formatReviewTime(request.appointment_time)}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">Sua nota</h2>
          <p className="mt-1 text-sm text-slate-500">Selecione de 1 a 5 estrelas e, se quiser, deixe um comentário.</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${star <= rating ? 'border-amber-200 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300 hover:border-amber-200 hover:text-amber-400'}`}
            >
              <Star size={24} className={star <= rating ? 'fill-amber-400 text-amber-400' : ''} />
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">Comentário opcional</label>
          <textarea
            value={comment}
            onChange={event => setComment(event.target.value)}
            rows={5}
            placeholder="Conte rapidamente como foi sua experiência..."
            className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-400"
          />
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit || saving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Enviar avaliação
        </button>
      </div>
    </div>
  )
}
