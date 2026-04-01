import * as React from "react"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import { useAppDispatch } from "@/store/app-dispatcher";
import { thunkCreateWorkspace } from "@/store/workspaces/workspace-thunk";
import { toast } from "sonner";

export default function Page() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      tags: [],
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedName = form.watch("name")
  const watchedDescription = form.watch("description")

  function onSubmit(data: z.infer<typeof formSchema>) {
    dispatch(thunkCreateWorkspace(data)).then((result) => {
    if (thunkCreateWorkspace.rejected.match(result)) {
      
      toast.error(result.error.message || "Failed to create workspace.")
    } else {
      toast.success("Workspace created successfully!")
      navigate("/workspaces")
    }})
  }

  /* Tag Management */
  const [tagInput, setTagInput] = React.useState("")
  const tagInputRef = React.useRef<HTMLInputElement>(null)
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

  return (
    <Card className="mx-auto w-full max-w-2xl rounded-sm ring-0 border mt-16">
      <CardHeader className="border-b">
        <h1 className="text-lg font-semibold tracking-tight">Create Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Create a new workspace to organize your workflows and resources.
        </p>
      </CardHeader>
      <CardContent>
        <form id="create-workspace-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
                  <FieldDescription>
                    Up to 32 characters.
                  </FieldDescription>
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
                  <FieldDescription>
                    Up to 100 characters.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="tags"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tags</FieldLabel>
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
                  <FieldDescription>
                    Separate tags with a comma or press Enter. Up to 5 tags.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="border-t flex flex-row justify-end items-center bg-transparent space-x-3">
        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/workspaces")}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="create-workspace-form"
          size="sm"
          disabled={!watchedName || watchedName.trim().length === 0}
        >
          Create Workspace
        </Button>
      </CardFooter>
    </Card>
  )
}