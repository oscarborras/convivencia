'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/lib/email'

export async function createRetraso(formData: FormData) {
    const supabase = await createClient()

    const alumnoId = formData.get('alumno_id') as string;
    const justificante = formData.get('justificante') === 'true';
    const sancionable = formData.get('sancionable') === 'true';
    const observaciones = formData.get('observaciones') as string;
    const horaRegistro = formData.get('hora_registro') as string;

    const { data: { user } } = await supabase.auth.getUser();
    let registradoPor = user?.email || 'Usuario Desconocido';

    if (user?.email) {
        const { data: profData } = await supabase
            .from('profesores')
            .select('profesor')
            .eq('email', user.email)
            .maybeSingle();

        if (profData?.profesor) {
            registradoPor = profData.profesor;
        }
    }

    // Construimos el timestamp combinando la fecha de hoy (en Madrid) con la hora del formulario.
    // sv-SE produce "YYYY-MM-DD HH:mm:ss", formato seguro para parsear como UTC
    // independientemente de la zona horaria local del servidor.
    let fechaISO: string;
    if (horaRegistro && /^\d{2}:\d{2}$/.test(horaRegistro)) {
        const now = new Date();
        const todayMadrid = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }); // YYYY-MM-DD
        const utcStr = now.toLocaleString('sv-SE', { timeZone: 'UTC' });
        const madridStr = now.toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' });
        const offsetMs =
            new Date(madridStr.replace(' ', 'T') + 'Z').getTime() -
            new Date(utcStr.replace(' ', 'T') + 'Z').getTime();
        const baseDate = new Date(`${todayMadrid}T${horaRegistro}:00.000Z`);
        fechaISO = new Date(baseDate.getTime() - offsetMs).toISOString();
    } else {
        fechaISO = new Date().toISOString();
    }

    const retrasoData = {
        fecha: fechaISO,
        alumno_id: alumnoId,
        justificante,
        sancionable,
        observaciones,
        registrado_por: registradoPor,
    }

    const { error } = await supabase.from('convi_retrasos').insert(retrasoData)

    if (error) {
        console.error('Error insertando retraso:', error)
        // Redirigimos pasando el mensaje de error en la query para depurar
        redirect(`/retrasos/crear?error=${encodeURIComponent(error.message)}`)
    }

    console.log('Insertado con éxito');

    let fechaFormateada = new Date(fechaISO).toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    // Intentamos recuperar información del alumno para enviar un correo y/o preparar el justificante
    const { data: alumnoData } = await supabase
        .from('alumnos')
        .select('alumno, unidad, tutor1_email, tutor2_email')
        .eq('id', alumnoId)
        .single();

    let emailTutorCurso = null;
    if (alumnoData?.unidad) {
        const { data: cursoData } = await supabase
            .from('cursos')
            .select('email_tutor')
            .eq('nombre', alumnoData.unidad)
            .single();
        emailTutorCurso = cursoData?.email_tutor;
    }

    const { data: configData } = await supabase
        .from('convi_config')
        .select('email_convivencia, email_provider')
        .single();

    const emailConvivencia = configData?.email_convivencia;
    const emailProvider = ((configData?.email_provider as string) || 'resend') as 'resend' | 'mailtrap';

    const { data: notificacionesBloqueadas } = await supabase
        .from('convi_notificaciones')
        .select('email')
        .eq('alumno_id', alumnoId);

    const emailsBloqueados = (notificacionesBloqueadas || []).map((n) => n.email);

    const destinatarios: { email: string, label: string }[] = [];
    if (emailConvivencia) destinatarios.push({ email: emailConvivencia, label: 'Convivencia' });
    if (alumnoData?.tutor1_email && !emailsBloqueados.includes(alumnoData.tutor1_email)) {
        destinatarios.push({ email: alumnoData.tutor1_email, label: 'Tutor 1' });
    }
    if (alumnoData?.tutor2_email && !emailsBloqueados.includes(alumnoData.tutor2_email)) {
        destinatarios.push({ email: alumnoData.tutor2_email, label: 'Tutor 2' });
    }
    if (emailTutorCurso) destinatarios.push({ email: emailTutorCurso, label: 'Tutor Grupo' });

    // Agrupamos por email para evitar duplicados, concatenando etiquetas si es necesario
    const uniqueEmailsMap = new Map<string, string>();
    destinatarios.filter(d => d.email).forEach(d => {
        const existing = uniqueEmailsMap.get(d.email);
        if (existing) {
            uniqueEmailsMap.set(d.email, `${existing}, ${d.label}`);
        } else {
            uniqueEmailsMap.set(d.email, d.label);
        }
    });

    const listadoFinal = Array.from(uniqueEmailsMap.entries()).map(([email, label]) => ({ email, label }));

    let emailsParam = '';

    if (listadoFinal.length > 0 && alumnoData) {
        // Ejecutamos en segundo plano (sin await para no bloquear la respuesta) o con await si queremos asegurar el envío
        // Lo dejamos con await para registrar posibles errores en el log del servidor
        const justificadoTexto = justificante ? 'Sí' : 'No';
        const sancionadoTexto = sancionable ? 'Sí' : 'No';
        const obsTexto = observaciones ? observaciones : 'Ninguna anotación';

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Nuevo Retraso Registrado</h2>
                <p>Se ha documentado una nueva incidencia de retraso en el sistema de convivencia escolar.</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left;">
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc; width: 30%;">Alumno/a:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${alumnoData.alumno}</strong></td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc;">Unidad/Curso:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${alumnoData.unidad || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc;">Justificante:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                           <span style="color: ${justificante ? '#16a34a' : '#ef4444'}; font-weight: bold;">${justificadoTexto}</span>
                        </td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc;">Sancionable:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                           <span style="color: ${sancionable ? '#f97316' : '#64748b'}; font-weight: bold;">${sancionadoTexto}</span>
                        </td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc;">Observaciones:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${obsTexto}</td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc;">Fecha y Hora:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${fechaFormateada}</td>
                    </tr>
                </table>
                ${sancionable ? '<p>Se le informa que la reiteración de esta conducta puede llevar acarreada una SANCIÓN.</p>' : ''}
                <p>Para más información contacte con la Jefatura de Estudios o Dirección del instituto (directiva@iesjulioverne.es)</p>
                <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">
                    Este es un mensaje automático generado por el sistema de convivencia. No responda al mismo pues está enviado desde una cuenta desatendida
                </p>
            </div>
        `;

        const sendPromises = listadoFinal.map(dest =>
            sendEmail({
                to: dest.email,
                subject: `📌 Aviso de Retraso - ${alumnoData.alumno}`,
                htmlBody: htmlBody,
                textBody: `Aviso de Retraso Registrado\n\nAlumno/a: ${alumnoData.alumno}\nUnidad: ${alumnoData.unidad || 'N/A'}\nJustificado: ${justificadoTexto}\nSancionable: ${sancionadoTexto}\nObservaciones: ${obsTexto}\nFecha: ${fechaFormateada}`,
                provider: emailProvider,
            })
        );

        const results = await Promise.all(sendPromises);

        const fallos = results.filter(r => !r.success);
        if (fallos.length > 0) {
            console.error(`⚠️ Hubo errores al enviar a ${fallos.length} destinatarios.`, fallos.map(f => f.error));
        } else {
            console.log('✅ Correos individuales enviados correctamente');
        }

        const emailResultsInfo = results.map((r, i) => ({
            email: listadoFinal[i].email,
            label: listadoFinal[i].label,
            ok: r.success
        }));
        emailsParam = encodeURIComponent(JSON.stringify(emailResultsInfo));
    }

    // Revalidamos los dashboards
    revalidatePath('/retrasos')
    revalidatePath('/dashboard')

    const nombreParam = alumnoData?.alumno ? encodeURIComponent(alumnoData.alumno) : 'Estudiante';
    const cursoParam = alumnoData?.unidad ? encodeURIComponent(alumnoData.unidad) : '';
    const fechaParam = encodeURIComponent(fechaFormateada);
    const obsParam = observaciones ? encodeURIComponent(observaciones) : '';

    redirect(`/retrasos/crear/exito?alumno=${nombreParam}&curso=${cursoParam}&fecha=${fechaParam}&emails=${emailsParam}&obs=${obsParam}`);
}
