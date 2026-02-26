import { redirect } from 'next/navigation'
import { ReactFlowProvider } from '@xyflow/react'
import { getFlow } from '@/app/actions/flows'
import { deserializeFlow } from '@/lib/flow/serialization'
import FlowEditor from '@/components/FlowEditor/FlowEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FlowEditorPage({ params }: Props) {
  const { id } = await params
  const flow = await getFlow(id)

  if (!flow) redirect('/')

  const { nodes, edges } = deserializeFlow(flow)

  return (
    <ReactFlowProvider>
      <FlowEditor
        initialNodes={nodes}
        initialEdges={edges}
        flowMeta={{ id: flow.id, name: flow.name, active: flow.active }}
      />
    </ReactFlowProvider>
  )
}
