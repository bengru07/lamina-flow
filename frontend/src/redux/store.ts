import { configureStore } from "@reduxjs/toolkit";
import workspaceReducer from "./workspaces/WorkspaceSlice";
import workflowReducer from "./workflow/workflowSlice";
import tabsReducer from "./workflow/tabsSlice";
import executionReducer from "./execution/ExecutionSlice";
import templateReducer from "./templates/TemplateSlice";
import settingsReducer from "./settings/SettingsSlice";
import aiReducer from "./ai/AiSlice";

export const store = configureStore({
  reducer: {
    workspaces: workspaceReducer,
    workflows: workflowReducer,
    tabs: tabsReducer,
    execution: executionReducer,
    templates: templateReducer,
    settings: settingsReducer,
    ai: aiReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;