import { z } from 'zod'

export const classSchema = z.object({
  title: z.string().trim().min(1, 'Class name is required'),
  focus: z.string().trim().optional().default(''),
})
