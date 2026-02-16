/* ============================================
   JalRakshya – Groundwater Intelligence Platform
   Main JavaScript
   ============================================ */

// ─── Configuration ───
const CONFIG = {
  csvPath: "data.csv",
  storageKey: "jalrakshya-location",
};

// ─── Global Data ───
let allData = [];
let uniqueLocations = [];

// ============================================
// CSV LOADING & PARSING
// ============================================
async function loadData() {
  try {
    const response = await fetch(CONFIG.csvPath);
    if (!response.ok) throw new Error("Failed to fetch data.csv");
    const text = await response.text();
    allData = parseCSV(text);
    uniqueLocations = [...new Set(allData.map((d) => d.Location))].sort();
    return true;
  } catch (err) {
    console.error("Error loading data:", err);
    return false;
  }
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const strip = (s) => s.trim().replace(/^"|"$/g, "");
  const headers = lines[0].split(",").map(strip);

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = line.split(",").map(strip);
      const obj = {};
      headers.forEach((h, i) => {
        const v = values[i];
        obj[h] = v !== "" && !isNaN(v) ? parseFloat(v) : v;
      });
      return obj;
    });
}

// ============================================
// LOCALSTORAGE HELPERS
// ============================================
function getLocation() {
  return localStorage.getItem(CONFIG.storageKey) || "";
}

function setLocation(loc) {
  localStorage.setItem(CONFIG.storageKey, loc);
}

// ============================================
// DATA HELPERS
// ============================================
function getFilteredData(location) {
  return allData.filter(
    (d) => d.Location.toLowerCase() === location.toLowerCase()
  );
}

function getLatestRecord(records) {
  return records.reduce((a, b) => (a.Year > b.Year ? a : b));
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = "info") {
  const icons = {
    info: "fa-circle-info",
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-triangle-exclamation",
  };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  });
}

// ============================================
// NAVBAR & COMMON UI
// ============================================
function initNavbar() {
  const navbar = document.getElementById("navbar") || document.querySelector(".navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks") || document.querySelector(".nav-links");

  // Scroll effect (only on transparent navbar — the hero page)
  if (navbar && !navbar.classList.contains("navbar-light")) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    });
  }

  // Hamburger toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("open");
    });

    // Close on link click
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("open");
      });
    });
  }
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initFadeIn() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".fade-in:not(.visible)").forEach((el) => observer.observe(el));
}

