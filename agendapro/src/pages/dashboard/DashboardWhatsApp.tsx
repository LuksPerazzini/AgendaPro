import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { AlertCircle, Copy, Loader2, MessageCircle, Save } from 'lucide-react'
import WhatsAppComposerModal from '../../components/WhatsAppComposerModal'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  defaultWhatsAppTemplates,
  normalizePhoneDigits,
  normalizeWhatsAppTemplates,
  type MessageTemplateKey,
  type MessageTemplates,
} from '../../lib/whatsapp'

type WhatsAppProfileSettings = {
  whatsapp_templates?: Partial<MessageTemplates> | null
}

type AppointmentShortcut = {
  id: string
  client_name: string
  client_phone: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  services: { name: string }[] | null
}

const templateFields: Array<{ key: MessageTemplateKey; label: string }> = [
  { key: 'confirmacao', label: 'Confirmação de agendamento' },
  { key: 'lembrete24h', label: 'Lembrete 24h antes' },
  { key: 'lembrete1h', label: 'Lembrete 1h antes' },
  { key: 'cancelamento', label: 'Mensagem de cancelamento' },
  { key: 'avaliacaoPos', label: 'Pedido de avaliação' },
]

function formatAppointmentDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "d 'de' MMM", { locale: ptBR })
}

function formatAppointmentTime(value: string) {
  return value.slice(0, 5)
}

function getTemplateKeysForStatus(status: AppointmentShortcut['status']): MessageTemplateKey[] {
  if (status === 'pending') return ['confirmacao', 'cancelamento']
  if (status === 'confirmed') return ['lembrete24h', 'lembrete1h', 'cancelamento']
  if (status === 'completed') return ['avaliacaoPos']
  return ['confirmacao']
}

