'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/lib/email'

export async function createParte(formData: FormData) {
    const supabase = await createClient()

    const conductas_contrarias = formData.getAll('conductas_contrarias') as string[]
    const conductas_graves = formData.getAll('conductas_graves') as string[]

    if (formData.get('conductas_contrarias_otros_check') === 'true') {
        const otroText = formData.get('conductas_contrarias_otros_text') as string
        if (otroText && otroText.trim() !== '') {
            conductas_contrarias.push(`Otro: ${otroText.trim()}`)
        }
    }

    if (formData.get('conductas_graves_otros_check') === 'true') {
        const otroText = formData.get('conductas_graves_otros_text') as string
        if (otroText && otroText.trim() !== '') {
            conductas_graves.push(`Otro: ${otroText.trim()}`)
        }
    }

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

    const parteData = {
        fecha: formData.get('fecha') as string,
        hora: (formData.get('hora') as string) || null,
        alumno_id: formData.get('alumno_id') as string,
        profesor_id: formData.get('profesor_id') as string,
        conductas_contrarias,
        conductas_graves,
        genera_expulsion: formData.get('genera_expulsion') === 'true',
        observaciones: formData.get('observaciones') as string,
        registrado_por: registradoPor,
    }

    const { error } = await supabase.from('convi_partes').insert(parteData)

    if (error) {
        console.error('Error insertando parte:', error)
        redirect('/partes/crear?error=true')
    }

    // --- ENVIAR NOTIFICACIÓN POR EMAIL ---
    let fechaFormateada = new Date().toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    // Intentamos recuperar información del alumno para enviar un correo
    const { data: alumnoData } = await supabase
        .from('alumnos')
        .select('alumno, unidad, tutor1_email, tutor2_email')
        .eq('id', parteData.alumno_id)
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

    const { data: profesorData } = await supabase
        .from('profesores')
        .select('profesor')
        .eq('id', parteData.profesor_id)
        .single();

    const { data: configData } = await supabase
        .from('convi_config')
        .select('email_convivencia')
        .single();

    const emailConvivencia = configData?.email_convivencia;
    const { data: notificacionesBloqueadas } = await supabase
        .from('convi_notificaciones')
        .select('email')
        .eq('alumno_id', parteData.alumno_id);

    const emailsBloqueados = (notificacionesBloqueadas || []).map((n) => n.email);

    const destinatarios: string[] = [];
    if (emailConvivencia) destinatarios.push(emailConvivencia);
    if (alumnoData?.tutor1_email && !emailsBloqueados.includes(alumnoData.tutor1_email)) destinatarios.push(alumnoData.tutor1_email);
    if (alumnoData?.tutor2_email && !emailsBloqueados.includes(alumnoData.tutor2_email)) destinatarios.push(alumnoData.tutor2_email);
    if (emailTutorCurso) destinatarios.push(emailTutorCurso);

    const emailsUnicos = [...new Set(destinatarios.filter(Boolean))];

    let emailsParam = '';

    if (emailsUnicos.length > 0 && alumnoData) {
        const obsTexto = parteData.observaciones ? parteData.observaciones : 'Ninguna anotación';
        const expulsionTexto = parteData.genera_expulsion ? 'Sí' : 'No';

        let detalleConductas = '';
        if (conductas_contrarias.length > 0) {
            detalleConductas += '<strong>Conductas Contrarias:</strong><ul>';
            conductas_contrarias.forEach(c => detalleConductas += `<li>${c}</li>`);
            detalleConductas += '</ul>';
        }
        if (conductas_graves.length > 0) {
            detalleConductas += '<strong>Conductas Gravemente Perjudiciales:</strong><ul>';
            conductas_graves.forEach(c => detalleConductas += `<li>${c}</li>`);
            detalleConductas += '</ul>';
        }

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Nuevo Parte de Disciplina Registrado</h2>
                <p>Se ha documentado un nuevo parte disciplinario en el sistema de convivencia escolar.</p>
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
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc;">Profesor/a:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${profesorData?.profesor || 'Desconocido'}</td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc;">Genera expulsión:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                           <span style="color: ${parteData.genera_expulsion ? '#ef4444' : '#64748b'}; font-weight: bold;">${expulsionTexto}</span>
                        </td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc;">Conductas:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${detalleConductas || 'Ninguna especificada'}</td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc;">Observaciones:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${obsTexto}</td>
                    </tr>
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid #eee; background: #f8fafc; width: 30%;">Fecha y hora:</th>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Día ${parteData.fecha} ${parteData.hora ? `en la hora: ${parteData.hora}` : '(Hora no especificada)'}</td>
                    </tr>
                </table>
                <p>Para más información contacte con la Jefatura de Estudios o Dirección del instituto (directiva@iesjulioverne.es)</p>
                <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">
                    Este es un mensaje automático generado por el sistema de convivencia. No responda al mismo pues está enviado desde una cuenta desatendida
                </p>
            </div>
        `;

        const sendPromises = emailsUnicos.map(emailDestino =>
            sendEmail({
                to: emailDestino,
                subject: `🚨 Aviso de Parte Disciplinario - ${alumnoData.alumno}`,
                htmlBody: htmlBody,
                textBody: `Aviso de Parte Registrado\n\nAlumno/a: ${alumnoData.alumno}\nUnidad: ${alumnoData.unidad || 'N/A'}\nProfesor/a: ${profesorData?.profesor || 'N/A'}\nExpulsión: ${expulsionTexto}\nObservaciones: ${obsTexto}`
            })
        );

        const results = await Promise.all(sendPromises);

        const fallos = results.filter(r => !r.success);
        if (fallos.length > 0) {
            console.error(`⚠️ Hubo errores al enviar a ${fallos.length} destinatarios.`, fallos.map(f => f.error));
        } else {
            console.log('✅ Correos de parte individuales enviados correctamente a', emailsUnicos);
        }

        const emailResultsInfo = results.map((r, i) => ({
            email: emailsUnicos[i],
            ok: r.success
        }));
        emailsParam = encodeURIComponent(JSON.stringify(emailResultsInfo));
    }

    revalidatePath('/dashboard')

    // Si obtenemos un alumno, pasamos el nombre, si no un genérico
    const nombreParam = alumnoData?.alumno ? encodeURIComponent(alumnoData.alumno) : 'Estudiante';
    redirect(`/partes/crear/exito?alumno=${nombreParam}&emails=${emailsParam}`)
}
