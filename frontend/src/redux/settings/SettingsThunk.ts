import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

export const fetchSettings = createAsyncThunk(
  "settings/fetch",
  async () => {
    const res = await api.get("/settings");
    return res.data;
  }
);

export const fetchSettingsSchema = createAsyncThunk(
  "settings/fetchSchema",
  async () => {
    const res = await api.get("/settings/schema");
    return res.data;
  }
);

export const updateGlobalSettings = createAsyncThunk(
  "settings/update",
  async (settings: Record<string, any>) => {
    const res = await api.put("/settings", { settings });
    return res.data;
  }
);