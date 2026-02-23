import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as thunks from "./SettingsThunk";

type RequestStatus = "idle" | "pending" | "fulfilled" | "rejected";

interface SettingsState {
  values: Record<string, any>;
  schema: any[];
  status: {
    fetch: RequestStatus;
    update: RequestStatus;
    schema: RequestStatus;
  };
  error: string | null;
}

const initialState: SettingsState = {
  values: {},
  schema: [],
  status: {
    fetch: "idle",
    update: "idle",
    schema: "idle",
  },
  error: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setLocalSetting(state, action: PayloadAction<{ id: string; value: any }>) {
      state.values[action.payload.id] = action.payload.value;
    },
    clearSettingsError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(thunks.fetchSettings.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(thunks.fetchSettings.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        state.values = action.payload;
      })
      .addCase(thunks.fetchSettings.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.error.message || "Failed to fetch settings";
      })

      .addCase(thunks.fetchSettingsSchema.fulfilled, (state, action) => {
        state.schema = action.payload;
        state.status.schema = "fulfilled";
      })

      .addCase(thunks.updateGlobalSettings.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(thunks.updateGlobalSettings.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        state.values = action.payload;
      })
      .addCase(thunks.updateGlobalSettings.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.error.message || "Failed to update settings";
      });
  },
});

export const { setLocalSetting, clearSettingsError } = settingsSlice.actions;
export default settingsSlice.reducer;