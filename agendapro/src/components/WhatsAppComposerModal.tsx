import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, MessageCircle, X } from 'lucide-react'
import {
  buildWhatsAppMessage,
  getWhatsAppLink,
  hasReachablePhone,
  type MessageTemplateKey,
  type MessageTemplates,
  type WhatsAppTemplateVariables,
  whatsappTemplateLabels,
} from '../lib/whatsapp'

type WhatsAppComposerModalProps = {
  recipientName: string
  recipientPhone: string
  templates: MessageTemplates
  templateKeys: MessageTemplateKey[]
  variables: WhatsAppTemplateVariables
  title?: string
  onClose: () => void
}

export default function WhatsAppComposerModal({
  recipientName,
  recipientPhone,
  templates,
  templateKeys,
  variables,
  title = 'Enviar mensagem',
  onClose,
}: WhatsAppComposerModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateKey>(templateKeys[0] ?? 'confirmacao')
  const generatedMessage = useMemo(
    () => buildWhatsAppMessage(templates[selectedTemplate], variables),
    [selectedTemplate, templates, variables]
  )
  const [message, setMessage] = useState(generatedMessage)

  useEffect(() => {
    setSelectedTemplate(templateKeys[0] ?? 'confirmacao')
  }, [templateKeys])

  useEffect(() => {
    setMessage(generatedMessage)
  }, [generatedMessage])

  const whatsappLink = getWhatsAppLink(recipientPhone, message)
  const canSend = hasReachablePhone(recipientPhone)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mensagem manual para <strong>{recipientName}</strong>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Número: <strong>{recipientPhone || 'Não informado'}</strong>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Template</label>
            <div className="flex flex-wrap gap-2">
              {templateKeys.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTemplate(key)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selectedTemplate === key ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300'}`}
                >
                  {whatsappTemplateLabels[key]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Mensagem</label>
            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              rows={8}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-400"
            />
          </div>

          {!canSend && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Esse cliente ainda não tem um WhatsApp válido para abrir a conversa.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-between">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Fechar
          </button>
          <a
            href={whatsappLink ?? '#'}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors ${canSend ? 'bg-green-600 hover:bg-green-700' : 'pointer-events-none bg-slate-300'}`}
          >
            <MessageCircle size={16} />
            Abrir no WhatsApp
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
