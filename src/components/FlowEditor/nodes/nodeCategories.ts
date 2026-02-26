export type NodeCategory =
  | 'trigger' | 'action' | 'condition' | 'delay'
  | 'loop' | 'control' | 'crm' | 'api'

export interface NodeMeta {
  label: string
  icon: string
  category: NodeCategory
  description: string
  /** Handles de saída estáticos. [] = nenhum. undefined = dinâmico. */
  sourceHandles?: Array<{ id: string; label: string; color: string }>
}

export const NODE_META: Record<string, NodeMeta> = {
  // ─── Triggers ────────────────────────────────────────────────
  'trigger.event': {
    label: 'Evento', icon: '⚡', category: 'trigger',
    description: 'Dispara ao receber um evento',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-trigger)' }],
  },
  'trigger.schedule': {
    label: 'Agendamento', icon: '🕐', category: 'trigger',
    description: 'Dispara em horário fixo ou recorrente',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-trigger)' }],
  },
  'trigger.webhook': {
    label: 'Webhook', icon: '🔗', category: 'trigger',
    description: 'Inicia ao receber requisição HTTP',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-trigger)' }],
  },
  'trigger.manual': {
    label: 'Manual', icon: '👆', category: 'trigger',
    description: 'Disparado manualmente pelo usuário',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-trigger)' }],
  },
  'trigger.audience': {
    label: 'Audiência', icon: '👥', category: 'trigger',
    description: 'Entra contatos por segmento dinâmico',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-trigger)' }],
  },

  // ─── Actions: Mensageria ──────────────────────────────────────
  'action.send_email': {
    label: 'Enviar Email', icon: '📧', category: 'action',
    description: 'Envia e-mail com template configurável',
    sourceHandles: [
      { id: 'success', label: '', color: 'var(--node-action)' },
      { id: 'error',   label: '', color: '#DC2626' },
    ],
  },
  'action.send_whatsapp': {
    label: 'WhatsApp', icon: '💬', category: 'action',
    description: 'Envia mensagem via WhatsApp',
    sourceHandles: [
      { id: 'success', label: '', color: 'var(--node-action)' },
      { id: 'error',   label: '', color: '#DC2626' },
    ],
  },
  'action.send_chat': {
    label: 'Chat', icon: '💭', category: 'action',
    description: 'Envia mensagem no widget de chat',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-action)' }],
  },
  'action.send_sms': {
    label: 'SMS', icon: '📱', category: 'action',
    description: 'Envia SMS',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-action)' }],
  },

  // ─── Conditions ───────────────────────────────────────────────
  'condition.if_else': {
    label: 'IF / ELSE', icon: '⑂', category: 'condition',
    description: 'Ramificação condicional true / false',
    sourceHandles: [
      { id: 'true',  label: 'Sim', color: '#16A34A' },
      { id: 'false', label: 'Não', color: '#DC2626' },
    ],
  },
  'condition.switch': {
    label: 'Switch', icon: '⊞', category: 'condition',
    description: 'Múltiplos caminhos baseados em um campo',
    sourceHandles: undefined, // dinâmico — depende dos cases
  },
  'condition.wait': {
    label: 'Aguardar', icon: '⏳', category: 'condition',
    description: 'Espera evento, resposta ou sinal',
    sourceHandles: [
      { id: 'success', label: 'Atendido', color: '#16A34A' },
      { id: 'timeout', label: 'Timeout', color: '#D97706' },
    ],
  },

  // ─── Delays ───────────────────────────────────────────────────
  'delay.fixed': {
    label: 'Delay', icon: '⏱', category: 'delay',
    description: 'Aguarda tempo fixo',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-delay)' }],
  },
  'delay.until_time': {
    label: 'Até horário', icon: '🕐', category: 'delay',
    description: 'Aguarda até horário específico',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-delay)' }],
  },
  'delay.until_date': {
    label: 'Até data', icon: '📅', category: 'delay',
    description: 'Aguarda até data/hora específica',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-delay)' }],
  },
  'delay.until_day': {
    label: 'Até dia', icon: '📆', category: 'delay',
    description: 'Aguarda próximo dia da semana específico',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-delay)' }],
  },
  'delay.smart_send': {
    label: 'Smart Send', icon: '🎯', category: 'delay',
    description: 'Envia no melhor horário do contato',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-delay)' }],
  },
  'delay.business_hours': {
    label: 'Horário Comercial', icon: '🏢', category: 'delay',
    description: 'Aguarda próximo horário comercial',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-delay)' }],
  },
  'delay.random': {
    label: 'Delay Aleatório', icon: '🎲', category: 'delay',
    description: 'Aguarda tempo aleatório em uma faixa',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-delay)' }],
  },

  // ─── Loops ────────────────────────────────────────────────────
  'loop.for_each': {
    label: 'Para cada', icon: '🔁', category: 'loop',
    description: 'Itera sobre uma lista de itens',
    sourceHandles: [
      { id: 'body',       label: 'Item',     color: '#DB2777' },
      { id: 'on_complete', label: 'Fim',     color: '#16A34A' },
    ],
  },
  'loop.while': {
    label: 'Enquanto', icon: '↺', category: 'loop',
    description: 'Repete enquanto condição for verdadeira',
    sourceHandles: [
      { id: 'body',           label: 'Corpo',    color: '#DB2777' },
      { id: 'on_max_reached', label: 'Limite',   color: '#DC2626' },
    ],
  },
  'loop.repeat': {
    label: 'Repetir N vezes', icon: '🔂', category: 'loop',
    description: 'Repete um número fixo de vezes',
    sourceHandles: [
      { id: 'body',       label: 'Corpo',  color: '#DB2777' },
      { id: 'on_complete', label: 'Fim',   color: '#16A34A' },
    ],
  },
  'loop.retry': {
    label: 'Retry', icon: '↩', category: 'loop',
    description: 'Re-executa em caso de falha com backoff',
    sourceHandles: [
      { id: 'success',       label: 'OK',      color: '#16A34A' },
      { id: 'on_max_retries', label: 'Esgotou', color: '#DC2626' },
    ],
  },

  // ─── Controle ─────────────────────────────────────────────────
  'control.split': {
    label: 'Split', icon: '⑃', category: 'control',
    description: 'Executa múltiplos caminhos em paralelo',
    sourceHandles: undefined,
  },
  'control.ab_split': {
    label: 'A/B Split', icon: '∥', category: 'control',
    description: 'Divide tráfego para teste A/B',
    sourceHandles: undefined,
  },
  'control.merge': {
    label: 'Merge', icon: '⇒', category: 'control',
    description: 'Une caminhos paralelos',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-control)' }],
  },
  'control.goto': {
    label: 'Go To', icon: '↗', category: 'control',
    description: 'Salta para outro nó do fluxo',
    sourceHandles: [],
  },
  'control.exit': {
    label: 'Finalizar', icon: '⏹', category: 'control',
    description: 'Encerra a execução do fluxo',
    sourceHandles: [],
  },

  // ─── CRM ──────────────────────────────────────────────────────
  'action.contact_update': {
    label: 'Atualizar Contato', icon: '✏️', category: 'crm',
    description: 'Atualiza campos do contato',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-crm)' }],
  },
  'action.contact_tag_add': {
    label: 'Adicionar Tag', icon: '🏷️', category: 'crm',
    description: 'Adiciona tag ao contato',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-crm)' }],
  },
  'action.contact_tag_remove': {
    label: 'Remover Tag', icon: '🏷️', category: 'crm',
    description: 'Remove tag do contato',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-crm)' }],
  },
  'action.deal_create': {
    label: 'Criar Deal', icon: '💼', category: 'crm',
    description: 'Cria oportunidade no pipeline',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-crm)' }],
  },
  'action.score_update': {
    label: 'Lead Score', icon: '⭐', category: 'crm',
    description: 'Altera pontuação do lead',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-crm)' }],
  },
  'action.flow_start': {
    label: 'Iniciar Fluxo', icon: '▶', category: 'crm',
    description: 'Inicia outro fluxo para o contato',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-crm)' }],
  },
  'action.flow_stop': {
    label: 'Parar Fluxo', icon: '⏹', category: 'crm',
    description: 'Para um fluxo específico do contato',
    sourceHandles: [{ id: 'success', label: '', color: 'var(--node-crm)' }],
  },

  // ─── APIs ─────────────────────────────────────────────────────
  'action.http_request': {
    label: 'HTTP Request', icon: '🌐', category: 'api',
    description: 'Faz requisição para API externa',
    sourceHandles: [
      { id: 'success', label: '', color: 'var(--node-api)' },
      { id: 'error',   label: '', color: '#DC2626' },
    ],
  },
  'action.script': {
    label: 'Script JS', icon: '</>', category: 'api',
    description: 'Executa código JavaScript customizado',
    sourceHandles: [
      { id: 'success', label: '', color: 'var(--node-api)' },
      { id: 'error',   label: '', color: '#DC2626' },
    ],
  },
}

