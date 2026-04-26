# Code explanation: `graph-of-thought.js`

This is a code-first walkthrough of the GoT implementation used in Example 13.

## Run

```bash
node examples/13_graph-of-thought/graph-of-thought.js
```

---

## 1) Core graph object: `ThoughtGraph`

`ThoughtGraph` is the central data structure.

### Stored state

- `nodes: Map<string, node>`
- `edges: Map<string, parentId[]>`
- `nextId` for sequential node ids (`n1`, `n2`, ...)

### Key methods

- `addNode(type, content, meta, parentIds)`
- `get(id)`
- `parents(id)`
- `byType(type)`
- `printGraph()` (debug trace of all nodes + edges)

This is what makes the example truly graph-based instead of tree-based.

---

## 2) Shared JSON call utility: `promptJson()`

`promptJson(schema, userText)` is reused by every operation:

- resets chat history,
- enforces schema grammar,
- parses JSON safely.

All operation functions are then clean and focused on graph logic.

---

## 3) Phase functions (and the node type each creates)

### `branch(...)` -> `hypothesis` nodes

- input: root behavior + hypothesis lenses
- output: one node per lens
- parent: always root

### `scoreAll(...)` -> updates `score` on hypothesis nodes

- raw criterion scoring per hypothesis
- strict reranking pass (no ties) with calibrated spread
- writes score back into graph nodes

### `contrast(...)` -> `contrast` node

- input: two hypothesis nodes
- output: contradiction node
- parents: both compared nodes

### `refine(...)` -> `refined` node

- input: weak node + strong node/context
- output: improved version of weak argument
- parents: both source nodes

### `aggregate(...)` -> `synthesis` node

- input: multiple source nodes
- output: integrated synthesis
- parents: all source nodes

### `conclude(...)` -> `conclusion` node

- input: selected high-value strands
- output: final integrated analysis
- parents: multiple synthesis/contrast/refined nodes

---

## 4) Controller flow: `runGoTMotivationAnalysis()`

This function orchestrates everything:

1. create `root`
2. branch into 4 hypotheses
3. score + rerank hypotheses
4. build contrast nodes
5. refine weak/medium nodes
6. create two synthesis nodes
7. conclude from multiple strands
8. print graph + final narrative + generate visualization

The ranking step affects which nodes are considered `strongA`, `strongB`, `medium`, `weak`, which then influences contrast/refine selection.

---

## 5) Why this is GoT in code (not just in concept)

Look at parent arrays in `addNode(...)` calls:

- `contrast`: two parents
- `refine`: two parents
- `aggregate`: many parents
- `conclusion`: many parents

Multiple-parent nodes are impossible in strict tree search; they are the concrete code signature of GoT.

---

## 6) Visualization integration

Visualization logic is intentionally extracted to helper code:

- `writeGoTMotivationVisualization(...)`

So this example file stays focused on graph operations and orchestration.

---

## Suggested code-reading order

1. `ThoughtGraph` class
2. `promptJson`
3. `branch`
4. `scoreAll`
5. `contrast`
6. `refine`
7. `aggregate`
8. `conclude`
9. `runGoTMotivationAnalysis`

This gives you the same order as runtime execution and the cleanest learning path.
