import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Node, Edge } from "@xyflow/react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
import { Node, Edge } from "@xyflow/react";

export type Connection = {
  targetNode: WorkflowTreeNode;
  targetHandle: string;
};

export type WorkflowTreeNode = {
  id: string;
  type: string;
  data: any;
  connections: Record<string, Connection[]>;
};

export function serializeWorkflowForestFromEntries(
  nodes: Node[],
  edges: Edge[]
): WorkflowTreeNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const incomingNodeIds = new Set<string>(edges.map((e) => e.target));
  const edgeRegistry = new Map<string, Map<string, { targetId: string; targetHandle: string }[]>>();

  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) continue;

    if (!edgeRegistry.has(edge.source)) {
      edgeRegistry.set(edge.source, new Map());
    }

    const sourceHandle = edge.sourceHandle || "default";
    const targetHandle = edge.targetHandle || "activation";
    const handleMap = edgeRegistry.get(edge.source)!;

    if (!handleMap.has(sourceHandle)) {
      handleMap.set(sourceHandle, []);
    }
    
    handleMap.get(sourceHandle)!.push({
      targetId: edge.target,
      targetHandle: targetHandle
    });
  }

  function buildTree(nodeId: string, visited: Set<string> = new Set()): WorkflowTreeNode | null {
    if (visited.has(nodeId)) return null;
    
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const currentVisited = new Set(visited);
    currentVisited.add(nodeId);

    const connections: Record<string, Connection[]> = {};
    const handleMap = edgeRegistry.get(nodeId);

    if (handleMap) {
      handleMap.forEach((targets, sourceHandleId) => {
        connections[sourceHandleId] = targets
          .map((t) => {
            const childNode = buildTree(t.targetId, currentVisited);
            return childNode ? { 
              targetNode: childNode, 
              targetHandle: t.targetHandle 
            } : null;
          })
          .filter((c): c is Connection => c !== null);
      });
    }

    return {
      id: node.id,
      type: node.type ?? 'generic',
      data: node.data,
      connections,
    };
  }

  return nodes
    .filter((node) => !incomingNodeIds.has(node.id))
    .map((root) => buildTree(root.id))
    .filter((n): n is WorkflowTreeNode => n !== null);
}