import { z } from 'zod'

export const voteSchema = z.object({
  project_id: z.string().uuid(),
  selected_version_id: z.string().uuid(),
  voter_name: z.string().min(1, 'Name is required').max(100),
  voter_email: z.string().email('Invalid email').toLowerCase(),
  reason: z.string().min(1, 'Please tell us why').max(2000),
})

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).default(''),
  status: z.enum(['draft', 'active', 'closed']).default('draft'),
  deadline: z.string().nullable().default(null),
  results_mode: z.enum(['after_vote', 'after_close', 'never']).default('after_close'),
})

export const designVersionSchema = z.object({
  title: z.string().min(1, 'Option name is required').max(200),
  image_url: z.string().url().or(z.literal('')).default(''),
  figma_link: z.string().url().or(z.literal('')).default(''),
  xd_link: z.string().url().or(z.literal('')).default(''),
  prototype_link: z.string().url().or(z.literal('')).default(''),
  position: z.number().int().default(0),
})

export const emailSchema = z.object({
  email: z.string().email(),
})

export const imageUploadSchema = z.object({
  size: z.number().max(5 * 1024 * 1024, 'Image must be under 5MB'),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Only JPEG, PNG, or WebP images are allowed' }),
  }),
})

export type VoteInput = z.infer<typeof voteSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type DesignVersionInput = z.infer<typeof designVersionSchema>
