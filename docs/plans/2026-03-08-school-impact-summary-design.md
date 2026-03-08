# School Impact Summary Design

## Problem
Results are numerically accurate, but decision-makers may not understand what changed between runs or how those changes should influence school support decisions.

## Goal
Add a plain-language summary to the Results page that explains what changed since the previous run and which schools became more urgent.

## Recommended Approach
Add a "What changed since last run" card near the top of the Results page. The card should compare the active run against the immediately previous saved snapshot and summarize:
- coverage change
- unmet-hours change
- the top 3-5 schools whose situation worsened most
- plain-language urgency guidance for decision-makers

## Data Flow
1. A new optimizer run is saved as a timestamped snapshot.
2. The backend compares the current run to the previous snapshot.
3. The backend generates a compact school-impact summary and stores it with the snapshot.
4. The frontend renders that summary for the latest run or any reopened historical run.

## UX
- Show the summary above KPI cards.
- Use ministry-friendly language such as "More urgent support needed in X schools".
- If no previous run exists, show a note that there is no comparison baseline yet.
- Avoid overclaiming; only state worsening or improvement when the saved diff proves it.

## Validation
Validate with repeated runs from the demo CSV sets so summary text changes when coverage drops and when particular schools worsen.
