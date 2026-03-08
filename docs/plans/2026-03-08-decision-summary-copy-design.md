# Decision Summary Copy Redesign

## Problem
The new run-comparison card is technically correct, but normal users still have to interpret terms like coverage, unmet hours, and travel deltas on their own. That makes the feature feel analytical instead of decision-supportive.

## Goal
Keep the existing comparison logic, but rewrite the presentation so a school or ministry user can quickly understand:
- whether the latest run is better, worse, or unchanged,
- what that means operationally,
- and which schools need attention now.

## Recommended approach
Use a simple story-first summary with numbers translated into everyday language.

### Structure
1. **Outcome sentence first**
   - Example direction: "This run leaves fewer classes uncovered than the previous one."
2. **Decision guidance second**
   - Example direction: "You can maintain the current support plan, but keep watching the remaining shortage schools."
3. **Supporting metrics third**
   - Keep the numbers, but relabel them in everyday wording such as:
     - more classes covered
     - fewer shortage hours
     - less travel required
4. **Context-aware school list**
   - If conditions worsened, show the schools now needing urgent support.
   - If conditions improved, avoid negative wording like "needs more attention" and instead explain that no school got worse, or highlight where pressure eased.

## Alternatives considered

### 1. Keep the current layout and add helper text
- Lowest effort.
- Still leaves too much interpretation to the user.

### 2. Traffic-light verdict plus short explanation
- Very fast to scan.
- Too reductive for district decisions because users still need a little context.

### 3. Story-first summary with translated numbers **(chosen)**
- Best balance of clarity and accountability.
- Preserves the underlying metrics while making them understandable.

## Data and logic
- Do not change the backend comparison math.
- Continue using the same previous-vs-current snapshot logic.
- Only change wording, labels, and conditional rendering on the results page.
- Keep the real first-run fallback.

## Validation
Validate the copy against three demo transitions:
- severe -> moderate: should read as improvement but still signal remaining shortages,
- moderate -> full: should read as strong improvement with no worsening schools,
- same -> same: should read as stable.
