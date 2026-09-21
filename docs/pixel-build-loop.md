# Pixel Build Loop

This is the operating loop for shipping high-quality sections without design drift.

## 0. Set the standard first
- Keep `PRODUCT.md` and `DESIGN.md` updated before implementation
- Build and review in sections, not whole-page rewrites

## 1. Build one section only
Prompt pattern:
- Build [section name] only
- Use spacing scale from `DESIGN.md`
- Include evidence-first hierarchy
- No arbitrary pixel values

## 2. Run objective checks
- `npm run build`
- Verify no TypeScript or compile errors
- Confirm responsive behavior at mobile/tablet/desktop

## 3. Run interaction checks
For each changed screen:
- Click all controls
- Test empty/invalid/valid form states
- Verify no console errors
- Verify keyboard navigation and focus visibility

## 4. Fix only failures
- Do not rewrite passing parts
- Re-run exactly the same checks
- Confirm pass list improved

## 5. Commit per completed section
Commit style:
- One commit per coherent improvement
- Message format: `<intent>: <what changed>`
Examples:
- `ui: add evidence-first score explanation`
- `leads: add priority-vs-all scan mode`

## 6. Release confidence checklist
- Every opportunity has evidence links
- Every score has transparent breakdown
- Priority sectors are a lens, not a hard restriction
- AI suggestions are assistive and compliance-aware
- App builds cleanly

## Notes on external plugins
If you use design plugins (Impeccable, Figma MCP, Playwright plugin), keep this repo loop unchanged. Plugins can improve detection and speed, but this checklist remains the quality baseline.
