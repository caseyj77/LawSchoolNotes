import { z } from 'zod'

export const newBriefCaptureSchema = z.object({
  caseName: z.string().trim().min(1, 'Case name is required'),
})
