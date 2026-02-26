import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db/client'
import { getFlow } from '@/app/actions/flows'
import { runFlow, type RunContext } from '@/lib/flow/runner'

async function db() { await initDb(); return getDb() }

/**
 * POST /api/flow-run/:id/advance
 * Avança o fluxo após um ponto de parada.
 *
 * Body:
 *   action = 'reply'        → contato respondeu o e-mail; inclui reply_body e reply_subject
 *   action = 'skip_delay'   → simular passagem de tempo (delay)
 *   action = 'timeout'      → simular timeout do condition.wait
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params
    const body = await req.json() as {
      action: 'reply' | 'skip_delay' | 'timeout'
      reply_body?:    string
      reply_subject?: string
    }

    const client = await db()

    // Carrega o run atual
    const runRes = await client.execute({
      sql: 'SELECT * FROM flow_runs WHERE id = ?',
      args: [runId],
    })
    if (runRes.rows.length === 0) {
      return NextResponse.json({ error: 'Run não encontrado' }, { status: 404 })
    }
    const r      = runRes.rows[0]
    const status = String(r.status)

    if (status === 'completed' || status === 'error') {
      return NextResponse.json({ error: 'Run já encerrado' }, { status: 400 })
    }

    const currentNode = r.current_node ? String(r.current_node) : null
    if (!currentNode) {
      return NextResponse.json({ error: 'Nenhum nó atual registrado' }, { status: 400 })
    }

    const ctx     = JSON.parse(String(r.context)) as RunContext
    const prevLog = JSON.parse(String(r.log ?? '[]'))

    // Carrega o fluxo
    const flow = await getFlow(String(r.flow_id))
    if (!flow) return NextResponse.json({ error: 'Fluxo não encontrado' }, { status: 404 })

    const now = new Date().toISOString()

    // ── Processar resposta do contato ─────────────────────────────────────
    if (body.action === 'reply') {
      const replyBody    = body.reply_body    ?? '(sem conteúdo)'
      const replySubject = body.reply_subject ?? 'Re: resposta'

      // Salva o e-mail inbound (contato → fluxo)
      await client.execute({
        sql: `INSERT INTO test_emails (thread_id, direction, from_address, to_address, subject, body_html, sent_at)
              VALUES (?, 'inbound', ?, 'flow@sistema.com', ?, ?, ?)`,
        args: [runId, ctx.contact.email, replySubject, `<p>${replyBody.replace(/\n/g, '<br>')}</p>`, now],
      })

      // Continua o fluxo pelo handle 'success' do condition.wait
      const newCtx: RunContext = { ...ctx, inbound_reply: replyBody }
      const result = runFlow(flow, currentNode, 'success', newCtx, prevLog)

      await saveRunAndEmails(client, runId, result, now)
      return NextResponse.json({ status: result.status, wait_label: result.wait_label })
    }

    // ── Simular passagem de tempo (skip delay) ────────────────────────────
    if (body.action === 'skip_delay') {
      const result = runFlow(flow, currentNode, 'success', ctx, prevLog)
      await saveRunAndEmails(client, runId, result, now)
      return NextResponse.json({ status: result.status, wait_label: result.wait_label })
    }

    // ── Simular timeout do condition.wait ─────────────────────────────────
    if (body.action === 'timeout') {
      const result = runFlow(flow, currentNode, 'timeout', ctx, prevLog)
      await saveRunAndEmails(client, runId, result, now)
      return NextResponse.json({ status: result.status, wait_label: result.wait_label })
    }

    return NextResponse.json({ error: 'action inválida' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

async function saveRunAndEmails(
  client: Awaited<ReturnType<typeof db>>,
  runId: string,
  result: Awaited<ReturnType<typeof runFlow>>,
  now: string,
) {
  // Atualiza o run
  await client.execute({
    sql: `UPDATE flow_runs SET status=?, current_node=?, wait_label=?, context=?, log=?, updated_at=? WHERE id=?`,
    args: [
      result.status,
      result.current_node ?? null,
      result.wait_label   ?? null,
      JSON.stringify(result.context),
      JSON.stringify(result.log),
      now, runId,
    ],
  })

  // Persiste novos e-mails outbound gerados nesta etapa
  for (const email of result.emails) {
    await client.execute({
      sql: `INSERT INTO test_emails (thread_id, direction, from_address, to_address, subject, body_html, sent_at)
            VALUES (?, 'outbound', ?, ?, ?, ?, ?)`,
      args: [runId, email.from, email.to, email.subject, email.body_html || null, now],
    })
  }
}
