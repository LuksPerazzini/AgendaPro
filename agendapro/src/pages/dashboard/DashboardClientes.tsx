import { useState, useEffect } from 'react'
import { Search, Phone, MessageCircle, ChevronRight, Loader2, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type Client = {
  client_name: string
  client_phone: string
  client_email: string | null
  total_visits: number
  total_spent: number
  last_visit: string
}

export default function DashboardClientes() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('appointments')
        .select('client_name, client_phone, client_email, date, services(price)')
        .eq('profile_id', user.id)
        .neq('status', 'cancelled')
        .order('date', { ascending: false })

      if (data) {
        const map = new Map<string, Client>()
        for (const row of data as { client_name: string; client_phone: string; client_email: string | null; date: string; services: { price: number }[] | null }[]) {
          const key = row.client_phone
          if (!map.has(key)) {
            map.set(key, { client_name: row.client_name, client_phone: row.client_phone, client_email: row.client_email, total_visits: 0, total_spent: 0, last_visit: row.date })
          }
          const c = map.get(key)!
          c.total_visits++
          c.total_spent += row.services?.[0]?.price ?? 0
          if (row.date > c.last_visit) c.last_visit = row.date
        }
        setClients(Array.from(map.values()).sort((a, b) => b.last_visit.localeCompare(a.last_visit)))
      }
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = clients.filter(c =>
    c.client_name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_phone.includes(search)
  )

  const totalSpent = clients.reduce((s, c) => s + c.total_spent, 0)
  const avgSpent = clients.length > 0 ? Math.round(totalSpent / clients.length) : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clients.length} clientes cadastrados</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de clientes', value: clients.length, icon: '👥' },
          { label: 'Ativos este mês', value: clients.filter(c => c.last_visit >= new Date().toISOString().slice(0, 7)).length, icon: '✅' },
          { label: 'Receita total', value: `R$${totalSpent.toLocaleString('pt-BR')}`, icon: '💰' },
          { label: 'Média por cliente', value: `R$${avgSpent}`, icon: '📊' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-slate-900">{loading ? '—' : s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-3" />
            <p className="font-medium">{search ? 'Nenhum cliente encontrado' : 'Ainda sem clientes'}</p>
            <p className="text-sm mt-1">Os clientes que agendarem aparecerão aqui</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((client, i) => (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold">{client.client_name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{client.client_name}</div>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={10} /> {client.client_phone}</span>
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{client.total_visits}</div>
                    <div className="text-xs text-slate-400">visitas</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-emerald-600">R${client.total_spent}</div>
                    <div className="text-xs text-slate-400">gasto total</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-700">{new Date(client.last_visit).toLocaleDateString('pt-BR')}</div>
                    <div className="text-xs text-slate-400">última visita</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={`https://wa.me/55${client.client_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors" onClick={e => e.stopPropagation()}>
                    <MessageCircle size={14} />
                  </a>
                  <button className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
