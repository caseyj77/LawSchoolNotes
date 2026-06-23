import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().default(''),
  startDate: z.string().trim().optional().default(''),
  dueDate: z.string().trim().optional().default(''),
})