// ============================================
// ANIMATED COUNTER
// ============================================
function animateCounter(id, target, isFloat = false) {
  const el = document.getElementById(id);
  if (!el) return;

  const numTarget = parseFloat(target);
  const duration = 1500;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = numTarget * eased;

    el.textContent = isFloat ? current.toFixed(1) : Math.round(current);

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ============================================
// HERO — FLOATING BUBBLES
// ============================================
function createBubbles() {
  const container = document.getElementById("heroBubbles");
  if (!container) return;

  for (let i = 0; i < 18; i++) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const size = Math.random() * 80 + 20;
    bubble.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 8 + 6}s;
      animation-delay: ${Math.random() * 5}s;
    `;
    container.appendChild(bubble);
  }
}

// ============================================
// HOME PAGE (index.html)
// ============================================
function initHomePage() {
  const searchInput = document.getElementById("heroSearchInput");
  const searchBtn = document.getElementById("heroSearchBtn");

  if (!searchInput || !searchBtn) return; // Not on home page

  // Populate datalist with locations
  const datalist = document.getElementById("locationList");
  if (datalist) {
    uniqueLocations.forEach((loc) => {
      const opt = document.createElement("option");
      opt.value = loc;
      datalist.appendChild(opt);
    });
  }

  // Search handler
  const handleSearch = () => {
    const loc = searchInput.value.trim();
    if (!loc) {
      showToast("Please enter a location name", "warning");
      searchInput.focus();
      return;
    }
    setLocation(loc);
    window.location.href = "dashboard.html";
  };

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // Load home stats
  loadHomeStats();

  // Create hero bubbles
  createBubbles();
}

function loadHomeStats() {
  if (!allData.length) return;

  const totalLocations = uniqueLocations.length;
  const totalRecords = allData.length;

  const latestYear = Math.max(...allData.map((d) => d.Year));
  const latestData = allData.filter((d) => d.Year === latestYear);

  const avgRainfall = (
    latestData.reduce((s, d) => s + d.Rainfall, 0) / latestData.length
  ).toFixed(0);

  const avgGWLevel = (
    latestData.reduce((s, d) => s + d.Water_Level, 0) / latestData.length
  ).toFixed(1);

  animateCounter("statLocations", totalLocations);
  animateCounter("statRecords", totalRecords);
  animateCounter("statRainfall", avgRainfall);
  animateCounter("statGWLevel", avgGWLevel, true);
}

// ============================================
// DASHBOARD PAGE (dashboard.html)
// ============================================
function initDashboard() {
  const dashContent = document.getElementById("dashboardContent");
  const noDataSection = document.getElementById("noDataSection");
  const loadingOverlay = document.getElementById("loadingOverlay");

  if (!dashContent) return; // Not on dashboard page

  const location = getLocation();
  const locationDisplay = document.getElementById("locationDisplay");
  const changeBtn = document.getElementById("changeLocationBtn");

  if (!location) {
    hideLoader(loadingOverlay);
    if (locationDisplay) locationDisplay.textContent = "No Location Selected";
    if (noDataSection) {
      noDataSection.style.display = "block";
      const msg = document.getElementById("noDataMessage");
      if (msg) msg.textContent = "Please go to the Home page and enter your location first.";
    }
    return;
  }

  if (locationDisplay) locationDisplay.textContent = location;
  if (changeBtn) {
    changeBtn.addEventListener("click", () => {
      localStorage.removeItem(CONFIG.storageKey);
      window.location.href = "index.html";
    });
  }

  const records = getFilteredData(location);

  setTimeout(() => {
    hideLoader(loadingOverlay);

    if (!records.length) {
      if (noDataSection) {
        noDataSection.style.display = "block";
        const msg = document.getElementById("noDataMessage");
        if (msg)
          msg.textContent = `No data available for "${location}". Try locations like Eklahre, Deolali, Panchvati, CIDCO, Nashik Road, etc.`;
      }
      return;
    }

    dashContent.style.display = "block";

    const latest = getLatestRecord(records);
    populateSummaryCards(latest);
    setStatusIndicator(latest);
    populateDataTable(records);
    setMapPlaceholder(location);
    generateInsights(latest, records);
    initFadeIn();
  }, 800);
}

function hideLoader(el) {
  if (!el) return;
  el.classList.add("hidden");
  setTimeout(() => el.remove(), 500);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function populateSummaryCards(rec) {
  setText("valWaterLevel", rec.Water_Level);
  setText("valRainfall", rec.Rainfall);
  setText("valDepletion", rec.Groundwater_Depletion);
  setText("valPH", rec.pH);
  const totalUsage = (
    rec.Agricultural_Usage +
    rec.Industrial_Usage +
    rec.Household_Usage
  ).toFixed(1);
  setText("valUsage", totalUsage);
}

function setStatusIndicator(rec) {
  const bar = document.getElementById("statusBar");
  const label = document.getElementById("statusLabel");
  const desc = document.getElementById("statusDesc");
  if (!bar) return;

  let status, statusText, description;

  if (rec.Water_Level <= 8) {
    status = "safe";
    statusText = "SAFE";
    description =
      "Groundwater levels are healthy in this area. Continue sustainable practices.";
  } else if (rec.Water_Level <= 15) {
    status = "moderate";
    statusText = "MODERATE";
    description =
      "Moderate water stress detected. Consider water conservation measures and rainwater harvesting.";
  } else {
    status = "critical";
    statusText = "CRITICAL";
    description =
      "Critical water levels detected! Urgent conservation action and policy intervention needed.";
  }

  bar.className = `status-bar status-${status}`;
  if (label) label.textContent = statusText;
  if (desc) desc.textContent = description;
}

function populateDataTable(records) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  const sorted = [...records].sort((a, b) => a.Year - b.Year);
  tbody.innerHTML = sorted
    .map(
      (r) => `
    <tr>
      <td><strong>${r.Year}</strong></td>
      <td>${r.Water_Level}</td>
      <td>${r.Rainfall}</td>
      <td>${r.Groundwater_Depletion}%</td>
      <td>${r.pH}</td>
      <td>${r.Agricultural_Usage}</td>
      <td>${r.Industrial_Usage}</td>
      <td>${r.Household_Usage}</td>
    </tr>
  `
    )
    .join("");
}

function setMapPlaceholder(location) {
  const mapName = document.getElementById("mapLocationName");
  if (mapName) mapName.textContent = `📍 ${location}, Nashik District`;
}

function generateInsights(latest, records) {
  const container = document.getElementById("insightContent");
  if (!container) return;

  const insights = [];

  // Water level
  if (latest.Water_Level > 15) {
    insights.push({
      type: "danger",
      icon: "fa-exclamation-triangle",
      text: `Water level is ${latest.Water_Level}m below surface — this is in the critical zone. Immediate conservation measures are recommended.`,
    });
  } else if (latest.Water_Level > 8) {
    insights.push({
      type: "warning",
      icon: "fa-triangle-exclamation",
      text: `Water level at ${latest.Water_Level}m indicates moderate stress. Rainwater harvesting and reduced borewell usage is advisable.`,
    });
  } else {
    insights.push({
      type: "success",
      icon: "fa-check-circle",
      text: `Water level at ${latest.Water_Level}m is within healthy range. Continue maintaining current conservation practices.`,
    });
  }

  // pH insight
  if (latest.pH < 6.5 || latest.pH > 8.5) {
    insights.push({
      type: "warning",
      icon: "fa-flask",
      text: `pH level (${latest.pH}) is outside the safe drinking range (6.5–8.5). Water quality testing is recommended.`,
    });
  }

  // Depletion
  if (latest.Groundwater_Depletion > 60) {
    insights.push({
      type: "danger",
      icon: "fa-arrow-trend-down",
      text: `Groundwater depletion at ${latest.Groundwater_Depletion}% is alarming. Recharge structures like percolation pits and check dams are urgently needed.`,
    });
  } else if (latest.Groundwater_Depletion > 40) {
    insights.push({
      type: "warning",
      icon: "fa-arrow-trend-down",
      text: `Depletion rate of ${latest.Groundwater_Depletion}% shows moderate concern. Reducing agricultural pumping and fixing leakages will help.`,
    });
  } else {
    insights.push({
      type: "success",
      icon: "fa-arrow-trend-down",
      text: `Depletion rate of ${latest.Groundwater_Depletion}% is relatively manageable. Sustainable usage should continue.`,
    });
  }

  // Year-over-year trend
  if (records.length > 1) {
    const sorted = [...records].sort((a, b) => a.Year - b.Year);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const change = last.Water_Level - first.Water_Level;
    if (change > 2) {
      insights.push({
        type: "danger",
        icon: "fa-chart-line",
        text: `Water level has dropped ${change.toFixed(1)}m from ${first.Year} to ${last.Year}, indicating a declining trend.`,
      });
    } else if (change < -1) {
      insights.push({
        type: "success",
        icon: "fa-chart-line",
        text: `Water level improved by ${Math.abs(change).toFixed(1)}m since ${first.Year} — a positive recovery sign.`,
      });
    }
  }

  // Rainfall
  if (latest.Rainfall < 500) {
    insights.push({
      type: "warning",
      icon: "fa-cloud-rain",
      text: `Low rainfall (${latest.Rainfall}mm) recorded. Drought-resistant crops and water-saving techniques are recommended.`,
    });
  }

  container.innerHTML = insights
    .map(
      (i) => `
    <div class="insight-item insight-${i.type}">
      <i class="fas ${i.icon}"></i>
      <p>${i.text}</p>
    </div>
  `
    )
    .join("");
}

// ============================================
// VISUALIZATION PAGE (visualization.html)
// ============================================
function initVisualization() {
  const vizContent = document.getElementById("vizContent");
  const noDataSection = document.getElementById("noDataSection");
  const loadingOverlay = document.getElementById("loadingOverlay");

  if (!vizContent) return; // Not on visualization page

  const location = getLocation();
  const vizLocation = document.getElementById("vizLocation");

  if (!location) {
    hideLoader(loadingOverlay);
    if (noDataSection) noDataSection.style.display = "block";
    return;
  }

  if (vizLocation) vizLocation.textContent = location;

  const records = getFilteredData(location);

  setTimeout(() => {
    hideLoader(loadingOverlay);

    if (!records.length) {
      if (noDataSection) {
        noDataSection.style.display = "block";
        const msg = document.getElementById("noDataMessage");
        if (msg)
          msg.textContent = `No data available for "${location}".`;
      }
      return;
    }

    vizContent.style.display = "block";

    const sorted = [...records].sort((a, b) => a.Year - b.Year);
    const latest = getLatestRecord(records);

    createLineChart(sorted);
    createBarChart(latest, sorted);
    createCorrelationChart(sorted);
    calculateAndDisplayScore(latest);
    calculateIndices(latest);
    initFadeIn();
  }, 600);
}

// ─── Chart Defaults ───
function getChartDefaults() {
  return {
    font: { family: "Poppins" },
    gridColor: "rgba(0, 0, 0, 0.04)",
    tooltipBg: "rgba(27, 38, 59, 0.92)",
  };
}

// ─── Line Chart: Year vs Water Level ───
function createLineChart(data) {
  const ctx = document.getElementById("lineChart")?.getContext("2d");
  if (!ctx) return;

  const defaults = getChartDefaults();

  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((d) => d.Year),
      datasets: [
        {
          label: "Water Level (m)",
          data: data.map((d) => d.Water_Level),
          borderColor: "#0077b6",
          backgroundColor: "rgba(0, 119, 182, 0.08)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#0077b6",
          pointBorderColor: "#fff",
          pointBorderWidth: 3,
          pointRadius: 7,
          pointHoverRadius: 10,
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { usePointStyle: true, font: defaults.font },
        },
        tooltip: {
          backgroundColor: defaults.tooltipBg,
          titleFont: defaults.font,
          bodyFont: defaults.font,
          padding: 14,
          cornerRadius: 10,
          displayColors: false,
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "Water Level (m below surface)",
            font: { ...defaults.font, weight: "600" },
          },
          grid: { color: defaults.gridColor },
        },
        x: {
          title: {
            display: true,
            text: "Year",
            font: { ...defaults.font, weight: "600" },
          },
          grid: { display: false },
        },
      },
    },
  });
}

// ─── Bar Chart: Usage Breakdown ───
function createBarChart(latestRecord, allRecords) {
  const ctx = document.getElementById("barChart")?.getContext("2d");
  if (!ctx) return;

  const defaults = getChartDefaults();

  // If multiple years, show grouped bars; otherwise single year
  const sorted = [...allRecords].sort((a, b) => a.Year - b.Year);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map((d) => d.Year),
      datasets: [
        {
          label: "Agricultural (Ml)",
          data: sorted.map((d) => d.Agricultural_Usage),
          backgroundColor: "rgba(0, 119, 182, 0.8)",
          borderColor: "#0077b6",
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: "Industrial (Ml)",
          data: sorted.map((d) => d.Industrial_Usage),
          backgroundColor: "rgba(0, 180, 216, 0.8)",
          borderColor: "#00b4d8",
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: "Household (Ml)",
          data: sorted.map((d) => d.Household_Usage),
          backgroundColor: "rgba(6, 214, 160, 0.8)",
          borderColor: "#06d6a0",
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { usePointStyle: true, font: defaults.font },
        },
        tooltip: {
          backgroundColor: defaults.tooltipBg,
          titleFont: defaults.font,
          bodyFont: defaults.font,
          padding: 14,
          cornerRadius: 10,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Megalitres (Ml)",
            font: { ...defaults.font, weight: "600" },
          },
          grid: { color: defaults.gridColor },
        },
        x: { grid: { display: false } },
      },
    },
  });
}

// ─── Correlation Chart: Rainfall vs Groundwater ───
function createCorrelationChart(data) {
  const ctx = document.getElementById("correlationChart")?.getContext("2d");
  if (!ctx) return;

  const defaults = getChartDefaults();

  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((d) => d.Year),
      datasets: [
        {
          label: "Rainfall (mm)",
          data: data.map((d) => d.Rainfall),
          borderColor: "#00b4d8",
          backgroundColor: "rgba(0, 180, 216, 0.06)",
          fill: true,
          tension: 0.4,
          yAxisID: "y1",
          pointRadius: 7,
          pointBackgroundColor: "#00b4d8",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          borderWidth: 3,
        },
        {
          label: "Water Level (m)",
          data: data.map((d) => d.Water_Level),
          borderColor: "#ef476f",
          backgroundColor: "rgba(239, 71, 111, 0.06)",
          fill: true,
          tension: 0.4,
          yAxisID: "y",
          pointRadius: 7,
          pointBackgroundColor: "#ef476f",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          labels: { usePointStyle: true, font: defaults.font },
        },
        tooltip: {
          backgroundColor: defaults.tooltipBg,
          titleFont: defaults.font,
          bodyFont: defaults.font,
          padding: 14,
          cornerRadius: 10,
        },
      },
      scales: {
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: "Water Level (m)",
            font: { ...defaults.font, weight: "600" },
          },
          grid: { color: defaults.gridColor },
        },
        y1: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: "Rainfall (mm)",
            font: { ...defaults.font, weight: "600" },
          },
          grid: { drawOnChartArea: false },
        },
        x: { grid: { display: false } },
      },
    },
  });
}

// ─── Water Health Score ───
function calculateAndDisplayScore(record) {
  // Normalize components (0–100 scale):
  // Water Level: lower = better; assume max ~25m
  const waterNorm = Math.max(0, 100 - (record.Water_Level / 25) * 100);
  // Rainfall: higher = better; assume max ~1200mm
  const rainNorm = Math.min(100, (record.Rainfall / 1200) * 100);
  // Depletion: lower = better (already %)
  const depletionNorm = Math.max(0, 100 - record.Groundwater_Depletion);

  const score = Math.round(
    waterNorm * 0.4 + rainNorm * 0.3 + depletionNorm * 0.3
  );

  const scoreValue = document.getElementById("scoreValue");
  const scoreLabel = document.getElementById("scoreLabel");
  const scoreFill = document.getElementById("scoreFill");

  if (!scoreValue || !scoreFill) return;

  let color, label;
  if (score >= 70) {
    color = "#06d6a0";
    label = "Good";
  } else if (score >= 40) {
    color = "#ffd166";
    label = "Moderate";
  } else {
    color = "#ef476f";
    label = "Critical";
  }

  // Animate the SVG ring
  const circumference = 2 * Math.PI * 85; // r=85
  scoreFill.style.strokeDasharray = circumference;
  scoreFill.style.strokeDashoffset = circumference;
  scoreFill.style.stroke = color;

  setTimeout(() => {
    const offset = circumference - (score / 100) * circumference;
    scoreFill.style.strokeDashoffset = offset;
  }, 300);

  // Animate the number
  let current = 0;
  const interval = setInterval(() => {
    current += 1;
    scoreValue.textContent = current;
    if (current >= score) {
      clearInterval(interval);
      scoreValue.textContent = score;
    }
  }, 18);

  if (scoreLabel) {
    scoreLabel.textContent = label;
    scoreLabel.style.color = color;
  }
}

// ─── Detailed Indices ───
function calculateIndices(record) {
  // Water Quality Index (pH-based: 7.5 is ideal; deviation penalizes)
  const phDev = Math.abs(record.pH - 7.5);
  const qualityScore = Math.max(0, Math.round(100 - (phDev / 2) * 100));
  setIndex("quality", qualityScore);

  // Usage Index (lower combined usage = better; assume max ~900 Ml)
  const totalUsage =
    record.Agricultural_Usage +
    record.Industrial_Usage +
    record.Household_Usage;
  const usageScore = Math.max(0, Math.round(100 - (totalUsage / 900) * 100));
  setIndex("usage", usageScore);

  // Depletion Index (lower depletion = better)
  const depletionScore = Math.max(
    0,
    Math.round(100 - record.Groundwater_Depletion)
  );
  setIndex("depletion", depletionScore);
}

function setIndex(name, score) {
  const fill = document.getElementById(`${name}Fill`);
  const value = document.getElementById(`${name}Value`);

  if (!fill || !value) return;

  let color;
  if (score >= 70) color = "#06d6a0";
  else if (score >= 40) color = "#ffd166";
  else color = "#ef476f";

  setTimeout(() => {
    fill.style.width = `${Math.min(score, 100)}%`;
    fill.style.background = color;
  }, 600);

  value.textContent = `${Math.min(score, 100)} / 100`;
  value.style.color = color;
}

// ============================================
// INIT — SINGLE ENTRY POINT
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  // Common init
  initNavbar();
  initScrollTop();

  // Load CSV data
  const loaded = await loadData();

  if (!loaded) {
    // Only show error if not loading overlay (i.e., on home page without overlay)
    const hasOverlay = document.getElementById("loadingOverlay");
    if (hasOverlay) hideLoader(hasOverlay);
    showToast("Failed to load data. Ensure data.csv is accessible.", "error");
  }

  // Page-specific initialization
  initHomePage();
  initDashboard();
  initVisualization();

  // Start fade-in observer
  initFadeIn();
});