export default function DashboardWhatsApp() {
  const { user, profile } = useAuth()
  const [templates, setTemplates] = useState<MessageTemplates>(defaultWhatsAppTemplates)
  const [appointments, setAppointments] = useState<AppointmentShortcut[]>([])
  const [loading, setLoading] = useState(() => Boolean(user))
  const [savingMode, setSavingMode] = useState<'none' | 'templates'>('none')
  const [savedState, setSavedState] = useState<'idle' | 'saved'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedTemplate, setCopiedTemplate] = useState<MessageTemplateKey | null>(null)
  const [selectedShortcut, setSelectedShortcut] = useState<AppointmentShortcut | null>(null)

  useEffect(() => {
    if (!user) return

    let ignore = false

    const loadData = async () => {
      setLoading(true)
      setErrorMessage('')

      const [{ data: profileData, error: profileError }, { data: appointmentData, error: appointmentError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('whatsapp_templates')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('appointments')
          .select('id, client_name, client_phone, date, time, status, services(name)')
          .eq('profile_id', user.id)
          .in('status', ['pending', 'confirmed', 'completed'])
          .order('date')
          .order('time')
          .limit(8),
      ])

      if (ignore) return

      if (profileError || appointmentError) {
      setErrorMessage('Não foi possível carregar a central do WhatsApp agora.')
        setLoading(false)
        return
      }

      const row = profileData as WhatsAppProfileSettings | null
      setTemplates(normalizeWhatsAppTemplates(row?.whatsapp_templates))
      setAppointments((appointmentData as AppointmentShortcut[] | null) ?? [])
      setLoading(false)
    }

    void loadData()

    return () => {
      ignore = true
    }
  }, [user])

  useEffect(() => {
    if (savedState !== 'saved') return
    const timeout = window.setTimeout(() => setSavedState('idle'), 2200)
    return () => window.clearTimeout(timeout)
  }, [savedState])

  useEffect(() => {
    if (!copiedTemplate) return
    const timeout = window.setTimeout(() => setCopiedTemplate(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [copiedTemplate])

  const persistTemplates = async (value: MessageTemplates) => {
    if (!user) return false

    setSavingMode('templates')
    setErrorMessage('')

    const { error } = await supabase.from('profiles').update({ whatsapp_templates: value }).eq('id', user.id)

    setSavingMode('none')

    if (error) {
      setErrorMessage('Não foi possível salvar no Supabase. Tente novamente.')
      return false
    }

    setSavedState('saved')
    return true
  }

  const handleTemplateChange = (key: MessageTemplateKey, value: string) => {
    setTemplates(current => ({ ...current, [key]: value }))
  }

  const handleSaveTemplates = async () => {
    await persistTemplates(templates)
  }

  const copyTemplate = async (key: MessageTemplateKey) => {
    try {
      await navigator.clipboard.writeText(templates[key])
      setCopiedTemplate(key)
    } catch {
      setErrorMessage('Não foi possível copiar o template automaticamente.')
    }
  }

  const phone = profile?.phone ?? null
  const savedTemplatesCount = Object.values(templates).filter(template => template.trim().length > 0).length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {selectedShortcut && (
        <WhatsAppComposerModal
          title="Mensagem pronta"
          recipientName={selectedShortcut.client_name}
          recipientPhone={selectedShortcut.client_phone}
          templates={templates}
          templateKeys={getTemplateKeysForStatus(selectedShortcut.status)}
          variables={{
            nome: selectedShortcut.client_name,
            servico: selectedShortcut.services?.[0]?.name ?? 'atendimento',
            data: formatAppointmentDate(selectedShortcut.date),
            hora: formatAppointmentTime(selectedShortcut.time),
          }}
          onClose={() => setSelectedShortcut(null)}
        />
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Central WhatsApp</h1>
          <p className="mt-0.5 text-sm text-slate-500">Templates e atalhos para um fluxo manual sem custo</p>
        </div>
        {savedState === 'saved' && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Alteracoes salvas na sua conta
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Esta área funciona em modo sem custo: ela salva seus textos e abre conversas prontas no WhatsApp, mas não envia nada automaticamente.
      </div>

      <div className="mb-8 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <MessageCircle size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{phone ? 'WhatsApp configurado' : 'WhatsApp não configurado'}</h2>
            <p className="text-green-100">
              {phone ? `Número: ${phone}` : 'Configure seu número em Configurações -> Perfil'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Modelos salvos', value: savedTemplatesCount.toString() },
              { label: 'Número configurado', value: phone ? 'Sim' : 'Não' },
            { label: 'Atalhos prontos', value: appointments.length.toString() },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-white/10 p-3 text-center">
              <div className="text-xl font-bold">{loading ? '...' : stat.value}</div>
              <div className="text-xs text-green-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6">
        <div className="mb-5">
          <h3 className="mb-1 font-bold text-slate-900">Atalhos de envio manual</h3>
            <p className="text-sm text-slate-500">Abra mensagens prontas a partir dos seus próximos atendimentos e retornos recentes</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-10 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
            Nenhum agendamento encontrado para montar atalhos agora.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {appointments.map(appointment => (
              <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{appointment.client_name}</div>
                    <div className="mt-1 text-sm text-slate-500">
                        {appointment.services?.[0]?.name ?? 'Serviço'} - {formatAppointmentDate(appointment.date)} - {formatAppointmentTime(appointment.time)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{appointment.client_phone}</div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-slate-600 ring-1 ring-slate-200">
                    {appointment.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedShortcut(appointment)}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <MessageCircle size={14} />
                    Abrir mensagem
                  </button>
                  <span className="inline-flex items-center rounded-xl bg-white px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
                    WhatsApp: {normalizePhoneDigits(appointment.client_phone).length >= 10 ? 'pronto' : 'invalido'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="mb-1 font-bold text-slate-900">Templates de mensagem</h3>
          <p className="text-sm text-slate-500">Personalize os textos que você pode copiar e usar manualmente no WhatsApp</p>
          </div>
          {savingMode === 'templates' && (
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
              <Loader2 size={12} className="animate-spin" /> Salvando
            </span>
          )}
        </div>

        <div className="space-y-4">
          {templateFields.map(field => (
            <div key={field.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                <button
                  type="button"
                  onClick={() => void copyTemplate(field.key)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Copy size={12} />
                  {copiedTemplate === field.key ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <textarea
                value={templates[field.key]}
                onChange={event => handleTemplateChange(field.key, event.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-400"
              />
            </div>
          ))}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">Use variáveis como {`{nome}`}, {`{servico}`}, {`{data}`} e {`{hora}`} para personalizar sua conversa manual.</p>
            <button type="button" onClick={() => void handleSaveTemplates()} disabled={savingMode !== 'none' || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-70">
              {savingMode === 'templates' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar templates
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
