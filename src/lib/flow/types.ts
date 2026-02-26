// ─── Primitivos ────────────────────────────────────────────────────────────

export type TimeUnit = 'minutes' | 'hours' | 'days' | 'weeks'

export type LogicOperator = 'AND' | 'OR'

export type ComparisonOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'matches_regex'
  | 'greater_than' | 'less_than' | 'between'
  | 'in' | 'not_in'
  | 'is_empty' | 'is_not_empty' | 'exists'
  | 'date_before' | 'date_after'
  | 'has_tag' | 'in_segment' | 'in_flow'
  | 'includes'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type Channel =
  | 'whatsapp' | 'email' | 'sms'
  | 'instagram_dm' | 'facebook_messenger' | 'telegram' | 'webchat'

// ─── Condição / Regra ──────────────────────────────────────────────────────

export interface ConditionRule {
  field: string
  operator: ComparisonOperator
  value?: unknown
}

export interface ConditionGroup {
  logic: LogicOperator
  conditions: ConditionRule[]
  groups?: ConditionGroup[]
}

// ─── Categorias de nó ─────────────────────────────────────────────────────

export type NodeCategory =
  | 'trigger' | 'action' | 'condition' | 'delay'
  | 'loop' | 'control' | 'crm' | 'api' | 'integration'

// ─── Tipos de nó (NodeType) ───────────────────────────────────────────────

// Triggers
export type TriggerNodeType =
  | 'trigger.event'
  | 'trigger.schedule'
  | 'trigger.webhook'
  | 'trigger.manual'
  | 'trigger.audience'

// Actions — Mensageria
export type ActionMessageNodeType =
  | 'action.send_email'
  | 'action.send_whatsapp'
  | 'action.send_chat'
  | 'action.send_sms'

// Actions — CRM / Dados
export type ActionCrmNodeType =
  | 'action.contact_update'
  | 'action.contact_tag_add'
  | 'action.contact_tag_remove'
  | 'action.contact_add_to_list'
  | 'action.contact_remove_from_list'
  | 'action.contact_create'
  | 'action.contact_delete'
  | 'action.deal_create'
  | 'action.deal_update'
  | 'action.deal_move_stage'
  | 'action.score_update'
  | 'action.note_create'
  | 'action.flow_start'
  | 'action.flow_stop'
  | 'action.flow_pause'
  | 'action.goal_check'
  | 'action.ab_split'

// Actions — APIs
export type ActionApiNodeType =
  | 'action.http_request'
  | 'action.script'
  | 'action.webhook_out'

// Conditions
export type ConditionNodeType =
  | 'condition.if_else'
  | 'condition.switch'
  | 'condition.wait'

// Delays
export type DelayNodeType =
  | 'delay.fixed'
  | 'delay.until_time'
  | 'delay.until_date'
  | 'delay.until_day'
  | 'delay.smart_send'
  | 'delay.business_hours'
  | 'delay.random'

// Loops
export type LoopNodeType =
  | 'loop.for_each'
  | 'loop.while'
  | 'loop.repeat'
  | 'loop.retry'

// Controle de fluxo
export type ControlNodeType =
  | 'control.split'
  | 'control.ab_split'
  | 'control.merge'
  | 'control.goto'
  | 'control.exit'

export type NodeType =
  | TriggerNodeType
  | ActionMessageNodeType
  | ActionCrmNodeType
  | ActionApiNodeType
  | ConditionNodeType
  | DelayNodeType
  | LoopNodeType
  | ControlNodeType

// ─── Dados específicos por tipo de nó ─────────────────────────────────────

// --- Triggers ---

export interface TriggerEventConfig {
  event: string
  channel?: Channel
  filters?: ConditionGroup
  deduplicate?: { enabled: boolean; window_seconds: number }
  rate_limit?: { max_per_minute: number }
}

export interface TriggerScheduleConfig {
  mode: 'cron' | 'interval' | 'datetime' | 'relative'
  cron?: string
  interval?: string
  datetime?: string
  timezone?: string
}

