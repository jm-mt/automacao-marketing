/**
 * Serialização: ReactFlow ↔ Formato customizado do projeto
 *
 * Regra: o estado interno do @xyflow/react tem muitos campos adicionais
 * (selected, dragging, measured, internals, etc.) que NÃO devem ser
 * persistidos. As funções aqui fazem a transformação em ambas as direções.
 */

import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react'
import type { Flow, FlowNode, FlowEdge, NodeType } from './types'

// ─── ReactFlow → Formato customizado ──────────────────────────────────────

/**
 * Converte um nó do ReactFlow para o formato customizado do projeto.
 * Remove todos os campos internos do ReactFlow.
 */
export function serializeNode(rfNode: RFNode): FlowNode {
  return {
    id: rfNode.id,
    type: rfNode.type as NodeType,
    position: {
      x: rfNode.position.x,
      y: rfNode.position.y,
    },
    config: (rfNode.data as Record<string, unknown>).config as FlowNode['config'],
    ...(rfNode.data && typeof rfNode.data === 'object' && 'label' in rfNode.data
      ? { label: String((rfNode.data as Record<string, unknown>).label) }
      : {}),
    ...((rfNode.data as Record<string, unknown>)?.error_handling
      ? { error_handling: (rfNode.data as Record<string, unknown>).error_handling as FlowNode['error_handling'] }
      : {}),
  }
}

/**
 * Converte uma lista de nós do ReactFlow para o formato customizado.
 */
export function serializeNodes(rfNodes: RFNode[]): FlowNode[] {
  return rfNodes.map(serializeNode)
}

/**
 * Converte um edge do ReactFlow para o formato customizado.
 * Mantém apenas id, source, target, sourceHandle e targetHandle.
 */
export function serializeEdge(rfEdge: RFEdge): FlowEdge {
  const edge: FlowEdge = {
    id: rfEdge.id,
    source: rfEdge.source,
    target: rfEdge.target,
  }
  if (rfEdge.sourceHandle != null) edge.sourceHandle = rfEdge.sourceHandle
  if (rfEdge.targetHandle != null) edge.targetHandle = rfEdge.targetHandle
  return edge
}

/**
 * Converte uma lista de edges do ReactFlow para o formato customizado.
 */
export function serializeEdges(rfEdges: RFEdge[]): FlowEdge[] {
  return rfEdges.map(serializeEdge)
}

/**
 * Monta o objeto Flow completo a partir do estado atual do editor ReactFlow.
 */
export function serializeFlow(
  meta: Pick<Flow, 'id' | 'name' | 'active' | 'settings'>,
  rfNodes: RFNode[],
  rfEdges: RFEdge[],
): Flow {
  return {
    ...meta,
    nodes: serializeNodes(rfNodes),
    edges: serializeEdges(rfEdges),
  }
}

// ─── Formato customizado → ReactFlow ──────────────────────────────────────

/**
 * Converte um FlowNode para o formato que o @xyflow/react espera.
 *
 * O ReactFlow usa `data` como campo livre para os dados do nó.
 * Colocamos config, label e error_handling dentro de `data` para
 * que o componente de nó possa acessá-los via `props.data`.
 */
export function deserializeNode(node: FlowNode): RFNode {
  return {
    id: node.id,
    type: node.type,
    position: { x: node.position.x, y: node.position.y },
    data: {
      config: node.config,
      ...(node.label !== undefined ? { label: node.label } : {}),
      ...(node.error_handling !== undefined ? { error_handling: node.error_handling } : {}),
    },
  }
}

/**
 * Converte uma lista de FlowNodes para o formato ReactFlow.
 */
export function deserializeNodes(nodes: FlowNode[]): RFNode[] {
  return nodes.map(deserializeNode)
}

/**
 * Converte um FlowEdge para o formato que o @xyflow/react espera.
 */
export function deserializeEdge(edge: FlowEdge): RFEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.sourceHandle !== undefined ? { sourceHandle: edge.sourceHandle } : {}),
    ...(edge.targetHandle !== undefined ? { targetHandle: edge.targetHandle } : {}),
  }
}

/**
 * Converte uma lista de FlowEdges para o formato ReactFlow.
 */
export function deserializeEdges(edges: FlowEdge[]): RFEdge[] {
  return edges.map(deserializeEdge)
}

/**
 * Converte um Flow completo para o estado inicial do editor ReactFlow.
 */
export function deserializeFlow(flow: Flow): { nodes: RFNode[]; edges: RFEdge[] } {
  return {
    nodes: deserializeNodes(flow.nodes),
    edges: deserializeEdges(flow.edges),
  }
}

// ─── Utilitários ──────────────────────────────────────────────────────────

/**
 * Gera um ID único para um novo nó.
 * Formato: node_[8 chars alfanuméricos]
 */
export function generateNodeId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const id = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  return `node_${id}`
}

/**
 * Gera um ID único para um novo edge.
 * Formato: edge_[source]_[target]_[4 chars]
 */
export function generateEdgeId(source: string, target: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const suffix = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  return `edge_${source}_${target}_${suffix}`
}

/**
 * Verifica se um sourceHandle é válido para um dado tipo de nó.
 */
export function isValidSourceHandle(nodeType: NodeType, handle: string): boolean {
  const validHandles: Partial<Record<NodeType, string[]>> = {
    'condition.if_else': ['true', 'false'],
    'condition.wait':    ['success', 'timeout'],
    'loop.for_each':     ['body', 'on_complete'],
    'loop.while':        ['body', 'on_max_reached'],
    'control.exit':      [],
  }

  if (nodeType in validHandles) {
    return validHandles[nodeType]!.includes(handle)
  }
  // Para nós de ação/delay/trigger, aceita "success" e "error"
  return handle === 'success' || handle === 'error'
}

/**
 * Retorna quais sourceHandles um tipo de nó produz.
 */
export function getSourceHandles(nodeType: NodeType): string[] {
  const handles: Partial<Record<NodeType, string[]>> = {
    'trigger.event':      ['success'],
    'trigger.schedule':   ['success'],
    'trigger.webhook':    ['success'],
    'trigger.manual':     ['success'],
    'trigger.audience':   ['success'],
    'condition.if_else':  ['true', 'false'],
    'condition.switch':   [], // dinâmico — depende dos cases
    'condition.wait':     ['success', 'timeout'],
    'loop.for_each':      ['body', 'on_complete'],
    'loop.while':         ['body', 'on_max_reached'],
    'loop.repeat':        ['body', 'on_complete'],
    'loop.retry':         ['success', 'on_max_retries'],
    'control.split':      [], // dinâmico — depende dos branches
    'control.ab_split':   [], // dinâmico — depende das variantes
    'control.merge':      ['success'],
    'control.goto':       [],
    'control.exit':       [],
  }

  if (nodeType in handles) return handles[nodeType]!

  // Nós de ação e delay: success (+ error opcional)
  return ['success']
}
