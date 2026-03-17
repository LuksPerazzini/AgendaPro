import { useEffect, useState } from 'react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronLeft, ChevronRight, Plus, Clock, Check, X, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type Appointment = {
  id: string
  client_name: string
  client_phone: string
  time: string
  date: string
  status: string
  services: { name: string; price: number }[] | null
}

type Service = {
  id: string
  name: string
  price: number
  duration_minutes: number
}

const statusLabel: Record<string, string> = { confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado', completed: 'Concluido' }
const statusColor: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
}
const statusCardColor: Record<string, string> = {
  confirmed: 'border-green-200 bg-green-50/80',
  pending: 'border-amber-200 bg-amber-50/80',
  cancelled: 'border-red-200 bg-red-50/80',
  completed: 'border-slate-200 bg-slate-50',
}
const statusBarColor: Record<string, string> = {
  confirmed: 'bg-green-400',
  pending: 'bg-amber-400',
  cancelled: 'bg-red-400',
  completed: 'bg-slate-300',
}

function NovoAgendamentoModal({ onClose, onSaved, services, profileId }: {
  onClose: () => void
  onSaved: () => void
  services: Service[]
  profileId: string | null
}) {
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    service_id: services[0]?.id ?? '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedService = services.find(s => s.id === form.service_id)

  const handleSave = async () => {
    if (!profileId) {
      setError('Seu perfil profissional ainda nao foi carregado. Recarregue a pagina e tente novamente.')
      return
    }

    if (!form.client_name || !form.date || !form.time) {
      setError('Preencha nome do cliente, data e horario.')
      return
    }

    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('appointments').insert({
      profile_id: profileId,
      service_id: form.service_id || null,
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim() || 'N/A',
      client_email: form.client_email.trim() || null,
      date: form.date,
      time: `${form.time}:00`,
      status: 'confirmed',
      notes: form.notes.trim() || null,
    })

    setSaving(false)

    if (err) {
      setError(err.message || 'Erro ao salvar. Tente novamente.')
      return
    }

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Novo Agendamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-xl">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Nome do cliente *</label>
            <input
              value={form.client_name}
              onChange={e => setForm({ ...form, client_name: e.target.value })}
              placeholder="Ex: Maria Silva"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">WhatsApp</label>
              <input
                value={form.client_phone}
                onChange={e => setForm({ ...form, client_phone: e.target.value })}
                placeholder="(11) 99999-0000"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">E-mail</label>
              <input
                type="email"
                value={form.client_email}
                onChange={e => setForm({ ...form, client_email: e.target.value })}
                placeholder="cliente@email.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {services.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Servico</label>
              <select
                value={form.service_id}
                onChange={e => setForm({ ...form, service_id: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">Sem servico especifico</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - R${s.price}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Horario *</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Observacoes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Alguma observacao sobre o atendimento..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {selectedService && (
            <div className="bg-indigo-50 rounded-xl px-4 py-3 text-sm text-indigo-700">
              Servico: <strong>{selectedService.name}</strong> - {selectedService.duration_minutes} min - R${selectedService.price}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardAgenda() {
  const { profile } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'day' | 'week'>('week')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const profileId = profile?.id ?? null
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)
  const weekStartKey = format(weekStart, 'yyyy-MM-dd')
  const weekEndKey = format(weekEnd, 'yyyy-MM-dd')

  const loadAppointments = async (showLoading = true) => {
    if (!profileId) {
      if (showLoading) setLoading(false)
      return
    }

    if (showLoading) setLoading(true)

    const { data } = await supabase
      .from('appointments')
      .select('id, client_name, client_phone, time, date, status, services(name, price)')
      .eq('profile_id', profileId)
      .gte('date', weekStartKey)
      .lte('date', weekEndKey)
      .order('time')

    if (data) setAppointments(data as unknown as Appointment[])
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false

    const loadDashboardData = async () => {
      if (!profileId) {
        setAppointments([])
        setServices([])
        setLoading(false)
        return
      }

      setLoading(true)

      const [{ data: appointmentsData }, { data: servicesData }] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, client_name, client_phone, time, date, status, services(name, price)')
          .eq('profile_id', profileId)
          .gte('date', weekStartKey)
          .lte('date', weekEndKey)
          .order('time'),
        supabase
          .from('services')
          .select('id, name, price, duration_minutes')
          .eq('profile_id', profileId)
          .eq('active', true),
      ])

      if (ignore) return

      setAppointments((appointmentsData as Appointment[] | null) ?? [])
      setServices((servicesData as Service[] | null) ?? [])
      setLoading(false)
    }

    void loadDashboardData()

    return () => {
      ignore = true
    }
  }, [profileId, weekEndKey, weekStartKey])

  const getApts = (date: Date) => {
    const ds = format(date, 'yyyy-MM-dd')
    return appointments.filter(a => a.date === ds)
  }

  const dayApts = getApts(currentDate)

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('appointments').update({ status }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {showModal && (
        <NovoAgendamentoModal
          services={services}
          profileId={profileId}
          onClose={() => setShowModal(false)}
          onSaved={() => void loadAppointments()}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie seus agendamentos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Novo agendamento
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 mb-6">
        <div className="p-4 flex items-center justify-between border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(addDays(currentDate, view === 'day' ? -1 : -7))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-900 min-w-48 text-center">
              {view === 'day'
                ? format(currentDate, "d 'de' MMMM yyyy", { locale: ptBR })
                : `${format(weekStart, "d MMM", { locale: ptBR })} - ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`}
            </span>
            <button onClick={() => setCurrentDate(addDays(currentDate, view === 'day' ? 1 : 7))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setView('day')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'day' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Dia</button>
            <button onClick={() => setView('week')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'week' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Semana</button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : view === 'week' ? (
          <div className="overflow-x-auto">
            <div className="grid min-w-[980px] grid-cols-7 divide-x divide-slate-100">
              {Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).map(day => {
                const apts = getApts(day)
                const isToday = isSameDay(day, new Date())
                const isSelected = isSameDay(day, currentDate)
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { setCurrentDate(day); setView('day') }}
                    className={`flex min-h-[260px] flex-col justify-start p-4 text-left transition-colors ${isSelected ? 'bg-indigo-50/80' : 'hover:bg-slate-50'}`}
                  >
                    <div className="mb-4 flex min-h-[72px] items-start justify-between gap-3">
                      <div className="flex min-h-[72px] flex-col justify-start">
                        <div className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {format(day, 'EEEE', { locale: ptBR })}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-indigo-600 text-white' : isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                            {format(day, 'd')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {apts.length > 0 ? `${apts.length} agendamento${apts.length > 1 ? 's' : ''}` : 'Livre'}
                          </div>
                        </div>
                      </div>
                      <div className="flex min-h-[72px] items-start">
                        {apts.length > 0 && (
                          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                            {apts.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {apts.length === 0 ? (
                      <div className="flex h-[170px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm text-slate-400">
                        Sem agendamentos
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {apts.slice(0, 3).map(apt => (
                          <div
                            key={apt.id}
                            className={`rounded-2xl border px-3 py-3 shadow-sm transition-transform ${statusCardColor[apt.status]}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 h-11 w-1.5 rounded-full ${statusBarColor[apt.status]}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-bold text-slate-900">{apt.time.slice(0, 5)}</div>
                                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor[apt.status]}`}>
                                    {statusLabel[apt.status]}
                                  </span>
                                </div>
                                <div className="mt-2 truncate text-sm font-semibold text-slate-900">{apt.client_name}</div>
                                <div className="mt-1 truncate text-xs text-slate-500">{apt.services?.[0]?.name ?? 'Servico'}</div>
                                <div className="mt-1 text-xs text-slate-400">{apt.client_phone}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {apts.length > 3 && (
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-indigo-600 shadow-sm">
                            +{apts.length - 3} agendamento{apts.length - 3 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {dayApts.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Clock size={40} className="mx-auto mb-3" />
                <p className="font-medium">Nenhum agendamento neste dia</p>
                <p className="text-sm mt-1">Quando clientes agendarem, aparecerao aqui</p>
              </div>
            ) : dayApts.map(apt => (
              <div key={apt.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-16 text-center flex-shrink-0">
                  <div className="text-base font-bold text-slate-900">{apt.time.slice(0, 5)}</div>
                </div>
                <div className={`w-1 h-12 rounded-full flex-shrink-0 ${apt.status === 'confirmed' ? 'bg-green-400' : apt.status === 'pending' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{apt.client_name}</div>
                  <div className="text-sm text-slate-500">{apt.services?.[0]?.name ?? 'Servico'}</div>
                  <div className="text-xs text-slate-400">{apt.client_phone}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-slate-900">{apt.services?.[0]?.price ? `R$${apt.services[0].price}` : '-'}</div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium mt-1 inline-block ${statusColor[apt.status]}`}>
                    {statusLabel[apt.status]}
                  </span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {apt.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(apt.id, 'confirmed')} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><Check size={14} /></button>
                      <button onClick={() => updateStatus(apt.id, 'cancelled')} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors"><X size={14} /></button>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <>
                      <button onClick={() => updateStatus(apt.id, 'completed')} className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors" title="Concluir agendamento">
                        <Check size={14} />
                      </button>
                      <button onClick={() => updateStatus(apt.id, 'cancelled')} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors" title="Cancelar agendamento">
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Confirmado</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Pendente</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Cancelado</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300 inline-block" /> Concluido</div>
      </div>
    </div>
  )
}
