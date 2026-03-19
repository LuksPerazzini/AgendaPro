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
import WhatsAppComposerModal from '../../components/WhatsAppComposerModal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  defaultWhatsAppTemplates,
  hasReachablePhone,
  normalizeWhatsAppTemplates,
  normalizePhoneDigits,
  type MessageTemplates,
} from '../../lib/whatsapp'

type ClientMatchField = 'phone' | 'email' | 'name'

type Client = {
  id: string
  client_name: string
  client_phone: string
  client_email: string | null
  total_visits: number
  total_spent: number
  last_visit: string
  matchField: ClientMatchField
  matchValue: string
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

type WhatsAppProfileRow = {
  whatsapp_templates?: Partial<MessageTemplates> | null
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

    let query = supabase
      .from('appointments')
      .update({
        client_name: form.client_name.trim(),
        client_phone: nextPhone,
        client_email: nextEmail,
      })
      .eq('profile_id', profileId)

    if (client.matchField === 'phone') {
      query = query.eq('client_phone', client.matchValue)
    } else if (client.matchField === 'email') {
      query = query.eq('client_email', client.matchValue)
    } else {
      query = query.eq('client_name', client.matchValue).eq('client_phone', 'N/A')
    }

    const { error: updateError } = await query

    setSaving(false)

    if (updateError) {
      setError(updateError.message || 'Não foi possível atualizar o cliente.')
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
            <p className="text-sm text-slate-500">Atualize os dados salvos nos agendamentos relacionados</p>
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
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Salvando...' : 'Salvar alterações'}
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
  const [templates, setTemplates] = useState<MessageTemplates>(defaultWhatsAppTemplates)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const buildClients = (rows: AppointmentRow[]) => {
    const map = new Map<string, Client>()

    for (const row of rows) {
      const phoneDigits = normalizePhoneDigits(row.client_phone)
      const emailKey = row.client_email?.trim().toLowerCase() ?? ''
      const nameKey = row.client_name.trim().toLowerCase()
      const matchField: ClientMatchField = phoneDigits.length >= 10 ? 'phone' : emailKey ? 'email' : 'name'
      const matchValue = matchField === 'phone' ? row.client_phone : matchField === 'email' ? emailKey : row.client_name
      const key = `${matchField}:${matchField === 'phone' ? phoneDigits : matchValue.toLowerCase()}`
      const existing = map.get(key)

      if (!existing) {
        map.set(key, {
          id: key,
          client_name: row.client_name,
          client_phone: row.client_phone,
          client_email: row.client_email,
          total_visits: 1,
          total_spent: row.services?.[0]?.price ?? 0,
          last_visit: row.date,
          matchField,
          matchValue,
        })
        continue
      }

      existing.total_visits += 1
      existing.total_spent += row.services?.[0]?.price ?? 0

      if (row.date > existing.last_visit) {
        existing.last_visit = row.date
        existing.client_name = row.client_name
        existing.client_phone = row.client_phone
      }

      if (!existing.client_email && row.client_email) {
        existing.client_email = row.client_email
      }

      if (!hasReachablePhone(existing.client_phone) && hasReachablePhone(row.client_phone)) {
        existing.client_phone = row.client_phone
      }

      if (matchField === 'email' && !existing.client_email) {
        existing.client_email = row.client_email
      }

      if (matchField === 'name' && nameKey && existing.matchField === 'name') {
        existing.matchValue = row.client_name
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

    setLoading(true)
    setErrorMessage('')

    const [{ data, error }, { data: profileData }] = await Promise.all([
      supabase
        .from('appointments')
        .select('client_name, client_phone, client_email, date, services(price)')
        .eq('profile_id', profileId)
        .neq('status', 'cancelled')
        .order('date', { ascending: false }),
      supabase
        .from('profiles')
        .select('whatsapp_templates')
        .eq('id', profileId)
        .maybeSingle(),
    ])

    if (error) {
      setErrorMessage('Não foi possível carregar a lista de clientes agora.')
      setClients([])
      setLoading(false)
      return
    }

    setClients(buildClients((data as AppointmentRow[] | null) ?? []))
    setTemplates(normalizeWhatsAppTemplates((profileData as WhatsAppProfileRow | null)?.whatsapp_templates))
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadClients()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadClients])

  const filtered = useMemo(() => clients.filter(client =>
    client.client_name.toLowerCase().includes(search.toLowerCase()) ||
    client.client_phone.includes(search) ||
    (client.client_email ?? '').toLowerCase().includes(search.toLowerCase())
  ), [clients, search])

  const totalSpent = clients.reduce((sum, client) => sum + client.total_spent, 0)
  const avgSpent = clients.length > 0 ? Math.round(totalSpent / clients.length) : 0
  const currentMonthKey = new Date().toISOString().slice(0, 7)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {selectedClient && (
        <WhatsAppComposerModal
          title="Mensagem para cliente"
          recipientName={selectedClient.client_name}
          recipientPhone={selectedClient.client_phone}
          templates={templates}
          templateKeys={['confirmacao', 'lembrete24h', 'lembrete1h', 'cancelamento', 'avaliacaoPos']}
          variables={{
            nome: selectedClient.client_name,
            servico: 'atendimento',
          }}
          onClose={() => setSelectedClient(null)}
        />
      )}

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

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total de clientes', value: clients.length, icon: '👥' },
          { label: 'Ativos este mês', value: clients.filter(client => client.last_visit.slice(0, 7) === currentMonthKey).length, icon: '✅' },
          { label: 'Receita total', value: `R$${totalSpent.toLocaleString('pt-BR')}`, icon: '💰' },
          { label: 'Média por cliente', value: `R$${avgSpent.toLocaleString('pt-BR')}`, icon: '📊' },
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
              placeholder="Buscar por nome, telefone ou e-mail..."
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
            {filtered.map(client => (
              <div key={client.id} className="p-4 transition-colors hover:bg-slate-50">
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
                      <div className="font-semibold text-emerald-600">R${client.total_spent.toLocaleString('pt-BR')}</div>
                      <div className="text-xs text-slate-400">gasto total</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-slate-700">{new Date(client.last_visit).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-slate-400">ultima visita</div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {hasReachablePhone(client.client_phone) ? (
                      <button
                        type="button"
                        onClick={() => setSelectedClient(client)}
                        className="rounded-lg bg-green-100 p-2 text-green-600 transition-colors hover:bg-green-200"
                        title="Abrir mensagem pronta"
                      >
                        <MessageCircle size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-lg bg-slate-100 p-2 text-slate-300"
                        title="Cliente sem WhatsApp valido"
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingClient(client)}
                      className="rounded-lg bg-indigo-100 p-2 text-indigo-600 transition-colors hover:bg-indigo-200"
                      title="Editar cliente"
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

