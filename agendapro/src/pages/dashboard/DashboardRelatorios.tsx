import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Users, Calendar, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type MonthStat = { month: string; revenue: number; bookings: number }
type ServiceStat = { name: string; bookings: number; revenue: number }
type AppointmentRow = { status: string; date: string; services: { name: string; price: number }[] | null }

export default function DashboardRelatorios() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [confirmed, setConfirmed] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [monthlyStats, setMonthlyStats] = useState<MonthStat[]>([])
  const [topServices, setTopServices] = useState<ServiceStat[]>([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)

      const { data } = await supabase
        .from('appointments')
        .select('status, date, services(name, price)')
        .eq('profile_id', user.id)
        .gte('date', sixMonthsAgo.toISOString().slice(0, 10))

      if (!data) {
        setLoading(false)
        return
      }

      const rows = data as AppointmentRow[]
      const completedRows = rows.filter(row => row.status === 'completed')

      setTotal(rows.length)
      setConfirmed(rows.filter(row => row.status === 'confirmed' || row.status === 'completed').length)
      setCompleted(completedRows.length)
      setRevenue(completedRows.reduce((sum, row) => sum + (row.services?.[0]?.price ?? 0), 0))

      const monthMap = new Map<string, MonthStat>()
      for (const row of completedRows) {
        const key = row.date.slice(0, 7)
        if (!monthMap.has(key)) monthMap.set(key, { month: key, revenue: 0, bookings: 0 })
        const month = monthMap.get(key)
        if (!month) continue
        month.bookings += 1
        month.revenue += row.services?.[0]?.price ?? 0
      }
      setMonthlyStats(Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month)))

      const serviceMap = new Map<string, ServiceStat>()
      for (const row of completedRows) {
        if (!row.services?.[0]) continue
        const { name, price } = row.services[0]
        if (!serviceMap.has(name)) serviceMap.set(name, { name, bookings: 0, revenue: 0 })
        const service = serviceMap.get(name)
        if (!service) continue
        service.bookings += 1
        service.revenue += price
      }
      setTopServices(Array.from(serviceMap.values()).sort((a, b) => b.bookings - a.bookings).slice(0, 5))

      setLoading(false)
    }
    load()
  }, [user])

  const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0
  const maxRevenue = Math.max(...monthlyStats.map(stat => stat.revenue), 1)
  const maxBookings = Math.max(...topServices.map(service => service.bookings), 1)

  const monthName = (key: string) => {
    const [year, month] = key.split('-')
    return new Date(+year, +month - 1).toLocaleDateString('pt-BR', { month: 'short' })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <p className="mt-0.5 text-sm text-slate-500">Analise de desempenho do seu negocio</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            O faturamento considera apenas atendimentos concluidos para evitar inflar a receita com agendamentos ainda pendentes.
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Faturamento total', value: `R$${revenue.toLocaleString('pt-BR')}`, icon: <DollarSign size={18} className="text-emerald-600" />, bg: 'bg-emerald-50', up: true },
              { label: 'Total agendamentos', value: total, icon: <Calendar size={18} className="text-indigo-600" />, bg: 'bg-indigo-50', up: true },
      { label: 'Taxa de confirmação', value: `${confirmRate}%`, icon: <TrendingUp size={18} className="text-purple-600" />, bg: 'bg-purple-50', up: true },
              { label: 'Atendimentos concluidos', value: completed, icon: <Users size={18} className="text-rose-500" />, bg: 'bg-rose-50', up: completed > 0 },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}>{kpi.icon}</div>
                <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
                <div className="mt-0.5 text-xs text-slate-500">{kpi.label}</div>
                <div className={`mt-1.5 flex items-center gap-0.5 text-xs font-medium ${kpi.up ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {kpi.up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                  ultimos 6 meses
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-6">
              <h3 className="mb-1 font-bold text-slate-900">Receita mensal</h3>
            <p className="mb-5 text-sm text-slate-500">Faturamento por mês concluído</p>
              {monthlyStats.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-400">Ainda sem dados suficientes</div>
              ) : (
                <div className="flex h-40 items-end gap-2">
                  {monthlyStats.map(stat => (
                    <div key={stat.month} className="flex flex-1 flex-col items-center gap-1">
                      <div className="text-xs font-medium text-slate-700">R${stat.revenue}</div>
                      <div className="w-full rounded-t-md bg-indigo-500 transition-colors hover:bg-indigo-600" style={{ height: `${(stat.revenue / maxRevenue) * 100}%`, minHeight: '4px' }} />
                      <div className="text-xs text-slate-400">{monthName(stat.month)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <h3 className="mb-1 font-bold text-slate-900">Serviços mais rentáveis</h3>
              <p className="mb-5 text-sm text-slate-500">Ranking baseado em atendimentos concluidos</p>
              {topServices.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-400">Nenhum atendimento concluido ainda</div>
              ) : (
                <div className="space-y-4">
                  {topServices.map((service, index) => (
                    <div key={service.name}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-xs font-bold text-slate-400">#{index + 1}</span>
                          <span className="font-medium text-slate-800">{service.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{service.bookings} concl.</span>
                          <span className="font-semibold text-emerald-600">R${service.revenue}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(service.bookings / maxBookings) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {monthlyStats.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-2">
                <h3 className="mb-1 font-bold text-slate-900">Evolucao mensal</h3>
                <p className="mb-5 text-sm text-slate-500">Crescimento de receita nos ultimos meses</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${monthlyStats.length}, 1fr)` }}>
                  {monthlyStats.map((stat, index) => {
                    const growth = index > 0 && monthlyStats[index - 1].revenue > 0
                      ? ((stat.revenue - monthlyStats[index - 1].revenue) / monthlyStats[index - 1].revenue * 100).toFixed(1)
                      : null
                    return (
                      <div key={stat.month} className="rounded-xl bg-slate-50 p-3 text-center">
                        <div className="mb-1 text-xs font-medium text-slate-400">{monthName(stat.month)}</div>
                        <div className="text-base font-bold text-slate-900">R${stat.revenue > 999 ? `${(stat.revenue / 1000).toFixed(1)}k` : stat.revenue}</div>
                        <div className="text-xs text-slate-500">{stat.bookings} concl.</div>
                        {growth && <div className="mt-1 text-xs font-medium text-emerald-600">+{growth}%</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


