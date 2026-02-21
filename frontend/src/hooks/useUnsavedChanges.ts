'use client';

import { useEffect } from 'react';
import { useAppSelector } from "@/api/appDispatcher";

export function useUnsavedChanges() {
  const openTabs = useAppSelector((state) => state.tabs.openTabs);
  const hasUnsavedChanges = openTabs.some((tab) => tab.isDirty);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.active?.uuid);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return { hasUnsavedChanges, activeWorkspaceId };
}