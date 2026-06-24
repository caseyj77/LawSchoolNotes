// Single source of truth for annotation colors on the JS side. The same set of
// keys is enforced by the `annotations.color` check constraint in the database
// (supabase/migrations/20260624000005_add_annotations.sql) — keep the two in
// sync. RGBA values are semi-transparent so highlighted text on the PDF canvas
// stays readable through the overlay.
export const ANNOTATION_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange', 'purple']

export const DEFAULT_ANNOTATION_COLOR = 'yellow'

export const ANNOTATION_COLOR_RGBA = {
  yellow: 'rgba(255, 222, 87, 0.40)',
  green: 'rgba(118, 214, 154, 0.40)',
  blue: 'rgba(120, 176, 255, 0.40)',
  pink: 'rgba(255, 150, 197, 0.40)',
  orange: 'rgba(255, 178, 102, 0.40)',
  purple: 'rgba(190, 150, 255, 0.40)',
}

export function annotationColorRgba(color) {
  return ANNOTATION_COLOR_RGBA[color] ?? ANNOTATION_COLOR_RGBA[DEFAULT_ANNOTATION_COLOR]
}
