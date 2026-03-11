import { env } from "process";

/**
 * Propiedades de configuración para enviar un email usando SMTP2GO.
 */
export interface SendEmailOptions {
  to?: string | string[];
  bcc?: string | string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  sender?: string;
}

/**
 * Respuesta tipada para la función de envío de emails.
 */
export interface SendEmailResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Función genérica y profesional para enviar correos usando la API web de SMTP2GO.
 * Documentación oficial: https://www.smtp2go.com/docs/api/#email-send
 * 
 * NOTA: Esta función debe ser ejecutada en el servidor (Server Actions o API Routes)
 * para mantener la clave API segura y no exponerla en el lado del cliente.
 * 
 * @param options Opciones del correo a enviar (destinatario, asunto, cuerpo).
 * @returns Promesa con el resultado de la operación.
 */
export async function sendEmail({
  to,
  bcc,
  subject,
  textBody,
  htmlBody,
  sender,
}: SendEmailOptions): Promise<SendEmailResponse> {
  try {
    // Es recomendable definir tu clave API en el archivo .env.local
    const apiKey = process.env.SMTP2GO_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Error: La clave API de SMTP2GO (SMTP2GO_API_KEY) no está definida en las variables de entorno.');
      return { success: false, error: 'Falta la configuración de la clave API de email.' };
    }

    // El remitente por defecto puede ser una variable de entorno.
    // Importante: El dominio de este email DEBE estar verificado en tu panel de SMTP2GO.
    const defaultSender = process.env.SMTP2GO_DEFAULT_SENDER || 'no-reply@tudominio.com';
    const emailSender = sender || defaultSender;

    // SMTP2GO requiere que campos sean arrays de strings si los hay
    const recipientsTo = to ? (Array.isArray(to) ? to : [to]) : [];
    const recipientsBcc = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];

    // Validar que exista algún destinatario
    if (recipientsTo.length === 0 && recipientsBcc.length === 0) {
      return { success: false, error: 'Debe proporcionarse al menos un destinatario en to o bcc.' };
    }

    // Validar que exista al menos un tipo de contenido
    if (!textBody && !htmlBody) {
      return { success: false, error: 'Debe proporcionarse al menos un textBody o htmlBody.' };
    }

    // Construcción del payload según la documentación de SMTP2GO
    const payload: any = {
      api_key: apiKey,
      sender: emailSender,
      subject: subject,
      text_body: textBody || '',
      html_body: htmlBody || '',
    };
    
    if (recipientsTo.length > 0) payload.to = recipientsTo;
    else payload.to = [emailSender]; // fallback to si to está vacío para que el bcc funcione sin mostrar destinatarios
    
    if (recipientsBcc.length > 0) payload.custom_headers = [{ header: 'Bcc', value: recipientsBcc.join(', ') }];

    // Petición a la API usando fetch nativo
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Opcionalmente se puede pasar en la cabecera, aunque ya va en el payload
        'X-Smtp2go-Api-Key': apiKey, 
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error externo al enviar email con SMTP2GO:', data);
      return { 
        success: false, 
        error: data.data?.error || data.error || 'Fallo inesperado al comunicarse con SMTP2GO.',
        data 
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Excepción al intentar enviar email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno de red o ejecución saltó al enviar el email.'
    };
  }
}
