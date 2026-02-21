'use client';

import React from "react";
import { Reorder, AnimatePresence } from "framer-motion";
import { X, FileJson } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher";
import { cn } from "@/lib/utils";
import { closeTab, reorderTabs, openTab } from "@/redux/workflow/tabsSlice";

export function WorkflowTabs() {
  const dispatch = useAppDispatch();
  const { openTabs, activeTabPath } = useAppSelector(s => s.tabs);

  const handleClose = (e: React.MouseEvent, tab: any) => {
    e.stopPropagation();
    if (tab.isDirty) {
      const confirmClose = window.confirm(`${tab.name} has unsaved changes. Close anyway?`);
      if (!confirmClose) return;
    }
    dispatch(closeTab(tab.path));
  };

  if (openTabs.length === 0) return null;

  return (
    <div className="flex w-full bg-background border-b border-border overflow-x-auto no-scrollbar">
      <Reorder.Group
        axis="x"
        values={openTabs}
        onReorder={(newOrder) => dispatch(reorderTabs(newOrder))}
        className="flex"
      >
        <AnimatePresence initial={false}>
          {openTabs.map((tab) => (
            <Reorder.Item
              key={tab.path}
              value={tab}
              onClick={() => dispatch(openTab({ path: tab.path, name: tab.name }))}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-1.5 border-r border-border cursor-pointer min-w-35 max-w-60 text-[13px] transition-colors select-none",
                activeTabPath === tab.path 
                  ? "bg-accent text-accent-foreground shadow-[inset_0_-2px_0_#3b82f6]" 
                  : "bg-muted/10 text-muted-foreground hover:bg-muted/40"
              )}
            >
              <FileJson size={14} className={tab.isDirty ? "text-orange-500" : "text-blue-500"} />
              <span className="truncate flex-1">{tab.name}</span>
              <div className="flex items-center justify-center w-4 h-4 ml-1">
                {tab.isDirty ? (
                  <div className="w-2 h-2 rounded-full bg-orange-500 group-hover:hidden" />
                ) : null}
                <button
                  onClick={(e) => handleClose(e, tab)}
                  className={cn(
                    "p-0.5 rounded-sm hover:bg-muted-foreground/20 transition-all",
                    tab.isDirty ? "hidden group-hover:flex" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <X size={14} />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}