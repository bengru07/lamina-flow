'use client';

import React, { useState, useEffect, memo } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { ChevronDown, ChevronUp, Info, GripHorizontal, Link, Link2Off } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TooltipPortal } from '@radix-ui/react-tooltip';

const NodeHeader = ({ 
  schema, 
  type, 
  isCollapsed, 
  onToggleCollapse 
}: { 
  schema: any, 
  type: string, 
  isCollapsed: boolean, 
  onToggleCollapse: () => void 
}) => (
  <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-t-lg border-b border-border relative">
    <Handle
      type="target"
      position={Position.Top}
      id="activation"
      className="w-8! h-1.5! bg-gray-500! border-none! rounded-none! z-50! -top-px! transition-all hover:bg-emerald-400!"
    />
    <div className="flex items-center gap-2">
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="p-0.5 hover:bg-muted rounded transition-colors">
            <Info size={12} className="text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent 
            side="top" 
            className="z-100 max-w-xs px-3 py-1.5 text-[11px] bg-popover text-popover-foreground border border-border shadow-md rounded-md animate-in fade-in-0 zoom-in-95"
          >
            <p className="font-semibold mb-0.5">{schema.label}</p>
            <p className="opacity-80 leading-relaxed">{schema.description || "Node configuration and logic."}</p>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
      <div className='flex-row space-x-1 justify-center'>
        <span className="text-[11px] font-semibold text-foreground tracking-tight truncate max-w-45">
          {schema.label}
        </span>
        <span className='text-[10px] text-slate-400 dark:text-slate-500'>
          [{type}]
        </span>
      </div>
    </div>
    <button onClick={onToggleCollapse} className="nodrag p-1 hover:bg-muted rounded text-muted-foreground transition-colors">
      {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
    </button>
  </div>
);

const ParameterRow = ({ 
  param, 
  localValue,
  isConnected,
  onValueChange, 
  onToggleConnection,
}: any) => {
  return (
    <div className="relative flex flex-col px-3 py-2 group/row hover:bg-muted/40 transition-colors">
      <Handle
        type="target"
        position={Position.Left}
        id={param.id}
        style={{ left: '-1px' }}
        className={cn(
          "w-1.5! h-3! bg-blue-500! border-none! rounded-none! z-50! transition-all",
          !isConnected && "opacity-20 hover:opacity-100"
        )}
      />
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-medium text-muted-foreground">{param.label}</label>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-4 w-4 nodrag", isConnected ? "text-blue-500" : "text-muted-foreground")}
          onClick={() => onToggleConnection(param.id)}
          disabled={!param.canConnect}
        >
          {isConnected ? <Link size={10} /> : <Link2Off size={10} />}
        </Button>
      </div>
      <div className="nodrag">
        {!isConnected ? (
          param.type === 'enum' ? (
            <Select 
              value={String(localValue)} 
              onValueChange={(val) => onValueChange(param.id, val)}
            >
              <SelectTrigger className="h-7 text-[10px] bg-background border-border shadow-none dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-100">
                {param.options?.map((opt: string) => (
                  <SelectItem key={opt} value={opt} className="text-[10px]">{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input 
              type="text"
              value={localValue}
              onChange={(e) => onValueChange(param.id, e.target.value)}
              className="h-7 text-[10px] bg-background border-border shadow-none dark:text-slate-100" 
            />
          )
        ) : (
          <div className="h-7 flex items-center px-2 text-[9px] text-blue-500 font-mono bg-blue-500/5 border border-blue-500/20 rounded uppercase">
            linked
          </div>
        )}
      </div>
    </div>
  );
};

const CollapsedOverlay = ({ schema }: { schema: any }) => (
  <motion.div 
    key="collapsed"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="h-10 flex items-center justify-between px-4 relative"
  >
    <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-[-1px]">
      {schema.parameters.map((p: any) => (
        <Handle key={p.id} type="target" position={Position.Left} id={p.id} isConnectable={false} style={{ left: '-1px', top: '50%', transform: 'translateY(-50%)' }} className="w-1.5! h-4.5! bg-blue-600! border-none! rounded-none! z-50!" />
      ))}
      {schema.outputs.map((o: any) => (
        <Handle key={o.id} type="source" position={Position.Right} id={o.id} isConnectable={false} style={{ right: '-1px', top: '50%', transform: 'translateY(-50%)' }} className="w-1.5! h-4.5! bg-orange-600! border-none! rounded-none! z-50!" />
      ))}
    </div>
    <span className="text-[8px] font-black text-muted-foreground/50 tracking-[0.2em] w-full text-center uppercase">active nodes</span>
  </motion.div>
);

export const GenericNode = memo(({ id, data, selected, type }: NodeProps) => {
  const { schema, values: initialValues = {}, connectedParams: initialConnections = {} } = data as any;
  const updateNodeInternals = useUpdateNodeInternals();

  const [nodeState, setNodeState] = useState({
    values: initialValues,
    connectedParams: initialConnections
  });
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    updateNodeInternals(id);
  }, [isCollapsed, id, updateNodeInternals]);

  const handleValueChange = (paramId: string, value: any) => {
    const paramSchema = schema.parameters.find((p: any) => p.id === paramId);
    let finalValue = value;
    
    if (paramSchema?.type === 'number') {
      if (value !== "" && !/^-?\d*\.?\d*$/.test(value)) return;
    }

    setNodeState(prev => ({
      ...prev,
      values: { ...prev.values, [paramId]: finalValue }
    }));
  };

  const toggleConnection = (paramId: string) => {
    setNodeState(prev => ({
      ...prev,
      connectedParams: { 
        ...prev.connectedParams, 
        [paramId]: !prev.connectedParams[paramId] 
      }
    }));
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "group flex flex-col w-70 bg-card transition-shadow duration-200 shadow-xl rounded-lg border overflow-visible text-card-foreground",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}>
        <NodeHeader 
          schema={schema} 
          type={type as string} 
          isCollapsed={isCollapsed} 
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
        />

        <div className="relative">
          <AnimatePresence initial={false} mode="wait">
            {!isCollapsed ? (
              <motion.div 
                key="expanded"
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: "auto", opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                transition={{ duration: 0.15 }}
                className="overflow-visible py-1"
              >
                {schema.parameters.map((param: any) => (
                  <ParameterRow
                    key={param.id}
                    param={param}
                    localValue={nodeState.values[param.id] ?? param.value ?? ""}
                    isConnected={nodeState.connectedParams[param.id]}
                    onValueChange={handleValueChange}
                    onToggleConnection={toggleConnection}
                  />
                ))}
                <div className="mt-1 border-t border-border bg-muted/10">
                  {schema.outputs.map((output: any) => (
                    <div key={output.id} className="relative flex items-center justify-end h-9 px-3 group/row hover:bg-muted/40 transition-colors">
                      <span className="text-[10px] font-bold text-foreground/80 uppercase mr-1">{output.label}</span>
                      <Handle type="source" position={Position.Right} id={output.id} style={{ right: '-1px' }} className="w-1.5! h-3! bg-orange-500! border-none! rounded-none! z-50! hover:scale-110! transition-transform" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <CollapsedOverlay schema={schema} />
            )}
          </AnimatePresence>
        </div>
        <div className="h-1.5 w-full border-t border-border bg-muted/20 rounded-b-lg flex items-center justify-center">
          <GripHorizontal size={10} className="text-muted-foreground/20" />
        </div>
      </div>
    </TooltipProvider>
  );
});