import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Plus, Trash2, Clock, Zap, Loader2, AlertCircle } from 'lucide-react'
import { categories } from '../data/mockData'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const steps = [
  { id: 1, title: 'Seu negócio', desc: 'Dados básicos do perfil' },
  { id: 2, title: 'Seus serviços', desc: 'O que você oferece' },
  { id: 3, title: 'Seus horários', desc: 'Quando você atende' },
  { id: 4, title: 'Pronto!', desc: 'Seu perfil está no ar' },
]

const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState({
    name: '', category: '', specialty: '', city: '', state: '', phone: '', description: '',
  })
  const [services, setServices] = useState([
    { id: '1', name: '', duration: '60', price: '', description: '' },
  ])
  const [schedule, setSchedule] = useState(
    Object.fromEntries(weekDays.map(d => [d, { active: d !== 'Domingo', start: '08:00', end: '18:00' }]))
  )

  const addService = () => setServices([...services, { id: Date.now().toString(), name: '', duration: '60', price: '', description: '' }])
  const removeService = (id: string) => setServices(services.filter(s => s.id !== id))
  const updateService = (id: string, key: string, value: string) =>
    setServices(services.map(s => s.id === id ? { ...s, [key]: value } : s))

  const progress = ((step - 1) / 3) * 100

  const saveStep1 = async () => {
    if (!user) return
    setSaving(true); setError('')
    const profession = categories.find(c => c.id === profile.category)?.name ?? profile.category
    const { error: err } = await supabase.from('profiles').update({
      full_name: profile.name,
      profession,
      bio: profile.description,
      phone: profile.phone,
      city: profile.city,
      state: profile.state,
    }).eq('id', user.id)
    setSaving(false)
    if (err) { setError('Erro ao salvar. Tente novamente.'); return }
    await refreshProfile()
    setStep(2)
  }

  const saveStep2 = async () => {
    if (!user) return
    setSaving(true); setError('')
    const validServices = services.filter(s => s.name && s.price)
    if (validServices.length === 0) { setError('Adicione pelo menos um serviço com nome e preço.'); setSaving(false); return }
    const { error: err } = await supabase.from('services').insert(
      validServices.map(s => ({
        profile_id: user.id,
        name: s.name,
        description: s.description || null,
        price: parseFloat(s.price) || 0,
        duration_minutes: parseInt(s.duration) || 60,
        active: true,
      }))
    )
    setSaving(false)
    if (err) { setError('Erro ao salvar serviços.'); return }
    setStep(3)
  }

  const saveStep3 = async () => {
    if (!user) return
    setSaving(true); setError('')
    const { error: err } = await supabase.from('profiles').update({
      schedule: schedule,
    }).eq('id', user.id)
    setSaving(false)
    if (err) { setError('Erro ao salvar horários.'); return }
    setStep(4)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">AgendaPro</span>
        </div>
        <span className="text-sm text-slate-500">Configuração · {step} de 4</span>
      </div>
      <div className="h-1.5 bg-slate-200">
        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${step === s.id ? 'bg-indigo-600 text-white' : step > s.id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                {step > s.id ? <CheckCircle size={12} /> : <span>{s.id}</span>}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-6 h-0.5 ${step > s.id ? 'bg-green-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Conte sobre seu negócio</h2>
            <p className="text-slate-500 text-sm mb-6">Essas informações aparecem no seu perfil público</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Nome profissional / Negócio *</label>
                <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Ex: João Silva ou Barbearia do João" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Categoria *</label>
                <select value={profile.category} onChange={e => setProfile({...profile, category: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400">
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Especialidade</label>
                <input value={profile.specialty} onChange={e => setProfile({...profile, specialty: e.target.value})} placeholder="Ex: Cortes modernos e barba" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cidade *</label>
                <input value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} placeholder="São Paulo" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Estado</label>
                <input value={profile.state} onChange={e => setProfile({...profile, state: e.target.value})} placeholder="SP" maxLength={2} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">WhatsApp *</label>
                <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="(11) 99999-0000" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Descrição do seu trabalho</label>
                <textarea value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} placeholder="Sua experiência, diferenciais, o que te faz especial..." rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 resize-none" />
              </div>
            </div>
            <button onClick={saveStep1} disabled={!profile.name || !profile.category || !profile.city || !profile.phone || saving}
              className="w-full mt-6 bg-indigo-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {saving ? 'Salvando...' : 'Próximo: Meus serviços'} {!saving && <ArrowRight size={18} />}
            </button>
          </div>
        )}

        {/* Step 2: Services */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Quais serviços você oferece?</h2>
            <p className="text-slate-500 text-sm mb-6">Adicione pelo menos 1 serviço para ativar o agendamento</p>
            <div className="space-y-4">
              {services.map((s, i) => (
                <div key={s.id} className="p-4 border-2 border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">Serviço {i + 1}</span>
                    {services.length > 1 && (
                      <button onClick={() => removeService(s.id)} className="p-1 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <input value={s.name} onChange={e => updateService(s.id, 'name', e.target.value)} placeholder="Nome do serviço (ex: Corte Masculino) *" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                    </div>
                    <div className="sm:col-span-2">
                      <input value={s.description} onChange={e => updateService(s.id, 'description', e.target.value)} placeholder="Descrição breve (opcional)" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1"><Clock size={10} /> Duração</label>
                      <select value={s.duration} onChange={e => updateService(s.id, 'duration', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400">
                        {['15','30','45','60','90','120','180','240'].map(d => <option key={d} value={d}>{d} min</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Preço (R$) *</label>
                      <input type="number" value={s.price} onChange={e => updateService(s.id, 'price', e.target.value)} placeholder="50" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addService} className="w-full mt-3 border-2 border-dashed border-slate-200 text-slate-500 py-3 rounded-xl text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
              <Plus size={16} /> Adicionar outro serviço
            </button>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">Voltar</button>
              <button onClick={saveStep2} disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? 'Salvando...' : <>Próximo: Horários <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Quando você atende?</h2>
            <p className="text-slate-500 text-sm mb-6">Defina seus horários de funcionamento</p>
            <div className="space-y-3">
              {weekDays.map(day => {
                const s = schedule[day]
                return (
                  <div key={day} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${s.active ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                    <button onClick={() => setSchedule(prev => ({...prev, [day]: {...prev[day], active: !prev[day].active}}))}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${s.active ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className={`w-16 text-sm font-medium flex-shrink-0 ${s.active ? 'text-slate-900' : 'text-slate-400'}`}>{day}</span>
                    {s.active ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={s.start} onChange={e => setSchedule(prev => ({...prev, [day]: {...prev[day], start: e.target.value}}))} className="border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-400 bg-white" />
                        <span className="text-slate-400 text-sm">até</span>
                        <input type="time" value={s.end} onChange={e => setSchedule(prev => ({...prev, [day]: {...prev[day], end: e.target.value}}))} className="border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-400 bg-white" />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Fechado</span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">Voltar</button>
              <button onClick={saveStep3} disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? 'Salvando...' : <>Finalizar <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Seu perfil está no ar! 🎉</h2>
            <p className="text-slate-500 mb-8">Agora seus clientes podem te encontrar e agendar online.</p>
            <div className="bg-indigo-50 rounded-2xl p-5 mb-6 text-left">
              <div className="text-sm font-bold text-indigo-700 mb-3">🚀 Próximos passos:</div>
              <div className="space-y-2">
                {['Compartilhe seu link no Instagram e WhatsApp', 'Peça para clientes atuais avaliarem você', 'Adicione fotos dos seus trabalhos', 'Ative o WhatsApp automático para zero faltas'].map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                    <span className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => navigate('/dashboard')}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
              Ir para meu painel <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
