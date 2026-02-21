import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

export const fetchLibraryTemplates = createAsyncThunk(
  "nodeTemplates/fetchLibrary",
  async () => {
    const res = await api.get("/node-templates");
    return res.data;
  }
);

export const saveTemplateToLibrary = createAsyncThunk(
  "nodeTemplates/saveToLibrary",
  async ({ name, payload }: { name: string; payload: any }) => {
    const res = await api.post(`/node-templates?name=${encodeURIComponent(name)}`, payload);
    return res.data;
  }
);

export const addTemplateToWorkspace = createAsyncThunk(
  "nodeTemplates/addToWorkspace",
  async ({ 
    workspaceId, 
    templateName 
  }: { 
    workspaceId: string; 
    templateName: string 
  }) => {
    const res = await api.post(`/node-templates/${workspaceId}/add?template_name=${encodeURIComponent(templateName)}`);
    return res.data;
  }
);

export const deleteLibraryTemplate = createAsyncThunk(
  "nodeTemplates/deleteFromLibrary",
  async (name: string) => {
    await api.delete(`/node-templates/${name}`);
    return name;
  }
);