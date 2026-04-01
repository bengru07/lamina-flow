"use client"

import * as React from "react"
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { X } from "lucide-react";
import { formSchema } from "./schema.zod"
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/app-dispatcher";
import { thunkUpdateWorkspace, thunkDeleteWorkspace } from "@/store/workspaces/workspace-thunk";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import PageLayout from "@/layout/page";
import type { RootState } from "@/store/store";

export default function Page() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const workspace = useAppSelector((state: RootState) => state.workspaces.currentWorkspace)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workspace?.name ?? "",
      description: workspace?.description ?? "",
      tags: workspace?.tags ?? [],
    },
  })

  const watchedName = form.watch("name")
  const watchedDescription = form.watch("description")

  const [tagInput, setTagInput] = React.useState("")
  const tagInputRef = React.useRef<HTMLInputElement>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = React.useState("")

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (!workspace) return
    dispatch(thunkUpdateWorkspace({ id: workspace.id, ...data })).then((result) => {
      if (thunkUpdateWorkspace.rejected.match(result)) {
        toast.error(result.error.message || "Failed to update workspace.")
      } else {
        toast.success("Workspace updated successfully!")
      }
    })
  }

  function handleDelete() {
    if (!workspace) return
    dispatch(thunkDeleteWorkspace(workspace.id)).then((result) => {
      if (thunkDeleteWorkspace.rejected.match(result)) {
        toast.error(result.error.message || "Failed to delete workspace.")
      } else {
        toast.success("Workspace deleted.")
        navigate("/workspaces")
      }
    })
  }

  function commitTag(raw: string, onChange: (val: string[]) => void, currentTags: string[]) {
    const trimmed = raw.trim()
    if (trimmed && !currentTags.includes(trimmed) && currentTags.length < 5) {
      onChange([...currentTags, trimmed])
    }
    setTagInput("")
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>, onChange: (val: string[]) => void, currentTags: string[]) {
    if (e.key === "Enter") {
      e.preventDefault()
      commitTag(tagInput, onChange, currentTags)
    } else if (e.key === "Backspace" && tagInput === "" && currentTags.length > 0) {
      e.preventDefault()
      const lastTag = currentTags[currentTags.length - 1]
      onChange(currentTags.slice(0, -1))
      setTagInput(lastTag)
      requestAnimationFrame(() => {
        if (tagInputRef.current) {
          tagInputRef.current.setSelectionRange(lastTag.length, lastTag.length)
        }
      })
    }
  }

  function handleTagInputChange(e: React.ChangeEvent<HTMLInputElement>, onChange: (val: string[]) => void, currentTags: string[]) {
    const value = e.target.value
    if (value.endsWith(",")) {
      commitTag(value.slice(0, -1), onChange, currentTags)
    } else {
      setTagInput(value)
    }
  }

  function removeTag(index: number, onChange: (val: string[]) => void, currentTags: string[]) {
    onChange(currentTags.filter((_, i) => i !== index))
  }

  if (!workspace) {
    return (
      <PageLayout title="Settings" description="No workspace selected.">
        <p className="text-sm text-muted-foreground">Please select a workspace first.</p>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Settings"
      description={`Manage the configuration for ${workspace.name}.`}
      headerActions={
        <>
          <Button variant="outline" size="sm" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button
            type="submit"
            form="update-workspace-form"
            size="sm"
            disabled={!watchedName || watchedName.trim().length === 0}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="update-workspace-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col divide-y">
          <div className="grid grid-cols-3 gap-8 py-6">
            <div className="col-span-1 flex flex-col gap-1">
              <p className="text-sm font-medium">General</p>
              <p className="text-sm text-muted-foreground">Basic information about this workspace.</p>
            </div>
            <div className="col-span-2">
              <FieldGroup>
                <Field>
                  <FieldLabel>Workspace ID</FieldLabel>
                  <Input
                    readOnly
                    value={workspace.id}
                    className="text-muted-foreground font-mono text-xs cursor-default select-all"
                  />
                  <FieldDescription>
                    Assigned at creation and cannot be changed.
                  </FieldDescription>
                </Field>

                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Workspace Name&nbsp;<span className="text-destructive" aria-hidden>*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g. Frontend Platform, Data Pipeline, Q1 Launch"
                        autoComplete="off"
                        maxLength={32}
                      />
                      <FieldDescription>Up to 32 characters.</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                      <InputGroup>
                        <InputGroupTextarea
                          {...field}
                          id={field.name}
                          placeholder="What is this workspace for? Who uses it, and what does it help accomplish?"
                          rows={4}
                          className="min-h-24 resize-none"
                          aria-invalid={fieldState.invalid}
                          maxLength={100}
                        />
                        <InputGroupAddon align="block-end">
                          <InputGroupText className={`tabular-nums transition-colors ${watchedDescription.length >= 90 ? "text-destructive" : ""}`}>
                            {watchedDescription.length}/100
                          </InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>Up to 100 characters.</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 py-6">
            <div className="col-span-1 flex flex-col gap-1">
              <p className="text-sm font-medium">Tags</p>
              <p className="text-sm text-muted-foreground">Organize and filter this workspace using tags.</p>
            </div>
            <div className="col-span-2">
              <Controller
                name="tags"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div
                      className={`flex flex-wrap gap-1.5 min-h-9 w-full rounded-md border bg-transparent px-3 py-1.5 text-sm shadow-xs transition-colors focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring/40 ${fieldState.invalid ? "border-destructive" : "border-input"}`}
                      onClick={() => tagInputRef.current?.focus()}
                    >
                      {field.value.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-sm bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeTag(index, field.onChange, field.value)
                            }}
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        ref={tagInputRef}
                        id="tags-input"
                        value={tagInput}
                        onChange={(e) => handleTagInputChange(e, field.onChange, field.value)}
                        onKeyDown={(e) => handleTagKeyDown(e, field.onChange, field.value)}
                        onBlur={() => commitTag(tagInput, field.onChange, field.value)}
                        placeholder={field.value.length === 0 ? "e.g. backend, infra, team-dx — separate with comma" : ""}
                        disabled={field.value.length >= 5}
                        className="flex-1 min-w-24 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed text-sm py-0.5"
                      />
                    </div>
                    <FieldDescription>Separate tags with a comma or press Enter. Up to 5 tags.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 py-6">
            <div className="col-span-1 flex flex-col gap-1">
              <p className="text-sm font-medium text-destructive">Danger Zone</p>
              <p className="text-sm text-muted-foreground">Irreversible actions that permanently affect this workspace.</p>
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <p className="text-sm font-medium">Delete this workspace</p>
              <p className="text-sm text-muted-foreground">Once deleted, all associated data will be permanently removed and cannot be recovered.</p>
              <div className="mt-2">
                <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirmInput("") }}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete workspace</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. To confirm, type <span className="font-medium text-foreground">{workspace.name}</span> below.
                      </DialogDescription>
                    </DialogHeader>
                    <Field>
                      <FieldLabel htmlFor="delete-confirm-input">Workspace name</FieldLabel>
                      <Input
                        id="delete-confirm-input"
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        placeholder={workspace.name}
                        autoComplete="off"
                      />
                    </Field>
                    <DialogFooter>
                      <Button variant="outline" size="sm" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmInput("") }}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteConfirmInput !== workspace.name}
                        onClick={handleDelete}
                      >
                        Delete permanently
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageLayout>
  )
}