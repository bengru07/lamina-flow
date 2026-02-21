import { Cursor, CursorPointer, CursorBody, CursorName, CursorMessage } from "@/components/ui/shadcn-io/cursor";
import { RemoteCursor } from "@/redux/workflow/tabsSlice";
import { useReactFlow } from "@xyflow/react";
import { useState, useEffect } from "react";

export const EditorCursor = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerenter", () => setVisible(true));
    el.addEventListener("pointerleave", () => {
      setVisible(false);
      setPressed(false);
    });
    el.addEventListener("pointerdown", () => {
      setPressed(true);
      setRippleKey((k) => k + 1);
    });
    
    const handleGlobalUp = () => setPressed(false);
    window.addEventListener("pointerup", handleGlobalUp);

    return () => {
      el.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleGlobalUp);
    };
  }, [containerRef]);

  if (!visible) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          transform: `scale(${pressed ? 0.9 : 1})`,
          transition: "transform 120ms ease-out",
          position: "relative",
        }}
      >
        <Cursor color="#3b82f6" className="dark:text-slate-200">
          <CursorPointer />
          <CursorBody className="hidden">
            <CursorName>Editor</CursorName>
            <CursorMessage>Message</CursorMessage>
          </CursorBody>
        </Cursor>

        <span
          key={rippleKey}
          style={{
            position: "absolute",
            left: "00%",
            top: "00%",
            width: 24,
            height: 24,
            borderRadius: "9999px",
            background: "rgba(59,130,246,0.35)",
            transform: "translate(-50%, -50%)",
            animation: "cursor-ripple 400ms ease-out forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes cursor-ripple {
          from { transform: translate(-50%, -50%) scale(0.4); opacity: 0.6; }
          to { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
export const RemoteCursors = ({
  cursors
}: {
  cursors: Record<string, RemoteCursor>;
}) => {
  const { screenToFlowPosition, getViewport } = useReactFlow();
  const [viewport, setViewport] = useState(getViewport());

  useEffect(() => {
    const interval = setInterval(() => {
      setViewport(getViewport());
    }, 16);
    return () => clearInterval(interval);
  }, [getViewport]);

  return (
    <>
      {Object.values(cursors).map(cursor => {
        const flowPos = { x: cursor.x, y: cursor.y };
        const screenPos = {
          x: flowPos.x * viewport.zoom + viewport.x,
          y: flowPos.y * viewport.zoom + viewport.y
        };

        return (
          <div
            key={cursor.userId}
            className="absolute pointer-events-none"
            style={{
              left: screenPos.x,
              top: screenPos.y,
              transform: "translate(-50%, -50%)",
              zIndex: 900
            }}
          >
            <Cursor color={cursor.color}>
              <CursorPointer />
              <CursorBody>
                <CursorName>{cursor.userName}</CursorName>
              </CursorBody>
            </Cursor>
          </div>
        );
      })}
    </>
  );
};