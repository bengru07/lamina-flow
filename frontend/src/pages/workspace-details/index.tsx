import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageLayout from "@/layout/page";
import type { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { OnboardingChecklist } from "./components/OnboardingChecklist";
import { useState } from "react";
import { ChatInterface, type ChatMessage } from "@/components/common/ChatInterface";
import InlineChat from "./components/InlineChat";
import { Card } from "@/components/ui/card";

export default function Page() {
  const workspace = useSelector((state: RootState) => state.workspaces.currentWorkspace);

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
    <PageLayout
      title={
        <div className="px-8 pt-8">
          {workspace ? workspace.name : <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-96" />
          </div>}
        </div>
      }
      description={
        <div className="flex flex-row space-x-4 px-8 items-center mb-12">
          <div>{workspace?.id}</div>
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(workspace?.id || '')}>
            Copy ID
          </Button>
        </div>
      }
      useChildContainer={false}
      useHeaderContainer={false}
      useSeparator
    >
      <div className="w-full h-full bg-muted/15 p-8">
        {/* Chat Interface */}
        <OnboardingChecklist workspaceId={workspace?.id ?? ""} />
      </div>
    </PageLayout>
  );
}