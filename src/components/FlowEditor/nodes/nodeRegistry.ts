import type { ComponentType } from 'react'
import type { NodeProps } from '@xyflow/react'
import NodeBase from './NodeBase'
import { NODE_META } from './nodeCategories'

// Todos os tipos de nó mapeiam para NodeBase.
// NodeBase usa props.type internamente para determinar aparência e handles.
export const nodeTypes: Record<string, ComponentType<NodeProps>> = Object.keys(NODE_META).reduce(
  (acc, type) => {
    acc[type] = NodeBase as unknown as ComponentType<NodeProps>
    return acc
  },
  {} as Record<string, ComponentType<NodeProps>>,
)
