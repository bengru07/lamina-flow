import React, { useEffect, useMemo, useState } from "react"
import { ReactFlow, Background, BackgroundVariant } from "@xyflow/react"
import { GenericNode } from "@/components/builder/generic-node"
import { NodeSchema } from "@/components/templating/types"

interface NodePreviewProps {
  data_schema: NodeSchema;
  nodeType: string;
}

export function NodePreview({ data_schema, nodeType }: NodePreviewProps) {
  const nodeTypes = useMemo(() => ({
    [nodeType]: GenericNode,
    custom_node: GenericNode
  }), [nodeType]);

  const nodes = useMemo(() => [{
    id: "preview-node",
    type: nodeType || "custom_node",
    position: { x: 0, y: 0 },
    data: {
      schema: data_schema,
      values: data_schema.parameters?.reduce((acc: any, p) => ({ 
        ...acc, 
        [p.id]: p.value 
      }), {}) || {},
      connectedParams: {},
    },
  }], [data_schema, nodeType]);

  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    const sync = () =>
      setColorMode(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      )
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="h-full w-full bg-background">
      <ReactFlow
        colorMode={colorMode}
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        nodesDraggable={true}
        panOnDrag={true}
        className="bg-muted/30 dark:bg-black/70"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1} 
        />
      </ReactFlow>
    </div>
  )
}