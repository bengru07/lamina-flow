'use client';

import React, { useEffect, useState, useMemo } from "react"
import { 
  Search, 
  Plus, 
  Workflow, 
  ArrowUpRight, 
  Sparkles, 
  Mail, 
  Target, 
  Activity, 
  ShieldAlert, 
  Terminal,
  Clock,
  ExternalLink
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { fetchWorkspaces, createWorkspace } from "@/redux/workspaces/WorkspaceThunk"
import { WorkspaceCreateDialog } from "@/components/builder/dialog/workspace-create-dialog";

export default function Page() {
  const dispatch = useAppDispatch()
  const workspaces = useAppSelector((state) => state.workspaces.list)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchWorkspaces())
  }, [dispatch])

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return []
    return workspaces.filter((w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, workspaces])

  const quickStartCards = [
    {
      title: "Content generation with AI",
      description: "Describe your business and target audience and AI generates engaging posts for all your social accounts.",
      footer: "Follow the steps to build an automated content generator",
      icon: <Sparkles size={24} />,
    },
    {
      title: "Gather Intelligence on a topic",
      description: "Automatically research latest trends and information from a topic and get a summary email.",
      footer: "Follow the steps to build an automated research assistant",
      icon: <Mail size={24} />,
    },
    {
      title: "Enrich & Quality Customer Leads",
      description: "Gather insights about your customers automatically from various sources and classify them.",
      footer: "Learn how to build an automated customer lead enrichment system",
      icon: <Target size={24} />,
    }
  ]

  const templates = [
    {
      title: "Focus Group Simulator",
      description: "Facilitate a simulated focus group discussion by simultaneously engaging multiple AI chat interfaces.",
      icons: [<div className="bg-orange-600 w-8 h-8 rounded flex items-center justify-center font-bold">9</div>, <Activity className="text-emerald-500" />]
    },
    {
      title: "AI Chatbot with Malicious Intent...",
      description: "Create an AI Chatbot with BuildShip and OpenAI, featuring prompt injection checks.",
      icons: [<ShieldAlert className="text-indigo-500" />, <Activity className="text-emerald-500" />]
    },
    {
      title: "Streaming AI Chatbot",
      description: "Create a Streaming AI Chatbot with BuildShip and OpenAI Assistant integrations.",
      icons: [<Activity className="text-emerald-500" />]
    }
  ]

  return (
    <div className="h-full w-full overflow-y-auto bg-white dark:bg-[#0a0a0a] text-zinc-600 dark:text-zinc-400 p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <header className="flex flex-col items-center space-y-6 text-center">
          <h1 className="text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Welcome, Benjamin
          </h1>
          <div className="relative w-full max-w-xl group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find flows and templates..." 
              className="w-full bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 pl-10 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-700 focus-visible:ring-offset-0 text-zinc-900 dark:text-white"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
              <span>⌘</span>
              <span>K</span>
            </div>

            {searchQuery && (
              <Card className="absolute top-full mt-2 w-full z-50 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                <CardContent className="p-2">
                  {filteredWorkspaces.length > 0 ? (
                    filteredWorkspaces.map((w) => (
                      <div key={w.uuid} className="flex items-center gap-3 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors text-left">
                        <Workflow size={16} className="text-primary-500" />
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{w.name}</div>
                          <div className="text-xs text-zinc-500 truncate max-w-sm">{w.description}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-zinc-500 text-center">No workspaces found for "{searchQuery}"</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors cursor-default">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Workflow size={18} />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Active Workspaces</span>
              </div>
              <span className="text-sm font-mono text-zinc-900 dark:text-white">{workspaces.length}</span>
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors cursor-default">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Terminal size={18} />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Environment Status</span>
              </div>
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Stable</span>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-200">
              <ChevronDownIcon />
              Quickstart with a guided example
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs gap-2"
            >
              Start from scratch <ArrowUpRight size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickStartCards.map((card, i) => (
              <Card key={i} className="bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all p-6 space-y-4">
                <div className="p-3 w-fit rounded-xl bg-zinc-100 dark:bg-zinc-800/50 text-zinc-900 dark:text-white">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-medium mb-2">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
                    {card.description}
                  </p>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-600 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">{card.footer}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-200">
              <ChevronDownIcon />
              Recommended templates for you
            </div>
            <Button variant="link" size="sm" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs gap-1">
              Browse Community <ExternalLink size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template, i) => (
              <Card key={i} className="bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all p-6 flex flex-col justify-between">
                <div>
                  <div className="flex gap-2 mb-6 text-white">
                    {template.icons.map((icon, idx) => (
                      <div key={idx} className="w-8 h-8 rounded flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        {icon}
                      </div>
                    ))}
                  </div>
                  <h3 className="text-zinc-900 dark:text-white font-medium mb-2">{template.title}</h3>
                  <p className="text-sm text-zinc-500 line-clamp-3">
                    {template.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <footer className="pt-12 pb-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
              <div className="h-px w-12 bg-zinc-200 dark:bg-zinc-800" />
              Actions
              <div className="h-px w-12 bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black gap-2 hover:opacity-90 transition-opacity px-8"
            >
                <Plus size={16} /> New Workspace
            </Button>
        </footer>
      </div>

      <WorkspaceCreateDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <span className="text-[10px] transform rotate-90 text-zinc-300 dark:text-zinc-700">▶</span>
  )
}