# DESIGN.md

## Visual Direction
Command-center editorial UI: high trust, evidence-first, premium but practical.

## Non-Negotiables
- Evidence-first hierarchy over decorative UI
- Dense information blocks with clear scan paths
- Strong typography contrast for decision speed
- Motion used for meaning, not novelty

## Type System
- Display: expressive serif for headlines only
- Body: clean sans for reading and tables
- Data: mono for metrics, labels, and timestamps
- Max two weights per section unless there is a clear hierarchy need

## Spacing Scale
Use an 8px base scale only.
Allowed values: 4, 8, 12, 16, 24, 32, 40, 48, 64
No arbitrary spacing values unless documented in-code.

## Color System
- Ink background with layered atmospheric gradients
- Warm accent for commercial urgency
- Cool signal accent for active detection states
- Muted text for secondary information
- High contrast for all actionable UI

## Component Rules
- Cards must answer: what happened, why it matters, what to do next
- Every score block must have a "why this scored" explanation
- Every opportunity block must include source evidence links
- Button styles should reflect action criticality (primary, secondary, quiet)

## Layout Rules
- Section-by-section composition, not monolithic pages
- Desktop and mobile layouts both first-class
- No hidden overflow that clips evidence or controls
- Keep key actions visible without long scrolling on desktop

## Motion Rules
- One primary page-load reveal motion
- One data-state motion for active scans
- Keep durations short and consistent
- No animation that delays reading evidence

## Content Voice
- Commercial and clear, never hype-only
- Use "potential" and "signal indicates" for inference language
- Avoid certainty claims unless evidence is explicit

## Quality Gates
Before merge, every section must pass:
1. Design consistency pass against this file
2. Evidence visibility check
3. Keyboard and responsive sanity checks
4. Build/lint clean
