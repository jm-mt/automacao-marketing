import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db/client'
import type { LogEntry } from '@/lib/flow/runner'

async function db() { await initDb(); return getDb() }

/**
 * GET /api/flow-analytics?flow_id=xxx
 * Agrega contadores por node_id de todos os runs de um fluxo.
 */
export async function GET(req: NextRequest) {
  try {
    const flowId = req.nextUrl.searchParams.get('flow_id')
    if (!flowId) {
      return NextResponse.json({ error: 'flow_id obrigatório' }, { status: 400 })
    }

    const client = await db()

    // Conta quantos runs passaram por cada nó
    const runsRes = await client.execute({
      sql: 'SELECT id, log FROM flow_runs WHERE flow_id = ?',
      args: [flowId],
    })

    const nodes: Record<string, { count: number; type: string; detail: string }> = {}

    for (const row of runsRes.rows) {
      const log = JSON.parse(String(row.log ?? '[]')) as LogEntry[]
      for (const entry of log) {
        if (!nodes[entry.node_id]) {
          nodes[entry.node_id] = { count: 0, type: entry.type, detail: entry.detail }
        }
        nodes[entry.node_id].count++
      }
    }

    // Lista de runs do fluxo para a tabela de runs
    const listRes = await client.execute({
      sql: 'SELECT id, contact, status, wait_label, created_at, updated_at FROM flow_runs WHERE flow_id = ? ORDER BY created_at DESC',
      args: [flowId],
    })

    const runs = listRes.rows.map(r => ({
      id:         String(r.id),
      contact:    JSON.parse(String(r.contact)),
      status:     String(r.status),
      wait_label: r.wait_label ? String(r.wait_label) : null,
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    }))

    return NextResponse.json({ nodes, runs })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
