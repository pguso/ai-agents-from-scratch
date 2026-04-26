# Code explanation: `tree-of-thought.js`

This walkthrough follows the actual code structure, so you can map each ToT concept to concrete functions.

## Run

```bash
node examples/12_tree-of-thought/tree-of-thought.js
```

---

## 1) Setup: model, schemas, constants

At the top of the file:

- `HYPOTHESIS_TYPES` defines the four competing branches.
- `BEHAVIOR_INPUT` is the case description.
- `hypothesisSchema`, `scoreSchema`, `rankingSchema`, `analysisSchema` define the JSON contracts for each phase.
- `promptJson(schema, userText)` is the shared utility that:
  - resets chat history,
  - enforces schema grammar,
  - parses/repairs JSON.

This keeps each phase function focused on logic, not parser boilerplate.

---

## 2) Phase 1 (Branch): `developHypothesis()`

`developHypothesis(behavior, hypothesisType)` does one thing:

- prompts the model to reason through exactly one lens,
- returns a structured object:
  - `name`
  - `argument`
  - `signals`
  - `counter_evidence`

In `runTreeOfThoughtMotivationAnalysis()`, this runs in a loop over `HYPOTHESIS_TYPES`, creating four competing branches.

---

## 3) Phase 2 (Score): `scoreHypothesis()` + `rerankHypotheses()`

### Raw per-branch scoring

`scoreHypothesis(behavior, hypothesis)` returns:

- `score` (raw numeric score from formula),
- `details` (`explanatory_power`, `plausibility`, `falsifiability`),
- `blindSpot`,
- `reasoning`.

### Anti-tie calibration pass

`rerankHypotheses(behavior, scoredHypotheses)` forces a strict ranking with no ties and then maps ranks to calibrated scores:

- rank1 -> `8.8`
- rank2 -> `8.1`
- rank3 -> `7.4`
- rank4 -> `6.7`

This is why the console shows:

- captured raw evaluations
- then calibrated scores used for pruning

So learners see what the system *actually* uses for branch selection.

---

## 4) Phase 3 (Prune): `pruneHypotheses()`

`pruneHypotheses(scoredHypotheses)`:

- sorts descending by score,
- keeps the winner,
- returns `discarded` branches.

This is the structural heart of ToT in this example: one winner continues, alternatives are dropped.

---

## 5) Phase 4 (Conclusion): `createConclusion()`

`createConclusion(behavior, winner)` builds the final analysis using only:

- winner name
- winner argument
- winner signals

Discarded branches do not feed into the final answer.  
That intentional limitation is shown in the console block: `WHAT TOT LOST IN THIS RUN`.

---

## 6) Orchestration flow: `runTreeOfThoughtMotivationAnalysis()`

This function is the end-to-end controller:

1. branch (collect hypotheses)
2. score (raw + calibrated)
3. prune (winner + discarded)
4. conclude (winner only)
5. print output + call visualization helper

Visualization is intentionally delegated to:

- `writeToTMotivationVisualization(...)`

so the example file stays focused on ToT control flow.

---

## Suggested code-reading order

Read functions in this sequence:

1. `promptJson`
2. `developHypothesis`
3. `scoreHypothesis`
4. `rerankHypotheses`
5. `pruneHypotheses`
6. `createConclusion`
7. `runTreeOfThoughtMotivationAnalysis`

That order mirrors the runtime flow and makes the file much easier to understand.
