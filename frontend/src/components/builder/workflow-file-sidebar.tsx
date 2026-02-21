'use client';

import React, { useEffect, useState, useMemo, useRef } from "react";
import { 
  Folder, FileJson, ChevronDown, ChevronRight, 
  Trash2, Edit3, FilePlus, FolderPlus 
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher";
import { 
  fetchProjectTree, loadWorkflow, deletePath, 
  renamePath, saveWorkflow, movePath 
} from "@/redux/workspaces/WorkspaceThunk";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { openTab } from "@/redux/workflow/tabsSlice";

function buildTree(data: any[]) {
  const tree: any = { name: "root", type: "folder", children: [] };
  const map: Record<string, any> = { "": tree };
  const sortedData = [...data].sort((a, b) => a.path.length - b.path.length);

  sortedData.forEach((item) => {
    const parentPath = item.path.split("/").slice(0, -1).join("/");
    const name = item.path.split("/").pop() || "root";
    if (!map[item.path]) {
      map[item.path] = { name, type: "folder", children: [], path: item.path };
      if (map[parentPath]) map[parentPath].children.push(map[item.path]);
    }
    item.files.forEach((file: string) => {
      if (file === ".keep") return;
      const filePath = item.path ? `${item.path}/${file}` : file;
      map[item.path].children.push({ name: file, type: "file", path: filePath });
    });
  });
  return tree.children;
}

export function WorkflowFileSidebar() {
  const dispatch = useAppDispatch();
  const workspace = useAppSelector(s => s.workspaces.active);
  const rawTree = useAppSelector(s => s.workspaces.projectTree[workspace?.uuid ?? ""]);
  const activeTabPath = useAppSelector(s => s.tabs.activeTabPath); // Sync with tabs
  
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [rootCreating, setRootCreating] = useState<{ type: 'file' | 'folder' } | null>(null);
  const [isRootOver, setIsRootOver] = useState(false);

  useEffect(() => {
    if (workspace) dispatch(fetchProjectTree(workspace.uuid));
  }, [dispatch, workspace]);

  const nestedTree = useMemo(() => {
    if (!rawTree || !Array.isArray(rawTree)) return [];
    return buildTree(rawTree);
  }, [rawTree]);

  const flatNodes = useMemo(() => {
    const nodes: any[] = [];
    const flatten = (items: any[]) => {
      items.forEach(item => {
        nodes.push(item);
        if (item.children && item.children.length > 0) flatten(item.children);
      });
    };
    flatten(nestedTree);
    return nodes;
  }, [nestedTree]);

  const handleSelection = (path: string, isMeta: boolean, isShift: boolean) => {
    if (isShift && selectedPaths.length > 0) {
      const lastSelected = selectedPaths[selectedPaths.length - 1];
      const start = flatNodes.findIndex(n => n.path === lastSelected);
      const end = flatNodes.findIndex(n => n.path === path);
      const range = flatNodes.slice(Math.min(start, end), Math.max(start, end) + 1).map(n => n.path);
      setSelectedPaths(Array.from(new Set([...selectedPaths, ...range])));
    } else if (isMeta) {
      setSelectedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
    } else {
      setSelectedPaths([path]);
    }
  };

  const onRootDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootOver(false);
    const sourcePaths = JSON.parse(e.dataTransfer.getData("selectedPaths") || "[]");
    if (!workspace || sourcePaths.length === 0) return;

    await Promise.all(sourcePaths.map((sourcePath: string) => {
      if (!sourcePath.includes('/')) return Promise.resolve();
      const fileName = sourcePath.split('/').pop()!;
      return dispatch(movePath({ workspaceId: workspace.uuid, sourcePath, targetPath: fileName }));
    }));
    dispatch(fetchProjectTree(workspace.uuid));
  };

  const deleteSelected = async () => {
    if (!workspace || selectedPaths.length === 0) return;
    if (confirm(`Delete ${selectedPaths.length} items?`)) {
      await Promise.all(selectedPaths.map(path => dispatch(deletePath({ workspaceId: workspace.uuid, path }))));
      dispatch(fetchProjectTree(workspace.uuid));
      setSelectedPaths([]);
    }
  };

  if (!workspace) return <aside className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-background">No workspace selected</aside>;

  return (
    <aside className={`bg-background flex flex-col h-full min-w-48 select-none transition-colors duration-200 ${isRootOver ? 'bg-blue-500/5 dark:bg-blue-900' : ''}`}>
      <ContextMenu>
        <ContextMenuTrigger 
          className="flex-1 overflow-y-auto p-2"
          onClick={() => setSelectedPaths([])}
          onDragOver={(e) => { e.preventDefault(); setIsRootOver(true); }}
          onDragLeave={() => setIsRootOver(false)}
          onDrop={onRootDrop}
        >
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground/70">Explorer</span>
          </div>
          <div className="space-y-0.5">
            {nestedTree.map((node: any) => (
              <FileNode 
                key={node.path} 
                node={node} 
                workspaceId={workspace.uuid} 
                activePath={activeTabPath} 
                selectedPaths={selectedPaths}
                onSelect={handleSelection}
                setSelectedPaths={setSelectedPaths}
              />
            ))}
          </div>
          {rootCreating && (
            <div className="mt-1">
               <CreationInput 
                  type={rootCreating.type}
                  onCancel={() => setRootCreating(null)}
                  onConfirm={(name) => {
                    if (!name) { setRootCreating(null); return; }
                    let path = name;
                    if (rootCreating.type === 'file' && !path.endsWith('.json')) path += '.json';
                    const finalPath = rootCreating.type === 'folder' ? `${path}/.keep` : path;
                    dispatch(saveWorkflow({ workspaceId: workspace.uuid, path: finalPath, data: { nodes: [], edges: [] } }))
                      .then(() => dispatch(fetchProjectTree(workspace.uuid)));
                    setRootCreating(null);
                  }}
               />
            </div>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent>
          {selectedPaths.length > 1 ? (
            <ContextMenuItem className="text-red-500" onClick={deleteSelected}>
              <Trash2 size={14} className="mr-2" /> Delete {selectedPaths.length} items
            </ContextMenuItem>
          ) : (
            <>
              <ContextMenuItem onClick={() => setRootCreating({ type: 'file' })}>
                <FilePlus size={14} className="mr-2" /> New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setRootCreating({ type: 'folder' })}>
                <FolderPlus size={14} className="mr-2" /> New Folder
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </aside>
  );
}

function CreationInput({ type, onConfirm, onCancel }: { type: 'file' | 'folder', onConfirm: (name: string) => void, onCancel: () => void }) {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <div className="flex items-center gap-2 py-1 px-2 text-sm">
      {type === 'folder' ? <Folder size={14} className="text-blue-500/60" /> : <FileJson size={14} className="text-slate-500/60" />}
      <Input
        ref={ref}
        className="h-7 text-xs px-1.5 focus-visible:ring-1 bg-background border-none outline-none"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onConfirm(val)}
        onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(val); if (e.key === 'Escape') onCancel(); }}
      />
    </div>
  );
}

