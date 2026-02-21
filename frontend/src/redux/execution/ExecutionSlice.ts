import { createSlice } from "@reduxjs/toolkit";
import * as thunks from "./ExecutionThunk";

type RequestStatus = "idle" | "pending" | "fulfilled" | "rejected";

export type Deployment = {
  forest: any[],
  metadata: any
}

type ExecutionState = {
  deployments: Deployment[];
  lastExecutionResults: Record<string, any>;
  requests: {
    deploy: RequestStatus;
    fetchDeployments: RequestStatus;
    activate: RequestStatus;
    clear: RequestStatus;
  };
  errors: Record<string, string | undefined>;
};

const initialState: ExecutionState = {
  deployments: [],
  lastExecutionResults: {},
  requests: {
    deploy: "idle",
    fetchDeployments: "idle",
    activate: "idle",
    clear: "idle",
  },
  errors: {},
};

const executionSlice = createSlice({
  name: "execution",
  initialState,
  reducers: {
    clearExecutionLogs(state) {
      state.lastExecutionResults = {};
    }
  },
  extraReducers: (builder) => {
    builder
      // Deploy
      .addCase(thunks.deployWorkflows.pending, (state) => {
        state.requests.deploy = "pending";
        state.errors.deploy = undefined;
      })
      .addCase(thunks.deployWorkflows.fulfilled, (state) => {
        state.requests.deploy = "fulfilled";
      })
      .addCase(thunks.deployWorkflows.rejected, (state, action) => {
        state.requests.deploy = "rejected";
        state.errors.deploy = action.error.message;
      })

      // Fetch All
      .addCase(thunks.fetchDeployments.pending, (state) => {
        state.requests.fetchDeployments = "pending";
      })
      .addCase(thunks.fetchDeployments.fulfilled, (state, action) => {
        state.deployments = action.payload;
        state.requests.fetchDeployments = "fulfilled";
      })
      .addCase(thunks.fetchDeployments.rejected, (state) => {
        state.requests.fetchDeployments = "rejected";
      })

      // Activate (Execute)
      .addCase(thunks.activateDeployment.pending, (state) => {
        state.requests.activate = "pending";
        state.errors.activate = undefined;
      })
      .addCase(thunks.activateDeployment.fulfilled, (state, action) => {
        state.requests.activate = "fulfilled";
        if (action.payload?.deploymentId) {
          state.lastExecutionResults[action.payload.deploymentId] = action.payload.results;
        }
      })
      .addCase(thunks.activateDeployment.rejected, (state, action) => {
        state.requests.activate = "rejected";
        state.errors.activate = action.error.message;
      })

      // Deactivate (Stop)
      .addCase(thunks.deactivateDeployment.pending, (state) => {
        state.requests.activate = "pending";
      })
      .addCase(thunks.deactivateDeployment.fulfilled, (state) => {
        state.requests.activate = "fulfilled";
      })
      .addCase(thunks.deactivateDeployment.rejected, (state, action) => {
        state.requests.activate = "rejected";
        state.errors.activate = action.error.message;
      })

      // Clear Memory
      .addCase(thunks.clearAllDeployments.fulfilled, (state) => {
        state.deployments = [];
        state.lastExecutionResults = {};
        state.requests.clear = "fulfilled";
      });
  },
});

export const { clearExecutionLogs } = executionSlice.actions;
export default executionSlice.reducer;