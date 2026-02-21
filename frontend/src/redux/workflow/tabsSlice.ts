import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Node, 
  Edge, 
  applyNodeChanges, 
  applyEdgeChanges, 
  NodeChange, 
  EdgeChange, 
  Connection, 
  addEdge 
} from '@xyflow/react';

export interface RemoteCursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

export interface Tab {
  path: string;
  name: string;
  isDirty: boolean;
  workspaceId: string;
}

interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
  past: { nodes: Node[]; edges: Edge[] }[];
  future: { nodes: Node[]; edges: Edge[] }[];
  cursors: Record<string, RemoteCursor>;
}

interface TabsState {
  openTabs: Tab[];
  activeTabPath?: string;
  workflows: Record<string, WorkflowData>;
}

const initialWorkflowState: WorkflowData = {
  nodes: [],
  edges: [],
  past: [],
  future: [],
  cursors: {},
};

const initialState: TabsState = {
  openTabs: [],
  activeTabPath: undefined,
  workflows: {},
};

const MAX_HISTORY = 50;

const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    openTab: (state, action: PayloadAction<{ path: string; name: string; workspaceId: string }>) => {
      const { path } = action.payload;
      const exists = state.openTabs.find(t => t.path === path);
      if (!exists) {
        state.openTabs.push({ ...action.payload, isDirty: false });
        state.workflows[path] = { ...initialWorkflowState, cursors: {} };
      }
      state.activeTabPath = path;
    },
    closeAllTabs: (state) => {
      state.openTabs = [];
      state.activeTabPath = undefined;
      state.workflows = {};
    },
    updateRemoteCursor: (state, action: PayloadAction<{ path: string; cursor: RemoteCursor }>) => {
      const { path, cursor } = action.payload;
      if (state.workflows[path]) {
        state.workflows[path].cursors[cursor.userId] = cursor;
      }
    },
    removeRemoteCursor: (state, action: PayloadAction<{ path: string; userId: string }>) => {
      const { path, userId } = action.payload;
      if (state.workflows[path]) {
        delete state.workflows[path].cursors[userId];
      }
    },
    setTabDirty: (state, action: PayloadAction<{ path: string; isDirty: boolean }>) => {
      const tab = state.openTabs.find(t => t.path === action.payload.path);
      if (tab) tab.isDirty = action.payload.isDirty;
    },
    closeTab: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      const index = state.openTabs.findIndex(t => t.path === path);
      if (index !== -1) {
        state.openTabs.splice(index, 1);
        delete state.workflows[path];
        if (state.activeTabPath === path) {
          state.activeTabPath = state.openTabs.length > 0 
            ? state.openTabs[state.openTabs.length - 1].path 
            : undefined;
        }
      }
    },
    reorderTabs: (state, action: PayloadAction<Tab[]>) => {
      state.openTabs = action.payload;
    },
    switchTabRelative: (state, action: PayloadAction<number>) => {
      if (state.openTabs.length <= 1) return;
      const currentIndex = state.openTabs.findIndex(t => t.path === state.activeTabPath);
      let nextIndex = (currentIndex + action.payload) % state.openTabs.length;
      if (nextIndex < 0) nextIndex = state.openTabs.length - 1;
      state.activeTabPath = state.openTabs[nextIndex].path;
    },
    setElements: (state, action: PayloadAction<{ path: string; nodes: Node[]; edges: Edge[] }>) => {
      const { path, nodes, edges } = action.payload;
      if (!state.workflows[path]) {
        state.workflows[path] = { ...initialWorkflowState, cursors: {} };
      }
      const workflow = state.workflows[path];
      workflow.nodes = nodes;
      workflow.edges = edges;
    },
    recordPast: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      const workflow = state.workflows[path];
      if (workflow) {
        workflow.past.push({ nodes: workflow.nodes, edges: workflow.edges });
        if (workflow.past.length > MAX_HISTORY) workflow.past.shift();
        workflow.future = [];
      }
    },
    onNodesChange: (state, action: PayloadAction<{ path: string; changes: NodeChange[] }>) => {
      const { path, changes } = action.payload;
      const workflow = state.workflows[path];
      if (workflow) {
        workflow.nodes = applyNodeChanges(changes, workflow.nodes);
      }
    },
    onEdgesChange: (state, action: PayloadAction<{ path: string; changes: EdgeChange[] }>) => {
      const { path, changes } = action.payload;
      const workflow = state.workflows[path];
      if (workflow) {
        workflow.edges = applyEdgeChanges(changes, workflow.edges);
      }
    },
    onConnect: (state, action: PayloadAction<{ path: string; connection: Connection }>) => {
      const { path, connection } = action.payload;
      const workflow = state.workflows[path];
      if (workflow) {
        workflow.past.push({ nodes: workflow.nodes, edges: workflow.edges });
        workflow.edges = addEdge(connection, workflow.edges);
        workflow.future = [];
      }
    },
    undo: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      const workflow = state.workflows[path];
      if (workflow && workflow.past.length > 0) {
        workflow.future.push({ nodes: workflow.nodes, edges: workflow.edges });
        const previous = workflow.past.pop();
        if (previous) {
          workflow.nodes = previous.nodes;
          workflow.edges = previous.edges;
          const tab = state.openTabs.find(t => t.path === path);
          if (tab) tab.isDirty = true;
        }
      }
    },
    redo: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      const workflow = state.workflows[path];
      if (workflow && workflow.future.length > 0) {
        workflow.past.push({ nodes: workflow.nodes, edges: workflow.edges });
        const next = workflow.future.pop();
        if (next) {
          workflow.nodes = next.nodes;
          workflow.edges = next.edges;
          const tab = state.openTabs.find(t => t.path === path);
          if (tab) tab.isDirty = true;
        }
      }
    },
    updateNodeData: (state, action: PayloadAction<{ path: string; nodeId: string; data: any }>) => {
      const { path, nodeId, data } = action.payload;
      const workflow = state.workflows[path];
      if (workflow) {
        workflow.past.push({ nodes: workflow.nodes, edges: workflow.edges });
        if (workflow.past.length > MAX_HISTORY) workflow.past.shift();
        workflow.future = [];
        workflow.nodes = workflow.nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        });
      }
    },
    addNodeAtPosition: (state, action: PayloadAction<{ path: string; node: Node }>) => {
      const { path, node } = action.payload;
      const workflow = state.workflows[path];
      if (workflow) {
        workflow.past.push({ nodes: workflow.nodes, edges: workflow.edges });
        workflow.nodes.push(node);
        workflow.future = [];
      }
    },
  },
});

export const { 
  openTab, 
  closeAllTabs,
  updateRemoteCursor,
  removeRemoteCursor,
  setTabDirty, 
  closeTab, 
  reorderTabs, 
  switchTabRelative,
  setElements,
  onNodesChange,
  onEdgesChange,
  onConnect,
  undo,
  redo,
  recordPast,
  updateNodeData,
  addNodeAtPosition
} = tabsSlice.actions;

export default tabsSlice.reducer;