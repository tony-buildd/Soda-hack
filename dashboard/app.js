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
  byId("addTeacherBtn").disabled = !enabled;
  byId("addSchoolBtn").disabled = !enabled;
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

function createField(label, key, value, type = "text", required = false) {
  return `
    <label>
      ${label}
      <input
        data-key="${key}"
        type="${type}"
        value="${value ?? ""}"
        ${required ? "required" : ""}
      />
    </label>
  `;
}

function createTeacherRow(teacher = {}) {
  const row = document.createElement("div");
  row.className = "entry-row teacher-row";
  const subjects = Array.isArray(teacher.subjects) ? teacher.subjects.join(", ") : "";
  const baseLat = Array.isArray(teacher.base) ? teacher.base[0] : "";
  const baseLng = Array.isArray(teacher.base) ? teacher.base[1] : "";
  row.innerHTML = `
    <div class="entry-grid">
      ${createField("Teacher ID", "id", teacher.id, "text", true)}
      ${createField("Name", "name", teacher.name, "text", true)}
      ${createField("Capacity", "capacity", teacher.capacity, "number", true)}
      ${createField("Subjects (comma-separated)", "subjects", subjects, "text", true)}
      ${createField("Base Latitude", "baseLat", baseLat, "number", true)}
      ${createField("Base Longitude", "baseLng", baseLng, "number", true)}
    </div>
    <div class="row-actions">
      <button class="remove-row-btn" type="button">Remove</button>
    </div>
  `;
  return row;
}

function demandToString(demand) {
  if (!demand || typeof demand !== "object") {
    return "";
  }
  return Object.entries(demand)
    .map(([subject, hours]) => `${subject}:${hours}`)
    .join(", ");
}

function createSchoolRow(school = {}) {
  const row = document.createElement("div");
  row.className = "entry-row school-row";
  const lat = Array.isArray(school.location) ? school.location[0] : "";
  const lng = Array.isArray(school.location) ? school.location[1] : "";
  row.innerHTML = `
    <div class="entry-grid">
      ${createField("School ID", "id", school.id, "text", true)}
      ${createField("Name", "name", school.name, "text", true)}
      ${createField("Priority", "priority", school.priority ?? 1, "number", true)}
      ${createField("Latitude", "lat", lat, "number", true)}
      ${createField("Longitude", "lng", lng, "number", true)}
      ${createField(
        "Demand (Math:12, English:8)",
        "demand",
        demandToString(school.demand),
        "text",
        true
      )}
    </div>
    <div class="row-actions">
      <button class="remove-row-btn" type="button">Remove</button>
    </div>
  `;
  return row;
}

function renderFormFromInput(input) {
  const teacherRows = byId("teacherRows");
  const schoolRows = byId("schoolRows");
  teacherRows.innerHTML = "";
  schoolRows.innerHTML = "";

  const teachers = input?.teachers || [];
  const schools = input?.schools || [];

  if (!teachers.length) {
    teacherRows.appendChild(createTeacherRow());
  } else {
    for (const teacher of teachers) {
      teacherRows.appendChild(createTeacherRow(teacher));
    }
  }

  if (!schools.length) {
    schoolRows.appendChild(createSchoolRow());
  } else {
    for (const school of schools) {
      schoolRows.appendChild(createSchoolRow(school));
    }
  }
}

function mustNumber(value, fieldName) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  return num;
}

function mustText(value, fieldName) {
  const text = String(value ?? "").trim();
  if (!text) {
    throw new Error(`${fieldName} is required.`);
  }
  return text;
}

function readRowData(row) {
  const data = {};
  for (const input of row.querySelectorAll("input[data-key]")) {
    data[input.dataset.key] = input.value;
  }
  return data;
}

function parseSubjects(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDemand(value) {
  const demand = {};
  for (const segment of value.split(",")) {
    const item = segment.trim();
    if (!item) {
      continue;
    }
    const parts = item.split(":");
    if (parts.length !== 2) {
      throw new Error(`Invalid demand item "${item}". Use Subject:Hours.`);
    }
    const subject = parts[0].trim();
    const hoursText = parts[1].trim();
    if (!subject) {
      throw new Error(`Invalid demand item "${item}". Subject is missing.`);
    }
    const hours = mustNumber(hoursText, `Demand hours for ${subject}`);
    demand[subject] = hours;
  }
  if (!Object.keys(demand).length) {
    throw new Error("Each school needs at least one demand item.");
  }
  return demand;
}

function buildInputFromForm() {
  const teacherRows = Array.from(byId("teacherRows").querySelectorAll(".teacher-row"));
  const schoolRows = Array.from(byId("schoolRows").querySelectorAll(".school-row"));

  if (!teacherRows.length) {
    throw new Error("At least one teacher is required.");
  }
  if (!schoolRows.length) {
    throw new Error("At least one school is required.");
  }

  const teachers = teacherRows.map((row, idx) => {
    const data = readRowData(row);
    const id = mustText(data.id, `Teacher ${idx + 1} ID`);
    const name = mustText(data.name, `Teacher ${idx + 1} name`);
    const subjects = parseSubjects(mustText(data.subjects, `Teacher ${idx + 1} subjects`));
    if (!subjects.length) {
      throw new Error(`Teacher ${idx + 1} must have at least one subject.`);
    }
    return {
      id,
      name,
      capacity: mustNumber(data.capacity, `Teacher ${idx + 1} capacity`),
      subjects,
      base: [
        mustNumber(data.baseLat, `Teacher ${idx + 1} base latitude`),
        mustNumber(data.baseLng, `Teacher ${idx + 1} base longitude`),
      ],
    };
  });

  const schools = schoolRows.map((row, idx) => {
    const data = readRowData(row);
    return {
      id: mustText(data.id, `School ${idx + 1} ID`),
      name: mustText(data.name, `School ${idx + 1} name`),
      priority: mustNumber(data.priority, `School ${idx + 1} priority`),
      location: [
        mustNumber(data.lat, `School ${idx + 1} latitude`),
        mustNumber(data.lng, `School ${idx + 1} longitude`),
      ],
      demand: parseDemand(mustText(data.demand, `School ${idx + 1} demand`)),
    };
  });

  return { teachers, schools };
}

function applyBundle(bundle, sourceText) {
  setData(bundle);
  setupMap();
  renderCharts();
  renderFormFromInput(state.input);
  renderSelected(byId("algorithmSelect").value);
  setStatus(sourceText);
}

async function runFromJson() {
  if (!state.backendReady) {
    setStatus("Backend API is not available. Start Flask app to enable this.");
    return;
  }

  try {
    setStatus("Running C++ optimizer from form input...");
    const input = buildInputFromForm();
    const bundle = await postJson(API_RUN_JSON_URL, { input });
    applyBundle(bundle, "Updated from manual form input");
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
  byId("addTeacherBtn").addEventListener("click", () => {
    byId("teacherRows").prepend(createTeacherRow());
  });
  byId("addSchoolBtn").addEventListener("click", () => {
    byId("schoolRows").prepend(createSchoolRow());
  });
  byId("teacherRows").addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-row-btn")) {
      event.target.closest(".teacher-row")?.remove();
    }
  });
  byId("schoolRows").addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-row-btn")) {
      event.target.closest(".school-row")?.remove();
    }
  });
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
