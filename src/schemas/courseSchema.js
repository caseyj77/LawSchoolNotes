import { z } from 'zod'

export const courseSchema = z.object({
  title: z.string().trim().min(1, 'Course name is required'),
  focus: z.string().trim().optional().default(''),
  color: z.string().trim().optional().default('#4b3f72'),
})
