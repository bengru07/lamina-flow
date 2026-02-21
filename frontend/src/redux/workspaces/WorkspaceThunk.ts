import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

export const fetchWorkspaces = createAsyncThunk(
  "workspaces/fetchAll",
  async () => {
    const res = await api.get("/workspaces");
    return res.data;
  }
);

export const createWorkspace = createAsyncThunk(
  "workspaces/create",
  async (payload: { name: string; description?: string }) => {
    const res = await api.post("/workspaces", payload);
    return res.data;
  }
);

export const fetchWorkspace = createAsyncThunk(
  "workspaces/fetchOne",
  async (workspaceId: string) => {
    const res = await api.get(`/workspaces/${workspaceId}`);
    return res.data;
  }
);

export const updateWorkspace = createAsyncThunk(
  "workspaces/update",
  async ({
    workspaceId,
    data
  }: {
    workspaceId: string;
    data: { name?: string; description?: string };
  }) => {
    const res = await api.put(`/workspaces/${workspaceId}`, data);
    return res.data;
  }
);

export const deleteWorkspace = createAsyncThunk(
  "workspaces/delete",
  async (workspaceId: string) => {
    await api.delete(`/workspaces/${workspaceId}`);
    return workspaceId;
  }
);

export const fetchProjectTree = createAsyncThunk(
  "workspaces/fetchProjectTree",
  async (workspaceId: string) => {
    const res = await api.get(`/workspaces/${workspaceId}/project`);
    return { workspaceId, tree: res.data };
  }
);

export const saveWorkflow = createAsyncThunk(
  "workspaces/saveWorkflow",
  async ({
    workspaceId,
    path,
    data
  }: {
    workspaceId: string;
    path: string;
    data: any;
  }) => {
    console.log(data);
    await api.post(`/workspaces/${workspaceId}/workflow/${path}`, { data }); 
    return { workspaceId, path };
  }
);

export const loadWorkflow = createAsyncThunk(
  "workspaces/loadWorkflow",
  async ({
    workspaceId,
    path
  }: {
    workspaceId: string;
    path: string;
  }) => {
    const res = await api.get(`/workspaces/${workspaceId}/workflow/${path}`);
    return { workspaceId, path, data: res.data };
  }
);

export const deletePath = createAsyncThunk(
  "workspaces/deletePath",
  async ({
    workspaceId,
    path
  }: {
    workspaceId: string;
    path: string;
  }) => {
    await api.delete(`/workspaces/${workspaceId}/path`, {
      data: { path }
    });
    return { workspaceId, path };
  }
);

export const renamePath = createAsyncThunk(
  "workspaces/renamePath",
  async ({
    workspaceId,
    path,
    newName
  }: {
    workspaceId: string;
    path: string;
    newName: string;
  }) => {
    await api.post(`/workspaces/${workspaceId}/rename`, {
      path,
      new_name: newName
    });
    return { workspaceId };
  }
);

export const movePath = createAsyncThunk(
  "workspaces/movePath",
  async ({
    workspaceId,
    sourcePath,
    targetPath
  }: {
    workspaceId: string;
    sourcePath: string;
    targetPath: string;
  }) => {
    await api.post(`/workspaces/${workspaceId}/move`, {
      source_path: sourcePath,
      target_path: targetPath
    });
    return { workspaceId };
  }
);
