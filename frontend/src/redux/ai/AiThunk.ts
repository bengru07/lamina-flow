import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

interface ChatPayload {
  prompt: string;
  provider_id: string;
  workspace_ids: string[];
}

export const sendChatRequest = createAsyncThunk(
  "ai/sendChat",
  async (payload: ChatPayload) => {
    const res = await api.post("/ai/chat", payload);
    return res.data;
  }
);