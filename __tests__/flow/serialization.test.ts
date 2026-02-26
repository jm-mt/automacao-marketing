import { describe, it, expect } from 'vitest'
import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react'
import {
  serializeNode,
  serializeNodes,
  serializeEdge,
  serializeEdges,
  serializeFlow,
  deserializeNode,
  deserializeNodes,
  deserializeEdge,
  deserializeEdges,
  deserializeFlow,
  isValidSourceHandle,
  getSourceHandles,
} from '@/lib/flow/serialization'
import type {
  FlowNode,
  FlowEdge,
  Flow,
  TriggerEventConfig,
  IfElseConfig,
  ConditionWaitConfig,
  DelayFixedConfig,
  ForEachConfig,
  WhileConfig,
  SendEmailConfig,
  HttpRequestConfig,
  SwitchConfig,
  AbSplitConfig,
} from '@/lib/flow/types'

// ─── Helpers ─────────────────────────────────────────────────────────────

function makeRFNode(
  id: string,
  type: string,
  config: unknown,
  extra: Partial<RFNode> = {}
): RFNode {
  return {
    id,
    type,
    position: { x: 100, y: 200 },
    data: { config },
    // campos internos do ReactFlow que devem ser ignorados na serialização
    selected: false,
    dragging: false,
    measured: { width: 200, height: 80 },
    ...extra,
  } as unknown as RFNode
}

function makeFlowNode(
  id: string,
  type: string,
  config: unknown,
  extra: Partial<FlowNode> = {}
): FlowNode {
  return {
    id,
    type: type as FlowNode['type'],
    position: { x: 100, y: 200 },
    config: config as FlowNode['config'],
    ...extra,
  }
}

// ─── serializeNode ────────────────────────────────────────────────────────

describe('serializeNode', () => {
  it('extrai id, type, position e config de um nó ReactFlow', () => {
    const config: TriggerEventConfig = { event: 'message.received', channel: 'whatsapp' }
    const rfNode = makeRFNode('n1', 'trigger.event', config, {
      position: { x: 50, y: 120 },
    })

    const result = serializeNode(rfNode)

    expect(result.id).toBe('n1')
    expect(result.type).toBe('trigger.event')
    expect(result.position).toEqual({ x: 50, y: 120 })
    expect(result.config).toEqual(config)
  })

  it('não inclui campos internos do ReactFlow (selected, dragging, measured)', () => {
    const rfNode = makeRFNode('n1', 'delay.fixed', { duration: 2, unit: 'hours' })
    const result = serializeNode(rfNode)

    expect(result).not.toHaveProperty('selected')
    expect(result).not.toHaveProperty('dragging')
    expect(result).not.toHaveProperty('measured')
    expect(result).not.toHaveProperty('internals')
  })

  it('inclui label quando presente em data', () => {
    const rfNode: RFNode = {
      id: 'n1',
      type: 'action.send_email',
      position: { x: 0, y: 0 },
      data: { config: { to: '{{contact.email}}', subject: 'Olá' }, label: 'Email boas-vindas' },
    }
    const result = serializeNode(rfNode)
    expect(result.label).toBe('Email boas-vindas')
  })

  it('não inclui label quando ausente em data', () => {
    const rfNode = makeRFNode('n1', 'delay.fixed', { duration: 1, unit: 'days' })
    const result = serializeNode(rfNode)
    expect(result).not.toHaveProperty('label')
  })

  it('inclui error_handling quando presente', () => {
    const rfNode: RFNode = {
      id: 'n1',
      type: 'action.http_request',
      position: { x: 0, y: 0 },
      data: {
        config: { url: 'https://api.example.com', method: 'POST' },
        error_handling: { strategy: 'retry' },
      },
    }
    const result = serializeNode(rfNode)
    expect(result.error_handling).toEqual({ strategy: 'retry' })
  })
})

// ─── serializeEdge ────────────────────────────────────────────────────────

