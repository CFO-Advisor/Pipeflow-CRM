import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { leadEmail, leadName, description, subject } = await req.json()

  if (!leadEmail || !description) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const safeDescription = description
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  const emailSubject = subject?.trim() || `Mensagem para ${leadName ?? leadEmail}`

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 8000)
  )

  try {
    await Promise.race([
      resend.emails.send({
        from: 'PipeFlow <noreply@pipeflow.app>',
        to: leadEmail,
        subject: emailSubject,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
            <p style="font-size:15px;line-height:1.6">${safeDescription}</p>
            <hr style="margin-top:32px;border:none;border-top:1px solid #e2e8f0">
            <p style="color:#94a3b8;font-size:12px;margin-top:8px">Enviado via PipeFlow CRM</p>
          </div>
        `,
      }),
      timeout,
    ])
  } catch (err) {
    console.error('[send-email] Resend error', err)
    return NextResponse.json({ error: 'Falha ao enviar e-mail.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
