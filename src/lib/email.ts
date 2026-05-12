export type EmailProvider = 'resend' | 'mailtrap'

export interface SendEmailOptions {
  to?: string | string[]
  bcc?: string | string[]
  subject: string
  textBody?: string
  htmlBody?: string
  sender?: string
  provider?: EmailProvider
}

export interface SendEmailResponse {
  success: boolean
  data?: any
  error?: string
}

interface NormalizedOptions {
  to: string[]
  bcc: string[]
  subject: string
  textBody?: string
  htmlBody?: string
  sender: string
}

export async function sendEmail({
  to,
  bcc,
  subject,
  textBody,
  htmlBody,
  sender,
  provider = 'resend',
}: SendEmailOptions): Promise<SendEmailResponse> {
  try {
    const recipientsTo = to ? (Array.isArray(to) ? to : [to]) : []
    const recipientsBcc = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : []

    if (recipientsTo.length === 0 && recipientsBcc.length === 0) {
      return { success: false, error: 'Debe proporcionarse al menos un destinatario en to o bcc.' }
    }
    if (!textBody && !htmlBody) {
      return { success: false, error: 'Debe proporcionarse al menos un textBody o htmlBody.' }
    }

    const defaultSender =
      (provider === 'resend' ? process.env.RESEND_DEFAULT_SENDER : process.env.MAILTRAP_DEFAULT_SENDER) ||
      process.env.MAILTRAP_DEFAULT_SENDER ||
      'no-reply@iesjulioverne.es'

    const opts: NormalizedOptions = {
      to: recipientsTo,
      bcc: recipientsBcc,
      subject,
      textBody,
      htmlBody,
      sender: sender || defaultSender,
    }

    return provider === 'resend' ? sendViaResend(opts) : sendViaMailtrap(opts)
  } catch (error) {
    console.error('❌ Excepción al intentar enviar email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno al enviar el email.',
    }
  }
}

async function sendViaResend({
  to, bcc, subject, textBody, htmlBody, sender,
}: NormalizedOptions): Promise<SendEmailResponse> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('❌ Error: RESEND_API_KEY no está definida en las variables de entorno.')
    return { success: false, error: 'Falta la configuración de la clave API de Resend.' }
  }

  const payload: any = {
    from: sender,
    to: to.length > 0 ? to : [sender],
    subject,
    ...(htmlBody && { html: htmlBody }),
    ...(textBody && { text: textBody }),
  }
  if (bcc.length > 0) payload.bcc = bcc

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    console.error('❌ Error al enviar email con Resend:', data)
    return {
      success: false,
      error: data.message || data.name || 'Fallo inesperado al comunicarse con Resend.',
      data,
    }
  }
  return { success: true, data }
}

async function sendViaMailtrap({
  to, bcc, subject, textBody, htmlBody, sender,
}: NormalizedOptions): Promise<SendEmailResponse> {
  const apiKey = process.env.MAILTRAP_API_KEY
  if (!apiKey) {
    console.error('❌ Error: MAILTRAP_API_KEY no está definida en las variables de entorno.')
    return { success: false, error: 'Falta la configuración de la clave API de Mailtrap.' }
  }

  const payload: any = {
    from: { email: sender },
    to: to.length > 0 ? to.map((email) => ({ email })) : [{ email: sender }],
    subject,
    text: textBody || '',
    html: htmlBody || '',
  }
  if (bcc.length > 0) payload.bcc = bcc.map((email) => ({ email }))

  const response = await fetch('https://send.api.mailtrap.io/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    console.error('❌ Error al enviar email con Mailtrap:', data)
    return {
      success: false,
      error: data.errors?.join(', ') || 'Fallo inesperado al comunicarse con Mailtrap.',
      data,
    }
  }
  return { success: true, data }
}
