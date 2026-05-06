export interface SendEmailOptions {
  to?: string | string[];
  bcc?: string | string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  sender?: string;
}

export interface SendEmailResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function sendEmail({
  to,
  bcc,
  subject,
  textBody,
  htmlBody,
  sender,
}: SendEmailOptions): Promise<SendEmailResponse> {
  try {
    const apiKey = process.env.MAILTRAP_API_KEY;

    if (!apiKey) {
      console.error('❌ Error: MAILTRAP_API_KEY no está definida en las variables de entorno.');
      return { success: false, error: 'Falta la configuración de la clave API de email.' };
    }

    const defaultSender = process.env.MAILTRAP_DEFAULT_SENDER || 'no-reply@tudominio.com';
    const emailSender = sender || defaultSender;

    const recipientsTo = to ? (Array.isArray(to) ? to : [to]) : [];
    const recipientsBcc = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];

    if (recipientsTo.length === 0 && recipientsBcc.length === 0) {
      return { success: false, error: 'Debe proporcionarse al menos un destinatario en to o bcc.' };
    }

    if (!textBody && !htmlBody) {
      return { success: false, error: 'Debe proporcionarse al menos un textBody o htmlBody.' };
    }

    const payload: any = {
      from: { email: emailSender },
      subject,
      text: textBody || '',
      html: htmlBody || '',
    };

    if (recipientsTo.length > 0) {
      payload.to = recipientsTo.map((email) => ({ email }));
    } else {
      // Mailtrap requiere al menos un destinatario en "to" aunque solo se use bcc
      payload.to = [{ email: emailSender }];
    }

    if (recipientsBcc.length > 0) {
      payload.bcc = recipientsBcc.map((email) => ({ email }));
    }

    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error al enviar email con Mailtrap:', data);
      return {
        success: false,
        error: data.errors?.join(', ') || 'Fallo inesperado al comunicarse con Mailtrap.',
        data,
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Excepción al intentar enviar email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno al enviar el email.',
    };
  }
}
