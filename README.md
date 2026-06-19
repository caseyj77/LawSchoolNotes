# LawSchoolNotes

A Vue 3 + Vite workspace for organizing course outlines and drafting case briefs for law school.

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run test:unit`

## Claude Code Integration

This repository includes:

- `CLAUDE.md` for repository context used by Claude Code in local sessions.
- `.github/workflows/claude.yml` for `@claude`-triggered GitHub automation on issues and PRs.

### Local setup

1. Install Claude Code:
   - `npm install -g @anthropic-ai/claude-code`
2. Authenticate by running:
   - `claude`
3. Start Claude in this repo root:
   - `claude`

### GitHub Actions setup

1. Install the Claude GitHub app for this repository: `https://github.com/apps/claude`
2. In repository settings, add the `ANTHROPIC_API_KEY` secret under:
   - `Settings` → `Secrets and variables` → `Actions`
3. Use `@claude` in:
   - issue comments
   - pull request review comments
   - pull request reviews
   - issue title/body (when opening or assigning)
