import { useEffect, useState } from 'react'
import { CreditCard, Plus, Trash2, Loader2, AlertCircle, Pencil, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
  active: boolean
}

type ServiceDraft = {
  id?: string
  name: string
  description: string
  price: string
  duration_minutes: string
}

const emptyServiceDraft: ServiceDraft = {
  name: '',
  description: '',
  price: '',
  duration_minutes: '60',
}

export default function DashboardServicos() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [serviceSaving, setServiceSaving] = useState(false)
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>(emptyServiceDraft)
  const [showServiceForm, setShowServiceForm] = useState(false)

  useEffect(() => {
    if (!user) return
    let ignore = false

    const loadServices = async () => {
      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('profile_id', user.id)
        .eq('active', true)
        .order('created_at')

      if (ignore) return

      if (error) {
        setErrorMessage('Não foi possível carregar os serviços agora.')
      }

      setServices((data as Service[] | null) ?? [])
      setLoading(false)
    }

    void loadServices()

    return () => {
      ignore = true
    }
  }, [user])

  const openNewService = () => {
    setServiceDraft(emptyServiceDraft)
    setShowServiceForm(true)
  }

  const openEditService = (service: Service) => {
    setServiceDraft({
      id: service.id,
      name: service.name,
      description: service.description ?? '',
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
    })
    setShowServiceForm(true)
  }

  const closeServiceForm = () => {
    setServiceDraft(emptyServiceDraft)
    setShowServiceForm(false)
  }

  const saveService = async () => {
    if (!user) return

    if (!serviceDraft.name.trim()) {
      setErrorMessage('Informe o nome do serviço para continuar.')
      return
    }

    if (Number(serviceDraft.duration_minutes) <= 0) {
      setErrorMessage('A duração do serviço precisa ser maior que zero.')
      return
    }

    setServiceSaving(true)
    setErrorMessage('')

    if (serviceDraft.id) {
      const { data, error } = await supabase
        .from('services')
        .update({
          name: serviceDraft.name.trim(),
          description: serviceDraft.description.trim() || null,
          price: Number(serviceDraft.price) || 0,
          duration_minutes: Number(serviceDraft.duration_minutes) || 60,
        })
        .eq('id', serviceDraft.id)
        .select()
        .single()

      setServiceSaving(false)

      if (error || !data) {
        setErrorMessage('Não foi possível atualizar o serviço.')
        return
      }

      setServices(current => current.map(service => service.id === serviceDraft.id ? data as Service : service))
      closeServiceForm()
      return
    }

    const { data, error } = await supabase
      .from('services')
      .insert({
        profile_id: user.id,
        name: serviceDraft.name.trim(),
        description: serviceDraft.description.trim() || null,
        price: Number(serviceDraft.price) || 0,
        duration_minutes: Number(serviceDraft.duration_minutes) || 60,
        active: true,
      })
      .select()
      .single()

    setServiceSaving(false)

    if (error || !data) {
      setErrorMessage('Não foi possível criar o serviço.')
      return
    }

    setServices(current => [...current, data as Service])
    closeServiceForm()
  }

  const deleteService = async (id: string) => {
    setDeletingServiceId(id)
    setErrorMessage('')

    const { error } = await supabase.from('services').update({ active: false }).eq('id', id)

    setDeletingServiceId(null)

    if (error) {
      setErrorMessage('Não foi possível remover o serviço agora.')
      return
    }

    setServices(current => current.filter(service => service.id !== id))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <CreditCard size={20} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Serviços</h1>
        <p className="mt-0.5 text-sm text-slate-500">Crie, edite e organize os serviços que seus clientes podem agendar.</p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : (
        <div className="max-w-3xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Meus serviços</h3>
              <p className="mt-1 text-sm text-slate-500">Mantenha sua lista atualizada para facilitar o agendamento online.</p>
            </div>
            <button onClick={openNewService} className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 sm:justify-start">
              <Plus size={12} /> Adicionar serviço
            </button>
          </div>

          {showServiceForm && (
            <div className="space-y-3 border-b border-indigo-100 bg-indigo-50 p-5">
              <h4 className="text-sm font-semibold text-indigo-900">{serviceDraft.id ? 'Editar serviço' : 'Novo serviço'}</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input placeholder="Nome do serviço *" value={serviceDraft.name} onChange={event => setServiceDraft(current => ({ ...current, name: event.target.value }))} className="col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                <input placeholder="Descrição" value={serviceDraft.description} onChange={event => setServiceDraft(current => ({ ...current, description: event.target.value }))} className="col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Preço (R$)</label>
                  <input type="number" placeholder="0.00" value={serviceDraft.price} onChange={event => setServiceDraft(current => ({ ...current, price: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Duração (min)</label>
                  <input type="number" value={serviceDraft.duration_minutes} onChange={event => setServiceDraft(current => ({ ...current, duration_minutes: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={() => void saveService()} disabled={serviceSaving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60">
                  {serviceSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {serviceDraft.id ? 'Salvar serviço' : 'Criar serviço'}
                </button>
                <button onClick={closeServiceForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-50">
            {services.length === 0 && !showServiceForm ? (
              <div className="p-10 text-center text-slate-400">
                <p className="font-medium">Nenhum serviço cadastrado</p>
                <p className="mt-1 text-sm">Clique em "Adicionar serviço" para começar</p>
              </div>
            ) : (
              services.map(service => (
                <div key={service.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{service.name}</div>
                    {service.description && <div className="text-sm text-slate-500">{service.description}</div>}
                    <div className="mt-0.5 text-xs text-slate-400">{service.duration_minutes} min</div>
                  </div>
                  <div className="font-bold text-slate-900">R${service.price.toLocaleString('pt-BR')}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditService(service)} className="rounded-lg bg-indigo-100 p-2 text-indigo-600 transition-colors hover:bg-indigo-200" title="Editar serviço">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => void deleteService(service.id)} disabled={deletingServiceId === service.id} className="rounded-lg p-2 text-slate-400 transition-colors hover:text-red-500 disabled:opacity-60">
                      {deletingServiceId === service.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
