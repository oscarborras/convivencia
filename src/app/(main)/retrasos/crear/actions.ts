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

    const retrasoData = {
        fecha: new Date().toISOString(), // Guardamos fecha y hora completa
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

    let fechaFormateada = new Date().toLocaleString('es-ES', {
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
        .select('email_convivencia')
        .single();

    const emailConvivencia = configData?.email_convivencia;

    const destinatarios: string[] = [];
    if (emailConvivencia) destinatarios.push(emailConvivencia);
    if (alumnoData?.tutor1_email) destinatarios.push(alumnoData.tutor1_email);
    if (alumnoData?.tutor2_email) destinatarios.push(alumnoData.tutor2_email);
    if (emailTutorCurso) destinatarios.push(emailTutorCurso);

    const emailsUnicos = [...new Set(destinatarios.filter(Boolean))];

    let emailsParam = '';
    
    if (emailsUnicos.length > 0 && alumnoData) {
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
                <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">
                    Este es un mensaje automático generado por el sistema de convivencia.
                </p>
            </div>
        `;

        const sendPromises = emailsUnicos.map(emailDestino => 
            sendEmail({
                to: emailDestino,
                subject: `📌 Aviso de Retraso - ${alumnoData.alumno}`,
                htmlBody: htmlBody,
                textBody: `Aviso de Retraso Registrado\n\nAlumno/a: ${alumnoData.alumno}\nUnidad: ${alumnoData.unidad || 'N/A'}\nJustificado: ${justificadoTexto}\nSancionable: ${sancionadoTexto}\nObservaciones: ${obsTexto}\nFecha: ${fechaFormateada}`
            })
        );

        const results = await Promise.all(sendPromises);

        const fallos = results.filter(r => !r.success);
        if (fallos.length > 0) {
            console.error(`⚠️ Hubo errores al enviar a ${fallos.length} destinatarios.`, fallos.map(f => f.error));
        } else {
            console.log('✅ Correos individuales enviados correctamente a', emailsUnicos);
        }

        const emailResultsInfo = results.map((r, i) => ({
            email: emailsUnicos[i],
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

    redirect(`/retrasos/crear/exito?alumno=${nombreParam}&curso=${cursoParam}&fecha=${fechaParam}&emails=${emailsParam}`);
}
