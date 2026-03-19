import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, MessageCircle, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, addDays, addMonths, endOfMonth, endOfWeek, isBefore, isSameDay, isSameMonth, startOfDay, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

type DaySchedule = {
  active: boolean
  start: string
  end: string
}

type Profile = {
  id: string
  full_name: string
  profession: string
  phone: string | null
  city: string | null
  state: string | null
  avatar_url: string | null
  cover_url: string | null
  rating: number
  review_count: number
  slug: string
  booking_requires_confirmation?: boolean
  schedule?: Record<string, DaySchedule>
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
}

const PUBLIC_PROFILE_BASE_FIELDS = 'id, full_name, profession, phone, city, state, avatar_url, cover_url, rating, review_count, slug'
const PUBLIC_PROFILE_FIELDS = `${PUBLIC_PROFILE_BASE_FIELDS}, booking_requires_confirmation`
const PUBLIC_PROFILE_FIELDS_WITH_SCHEDULE = `${PUBLIC_PROFILE_FIELDS}, schedule`

function getWeekdayKey(date: Date) {
  const weekdayMap = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  return weekdayMap[date.getDay()]
}

function buildTimeSlots(start: string, end: string) {
  const slots: string[] = []
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute

  for (let minutes = startTotal; minutes < endTotal; minutes += 30) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`)
  }

  return slots
}

function generateSlots({
  booked,
  durationMin,
  workStart,
  workEnd,
  isToday,
}: {
  booked: string[]
  durationMin: number
  workStart: string
  workEnd: string
  isToday: boolean
}) {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  return buildTimeSlots(workStart, workEnd).map(time => {
    const [h, m] = time.split(':').map(Number)
    const startMin = h * 60 + m
    const endMin = startMin + durationMin
    const outsideWindow = endMin > (Number(workEnd.split(':')[0]) * 60 + Number(workEnd.split(':')[1]))
    const blockedByExisting = booked.some(bookedTime => {
      const [bookedHour, bookedMinute] = bookedTime.split(':').map(Number)
      const bookedStart = bookedHour * 60 + bookedMinute
      return startMin < bookedStart + 60 && endMin > bookedStart
    })
    const blockedByPast = isToday && startMin <= currentMinutes

    return {
      time,
      available: !outsideWindow && !blockedByExisting && !blockedByPast,
    }
  })
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const serviceParam = searchParams.get('service')

  const [pro, setPro] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loadingPro, setLoadingPro] = useState(true)
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedServiceId, setSelectedServiceId] = useState(serviceParam || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [contactConfirmed, setContactConfirmed] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))

  const today = startOfDay(new Date())
  const hasPublicSchedule = Boolean(pro?.schedule && Object.keys(pro.schedule).length > 0)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { locale: ptBR })
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR })
    const days: Date[] = []

    for (let day = calendarStart; day <= calendarEnd; day = addDays(day, 1)) {
      days.push(day)
    }

    return days
  }, [currentMonth])

  useEffect(() => {
    if (!id) return

    const load = async () => {
      setLoadingPro(true)

      const findProfile = async (column: 'slug' | 'id', value: string) => {
        const withSchedule = await supabase
          .from('public_profiles')
          .select(PUBLIC_PROFILE_FIELDS_WITH_SCHEDULE)
          .eq(column, value)
          .single()

        if (withSchedule.data) {
          return withSchedule.data as Profile
        }

        const withoutSchedule = await supabase
          .from('public_profiles')
          .select(PUBLIC_PROFILE_FIELDS)
          .eq(column, value)
          .single()

        if (withoutSchedule.data) {
          return withoutSchedule.data as Profile
        }

        const legacyProfile = await supabase
          .from('public_profiles')
          .select(PUBLIC_PROFILE_BASE_FIELDS)
          .eq(column, value)
          .single()

        if (legacyProfile.data) {
          return legacyProfile.data as Profile
        }

        return null
      }

      let profileData = await findProfile('slug', id)
      if (!profileData) {
        profileData = await findProfile('id', id)
      }

      if (profileData) {
        setPro(profileData)
        const { data: svcData } = await supabase
          .from('services')
          .select('id, name, description, price, duration_minutes')
          .eq('profile_id', profileData.id)
          .eq('active', true)
          .order('price')
        setServices((svcData as Service[] | null) ?? [])
        if (serviceParam && svcData) {
          const match = (svcData as Service[]).find(service => service.id === serviceParam)
          if (match) setSelectedServiceId(match.id)
        }
      }
      setLoadingPro(false)
    }

    void load()
  }, [id, serviceParam])

  useEffect(() => {
    if (!selectedDate || !pro) return

    const load = async () => {
      const { data } = await supabase.rpc('get_public_booked_slots', {
        profile_uuid: pro.id,
        slot_date: selectedDate,
      })
      setBookedTimes((data ?? []).map((row: { slot_time: string }) => row.slot_time.slice(0, 5)))
    }

    void load()
  }, [selectedDate, pro])

  const selectedService = services.find(service => service.id === selectedServiceId)
  const selectedDateObject = selectedDate ? new Date(`${selectedDate}T12:00:00`) : null
  const bookingNeedsConfirmation = pro?.booking_requires_confirmation ?? true
  const formattedSelectedDate = selectedDateObject
    ? format(selectedDateObject, "d 'de' MMMM", { locale: ptBR })
    : ''
  const selectedDaySchedule = selectedDateObject && pro?.schedule
    ? pro.schedule[getWeekdayKey(selectedDateObject)]
    : null
  const selectedDateIsToday = selectedDate ? selectedDate === format(today, 'yyyy-MM-dd') : false

  const slots = useMemo(() => {
    if (!selectedDate || !selectedService || !selectedDaySchedule?.active) return []

    return generateSlots({
      booked: bookedTimes,
      durationMin: selectedService.duration_minutes,
      workStart: selectedDaySchedule.start,
      workEnd: selectedDaySchedule.end,
      isToday: selectedDateIsToday,
    })
  }, [bookedTimes, selectedDate, selectedDateIsToday, selectedDaySchedule, selectedService])

  const handleConfirm = async () => {
    if (!pro || !selectedService || !clientName || !clientPhone || !selectedTime) return

    setSaving(true)
    setError('')

    const normalizedTime = `${selectedTime}:00`

    const { data: latestBookedSlots, error: conflictError } = await supabase.rpc('get_public_booked_slots', {
      profile_uuid: pro.id,
      slot_date: selectedDate,
    })

    if (conflictError) {
      setSaving(false)
      setError('Não foi possível validar o horário selecionado. Tente novamente.')
      return
    }

    const occupiedTimes = (latestBookedSlots ?? []).map((row: { slot_time: string }) => row.slot_time.slice(0, 8))

    if (occupiedTimes.includes(normalizedTime)) {
      setSaving(false)
      setError('Esse horário acabou de ficar indisponível. Escolha outro slot.')
      setBookedTimes((latestBookedSlots ?? []).map((row: { slot_time: string }) => row.slot_time.slice(0, 5)))
      setStep(2)
      setSelectedTime('')
      return
    }

    const { error: err } = await supabase.from('appointments').insert({
      profile_id: pro.id,
      service_id: selectedService.id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      client_email: clientEmail.trim() || null,
      date: selectedDate,
      time: normalizedTime,
      status: bookingNeedsConfirmation ? 'pending' : 'confirmed',
      notes: clientNotes.trim() || null,
    })

    setSaving(false)

    if (err) {
      const rawMessage = err.message ?? ''
      const message = rawMessage.includes('appointments_unique_active_slot') || err.code === '23505'
        ? 'Esse horário foi ocupado enquanto você finalizava o agendamento. Escolha outro horário.'
        : rawMessage.toLowerCase().includes('row-level security')
          ? 'O banco ainda está bloqueando agendamentos públicos. A policy de insert precisa ser ajustada no Supabase.'
          : 'Erro ao confirmar agendamento. Tente novamente.'
      setError(message)
      if (message.includes('Escolha outro horario')) {
        setStep(2)
        setSelectedTime('')
      }
      return
    }

    setStep(4)
  }

  if (loadingPro) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!pro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center text-slate-500">
        <AlertCircle size={48} className="text-slate-300" />
        <p className="text-lg font-medium">Profissional não encontrado</p>
        <Link to="/marketplace" className="text-indigo-600 hover:underline">Voltar ao marketplace</Link>
      </div>
    )
  }

  return (
    <div className="page-enter min-h-screen bg-transparent py-6 sm:py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="public-panel mb-6 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm">
          <Link to={`/professional/${pro.slug}`} className="text-slate-500 hover:text-slate-700">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            {pro.avatar_url ? (
              <img src={pro.avatar_url} alt={pro.full_name} className="h-11 w-11 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 font-bold text-white shadow-sm">
                {pro.full_name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-900">{pro.full_name}</div>
              <div className="text-sm text-indigo-600">{pro.profession}</div>
            </div>
          </div>
        </div>

        <div className="public-chip mb-8 flex items-center gap-2 rounded-2xl px-3 py-3 shadow-sm">
          {[1, 2, 3].map(progressStep => (
            <div key={progressStep} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${step > progressStep ? 'bg-green-500 text-white' : step === progressStep ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step > progressStep ? <CheckCircle size={16} /> : progressStep}
              </div>
              <span className={`hidden text-xs font-medium sm:block ${step === progressStep ? 'text-indigo-600' : 'text-slate-400'}`}>
                {progressStep === 1 ? 'Serviço' : progressStep === 2 ? 'Data e Hora' : 'Seus dados'}
              </span>
              {progressStep < 3 && <div className={`h-0.5 w-8 ${step > progressStep ? 'bg-green-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="public-panel rounded-[2rem] p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)]">
            <h2 className="mb-1 text-xl font-bold text-slate-900">Escolha o serviço</h2>
            <p className="mb-5 text-sm text-slate-500">Selecione o atendimento ideal para você</p>
            {!hasPublicSchedule && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                A agenda pública deste profissional ainda não está disponível. Os serviços aparecem normalmente, mas a escolha de horário só funciona depois que a disponibilidade for publicada corretamente.
              </div>
            )}
            {services.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p>Este profissional ainda não cadastrou serviços.</p>
                <Link to="/marketplace" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">Voltar ao marketplace</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map(service => (
                  <button key={service.id} onClick={() => setSelectedServiceId(service.id)} className={`w-full rounded-xl border-2 p-4 text-left transition-all ${selectedServiceId === service.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{service.name}</div>
                        {service.description && <div className="mt-0.5 text-sm text-slate-500">{service.description}</div>}
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={12} /> {service.duration_minutes} minutos
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold text-indigo-600">R${service.price}</div>
                        {selectedServiceId === service.id && <CheckCircle size={18} className="ml-auto mt-1 text-indigo-500" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {services.length > 0 && (
              <button onClick={() => setStep(2)} disabled={!selectedServiceId} className="mt-5 w-full rounded-xl bg-indigo-600 py-3.5 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                Continuar
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="public-panel rounded-[2rem] p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)]">
            <h2 className="mb-1 text-xl font-bold text-slate-900">Escolha a data e o horário</h2>
            <p className="mb-5 text-sm text-slate-500">{selectedService?.name} - {selectedService?.duration_minutes} min - R${selectedService?.price}</p>

            {!hasPublicSchedule && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Os horários deste profissional não puderam ser carregados agora. Se você for o dono do perfil, atualize a view <strong>public_profiles</strong> no Supabase para incluir a coluna <strong>schedule</strong>.
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), today)}
                className="rounded-lg p-2 transition-colors hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium capitalize text-slate-700">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-lg p-2 transition-colors hover:bg-slate-100">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(label => (
                <div key={label} className="py-1">{label}</div>
              ))}
            </div>

            <div className="mb-6 grid grid-cols-7 gap-2">
              {calendarDays.map(day => {
                const isPast = isBefore(day, today)
                const dateStr = format(day, 'yyyy-MM-dd')
                const isSelected = selectedDate === dateStr
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const daySchedule = pro?.schedule?.[getWeekdayKey(day)]
                const isWorkingDay = Boolean(daySchedule?.active)
                const isTodayCell = isSameDay(day, today)

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      if (!isPast && isCurrentMonth) {
                        setSelectedDate(dateStr)
                        setSelectedTime('')
                        setError('')
                      }
                    }}
                    disabled={isPast || !isCurrentMonth}
                    className={`min-h-[76px] rounded-2xl border px-2 py-3 text-left text-sm transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-[0_18px_32px_-24px_rgba(79,70,229,0.9)]'
                        : isCurrentMonth
                          ? 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                          : 'border-transparent bg-slate-50 text-slate-300'
                    } ${isPast ? 'cursor-not-allowed opacity-45' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`text-base font-bold ${isSelected ? 'text-white' : isCurrentMonth ? 'text-slate-900' : 'text-slate-300'}`}>
                        {format(day, 'd')}
                      </span>
                      {isTodayCell && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                          Hoje
                        </span>
                      )}
                    </div>
                    <div className={`mt-3 text-[11px] ${isSelected ? 'text-indigo-100' : isCurrentMonth ? 'text-slate-500' : 'text-slate-300'}`}>
                      {isCurrentMonth ? (isWorkingDay ? 'Horário disponível' : 'Sem atendimento') : ''}
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedDate && hasPublicSchedule && (
              <>
                {selectedDaySchedule?.active ? (
                  <>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      Horários disponíveis - {format(new Date(`${selectedDate}T12:00:00`), "d 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <p className="mb-4 text-xs text-slate-500">Atendimento neste dia: {selectedDaySchedule.start} ate {selectedDaySchedule.end}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map(slot => (
                        <button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available} className={`rounded-xl py-2.5 text-sm font-medium transition-all ${!slot.available ? 'cursor-not-allowed bg-slate-100 text-slate-300 line-through' : selectedTime === slot.time ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-indigo-50'}`}>
                          {slot.time}
                        </button>
                      ))}
                    </div>
                    {slots.every(slot => !slot.available) && (
                      <p className="mt-4 text-center text-sm text-slate-400">Nenhum horário disponível nesta data. Tente outro dia.</p>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Este profissional não atende nesse dia. Escolha outra data.
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50">Voltar</button>
              <button onClick={() => setStep(3)} disabled={!hasPublicSchedule || !selectedDate || !selectedTime} className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="public-panel rounded-[2rem] p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)]">
            <h2 className="mb-1 text-xl font-bold text-slate-900">Seus dados</h2>
            <p className="mb-5 text-sm text-slate-500">Preencha as informações para concluir o pedido</p>

            <div className="mb-5 overflow-hidden rounded-[1.75rem] border border-indigo-200 bg-white shadow-[0_24px_50px_-34px_rgba(79,70,229,0.45)]">
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-4 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100">Revise antes de confirmar</div>
                <div className="mt-1 text-xl font-bold">Resumo do agendamento</div>
              </div>
              <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Serviço</div>
                  <div className="mt-1 text-base font-bold text-slate-900">{selectedService?.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{selectedService?.duration_minutes} min</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Valor</div>
                  <div className="mt-1 text-base font-bold text-indigo-600">R${selectedService?.price}</div>
                  <div className="mt-1 text-sm text-slate-500">Pagamento combinado com o profissional</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Data</div>
                  <div className="mt-1 text-base font-bold text-slate-900">{formattedSelectedDate}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Horário</div>
                  <div className="mt-1 text-base font-bold text-slate-900">{selectedTime}</div>
                </div>
              </div>
            </div>

            <div className={`mb-5 rounded-2xl px-4 py-3 text-sm ${bookingNeedsConfirmation ? 'border border-amber-200 bg-amber-50 text-amber-800' : 'border border-green-200 bg-green-50 text-green-800'}`}>
              {bookingNeedsConfirmation ? (
                <>
                  Seu horário fica registrado agora como <strong>pedido de agendamento</strong>. O profissional pode confirmar com você pelo WhatsApp ou telefone.
                </>
              ) : (
                <>
                  Este profissional trabalha com <strong>confirmação automática</strong>. Se o horário estiver livre, o agendamento já entra confirmado ao finalizar.
                </>
              )}
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo *</label>
                <input type="text" value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Seu nome" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">WhatsApp ou telefone *</label>
                <input type="tel" value={clientPhone} onChange={event => setClientPhone(event.target.value)} placeholder="(11) 99999-0000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail (opcional)</label>
                <input type="email" value={clientEmail} onChange={event => setClientEmail(event.target.value)} placeholder="seu@email.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Observações (opcional)</label>
                <textarea value={clientNotes} onChange={event => setClientNotes(event.target.value)} placeholder="Alguma observação para o profissional..." rows={3} className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={contactConfirmed}
                  onChange={event => setContactConfirmed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Confirmo que meus dados estão corretos para contato sobre este agendamento.
                </span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50">Voltar</button>
              <button onClick={() => void handleConfirm()} disabled={!clientName || !clientPhone || !contactConfirmed || saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Confirmando...</> : 'Confirmar agendamento'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="public-panel rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)]">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              {bookingNeedsConfirmation ? 'Pedido enviado com sucesso!' : 'Agendamento confirmado com sucesso!'}
            </h2>
            <p className="mb-3 text-slate-500">
              {bookingNeedsConfirmation
                ? 'Seu horário já foi registrado e agora aguarda o retorno do profissional.'
                : 'Seu horário já foi reservado e confirmado para este atendimento.'}
            </p>
            <p className="mb-6 text-sm text-slate-400">
              {bookingNeedsConfirmation
                ? 'Se quiser agilizar, você pode mandar uma mensagem agora pelo WhatsApp.'
                : 'Se quiser combinar algum detalhe extra, você ainda pode mandar uma mensagem pelo WhatsApp.'}
            </p>

            <div className="mb-6 space-y-2 rounded-xl bg-slate-50 p-5 text-left text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Profissional</span><span className="font-medium">{pro.full_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Serviço</span><span className="font-medium">{selectedService?.name}</span></div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`font-medium ${bookingNeedsConfirmation ? 'text-amber-600' : 'text-green-600'}`}>
                  {bookingNeedsConfirmation ? 'Aguardando confirmação' : 'Confirmado'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">Data</span><span className="font-medium">{formattedSelectedDate}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Horário</span><span className="font-medium">{selectedTime}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Valor</span><span className="font-bold text-indigo-600">R${selectedService?.price}</span></div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {pro.phone && (
                <a href={`https://wa.me/55${pro.phone.replace(/\D/g, '')}?text=Olá ${pro.full_name}! Acabei de fazer um pedido de agendamento para ${selectedService?.name}, no dia ${formattedSelectedDate} às ${selectedTime}. Meu nome é ${clientName}.`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-medium text-white transition-colors hover:bg-green-600">
                  <MessageCircle size={18} /> Avisar no WhatsApp
                </a>
              )}
              <Link to="/marketplace" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50">
                <Calendar size={18} /> Mais profissionais
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

