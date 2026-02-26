'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  type OnConnect,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useFlowStore } from '@/hooks/useFlowStore'
import { serializeFlow } from '@/lib/flow/serialization'
import { generateNodeId } from '@/lib/flow/serialization'
import { updateFlow } from '@/app/actions/flows'
import { nodeTypes } from './nodes/nodeRegistry'
import NodeSidebar from './sidebar/NodeSidebar'
import ConfigPanel from './panel/ConfigPanel'
import FlowHeader from './header/FlowHeader'
import styles from './FlowEditor.module.scss'

interface FlowMeta {
  id: string
  name: string
  active: boolean
}

interface FlowEditorProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  flowMeta?: FlowMeta
}

const DEFAULT_NODES: Node[] = [
  {
    id: 'n1',
    type: 'trigger.event',
    position: { x: 80, y: 200 },
    data: {
      config: { event: 'contact.created' },
      label: 'Trigger inicial',
    },
  },
]

export default function FlowEditor({
  initialNodes = DEFAULT_NODES,
  initialEdges = [],
  flowMeta,
}: FlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const setFlowMeta = useFlowStore((s) => s.setFlowMeta)
  const flowId      = useFlowStore((s) => s.flowId)
  const flowName    = useFlowStore((s) => s.flowName)
  const flowActive  = useFlowStore((s) => s.flowActive)
  const selectNode  = useFlowStore((s) => s.selectNode)
  const closePanel  = useFlowStore((s) => s.closePanel)
  const setSaving   = useFlowStore((s) => s.setSaving)

  // Inicializar o store com os metadados do fluxo carregado do banco
  useEffect(() => {
    if (flowMeta) {
      setFlowMeta(flowMeta)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowMeta?.id])

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  return (
    <div className={styles.editor}>
      <FlowEditor_Inner
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        setNodes={setNodes}
        reactFlowWrapper={reactFlowWrapper}
        flowId={flowId || flowMeta?.id || ''}
        flowName={flowName}
        flowActive={flowActive}
        selectNode={selectNode}
        closePanel={closePanel}
        setSaving={setSaving}
      />
    </div>
  )
}

interface InnerProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: ReturnType<typeof useNodesState>[2]
  onEdgesChange: ReturnType<typeof useEdgesState>[2]
  onConnect: OnConnect
  onDragOver: (e: React.DragEvent) => void
  setNodes: ReturnType<typeof useNodesState>[1]
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>
  flowId: string
  flowName: string
  flowActive: boolean
  selectNode: (id: string | null) => void
  closePanel: () => void
  setSaving: (v: boolean) => void
}

function FlowEditor_Inner({
  nodes, edges,
  onNodesChange, onEdgesChange,
  onConnect, onDragOver,
  setNodes, reactFlowWrapper,
  flowId, flowName, flowActive,
  selectNode, closePanel, setSaving,
}: InnerProps) {
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow()

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/reactflow/type')
      if (!type || !reactFlowWrapper.current) return

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })

      const newNode: Node = {
        id: generateNodeId(),
        type,
        position,
        data: { config: {}, label: undefined },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes, reactFlowWrapper]
  )

  const onPaneClick = useCallback(() => {
    closePanel()
  }, [closePanel])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  async function handleSave() {
    if (!flowId) return
    setSaving(true)
    try {
      const flow = serializeFlow(
        { id: flowId, name: flowName, active: flowActive },
        getNodes(),
        getEdges(),
      )
      await updateFlow(flow)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.layout}>
      <FlowHeader onSave={handleSave} />

      <div className={styles.workspace}>
        <NodeSidebar />

        <div
          ref={reactFlowWrapper}
          className={styles.canvas}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="var(--canvas-dot)"
            />
            <Controls
              showInteractive={false}
              className={styles.controls}
            />
            <MiniMap
              className={styles.minimap}
              nodeColor={miniMapNodeColor}
              maskColor="rgba(243,244,246,0.7)"
            />
          </ReactFlow>
        </div>

        <ConfigPanel />
      </div>
    </div>
  )
}

function miniMapNodeColor(node: Node): string {
  const type = node.type ?? ''
  if (type.startsWith('trigger'))   return '#16A34A'
  if (type.startsWith('condition')) return '#D97706'
  if (type.startsWith('delay'))     return '#7C3AED'
  if (type.startsWith('loop'))      return '#DB2777'
  if (type.startsWith('control'))   return '#475569'
  if (type.startsWith('action.send')) return '#2563EB'
  if (type.includes('contact') || type.includes('deal') || type.includes('score')) return '#0891B2'
  if (type.includes('http') || type.includes('script')) return '#EA580C'
  return '#94A3B8'
}
