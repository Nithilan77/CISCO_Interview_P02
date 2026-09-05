# Design Summary

## Architecture decisions

**Single self-contained HTML file, vanilla HTML/CSS/JS, no framework.**
- Runs by double-clicking — no build step, no server, no setup risk on interview
  day.
- Every line is explainable; there's no framework machinery to get caught on.
- Live modification is trivial: edit, refresh, done.

**Logic separated from the DOM.**
All rule logic (normalize, validate, evaluateDish, evaluateAll, searchFilter)
lives in pure functions that take data and return results with no DOM access.
The render layer is strictly separated below them. This is the single most
important decision: it makes the logic unit-testable in isolation and keeps any
change local to one place.

**Compatibility check returns ordered reasons, not a boolean.**
The display needs to show *why* each dish failed. Returning the reasons from the
check itself makes it the single source of truth and avoids re-running the rules
just to reconstruct reasons — no duplicated logic to keep in sync.

**Forbidden/accepted values held as data, not code.**
Diet acceptance is a lookup table (`DIET_ACCEPTS`). This keeps rules as data, so
extending them (e.g. a new diet class) is mostly a data change.

## Technology choice: vanilla over React

I considered React but chose vanilla JS deliberately. The interview grades whether
I can explain and modify every line under pressure. A framework I don't fully
understand is a liability there — a "why did this re-render?" question I couldn't
answer would undercut code ownership. Vanilla JS keeps the whole solution within
what I can explain and debug confidently, which also matches the guide's
"technology familiarity" point and its warning against over-engineering.

## How AI shaped the design

AI executed decisions I made rather than making them. I specified the structure
(pure functions, DOM separation, reason-ordering); AI produced code to that
spec, which I then read, tested, and adjusted. Baking the expected result into
the first prompt (my decision) let AI self-check and gave me an immediate oracle.

## Trade-offs — prioritized vs deferred

**Prioritized:**
- Correctness against the exact contract (reason ordering, budget boundary,
  search-count decoupling).
- A clean, testable rule engine.
- Defensibility — being able to explain and change every part.

**Deferred (conscious scope cuts):**
- Editable input tables in the UI. The data is built-in and the logic is fully
  general, but I didn't build row-editing forms — out of scope for demonstrating
  the compatibility logic, and adding UI would risk over-engineering.
- Persistence / storage. Not needed; the problem is a single-session evaluation.
- Additional diet classes and rules beyond the four in the spec (I rehearsed
  adding one to prove it's easy, but kept the delivered solution true to P02).

## Known limitations
- Input is the built-in data set; there is no in-UI row editor.
- Validation covers the contracted cases (empty fields, duplicate IDs,
  non-positive/whole prices); it does not attempt exhaustive input sanitization
  beyond the spec.
