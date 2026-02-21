import { createSlice } from "@reduxjs/toolkit";
import * as thunks from "./WorkspaceThunk";

type RequestStatus = "idle" | "pending" | "fulfilled" | "rejected";

export interface Workspace {
  uuid: string;
  name: string;
  lastUpdated: string;
  thumbnailUrl: string;
  isDarkThumbnail: boolean;
  category: string;
}

export type WorkspaceRequestState = {
  fetchWorkspaces: RequestStatus;
  createWorkspace: RequestStatus;
  fetchWorkspace: RequestStatus;
  updateWorkspace: RequestStatus;
  deleteWorkspace: RequestStatus;
  fetchProjectTree: RequestStatus;
  saveWorkflow: RequestStatus;
  loadWorkflow: RequestStatus;
  deletePath: RequestStatus;
  renamePath: RequestStatus;
  movePath: RequestStatus;
};

export type WorkspaceErrors = {
  [K in keyof WorkspaceRequestState]?: string;
};

export type WorkspaceState = {
  list: Workspace[];
  active?: Workspace;
  activeFilePath?: string;
  currentWorkflowData?: any;
  projectTree: Record<string, any>;
  requests: WorkspaceRequestState;
  errors: WorkspaceErrors;
};

const initialState: WorkspaceState = {
  list: [],
  active: undefined,
  activeFilePath: undefined,
  currentWorkflowData: undefined,
  projectTree: {},
  requests: {
    fetchWorkspaces: "idle",
    createWorkspace: "idle",
    fetchWorkspace: "idle",
    updateWorkspace: "idle",
    deleteWorkspace: "idle",
    fetchProjectTree: "idle",
    saveWorkflow: "idle",
    loadWorkflow: "idle",
    deletePath: "idle",
    renamePath: "idle",
    movePath: "idle",
  },
  errors: {}
};

const workspaceSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {
    clearActiveWorkspace(state) {
      state.active = undefined;
      state.activeFilePath = undefined;
      state.currentWorkflowData = undefined;
    }
  },
  extraReducers: builder => {
    builder

      // fetchWorkspaces
      .addCase(thunks.fetchWorkspaces.pending, state => {
        state.requests.fetchWorkspaces = "pending";
        state.errors.fetchWorkspaces = undefined;
      })
      .addCase(thunks.fetchWorkspaces.fulfilled, (state, action) => {
        state.list = action.payload;
        state.requests.fetchWorkspaces = "fulfilled";
      })
      .addCase(thunks.fetchWorkspaces.rejected, (state, action) => {
        state.requests.fetchWorkspaces = "rejected";
        state.errors.fetchWorkspaces = action.error.message;
      })

      // createWorkspace
      .addCase(thunks.createWorkspace.pending, state => {
        state.requests.createWorkspace = "pending";
        state.errors.createWorkspace = undefined;
      })
      .addCase(thunks.createWorkspace.fulfilled, (state, action) => {
        state.list.push(action.payload);
        state.active = action.payload;
        state.requests.createWorkspace = "fulfilled";
      })
      .addCase(thunks.createWorkspace.rejected, (state, action) => {
        state.requests.createWorkspace = "rejected";
        state.errors.createWorkspace = action.error.message;
      })

      // fetchWorkspace
      .addCase(thunks.fetchWorkspace.pending, state => {
        state.requests.fetchWorkspace = "pending";
        state.errors.fetchWorkspace = undefined;
      })
      .addCase(thunks.fetchWorkspace.fulfilled, (state, action) => {
        state.active = action.payload;
        state.requests.fetchWorkspace = "fulfilled";
      })
      .addCase(thunks.fetchWorkspace.rejected, (state, action) => {
        state.requests.fetchWorkspace = "rejected";
        state.errors.fetchWorkspace = action.error.message;
      })

      // updateWorkspace
      .addCase(thunks.updateWorkspace.pending, state => {
        state.requests.updateWorkspace = "pending";
        state.errors.updateWorkspace = undefined;
      })
      .addCase(thunks.updateWorkspace.fulfilled, (state, action) => {
        state.active = action.payload;
        const idx = state.list.findIndex(w => w.uuid === action.payload.uuid);
        if (idx !== -1) state.list[idx] = action.payload;
        state.requests.updateWorkspace = "fulfilled";
      })
      .addCase(thunks.updateWorkspace.rejected, (state, action) => {
        state.requests.updateWorkspace = "rejected";
        state.errors.updateWorkspace = action.error.message;
      })

      // deleteWorkspace
      .addCase(thunks.deleteWorkspace.pending, state => {
        state.requests.deleteWorkspace = "pending";
        state.errors.deleteWorkspace = undefined;
      })
      .addCase(thunks.deleteWorkspace.fulfilled, (state, action) => {
        state.list = state.list.filter(w => w.uuid !== action.payload);
        if (state.active?.uuid === action.payload) {
          state.active = undefined;
        }
        state.requests.deleteWorkspace = "fulfilled";
      })
      .addCase(thunks.deleteWorkspace.rejected, (state, action) => {
        state.requests.deleteWorkspace = "rejected";
        state.errors.deleteWorkspace = action.error.message;
      })

      // fetchProjectTree
      .addCase(thunks.fetchProjectTree.pending, state => {
        state.requests.fetchProjectTree = "pending";
        state.errors.fetchProjectTree = undefined;
      })
      .addCase(thunks.fetchProjectTree.fulfilled, (state, action) => {
        state.projectTree[action.payload.workspaceId] = action.payload.tree;
        state.requests.fetchProjectTree = "fulfilled";
      })
      .addCase(thunks.fetchProjectTree.rejected, (state, action) => {
        state.requests.fetchProjectTree = "rejected";
        state.errors.fetchProjectTree = action.error.message;
      })

      .addCase(thunks.saveWorkflow.pending, state => { state.requests.saveWorkflow = "pending"; })
      .addCase(thunks.saveWorkflow.fulfilled, state => { state.requests.saveWorkflow = "fulfilled"; })
      .addCase(thunks.saveWorkflow.rejected, (state, action) => {
        state.requests.saveWorkflow = "rejected";
        state.errors.saveWorkflow = action.error.message;
      })

      // loadWorkflow
      .addCase(thunks.loadWorkflow.pending, (state, action) => { 
        state.requests.loadWorkflow = "pending"; 
        state.activeFilePath = action.meta.arg.path;
      })
      .addCase(thunks.loadWorkflow.fulfilled, (state, action) => { 
        state.requests.loadWorkflow = "fulfilled";
        state.currentWorkflowData = action.payload.data;
      })
      .addCase(thunks.loadWorkflow.rejected, (state, action) => {
        state.requests.loadWorkflow = "rejected";
        state.errors.loadWorkflow = action.error.message;
      })

      .addCase(thunks.deletePath.pending, state => { state.requests.deletePath = "pending"; })
      .addCase(thunks.deletePath.fulfilled, (state, action) => {
        state.requests.deletePath = "fulfilled";
      })
      .addCase(thunks.deletePath.rejected, (state, action) => {
        state.requests.deletePath = "rejected";
        state.errors.deletePath = action.error.message;
      })

      .addCase(thunks.renamePath.pending, state => { state.requests.renamePath = "pending"; })
      .addCase(thunks.renamePath.fulfilled, state => { state.requests.renamePath = "fulfilled"; })
      .addCase(thunks.renamePath.rejected, (state, action) => {
        state.requests.renamePath = "rejected";
        state.errors.renamePath = action.error.message;
      })

      .addCase(thunks.movePath.pending, state => { state.requests.movePath = "pending"; })
      .addCase(thunks.movePath.fulfilled, state => { state.requests.movePath = "fulfilled"; })
      .addCase(thunks.movePath.rejected, (state, action) => {
        state.requests.movePath = "rejected";
        state.errors.movePath = action.error.message;
      });
  }
});

export const { clearActiveWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;