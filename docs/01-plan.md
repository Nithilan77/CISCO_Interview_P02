# Implementation Plan (5 steps)

The plan I set before writing code. Each step has a checkpoint I could verify
before moving on.

### 1. Data model
Set up residents (diet, allergens) and dishes (diet class, ingredients, price),
all normalized — trimmed and uppercased — so comparisons are exact.
**Checkpoint:** built-in data loads and renders in the two tables.

### 2. Validation
Runs *before* any computation. Checks: names/IDs non-empty after trim, dish IDs
unique, budget and every price positive whole rupees. Bad input reports
`INVALID_INPUT` (with table/row/field) or `DUPLICATE_DISH_ID`, and clears any
previous results.
**Checkpoint:** bad data shows the right error and produces no result rows.

### 3. Compatibility check
For one dish vs the whole group, run all three rules — diet, then allergen, then
budget. A dish is compatible only if it passes all three for **every** resident.
The check returns, per dish, either *compatible* or an **ordered list of failure
reasons** (not just true/false), so the display can render the reasons without
recomputing them.
**Checkpoint:** built-in data gives compatible = [D01, D02], count 2, with the
exact contracted reasons for D03/D04/D05.

### 4. Display + search
Render compatible dishes (source order) and excluded dishes with their ordered
reasons, plus a compatible-count summary. A search box filters only the
*displayed* compatible dishes (case-insensitive substring on cafe, dish name, or
ingredient tag). The count stays based on the unfiltered result.
**Checkpoint:** searching `wheat` shows only D02 while the count still reads 2.

### 5. Reset
Restore the built-in group, dishes, ₹150 budget, and empty search; clear
validation and results until compatibility is run again.
**Checkpoint:** after any edits/errors, Reset returns a clean built-in state.

## Why this order
- Validation before compatibility: no point computing on bad data, and bad data
  must clear stale results.
- Compatibility returns reasons (not booleans): the display needs the reasons;
  returning them in one pass makes the check the single source of truth and
  avoids duplicating the rule logic.
- Search after compatibility: a dish's compatibility is fixed; search is only a
  view filter on top. That separation is why the count stays fixed when
  searching.