// Agrupamento para a sidebar
export const SIDEBAR_CATEGORIES: Array<{
  id: string
  label: string
  types: string[]
}> = [
  {
    id: 'triggers',
    label: 'Triggers',
    types: ['trigger.event', 'trigger.schedule', 'trigger.webhook', 'trigger.manual', 'trigger.audience'],
  },
  {
    id: 'messaging',
    label: 'Mensagens',
    types: ['action.send_email', 'action.send_whatsapp', 'action.send_chat', 'action.send_sms'],
  },
  {
    id: 'logic',
    label: 'Lógica',
    types: ['condition.if_else', 'condition.switch', 'condition.wait'],
  },
  {
    id: 'delays',
    label: 'Esperas',
    types: ['delay.fixed', 'delay.until_time', 'delay.until_date', 'delay.until_day', 'delay.smart_send', 'delay.business_hours', 'delay.random'],
  },
  {
    id: 'loops',
    label: 'Loops',
    types: ['loop.for_each', 'loop.while', 'loop.repeat', 'loop.retry'],
  },
  {
    id: 'control',
    label: 'Controle de Fluxo',
    types: ['control.split', 'control.ab_split', 'control.merge', 'control.goto', 'control.exit'],
  },
  {
    id: 'crm',
    label: 'CRM / Dados',
    types: ['action.contact_update', 'action.contact_tag_add', 'action.contact_tag_remove', 'action.deal_create', 'action.score_update', 'action.flow_start', 'action.flow_stop'],
  },
  {
    id: 'api',
    label: 'APIs',
    types: ['action.http_request', 'action.script'],
  },
]

// Cores por categoria (valor da CSS custom property)
export const CATEGORY_COLOR: Record<NodeCategory, string> = {
  trigger:   'var(--node-trigger)',
  action:    'var(--node-action)',
  condition: 'var(--node-condition)',
  delay:     'var(--node-delay)',
  loop:      'var(--node-loop)',
  control:   'var(--node-control)',
  crm:       'var(--node-crm)',
  api:       'var(--node-api)',
}

export const CATEGORY_BG: Record<NodeCategory, string> = {
  trigger:   'var(--node-trigger-bg)',
  action:    'var(--node-action-bg)',
  condition: 'var(--node-condition-bg)',
  delay:     'var(--node-delay-bg)',
  loop:      'var(--node-loop-bg)',
  control:   'var(--node-control-bg)',
  crm:       'var(--node-crm-bg)',
  api:       'var(--node-api-bg)',
}