function FileNode({ node, workspaceId, activePath, selectedPaths, onSelect, setSelectedPaths }: any) {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [creating, setCreating] = useState<{ type: 'file' | 'folder' } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isRenaming) inputRef.current?.focus(); }, [isRenaming]);

  const isSelected = selectedPaths.includes(node.path);

  const onDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    let pathsToMove = isSelected ? selectedPaths : [node.path];
    if (!isSelected) {
      setSelectedPaths([node.path]);
      pathsToMove = [node.path];
    }
    e.dataTransfer.setData("selectedPaths", JSON.stringify(pathsToMove));
  };

  const onDrop = async (e: React.DragEvent) => {
    if (node.type !== "folder") return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const sourcePaths = JSON.parse(e.dataTransfer.getData("selectedPaths") || "[]");
    if (sourcePaths.length === 0 || sourcePaths.includes(node.path)) return;

    await Promise.all(sourcePaths.map((sourcePath: string) => {
      const fileName = sourcePath.split('/').pop()!;
      const targetPath = `${node.path}/${fileName}`;
      if (targetPath.startsWith(sourcePath + '/')) return Promise.resolve();
      return dispatch(movePath({ workspaceId, sourcePath, targetPath }));
    }));

    dispatch(fetchProjectTree(workspaceId));
  };

  const isActive = activePath === node.path;

  return (
    <div 
      draggable 
      onDragStart={onDragStart}
      onDragOver={(e) => { if (node.type === "folder") { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); } }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      className={`rounded-md transition-all duration-200 ${isDragOver ? 'bg-blue-500/5 ring-1 ring-inset ring-blue-500/30' : ''}`}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className={`flex items-center justify-between py-1 px-1 cursor-pointer text-sm 
              ${isSelected ? 'bg-blue-500/15 text-blue-600 dark:text-blue-500 font-semibold' : 'hover:bg-accent/60 text-slate-700 dark:text-slate-300'}
              ${isActive && !isSelected ? 'ring-1 ring-blue-500/30' : ''}
            `}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node.path, e.metaKey || e.ctrlKey, e.shiftKey);
              if (node.type === "file") {
                dispatch(openTab({ path: node.path, name: node.name }));
                dispatch(loadWorkflow({ workspaceId, path: node.path }));
              } else if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                setIsOpen(!isOpen);
              }
            }}
          >
            <div className="flex items-center gap-1.5 truncate flex-1">
              <div className="w-4 flex justify-center">
                {node.type === "folder" ? (
                  isOpen ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />
                ) : <div className="w-3" />}
              </div>
              {node.type === "folder" ? (
                <Folder size={14} className={`text-blue-500 dark:text-blue-400 ${isDragOver ? 'fill-blue-500/40' : 'fill-blue-500/10'}`} />
              ) : (
                <FileJson size={14} className={isActive ? "text-blue-500" : "text-slate-400 dark:text-slate-500"} />
              )}
              {isRenaming ? (
                <Input ref={inputRef} className="h-6 text-xs px-1 focus-visible:ring-1 bg-background" value={newName}
                  onChange={(e) => setNewName(e.target.value)} onBlur={() => { if(newName !== node.name) dispatch(renamePath({ workspaceId, path: node.path, newName })).then(() => dispatch(fetchProjectTree(workspaceId))); setIsRenaming(false); }}
                  onKeyDown={(e) => e.key==='Enter' && inputRef.current?.blur()} />
              ) : <span className="truncate text-[13px]">{node.name}</span>}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {selectedPaths.length > 1 ? (
            <ContextMenuItem className="text-red-500" onClick={() => {
              if(confirm(`Delete ${selectedPaths.length} items?`)) {
                Promise.all(selectedPaths.map((p: any) => dispatch(deletePath({ workspaceId, path: p })))).then(() => {
                  dispatch(fetchProjectTree(workspaceId));
                  setSelectedPaths([]);
                });
              }
            }}><Trash2 size={14} className="mr-2" /> Delete Selected</ContextMenuItem>
          ) : (
            <>
              {node.type === "folder" && (
                <>
                  <ContextMenuItem onClick={() => { setCreating({ type: 'file' }); setIsOpen(true); }}><FilePlus size={14} className="mr-2" /> New File</ContextMenuItem>
                  <ContextMenuItem onClick={() => { setCreating({ type: 'folder' }); setIsOpen(true); }}><FolderPlus size={14} className="mr-2" /> New Folder</ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}
              <ContextMenuItem onClick={() => setIsRenaming(true)}><Edit3 size={14} className="mr-2" /> Rename</ContextMenuItem>
              <ContextMenuItem className="text-red-500" onClick={() => { if(confirm(`Delete ${node.name}?`)) dispatch(deletePath({ workspaceId, path: node.path })).then(() => dispatch(fetchProjectTree(workspaceId))); }}><Trash2 size={14} className="mr-2" /> Delete</ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      
      {node.type === "folder" && isOpen && (
        <div className={`ml-[10.5555px] border-l ${isDragOver ? 'border-blue-400/50' : 'border-slate-200 dark:border-slate-800/60'} mt-0.5`}>
          <div className="space-y-0.5">
            {node.children.map((child: any) => (
              <FileNode key={child.path} node={child} workspaceId={workspaceId} activePath={activePath} selectedPaths={selectedPaths} onSelect={onSelect} setSelectedPaths={setSelectedPaths} />
            ))}
          </div>
          {creating && (
            <CreationInput type={creating.type} onCancel={() => setCreating(null)}
              onConfirm={(name) => {
                if (name) {
                  let path = `${node.path}/${name}`;
                  if (creating.type === 'file' && !path.endsWith('.json')) path += '.json';
                  const finalPath = creating.type === 'folder' ? `${path}/.keep` : path;
                  dispatch(saveWorkflow({ workspaceId, path: finalPath, data: { nodes: [], edges: [] } })).then(() => dispatch(fetchProjectTree(workspaceId)));
                }
                setCreating(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}