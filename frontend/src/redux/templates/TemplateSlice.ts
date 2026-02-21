import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as thunks from "./TemplateThunk";

type RequestStatus = "idle" | "pending" | "fulfilled" | "rejected";

export interface NodeTemplate {
  label: string;
  category: string;
  type: string;
  icon?: string;
  description?: string;
  schema?: any;
  parameters?: any[];
  outputs?: any[];
}

interface NodeTemplateState {
  library: NodeTemplate[];
  requests: {
    fetchLibrary: RequestStatus;
    saveToLibrary: RequestStatus;
    addToWorkspace: RequestStatus;
    deleteLibraryTemplate: RequestStatus;
  };
  errors: {
    fetchLibrary?: string;
    saveToLibrary?: string;
    addToWorkspace?: string;
    deleteLibraryTemplate?: string;
  };
}

const initialState: NodeTemplateState = {
  library: [],
  requests: {
    fetchLibrary: "idle",
    saveToLibrary: "idle",
    addToWorkspace: "idle",
    deleteLibraryTemplate: "idle",
  },
  errors: {},
};

const nodeTemplateSlice = createSlice({
  name: "nodeTemplates",
  initialState,
  reducers: {
    clearTemplateErrors(state) {
      state.errors = {};
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Library
      .addCase(thunks.fetchLibraryTemplates.pending, (state) => {
        state.requests.fetchLibrary = "pending";
        state.errors.fetchLibrary = undefined;
      })
      .addCase(thunks.fetchLibraryTemplates.fulfilled, (state, action: PayloadAction<NodeTemplate[]>) => {
        state.library = action.payload;
        state.requests.fetchLibrary = "fulfilled";
      })
      .addCase(thunks.fetchLibraryTemplates.rejected, (state, action) => {
        state.requests.fetchLibrary = "rejected";
        state.errors.fetchLibrary = action.error.message;
      })

      // Save to Library
      .addCase(thunks.saveTemplateToLibrary.pending, (state) => {
        state.requests.saveToLibrary = "pending";
      })
      .addCase(thunks.saveTemplateToLibrary.fulfilled, (state) => {
        state.requests.saveToLibrary = "fulfilled";
      })
      .addCase(thunks.saveTemplateToLibrary.rejected, (state, action) => {
        state.requests.saveToLibrary = "rejected";
        state.errors.saveToLibrary = action.error.message;
      })

      // Add to Workspace
      .addCase(thunks.addTemplateToWorkspace.pending, (state) => {
        state.requests.addToWorkspace = "pending";
      })
      .addCase(thunks.addTemplateToWorkspace.fulfilled, (state) => {
        state.requests.addToWorkspace = "fulfilled";
      })
      .addCase(thunks.addTemplateToWorkspace.rejected, (state, action) => {
        state.requests.addToWorkspace = "rejected";
        state.errors.addToWorkspace = action.error.message;
      })

      // Delete from Library
      .addCase(thunks.deleteLibraryTemplate.fulfilled, (state, action: PayloadAction<string>) => {
        state.library = state.library.filter(t => t.label !== action.payload);
        state.requests.deleteLibraryTemplate = "fulfilled";
      });
  },
});

export const { clearTemplateErrors } = nodeTemplateSlice.actions;
export default nodeTemplateSlice.reducer;