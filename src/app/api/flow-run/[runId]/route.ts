import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db/client'

async function db() { await initDb(); return getDb() }

// ─── GET /api/flow-run/:id — run + emails do thread ──────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params
    const client = await db()

    const runRes = await client.execute({
      sql: 'SELECT * FROM flow_runs WHERE id = ?',
      args: [runId],
    })
    if (runRes.rows.length === 0) {
      return NextResponse.json({ error: 'Run não encontrado' }, { status: 404 })
    }
    const r = runRes.rows[0]

    const emailRes = await client.execute({
      sql: 'SELECT * FROM test_emails WHERE thread_id = ? ORDER BY sent_at ASC',
      args: [runId],
    })

    const run = {
      id:           String(r.id),
      flow_id:      String(r.flow_id),
      flow_name:    String(r.flow_name),
      contact:      JSON.parse(String(r.contact)),
      status:       String(r.status),
      current_node: r.current_node ? String(r.current_node) : null,
      wait_label:   r.wait_label   ? String(r.wait_label)   : null,
      log:          JSON.parse(String(r.log ?? '[]')),
      created_at:           String(r.created_at),
      updated_at:           String(r.updated_at),
      emails: emailRes.rows.map(e => ({
        id:           Number(e.id),
        direction:    String(e.direction ?? 'outbound'),
        from_address: String(e.from_address ?? 'flow@sistema.com'),
        to_address:   String(e.to_address),
        subject:      String(e.subject),
        body_html:    e.body_html ? String(e.body_html) : null,
        in_reply_to:  e.in_reply_to ? Number(e.in_reply_to) : null,
        sent_at:      String(e.sent_at),
      })),
    }

    return NextResponse.json(run)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