export interface TriggerWebhookConfig {
  method: HttpMethod[]
  auth_type: 'none' | 'api_key' | 'hmac_sha256' | 'bearer'
  secret?: string
  response_mode: 'immediate' | 'wait_for_completion'
  timeout_ms?: number
}

export interface TriggerManualConfig {
  description?: string
}

export interface TriggerAudienceConfig {
  segment_rules: ConditionGroup
  evaluation_frequency: 'realtime' | 'hourly' | 'daily'
  entry_limit?: number
  re_entry_policy: 'never' | 'after_completion' | 'after_x_days'
  re_entry_days?: number
}

// --- Actions: Mensageria ---

export interface SendEmailConfig {
  to: string
  from_name?: string
  from_email?: string
  reply_to?: string
  subject: string
  body_html?: string
  body_text?: string
  track_opens?: boolean
  track_clicks?: boolean
  send_window?: { start: string; end: string; timezone: string }
  ab_test?: { variants: Array<{ subject?: string; body_html?: string; weight: number }> }
}

export interface SendWhatsAppConfig {
  to: string
  message_type: 'text' | 'template' | 'image' | 'video' | 'document' | 'audio' | 'interactive'
  template_name?: string
  template_params?: string[]
  body?: string
  media_url?: string
  buttons?: Array<{ type: 'quick_reply' | 'url' | 'call'; text: string; value?: string }>
  typing_delay_ms?: number
}

export interface SendChatConfig {
  channel: Channel
  message_type: 'text' | 'image' | 'card' | 'carousel' | 'quick_replies'
  body: string
  quick_replies?: string[]
  assign_to?: string
}

export interface SendSmsConfig {
  to: string
  body: string
  sender_id?: string
  provider?: string
}

// --- Actions: CRM ---

export interface ContactUpdateConfig {
  field_mapping: Record<string, unknown>
  merge_strategy?: 'overwrite' | 'append' | 'if_empty'
}

export interface ContactTagConfig {
  tags: string[]
}

export interface DealCreateConfig {
  pipeline_id: string
  stage_id: string
  value?: number
  owner?: string
}

export interface ScoreUpdateConfig {
  operation: 'add' | 'subtract' | 'set'
  value: number
}

export interface FlowControlConfig {
  flow_id: string
  pass_context?: boolean
}

// --- Conditions ---

export interface IfElseConfig {
  name: string
  rules: ConditionGroup
}

export interface SwitchCase {
  name: string
  operator: ComparisonOperator
  value: unknown
  target: string
}

export interface SwitchConfig {
  field: string
  cases: SwitchCase[]
  default: string
  evaluate_all?: boolean
}

export type WaitForType = 'event' | 'response' | 'field_change' | 'external_signal'

export interface ConditionWaitConfig {
  name: string
  wait_for: WaitForType
  event_type?: string
  filters?: ConditionGroup
  field?: string
  expected_value?: unknown
  check_interval?: string
  signal_key?: string
  timeout: string
  success_path: string
  timeout_path: string
  capture_data?: Record<string, string>
}

// --- Delays ---

export interface BusinessHoursSchedule {
  days: number[]
  start: string
  end: string
}

export interface BusinessHoursOptions {
  timezone: string
  schedule: BusinessHoursSchedule[]
  holidays?: string[]
}

export interface DelayOptions {
  respect_business_hours?: boolean
  business_hours?: BusinessHoursOptions
  respect_quiet_hours?: boolean
  quiet_hours?: { start: string; end: string }
}

export interface DelayFixedConfig {
  duration: number
  unit: TimeUnit
  options?: DelayOptions
}

export interface DelayUntilTimeConfig {
  time: string
  timezone?: 'contact' | string
  options?: DelayOptions
}

export interface DelayUntilDateConfig {
  datetime: string
  timezone?: string
}

