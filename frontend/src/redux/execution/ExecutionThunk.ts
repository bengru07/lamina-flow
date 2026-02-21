import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/executor";

export const deployWorkflows = createAsyncThunk(
  "execution/deploy",
  async (payload: any) => {
    const res = await api.post("/execution/deploy", [
      {
        forest: payload?.forest ?? payload,
        metadata: payload?.metadata ?? { }
      }
    ]);
    return res.data;
  }
);

export const fetchDeployments = createAsyncThunk(
  "execution/fetchAll",
  async () => {
    const res = await api.get("/execution/deployments");
    return res.data;
  }
);

export const fetchDeploymentById = createAsyncThunk(
  "execution/fetchOne",
  async (deploymentId: string) => {
    const res = await api.get(`/execution/deployments/${deploymentId}`);
    return res.data;
  }
);

export const activateDeployment = createAsyncThunk(
  "execution/activate",
  async (deploymentId: string) => {
    const res = await api.post(`/execution/deployments/${deploymentId}/activate`);
    return { deploymentId, results: res.data.results };
  }
);

export const deactivateDeployment = createAsyncThunk(
  "execution/deactivate",
  async (deploymentId: string) => {
    const res = await api.post(`/execution/deployments/${deploymentId}/deactivate`);
    return { deploymentId, results: res.data.results };
  }
);

export const clearAllDeployments = createAsyncThunk(
  "execution/clearAll",
  async () => {
    await api.delete("/execution/deployments");
    return;
  }
);