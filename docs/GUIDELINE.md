# Career-Ops Guideline

## Triage Requirement

Use this threshold for automatic pipeline decisions:

- **Score >= 3.8/5** → generate PDF and record status as `Evaluated`
- **Score < 3.8/5** → do not generate PDF and record status as `SKIP`

This is a triage rule for automation, not a claim that every 3.8+ role should be applied to without review.

## Tracker Rule

When the pipeline writes to the tracker:

- `Evaluated` means the role cleared the triage threshold and has a generated PDF
- `SKIP` means the role did not clear the triage threshold, so no PDF should be generated

## Report Rule

Every evaluation still gets:

- report `.md`
- score
- legitimacy assessment
- tracker entry

Only the PDF step is gated by the 3.8 threshold.
