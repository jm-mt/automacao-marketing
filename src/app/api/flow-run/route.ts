import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db/client'
import { getFlow } from '@/app/actions/flows'
import { runFlow, type SimContact, type RunContext } from '@/lib/flow/runner'

async function db() { await initDb(); return getDb() }

// ─── GET /api/flow-run  — lista todos os runs ─────────────────────────────

export async function GET() {
  try {
    const client = await db()
    const result = await client.execute(
      'SELECT id, flow_id, flow_name, contact, status, wait_label, created_at, updated_at FROM flow_runs ORDER BY created_at DESC LIMIT 50'
    )
    const runs = result.rows.map(r => ({
      id:         String(r.id),
      flow_id:    String(r.flow_id),
      flow_name:  String(r.flow_name),
      contact:    JSON.parse(String(r.contact)) as SimContact,
      status:     String(r.status),
      wait_label: r.wait_label ? String(r.wait_label) : null,
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    }))
    return NextResponse.json(runs)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── POST /api/flow-run  — inicia novo run ────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { flow_id: string; contact: SimContact }
    if (!body.flow_id || !body.contact?.email) {
      return NextResponse.json({ error: 'flow_id e contact.email são obrigatórios' }, { status: 400 })
    }

    const flow = await getFlow(body.flow_id)
    if (!flow) return NextResponse.json({ error: 'Fluxo não encontrado' }, { status: 404 })

    // Encontra o nó trigger
    const triggerNode = flow.nodes.find(n => n.type.startsWith('trigger'))
    if (!triggerNode) return NextResponse.json({ error: 'Fluxo sem trigger' }, { status: 400 })

    const contact: SimContact = { ...body.contact, id: `sim_${Date.now()}` }
    const ctx: RunContext = { contact, variables: {} }

    // Executa até o primeiro ponto de parada
    const result = runFlow(flow, triggerNode.id, 'self', ctx, [])

    const runId = `run_${Math.random().toString(36).slice(2, 10)}`
    const now   = new Date().toISOString()

    const client = await db()

    // Persiste o run
    await client.execute({
      sql: `INSERT INTO flow_runs (id, flow_id, flow_name, contact, status, current_node, wait_label, context, log, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        runId, flow.id, flow.name,
        JSON.stringify(contact),
        result.status,
        result.current_node ?? null,
        result.wait_label ?? null,
        JSON.stringify(result.context),
        JSON.stringify(result.log),
        now, now,
      ],
    })

    // Persiste e-mails enviados
    for (const email of result.emails) {
      await client.execute({
        sql: `INSERT INTO test_emails (thread_id, direction, from_address, to_address, subject, body_html, sent_at)
              VALUES (?, 'outbound', ?, ?, ?, ?, ?)`,
        args: [runId, email.from, email.to, email.subject, email.body_html || null, now],
      })
    }

    return NextResponse.json(
      { id: runId, status: result.status, wait_label: result.wait_label },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
