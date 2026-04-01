import { ChatInterface, type ChatMessage } from "@/components/common/ChatInterface"
import { useState } from "react"

export default function AiAgent() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [providerName, setProviderName] = useState('')
  const [showChatInterface, setShowChatInterface] = useState(true)

  const handleSendMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }
    setChatMessages(prev => [...prev, newMessage])
    setIsLoading(true)
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a simulated response from the AI agent.",
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 2000)
  }

  const handleClearHistory = () => {
    setChatMessages([])
  }

  return (
    <div className="w-full h-full bg-muted/15 p-8">
      <ChatInterface 
        messages={chatMessages}
        isLoading={isLoading}
        providerName={providerName}
        onSendMessage={handleSendMessage}
        onClearHistory={handleClearHistory}
        onClose={() => setShowChatInterface(false)}
      />
    </div>
  )
}