export interface DelayRandomConfig {
  min_duration: number
  max_duration: number
  unit: TimeUnit
}

export interface DelayBusinessHoursConfig {
  schedule: BusinessHoursSchedule[]
  timezone: string
}

// --- Loops ---

export interface ForEachConfig {
  collection: string
  item_variable: string
  index_variable?: string
  parallel?: boolean
  max_concurrency?: number
  body_nodes: string[]
  on_complete: string
  on_error?: 'continue' | 'fail'
}

export interface WhileConfig {
  condition: ConditionGroup
  max_iterations: number
  interval_between?: string
  body_nodes: string[]
  on_max_reached: string
  on_condition_met: string
}

export interface RepeatConfig {
  count: number
  interval: string
  body_nodes: string[]
  on_complete: string
}

export interface RetryConfig {
  max_retries: number
  backoff: 'linear' | 'exponential' | 'fixed'
  base_delay: string
  body_nodes: string[]
  on_success: string
  on_max_retries: string
}

// --- Control ---

export interface SplitBranch {
  name: string
  start_node: string
}

export interface SplitConfig {
  branches: SplitBranch[]
  merge_strategy: 'wait_all' | 'wait_any' | 'no_merge'
  merge_node?: string
  timeout?: string
}

export interface AbSplitVariant {
  name: string
  weight: number
  target: string
}

export interface AbSplitConfig {
  variants: AbSplitVariant[]
  winner_criteria?: {
    metric: string
    min_sample_size: number
    confidence_level: number
    auto_select_winner: boolean
    evaluation_after: string
  }
}

export interface MergeConfig {
  mode: 'wait_all' | 'wait_any' | 'wait_n' | 'aggregate'
  wait_n?: number
  timeout?: string
}

export interface GotoConfig {
  target_node: string
  max_hops?: number
}

export interface ExitConfig {
  status: 'completed' | 'cancelled' | 'goal_reached'
  reason?: string
  remove_from_flow?: boolean
}

// --- APIs ---

export interface HttpRequestConfig {
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  body?: Record<string, unknown>
  auth?: {
    type: 'none' | 'bearer' | 'basic' | 'api_key' | 'oauth2'
    token?: string
    username?: string
    password?: string
    key?: string
  }
  timeout_ms?: number
  retry?: {
    max_retries: number
    backoff: 'linear' | 'exponential' | 'fixed'
    base_delay_ms: number
  }
  response_mapping?: Record<string, string>
  success_codes?: number[]
  on_error?: 'fail' | 'continue' | string
}

export interface ScriptConfig {
  language: 'javascript'
  code: string
  timeout_ms?: number
  max_memory_mb?: number
  allowed_modules?: string[]
}

// ─── Mapa de configuração por tipo ────────────────────────────────────────

