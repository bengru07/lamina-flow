import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppDispatch } from "@/api/appDispatcher"
import { createWorkspace } from "@/redux/workspaces/WorkspaceThunk"

export function ProjectCreateDialog({
  children
}: {
  children: React.ReactNode
}) {
  const dispatch = useAppDispatch()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    dispatch(
      createWorkspace({
        name: form.w_name.value,
        description: form.w_description.value,
      })
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your workflows and projects.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="w_name">Name</Label>
              <Input
                id="w_name"
                name="w_name"
                placeholder="Personal Mini-Projects 2025"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="w_description">Description</Label>
              <Input
                id="w_description"
                name="w_description"
                placeholder="All of my personal projects this year"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}