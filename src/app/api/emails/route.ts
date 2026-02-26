import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db/client'

async function db() {
  await initDb()
  return getDb()
}

// ─── GET /api/emails — todos os emails com info do run ────────────────────

export async function GET(_req: NextRequest) {
  try {
    const client = await db()
    const result = await client.execute(
      `SELECT e.id, e.thread_id, e.direction, e.from_address, e.to_address,
              e.subject, e.body_html, e.sent_at,
              r.contact, r.flow_name, r.flow_id
       FROM test_emails e
       LEFT JOIN flow_runs r ON r.id = e.thread_id
       ORDER BY e.sent_at DESC
       LIMIT 200`
    )

    const emails = result.rows.map(r => ({
      id:           Number(r.id),
      thread_id:    r.thread_id    ? String(r.thread_id)    : null,
      direction:    String(r.direction ?? 'outbound') as 'outbound' | 'inbound',
      from_address: String(r.from_address ?? ''),
      to_address:   String(r.to_address ?? ''),
      subject:      String(r.subject ?? ''),
      body_html:    r.body_html    ? String(r.body_html)    : null,
      sent_at:      String(r.sent_at),
      flow_name:    r.flow_name    ? String(r.flow_name)    : null,
      flow_id:      r.flow_id      ? String(r.flow_id)      : null,
      contact:      r.contact      ? JSON.parse(String(r.contact)) : null,
    }))

    return NextResponse.json(emails)
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao listar e-mails', detail: String(err) }, { status: 500 })
  }
}

// ─── POST /api/emails ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { to?: string; subject?: string; body_html?: string }
    if (!body.to || !body.subject) {
      return NextResponse.json({ error: 'Campos obrigatórios: to, subject' }, { status: 400 })
    }
    const client = await db()
    const now = new Date().toISOString()
    const result = await client.execute({
      sql: 'INSERT INTO test_emails (to_address, subject, body_html, sent_at) VALUES (?, ?, ?, ?)',
      args: [body.to, body.subject, body.body_html ?? null, now],
    })
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao salvar e-mail', detail: String(err) }, { status: 500 })
  }
}

// ─── DELETE /api/emails ────────────────────────────────────────────────────

export async function DELETE() {
  try {
    const client = await db()
    await client.execute('DELETE FROM test_emails')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao limpar inbox', detail: String(err) }, { status: 500 })
  }
}
