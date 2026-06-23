---
name: vue3-feature-libraries
description: Use this skill whenever adding a calendar/scheduling view, a kanban or sprint-style task board, drag-and-drop reordering, data-entry forms (including date fields and validation), or rich text / large text editing fields to a Vue 3 app. Trigger this for phrases like "add a calendar," "build a kanban board," "add a task board," "create a form for X," "add validation," "add a date picker," "add a rich text editor," or "add a notes/description field" — even if the user doesn't name a library, since this skill defines the default choice for each. Companion to the vue3-app-builder skill, which covers project setup; this one covers feature-specific library choices on top of that setup.
---

# Vue 3 Feature Libraries

This skill picks one default library per recurring feature type, so the question "what do I use for X" doesn't get re-answered (or re-researched) every project. Assumes the stack from `vue3-app-builder`: Vue 3 + Composition API + `<script setup>`, Pinia, Vue Router, Supabase.

**Guiding rule:** one well-maintained library per job, chosen for fitting a solo/side-project workflow (lightweight, good docs, not over-engineered for team-scale needs the user doesn't have). If a project's needs genuinely outgrow a default, swap deliberately — see "Escalation paths" at the end of each section — rather than reaching for a heavier tool by default.

## Calendars & Scheduling

**Default: `vue-cal`** — install with `npm install vue-cal@next` (the `@next` tag tracks Vue 3 support).

- Use for: month/week/day views, displaying events, basic drag-to-reschedule.
- Conventions:
  - Wrap it in a single `views/CalendarView.vue` (or a `components/AppCalendar.vue` if it's reused inside other pages) — don't sprinkle calendar config across multiple components.
  - Events come from a Pinia store (e.g. `useEventsStore`), not fetched directly inside the calendar component. The component should just render `store.events`.
  - When the calendar's visible range changes (vue-cal emits this), fetch only that range from Supabase rather than loading the user's entire event history at once — most apps don't need it, and it keeps things fast as data grows.

**Date fields inside forms (separate from a full calendar view): `@vuepic/vue-datepicker`** — install with `npm install @vuepic/vue-datepicker`.

- Use this any time a form needs a single date/time input (e.g. "due date," "appointment time") — don't reach for `vue-cal` for this; it's built for full views, not compact form fields.
- Pair it with the VeeValidate conventions below — it works as a normal `v-model` field, so it slots into a VeeValidate-managed form without special handling.

**Escalation path:** if a project needs resource scheduling (multiple rooms/people on a timeline), recurring event rules, or enterprise-grade scheduling, switch to **FullCalendar** (`@fullcalendar/vue3`) instead — it's heavier but built for exactly that. Don't try to bolt those features onto `vue-cal`.

## Kanban / Sprint Boards

**Default: `vuedraggable`** — install with `npm install vuedraggable@next` (the `@next` tag is required for Vue 3; the non-`@next` version is Vue 2 only).

- This isn't a "kanban library" — it's drag-and-drop on top of data you already manage in Pinia. The board *is* your Pinia store; `vuedraggable` just makes it reorderable.
- Conventions:
  - Store shape: one array of tasks per store (or one array with a `status`/`column` field per task — either works, but pick one pattern and stay consistent across boards in a project).
  - Each column wraps its task array in a `<draggable :list="..." group="tasks">` — give every column the same `group` value so tasks can move *between* columns, not just reorder within one.
  - **Persisting order to Supabase:** add an integer `position` column to the relevant table. On every drop (`@end` event), write back the affected tasks' new `position` (and `status`/column, if that changed) — don't refetch the whole board after every drag, since that causes a visible flicker; update local Pinia state immediately (it already reflects the drop) and let the Supabase write happen in the background.
  - Debounce rapid-fire writes if a user drags several cards quickly — no need to fire a network request per pixel of movement, just per completed drop.

**Escalation path:** if a board needs full Trello/Jira-style features (swimlanes, WIP limits, multi-board permissions across teams), that's a sign to consider a dedicated project-management backend rather than rolling your own — but for a solo/personal-project sprint board, `vuedraggable` + Pinia + Supabase covers it.

## Data Entry & Validation

**Default: VeeValidate + Zod**

```
npm install vee-validate zod
```

- VeeValidate handles form state, validation triggering, and error display. Zod defines *what counts as valid* — so the same Zod schema can validate both a form submission and data read back from Supabase, instead of writing the validation rules twice.
- Conventions:
  - Schemas live in `src/schemas/`, one file per form-or-data-shape (e.g. `schemas/taskSchema.js`), and are imported wherever that shape needs validating — in a form, and separately when reading/writing that table in Supabase.
  - In components, use VeeValidate's `useForm` with the Zod schema passed via `@vee-validate/zod`'s `toTypedSchema`, inside `<script setup>` — consistent with the rest of the stack's composition style:
    ```js
    import { useForm } from 'vee-validate'
    import { toTypedSchema } from '@vee-validate/zod'
    import { taskSchema } from '@/schemas/taskSchema'

    const { handleSubmit, errors, defineField } = useForm({
      validationSchema: toTypedSchema(taskSchema)
    })
    ```
  - Display field errors right under each field using the `errors` object VeeValidate returns — don't roll a separate ad-hoc error-tracking pattern per form.
  - For the date fields covered above, the Zod schema should validate the date itself (e.g. "due date can't be in the past") — keep that logic in the schema, not scattered in the component.

**Escalation path:** if a project needs a form *builder* (generating many similar forms from JSON, heavy conditional logic, non-technical users editing form structure), that's what FormKit is built for — but for hand-written forms with custom styling, VeeValidate + Zod stays lighter and gives more control over markup.

## Rich Text / Large Text Fields

**Default: Tiptap** — install with:
```
npm install @tiptap/vue-3 @tiptap/pm @tiptap/starter-kit
```

- Use for: any data-entry field that needs formatting (bold, lists, links) rather than plain text — case notes, descriptions, comments. If a field is just long plain text with no formatting, use a regular `<textarea>` with the same VeeValidate/Zod handling as any other field — don't reach for Tiptap when no formatting is needed.
- **Note on versions:** Tiptap 3.x (current) made breaking changes from 2.x — list and table extensions are now combined single imports (e.g. `import { BulletList, OrderedList, ListItem } from '@tiptap/extension-list'`) rather than separate packages per extension, and `StarterKit` now bundles more by default (Underline, Link, TrailingNode included). If reusing patterns from older Tiptap 2.x projects, double-check imports against current docs rather than assuming they still match.
- Conventions:
  - Wrap the editor in a single reusable `components/RichTextEditor.vue` that exposes a `v-model` (using `useEditor` + `EditorContent` internally) — so it drops into any form the same way a normal input does, and the editor setup/teardown logic lives in one place.
  - **Store content as JSON** (`editor.getJSON()`), not raw HTML, in a `jsonb` Supabase column — JSON round-trips cleanly back into the editor and avoids storing/re-rendering raw HTML strings.
  - If the content ever needs to be rendered as HTML elsewhere (e.g. a read-only view, an export, a page another user views), sanitize it on render — don't trust stored rich text content as safe-to-inject HTML, even though it came from your own editor, since stored data can still be tampered with directly or via a bug elsewhere in the app.
  - For validation: a Tiptap field's "emptiness" isn't a plain empty string — check `editor.isEmpty` rather than checking if the JSON/HTML string is falsy, and reflect that in the Zod schema as a refinement rather than a plain `min(1)` string check.

**Escalation path:** if a project needs real-time collaborative editing (multiple users editing the same document simultaneously), Tiptap supports this via its Collaboration extension (built on Yjs) — but that's a deliberate, heavier addition, not something to reach for unless multi-user editing is an actual requirement.

## What to do when a task isn't covered here

If a feature comes up that doesn't fit calendars, kanban, or data entry (e.g. rich text editing, file uploads, charts), don't silently pick a library and move on — name the options, give a recommendation with reasoning, and ask whether to add it as a new section here so the next project inherits the same answer.
