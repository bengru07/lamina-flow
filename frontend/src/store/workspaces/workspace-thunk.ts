import { workspacesApi } from '@/api/client';
import type { Workspace } from '@/types/workspace';
import { createAsyncThunk, nanoid } from '@reduxjs/toolkit'

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
  tags: string[];
}

export interface UpdateWorkspacePayload {
  id: string;
  name?: string;
  description?: string;
  tags: string[];
}

export const thunkGetAllWorkspaces = createAsyncThunk(
  'workspace/getAll',
  async () => {
    const response = await workspacesApi.get<Workspace[]>('');
    return response.data;
  }
)

export const thunkCreateWorkspace = createAsyncThunk(
  'workspace/create',
  async (workspaceData: CreateWorkspacePayload, { rejectWithValue }) => {
    try {
      const response = await workspacesApi.post<Workspace>('', {
        id: nanoid(),
        ...workspaceData
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response.data)
    }
  }
)

export const thunkUpdateWorkspace = createAsyncThunk(
  'workspace/update',
  async (workspaceData: UpdateWorkspacePayload, { rejectWithValue }) => {
    try {
      const response = await workspacesApi.put<Workspace>(`/${workspaceData.id}`, workspaceData);
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response.data)
    }
  }
)

export const thunkDeleteWorkspace = createAsyncThunk(
  'workspace/delete',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await workspacesApi.delete<Workspace>(`/${workspaceId}`);
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response.data)
    }
  }
)