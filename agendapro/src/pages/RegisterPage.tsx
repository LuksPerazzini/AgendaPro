import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, ChevronDown, AlertCircle, Loader2 } from 'lucide-react'
import { categories } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const refSlug = searchParams.get('ref') ?? undefined
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', category: '', city: '' })

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    setError('')
    setLoading(true)
    const profession = categories.find(c => c.id === form.category)?.name ?? form.category
    const { error } = await signUp(form.email, form.password, form.name, profession, refSlug)
    setLoading(false)
    if (error) {
      setError(error.includes('already registered') ? 'Este e-mail já está cadastrado.' : error)
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar sua conta grátis</h1>
          <p className="text-slate-400 mt-1">Comece a receber agendamentos hoje</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {s}
              </div>
              {s < 2 && <div className={`w-10 h-0.5 ${step > s ? 'bg-indigo-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Dados pessoais</h2>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Nome completo</label>
                <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="João Silva" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">E-mail</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="seu@email.com" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">WhatsApp</label>
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(11) 99999-0000" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Senha</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!form.name || !form.email || !form.phone || form.password.length < 8}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Sobre seu negócio</h2>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Categoria de serviço</label>
                <div className="relative">
                  <select value={form.category} onChange={e => update('category', e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 appearance-none">
                    <option value="">Selecione sua área</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cidade</label>
                <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="São Paulo" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700">
                🎉 Você começará com o <strong>Plano Gratuito</strong>. Pode fazer upgrade a qualquer momento.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                  Voltar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.category || !form.city || loading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : 'Criar conta'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-5">
            Já tem conta? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
