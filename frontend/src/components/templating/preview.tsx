import React, { useMemo } from "react"
import { ReactFlow, Background, BackgroundVariant } from "@xyflow/react"
import { GenericNode } from "@/components/builder/generic-node"
import { NodeSchema } from "@/components/templating/types"

interface NodePreviewProps {
  schema: NodeSchema;
}

export function NodePreview({ schema }: NodePreviewProps) {
  const nodeTypes = useMemo(() => ({
    [schema.type]: GenericNode,
    custom_node: GenericNode
  }), [schema.type]);

  const nodes = useMemo(() => [{
    id: "preview-node",
    type: schema.type,
    position: { x: 0, y: 0 },
    data: {
      schema: { ...schema },
      values: schema.parameters.reduce((acc: any, p) => ({ ...acc, [p.id]: p.value }), {}),
      connectedParams: {},
    },
  }], [schema]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={[]}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.8 }}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#cbd5e1" />
    </ReactFlow>
  )
}