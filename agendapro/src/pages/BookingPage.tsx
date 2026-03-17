import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, MessageCircle, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

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
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
}

const ALL_TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']

function generateSlots(booked: string[], durationMin: number) {
  return ALL_TIMES.map(time => {
    const [h, m] = time.split(':').map(Number)
    const startMin = h * 60 + m
    const endMin = startMin + durationMin
    const blocked = booked.some(b => {
      const [bh, bm] = b.split(':').map(Number)
      const bs = bh * 60 + bm
      return startMin < bs + 60 && endMin > bs
    })
    return { time, available: !blocked }
  })
}

export default function BookingPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  const [pro, setPro] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loadingPro, setLoadingPro] = useState(true)
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('service') || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfDay(new Date()))

  const today = startOfDay(new Date())
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  // Fetch professional by slug or id
  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoadingPro(true)
      // try slug first, then id
      let { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, profession, phone, city, state, avatar_url, cover_url, rating, review_count, slug')
        .eq('slug', id)
        .single()

      if (!profileData) {
        const res = await supabase
          .from('profiles')
          .select('id, full_name, profession, phone, city, state, avatar_url, cover_url, rating, review_count, slug')
          .eq('id', id)
          .single()
        profileData = res.data
      }

      if (profileData) {
        setPro(profileData as Profile)
        const { data: svcData } = await supabase
          .from('services')
          .select('id, name, description, price, duration_minutes')
          .eq('profile_id', profileData.id)
          .eq('active', true)
          .order('price')
        setServices(svcData as Service[] ?? [])
        if (searchParams.get('service') && svcData) {
          const match = (svcData as Service[]).find(s => s.id === searchParams.get('service'))
          if (match) setSelectedServiceId(match.id)
        }
      }
      setLoadingPro(false)
    }
    load()
  }, [id])

  // Fetch booked times when date changes
  useEffect(() => {
    if (!selectedDate || !pro) return
    const load = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('time')
        .eq('profile_id', pro.id)
        .eq('date', selectedDate)
        .neq('status', 'cancelled')
      setBookedTimes((data ?? []).map((r: { time: string }) => r.time.slice(0, 5)))
    }
    load()
  }, [selectedDate, pro])

  const selectedService = services.find(s => s.id === selectedServiceId)
  const slots = selectedDate && selectedService
    ? generateSlots(bookedTimes, selectedService.duration_minutes)
    : []

  const handleConfirm = async () => {
    if (!pro || !selectedService || !clientName || !clientPhone) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('appointments').insert({
      profile_id: pro.id,
      service_id: selectedService.id,
      client_name: clientName,
      client_phone: clientPhone,
      client_email: clientEmail || null,
      date: selectedDate,
      time: selectedTime + ':00',
      status: 'pending',
      notes: clientNotes || null,
    })
    setSaving(false)
    if (err) {
      setError('Erro ao confirmar agendamento. Tente novamente.')
    } else {
      setStep(4)
    }
  }

  if (loadingPro) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!pro) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4 text-slate-500 px-4 text-center">
        <AlertCircle size={48} className="text-slate-300" />
        <p className="font-medium text-lg">Profissional não encontrado</p>
        <Link to="/marketplace" className="text-indigo-600 hover:underline">← Ver todos os profissionais</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={`/professional/${pro.slug}`} className="text-slate-500 hover:text-slate-700">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            {pro.avatar_url ? (
              <img src={pro.avatar_url} alt={pro.full_name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                {pro.full_name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-900">{pro.full_name}</div>
              <div className="text-sm text-indigo-600">{pro.profession}</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-indigo-600' : 'text-slate-400'}`}>
                {s === 1 ? 'Serviço' : s === 2 ? 'Data & Hora' : 'Seus dados'}
              </span>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-green-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Escolha o serviço</h2>
            <p className="text-slate-500 text-sm mb-5">Selecione o que você precisa</p>
            {services.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>Este profissional ainda não cadastrou serviços.</p>
                <Link to="/marketplace" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">← Ver outros profissionais</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map(s => (
                  <button key={s.id} onClick={() => setSelectedServiceId(s.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedServiceId === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        {s.description && <div className="text-sm text-slate-500 mt-0.5">{s.description}</div>}
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                          <Clock size={12} /> {s.duration_minutes} minutos
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-indigo-600">R${s.price}</div>
                        {selectedServiceId === s.id && <CheckCircle size={18} className="text-indigo-500 ml-auto mt-1" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {services.length > 0 && (
              <button onClick={() => setStep(2)} disabled={!selectedServiceId}
                className="w-full mt-5 bg-indigo-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                Continuar →
              </button>
            )}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Escolha a data e horário</h2>
            <p className="text-slate-500 text-sm mb-5">{selectedService?.name} · {selectedService?.duration_minutes} min · R${selectedService?.price}</p>

            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
                disabled={isBefore(addDays(currentWeekStart, -1), today)}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-slate-700 capitalize">
                {format(currentWeekStart, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-6">
              {days.map(day => {
                const isPast = isBefore(day, today)
                const dateStr = format(day, 'yyyy-MM-dd')
                const isSelected = selectedDate === dateStr
                return (
                  <button key={dateStr} onClick={() => { if (!isPast) { setSelectedDate(dateStr); setSelectedTime('') } }}
                    disabled={isPast}
                    className={`flex flex-col items-center py-2.5 rounded-xl text-sm transition-all ${isPast ? 'opacity-30 cursor-not-allowed' : isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 text-slate-700'}`}>
                    <span className="text-xs mb-0.5 font-medium">{format(day, 'EEE', { locale: ptBR })}</span>
                    <span className="font-bold">{format(day, 'd')}</span>
                  </button>
                )
              })}
            </div>

            {selectedDate && (
              <>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Horários disponíveis — {format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${!slot.available ? 'bg-slate-100 text-slate-300 line-through cursor-not-allowed' : selectedTime === slot.time ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 border border-slate-200'}`}>
                      {slot.time}
                    </button>
                  ))}
                </div>
                {slots.every(s => !s.available) && (
                  <p className="text-center text-slate-400 text-sm mt-4">Nenhum horário disponível nesta data. Tente outro dia.</p>
                )}
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">Voltar</button>
              <button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Client Info */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Seus dados</h2>
            <p className="text-slate-500 text-sm mb-5">Para confirmar o agendamento</p>

            <div className="bg-indigo-50 rounded-xl p-4 mb-5 text-sm">
              <div className="font-semibold text-indigo-800 mb-1">Resumo do agendamento</div>
              <div className="text-indigo-700">📋 {selectedService?.name}</div>
              <div className="text-indigo-700">📅 {format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })} às {selectedTime}</div>
              <div className="text-indigo-700">⏱ {selectedService?.duration_minutes} min · R${selectedService?.price}</div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo *</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="Seu nome" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp / Telefone *</label>
                <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-0000" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail (opcional)</label>
                <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                  placeholder="seu@email.com" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações (opcional)</label>
                <textarea value={clientNotes} onChange={e => setClientNotes(e.target.value)}
                  placeholder="Alguma observação para o profissional..." rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors">Voltar</button>
              <button onClick={handleConfirm} disabled={!clientName || !clientPhone || saving}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Confirmando...</> : 'Confirmar agendamento'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Agendamento confirmado!</h2>
            <p className="text-slate-500 mb-6">Seu pedido foi enviado. O profissional entrará em contato para confirmar.</p>

            <div className="bg-slate-50 rounded-xl p-5 text-left mb-6 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Profissional</span><span className="font-medium">{pro.full_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Serviço</span><span className="font-medium">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Data</span><span className="font-medium">{format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Horário</span><span className="font-medium">{selectedTime}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Valor</span><span className="font-bold text-indigo-600">R${selectedService?.price}</span></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {pro.phone && (
                <a href={`https://wa.me/55${pro.phone.replace(/\D/g, '')}?text=Olá ${pro.full_name}! Acabei de agendar ${selectedService?.name} para ${selectedDate} às ${selectedTime}. Meu nome é ${clientName}.`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 bg-green-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                  <MessageCircle size={18} /> Falar no WhatsApp
                </a>
              )}
              <Link to="/marketplace" className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Calendar size={18} /> Mais profissionais
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
