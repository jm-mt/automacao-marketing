/**
 * Executor de fluxo para simulação de testes.
 * Módulo puro — sem acesso direto ao banco.
 * Processa nós em sequência e para ao encontrar wait/delay/exit.
 */
import type { Flow, FlowNode, FlowEdge, ConditionGroup, ConditionRule } from './types'

// ─── Tipos públicos ────────────────────────────────────────────────────────

export interface SimContact {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  tags?: string[]
  [key: string]: unknown
}

export interface RunContext {
  contact: SimContact
  variables: Record<string, unknown>
  inbound_reply?: string   // corpo do e-mail de resposta do contato
}

export interface OutEmail {
  to: string
  from: string
  subject: string
  body_html: string
}

export type LogStatus = 'ok' | 'wait' | 'exit' | 'error' | 'skip'

export interface LogEntry {
  node_id: string
  type: string
  label?: string
  status: LogStatus
  detail: string
  ts: string
}

export interface RunResult {
  /** completed | waiting_reply | waiting_delay | waiting_chat | error */
  status: 'completed' | 'waiting_reply' | 'waiting_delay' | 'waiting_chat' | 'error'
  current_node: string | null
  wait_label?: string
  chat_message?: string   // mensagem a enviar quando status = waiting_chat
  context: RunContext
  emails: OutEmail[]
  log: LogEntry[]
}

// ─── Entry point ──────────────────────────────────────────────────────────

/**
 * Executa o fluxo a partir de `startNodeId`, seguindo a saída `startHandle`.
 * Se `startHandle === 'self'`, processa o próprio `startNodeId` (inicial).
 */
