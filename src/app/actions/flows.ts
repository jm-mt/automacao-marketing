'use server'

import { getDb, initDb } from '@/lib/db/client'
import type { Flow } from '@/lib/flow/types'

async function db() {
  await initDb()
  return getDb()
}

// ─── List flows ────────────────────────────────────────────────────────────

export async function getFlows(): Promise<Pick<Flow, 'id' | 'name' | 'active' | 'updated_at'>[]> {
  const client = await db()
  const result = await client.execute(
    'SELECT id, name, active, updated_at FROM flows ORDER BY updated_at DESC'
  )
  return result.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    active: Boolean(r.active),
    updated_at: r.updated_at ? String(r.updated_at) : undefined,
  }))
}

// ─── Get single flow ───────────────────────────────────────────────────────

export async function getFlow(id: string): Promise<Flow | null> {
  const client = await db()
  const result = await client.execute({
    sql: 'SELECT * FROM flows WHERE id = ?',
    args: [id],
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return JSON.parse(String(row.data)) as Flow
}

// ─── Create flow ───────────────────────────────────────────────────────────

export async function createFlow(name: string): Promise<string> {
  const client = await db()
  const id = `flow_${Math.random().toString(36).slice(2, 10)}`
  const now = new Date().toISOString()
  const flowData: Flow = {
    id,
    name,
    active: false,
    nodes: [],
    edges: [],
    created_at: now,
    updated_at: now,
  }
  await client.execute({
    sql: 'INSERT INTO flows (id, name, active, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, name, 0, JSON.stringify(flowData), now, now],
  })
  return id
}

// ─── Update flow ───────────────────────────────────────────────────────────

export async function updateFlow(flow: Flow): Promise<void> {
  const client = await db()
  const now = new Date().toISOString()
  const updated = { ...flow, updated_at: now }
  await client.execute({
    sql: 'UPDATE flows SET name = ?, active = ?, data = ?, updated_at = ? WHERE id = ?',
    args: [flow.name, flow.active ? 1 : 0, JSON.stringify(updated), now, flow.id],
  })
}

// ─── Toggle active ─────────────────────────────────────────────────────────

export async function toggleFlowActive(id: string, active: boolean): Promise<void> {
  const client = await db()
  const now = new Date().toISOString()
  await client.execute({
    sql: 'UPDATE flows SET active = ?, updated_at = ? WHERE id = ?',
    args: [active ? 1 : 0, now, id],
  })
}

// ─── Delete flow ───────────────────────────────────────────────────────────

export async function deleteFlow(id: string): Promise<void> {
  const client = await db()
  await client.execute({
    sql: 'DELETE FROM flows WHERE id = ?',
    args: [id],
  })
}

// ─── Duplicate flow ────────────────────────────────────────────────────────

export async function duplicateFlow(id: string): Promise<string> {
  const original = await getFlow(id)
  if (!original) throw new Error('Fluxo não encontrado')
  const newId = `flow_${Math.random().toString(36).slice(2, 10)}`
  const now = new Date().toISOString()
  const copy: Flow = {
    ...original,
    id: newId,
    name: `${original.name} (cópia)`,
    active: false,
    created_at: now,
    updated_at: now,
  }
  const client = await db()
  await client.execute({
    sql: 'INSERT INTO flows (id, name, active, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [newId, copy.name, 0, JSON.stringify(copy), now, now],
  })
  return newId
}
