const INPUT_URL = "../data/synthetic_input.json";
const MCMF_URL = "../output/allocation_mcmf.json";
const GREEDY_URL = "../output/allocation_greedy.json";

const teacherColor = "#277da1";
const schoolColor = "#e76f51";
const lineColor = "#2f9d8f";

const state = {
  input: null,
  results: {},
  map: null,
  linesLayer: null,
  chart: null,
  teachersById: {},
  schoolsById: {},
};

function byId(id) {
  return document.getElementById(id);
}

async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  return res.json();
}

function indexById(list) {
  const out = {};
  for (const item of list) {
    out[item.id] = item;
  }
  return out;
}

function avgCenter(schools) {
  let lat = 0;
  let lng = 0;
  for (const s of schools) {
    lat += s.location[0];
    lng += s.location[1];
  }
  return [lat / schools.length, lng / schools.length];
}

function setupMap() {
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
      .bindPopup(
        `<b>${s.name}</b><br/>${s.id}<br/>Priority: ${s.priority}`
      )
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
    row.innerHTML = `<td colspan="4">No allocations</td>`;
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

function renderChart() {
  const m = state.results.mcmf.kpi;
  const g = state.results.greedy.kpi;

  const labels = ["Coverage %", "Travel km", "Workload std"];

  if (state.chart) {
    state.chart.destroy();
  }

  state.chart = new Chart(byId("kpiChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "MCMF",
          data: [m.coverage_pct, m.total_travel_km, m.workload_std],
          backgroundColor: "rgba(47,157,143,0.7)",
          borderColor: "rgba(47,157,143,1)",
          borderWidth: 1,
        },
        {
          label: "Greedy",
          data: [g.coverage_pct, g.total_travel_km, g.workload_std],
          backgroundColor: "rgba(214,108,47,0.68)",
          borderColor: "rgba(214,108,47,1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
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
  byId("statusText").textContent = `Showing ${algorithm.toUpperCase()}`;
}

async function bootstrap() {
  try {
    const [input, mcmf, greedy] = await Promise.all([
      loadJson(INPUT_URL),
      loadJson(MCMF_URL),
      loadJson(GREEDY_URL),
    ]);

    state.input = input;
    state.results = { mcmf, greedy };
    state.teachersById = indexById(input.teachers);
    state.schoolsById = indexById(input.schools);

    setupMap();
    renderChart();

    const select = byId("algorithmSelect");
    select.addEventListener("change", (e) => {
      renderSelected(e.target.value);
    });

    renderSelected("mcmf");
  } catch (err) {
    byId("statusText").textContent = err.message;
    console.error(err);
  }
}

bootstrap();
