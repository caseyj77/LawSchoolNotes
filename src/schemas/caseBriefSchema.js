import { z } from 'zod'

// Section content (Tiptap JSON) is intentionally not validated here — sections
// can legitimately be left blank mid-draft, so emptiness is a UI concern
// (see isJsonDocEmpty in @/lib/renderRichText), not a save-blocking rule.
export const caseBriefSchema = z.object({
  caseName: z.string().trim().min(1, 'Case name is required'),
  citation: z.string().trim().optional().default(''),
  studentNotes: z.string().trim().optional().default(''),
})
