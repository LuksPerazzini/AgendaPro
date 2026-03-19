export type AutomationSettings = {
  confirmacao: boolean
  lembrete24h: boolean
  lembrete1h: boolean
  cancelamento: boolean
  avaliacaoPos: boolean
}

export type MessageTemplateKey = 'confirmacao' | 'lembrete24h' | 'lembrete1h' | 'cancelamento' | 'avaliacaoPos'

export type MessageTemplates = Record<MessageTemplateKey, string>

export type WhatsAppTemplateVariables = {
  nome?: string | null
  servico?: string | null
  data?: string | null
  hora?: string | null
}

export const defaultWhatsAppSettings: AutomationSettings = {
  confirmacao: true,
  lembrete24h: true,
  lembrete1h: false,
  cancelamento: true,
  avaliacaoPos: true,
}

export const defaultWhatsAppTemplates: MessageTemplates = {
  confirmacao:
    'Ola, {nome}! Seu agendamento foi confirmado.\n\nServico: {servico}\nData: {data} as {hora}\n\nAte la!',
  lembrete24h:
    'Ola, {nome}! Lembrete: voce tem um agendamento amanha.\n\nServico: {servico}\nHorario: {hora}\n\nAte amanha!',
  lembrete1h:
    'Ola, {nome}! Passando para lembrar que seu atendimento de {servico} comeca em 1 hora, as {hora}.',
  cancelamento:
    'Ola, {nome}. Seu agendamento de {servico} em {data} as {hora} precisou ser cancelado. Se quiser, me chame aqui para remarcar.',
  avaliacaoPos:
    'Ola, {nome}! Obrigado pelo atendimento de hoje. Se puder, me envie uma avaliacao rapida sobre como foi sua experiencia.',
}

export const whatsappTemplateLabels: Record<MessageTemplateKey, string> = {
  confirmacao: 'Confirmacao',
  lembrete24h: 'Lembrete 24h',
  lembrete1h: 'Lembrete 1h',
  cancelamento: 'Cancelamento',
  avaliacaoPos: 'Avaliacao',
}

export function normalizeWhatsAppSettings(settings?: Partial<AutomationSettings> | null): AutomationSettings {
  return { ...defaultWhatsAppSettings, ...settings }
}

export function normalizeWhatsAppTemplates(templates?: Partial<MessageTemplates> | null): MessageTemplates {
  return { ...defaultWhatsAppTemplates, ...templates }
}

export function normalizePhoneDigits(phone: string | null) {
  return (phone ?? '').replace(/\D/g, '')
}

export function hasReachablePhone(phone: string | null) {
  const digits = normalizePhoneDigits(phone)
  return phone !== 'N/A' && digits.length >= 10
}

export function getWhatsAppLink(phone: string | null, text?: string) {
  if (!hasReachablePhone(phone)) return null

  const digits = normalizePhoneDigits(phone)
  const target = digits.startsWith('55') ? digits : `55${digits}`
  const base = `https://wa.me/${target}`

  if (!text?.trim()) return base

  return `${base}?text=${encodeURIComponent(text)}`
}

export function buildWhatsAppMessage(template: string, variables: WhatsAppTemplateVariables) {
  return template
    .replaceAll('{nome}', variables.nome?.trim() || 'cliente')
    .replaceAll('{servico}', variables.servico?.trim() || 'seu atendimento')
    .replaceAll('{data}', variables.data?.trim() || 'data combinada')
    .replaceAll('{hora}', variables.hora?.trim() || 'horario combinado')
}
