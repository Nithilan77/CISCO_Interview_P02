# AI Interaction Documentation

**Tool used:** Claude (Anthropic), throughout — planning, code generation,
testing, and rehearsing modifications.

My approach was to make the decisions myself and use AI as an executor and a
reviewer, rather than asking it to think for me. The prompts below reflect that:
they carry my design decisions and constraints, not open-ended requests.

---

## 1. Initial prompt — translating the problem into a spec

I wrote one detailed first prompt rather than a vague one, because a vague prompt
produces code I can't defend. It carried the tech constraint, the 5-step plan,
all three rules, the exact reason-ordering contract, validation rules, the
built-in data, and — deliberately — the expected output as a correctness oracle.

> Build a compact **Hostel Food Compatibility Board**: a group of hostel
> residents needs one dish everyone can eat. Apply each resident's diet, allergen
> exclusions, and a per-person budget to a set of dishes, then show the
> compatible dishes and the exact reasons the others were excluded.
>
> **Tech:** single self-contained HTML file — HTML + CSS + vanilla JS, no
> frameworks, no build step. Keep all compatibility/validation logic in pure
> functions (take data, return results, no DOM access) so I can test them
> independently. DOM/render code separate.
>
> [5-step plan: data model → validation → compatibility check → display+search →
> reset, each testable at its checkpoint]
>
> [Rules: diet acceptance table; allergen exact-match, no inference; budget ≤,
> not multiplied by group size, exactly 150 passes]
>
> [Reason ordering: per resident diet-before-allergen; residents in table order;
> allergens in dish ingredient order; OVER_BUDGET last. Forms DIET:<r>,
> ALLERGEN:<r>:<tag>, OVER_BUDGET]
>
> [Built-in group + dishes, verbatim]
>
> **Expected result (correctness check):** compatible = D01, D02; count 2;
> D03 → DIET:Asha, ALLERGEN:Mira:MILK; D04 → ALLERGEN:Dev:PEANUT;
> D05 → DIET:Asha, DIET:Dev.

**Design decision I made in the prompt:** baking the expected result into the
prompt gave the AI a target and gave me an immediate oracle to verify against.

---

## 2. Iteration — refining rather than accepting first output

**Test coverage, 15 → 25.** The first suite had 15 tests. On review I found gaps:
the diet rules weren't tested in isolation (only implied through the oracle), and
the built-in data was never itself validated. I refined the suite to 25 tests
adding each diet rule separately, empty-field validation, and a "built-in data
is valid" assertion.

---

## 3. Problem-solving — AI helping surface a blind spot

I asked whether a negative price in the *built-in data* would be caught by the
self-tests. Reasoning through it showed it would NOT: the compatibility rule only
rejects *over-budget* prices, not negative ones, and the validation tests used
synthetic bad rows rather than the built-in data. This exposed a real coverage
gap, which I closed with a validate-the-builtins test.

The useful outcome was conceptual: it made the separation between **validation**
(is the data well-formed?) and **compatibility** (which valid dishes work?)
explicit. They are two stages — validation gates, compatibility assumes valid
input — which is why compatibility tests don't (and shouldn't) fail on a negative
price: in the real flow, validation stops it before compatibility runs.

---

## 4. Modification rehearsal

I rehearsed a live modification — adding a `JAIN` diet class that accepts only
vegan dishes AND rejects any dish containing ONION or GARLIC — to confirm the
architecture supported clean changes.

My prompt for it:

> In `evaluateDish`, inside the resident loop, after the diet check and before
> the allergen loop, add a JAIN check: if the resident is JAIN and the dish has
> ONION or GARLIC, push `JAIN_INGREDIENT:<name>:<tag>` for every matching
> ingredient, in ingredient order. Also add `JAIN: ["VEGAN"]` to `DIET_ACCEPTS`.

**Design decisions I made:** placement after the diet check (it's diet-related,
so the reason should sit with diet, before allergens); a distinct reason prefix
`JAIN_INGREDIENT:` rather than reusing `DIET:` (the diet class actually matches —
vegan is fine — so reusing DIET would be misleading); forbidden ingredients kept
as a data array so adding a third is a one-word change, not new logic.

The change was local — one function edit plus one data line — and I verified it
with targeted tests (onion rejected; garlic+onion in ingredient order; diet
mismatch reason before the JAIN reason; non-JAIN residents unaffected) before
considering it done.
