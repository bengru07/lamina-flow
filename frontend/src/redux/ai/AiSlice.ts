import { createSlice } from "@reduxjs/toolkit";
import { sendChatRequest } from "./AiThunk";

interface AIState {
  lastResponse: string | null;
  status: "idle" | "pending" | "fulfilled" | "rejected";
  error: string | null;
}

const initialState: AIState = {
  lastResponse: null,
  status: "idle",
  error: null,
};

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    clearChat: (state) => {
      state.lastResponse = null;
      state.status = "idle";
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatRequest.pending, (state) => {
        state.status = "pending";
      })
      .addCase(sendChatRequest.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.lastResponse = action.payload.response;
      })
      .addCase(sendChatRequest.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message || "Failed to get AI response";
      });
  },
});

export const { clearChat } = aiSlice.actions;
export default aiSlice.reducer;