export function runFlow(
  flow: Flow,
  startNodeId: string,
  startHandle: 'self' | string,
  ctx: RunContext,
  prevLog: LogEntry[] = [],
): RunResult {
  const nodes = new Map(flow.nodes.map(n => [n.id, n]))
  const edges = buildEdgeMap(flow.edges)
  const emails: OutEmail[] = []
  const log: LogEntry[] = [...prevLog]
  let steps = 0

  // Determina o primeiro nó a processar
  let currentId: string | null =
    startHandle === 'self'
      ? startNodeId
      : (edges.get(`${startNodeId}:${startHandle}`) ?? edges.get(`${startNodeId}:`) ?? null)

  while (currentId && steps < 100) {
    steps++
    const node = nodes.get(currentId)
    if (!node) {
      log.push(mk(currentId, '?', 'error', 'Nó não encontrado'))
      break
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfg = node.config as any

    switch (node.type) {
      // ── Triggers: apenas loga e continua
      case 'trigger.event':
      case 'trigger.schedule':
      case 'trigger.webhook':
      case 'trigger.manual':
      case 'trigger.audience':
        log.push(nodeEntry(node, 'ok', 'Trigger ativado'))
        currentId = next(edges, currentId, 'success')
        break

      // ── Enviar e-mail
      case 'action.send_email': {
        const to      = tpl(String(cfg.to      ?? '{{contact.email}}'), ctx)
        const subject = tpl(String(cfg.subject ?? '(sem assunto)'), ctx)
        const body    = tpl(String(cfg.body_html ?? ''), ctx)
        const from    = String(cfg.from_email ?? 'flow@sistema.com')
        emails.push({ to, from, subject, body_html: body })
        log.push(nodeEntry(node, 'ok', `E-mail → ${to} | "${subject}"`))
        currentId = next(edges, currentId, 'success')
        break
      }

      // ── WhatsApp / SMS: loga e continua
      case 'action.send_whatsapp':
      case 'action.send_sms': {
        const to = tpl(String(cfg.to ?? cfg.number ?? '{{contact.phone}}'), ctx)
        log.push(nodeEntry(node, 'ok', `Mensagem [${node.type.split('.')[1]}] → ${to}`))
        currentId = next(edges, currentId, 'success')
        break
      }

      // ── Chat → PARAR (waiting_chat)
      case 'action.send_chat': {
        const message = tpl(String(cfg.message ?? cfg.body ?? cfg.content ?? '(mensagem do fluxo)'), ctx)
        log.push(nodeEntry(node, 'wait', `Chat → ${ctx.contact.email}: "${message.slice(0, 80)}"…`))
        return {
          status: 'waiting_chat',
          current_node: currentId,
          wait_label: 'Aguardando resposta no chat',
          chat_message: message,
          context: ctx,
          emails,
          log,
        }
      }

      // ── IF/ELSE
      case 'condition.if_else': {
        const result = cfg.rules ? evalGroup(cfg.rules as ConditionGroup, ctx) : true
        log.push(nodeEntry(node, 'ok', `"${cfg.name ?? 'Condição'}": ${result ? 'Sim ✓' : 'Não ✗'}`))
        currentId = next(edges, currentId, result ? 'true' : 'false')
        break
      }

      // ── Switch
      case 'condition.switch': {
        type SCase = { name: string; operator: string; value: unknown }
        const cases = (cfg.cases as SCase[] | undefined) ?? []
        const matched = cases.find(c =>
          evalRule({ field: cfg.field ?? '', operator: c.operator as ConditionRule['operator'], value: c.value }, ctx)
        )
        if (matched) {
          log.push(nodeEntry(node, 'ok', `Switch → case "${matched.name}"`))
          currentId = next(edges, currentId, matched.name)
        } else {
          log.push(nodeEntry(node, 'ok', `Switch → default`))
          currentId = next(edges, currentId, 'default')
        }
        break
      }

      // ── Aguardar → PARAR (waiting_reply)
      case 'condition.wait': {
        const waitFor = String(cfg.wait_for ?? 'response')
        const label =
          waitFor === 'response'     ? 'Aguardando resposta do contato' :
          waitFor === 'event'        ? `Aguardando evento: ${cfg.event_type ?? ''}` :
          waitFor === 'field_change' ? `Aguardando mudança: ${cfg.field ?? ''}` :
                                      `Aguardando sinal: ${cfg.signal_key ?? ''}`
        log.push(nodeEntry(node, 'wait', label))
        return {
          status: 'waiting_reply',
          current_node: currentId,
          wait_label: label + (cfg.timeout ? ` (timeout: ${cfg.timeout})` : ''),
          context: ctx,
          emails,
          log,
        }
      }

      // ── Delays → PARAR (waiting_delay)
      case 'delay.fixed': {
        const label = `Delay fixo: ${cfg.duration ?? 1} ${cfg.unit ?? 'horas'}`
        log.push(nodeEntry(node, 'wait', label))
        return { status: 'waiting_delay', current_node: currentId, wait_label: label, context: ctx, emails, log }
      }
      case 'delay.until_time':
        return delayStop(node, `Até horário: ${cfg.time ?? '09:00'}`, ctx, emails, log)
      case 'delay.until_date':
        return delayStop(node, `Até data: ${cfg.datetime ?? '?'}`, ctx, emails, log)
      case 'delay.until_day':
        return delayStop(node, `Até dia: ${cfg.day ?? '?'} às ${cfg.time ?? '09:00'}`, ctx, emails, log)
      case 'delay.smart_send':
        return delayStop(node, 'Smart Send (melhor horário)', ctx, emails, log)
      case 'delay.business_hours':
        return delayStop(node, 'Aguardar horário comercial', ctx, emails, log)
      case 'delay.random':
        return delayStop(node, `Delay aleatório: ${cfg.min_duration ?? 1}–${cfg.max_duration ?? 5} ${cfg.unit ?? 'horas'}`, ctx, emails, log)

      // ── Loops (simplificado: segue body ou success)
      case 'loop.for_each':
      case 'loop.while':
      case 'loop.repeat':
      case 'loop.retry':
        log.push(nodeEntry(node, 'ok', `Loop ${node.type.split('.')[1]} (simulado)`))
        currentId = next(edges, currentId, 'body') ?? next(edges, currentId, 'success')
        break

      // ── Finalizar
      case 'control.exit':
        log.push(nodeEntry(node, 'exit', `Fluxo encerrado (${cfg.status ?? 'completed'})`))
        return { status: 'completed', current_node: null, context: ctx, emails, log }

      // ── Ir para nó
      case 'control.goto':
        log.push(nodeEntry(node, 'ok', `GoTo → ${cfg.target_node ?? '?'}`))
        currentId = String(cfg.target_node ?? '') || null
        break

      // ── Demais ações CRM / HTTP / Script: loga e continua
      default:
        log.push(nodeEntry(node, 'ok', `${node.label ?? node.type}`))
        currentId = next(edges, currentId, 'success')
        break
    }
  }

  return {
    status: steps >= 100 ? 'error' : 'completed',
    current_node: null,
    context: ctx,
    emails,
    log,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildEdgeMap(edges: FlowEdge[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const e of edges) {
    map.set(e.sourceHandle ? `${e.source}:${e.sourceHandle}` : `${e.source}:`, e.target)
  }
  return map
}

function next(map: Map<string, string>, nodeId: string, handle: string): string | null {
  return map.get(`${nodeId}:${handle}`) ?? map.get(`${nodeId}:`) ?? null
}

function resolve(path: string, ctx: RunContext): unknown {
  const root: Record<string, unknown> = {
    contact: ctx.contact,
    variables: ctx.variables,
    reply: ctx.inbound_reply,
  }
  const parts = path.trim().split('.')
  let cur: unknown = root
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

function tpl(str: string, ctx: RunContext): string {
  return str.replace(/\{\{([^}]+)\}\}/g, (_, p) => {
    const v = resolve(p.trim(), ctx)
    return v != null ? String(v) : `{{${p}}}`
  })
}

function evalRule(rule: ConditionRule, ctx: RunContext): boolean {
  const val = resolve(rule.field, ctx)
  const target = rule.value
  switch (rule.operator) {
    case 'equals':       return String(val) === String(target)
    case 'not_equals':   return String(val) !== String(target)
    case 'contains':     return String(val ?? '').includes(String(target))
    case 'not_contains': return !String(val ?? '').includes(String(target))
    case 'starts_with':  return String(val ?? '').startsWith(String(target))
    case 'ends_with':    return String(val ?? '').endsWith(String(target))
    case 'is_empty':     return val == null || val === ''
    case 'is_not_empty': return val != null && val !== ''
    case 'greater_than': return Number(val) > Number(target)
    case 'less_than':    return Number(val) < Number(target)
    case 'has_tag':      return Array.isArray(val) && val.includes(String(target))
    default:             return false
  }
}

function evalGroup(group: ConditionGroup, ctx: RunContext): boolean {
  const rr = group.conditions.map(r => evalRule(r, ctx))
  const gg = (group.groups ?? []).map(g => evalGroup(g, ctx))
  const all = [...rr, ...gg]
  if (all.length === 0) return true
  return group.logic === 'AND' ? all.every(Boolean) : all.some(Boolean)
}

function mk(id: string, type: string, status: LogStatus, detail: string): LogEntry {
  return { node_id: id, type, status, detail, ts: new Date().toISOString() }
}

function nodeEntry(node: FlowNode, status: LogStatus, detail: string): LogEntry {
  return mk(node.id, node.type, status, detail)
}

function delayStop(node: FlowNode, label: string, ctx: RunContext, emails: OutEmail[], log: LogEntry[]): RunResult {
  log.push(nodeEntry(node, 'wait', label))
  return { status: 'waiting_delay', current_node: node.id, wait_label: label, context: ctx, emails, log }
}
