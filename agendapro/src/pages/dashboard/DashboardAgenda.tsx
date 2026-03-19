import { useEffect, useState } from 'react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronLeft, ChevronRight, Plus, Clock, Check, X, Loader2, AlertCircle, MessageCircle } from 'lucide-react'
import WhatsAppComposerModal from '../../components/WhatsAppComposerModal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  defaultWhatsAppTemplates,
  hasReachablePhone,
  normalizeWhatsAppTemplates,
  type MessageTemplateKey,
  type MessageTemplates,
} from '../../lib/whatsapp'

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

type WhatsAppProfileRow = {
  whatsapp_templates?: Partial<MessageTemplates> | null
  booking_requires_confirmation?: boolean | null
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

function formatAppointmentTime(value: string) {
  return value.slice(0, 5)
}

function getTemplateKeysForAppointment(status: string): MessageTemplateKey[] {
  if (status === 'pending') return ['confirmacao', 'cancelamento']
  if (status === 'confirmed') return ['lembrete24h', 'lembrete1h', 'cancelamento']
  if (status === 'completed') return ['avaliacaoPos']
  return ['confirmacao']
}

function NovoAgendamentoModal({ onClose, onSaved, services, profileId, existingAppointments }: {
  onClose: () => void
  onSaved: () => void
  services: Service[]
  profileId: string | null
  existingAppointments: Appointment[]
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

  const selectedService = services.find(service => service.id === form.service_id)
  const normalizedTime = `${form.time}:00`
  const conflictingAppointment = existingAppointments.find(appointment =>
    appointment.date === form.date &&
    appointment.time === normalizedTime &&
    appointment.status !== 'cancelled',
  )

  const handleSave = async () => {
    if (!profileId) {
      setError('Seu perfil profissional ainda não foi carregado. Recarregue a página e tente novamente.')
      return
    }

    if (!form.client_name || !form.date || !form.time) {
      setError('Preencha nome do cliente, data e horário.')
      return
    }

    if (conflictingAppointment) {
      setError(`Ja existe um agendamento ativo para ${formatAppointmentTime(conflictingAppointment.time)} neste dia.`)
      return
    }

    setSaving(true)
    setError('')

    const { data: conflictRows, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('profile_id', profileId)
      .eq('date', form.date)
      .eq('time', normalizedTime)
      .in('status', ['pending', 'confirmed', 'completed'])
      .limit(1)

    if (conflictError) {
      setSaving(false)
      setError('Não foi possível validar conflitos de horário. Tente novamente.')
      return
    }

    if ((conflictRows?.length ?? 0) > 0) {
      setSaving(false)
      setError('Esse horário já está ocupado por outro agendamento ativo.')
      return
    }

    const { error: insertError } = await supabase.from('appointments').insert({
      profile_id: profileId,
      service_id: form.service_id || null,
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim() || 'N/A',
      client_email: form.client_email.trim() || null,
      date: form.date,
      time: normalizedTime,
      status: 'confirmed',
      notes: form.notes.trim() || null,
    })

    setSaving(false)

    if (insertError) {
      const message = insertError.message?.includes('appointments_unique_active_slot') || insertError.code === '23505'
        ? 'Esse horário acabou de ser ocupado por outro agendamento. Escolha outro slot.'
        : insertError.message?.includes('row-level security')
          ? 'Seu banco ainda não liberou criação manual de agendamentos no dashboard. Aplique a policy nova do Supabase e tente novamente.'
          : insertError.message || 'Erro ao salvar. Tente novamente.'
      setError(message)
      return
    }

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">Novo Agendamento</h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome do cliente *</label>
            <input value={form.client_name} onChange={event => setForm({ ...form, client_name: event.target.value })} placeholder="Ex: Maria Silva" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">WhatsApp</label>
              <input value={form.client_phone} onChange={event => setForm({ ...form, client_phone: event.target.value })} placeholder="(11) 99999-0000" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
              <input type="email" value={form.client_email} onChange={event => setForm({ ...form, client_email: event.target.value })} placeholder="cliente@email.com" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>

          {services.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Serviço</label>
              <select value={form.service_id} onChange={event => setForm({ ...form, service_id: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400">
                <option value="">Sem serviço específico</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.name} - R${service.price}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Data *</label>
              <input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Horário *</label>
              <input type="time" value={form.time} onChange={event => setForm({ ...form, time: event.target.value })} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-indigo-400 ${conflictingAppointment ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200'}`} />
            </div>
          </div>

          {conflictingAppointment && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Slot ocupado por {conflictingAppointment.client_name} as {formatAppointmentTime(conflictingAppointment.time)}.
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Observações</label>
            <textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} placeholder="Alguma observação sobre o atendimento..." rows={2} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
          </div>

          {selectedService && (
            <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              Serviço: <strong>{selectedService.name}</strong> - {selectedService.duration_minutes} min - R${selectedService.price}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-100 p-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={() => void handleSave()} disabled={saving || Boolean(conflictingAppointment)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
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
  const [templates, setTemplates] = useState<MessageTemplates>(defaultWhatsAppTemplates)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [actionError, setActionError] = useState('')
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [bookingNeedsConfirmation, setBookingNeedsConfirmation] = useState(true)

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
      .order('date')
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

      const [{ data: appointmentsData }, { data: servicesData }, { data: profileData }] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, client_name, client_phone, time, date, status, services(name, price)')
          .eq('profile_id', profileId)
          .gte('date', weekStartKey)
          .lte('date', weekEndKey)
          .order('date')
          .order('time'),
        supabase
          .from('services')
          .select('id, name, price, duration_minutes')
          .eq('profile_id', profileId)
          .eq('active', true),
        supabase
          .from('profiles')
          .select('whatsapp_templates, booking_requires_confirmation')
          .eq('id', profileId)
          .maybeSingle(),
      ])

      if (ignore) return

      setAppointments((appointmentsData as Appointment[] | null) ?? [])
      setServices((servicesData as Service[] | null) ?? [])
      setTemplates(normalizeWhatsAppTemplates((profileData as WhatsAppProfileRow | null)?.whatsapp_templates))
      setBookingNeedsConfirmation((profileData as WhatsAppProfileRow | null)?.booking_requires_confirmation ?? true)
      setLoading(false)
    }

    void loadDashboardData()

    return () => {
      ignore = true
    }
  }, [profileId, weekEndKey, weekStartKey])

  const getApts = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return appointments.filter(appointment => appointment.date === dateString)
  }

  const dayApts = getApts(currentDate)

  const updateStatus = async (id: string, status: string) => {
    setActionError('')
    setUpdatingAppointmentId(id)

    const previousAppointments = appointments
    setAppointments(current => current.map(appointment => appointment.id === id ? { ...appointment, status } : appointment))

    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)

    setUpdatingAppointmentId(null)

    if (error) {
      setAppointments(previousAppointments)
      setActionError('Não foi possível atualizar o status do agendamento. Tente novamente.')
    }
  }

  const isUpdating = (appointmentId: string) => updatingAppointmentId === appointmentId

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {selectedAppointment && (
        <WhatsAppComposerModal
          title="Mensagem do agendamento"
          recipientName={selectedAppointment.client_name}
          recipientPhone={selectedAppointment.client_phone}
          templates={templates}
          templateKeys={getTemplateKeysForAppointment(selectedAppointment.status)}
          variables={{
            nome: selectedAppointment.client_name,
            servico: selectedAppointment.services?.[0]?.name ?? 'atendimento',
            data: format(new Date(`${selectedAppointment.date}T12:00:00`), "d 'de' MMM", { locale: ptBR }),
            hora: formatAppointmentTime(selectedAppointment.time),
          }}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {showModal && (
        <NovoAgendamentoModal
          services={services}
          profileId={profileId}
          existingAppointments={appointments}
          onClose={() => setShowModal(false)}
          onSaved={() => void loadAppointments()}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gerencie seus agendamentos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
          <Plus size={16} /> Novo agendamento
        </button>
      </div>

      <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${bookingNeedsConfirmation ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
        <span className="font-semibold">
          {bookingNeedsConfirmation ? 'Novos agendamentos entram como pedido.' : 'Novos agendamentos entram confirmados automaticamente.'}
        </span>{' '}
        {bookingNeedsConfirmation
                  ? 'Você revisa e confirma depois pelo dashboard ou pelo WhatsApp.'
                  : 'Use essa opção quando não precisar aprovar cada horário manualmente.'}
      </div>

      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} /> {actionError}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(addDays(currentDate, view === 'day' ? -1 : -7))} className="rounded-lg p-2 transition-colors hover:bg-slate-100">
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-48 text-center text-sm font-semibold text-slate-900">
              {view === 'day'
                ? format(currentDate, "d 'de' MMMM yyyy", { locale: ptBR })
                : `${format(weekStart, "d MMM", { locale: ptBR })} - ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`}
            </span>
            <button onClick={() => setCurrentDate(addDays(currentDate, view === 'day' ? 1 : 7))} className="rounded-lg p-2 transition-colors hover:bg-slate-100">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button onClick={() => setView('day')} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === 'day' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>Dia</button>
            <button onClick={() => setView('week')} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === 'week' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>Semana</button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
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
                  <button key={day.toISOString()} onClick={() => { setCurrentDate(day); setView('day') }} className={`flex min-h-[260px] flex-col justify-start p-4 text-left transition-colors ${isSelected ? 'bg-indigo-50/80' : 'hover:bg-slate-50'}`}>
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
                        {apts.slice(0, 3).map(appointment => (
                          <div key={appointment.id} className={`rounded-2xl border px-3 py-3 shadow-sm transition-transform ${statusCardColor[appointment.status]}`}>
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 h-11 w-1.5 rounded-full ${statusBarColor[appointment.status]}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-bold text-slate-900">{formatAppointmentTime(appointment.time)}</div>
                                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor[appointment.status]}`}>
                                    {statusLabel[appointment.status]}
                                  </span>
                                </div>
                                <div className="mt-2 truncate text-sm font-semibold text-slate-900">{appointment.client_name}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{appointment.services?.[0]?.name ?? 'Serviço'}</div>
                                <div className="mt-1 text-xs text-slate-400">{appointment.client_phone}</div>
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
                <p className="mt-1 text-sm">Quando clientes agendarem, aparecerao aqui</p>
              </div>
            ) : dayApts.map(appointment => (
              <div key={appointment.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
                <div className="w-16 flex-shrink-0 text-center">
                  <div className="text-base font-bold text-slate-900">{formatAppointmentTime(appointment.time)}</div>
                </div>
                <div className={`h-12 w-1 flex-shrink-0 rounded-full ${appointment.status === 'confirmed' ? 'bg-green-400' : appointment.status === 'pending' ? 'bg-amber-400' : appointment.status === 'cancelled' ? 'bg-red-400' : 'bg-slate-300'}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{appointment.client_name}</div>
                      <div className="text-sm text-slate-500">{appointment.services?.[0]?.name ?? 'Serviço'}</div>
                  <div className="text-xs text-slate-400">{appointment.client_phone}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-bold text-slate-900">{appointment.services?.[0]?.price ? `R$${appointment.services[0].price}` : '-'}</div>
                  <span className={`mt-1 inline-block rounded-full border px-2 py-1 text-xs font-medium ${statusColor[appointment.status]}`}>
                    {statusLabel[appointment.status]}
                  </span>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  {isUpdating(appointment.id) ? (
                    <div className="flex items-center justify-center rounded-lg bg-slate-100 p-1.5 text-slate-400">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  ) : (
                    <>
                      {hasReachablePhone(appointment.client_phone) && (
                        <button
                          type="button"
                          onClick={() => setSelectedAppointment(appointment)}
                          className="rounded-lg bg-green-100 p-1.5 text-green-600 transition-colors hover:bg-green-200"
                          title="Abrir mensagem pronta"
                        >
                          <MessageCircle size={14} />
                        </button>
                      )}
                      {appointment.status === 'pending' && (
                        <>
                          <button onClick={() => void updateStatus(appointment.id, 'confirmed')} className="rounded-lg bg-green-100 p-1.5 text-green-600 transition-colors hover:bg-green-200" title="Confirmar agendamento"><Check size={14} /></button>
                          <button onClick={() => void updateStatus(appointment.id, 'cancelled')} className="rounded-lg bg-red-100 p-1.5 text-red-500 transition-colors hover:bg-red-200" title="Cancelar agendamento"><X size={14} /></button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <>
                          <button onClick={() => void updateStatus(appointment.id, 'completed')} className="rounded-lg bg-indigo-100 p-1.5 text-indigo-600 transition-colors hover:bg-indigo-200" title="Concluir agendamento"><Check size={14} /></button>
                          <button onClick={() => void updateStatus(appointment.id, 'cancelled')} className="rounded-lg bg-red-100 p-1.5 text-red-500 transition-colors hover:bg-red-200" title="Cancelar agendamento"><X size={14} /></button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-green-400" /> Confirmado</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-amber-400" /> Pendente</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-red-400" /> Cancelado</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-slate-300" /> Concluido</div>
      </div>
    </div>
  )
}

