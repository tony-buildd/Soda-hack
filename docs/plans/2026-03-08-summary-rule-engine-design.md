# Summary Rule Engine Design

## Problem
The current decision summary copy relies on frontend branching and a few special cases. That will not scale across real staffing scenarios such as more schools with the same teachers, more schools with fewer teachers, or more teachers that still do not cover subject demand.

## Goal
Generate one plain-language summary card that stays understandable across many edge cases without hardcoding a message for every upload pattern.

## Recommended approach
Move summary interpretation into a backend rule engine.

### Signals
The backend should compute a compact set of stable comparison signals:
- current coverage percent
- coverage delta vs previous run
- current unmet hours
- unmet-hours delta vs previous run
- current travel and travel delta
- whether the run is full coverage
- how many schools worsened
- how much of the new shortage is concentrated in the top worsened schools

### Rule buckets
Use a small set of buckets instead of scenario-specific strings:
1. first run
2. full coverage
3. improved but gaps remain
4. stable
5. worsened in a few schools
6. worsened across many schools

Each bucket should emit plain-language headline/body copy and keep the raw metrics for support.

### Rendering
The frontend should render the backend summary object and stop inferring story logic on its own.

## Why this approach
- Avoids brittle hardcoded cases
- Makes saved history snapshots consistent
- Keeps UI copy simple while preserving auditability through metrics

## Validation
Test at least these transitions:
- severe -> moderate
- moderate -> full
- full -> moderate
- same -> same
- a case with only a few worsened schools