export interface NodeConfigMap {
  'trigger.event':        TriggerEventConfig
  'trigger.schedule':     TriggerScheduleConfig
  'trigger.webhook':      TriggerWebhookConfig
  'trigger.manual':       TriggerManualConfig
  'trigger.audience':     TriggerAudienceConfig
  'action.send_email':    SendEmailConfig
  'action.send_whatsapp': SendWhatsAppConfig
  'action.send_chat':     SendChatConfig
  'action.send_sms':      SendSmsConfig
  'action.contact_update':         ContactUpdateConfig
  'action.contact_tag_add':        ContactTagConfig
  'action.contact_tag_remove':     ContactTagConfig
  'action.contact_add_to_list':    { list_id: string }
  'action.contact_remove_from_list': { list_id: string }
  'action.contact_create':         ContactUpdateConfig
  'action.contact_delete':         { reason?: string }
  'action.deal_create':            DealCreateConfig
  'action.deal_update':            { deal_id: string; field_mapping: Record<string, unknown> }
  'action.deal_move_stage':        { deal_id: string; target_stage: string }
  'action.score_update':           ScoreUpdateConfig
  'action.note_create':            { body: string }
  'action.flow_start':             FlowControlConfig
  'action.flow_stop':              { flow_id: string | 'current' | 'all' }
  'action.flow_pause':             { flow_id: string }
  'action.goal_check':             { goal_id: string }
  'action.ab_split':               AbSplitConfig
  'action.http_request':           HttpRequestConfig
  'action.script':                 ScriptConfig
  'action.webhook_out':            HttpRequestConfig
  'condition.if_else':             IfElseConfig
  'condition.switch':              SwitchConfig
  'condition.wait':                ConditionWaitConfig
  'delay.fixed':                   DelayFixedConfig
  'delay.until_time':              DelayUntilTimeConfig
  'delay.until_date':              DelayUntilDateConfig
  'delay.until_day':               { day: string; time: string; timezone?: string }
  'delay.smart_send':              { options?: DelayOptions }
  'delay.business_hours':          DelayBusinessHoursConfig
  'delay.random':                  DelayRandomConfig
  'loop.for_each':                 ForEachConfig
  'loop.while':                    WhileConfig
  'loop.repeat':                   RepeatConfig
  'loop.retry':                    RetryConfig
  'control.split':                 SplitConfig
  'control.ab_split':              AbSplitConfig
  'control.merge':                 MergeConfig
  'control.goto':                  GotoConfig
  'control.exit':                  ExitConfig
}

// ─── Nó do fluxo ──────────────────────────────────────────────────────────

export interface FlowPosition {
  x: number
  y: number
}

export interface ErrorHandling {
  strategy: 'fail' | 'continue' | 'retry' | 'goto' | 'fallback_value'
  retry?: {
    max_retries: number
    backoff_strategy: 'linear' | 'exponential' | 'fixed'
    base_delay_ms: number
    max_delay_ms?: number
    retry_on?: string[]
    jitter?: boolean
  }
  fallback_value?: unknown
  goto_node?: string
}

export interface FlowNode<T extends NodeType = NodeType> {
  id: string
  type: T
  label?: string
  position: FlowPosition
  config: T extends keyof NodeConfigMap ? NodeConfigMap[T] : Record<string, unknown>
  error_handling?: ErrorHandling
}

// ─── Edge do fluxo ────────────────────────────────────────────────────────

/** sourceHandle identifica a saída do nó de origem:
 *  - condition.if_else → "true" | "false"
 *  - condition.wait    → "success" | "timeout"
 *  - condition.switch  → nome do case ou "default"
 *  - loop.for_each     → "body" | "on_complete"
 *  - loop.while        → "body" | "on_max_reached"
 *  - action.*          → "success" | "error"  (opcional)
 */
export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

// ─── Fluxo completo ────────────────────────────────────────────────────────

export interface FlowSettings {
  timezone?: string
  re_entry_policy?: 'never' | 'after_completion' | 'after_x_days'
  max_concurrent_runs?: number
  execution_timeout?: string
  error_handler?: string
  goals?: Array<{
    id: string
    name: string
    event: string
    exits_flow: boolean
  }>
}

export interface Flow {
  id: string
  name: string
  version?: number
  active: boolean
  nodes: FlowNode[]
  edges: FlowEdge[]
  settings?: FlowSettings
  created_at?: string
  updated_at?: string
}

// ─── Execução (Run) ────────────────────────────────────────────────────────

export type RunStatus =
  | 'PENDING' | 'RUNNING' | 'WAITING'
  | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED'

export interface RunHistoryEntry {
  node_id: string
  status: 'running' | 'completed' | 'failed' | 'waiting' | 'skipped'
  started_at: string
  completed_at?: string
  output?: Record<string, unknown>
  error?: string
}

export interface FlowRun {
  id: string
  flow_id: string
  flow_version: number
  contact_id: string
  status: RunStatus
  current_node: string | null
  context: Record<string, unknown>
  history: RunHistoryEntry[]
  started_at: string
  updated_at: string
  timeout_at?: string
}
