import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1">
        <div className="mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}