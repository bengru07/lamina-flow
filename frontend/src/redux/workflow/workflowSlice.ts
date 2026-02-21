import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, addEdge } from '@xyflow/react';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  past: { nodes: Node[]; edges: Edge[] }[];
  future: { nodes: Node[]; edges: Edge[] }[];
  selectedNodeId?: string;
}

const initialState: WorkflowState = {
  nodes: [],
  edges: [],
  past: [],
  future: [],
  selectedNodeId: undefined,
};

const MAX_HISTORY = 50;

export const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setElements: (state, action: PayloadAction<{ nodes: Node[]; edges: Edge[] }>) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.past = [];
      state.future = [];
    },
    // Call this BEFORE any change happens
    recordPast: (state) => {
      state.past.push({ nodes: state.nodes, edges: state.edges });
      if (state.past.length > MAX_HISTORY) state.past.shift();
      state.future = []; 
    },
    onNodesChange: (state, action: PayloadAction<NodeChange[]>) => {
      state.nodes = applyNodeChanges(action.payload, state.nodes);
    },
    onEdgesChange: (state, action: PayloadAction<EdgeChange[]>) => {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },
    onConnect: (state, action: PayloadAction<Connection>) => {
      // Record state BEFORE adding the new edge
      state.past.push({ nodes: state.nodes, edges: state.edges });
      state.edges = addEdge(action.payload, state.edges);
      state.future = [];
    },
    undo: (state) => {
      if (state.past.length === 0) return;
      // Move current state to future
      state.future.push({ nodes: state.nodes, edges: state.edges });
      // Restore the last past state
      const previous = state.past.pop();
      if (previous) {
        state.nodes = previous.nodes;
        state.edges = previous.edges;
      }
    },
    redo: (state) => {
      if (state.future.length === 0) return;
      // Move current state back to past
      state.past.push({ nodes: state.nodes, edges: state.edges });
      // Restore the next future state
      const next = state.future.pop();
      if (next) {
        state.nodes = next.nodes;
        state.edges = next.edges;
      }
    },
    setSelectedNode: (state, action: PayloadAction<string | undefined>) => {
      state.selectedNodeId = action.payload;
    }
  }
});

export const { setElements, onNodesChange, onEdgesChange, onConnect, undo, redo, recordPast, setSelectedNode } = workflowSlice.actions;
export default workflowSlice.reducer;