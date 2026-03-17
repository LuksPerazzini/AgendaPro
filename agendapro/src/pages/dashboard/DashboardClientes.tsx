import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Check,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Search,
  Users,
  X,
} from 'lucide-react'
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

type AppointmentRow = {
  client_name: string
  client_phone: string
  client_email: string | null
  date: string
  services: { price: number }[] | null
}

type EditClientModalProps = {
  client: Client
  profileId: string
  onClose: () => void
  onSaved: () => void
}

function EditClientModal({ client, profileId, onClose, onSaved }: EditClientModalProps) {
  const [form, setForm] = useState({
    client_name: client.client_name,
    client_phone: client.client_phone === 'N/A' ? '' : client.client_phone,
    client_email: client.client_email ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.client_name.trim()) {
      setError('Informe o nome do cliente.')
      return
    }

    setSaving(true)
    setError('')

    const nextPhone = form.client_phone.trim() || 'N/A'
    const nextEmail = form.client_email.trim() || null

    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        client_name: form.client_name.trim(),
        client_phone: nextPhone,
        client_email: nextEmail,
      })
      .eq('profile_id', profileId)
      .eq('client_phone', client.client_phone)

    setSaving(false)

    if (updateError) {
      setError(updateError.message || 'Nao foi possivel atualizar o cliente.')
      return
    }

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Editar cliente</h2>
            <p className="text-sm text-slate-500">Atualize os dados salvos nos agendamentos</p>
          </div>
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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome</label>
            <input
              value={form.client_name}
              onChange={event => setForm(prev => ({ ...prev, client_name: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">WhatsApp</label>
            <input
              value={form.client_phone}
              onChange={event => setForm(prev => ({ ...prev, client_phone: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
              placeholder="(11) 99999-0000"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={form.client_email}
              onChange={event => setForm(prev => ({ ...prev, client_email: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
              placeholder="cliente@email.com"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-100 p-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Salvando...' : 'Salvar alteracoes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardClientes() {
  const { profile } = useAuth()
  const profileId = profile?.id ?? null
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const buildClients = (rows: AppointmentRow[]) => {
    const map = new Map<string, Client>()

    for (const row of rows) {
      const key = row.client_phone
      const existing = map.get(key)

      if (!existing) {
        map.set(key, {
          client_name: row.client_name,
          client_phone: row.client_phone,
          client_email: row.client_email,
          total_visits: 1,
          total_spent: row.services?.[0]?.price ?? 0,
          last_visit: row.date,
        })
        continue
      }

      existing.total_visits += 1
      existing.total_spent += row.services?.[0]?.price ?? 0

      if (row.date > existing.last_visit) {
        existing.last_visit = row.date
        existing.client_name = row.client_name
      }

      if (!existing.client_email && row.client_email) {
        existing.client_email = row.client_email
      }
    }

    return Array.from(map.values()).sort((first, second) => second.last_visit.localeCompare(first.last_visit))
  }

  const loadClients = useCallback(async () => {
    if (!profileId) {
      setClients([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('appointments')
      .select('client_name, client_phone, client_email, date, services(price)')
      .eq('profile_id', profileId)
      .neq('status', 'cancelled')
      .order('date', { ascending: false })

    setClients(buildClients((data as AppointmentRow[] | null) ?? []))
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    let ignore = false

    const syncClients = async () => {
      if (!profileId) {
        if (!ignore) {
          setClients([])
          setLoading(false)
        }
        return
      }

      setLoading(true)

      const { data } = await supabase
        .from('appointments')
        .select('client_name, client_phone, client_email, date, services(price)')
        .eq('profile_id', profileId)
        .neq('status', 'cancelled')
        .order('date', { ascending: false })

      if (ignore) return

      setClients(buildClients((data as AppointmentRow[] | null) ?? []))
      setLoading(false)
    }

    void syncClients()

    return () => {
      ignore = true
    }
  }, [profileId])

  const filtered = useMemo(() => clients.filter(client =>
    client.client_name.toLowerCase().includes(search.toLowerCase()) ||
    client.client_phone.includes(search)
  ), [clients, search])

  const totalSpent = clients.reduce((sum, client) => sum + client.total_spent, 0)
  const avgSpent = clients.length > 0 ? Math.round(totalSpent / clients.length) : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {editingClient && profileId && (
        <EditClientModal
          client={editingClient}
          profileId={profileId}
          onClose={() => setEditingClient(null)}
          onSaved={() => void loadClients()}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="mt-0.5 text-sm text-slate-500">{clients.length} clientes cadastrados</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total de clientes', value: clients.length, icon: '👥' },
          { label: 'Ativos este mes', value: clients.filter(client => client.last_visit >= new Date().toISOString().slice(0, 7)).length, icon: '✅' },
          { label: 'Receita total', value: `R$${totalSpent.toLocaleString('pt-BR')}`, icon: '💰' },
          { label: 'Media por cliente', value: `R$${avgSpent}`, icon: '📊' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="mb-1 text-2xl">{stat.icon}</div>
            <div className="text-xl font-bold text-slate-900">{loading ? '-' : stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-3" />
            <p className="font-medium">{search ? 'Nenhum cliente encontrado' : 'Ainda sem clientes'}</p>
            <p className="mt-1 text-sm">Os clientes que agendarem aparecerao aqui</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((client, index) => (
              <div key={`${client.client_phone}-${index}`} className="p-4 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <span className="font-bold text-indigo-600">{client.client_name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">{client.client_name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Phone size={10} /> {client.client_phone}</span>
                      {client.client_email && <span className="flex items-center gap-1"><Mail size={10} /> {client.client_email}</span>}
                    </div>
                  </div>
                  <div className="hidden items-center gap-6 text-sm md:flex">
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
                      <div className="text-xs text-slate-400">ultima visita</div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <a
                      href={`https://wa.me/55${client.client_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-green-100 p-2 text-green-600 transition-colors hover:bg-green-200"
                    >
                      <MessageCircle size={14} />
                    </a>
                    <button
                      onClick={() => setEditingClient(client)}
                      className="rounded-lg bg-indigo-100 p-2 text-indigo-600 transition-colors hover:bg-indigo-200"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
