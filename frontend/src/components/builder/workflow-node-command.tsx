'use client';

import React, { useEffect, useState } from 'react';
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher";
import { useReactFlow } from "@xyflow/react";
import { addNodeAtPosition, recordPast, setTabDirty } from '@/redux/workflow/tabsSlice';

export function NodeCommandMenu() {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const activeTabPath = useAppSelector((state) => state.tabs.activeTabPath);
  const node_templates = useAppSelector((state) => state.workspaces.active?.builder.node_templates) ?? [];
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const createNode = (nodeDef: typeof node_templates[0]) => {
    if (!activeTabPath) return;

    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode = {
      id: `${nodeDef.type}_${Date.now()}`,
      type: nodeDef.type,
      position,
      data: { schema: nodeDef.schema, values: {}, connectedParams: {} }
    };

    dispatch(recordPast(activeTabPath));
    dispatch(setTabDirty({
      path: activeTabPath,
      isDirty: true
    }));
    dispatch(addNodeAtPosition({ path: activeTabPath, node: newNode }));
    setOpen(false);
  };

  if (!activeTabPath) return null;

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search nodes..." />
        <CommandList>
          <CommandEmpty>No nodes found.</CommandEmpty>
          <CommandGroup heading="Available Nodes">
            {node_templates.map((node) => (
              <CommandItem 
                key={node.label} 
                onSelect={() => createNode(node)}
                className="cursor-pointer"
              >
                <span>{node.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}