describe('serializeEdge', () => {
  it('extrai id, source e target de um edge ReactFlow', () => {
    const rfEdge: RFEdge = {
      id: 'e1',
      source: 'n1',
      target: 'n2',
      type: 'smoothstep',
      style: { stroke: '#blue' },
      animated: true,
      selected: false,
    } as unknown as RFEdge

    const result = serializeEdge(rfEdge)

    expect(result.id).toBe('e1')
    expect(result.source).toBe('n1')
    expect(result.target).toBe('n2')
    expect(result).not.toHaveProperty('type')
    expect(result).not.toHaveProperty('style')
    expect(result).not.toHaveProperty('animated')
    expect(result).not.toHaveProperty('selected')
  })

  it('inclui sourceHandle quando presente e não nulo', () => {
    const rfEdge = { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'true' } as RFEdge
    const result = serializeEdge(rfEdge)
    expect(result.sourceHandle).toBe('true')
  })

  it('inclui sourceHandle "false"', () => {
    const rfEdge = { id: 'e2', source: 'n1', target: 'n3', sourceHandle: 'false' } as RFEdge
    const result = serializeEdge(rfEdge)
    expect(result.sourceHandle).toBe('false')
  })

  it('não inclui sourceHandle quando null', () => {
    const rfEdge = { id: 'e1', source: 'n1', target: 'n2', sourceHandle: null } as RFEdge
    const result = serializeEdge(rfEdge)
    expect(result).not.toHaveProperty('sourceHandle')
  })

  it('não inclui sourceHandle quando undefined', () => {
    const rfEdge = { id: 'e1', source: 'n1', target: 'n2' } as RFEdge
    const result = serializeEdge(rfEdge)
    expect(result).not.toHaveProperty('sourceHandle')
  })

  it('inclui targetHandle quando presente', () => {
    const rfEdge = { id: 'e1', source: 'n1', target: 'n2', targetHandle: 'input' } as RFEdge
    const result = serializeEdge(rfEdge)
    expect(result.targetHandle).toBe('input')
  })
})

// ─── Triggers ─────────────────────────────────────────────────────────────

describe('Triggers — serialização', () => {
  it('trigger.event com filtros AND', () => {
    const config: TriggerEventConfig = {
      event: 'message.received',
      channel: 'whatsapp',
      filters: {
        logic: 'AND',
        conditions: [
          { field: 'message.body', operator: 'contains', value: 'orcamento' },
        ],
      },
    }
    const rfNode = makeRFNode('t1', 'trigger.event', config)
    const result = serializeNode(rfNode)
    expect(result.type).toBe('trigger.event')
    expect((result.config as TriggerEventConfig).channel).toBe('whatsapp')
    expect((result.config as TriggerEventConfig).filters?.logic).toBe('AND')
  })

  it('trigger.schedule com cron', () => {
    const config = { mode: 'cron' as const, cron: '0 9 * * 1', timezone: 'America/Sao_Paulo' }
    const rfNode = makeRFNode('t1', 'trigger.schedule', config)
    const result = serializeNode(rfNode)
    expect(result.type).toBe('trigger.schedule')
    expect((result.config as typeof config).cron).toBe('0 9 * * 1')
  })

  it('trigger.webhook com autenticação hmac', () => {
    const config = {
      method: ['POST' as const],
      auth_type: 'hmac_sha256' as const,
      secret: 'my-secret',
      response_mode: 'immediate' as const,
    }
    const rfNode = makeRFNode('t1', 'trigger.webhook', config)
    const result = serializeNode(rfNode)
    expect((result.config as typeof config).auth_type).toBe('hmac_sha256')
  })

  it('trigger.manual sem configuração', () => {
    const rfNode = makeRFNode('t1', 'trigger.manual', {})
    const result = serializeNode(rfNode)
    expect(result.type).toBe('trigger.manual')
  })

  it('trigger.audience com regras de segmentação', () => {
    const config = {
      segment_rules: {
        logic: 'AND' as const,
        conditions: [{ field: 'contact.tags', operator: 'has_tag' as const, value: 'cliente' }],
      },
      evaluation_frequency: 'daily' as const,
      re_entry_policy: 'never' as const,
    }
    const rfNode = makeRFNode('t1', 'trigger.audience', config)
    const result = serializeNode(rfNode)
    expect(result.type).toBe('trigger.audience')
  })
})

