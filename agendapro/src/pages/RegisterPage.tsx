import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, ChevronDown, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { categories } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'
import { getPublicReferrer, type PublicReferrer } from '../lib/referrals'

const selectableCategories = [...categories, { id: 'outros', name: 'Outros', icon: '🧰', count: 0 }]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const rawRefSlug = searchParams.get('ref')?.trim() ?? ''
  const [referrer, setReferrer] = useState<PublicReferrer | null>(null)
  const [refLoading, setRefLoading] = useState(Boolean(rawRefSlug))
  const [refInvalid, setRefInvalid] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', category: '', customCategory: '', city: '' })

  useEffect(() => {
    if (!rawRefSlug) return

    let ignore = false

    const loadReferrer = async () => {
      setRefLoading(true)

      if (ignore) return

      const nextReferrer = await getPublicReferrer(rawRefSlug)
      if (ignore) return

      setReferrer(nextReferrer)
      setRefInvalid(!nextReferrer)
      setRefLoading(false)
    }

    void loadReferrer()

    return () => {
      ignore = true
    }
  }, [rawRefSlug])

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    setError('')
    setLoading(true)
    const profession = form.category === 'outros'
      ? form.customCategory.trim()
      : selectableCategories.find(c => c.id === form.category)?.name ?? form.category
    const validRefSlug = referrer?.slug
    const { error: signUpError } = await signUp(form.email, form.password, form.name, profession, validRefSlug)
    setLoading(false)
    if (signUpError) {
      setError(signUpError.includes('already registered') ? 'Este e-mail ja esta cadastrado.' : signUpError)
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar sua conta grátis</h1>
          <p className="mt-1 text-slate-400">Comece a receber agendamentos hoje</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= s ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {s}
              </div>
              {s < 2 && <div className={`h-0.5 w-10 ${step > s ? 'bg-indigo-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {rawRefSlug && (
            <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${refInvalid ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {refLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Validando indicação...
                </span>
              ) : referrer ? (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle size={14} /> Você está entrando pelo link de <strong>{referrer.full_name}</strong> ({referrer.profession})
                </span>
              ) : (
                'Esse link de indicação não é válido. O cadastro seguirá sem vínculo de indicação.'
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Dados pessoais</h2>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
                <input value={form.name} onChange={event => update('name', event.target.value)} placeholder="João Silva" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
                <input type="email" value={form.email} onChange={event => update('email', event.target.value)} placeholder="seu@email.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">WhatsApp</label>
                <input type="tel" value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="(11) 99999-0000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Senha</label>
                <input type="password" value={form.password} onChange={event => update('password', event.target.value)} placeholder="Minimo 8 caracteres" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!form.name || !form.email || !form.phone || form.password.length < 8}
                className="w-full rounded-xl bg-indigo-600 py-3.5 font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuar {'>'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Sobre seu negócio</h2>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Categoria de serviço</label>
                <div className="relative">
                  <select value={form.category} onChange={event => update('category', event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400">
                    <option value="">Selecione sua área</option>
                    {selectableCategories.map(category => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              {form.category === 'outros' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Qual é a sua área?</label>
                  <input value={form.customCategory} onChange={event => update('customCategory', event.target.value)} placeholder="Ex: advogado, tatuador, fotógrafo..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Cidade</label>
                <input value={form.city} onChange={event => update('city', event.target.value)} placeholder="São Paulo" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700">
                Você começará com o <strong>Plano Gratuito</strong>. Pode fazer upgrade a qualquer momento.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50">
                  Voltar
                </button>
                <button
                  onClick={() => void handleCreate()}
                  disabled={!form.category || (form.category === 'outros' && !form.customCategory.trim()) || !form.city || loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : 'Criar conta'}
                </button>
              </div>
            </div>
          )}

          <p className="mt-5 text-center text-sm text-slate-500">
            Já tem conta? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
