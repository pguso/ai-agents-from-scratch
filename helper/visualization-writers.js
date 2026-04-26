import fs from "fs";
import path from "path";

export function writeToTMotivationVisualization(outputDir, { scored, winnerName, analysis }) {
    const treeNodes = [
        { id: 0, parentId: null, depth: 0, thought: "Behavior input", lowerBound: 0, kept: true },
        ...scored.map((s, i) => ({
            id: i + 1,
            parentId: 0,
            depth: 1,
            thought: s.hypothesis.name,
            lowerBound: s.score,
            kept: s.hypothesis.name === winnerName
        })),
        {
            id: scored.length + 1,
            parentId: scored.findIndex((s) => s.hypothesis.name === winnerName) + 1,
            depth: 2,
            thought: "Conclusion from winner",
            lowerBound: scored.find((s) => s.hypothesis.name === winnerName)?.score ?? 0,
            kept: true
        }
    ];
    const winningIds = new Set(
        treeNodes
            .filter((n) => n.thought === winnerName || n.thought === "Conclusion from winner" || n.id === 0)
            .map((n) => n.id)
    );
    const nodes = treeNodes.map((n) => ({ ...n, winning: winningIds.has(n.id) }));
    const data = JSON.stringify({ nodes, analysis, winnerName });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Tree of Thought — Motivation Analysis</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #0f1117; color: #e2e8f0; }
  header { padding: 22px 32px 14px; border-bottom: 1px solid #1e2535; }
  header h1 { font-size: 1.28rem; font-weight: 700; color: #f7fafc; }
  header p { margin-top: 4px; font-size: .84rem; color: #a0aec0; }

  .topbar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 32px; background: #141820; border-bottom: 1px solid #1e2535;
    flex-wrap: wrap; gap: 12px;
  }
  .legend { display: flex; gap: 14px; font-size: .75rem; color: #94a3b8; }
  .leg-item { display: flex; align-items: center; gap: 6px; }
  .leg-dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid; }

  #canvas-wrap { position: relative; overflow-x: auto; padding: 26px 32px 18px; }
  #canvas { position: relative; min-height: 350px; min-width: 920px; }
  #lines { position: absolute; inset: 0; pointer-events: none; }

  .stage {
    position: absolute; top: 0; font-size: .69rem; letter-spacing: .08em;
    text-transform: uppercase; color: #64748b; font-weight: 700;
  }

  .node {
    position: absolute; width: 220px; border-radius: 10px; padding: 11px 12px 10px;
    border: 1.5px solid #2d3748; background: #161c27;
  }
  .node.root { background: #172033; border-color: #3b82f6; }
  .node.kept { background: #0f1e14; border-color: #2f7a50; }
  .node.win { background: #1e1600; border-color: #d4a017; border-width: 2px; }
  .node.pruned { opacity: .48; }
  .title { font-size: .79rem; line-height: 1.42; color: #e2e8f0; }
  .score {
    margin-top: 8px; display: inline-block; font-size: .66rem; color: #94a3b8;
    border: 1px solid #334155; border-radius: 999px; padding: 2px 7px;
  }

  #analysis {
    margin: 0 32px 28px; padding: 18px 22px; border-radius: 10px;
    border: 1px solid #1e2535; background: #141820;
  }
  #analysis h2 { font-size: .73rem; letter-spacing: .08em; text-transform: uppercase; color: #64748b; margin-bottom: 10px; }
  #summary { color: #cbd5e1; font-size: .9rem; line-height: 1.65; }
</style>
</head>
<body>
<header>
  <h1>Tree of Thought — Motivation Analysis</h1>
  <p>Branch hypotheses, score each branch, prune, conclude from one winner.</p>
</header>

<div class="topbar">
  <div class="legend">
    <span class="leg-item"><span class="leg-dot" style="background:#172033;border-color:#3b82f6"></span>Behavior input</span>
    <span class="leg-item"><span class="leg-dot" style="background:#0f1e14;border-color:#2f7a50"></span>Kept branch</span>
    <span class="leg-item"><span class="leg-dot" style="background:#1e1600;border-color:#d4a017"></span>Winning branch</span>
    <span class="leg-item"><span class="leg-dot" style="background:#161c27;border-color:#2d3748"></span>Pruned branch</span>
  </div>
</div>

<div id="canvas-wrap">
  <div id="canvas">
    <svg id="lines"></svg>
  </div>
</div>

<div id="analysis">
  <h2>Winner Summary</h2>
  <p id="summary"></p>
</div>

<script>
const D = ${data};
const nodes = D.nodes;
const canvas = document.getElementById("canvas");
const svg = document.getElementById("lines");

const byDepth = {};
for (const n of nodes) {
  if (!byDepth[n.depth]) byDepth[n.depth] = [];
  byDepth[n.depth].push(n);
}

const COL_X = { 0: 30, 1: 340, 2: 680 };
const ROW_GAP = 112;
const NODE_W = 220;
const NODE_H = 78;

const stageNames = {
  0: "Behavior",
  1: "Phase 1-3: Branch / Score / Prune",
  2: "Phase 4: Conclusion"
};

for (const [depth, label] of Object.entries(stageNames)) {
  const el = document.createElement("div");
  el.className = "stage";
  el.style.left = COL_X[depth] + "px";
  el.textContent = label;
  canvas.appendChild(el);
}

const pos = {};
for (const depthKey of Object.keys(byDepth)) {
  const depth = Number(depthKey);
  const list = byDepth[depth];
  list.forEach((n, i) => {
    pos[n.id] = {
      x: COL_X[depth],
      y: 36 + i * ROW_GAP
    };
  });
}

const maxY = Math.max(...Object.values(pos).map(p => p.y));
canvas.style.height = (maxY + NODE_H + 40) + "px";
svg.setAttribute("width", canvas.clientWidth);
svg.setAttribute("height", canvas.clientHeight);

for (const n of nodes) {
  const card = document.createElement("div");
  let cls = "node";
  if (n.depth === 0) cls += " root";
  else if (n.winning) cls += " win";
  else if (n.kept) cls += " kept";
  else cls += " pruned";
  card.className = cls;
  card.style.left = pos[n.id].x + "px";
  card.style.top = pos[n.id].y + "px";

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = n.thought;
  card.appendChild(title);

  if (n.depth > 0) {
    const score = document.createElement("div");
    score.className = "score";
    score.textContent = "Score: " + n.lowerBound;
    card.appendChild(score);
  }
  canvas.appendChild(card);
}

function drawLine(parent, child, color, width, dashed = false, opacity = 1) {
  const x1 = pos[parent.id].x + NODE_W;
  const y1 = pos[parent.id].y + NODE_H / 2;
  const x2 = pos[child.id].x;
  const y2 = pos[child.id].y + NODE_H / 2;
  const cx = (x1 + x2) / 2;
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", "M" + x1 + "," + y1 + " C" + cx + "," + y1 + " " + cx + "," + y2 + " " + x2 + "," + y2);
  p.setAttribute("fill", "none");
  p.setAttribute("stroke", color);
  p.setAttribute("stroke-width", width);
  p.setAttribute("opacity", opacity);
  if (dashed) p.setAttribute("stroke-dasharray", "6,4");
  svg.appendChild(p);
}

for (const n of nodes) {
  if (n.parentId == null) continue;
  const p = nodes.find(x => x.id === n.parentId);
  const winningEdge = n.winning && p && p.winning;
  drawLine(
    p,
    n,
    winningEdge ? "#d4a017" : (n.kept ? "#2f7a50" : "#334155"),
    winningEdge ? 2.4 : 1.4,
    !n.kept,
    n.kept ? 1 : 0.35
  );
}

document.getElementById("summary").textContent = D.analysis.summary || "";
</script>
</body>
</html>`;

    const outPath = path.join(outputDir, "visualization.html");
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`\nVisualization written -> ${outPath}`);
    console.log("Open with: open examples/12_tree-of-thought/visualization.html\n");
}

export function writeGoTMotivationVisualization(outputDir, graph, conclusion) {
    const nodes = [...graph.nodes.values()].map((n) => ({
        id: n.id,
        type: n.type,
        content: String(n.content),
        score: n.score,
        parentIds: graph.edges.get(n.id) || []
    }));
    const data = JSON.stringify({ nodes, conclusion });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Graph of Thought — Motivation Analysis</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #0f1117; color: #e2e8f0; }
  header { padding: 22px 32px 14px; border-bottom: 1px solid #1e2535; }
  header h1 { font-size: 1.25rem; color: #f8fafc; }
  header p { margin-top: 4px; font-size: .84rem; color: #94a3b8; }

  .topbar {
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
    padding: 10px 32px; background: #141820; border-bottom: 1px solid #1e2535;
  }
  .legend { display: flex; gap: 14px; font-size: .75rem; color: #94a3b8; flex-wrap: wrap; }
  .leg-item { display: flex; align-items: center; gap: 6px; }
  .leg-dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid; }

  #canvas-wrap { padding: 24px 32px 18px; overflow: auto; }
  #canvas { position: relative; min-height: 980px; min-width: 1620px; }
  #links { position: absolute; inset: 0; pointer-events: none; }
  .edge { transition: stroke .12s, stroke-width .12s, opacity .12s; }
  .edge.dim { opacity: 0.12 !important; }
  .edge.active {
    stroke: #f6e05e !important;
    stroke-width: 2.6 !important;
    opacity: 1 !important;
  }
  .stage { position: absolute; top: 0; font-size: .68rem; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }

  .node {
    position: absolute; width: 240px; border-radius: 10px; border: 1.5px solid #2d3748;
    background: #161c27; padding: 10px 11px; transition: transform .12s;
  }
  .node:hover { transform: translateY(-1px); }
  .node.root { background: #172033; border-color: #3b82f6; }
  .node.hypothesis { background: #1a202c; border-color: #475569; }
  .node.contrast { background: #1f170a; border-color: #b7791f; }
  .node.refined { background: #132025; border-color: #0ea5a6; }
  .node.synthesis { background: #15231a; border-color: #2f7a50; }
  .node.conclusion { background: #1e1600; border-color: #d4a017; border-width: 2px; }
  .meta { font-size: .66rem; color: #93a0b3; margin-bottom: 6px; }
  .text { font-size: .77rem; line-height: 1.45; color: #e2e8f0; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .score { display: inline-block; margin-top: 7px; font-size: .65rem; color: #a0aec0; border: 1px solid #334155; border-radius: 999px; padding: 2px 7px; }

  #result {
    margin: 0 32px 28px; border: 1px solid #1e2535; border-radius: 10px; background: #141820; padding: 16px 18px;
  }
  #result h2 { font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: #64748b; margin-bottom: 10px; }
  .label { margin-top: 9px; margin-bottom: 4px; color: #8aa0bb; font-size: .74rem; }
  .body { font-size: .84rem; line-height: 1.62; color: #dbe7f5; }
  ul { margin-left: 18px; }
</style>
</head>
<body>
<header>
  <h1>Graph of Thought — Motivation Analysis</h1>
  <p>Branch, score, contrast, refine, aggregate, and conclude with multi-parent graph nodes.</p>
</header>

<div class="topbar">
  <div class="legend">
    <span class="leg-item"><span class="leg-dot" style="background:#172033;border-color:#3b82f6"></span>Root</span>
    <span class="leg-item"><span class="leg-dot" style="background:#1a202c;border-color:#475569"></span>Hypothesis</span>
    <span class="leg-item"><span class="leg-dot" style="background:#1f170a;border-color:#b7791f"></span>Contrast</span>
    <span class="leg-item"><span class="leg-dot" style="background:#132025;border-color:#0ea5a6"></span>Refined</span>
    <span class="leg-item"><span class="leg-dot" style="background:#15231a;border-color:#2f7a50"></span>Synthesis</span>
    <span class="leg-item"><span class="leg-dot" style="background:#1e1600;border-color:#d4a017"></span>Conclusion</span>
  </div>
</div>

<div id="canvas-wrap">
  <div id="canvas">
    <svg id="links"></svg>
  </div>
</div>

<section id="result">
  <h2>Final Conclusion</h2>
  <div class="label">Core motivation</div>
  <div class="body" id="core"></div>
  <div class="label">Psychological picture</div>
  <div class="body" id="picture"></div>
  <div class="label">Contradictions as signal</div>
  <div class="body" id="contradictions"></div>
  <div class="label">Recommendation</div>
  <div class="body" id="recommendation"></div>
  <div class="label">What ToT would miss</div>
  <ul class="body" id="missed"></ul>
</section>

<script>
const D = ${data};
const canvas = document.getElementById("canvas");
const svg = document.getElementById("links");

const typeToCol = {
  root: 0,
  hypothesis: 1,
  contrast: 2,
  refined: 3,
  synthesis: 4,
  conclusion: 5
};
const colTitle = {
  0: "Root",
  1: "Phase 1-2: Branch / Score",
  2: "Phase 3: Contrast",
  3: "Phase 4: Refine",
  4: "Phase 5: Synthesis",
  5: "Phase 6: Conclusion"
};

const COL_X = [30, 320, 610, 900, 1190, 1480];
const NODE_W = 240;
const NODE_H = 92;
const ROW_GAP = 156;

const cols = {};
for (const n of D.nodes) {
  const c = typeToCol[n.type] ?? 1;
  if (!cols[c]) cols[c] = [];
  cols[c].push(n);
}

const pos = {};
for (const [col, arr] of Object.entries(cols)) {
  arr.forEach((n, idx) => {
    pos[n.id] = { x: COL_X[col], y: 36 + idx * ROW_GAP };
  });
}

const maxY = Math.max(...Object.values(pos).map(p => p.y));
canvas.style.height = (maxY + NODE_H + 34) + "px";
svg.setAttribute("width", canvas.clientWidth);
svg.setAttribute("height", canvas.clientHeight);

for (const [col, title] of Object.entries(colTitle)) {
  const t = document.createElement("div");
  t.className = "stage";
  t.style.left = COL_X[col] + "px";
  t.textContent = title;
  canvas.appendChild(t);
}

for (const n of D.nodes) {
  const card = document.createElement("div");
  card.className = "node " + n.type;
  card.dataset.nodeId = n.id;
  card.style.left = pos[n.id].x + "px";
  card.style.top = pos[n.id].y + "px";
  const parents = n.parentIds.length ? n.parentIds.join(", ") : "root";
  card.innerHTML =
    "<div class='meta'>[" + n.id + "] " + n.type + " | parents: " + parents + "</div>" +
    "<div class='text'>" + n.content + "</div>" +
    (n.score > 0 ? "<div class='score'>Score: " + n.score + "</div>" : "");
  canvas.appendChild(card);
}

function draw(parentId, childId) {
  const p = pos[parentId];
  const c = pos[childId];
  if (!p || !c) return;
  const x1 = p.x + NODE_W;
  const y1 = p.y + NODE_H / 2;
  const x2 = c.x;
  const y2 = c.y + NODE_H / 2;
  const cx = (x1 + x2) / 2;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M" + x1 + "," + y1 + " C" + cx + "," + y1 + " " + cx + "," + y2 + " " + x2 + "," + y2);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#334155");
  path.setAttribute("stroke-width", "1.4");
  path.setAttribute("opacity", "0.75");
  path.setAttribute("class", "edge");
  path.dataset.parentId = parentId;
  path.dataset.childId = childId;
  svg.appendChild(path);
}

for (const n of D.nodes) {
  for (const pId of n.parentIds) {
    draw(pId, n.id);
  }
}

const edgeEls = [...document.querySelectorAll(".edge")];
const nodeEls = [...document.querySelectorAll(".node")];

function clearEdgeHighlight() {
  edgeEls.forEach((e) => {
    e.classList.remove("active", "dim");
  });
}

function highlightEdgesForNode(nodeId) {
  edgeEls.forEach((e) => {
    const isConnected = e.dataset.parentId === nodeId || e.dataset.childId === nodeId;
    if (isConnected) {
      e.classList.add("active");
      e.classList.remove("dim");
    } else {
      e.classList.remove("active");
      e.classList.add("dim");
    }
  });
}

nodeEls.forEach((nodeEl) => {
  nodeEl.addEventListener("mouseenter", () => {
    highlightEdgesForNode(nodeEl.dataset.nodeId);
  });
  nodeEl.addEventListener("mouseleave", () => {
    clearEdgeHighlight();
  });
});

document.getElementById("core").textContent = D.conclusion.core_motivation || "";
document.getElementById("picture").textContent = D.conclusion.psychological_picture || "";
document.getElementById("contradictions").textContent = D.conclusion.contradictions_as_signal || "";
document.getElementById("recommendation").textContent = D.conclusion.recommendation || "";
const missed = document.getElementById("missed");
for (const item of (D.conclusion.what_tot_missed || [])) {
  const li = document.createElement("li");
  li.textContent = item;
  missed.appendChild(li);
}
</script>
</body>
</html>`;

    const outPath = path.join(outputDir, "visualization.html");
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`\nVisualization written -> ${outPath}`);
    console.log("Open with: open examples/13_graph-of-thought/visualization.html\n");
}

export function writeCoTReturnVisualization(
    outputDir,
    { returnCase, policy, facts, redFlags, legitimacy, policyResult, decision }
) {
    const data = JSON.stringify({
        returnCase,
        policy,
        facts,
        redFlags,
        legitimacy,
        policyResult,
        decision
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Chain of Thought - Return Decision</title>
<style>
  :root {
    --bg: #f6f7f9;
    --surface: #ffffff;
    --border: #e4e7eb;
    --border-strong: #d4d8df;
    --text: #111827;
    --text-muted: #4b5563;
    --text-subtle: #6b7280;
    --accent: #1f2937;
    --blue: #2563eb;
    --orange: #c2410c;
    --teal: #0f766e;
    --amber: #b45309;
    --indigo: #4338ca;
    --green: #16a34a;
    --red: #b91c1c;
    --gray: #6b7280;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--text); }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
  }
  .page { max-width: 1440px; margin: 0 auto; padding: 32px 32px 40px; }

  header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .title-row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
  h1 { font-size: 1.25rem; font-weight: 600; color: var(--text); letter-spacing: -0.005em; }
  .subtitle { margin-top: 4px; color: var(--text-muted); font-size: 0.875rem; }
  .case-badge {
    border: 1px solid var(--border); background: var(--surface); color: var(--text-muted);
    border-radius: 4px; padding: 4px 10px; font-size: 0.75rem;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  }

  .scoreboard {
    display: grid; grid-template-columns: repeat(5, minmax(160px, 1fr));
    gap: 0; margin-bottom: 24px;
    border: 1px solid var(--border); border-radius: 6px;
    background: var(--surface); overflow: hidden;
  }
  .metric { padding: 14px 16px; border-right: 1px solid var(--border); }
  .metric:last-child { border-right: none; }
  .metric .k {
    color: var(--text-subtle); font-size: 0.7rem;
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;
  }
  .metric .v {
    margin-top: 6px; font-size: 1.125rem; font-weight: 600; color: var(--text);
  }
  .metric.decision .v { text-transform: capitalize; }
  .metric.policy .v { text-transform: capitalize; }

  .section-title {
    font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.07em;
    color: var(--text-subtle); font-weight: 600; margin-bottom: 10px;
  }

  .timeline {
    display: grid;
    grid-template-columns: repeat(5, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  .phase {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0;
    display: flex; flex-direction: column;
  }
  .phase-head {
    padding: 12px 14px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .phase-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 4px;
    background: #f3f4f6; color: var(--text-muted);
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 0.75rem; font-weight: 600;
    border: 1px solid var(--border);
  }
  .phase.facts .phase-num { color: var(--blue); border-color: #c7d7fa; background: #eff4ff; }
  .phase.red .phase-num { color: var(--orange); border-color: #f7d2bc; background: #fef1e7; }
  .phase.legit .phase-num { color: var(--teal); border-color: #b8dfd8; background: #ecf6f4; }
  .phase.policy .phase-num { color: var(--amber); border-color: #f0d8aa; background: #fdf3df; }
  .phase.decision .phase-num { color: var(--indigo); border-color: #cfd0f5; background: #eef0fe; }
  .phase h3 { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .phase .tag {
    margin-left: auto; font-size: 0.7rem; color: var(--text-subtle);
  }

  .phase-body { padding: 12px 14px; flex: 1; display: flex; flex-direction: column; gap: 10px; }

  .list { display: flex; flex-direction: column; }
  .item {
    font-size: 0.78rem; line-height: 1.5; color: var(--text);
    padding: 8px 0; border-bottom: 1px solid var(--border);
    display: flex; align-items: flex-start; gap: 8px;
  }
  .item:last-child { border-bottom: none; }
  .item b { font-weight: 600; color: var(--text); }
  .item .label-text { color: var(--text-muted); font-weight: 500; }

  .status {
    display: inline-flex; align-items: center;
    font-size: 0.68rem; font-weight: 600;
    padding: 1px 7px; border-radius: 3px;
    border: 1px solid; line-height: 1.5;
    text-transform: uppercase; letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .status.pass { color: var(--green); border-color: #b7e0c1; background: #e9f7ec; }
  .status.fail { color: var(--red); border-color: #f1bdbd; background: #fbe9e9; }
  .status.review { color: var(--amber); border-color: #f0d8aa; background: #fdf3df; }
  .status.neutral { color: var(--text-subtle); border-color: var(--border); background: #f6f7f9; }

  .strength {
    display: inline-flex; align-items: center;
    font-size: 0.65rem; font-weight: 600;
    padding: 1px 6px; border-radius: 3px;
    border: 1px solid; line-height: 1.5;
    text-transform: uppercase; letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .strength.high { color: #166534; border-color: #c1e3c8; background: #edf6ee; }
  .strength.medium { color: var(--amber); border-color: #f0d8aa; background: #fdf3df; }
  .strength.low { color: var(--text-subtle); border-color: var(--border); background: #f6f7f9; }

  .meter { margin-top: auto; padding-top: 10px; }
  .meter .label {
    font-size: 0.7rem; color: var(--text-muted); margin-bottom: 6px;
    display: flex; justify-content: space-between;
  }
  .meter .label span:last-child { font-weight: 600; color: var(--text); }
  .bar {
    width: 100%; height: 6px; border-radius: 3px;
    background: #eef0f3; overflow: hidden;
  }
  .fill { height: 100%; border-radius: 3px; }
  .fill.fraud { background: var(--orange); }
  .fill.legit { background: var(--teal); }

  .decision-panel {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 18px 20px;
  }
  .decision-panel h2 {
    font-size: 0.7rem; letter-spacing: 0.07em;
    text-transform: uppercase; font-weight: 600;
    color: var(--text-subtle); margin-bottom: 10px;
  }
  .reasoning {
    font-size: 0.875rem; line-height: 1.65; color: var(--text);
  }

  @media (max-width: 1100px) {
    .scoreboard { grid-template-columns: repeat(2, 1fr); }
    .metric { border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); }
    .metric:nth-child(2n) { border-right: none; }
    .timeline { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <main class="page">
    <header>
      <div class="title-row">
        <div>
          <h1>Chain of Thought - Return Decision</h1>
          <div class="subtitle">Structured reasoning across five explicit phases before final action.</div>
        </div>
        <div class="case-badge">Case ${returnCase.request_id || "n/a"}</div>
      </div>
    </header>

    <section class="scoreboard">
      <article class="metric decision"><div class="k">Final Decision</div><div class="v" id="mDecision"></div></article>
      <article class="metric"><div class="k">Confidence</div><div class="v" id="mConfidence"></div></article>
      <article class="metric"><div class="k">Fraud Score</div><div class="v" id="mFraud"></div></article>
      <article class="metric"><div class="k">Legitimacy Score</div><div class="v" id="mLegit"></div></article>
      <article class="metric policy"><div class="k">Policy Outcome</div><div class="v" id="mPolicy"></div></article>
    </section>

    <div class="section-title">Reasoning Phases</div>
    <section class="timeline" id="timeline"></section>

    <section class="decision-panel">
      <h2>Decision Reasoning</h2>
      <div class="reasoning" id="reasoning"></div>
    </section>
  </main>

<script>
const D = ${data};
const timeline = document.getElementById("timeline");

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function statusBadge(raw) {
  const x = String(raw || "").toLowerCase();
  if (x === "present" || x === "pass") return '<span class="status pass">' + escapeHtml(raw) + '</span>';
  if (x === "not_present" || x === "fail") return '<span class="status fail">' + escapeHtml(raw) + '</span>';
  if (x === "manual_review_trigger" || x === "manual_review") return '<span class="status review">' + escapeHtml(raw) + '</span>';
  return '<span class="status neutral">' + escapeHtml(raw || "unclear") + '</span>';
}

function strengthBadge(raw) {
  const x = String(raw || "").toLowerCase();
  const cls = (x === "high" || x === "medium" || x === "low") ? x : "low";
  return '<span class="strength ' + cls + '">' + escapeHtml(raw) + '</span>';
}

function makePhase({ cls, num, title, tag, lines, meter }) {
  const el = document.createElement("article");
  el.className = "phase " + cls;

  const head = document.createElement("div");
  head.className = "phase-head";
  head.innerHTML =
    '<span class="phase-num">' + num + '</span>' +
    '<h3>' + escapeHtml(title) + '</h3>' +
    '<span class="tag">' + escapeHtml(tag) + '</span>';
  el.appendChild(head);

  const body = document.createElement("div");
  body.className = "phase-body";

  const list = document.createElement("div");
  list.className = "list";
  lines.forEach((html) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = html;
    list.appendChild(item);
  });
  body.appendChild(list);

  if (meter) {
    const m = document.createElement("div");
    m.className = "meter";
    const pct = Math.max(0, Math.min(100, meter.value * 10));
    m.innerHTML =
      '<div class="label"><span>' + escapeHtml(meter.label) + '</span><span>' + meter.value.toFixed(1) + '/10</span></div>' +
      '<div class="bar"><div class="fill ' + meter.kind + '" style="width:' + pct + '%"></div></div>';
    body.appendChild(m);
  }

  el.appendChild(body);
  return el;
}

const facts = (D.facts.extracted_facts || []).slice(0, 5).map((f) => {
  return '<span>' + escapeHtml(f) + '</span>';
});
const red = (D.redFlags.checkpoints || []).slice(0, 5).map((c) => {
  return '<span class="label-text">' + escapeHtml(c.check) + '</span>' + statusBadge(c.status);
});
const legit = (D.legitimacy.customer_supporting_points || []).slice(0, 5).map((p) => {
  return '<span>' + escapeHtml(p.point) + '</span>' + strengthBadge(p.strength);
});
const rules = (D.policyResult.policy_checks || []).slice(0, 5).map((r) => {
  return '<span class="label-text">' + escapeHtml(r.rule) + '</span>' + statusBadge(r.status);
});
const decisionLines = [
  '<span class="label-text">Customer</span><span>' + escapeHtml(D.decision.customer_message || "n/a") + '</span>',
  '<span class="label-text">Internal</span><span>' + escapeHtml(D.decision.internal_note || "n/a") + '</span>'
];

timeline.appendChild(makePhase({
  cls: "facts", num: "1", title: "Facts", tag: "No judgment",
  lines: facts.length ? facts : ['<span>No extracted facts</span>']
}));
timeline.appendChild(makePhase({
  cls: "red", num: "2", title: "Red Flags", tag: "Fraud screening",
  lines: red.length ? red : ['<span>No red flag checks</span>'],
  meter: { label: "Fraud score", value: Number(D.redFlags.fraud_score || 0), kind: "fraud" }
}));
timeline.appendChild(makePhase({
  cls: "legit", num: "3", title: "Legitimacy", tag: "Customer view",
  lines: legit.length ? legit : ['<span>No legitimacy points</span>'],
  meter: { label: "Legitimacy score", value: Number(D.legitimacy.legitimacy_score || 0), kind: "legit" }
}));
timeline.appendChild(makePhase({
  cls: "policy", num: "4", title: "Policy Check", tag: "Rule-constrained",
  lines: rules.length ? rules : ['<span>No policy checks</span>']
}));
timeline.appendChild(makePhase({
  cls: "decision", num: "5", title: "Decision", tag: "Final output",
  lines: decisionLines
}));

document.getElementById("mDecision").textContent = D.decision.final_decision || "n/a";
document.getElementById("mConfidence").textContent = Number(D.decision.confidence || 0).toFixed(2);
document.getElementById("mFraud").textContent = Number(D.redFlags.fraud_score || 0).toFixed(1) + "/10";
document.getElementById("mLegit").textContent = Number(D.legitimacy.legitimacy_score || 0).toFixed(1) + "/10";
document.getElementById("mPolicy").textContent = D.policyResult.policy_outcome || "n/a";
document.getElementById("reasoning").textContent = D.decision.decision_reasoning || "";
</script>
</body>
</html>`;

    const outPath = path.join(outputDir, "visualization.html");
    fs.writeFileSync(outPath, html, "utf8");
    console.log(`\nVisualization written -> ${outPath}`);
    console.log("Open with: open examples/14_chain-of-thought/visualization.html\n");
}
