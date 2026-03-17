import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Users, Calendar, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type MonthStat = { month: string; revenue: number; bookings: number }
type ServiceStat = { name: string; bookings: number; revenue: number }

export default function DashboardRelatorios() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [confirmed, setConfirmed] = useState(0)
  const [cancelled, setCancelled] = useState(0)
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

      if (!data) { setLoading(false); return }

      const rows = data as { status: string; date: string; services: { name: string; price: number }[] | null }[]

      setTotal(rows.length)
      setConfirmed(rows.filter(r => r.status === 'confirmed' || r.status === 'completed').length)
      setCancelled(rows.filter(r => r.status === 'cancelled').length)
      const rev = rows.filter(r => r.status !== 'cancelled').reduce((s, r) => s + (r.services?.[0]?.price ?? 0), 0)
      setRevenue(rev)

      const monthMap = new Map<string, MonthStat>()
      for (const row of rows) {
        if (row.status === 'cancelled') continue
        const key = row.date.slice(0, 7)
        if (!monthMap.has(key)) monthMap.set(key, { month: key, revenue: 0, bookings: 0 })
        const m = monthMap.get(key)!
        m.bookings++
        m.revenue += row.services?.[0]?.price ?? 0
      }
      const sorted = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))
      setMonthlyStats(sorted)

      const svcMap = new Map<string, ServiceStat>()
      for (const row of rows) {
        if (row.status === 'cancelled' || !row.services?.[0]) continue
        const name = row.services[0].name
        const price = row.services[0].price
        if (!svcMap.has(name)) svcMap.set(name, { name, bookings: 0, revenue: 0 })
        const s = svcMap.get(name)!
        s.bookings++
        s.revenue += price
      }
      setTopServices(Array.from(svcMap.values()).sort((a, b) => b.bookings - a.bookings).slice(0, 5))

      setLoading(false)
    }
    load()
  }, [user])

  const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0
  const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0
  const maxRevenue = Math.max(...monthlyStats.map(m => m.revenue), 1)
  const maxBookings = Math.max(...topServices.map(s => s.bookings), 1)

  const monthName = (key: string) => {
    const [y, m] = key.split('-')
    return new Date(+y, +m - 1).toLocaleDateString('pt-BR', { month: 'short' })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Análise de desempenho do seu negócio</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Faturamento total', value: `R$${revenue.toLocaleString('pt-BR')}`, icon: <DollarSign size={18} className="text-emerald-600" />, bg: 'bg-emerald-50', up: true },
              { label: 'Total agendamentos', value: total, icon: <Calendar size={18} className="text-indigo-600" />, bg: 'bg-indigo-50', up: true },
              { label: 'Taxa de confirmação', value: `${confirmRate}%`, icon: <TrendingUp size={18} className="text-purple-600" />, bg: 'bg-purple-50', up: true },
              { label: 'Taxa de cancelamento', value: `${cancelRate}%`, icon: <Users size={18} className="text-rose-500" />, bg: 'bg-rose-50', up: false },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-slate-100">
                <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>{kpi.icon}</div>
                <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{kpi.label}</div>
                <div className={`flex items-center gap-0.5 text-xs mt-1.5 font-medium ${kpi.up ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {kpi.up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                  últimos 6 meses
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-1">Receita mensal</h3>
              <p className="text-sm text-slate-500 mb-5">Faturamento por mês</p>
              {monthlyStats.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Ainda sem dados suficientes</div>
              ) : (
                <div className="flex items-end gap-2 h-40">
                  {monthlyStats.map(m => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs font-medium text-slate-700">R${m.revenue}</div>
                      <div className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition-colors"
                        style={{ height: `${(m.revenue / maxRevenue) * 100}%`, minHeight: '4px' }} />
                      <div className="text-xs text-slate-400">{monthName(m.month)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-1">Serviços mais populares</h3>
              <p className="text-sm text-slate-500 mb-5">Ranking por número de agendamentos</p>
              {topServices.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-400 text-sm">Nenhum agendamento ainda</div>
              ) : (
                <div className="space-y-4">
                  {topServices.map((s, i) => (
                    <div key={s.name}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                          <span className="font-medium text-slate-800">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{s.bookings} agend.</span>
                          <span className="text-emerald-600 font-semibold">R${s.revenue}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(s.bookings / maxBookings) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {monthlyStats.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:col-span-2">
                <h3 className="font-bold text-slate-900 mb-1">Evolução mensal</h3>
                <p className="text-sm text-slate-500 mb-5">Crescimento dos últimos meses</p>
                <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${monthlyStats.length}, 1fr)` }}>
                  {monthlyStats.map((m, i) => {
                    const growth = i > 0 && monthlyStats[i - 1].revenue > 0
                      ? ((m.revenue - monthlyStats[i - 1].revenue) / monthlyStats[i - 1].revenue * 100).toFixed(1)
                      : null
                    return (
                      <div key={m.month} className="bg-slate-50 rounded-xl p-3 text-center">
                        <div className="text-xs font-medium text-slate-400 mb-1">{monthName(m.month)}</div>
                        <div className="text-base font-bold text-slate-900">R${m.revenue > 999 ? (m.revenue / 1000).toFixed(1) + 'k' : m.revenue}</div>
                        <div className="text-xs text-slate-500">{m.bookings} agend.</div>
                        {growth && <div className="text-xs text-emerald-600 font-medium mt-1">+{growth}%</div>}
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
