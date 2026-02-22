"use client"

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect
} from "@xyflow/react"
import { Undo2, Redo2, Loader2 } from "lucide-react"
import "@xyflow/react/dist/style.css"

import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import {
  onNodesChange,
  onEdgesChange,
  onConnect,
  undo,
  redo,
  setElements,
  recordPast,
  setTabDirty,
  switchTabRelative,
  updateRemoteCursor,
  removeRemoteCursor,
} from "@/redux/workflow/tabsSlice"
import { saveWorkflow, loadWorkflow, fetchWorkspace } from "@/redux/workspaces/WorkspaceThunk"
import { Button } from "@/components/ui/button"
import { WorkflowTabs } from "./workflow-tabs"
import NoWorkspaceSelected from "./workflow-empty"
import { GenericNode } from "./generic-node"
import { NodeCommandMenu } from "./workflow-node-command"

import { serializeWorkflowForestFromEntries } from "@/lib/utils"
import { deployWorkflows } from "@/redux/execution/ExecutionThunk"
import { EditorCursor, RemoteCursors } from "./multiuser/cursors"
import { NoWorkflowSelected } from "./workflow-no-selected"

function WorkflowContent() {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const editorRef = useRef<HTMLDivElement>(null)

  const workspace = useAppSelector((state) => state.workspaces.active)
  const workspaceStatus = useAppSelector((state) => state.workspaces.requests.fetchWorkspace)
  const activeTabPath = useAppSelector((state) => state.tabs.activeTabPath)
  const workflowData = useAppSelector((state) =>
    activeTabPath ? state.tabs.workflows[activeTabPath] : null
  )
  const externalData = useAppSelector((state) => state.workspaces.currentWorkflowData)

  const nodeTypes = useMemo(() => {
    return new Proxy({}, {
      get: () => GenericNode
    })
  }, []) 
  
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const nodesRef = useRef<Node[]>([])

  useEffect(() => {
    if (!workflowData) return
    setNodes(workflowData.nodes || [])
    setEdges(workflowData.edges || [])
    nodesRef.current = workflowData.nodes || []
  }, [workflowData?.nodes, workflowData?.edges])

  const past = workflowData?.past || []
  const future = workflowData?.future || []
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

  const styledEdges = useMemo(() => {
    return edges.map(edge => {
      const targetNode = nodes.find(n => n.id === edge.target)
      const isActivation = edge.targetHandle === 'activation'
      
      const isParamConnected = (targetNode?.data as any)?.connectedParams?.[
        edge.targetHandle as string
      ] === true

      if (isActivation) {
        return {
          ...edge,
          type: 'step',
          label: 'TRIGGER',
          labelStyle: { 
            fill: '#64748b', 
            fontWeight: 700, 
            fontSize: '10px',
            fontFamily: 'monospace'
          },
          labelBgPadding: [4, 4],
          labelBgBorderRadius: 2,
          labelBgStyle: { 
            fill: 'var(--background)', 
            fillOpacity: 0.8 
          },
          style: { 
            stroke: "#94a3b8",
            strokeWidth: 2,
            opacity: 0.9,
          },
        }
      }

      return {
        ...edge,
        animated: isParamConnected,
        style: isParamConnected
          ? { strokeWidth: 2 }
          : { 
              strokeDasharray: "5,5", 
              stroke: "#94a3b8", 
              opacity: 0.3 
            }
      }
    })
  }, [edges, nodes])

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (!activeTabPath) return
      setNodes(nds => {
        const next = applyNodeChanges(changes, nds)
        nodesRef.current = next
        return next
      })
      if (
        changes.some(
          c => c.type === "add" || c.type === "remove" || c.type === "replace"
        )
      ) {
        dispatch(onNodesChange({ path: activeTabPath, changes }))
        dispatch(setTabDirty({ path: activeTabPath, isDirty: true }))
      }
    },
    [dispatch, activeTabPath]
  )

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (!activeTabPath) return
      setEdges(eds => applyEdgeChanges(changes, eds))
      dispatch(onEdgesChange({ path: activeTabPath, changes }))
      dispatch(setTabDirty({ path: activeTabPath, isDirty: true }))
    },
    [dispatch, activeTabPath]
  )

  const handleConnect: OnConnect = useCallback(
    (connection) => {
      if (!activeTabPath) return
      dispatch(onConnect({ path: activeTabPath, connection }))
      dispatch(setTabDirty({ path: activeTabPath, isDirty: true }))
    },
    [dispatch, activeTabPath]
  )

  const handleNodeDragStop = useCallback(() => {
    if (!activeTabPath) return
    dispatch(
      setElements({ path: activeTabPath, nodes: nodesRef.current, edges })
    )
    dispatch(setTabDirty({ path: activeTabPath, isDirty: true }))
  }, [dispatch, activeTabPath, edges])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!activeTabPath) return
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === "e") {
        e.preventDefault()
        const deployment = serializeWorkflowForestFromEntries(nodes, edges)
        dispatch(deployWorkflows(deployment))
      }
      if (e.key === "z") {
        e.preventDefault()
        dispatch(undo(activeTabPath))
      }
      if (e.key === "y") {
        e.preventDefault()
        dispatch(redo(activeTabPath))
      }
      if (e.key === "s" && workspace) {
        e.preventDefault()
        dispatch(
          saveWorkflow({
            workspaceId: workspace.uuid,
            path: activeTabPath,
            data: { nodes: nodesRef.current, edges }
          })
        ).then(() =>
          dispatch(setTabDirty({ path: activeTabPath, isDirty: false }))
        )
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        dispatch(switchTabRelative(1))
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        dispatch(switchTabRelative(-1))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dispatch, activeTabPath, workspace, edges])

  useEffect(() => {
    if (activeTabPath && workspace) {
      dispatch(loadWorkflow({ workspaceId: workspace.uuid, path: activeTabPath }))
    }
  }, [dispatch, activeTabPath, workspace])

  useEffect(() => {
    if (externalData && activeTabPath) {
      dispatch(
        setElements({
          path: activeTabPath,
          nodes: externalData.nodes || [],
          edges: externalData.edges || []
        })
      )
    }
  }, [externalData, dispatch, activeTabPath])

  if (workspaceStatus === "pending") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background mt-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!activeTabPath) return <NoWorkflowSelected />

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <WorkflowTabs />
      <div
        ref={editorRef}
        className="flex-1 relative overflow-hidden"
      >
        <ReactFlow
          colorMode={colorMode}
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeDragStart={() => activeTabPath && dispatch(recordPast(activeTabPath))}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          className="bg-muted/30 dark:bg-black/70 cursor-pointer"
        >
          {/* <EditorCursor containerRef={editorRef} /> */}
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls className="dark:bg-slate-900" />
          <MiniMap className="dark:bg-slate-900" />
          <Panel position="top-right" className="flex gap-2 bg-background/90 p-1.5 rounded-lg border shadow-sm backdrop-blur cursor-auto">
            <Button variant="ghost" size="icon" onClick={() => dispatch(undo(activeTabPath))} disabled={!past.length}>
              <Undo2 size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => dispatch(redo(activeTabPath))} disabled={!future.length}>
              <Redo2 size={16} />
            </Button>
          </Panel>
          <NodeCommandMenu />
        </ReactFlow>
      </div>
    </div>
  )
}

export default function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <WorkflowContent />
    </ReactFlowProvider>
  )
}