import * as z from "zod"

export const formSchema = z.object({
  name: z.string().min(1, "Workspace name is required.").max(32, "Workspace name must be at most 32 characters.").refine(v => v.trim().length > 0, "Workspace name cannot be blank."),
  description: z.string().max(100, "Description must be at most 100 characters."),
  tags: z.array(z.string()).max(5, "You can add up to 5 tags."),
})

