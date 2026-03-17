import { useState, useEffect } from 'react'
import { User, Clock, CreditCard, Shield, Plus, Trash2, Loader2, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

type Service = { id: string; name: string; description: string | null; price: number; duration_minutes: number; active: boolean }

const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
type Schedule = Record<string, { active: boolean; start: string; end: string }>

const defaultSchedule: Schedule = {
  Segunda: { active: true, start: '08:00', end: '18:00' },
  Terça: { active: true, start: '08:00', end: '18:00' },
  Quarta: { active: true, start: '08:00', end: '18:00' },
  Quinta: { active: true, start: '08:00', end: '18:00' },
  Sexta: { active: true, start: '08:00', end: '18:00' },
  Sábado: { active: true, start: '08:00', end: '14:00' },
  Domingo: { active: false, start: '09:00', end: '12:00' },
}

export default function DashboardConfiguracoes() {
  const { user, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'perfil' | 'servicos' | 'horarios' | 'plano'>('perfil')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({ full_name: '', profession: '', bio: '', phone: '', city: '', state: '' })
  const [services, setServices] = useState<Service[]>([])
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule)
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration_minutes: '60' })
  const [showNewSvc, setShowNewSvc] = useState(false)

  useEffect(() => {
    if (!user || !profile) return
    let ignore = false

    const loadExtra = async () => {
      const [{ data: profileData }, { data: svcs }] = await Promise.all([
        supabase.from('profiles').select('bio, phone, city, state').eq('id', user.id).single(),
        supabase.from('services').select('*').eq('profile_id', user.id).eq('active', true),
      ])

      if (ignore) return

      setForm({
        full_name: profile.full_name ?? '',
        profession: profile.profession ?? '',
        bio: profileData?.bio ?? '',
        phone: profileData?.phone ?? '',
        city: profileData?.city ?? '',
        state: profileData?.state ?? '',
      })
      setServices((svcs as Service[] | null) ?? [])
    }
    void loadExtra()

    return () => {
      ignore = true
    }
  }, [user, profile])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: form.full_name, profession: form.profession, bio: form.bio, phone: form.phone, city: form.city, state: form.state }).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addService = async () => {
    if (!user || !newService.name) return
    const { data } = await supabase.from('services').insert({ profile_id: user.id, name: newService.name, description: newService.description, price: parseFloat(newService.price) || 0, duration_minutes: parseInt(newService.duration_minutes) || 60, active: true }).select().single()
    if (data) { setServices(s => [...s, data as Service]); setNewService({ name: '', description: '', price: '', duration_minutes: '60' }); setShowNewSvc(false) }
  }

  const deleteService = async (id: string) => {
    await supabase.from('services').update({ active: false }).eq('id', id)
    setServices(s => s.filter(sv => sv.id !== id))
  }

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: <User size={16} /> },
    { id: 'servicos', label: 'Serviços', icon: <CreditCard size={16} /> },
    { id: 'horarios', label: 'Horários', icon: <Clock size={16} /> },
    { id: 'plano', label: 'Meu Plano', icon: <Shield size={16} /> },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gerencie seu perfil e preferências</p>
      </div>

      <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 shadow-sm border border-slate-100 w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'perfil' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {form.full_name[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="font-bold text-slate-900">{form.full_name || 'Seu nome'}</div>
              <div className="text-sm text-slate-500">{form.profession || 'Sua profissão'}</div>
              <div className={`text-xs mt-1 font-medium ${profile?.plan === 'free' ? 'text-slate-400' : 'text-amber-500'}`}>
                {profile?.plan === 'pro' ? 'Plano PRO ✨' : profile?.plan === 'business' ? 'Business 🚀' : 'Plano Gratuito'}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Nome completo</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Profissão / Especialidade</label>
              <input value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Descrição</label>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Conte um pouco sobre você e seus serviços..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cidade</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="São Paulo" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Estado</label>
                <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="SP" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">WhatsApp</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-0000" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="mt-5 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {activeTab === 'servicos' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden max-w-2xl">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Meus serviços</h3>
            <button onClick={() => setShowNewSvc(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-indigo-700 transition-colors">
              <Plus size={12} /> Adicionar serviço
            </button>
          </div>

          {showNewSvc && (
            <div className="p-5 bg-indigo-50 border-b border-indigo-100 space-y-3">
              <h4 className="text-sm font-semibold text-indigo-900">Novo serviço</h4>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Nome do serviço *" value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} className="col-span-2 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white" />
                <input placeholder="Descrição" value={newService.description} onChange={e => setNewService(s => ({ ...s, description: e.target.value }))} className="col-span-2 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white" />
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Preço (R$)</label>
                  <input type="number" placeholder="0.00" value={newService.price} onChange={e => setNewService(s => ({ ...s, price: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Duração (min)</label>
                  <input type="number" value={newService.duration_minutes} onChange={e => setNewService(s => ({ ...s, duration_minutes: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addService} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">Salvar</button>
                <button onClick={() => setShowNewSvc(false)} className="border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Cancelar</button>
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-50">
            {services.length === 0 && !showNewSvc ? (
              <div className="p-10 text-center text-slate-400">
                <p className="font-medium">Nenhum serviço cadastrado</p>
                <p className="text-sm mt-1">Clique em "Adicionar serviço" para começar</p>
              </div>
            ) : services.map(s => (
              <div key={s.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{s.name}</div>
                  {s.description && <div className="text-sm text-slate-500">{s.description}</div>}
                  <div className="text-xs text-slate-400 mt-0.5">{s.duration_minutes} min</div>
                </div>
                <div className="font-bold text-slate-900">R${s.price}</div>
                <button onClick={() => deleteService(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'horarios' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-2xl">
          <h3 className="font-bold text-slate-900 mb-5">Horários de funcionamento</h3>
          <div className="space-y-3">
            {weekDays.map(day => (
              <div key={day} className="flex items-center gap-4">
                <button onClick={() => setSchedule(s => ({ ...s, [day]: { ...s[day], active: !s[day].active } }))}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${schedule[day].active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${schedule[day].active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className={`w-20 text-sm font-medium ${schedule[day].active ? 'text-slate-900' : 'text-slate-400'}`}>{day}</span>
                {schedule[day].active ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={schedule[day].start} onChange={e => setSchedule(s => ({ ...s, [day]: { ...s[day], start: e.target.value } }))} className="border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-400" />
                    <span className="text-slate-400 text-sm">até</span>
                    <input type="time" value={schedule[day].end} onChange={e => setSchedule(s => ({ ...s, [day]: { ...s[day], end: e.target.value } }))} className="border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-400" />
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">Fechado</span>
                )}
              </div>
            ))}
          </div>
          <button className="mt-5 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            Salvar horários
          </button>
        </div>
      )}

      {activeTab === 'plano' && (
        <div className="max-w-2xl">
          <div className={`rounded-2xl p-6 text-white mb-6 ${profile?.plan === 'free' ? 'bg-gradient-to-r from-slate-600 to-slate-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-indigo-200 mb-1">Plano atual</div>
                <div className="text-2xl font-bold">
                  {profile?.plan === 'pro' ? 'PRO ✨' : profile?.plan === 'business' ? 'Business 🚀' : 'Gratuito'}
                </div>
                {profile?.plan === 'free' && <div className="text-slate-200 text-sm mt-1">Limitado a 10 agendamentos/mês</div>}
              </div>
              <Shield size={40} className="text-white/30" />
            </div>
          </div>
          {profile?.plan === 'free' ? (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-bold text-slate-900 mb-2">Faça upgrade para o Pro</h3>
              <p className="text-sm text-slate-500 mb-4">Agendamentos ilimitados, WhatsApp automático e destaque no marketplace</p>
              <Link to="/pricing" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
                Ver planos e preços
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Benefícios do seu plano</h3>
              <div className="space-y-2">
                {['Agendamentos ilimitados', 'Integração WhatsApp automático', 'Ferramentas de marketing completas', 'Destaque no marketplace', 'Relatórios avançados', 'Suporte prioritário'].map(b => (
                  <div key={b} className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    {b}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
