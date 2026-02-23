"use client"

import React, { useState, useRef, useEffect } from "react"
import { 
  Send, 
  User, 
  Bot, 
  X, 
  Trash2, 
  Copy, 
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  onClearHistory: () => void
  isLoading: boolean
  providerName?: string
  isOverlay?: boolean
  onClose?: () => void
}

export function ChatInterface({
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
  providerName,
  isOverlay = false,
  onClose
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isLoading])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSendMessage(input)
    setInput("")
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Card className={cn(
      "flex flex-col border shadow-2xl bg-background transition-all duration-300",
      isOverlay ? "fixed bottom-6 right-6 w-[440px] h-[600px] z-50 ring-1 ring-border" : "w-full h-full border-none shadow-none"
    )}>
      <div className="flex-none -mt-6 p-4 border-b flex items-center justify-between bg-muted/30 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-semibold leading-none">Assistant</h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              {providerName || "Local Context AI"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClearHistory} title="Clear history">
            <Trash2 className="h-4 w-4" />
          </Button>
          {isOverlay && onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Message Area */}
      <ScrollArea className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="p-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Ask a question to start the conversation with your project context.
                </p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={cn("flex flex-col gap-2", message.role === "user" ? "items-end" : "items-start")}>
              <div className={cn("flex items-center gap-2", message.role === "user" && "flex-row-reverse")}>
                <Avatar className="h-6 w-6 border">
                  <AvatarFallback className={cn("text-[10px]", message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {message.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                  {message.role === "user" ? "You" : providerName || "AI"}
                </span>
              </div>
              <div className={cn(
                "relative group max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                message.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted/50 border rounded-tl-none text-foreground"
              )}>
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </div>
                {message.role === "assistant" && (
                  <button 
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground"
                  >
                    {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
              </div>
              <span className="text-[9px] text-muted-foreground px-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col gap-2 items-start">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border">
                  <AvatarFallback className="bg-muted"><Bot className="h-3 w-3" /></AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">AI is thinking</span>
              </div>
              <div className="bg-muted/50 border rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Fixed Input Footer */}
      <div className="flex-none p-4 bg-background border-t">
        <div className="relative flex items-center">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your message..."
            className="w-full bg-muted/50 border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none min-h-[44px] max-h-[120px]"
          />
          <Button 
            size="icon" 
            className="absolute right-1.5 h-8 w-8 rounded-lg" 
            disabled={!input.trim() || isLoading}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          Context includes {messages.length} messages and selected project files.
        </p>
      </div>
    </Card>
  )
}