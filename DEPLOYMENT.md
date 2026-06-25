# Deploying LawSchoolNotes (closed beta on Vercel)

A step-by-step checklist to get the app online so friends can create accounts and
give feedback. You'll touch three dashboards: **Supabase**, **Vercel**, and your
terminal once. Plan ~30–45 minutes the first time.

The stack: a Vite single-page app (the frontend) talking to **Supabase** (auth +
database + file storage). Vercel hosts the frontend; Supabase is the backend.

---

## 0. Before you start

- [ ] Code is on GitHub and `main` is green (`npm run test:unit` passes, `npm run build` works).
- [ ] You have (or can make) a free **Supabase** account and a free **Vercel** account.
- [ ] Install the Supabase CLI once: https://supabase.com/docs/guides/cli (or `npm i -g supabase`).

> **Why a new prod project?** Your dev Supabase project has manual tweaks from
> development. A fresh project applied straight from the migrations is clean and
> predictable — fewer surprises when real people sign in.

---

## 1. Create the production Supabase project

1. [ ] Supabase dashboard → **New project**. Pick a name (e.g. `lawschoolnotes-prod`),
       a strong **database password** (save it), and the region closest to your users.
2. [ ] When it finishes, go to **Project Settings → API** and copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon public** key → this is your `VITE_SUPABASE_ANON_KEY`
   - ⚠️ Ignore the **service_role** key — it must NEVER go in the frontend or Vercel.

## 2. Apply the database schema (migrations)

From the project folder in your terminal:

```bash
supabase login
supabase link --project-ref <your-prod-project-ref>   # ref is in the project URL / settings
supabase db push
```

`db push` runs every file in `supabase/migrations/` in order — creating all tables,
row-level-security policies, the `documents` storage bucket, and the default brief
template.

- [ ] `supabase db push` completed without errors.
- [ ] In the dashboard → **Table editor**, you can see: `classes`, `templates`,
      `template_sections`, `case_briefs`, `brief_sections`, `tasks`, `documents`,
      `annotations`.
- [ ] **Storage** shows a `documents` bucket.

> No manual seeding needed — each user's brief sections are created by the app the
> first time they open a brief.

## 3. Deploy the frontend to Vercel

1. [ ] Vercel dashboard → **Add New… → Project** → import this GitHub repo.
2. [ ] Vercel auto-detects **Vite** (build command `vite build`, output `dist`) — leave defaults.
3. [ ] Expand **Environment Variables** and add both (Production):
   - `VITE_SUPABASE_URL` = your prod Project URL
   - `VITE_SUPABASE_ANON_KEY` = your prod anon key
4. [ ] **Deploy**. When it's done you'll get a URL like `https://lawschoolnotes.vercel.app`.

> Vite bakes `VITE_*` vars in **at build time**. If you change them later, trigger a
> redeploy (Deployments → ⋯ → Redeploy). `vercel.json` is already in the repo so
> refreshing on `/calendar` etc. won't 404.

## 4. Point Supabase auth at the live URL

Supabase dashboard → **Authentication → URL Configuration**:

- [ ] **Site URL** = your Vercel URL (e.g. `https://lawschoolnotes.vercel.app`).
- [ ] **Redirect URLs** → add your Vercel URL and `http://localhost:5173` (for local dev).

Then **Authentication → Providers / Sign-In settings**:

- [ ] **Email confirmation** — for a smooth beta, either:
  - turn **off** "Confirm email" so signups are instant, **or**
  - keep it on and add an SMTP provider (e.g. free [Resend](https://resend.com)) so
    confirmation emails actually arrive (Supabase's built-in email is rate-limited and
    often lands in spam).
- [ ] **Google login** (optional) — the app has a Google button. Either configure the
      Google provider with your Vercel redirect URL, or skip it and use email/password
      for the beta.

## 5. Make it a *closed* beta

Pick one:

- **Invite-only (recommended):** Authentication → **Users → Add user / Invite** for each
  friend's email. Truly closed — only invited emails get in.
- **Private link:** just share the Vercel URL with your friends. Anyone with the link can
  sign up, so don't post it publicly.

## 6. Smoke test before sharing

Sign up as a brand-new user and confirm the core loop works end to end:

- [ ] Sign up + log in.
- [ ] Create a course; add an outline.
- [ ] Create a case brief — the 9 sections appear; Save works; **Export to Word** downloads.
- [ ] Add a task; see it on the **Calendar**; drag/resize a bar.
- [ ] Upload a PDF in the reader (verifies Storage), make a highlight.
- [ ] Log out, sign up as a *second* user — confirm you **cannot** see the first user's data.

## 7. Day-to-day

- Push to `main` → Vercel auto-redeploys.
- Schema changes → add a migration file, then `supabase db push` against prod.
- Watch usage on Supabase's free tier (database + 1 GB storage). Fine for a small beta.

---

## Quick reference

| Thing | Where |
|---|---|
| Frontend hosting | Vercel (auto-deploys `main`) |
| Backend (auth/db/storage) | Supabase prod project |
| Frontend env vars | Vercel → Project → Settings → Environment Variables |
| Apply DB schema | `supabase db push` |
| Invite beta users | Supabase → Authentication → Users |
| Safe to expose | `VITE_SUPABASE_URL`, anon key |
| **Never** expose | `service_role` key, DB password |
