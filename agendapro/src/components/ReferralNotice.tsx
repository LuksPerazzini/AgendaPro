import { useEffect, useState } from 'react'
import { CheckCircle2, Gift, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getPublicReferrer, type PublicReferrer } from '../lib/referrals'

type ReferralNoticeProps = {
  variant?: 'full' | 'compact'
}

export default function ReferralNotice({ variant = 'full' }: ReferralNoticeProps) {
  const { profile } = useAuth()
  const referralSlug = profile?.referred_by?.trim()
  const [referrer, setReferrer] = useState<PublicReferrer | null>(null)
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!referralSlug || resolvedSlug === referralSlug) return

    let ignore = false

    const loadReferrer = async () => {
      const nextReferrer = await getPublicReferrer(referralSlug)

      if (ignore) return

      setReferrer(nextReferrer)
      setResolvedSlug(referralSlug)
    }

    void loadReferrer()

    return () => {
      ignore = true
    }
  }, [referralSlug, resolvedSlug])

  if (!referralSlug) return null

  const loading = resolvedSlug !== referralSlug

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
        <Loader2 size={16} className="animate-spin" />
        Validando sua indicacao...
      </div>
    )
  }

  if (!referrer) return null

  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Gift size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">Conta vinculada a uma indicacao</div>
          <p className="mt-1 text-sm text-slate-600">
            Seu cadastro entrou pelo link de <strong>{referrer.full_name}</strong>
            {referrer.profession ? `, ${referrer.profession}` : ''}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Indicacao confirmada</div>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Seu cadastro foi vinculado com sucesso</h3>
          <p className="mt-1.5 text-sm text-slate-600">
            Essa conta entrou pelo link de <strong>{referrer.full_name}</strong>
            {referrer.profession ? `, ${referrer.profession}` : ''}. O vinculo ja ficou salvo no sistema.
          </p>
        </div>
      </div>
    </div>
  )
}
