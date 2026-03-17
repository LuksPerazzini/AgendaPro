import { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronLeft, ChevronRight, Plus, Clock, Check, X, Loader2 } from 'lucide-react'
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

const statusLabel: Record<string, string> = { confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado', completed: 'Concluído' }
const statusColor: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function DashboardAgenda() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'day' | 'week'>('week')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const from = format(weekStart, 'yyyy-MM-dd')
      const to = format(weekEnd, 'yyyy-MM-dd')
      const { data } = await supabase
        .from('appointments')
        .select('id, client_name, client_phone, time, date, status, services(name, price)')
        .eq('profile_id', user.id)
        .gte('date', from)
        .lte('date', to)
        .order('time')
      if (data) setAppointments(data as unknown as Appointment[])
      setLoading(false)
    }
    load()
  }, [user, weekStart.toISOString()])

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie seus agendamentos</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors">
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
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(day => {
              const apts = getApts(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = isSameDay(day, currentDate)
              return (
                <button key={day.toISOString()} onClick={() => { setCurrentDate(day); setView('day') }}
                  className={`p-3 text-center hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}>
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {format(day, 'EEE', { locale: ptBR }).toUpperCase()}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2 ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                    {format(day, 'd')}
                  </div>
                  {apts.length > 0 && (
                    <div className="space-y-1">
                      {apts.slice(0, 2).map(a => (
                        <div key={a.id} className={`text-xs px-1 py-0.5 rounded truncate ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' : a.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {a.time.slice(0, 5)} {a.client_name.split(' ')[0]}
                        </div>
                      ))}
                      {apts.length > 2 && <div className="text-xs text-slate-400">+{apts.length - 2}</div>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {dayApts.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Clock size={40} className="mx-auto mb-3" />
                <p className="font-medium">Nenhum agendamento neste dia</p>
                <p className="text-sm mt-1">Quando clientes agendarem, aparecerão aqui</p>
              </div>
            ) : dayApts.map(apt => (
              <div key={apt.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-16 text-center flex-shrink-0">
                  <div className="text-base font-bold text-slate-900">{apt.time.slice(0, 5)}</div>
                </div>
                <div className={`w-1 h-12 rounded-full flex-shrink-0 ${apt.status === 'confirmed' ? 'bg-green-400' : apt.status === 'pending' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{apt.client_name}</div>
                  <div className="text-sm text-slate-500">{apt.services?.[0]?.name ?? 'Serviço'}</div>
                  <div className="text-xs text-slate-400">{apt.client_phone}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-slate-900">{apt.services?.[0]?.price ? `R$${apt.services[0].price}` : '—'}</div>
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
                    <button onClick={() => updateStatus(apt.id, 'completed')} className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"><Check size={14} /></button>
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
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300 inline-block" /> Concluído</div>
      </div>
    </div>
  )
}
