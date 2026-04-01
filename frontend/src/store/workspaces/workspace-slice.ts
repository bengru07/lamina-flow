import type { Workspace } from "@/types/workspace";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Status } from "../types";
import { thunkCreateWorkspace, thunkDeleteWorkspace, thunkGetAllWorkspaces, thunkUpdateWorkspace } from "./workspace-thunk";

interface InitialState {
    workspaces: Workspace[];
    currentWorkspace?: Workspace;

    status: Status;
    error: any;
}
export const WorkspaceSlice = createSlice({
    name: 'workspace',
    initialState: {
        workspaces: [],
        currentWorkspace: undefined,

        status: 'idle',
        error: null,
    } as InitialState,
    reducers: { 
        setCurrentWorkspace(state, action: PayloadAction<Workspace | undefined>) {
            state.currentWorkspace = action.payload
        },
        setCurrentWorkspaceById(state, action: PayloadAction<string | undefined>) {
            const workspace = state.workspaces.find(w => w.id === action.payload)
            state.currentWorkspace = workspace
        }
    },
    extraReducers: (builder) => {
        const handleRejected = (state: InitialState, action: PayloadAction<unknown>) => {
            state.status = 'failed'
            state.error = (action.payload as any)?.message || 'An unknown error occurred.'
        }

        builder
        .addCase(thunkCreateWorkspace.pending, (state) => {
            state.status = 'creating'
            state.error = null
        })
        .addCase(thunkCreateWorkspace.rejected, handleRejected)
        .addCase(thunkCreateWorkspace.fulfilled, (state, action: PayloadAction<Workspace>) => {
            state.status = 'succeeded'
            state.workspaces.push(action.payload)
        })

        .addCase(thunkUpdateWorkspace.pending, (state) => {
            state.status = 'updating'
            state.error = null
        })
        .addCase(thunkUpdateWorkspace.rejected, handleRejected)
        .addCase(thunkUpdateWorkspace.fulfilled, (state, action: PayloadAction<Workspace>) => {
            state.status = 'succeeded'
            const index = state.workspaces.findIndex((w) => w.id === action.payload.id);
            if (index !== -1) {
                state.workspaces[index] = action.payload;
            }
        })

        .addCase(thunkGetAllWorkspaces.pending, (state) => {
            state.status = 'loading'
            state.error = null
        })
        .addCase(thunkGetAllWorkspaces.rejected, handleRejected)
        .addCase(thunkGetAllWorkspaces.fulfilled, (state, action: PayloadAction<Workspace[]>) => {
            state.status = 'succeeded'
            state.workspaces = action.payload;
        })

        .addCase(thunkDeleteWorkspace.pending, (state) => {
            state.status = 'deleting'
            state.error = null
        })
        .addCase(thunkDeleteWorkspace.rejected, handleRejected)
        .addCase(thunkDeleteWorkspace.fulfilled, (state) => {
            state.status = 'succeeded'
        })
    }
});

export const { setCurrentWorkspace, setCurrentWorkspaceById } = WorkspaceSlice.actions;
export default WorkspaceSlice.reducer;