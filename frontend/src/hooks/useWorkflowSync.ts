import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/api/appDispatcher';
import { onNodesChange, updateNodeData } from '@/redux/workflow/tabsSlice';

export const useWorkflowSync = (filePath: string | undefined) => {
  const socketRef = useRef<WebSocket | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!filePath) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/workflow/${filePath}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === 'nodes_changed') {
        dispatch(onNodesChange({ path: filePath, changes: msg.changes, isRemote: true }));
      }
      if (msg.type === 'data_updated') {
        dispatch(updateNodeData({ path: filePath, nodeId: msg.nodeId, data: msg.data, isRemote: true }));
      }
    };

    return () => socket.close();
  }, [filePath, dispatch]);

  const sendSync = (payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  return { sendSync };
};