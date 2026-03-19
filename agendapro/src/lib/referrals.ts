import { supabase } from './supabase'

export type PublicReferrer = {
  profile_id: string
  full_name: string
  profession: string | null
  slug: string
}

export type ReferralRecord = {
  id: string
  full_name: string
  profession: string | null
  plan: string
  status: 'registered' | 'converted'
  converted_plan: 'pro' | 'business' | null
  credit_amount: number
  converted_at: string | null
  created_at: string
}

export type ReferralLoadResult = {
  mode: 'schema' | 'legacy'
  records: ReferralRecord[]
}

const isPaidPlan = (plan: string | null | undefined): plan is 'pro' | 'business' =>
  plan === 'pro' || plan === 'business'

export async function getPublicReferrer(refSlug: string): Promise<PublicReferrer | null> {
  const normalizedSlug = refSlug.trim()
  if (!normalizedSlug) return null

  const { data, error } = await supabase.rpc('get_public_referrer', {
    ref_slug: normalizedSlug,
  })

  if (!error) {
    return ((data?.[0] as PublicReferrer | undefined) ?? null)
  }

  const fallback = await supabase
    .from('profiles')
    .select('id, full_name, profession, slug')
    .eq('slug', normalizedSlug)
    .maybeSingle()

  if (fallback.error || !fallback.data) return null

  return {
    profile_id: fallback.data.id,
    full_name: fallback.data.full_name,
    profession: fallback.data.profession,
    slug: fallback.data.slug,
  }
}

export async function getReferralsForProfile(referrerProfileId: string, referrerSlug: string): Promise<ReferralLoadResult> {
  const primary = await supabase
    .from('referrals')
    .select('id, status, converted_plan, credit_amount, converted_at, created_at, referred_profile:referred_profile_id(id, full_name, profession, plan, created_at)')
    .eq('referrer_profile_id', referrerProfileId)
    .order('created_at', { ascending: false })

  if (!primary.error) {
    const records = (((primary.data as {
      id: string
      status: 'registered' | 'converted'
      converted_plan: 'pro' | 'business' | null
      credit_amount: number
      converted_at: string | null
      created_at: string
      referred_profile: {
        id: string
        full_name: string
        profession: string | null
        plan: string
        created_at: string
      }[] | null
    }[] | null) ?? [])
      .map(row => {
        const referredProfile = row.referred_profile?.[0]
        if (!referredProfile) return null

        return {
          id: row.id,
          full_name: referredProfile.full_name,
          profession: referredProfile.profession,
          plan: referredProfile.plan,
          status: row.status,
          converted_plan: row.converted_plan,
          credit_amount: Number(row.credit_amount ?? 0),
          converted_at: row.converted_at,
          created_at: row.created_at,
        } satisfies ReferralRecord
      })
      .filter(Boolean) as ReferralRecord[])

    return { mode: 'schema', records }
  }

  const fallback = await supabase
    .from('profiles')
    .select('id, full_name, profession, plan, created_at')
    .eq('referred_by', referrerSlug)
    .order('created_at', { ascending: false })

  if (fallback.error) {
    throw fallback.error
  }

  const records = (((fallback.data as {
    id: string
    full_name: string
    profession: string | null
    plan: string
    created_at: string
  }[] | null) ?? []).map(row => {
    const convertedPlan = isPaidPlan(row.plan) ? row.plan : null

    return {
      id: row.id,
      full_name: row.full_name,
      profession: row.profession,
      plan: row.plan,
      status: convertedPlan ? 'converted' : 'registered',
      converted_plan: convertedPlan,
      credit_amount: convertedPlan ? 25 : 0,
      converted_at: convertedPlan ? row.created_at : null,
      created_at: row.created_at,
    } satisfies ReferralRecord
  }))

  return { mode: 'legacy', records }
}
