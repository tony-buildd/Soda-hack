const INPUT_URL = "../data/synthetic_input.json";
const MCMF_URL = "../output/allocation_mcmf.json";
const GREEDY_URL = "../output/allocation_greedy.json";

const API_CURRENT_URL = "/api/optimizer/current";
const API_RUN_JSON_URL = "/api/optimizer/json";
const API_RUN_CSV_URL = "/api/optimizer/csv";

const teacherColor = "#277da1";
const schoolColor = "#e76f51";
const lineColor = "#2f9d8f";

const state = {
  input: null,
  results: {},
  map: null,
  linesLayer: null,
  charts: {
    coverage: null,
    travel: null,
    fairness: null,
  },
  teachersById: {},
  schoolsById: {},
  backendReady: false,
};

function byId(id) {
  return document.getElementById(id);
}

function setStatus(message) {
  byId("statusText").textContent = message;
}

function setControlEnabled(enabled) {
  byId("runJsonBtn").disabled = !enabled;
  byId("runCsvBtn").disabled = !enabled;
  byId("csvFileInput").disabled = !enabled;
}

async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  return res.json();
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

async function postForm(url, formData) {
  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

function indexById(list) {
  const out = {};
  for (const item of list) {
    out[item.id] = item;
  }
  return out;
}

function avgCenter(schools) {
  if (!schools.length) {
    return [21.02, 105.84];
  }
  let lat = 0;
  let lng = 0;
  for (const s of schools) {
    lat += s.location[0];
    lng += s.location[1];
  }
  return [lat / schools.length, lng / schools.length];
}

function setData(bundle) {
  state.input = bundle.input;
  state.results = { mcmf: bundle.mcmf, greedy: bundle.greedy };
  state.teachersById = indexById(state.input.teachers);
  state.schoolsById = indexById(state.input.schools);
}

function setupMap() {
  if (state.map) {
    state.map.remove();
  }

  const center = avgCenter(state.input.schools);
  state.map = L.map("map").setView(center, 8);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(state.map);

  for (const t of state.input.teachers) {
    L.circleMarker(t.base, {
      radius: 6,
      color: teacherColor,
      fillColor: teacherColor,
      fillOpacity: 0.85,
    })
      .bindPopup(`<b>${t.name}</b><br/>${t.id}<br/>Capacity: ${t.capacity}`)
      .addTo(state.map);
  }

  for (const s of state.input.schools) {
    L.circleMarker(s.location, {
      radius: 8,
      color: schoolColor,
      fillColor: schoolColor,
      fillOpacity: 0.9,
    })
      .bindPopup(`<b>${s.name}</b><br/>${s.id}<br/>Priority: ${s.priority}`)
      .addTo(state.map);
  }

  state.linesLayer = L.layerGroup().addTo(state.map);
}

function drawLines(allocations) {
  state.linesLayer.clearLayers();

  for (const alloc of allocations) {
    const teacher = state.teachersById[alloc.teacher];
    const school = state.schoolsById[alloc.school];
    if (!teacher || !school || alloc.hours <= 0) {
      continue;
    }

    L.polyline([teacher.base, school.location], {
      color: lineColor,
      weight: 1 + Math.min(alloc.hours, 12) / 3,
      opacity: 0.75,
    })
      .bindTooltip(`${alloc.teacher} -> ${alloc.school} (${alloc.subject}: ${alloc.hours}h)`)
      .addTo(state.linesLayer);
  }
}

function renderKPI(kpi) {
  byId("coverageValue").textContent = `${kpi.coverage_pct.toFixed(2)}%`;
  byId("travelValue").textContent = `${kpi.total_travel_km.toFixed(1)} km`;
  byId("fairnessValue").textContent = kpi.workload_std.toFixed(2);
}

function renderAllocTable(allocations) {
  const tbody = byId("allocTable").querySelector("tbody");
  tbody.innerHTML = "";

  if (!allocations.length) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"4\">No allocations</td>";
    tbody.appendChild(row);
    return;
  }

  for (const alloc of allocations) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${alloc.teacher}</td>
      <td>${alloc.school}</td>
      <td>${alloc.subject}</td>
      <td>${alloc.hours}</td>
    `;
    tbody.appendChild(row);
  }
}

function renderUnmet(unmet) {
  const ul = byId("unmetList");
  ul.innerHTML = "";

  if (!unmet.length) {
    const li = document.createElement("li");
    li.textContent = "No unmet demand.";
    ul.appendChild(li);
    return;
  }

  for (const item of unmet) {
    const li = document.createElement("li");
    li.textContent = `${item.school} - ${item.subject}: missing ${item.missing_hours}h`;
    ul.appendChild(li);
  }
}

function destroyComparisonCharts() {
  for (const key of Object.keys(state.charts)) {
    if (state.charts[key]) {
      state.charts[key].destroy();
      state.charts[key] = null;
    }
  }
}

function createComparisonChart(canvasId, axisLabel, mValue, gValue) {
  return new Chart(byId(canvasId), {
    type: "bar",
    data: {
      labels: ["MCMF", "Greedy"],
      datasets: [
        {
          label: axisLabel,
          data: [mValue, gValue],
          backgroundColor: ["rgba(47,157,143,0.75)", "rgba(214,108,47,0.72)"],
          borderColor: ["rgba(47,157,143,1)", "rgba(214,108,47,1)"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: axisLabel,
          },
        },
      },
    },
  });
}

function renderCharts() {
  const m = state.results.mcmf.kpi;
  const g = state.results.greedy.kpi;

  destroyComparisonCharts();
  state.charts.coverage = createComparisonChart(
    "coverageChart",
    "Coverage (%)",
    m.coverage_pct,
    g.coverage_pct
  );
  state.charts.travel = createComparisonChart(
    "travelChart",
    "Travel (km)",
    m.total_travel_km,
    g.total_travel_km
  );
  state.charts.fairness = createComparisonChart(
    "fairnessChart",
    "Workload Std",
    m.workload_std,
    g.workload_std
  );
}

function renderSelected(algorithm) {
  const result = state.results[algorithm];
  if (!result) {
    return;
  }

  renderKPI(result.kpi);
  renderAllocTable(result.allocations);
  renderUnmet(result.kpi.unmet_demand);
  drawLines(result.allocations);
  setStatus(`Showing ${algorithm.toUpperCase()}`);
}

function syncManualJsonBox() {
  byId("manualJsonInput").value = JSON.stringify(state.input, null, 2);
}

function applyBundle(bundle, sourceText) {
  setData(bundle);
  setupMap();
  renderCharts();
  syncManualJsonBox();
  renderSelected(byId("algorithmSelect").value);
  setStatus(sourceText);
}

async function runFromJson() {
  if (!state.backendReady) {
    setStatus("Backend API is not available. Start Flask app to enable this.");
    return;
  }

  const text = byId("manualJsonInput").value.trim();
  if (!text) {
    setStatus("JSON input is empty.");
    return;
  }

  try {
    setStatus("Running C++ optimizer from JSON...");
    const input = JSON.parse(text);
    const bundle = await postJson(API_RUN_JSON_URL, { input });
    applyBundle(bundle, "Updated from manual JSON input");
  } catch (err) {
    setStatus(`Run failed: ${err.message}`);
    console.error(err);
  }
}

async function runFromCsv() {
  if (!state.backendReady) {
    setStatus("Backend API is not available. Start Flask app to enable this.");
    return;
  }

  const fileInput = byId("csvFileInput");
  if (!fileInput.files || !fileInput.files.length) {
    setStatus("Please select a CSV file first.");
    return;
  }

  try {
    setStatus("Uploading CSV and running C++ optimizer...");
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    const bundle = await postForm(API_RUN_CSV_URL, formData);
    applyBundle(bundle, "Updated from CSV input");
  } catch (err) {
    setStatus(`Run failed: ${err.message}`);
    console.error(err);
  }
}

function bindEvents() {
  byId("algorithmSelect").addEventListener("change", (e) => {
    renderSelected(e.target.value);
  });
  byId("runJsonBtn").addEventListener("click", runFromJson);
  byId("runCsvBtn").addEventListener("click", runFromCsv);
}

async function loadFromApi() {
  const res = await fetch(API_CURRENT_URL);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to load API data: ${res.status}`);
  }
  return data;
}

async function loadFromStaticFiles() {
  const [input, mcmf, greedy] = await Promise.all([
    loadJson(INPUT_URL),
    loadJson(MCMF_URL),
    loadJson(GREEDY_URL),
  ]);
  return { input, mcmf, greedy };
}

async function bootstrap() {
  bindEvents();

  try {
    const bundle = await loadFromApi();
    state.backendReady = true;
    setControlEnabled(true);
    applyBundle(bundle, "Loaded from integrated backend");
    return;
  } catch (apiErr) {
    console.warn(apiErr);
  }

  try {
    const bundle = await loadFromStaticFiles();
    state.backendReady = false;
    setControlEnabled(false);
    applyBundle(bundle, "Backend not running. Showing static files only.");
  } catch (err) {
    setStatus(`Failed to load dashboard data: ${err.message}`);
    console.error(err);
  }
}

bootstrap();
