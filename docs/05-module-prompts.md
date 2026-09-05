# Modular Build Prompts — run one at a time, verify each checkpoint

Master context to paste ONCE at the top of your session, then run the 5 module
prompts in order. Verify each checkpoint before running the next.

---

## MASTER CONTEXT (paste first)

> I'm building a **Hostel Food Compatibility Board** as a single self-contained
> HTML file — HTML + CSS + vanilla JS, no frameworks, no build step. All rule
> logic must be in **pure functions** (take data, return results, no DOM access),
> with the render layer kept separate, so I can unit-test the logic.
>
> I'll build it in 5 modules and verify each before the next. Don't write later
> modules until I ask. Here's the domain:
>
> **Group (budget ₹150/person):** Asha (VEGAN, no allergens), Dev (VEGETARIAN,
> allergen PEANUT), Mira (NO_RESTRICTION, allergen MILK).
> **Dishes (keep source order):** D01 Hostel Cafe / Lentil Rice Bowl / VEGAN /
> [LENTIL,RICE,SPINACH] / 110; D02 Library Cafe / Tomato Pasta / VEGAN /
> [WHEAT,TOMATO] / 150; D03 Hostel Cafe / Paneer Wrap / VEGETARIAN / [MILK,WHEAT]
> / 140; D04 East Cafe / Peanut Noodles / VEGAN / [PEANUT,WHEAT] / 130; D05
> Library Cafe / Egg Sandwich / NON_VEGETARIAN / [EGG,WHEAT] / 100.

---

## MODULE 1 — Data model + normalization

> Build only the data model. Define the built-in group and dishes as JS
> constants. Write a pure `normalize` step that trims and uppercases all diet
> classes, ingredient tags, and allergen tags. Render the group and dishes into
> two read-only HTML tables so I can see the data loaded.

**Checkpoint:** both tables render with the correct built-in data; diets/tags
show uppercased. No compatibility logic yet.

---

## MODULE 2 — Validation

> Add a pure `validate(group, dishes, budget)` that returns a list of error
> strings, run BEFORE any compatibility. Rules: resident names non-empty after
> trim; dish IDs/cafe/name non-empty after trim; dish IDs unique; budget and
> every price positive whole rupees. Error forms: `INVALID_INPUT: <table> / row
> <n> / <field>` and `DUPLICATE_DISH_ID: <table> / row <n> / id — "<id>"`.
> On any error, show the errors and clear any results.

**Checkpoint:** temporarily set a price to 0 or -10 → see INVALID_INPUT for that
row; duplicate an ID → see DUPLICATE_DISH_ID. Valid built-in data → no errors.

---

## MODULE 3 — Compatibility check (the core)

> Add a pure `evaluateDish(dish, group, budget)` returning
> `{ id, compatible, reasons }`. A dish is compatible only if it passes all three
> rules for EVERY resident:
> - Diet: VEGAN resident accepts only VEGAN; VEGETARIAN accepts VEGAN or
>   VEGETARIAN; NO_RESTRICTION accepts any.
> - Allergen: fail if any dish ingredient tag exactly equals any resident
>   allergen tag. No inference.
> - Budget: price ≤ budget. Exactly 150 passes. Do not multiply by group size.
>
> Reason ordering (exact): per resident in table order, diet reason before
> allergen reasons; multiple allergens in the DISH's ingredient order;
> OVER_BUDGET last. Forms: `DIET:<name>`, `ALLERGEN:<name>:<tag>`, `OVER_BUDGET`.
> Add `evaluateAll` to run it over all dishes in source order.

**Checkpoint:** built-in data → compatible [D01, D02]; D03 → DIET:Asha,
ALLERGEN:Mira:MILK; D04 → ALLERGEN:Dev:PEANUT; D05 → DIET:Asha, DIET:Dev.

---

## MODULE 4 — Display + search

> Render results: compatible dishes (source order), excluded dishes with their
> ordered reasons, and a compatible-count summary. Add a search box that filters
> only the DISPLAYED compatible dishes (case-insensitive substring on cafe, dish
> name, or any ingredient tag). The count must stay based on the UNFILTERED
> compatible result — compute the count before applying the search filter.

**Checkpoint:** search `wheat` → shows only D02, count still 2. Search `hostel` →
shows only D01, count still 2. Empty search → both show.

---

## MODULE 5 — Reset + self-tests

> Add a Reset that restores built-in group, dishes, ₹150 budget, empty search,
> and clears validation/results. Then add a "Run self-tests" button that runs
> assertions against the acceptance criteria (built-in oracle, budget boundary at
> 150 and 130, search decoupling, validation cases, each diet rule, empty group)
> and shows PASS/FAIL per test in the page.

**Checkpoint:** Reset returns clean state; Run self-tests shows all green.

---

## After the rebuild
- You now have a genuine iteration trail: 5 focused prompts, each verified.
- Capture 2–3 of these as your "iteration examples" deliverable — the real
  broad-context → module-specific → verify arc.
- If any module's first output missed a checkpoint, THAT is your best iteration
  example: show the miss, the refining prompt, and the fix.