// ─── Actions: Mensageria ──────────────────────────────────────────────────

describe('Actions de Mensageria — serialização', () => {
  it('action.send_email com track_opens e track_clicks', () => {
    const config: SendEmailConfig = {
      to: '{{contact.email}}',
      subject: 'Bem-vindo, {{contact.first_name}}!',
      body_html: '<p>Olá!</p>',
      track_opens: true,
      track_clicks: true,
    }
    const rfNode = makeRFNode('n1', 'action.send_email', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as SendEmailConfig
    expect(cfg.to).toBe('{{contact.email}}')
    expect(cfg.track_opens).toBe(true)
    expect(cfg.track_clicks).toBe(true)
  })

  it('action.send_whatsapp com template HSM', () => {
    const config = {
      to: '{{contact.phone}}',
      message_type: 'template' as const,
      template_name: 'boas_vindas_v2',
      template_params: ['{{contact.first_name}}', '{{company.name}}'],
    }
    const rfNode = makeRFNode('n1', 'action.send_whatsapp', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as typeof config
    expect(cfg.template_name).toBe('boas_vindas_v2')
    expect(cfg.template_params).toHaveLength(2)
  })

  it('action.send_sms com sender_id', () => {
    const config = { to: '{{contact.phone}}', body: 'Seu código: {{code}}', sender_id: 'EMPRESA' }
    const rfNode = makeRFNode('n1', 'action.send_sms', config)
    const result = serializeNode(rfNode)
    expect((result.config as typeof config).sender_id).toBe('EMPRESA')
  })
})

// ─── Conditions ───────────────────────────────────────────────────────────

describe('condition.if_else — serialização e handles', () => {
  it('serializa configuração com lógica AND', () => {
    const config: IfElseConfig = {
      name: 'É VIP?',
      rules: {
        logic: 'AND',
        conditions: [
          { field: 'contact.tags', operator: 'has_tag', value: 'vip' },
          { field: 'contact.total_purchases', operator: 'greater_than', value: 1000 },
        ],
      },
    }
    const rfNode = makeRFNode('c1', 'condition.if_else', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as IfElseConfig
    expect(cfg.name).toBe('É VIP?')
    expect(cfg.rules.logic).toBe('AND')
    expect(cfg.rules.conditions).toHaveLength(2)
  })

  it('edge com sourceHandle "true"', () => {
    const rfEdge = { id: 'e1', source: 'c1', target: 'n2', sourceHandle: 'true' } as RFEdge
    const result = serializeEdge(rfEdge)
    expect(result.sourceHandle).toBe('true')
  })

  it('edge com sourceHandle "false"', () => {
    const rfEdge = { id: 'e2', source: 'c1', target: 'n3', sourceHandle: 'false' } as RFEdge
    const result = serializeEdge(rfEdge)
    expect(result.sourceHandle).toBe('false')
  })

  it('handles esperados para condition.if_else', () => {
    const handles = getSourceHandles('condition.if_else')
    expect(handles).toContain('true')
    expect(handles).toContain('false')
    expect(handles).toHaveLength(2)
  })

  it('isValidSourceHandle: "true" e "false" válidos para if_else', () => {
    expect(isValidSourceHandle('condition.if_else', 'true')).toBe(true)
    expect(isValidSourceHandle('condition.if_else', 'false')).toBe(true)
    expect(isValidSourceHandle('condition.if_else', 'timeout')).toBe(false)
  })

  it('serializa grupos aninhados (AND dentro de OR)', () => {
    const config: IfElseConfig = {
      name: 'Grupo aninhado',
      rules: {
        logic: 'AND',
        conditions: [{ field: 'contact.status', operator: 'equals', value: 'active' }],
        groups: [
          {
            logic: 'OR',
            conditions: [
              { field: 'contact.plan', operator: 'equals', value: 'premium' },
              { field: 'contact.plan', operator: 'equals', value: 'enterprise' },
            ],
          },
        ],
      },
    }
    const rfNode = makeRFNode('c1', 'condition.if_else', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as IfElseConfig
    expect(cfg.rules.groups).toHaveLength(1)
    expect(cfg.rules.groups?.[0].logic).toBe('OR')
    expect(cfg.rules.groups?.[0].conditions).toHaveLength(2)
  })
})

describe('condition.switch — serialização', () => {
  it('serializa casos múltiplos com default', () => {
    const config: SwitchConfig = {
      field: 'contact.lifecycle_stage',
      cases: [
        { name: 'Lead',    operator: 'equals', value: 'lead',     target: 'node_nurture' },
        { name: 'Cliente', operator: 'equals', value: 'customer', target: 'node_onboard' },
      ],
      default: 'node_unknown',
    }
    const rfNode = makeRFNode('s1', 'condition.switch', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as SwitchConfig
    expect(cfg.cases).toHaveLength(2)
    expect(cfg.default).toBe('node_unknown')
  })
})

describe('condition.wait — serialização', () => {
  it('wait_for event com timeout', () => {
    const config: ConditionWaitConfig = {
      name: 'Aguardar abertura de email',
      wait_for: 'event',
      event_type: 'email.opened',
      filters: {
        logic: 'AND',
        conditions: [{ field: 'event.email_id', operator: 'equals', value: '{{context.last_email_id}}' }],
      },
      timeout: '72h',
      success_path: 'node_followup',
      timeout_path: 'node_resend',
    }
    const rfNode = makeRFNode('w1', 'condition.wait', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as ConditionWaitConfig
    expect(cfg.wait_for).toBe('event')
    expect(cfg.timeout).toBe('72h')
    expect(cfg.success_path).toBe('node_followup')
    expect(cfg.timeout_path).toBe('node_resend')
  })

  it('wait_for field_change com check_interval', () => {
    const config: ConditionWaitConfig = {
      name: 'Aguardar pagamento',
      wait_for: 'field_change',
      field: 'contact.payment_status',
      expected_value: 'paid',
      check_interval: '5m',
      timeout: '48h',
      success_path: 'node_deliver',
      timeout_path: 'node_cancel',
    }
    const rfNode = makeRFNode('w1', 'condition.wait', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as ConditionWaitConfig
    expect(cfg.wait_for).toBe('field_change')
    expect(cfg.check_interval).toBe('5m')
    expect(cfg.expected_value).toBe('paid')
  })

  it('wait_for external_signal com capture_data', () => {
    const config: ConditionWaitConfig = {
      name: 'Aguardar aprovação',
      wait_for: 'external_signal',
      signal_key: 'manager_approval_{{contact.id}}',
      timeout: '5d',
      success_path: 'node_approved',
      timeout_path: 'node_escalate',
      capture_data: {
        'context.approved_by': '{{signal.data.approver}}',
        'context.comments':    '{{signal.data.comments}}',
      },
    }
    const rfNode = makeRFNode('w1', 'condition.wait', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as ConditionWaitConfig
    expect(cfg.wait_for).toBe('external_signal')
    expect(cfg.capture_data).toBeDefined()
  })

  it('handles de condition.wait: success e timeout', () => {
    const handles = getSourceHandles('condition.wait')
    expect(handles).toContain('success')
    expect(handles).toContain('timeout')
  })

  it('isValidSourceHandle: "success" e "timeout" válidos para condition.wait', () => {
    expect(isValidSourceHandle('condition.wait', 'success')).toBe(true)
    expect(isValidSourceHandle('condition.wait', 'timeout')).toBe(true)
    expect(isValidSourceHandle('condition.wait', 'true')).toBe(false)
  })

  it('edges de condition.wait refletem success_path e timeout_path', () => {
    const edges: RFEdge[] = [
      { id: 'e1', source: 'w1', target: 'node_followup', sourceHandle: 'success' } as RFEdge,
      { id: 'e2', source: 'w1', target: 'node_resend',   sourceHandle: 'timeout' } as RFEdge,
    ]
    const results = serializeEdges(edges)
    expect(results[0].sourceHandle).toBe('success')
    expect(results[1].sourceHandle).toBe('timeout')
  })
})

// ─── Delays ───────────────────────────────────────────────────────────────

describe('Delays — serialização', () => {
  it('delay.fixed com horas', () => {
    const config: DelayFixedConfig = { duration: 2, unit: 'hours' }
    const rfNode = makeRFNode('d1', 'delay.fixed', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as DelayFixedConfig
    expect(cfg.duration).toBe(2)
    expect(cfg.unit).toBe('hours')
  })

  it('delay.fixed com dias e respeitar horário comercial', () => {
    const config: DelayFixedConfig = {
      duration: 3,
      unit: 'days',
      options: {
        respect_business_hours: true,
        business_hours: {
          timezone: 'America/Sao_Paulo',
          schedule: [{ days: [1, 2, 3, 4, 5], start: '08:00', end: '18:00' }],
        },
      },
    }
    const rfNode = makeRFNode('d1', 'delay.fixed', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as DelayFixedConfig
    expect(cfg.options?.respect_business_hours).toBe(true)
    expect(cfg.options?.business_hours?.timezone).toBe('America/Sao_Paulo')
  })

  it('delay.until_time com timezone do contato', () => {
    const config = { time: '09:00', timezone: 'contact' as const }
    const rfNode = makeRFNode('d1', 'delay.until_time', config)
    const result = serializeNode(rfNode)
    expect((result.config as typeof config).timezone).toBe('contact')
  })

  it('delay.random com faixa min-max', () => {
    const config = { min_duration: 1, max_duration: 4, unit: 'hours' as const }
    const rfNode = makeRFNode('d1', 'delay.random', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as typeof config
    expect(cfg.min_duration).toBe(1)
    expect(cfg.max_duration).toBe(4)
  })

  it('handles de delay.fixed: apenas success', () => {
    const handles = getSourceHandles('delay.fixed')
    expect(handles).toContain('success')
    expect(handles).toHaveLength(1)
  })
})

// ─── Loops ────────────────────────────────────────────────────────────────

describe('Loops — serialização', () => {
  it('loop.for_each com parallel=false', () => {
    const config: ForEachConfig = {
      collection: '{{context.cart_items}}',
      item_variable: 'item',
      index_variable: 'idx',
      parallel: false,
      max_concurrency: 5,
      body_nodes: ['node_send_item_email'],
      on_complete: 'node_summary',
      on_error: 'continue',
    }
    const rfNode = makeRFNode('l1', 'loop.for_each', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as ForEachConfig
    expect(cfg.collection).toBe('{{context.cart_items}}')
    expect(cfg.parallel).toBe(false)
    expect(cfg.body_nodes).toContain('node_send_item_email')
  })

  it('loop.while com max_iterations como limite de segurança', () => {
    const config: WhileConfig = {
      condition: {
        logic: 'AND',
        conditions: [{ field: 'context.approval_status', operator: 'not_equals', value: 'approved' }],
      },
      max_iterations: 5,
      interval_between: '24h',
      body_nodes: ['node_send_reminder'],
      on_max_reached: 'node_escalate',
      on_condition_met: 'node_proceed',
    }
    const rfNode = makeRFNode('l1', 'loop.while', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as WhileConfig
    expect(cfg.max_iterations).toBe(5)
    expect(cfg.on_max_reached).toBe('node_escalate')
  })

  it('handles de loop.for_each: body e on_complete', () => {
    const handles = getSourceHandles('loop.for_each')
    expect(handles).toContain('body')
    expect(handles).toContain('on_complete')
  })

  it('handles de loop.while: body e on_max_reached', () => {
    const handles = getSourceHandles('loop.while')
    expect(handles).toContain('body')
    expect(handles).toContain('on_max_reached')
  })
})

// ─── Controle de Fluxo ────────────────────────────────────────────────────

describe('Controle de Fluxo — serialização', () => {
  it('control.ab_split com 3 variantes e critério de winner', () => {
    const config: AbSplitConfig = {
      variants: [
        { name: 'A', weight: 50, target: 'node_email_v1' },
        { name: 'B', weight: 30, target: 'node_email_v2' },
        { name: 'Controle', weight: 20, target: 'node_no_email' },
      ],
      winner_criteria: {
        metric: 'click_rate',
        min_sample_size: 500,
        confidence_level: 0.95,
        auto_select_winner: true,
        evaluation_after: '48h',
      },
    }
    const rfNode = makeRFNode('ab1', 'control.ab_split', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as AbSplitConfig
    expect(cfg.variants).toHaveLength(3)
    expect(cfg.variants.reduce((s, v) => s + v.weight, 0)).toBe(100)
    expect(cfg.winner_criteria?.auto_select_winner).toBe(true)
  })

  it('control.exit não produz handles de saída', () => {
    const handles = getSourceHandles('control.exit')
    expect(handles).toHaveLength(0)
  })

  it('isValidSourceHandle: qualquer handle é inválido para control.exit', () => {
    expect(isValidSourceHandle('control.exit', 'success')).toBe(false)
    expect(isValidSourceHandle('control.exit', 'any')).toBe(false)
  })
})

// ─── APIs ─────────────────────────────────────────────────────────────────

describe('action.http_request — serialização', () => {
  it('GET com response_mapping', () => {
    const config: HttpRequestConfig = {
      url: 'https://viacep.com.br/ws/{{contact.zipcode}}/json/',
      method: 'GET',
      timeout_ms: 5000,
      retry: { max_retries: 2, backoff: 'exponential', base_delay_ms: 1000 },
      response_mapping: {
        'context.address.city':  '{{response.body.localidade}}',
        'context.address.state': '{{response.body.uf}}',
      },
      on_error: 'continue',
    }
    const rfNode = makeRFNode('h1', 'action.http_request', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as HttpRequestConfig
    expect(cfg.method).toBe('GET')
    expect(cfg.response_mapping?.['context.address.city']).toBe('{{response.body.localidade}}')
    expect(cfg.on_error).toBe('continue')
  })

  it('POST com autenticação bearer', () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/send',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { contact_id: '{{contact.id}}', message: '{{context.message}}' },
      auth: { type: 'bearer', token: '{{env.API_TOKEN}}' },
    }
    const rfNode = makeRFNode('h1', 'action.http_request', config)
    const result = serializeNode(rfNode)
    const cfg = result.config as HttpRequestConfig
    expect(cfg.auth?.type).toBe('bearer')
    expect(cfg.headers?.['Content-Type']).toBe('application/json')
  })
})

// ─── serializeFlow / deserializeFlow ──────────────────────────────────────

describe('serializeFlow', () => {
  it('monta um Flow completo com meta, nodes e edges', () => {
    const config: TriggerEventConfig = { event: 'contact.created' }
    const rfNodes: RFNode[] = [makeRFNode('n1', 'trigger.event', config)]
    const rfEdges: RFEdge[] = []

    const flow = serializeFlow(
      { id: 'flow_001', name: 'Teste', active: true },
      rfNodes,
      rfEdges,
    )

    expect(flow.id).toBe('flow_001')
    expect(flow.name).toBe('Teste')
    expect(flow.active).toBe(true)
    expect(flow.nodes).toHaveLength(1)
    expect(flow.edges).toHaveLength(0)
  })

  it('inclui settings quando fornecido', () => {
    const flow = serializeFlow(
      { id: 'f1', name: 'Onboarding', active: true, settings: { timezone: 'America/Sao_Paulo', re_entry_policy: 'never' } },
      [],
      [],
    )
    expect(flow.settings?.timezone).toBe('America/Sao_Paulo')
  })
})

describe('deserializeFlow', () => {
  it('retorna nodes e edges no formato ReactFlow', () => {
    const flow: Flow = {
      id: 'flow_001',
      name: 'Onboarding',
      active: true,
      nodes: [
        { id: 'n1', type: 'trigger.event', position: { x: 0, y: 0 }, config: { event: 'contact.created' } },
        { id: 'n2', type: 'delay.fixed',   position: { x: 200, y: 0 }, config: { duration: 1, unit: 'days' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
      ],
    }

    const { nodes, edges } = deserializeFlow(flow)

    expect(nodes).toHaveLength(2)
    expect(edges).toHaveLength(1)
    expect(nodes[0].id).toBe('n1')
    expect(nodes[0].data).toHaveProperty('config')
    expect(edges[0].source).toBe('n1')
    expect(edges[0].target).toBe('n2')
  })

  it('nós deserializados não têm config no root — está dentro de data', () => {
    const flow: Flow = {
      id: 'f1', name: 'F', active: true,
      nodes: [{ id: 'n1', type: 'delay.fixed', position: { x: 0, y: 0 }, config: { duration: 2, unit: 'hours' } }],
      edges: [],
    }
    const { nodes } = deserializeFlow(flow)
    expect(nodes[0]).not.toHaveProperty('config')
    expect((nodes[0].data as Record<string, unknown>).config).toEqual({ duration: 2, unit: 'hours' })
  })
})

// ─── Round-trip ────────────────────────────────────────────────────────────

describe('Round-trip: serializeFlow → deserializeFlow → serializeFlow', () => {
  it('fluxo simples: trigger → delay → condition.if_else', () => {
    const original: Flow = {
      id: 'flow_rt1',
      name: 'Round-trip Test',
      active: true,
      nodes: [
        {
          id: 'n1',
          type: 'trigger.event',
          position: { x: 0, y: 0 },
          config: { event: 'contact.created' },
        },
        {
          id: 'n2',
          type: 'delay.fixed',
          position: { x: 200, y: 0 },
          config: { duration: 1, unit: 'days' },
        },
        {
          id: 'n3',
          type: 'condition.if_else',
          position: { x: 400, y: 0 },
          config: {
            name: 'Abriu email?',
            rules: {
              logic: 'AND',
              conditions: [{ field: 'email_opened', operator: 'equals', value: true }],
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4', sourceHandle: 'true' },
        { id: 'e4', source: 'n3', target: 'n5', sourceHandle: 'false' },
      ],
    }

    // Deserializa para ReactFlow
    const { nodes: rfNodes, edges: rfEdges } = deserializeFlow(original)

    // Serializa de volta
    const restored = serializeFlow(
      { id: original.id, name: original.name, active: original.active },
      rfNodes,
      rfEdges,
    )

    expect(restored.nodes).toHaveLength(3)
    expect(restored.edges).toHaveLength(4)
    expect(restored.nodes[0].type).toBe('trigger.event')
    expect(restored.nodes[2].type).toBe('condition.if_else')
    expect(restored.edges[2].sourceHandle).toBe('true')
    expect(restored.edges[3].sourceHandle).toBe('false')
  })

  it('fluxo com condition.wait preserva success_path e timeout_path nas edges', () => {
    const original: Flow = {
      id: 'flow_rt2',
      name: 'Wait Round-trip',
      active: false,
      nodes: [
        {
          id: 'w1',
          type: 'condition.wait',
          position: { x: 0, y: 0 },
          config: {
            name: 'Aguardar resposta',
            wait_for: 'response',
            timeout: '24h',
            success_path: 'n2',
            timeout_path: 'n3',
          } as ConditionWaitConfig,
        },
      ],
      edges: [
        { id: 'e1', source: 'w1', target: 'n2', sourceHandle: 'success' },
        { id: 'e2', source: 'w1', target: 'n3', sourceHandle: 'timeout' },
      ],
    }

    const { nodes: rfNodes, edges: rfEdges } = deserializeFlow(original)
    const restored = serializeFlow(
      { id: original.id, name: original.name, active: original.active },
      rfNodes,
      rfEdges,
    )

    const successEdge = restored.edges.find(e => e.sourceHandle === 'success')
    const timeoutEdge = restored.edges.find(e => e.sourceHandle === 'timeout')
    expect(successEdge?.target).toBe('n2')
    expect(timeoutEdge?.target).toBe('n3')
  })

  it('loop.for_each preserva body e on_complete handles no round-trip', () => {
    const original: Flow = {
      id: 'flow_rt3',
      name: 'Loop Round-trip',
      active: true,
      nodes: [
        {
          id: 'l1',
          type: 'loop.for_each',
          position: { x: 0, y: 0 },
          config: {
            collection: '{{items}}',
            item_variable: 'item',
            body_nodes: ['n_body'],
            on_complete: 'n_done',
          } as ForEachConfig,
        },
      ],
      edges: [
        { id: 'e1', source: 'l1', target: 'n_body', sourceHandle: 'body' },
        { id: 'e2', source: 'l1', target: 'n_done', sourceHandle: 'on_complete' },
      ],
    }

    const { nodes: rfNodes, edges: rfEdges } = deserializeFlow(original)
    const restored = serializeFlow(
      { id: original.id, name: original.name, active: original.active },
      rfNodes,
      rfEdges,
    )

    expect(restored.edges.find(e => e.sourceHandle === 'body')?.target).toBe('n_body')
    expect(restored.edges.find(e => e.sourceHandle === 'on_complete')?.target).toBe('n_done')
  })

  it('posições dos nós são preservadas com precisão decimal', () => {
    const original: Flow = {
      id: 'f1', name: 'Pos Test', active: true,
      nodes: [
        { id: 'n1', type: 'trigger.manual', position: { x: 123.45, y: 678.9 }, config: {} },
      ],
      edges: [],
    }
    const { nodes: rfNodes, edges: rfEdges } = deserializeFlow(original)
    const restored = serializeFlow(
      { id: original.id, name: original.name, active: original.active },
      rfNodes,
      rfEdges,
    )
    expect(restored.nodes[0].position.x).toBe(123.45)
    expect(restored.nodes[0].position.y).toBe(678.9)
  })
})

// ─── Casos extremos ────────────────────────────────────────────────────────

describe('Casos extremos', () => {
  it('fluxo com nodes e edges vazios', () => {
    const flow = serializeFlow({ id: 'f1', name: 'Vazio', active: false }, [], [])
    expect(flow.nodes).toHaveLength(0)
    expect(flow.edges).toHaveLength(0)
  })

  it('serializeNodes com array vazio retorna array vazio', () => {
    expect(serializeNodes([])).toEqual([])
  })

  it('serializeEdges com array vazio retorna array vazio', () => {
    expect(serializeEdges([])).toEqual([])
  })

  it('deserializeNodes com array vazio retorna array vazio', () => {
    expect(deserializeNodes([])).toEqual([])
  })

  it('deserializeEdges com array vazio retorna array vazio', () => {
    expect(deserializeEdges([])).toEqual([])
  })

  it('edge sem sourceHandle não altera outros campos', () => {
    const edge: FlowEdge = { id: 'e1', source: 'a', target: 'b' }
    const rfEdge = deserializeEdge(edge)
    expect(rfEdge.id).toBe('e1')
    expect(rfEdge).not.toHaveProperty('sourceHandle')
  })

  it('nó com label preservado no round-trip', () => {
    const original: Flow = {
      id: 'f1', name: 'Label', active: true,
      nodes: [
        { id: 'n1', type: 'action.send_email', position: { x: 0, y: 0 }, config: { to: 'x', subject: 'y' } as SendEmailConfig, label: 'Email Boas-vindas' },
      ],
      edges: [],
    }
    const { nodes: rfNodes, edges: rfEdges } = deserializeFlow(original)
    const restored = serializeFlow({ id: 'f1', name: 'Label', active: true }, rfNodes, rfEdges)
    expect(restored.nodes[0].label).toBe('Email Boas-vindas')
  })

  it('múltiplas edges do mesmo source para targets diferentes', () => {
    const rfEdges: RFEdge[] = [
      { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'true' } as RFEdge,
      { id: 'e2', source: 'n1', target: 'n3', sourceHandle: 'false' } as RFEdge,
      { id: 'e3', source: 'n1', target: 'n4', sourceHandle: 'false' } as RFEdge, // paralelo
    ]
    const results = serializeEdges(rfEdges)
    expect(results).toHaveLength(3)
    expect(results.filter(e => e.sourceHandle === 'false')).toHaveLength(2)
  })
})
