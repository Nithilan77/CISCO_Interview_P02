# Test Plan

## How the app was tested
25 assertions, runnable live in the page via **Run self-tests**, and also as a
standalone Node script (`tests/logic-tests.js`). The tests call the same pure
functions the app uses — there is no second copy of the logic.

I tested by **category**, one test per distinct behavior, rather than trying to
test every possible input (which would be over-engineering for this scope).

## Coverage by category

**1. Built-in oracle** — the known-correct result from the problem.
- compatible = [D01, D02]; count = 2
- D03 → `DIET:Asha`, `ALLERGEN:Mira:MILK`
- D04 → `ALLERGEN:Dev:PEANUT`
- D05 → `DIET:Asha`, `DIET:Dev`

**2. Boundary conditions** — where off-by-one bugs hide.
- D02 at exactly ₹150 is compatible (proves `<=`, not `<`)
- At budget ₹130, D02 becomes `OVER_BUDGET` and compatible = [D01]

**3. Search decoupling** — the contract's built-in trap.
- search `wheat` → displays [D02]; search `hostel` → displays [D01]
- count stays 2 regardless of search (count reads the unfiltered list)

**4. Validation.**
- zero price rejected; negative price rejected
- duplicate dish ID reported (`DUPLICATE_DISH_ID`)
- empty resident name / empty dish id / empty dish name rejected
- built-in data itself passes validation

**5. Diet rules in isolation.**
- VEGAN resident: accepts VEGAN, rejects VEGETARIAN
- VEGETARIAN resident: accepts VEGAN and VEGETARIAN, rejects NON_VEGETARIAN
- NO_RESTRICTION resident: accepts NON_VEGETARIAN

**6. Edge case.**
- empty group → a dish is trivially compatible (no residents to fail against)

## Why the boundary test matters
The exactly-₹150 test is the only input where `<` and `<=` disagree: `<` would
reject the dish, `<=` accepts it. Every other price behaves the same under both
operators, so the boundary value is what proves the inclusive comparison the rule
requires.

## Why validation and compatibility are tested separately
They are two stages. Validation asks "is the data well-formed?"; compatibility
asks "which valid dishes work?". In the app flow, validation runs first and, on
failure, compatibility never runs. So compatibility tests assume valid input and
do not re-check for bad data — that responsibility belongs to validation alone.

## Known coverage gaps (what I did NOT test, and why)
- I don't test every combination of multiple simultaneous validation errors —
  each rule is covered once, which is enough to prove each fires.
- I don't fuzz arbitrary strings/types into the fields; inputs are the built-in
  data set, so the tests target the contracted cases rather than exhaustive
  sanitization.
