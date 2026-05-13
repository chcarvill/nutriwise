const CATEGORIES = [
  { id: "snacks",     label: "Snacks & desserts",      icon: "ti-cookie" },
  { id: "drinks",     label: "Drinks & beverages",     icon: "ti-glass" },
  { id: "vegetables", label: "Vegetables",             icon: "ti-leaf" },
  { id: "fruits",     label: "Fruits",                 icon: "ti-apple" },
  { id: "legumes",    label: "Legumes & pulses",       icon: "ti-circle-dotted" },
  { id: "starches",   label: "Starch & carbohydrates", icon: "ti-bread" },
  { id: "protein",    label: "Lean meat & protein",    icon: "ti-meat" },
  { id: "dairy",      label: "Dairy & alternatives",   icon: "ti-droplet" },
  { id: "condiments", label: "Condiments & sauces",    icon: "ti-bottle" }
];

const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

let foods = {};
CATEGORIES.forEach(c => (foods[c.id] = []));
let openCats = { snacks: true };
let bodyData = {};

// ── Local storage ────────────────────────────────────────────────────────────

const LS_FOODS    = "nutriwise_foods";
const LS_BODY     = "nutriwise_body";
const LS_OPENCATS = "nutriwise_opencats";

function saveToStorage() {
  try {
    localStorage.setItem(LS_FOODS,    JSON.stringify(foods));
    localStorage.setItem(LS_OPENCATS, JSON.stringify(openCats));
  } catch (e) { /* storage full or unavailable */ }
}

function saveBodyToStorage() {
  try {
    const bodyFields = {
      heightVal:  document.getElementById("height-val").value,
      heightUnit: document.getElementById("height-unit").value,
      weightVal:  document.getElementById("weight-val").value,
      weightUnit: document.getElementById("weight-unit").value,
      activity:   document.getElementById("activity-val").value,
      goal:       document.getElementById("bodygoal-val").value,
    };
    localStorage.setItem(LS_BODY, JSON.stringify(bodyFields));
  } catch (e) {}
}

function loadFromStorage() {
  try {
    const f = localStorage.getItem(LS_FOODS);
    if (f) {
      const parsed = JSON.parse(f);
      CATEGORIES.forEach(c => { foods[c.id] = parsed[c.id] || []; });
    }
    const oc = localStorage.getItem(LS_OPENCATS);
    if (oc) openCats = JSON.parse(oc);
  } catch (e) {}
}

function loadBodyFromStorage() {
  try {
    const b = localStorage.getItem(LS_BODY);
    if (!b) return;
    const d = JSON.parse(b);
    if (d.heightVal)  document.getElementById("height-val").value   = d.heightVal;
    if (d.heightUnit) document.getElementById("height-unit").value  = d.heightUnit;
    if (d.weightVal)  document.getElementById("weight-val").value   = d.weightVal;
    if (d.weightUnit) document.getElementById("weight-unit").value  = d.weightUnit;
    if (d.activity)   document.getElementById("activity-val").value = d.activity;
    if (d.goal)       document.getElementById("bodygoal-val").value = d.goal;
    calcBMI();
  } catch (e) {}
}

// ── Tab switching ────────────────────────────────────────────────────────────

function switchTab(t) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("panel-" + t).classList.add("active");
  document.getElementById("tab-" + t).classList.add("active");
}

// ── BMI calculation ──────────────────────────────────────────────────────────

function calcBMI() {
  const hVal     = parseFloat(document.getElementById("height-val").value);
  const hUnit    = document.getElementById("height-unit").value;
  const wVal     = parseFloat(document.getElementById("weight-val").value);
  const wUnit    = document.getElementById("weight-unit").value;
  const activity = document.getElementById("activity-val").value;
  const goal     = document.getElementById("bodygoal-val").value;

  if (!hVal || !wVal) return;

  const hM  = hUnit === "cm" ? hVal / 100 : hVal * 0.3048;
  const wKg = wUnit === "kg" ? wVal : wVal * 0.453592;
  const bmi = wKg / (hM * hM);

  let bmiCat, bmiColor;
  if      (bmi < 18.5) { bmiCat = "Underweight";   bmiColor = "#BA7517"; }
  else if (bmi < 25)   { bmiCat = "Healthy weight"; bmiColor = "#1D9E75"; }
  else if (bmi < 30)   { bmiCat = "Overweight";     bmiColor = "#EF9F27"; }
  else                 { bmiCat = "Obese range";     bmiColor = "#E24B4A"; }

  const pct = Math.min(100, Math.max(0, ((bmi - 15) / (45 - 15)) * 100));

  document.getElementById("bmi-num").textContent   = bmi.toFixed(1);
  document.getElementById("bmi-num").style.color   = bmiColor;
  document.getElementById("bmi-cat").textContent   = bmiCat;
  document.getElementById("bmi-marker").style.left = pct + "%";

  const bmrApprox = 10 * wKg + 6.25 * hM * 100;
  const mults = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, veryactive:1.9 };
  let tdee = Math.round(bmrApprox * (mults[activity] || 1.55));
  if (goal === "lose") tdee -= 500;
  else if (goal === "gain") tdee += 300;

  document.getElementById("tdee-num").textContent = tdee.toLocaleString();
  document.getElementById("tdee-sub").textContent =
    goal === "lose" ? "deficit target" : goal === "gain" ? "surplus target" : "maintenance";

  const minKg = Math.round(18.5 * hM * hM * 10) / 10;
  const maxKg = Math.round(24.9 * hM * hM * 10) / 10;
  document.getElementById("ideal-num").textContent =
    wUnit === "kg"
      ? `${minKg}–${maxKg} kg`
      : `${Math.round(minKg * 2.205 * 10) / 10}–${Math.round(maxKg * 2.205 * 10) / 10} lbs`;

  let portionNote = "";
  if      (bmi < 18.5) portionNote = "Your BMI suggests underweight. Be generous with portions — focus on calorie-dense, nutrient-rich foods. Prioritise healthy fats, proteins and complex carbs.";
  else if (bmi < 25)   portionNote = "Your BMI is in the healthy range. Use the plate method: half vegetables, quarter protein, quarter complex carbs.";
  else if (bmi < 30)   portionNote = "Your BMI suggests overweight. Reduce carbohydrate servings by ~25%, prioritise protein and non-starchy vegetables. Use smaller plates.";
  else                 portionNote = "Your BMI is in the obese range. Halve starch/carb servings, double non-starchy vegetables, and keep protein portions palm-sized.";

  document.getElementById("portion-guide").innerHTML =
    `<i class="ti ti-ruler" style="font-size:14px;vertical-align:-2px;margin-right:5px;"></i><strong>Portion guidance:</strong> ${portionNote}`;

  document.getElementById("bmi-result").style.display = "block";
  bodyData = { bmi: bmi.toFixed(1), bmiCat, wKg, hM, activity, goal, tdee };
  saveBodyToStorage();
}

// ── Food library ─────────────────────────────────────────────────────────────

function renderFoods() {
  const el = document.getElementById("food-categories");
  el.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const isOpen = openCats[cat.id];
    const items  = foods[cat.id];
    let rowsHtml = "";
    items.forEach((item, idx) => {
      rowsHtml += `<div class="food-row">
        <input class="food-name-input" type="text" placeholder="Food name..." value="${item.name || ""}"
          oninput="updateFood('${cat.id}',${idx},'name',this.value)" />
        <input class="num-input" type="number" min="1" max="10" value="${item.freq  || ""}" placeholder="—"
          title="Times per day (1–10)" oninput="updateFood('${cat.id}',${idx},'freq',this.value)" />
        <input class="num-input" type="number" min="1" max="7"  value="${item.days  || ""}" placeholder="—"
          title="Days per week (1–7)"  oninput="updateFood('${cat.id}',${idx},'days',this.value)" />
        <input class="num-input" type="number" min="1" max="10" value="${item.score || ""}" placeholder="—"
          title="Experience (1–10)"    oninput="updateFood('${cat.id}',${idx},'score',this.value)" />
        <button class="del-btn" onclick="removeFood('${cat.id}',${idx})" aria-label="Remove">
          <i class="ti ti-x"></i>
        </button>
      </div>`;
    });

    const div = document.createElement("div");
    div.className = "card";
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <div class="cat-header" onclick="toggleCat('${cat.id}')">
        <div class="cat-title">
          <i class="ti ${cat.icon}" style="font-size:17px;"></i>${cat.label}
          <span class="pill pill-gray">${items.length}</span>
        </div>
        <i class="ti ${isOpen ? "ti-chevron-up" : "ti-chevron-down"}" style="font-size:16px;color:#888;"></i>
      </div>
      ${isOpen ? `<div class="cat-body">
        ${items.length > 0 ? `<div class="food-row-header">
          <span style="font-size:10px;color:#888;">Food / beverage</span>
          <span class="col-head" title="Times per day">×/day</span>
          <span class="col-head" title="Days per week">d/wk</span>
          <span class="col-head" title="Experience 1–10">exp.</span>
          <span></span>
        </div>` : ""}
        ${rowsHtml}
        <button class="add-food-btn" onclick="addFood('${cat.id}')">
          <i class="ti ti-plus" style="font-size:14px;"></i>Add ${cat.label.toLowerCase()}
        </button>
      </div>` : ""}`;
    el.appendChild(div);
  });
}

function toggleCat(id)                       { openCats[id] = !openCats[id]; renderFoods(); saveToStorage(); }
function addFood(catId)                      { foods[catId].push({ name:"", freq:"", days:"", score:"" }); openCats[catId] = true; renderFoods(); saveToStorage(); }
function removeFood(catId, idx)              { foods[catId].splice(idx, 1); renderFoods(); saveToStorage(); }
function updateFood(catId, idx, field, val)  { foods[catId][idx][field] = val; saveToStorage(); }

function getAllFoods() {
  const all = [];
  CATEGORIES.forEach(cat => {
    foods[cat.id].forEach(f => {
      if (f.name && f.name.trim()) all.push({ ...f, category: cat.label, catId: cat.id });
    });
  });
  return all;
}

// ── AI Portion Advisor ───────────────────────────────────────────────────────

let lastPortionPlanText = "";

async function getPortionAdvice() {
  const morning = document.getElementById("meal-morning").value.trim();
  const midday  = document.getElementById("meal-midday").value.trim();
  const evening = document.getElementById("meal-evening").value.trim();

  if (!morning && !midday && !evening) {
    document.getElementById("portion-result").innerHTML =
      `<div class="error-msg">
        <i class="ti ti-alert-circle" style="font-size:14px;vertical-align:-2px;margin-right:5px;"></i>
        Please enter at least one meal you're planning to eat.
      </div>`;
    return;
  }

  if (!bodyData.bmi) {
    document.getElementById("portion-result").innerHTML =
      `<div class="error-msg">
        <i class="ti ti-alert-circle" style="font-size:14px;vertical-align:-2px;margin-right:5px;"></i>
        Please enter your height and weight in <strong>My body</strong> first.
      </div>`;
    return;
  }

  // Build food library context
  const allFood = getAllFoods();
  const foodContext = allFood.length
    ? allFood.map(f =>
        `${f.name} (${f.category}, exp score: ${f.score || "unrated"}, ${f.freq || "?"}x/day, ${f.days || "?"}d/wk)`
      ).join("\n")
    : "No personal food library entered yet.";

  // Goal label
  const goalLabels = {
    maintain: "maintain weight", lose: "lose weight",
    gain: "gain muscle", health: "general health", performance: "athletic performance"
  };
  const goalLabel = goalLabels[bodyData.goal] || bodyData.goal;

  // Build prompt
  const prompt = `You are a nutrition advisor helping a user plan appropriate food portions for the day.

USER PROFILE:
- BMI: ${bodyData.bmi} (${bodyData.bmiCat})
- Weight: ${Math.round(bodyData.wKg)}kg
- Health goal: ${goalLabel}
- Daily calorie target: ~${bodyData.tdee} kcal
- Activity: ${bodyData.activity}

PERSONAL FOOD LIBRARY (foods they regularly eat, with experience scores 1=disagrees, 10=beneficial):
${foodContext}

PORTION RULES from their profile:
- BMI < 18.5: generous portions, calorie-dense foods
- BMI 18.5–24.9: standard portions, plate method (½ veg, ¼ protein, ¼ carbs)
- BMI 25–29.9: moderate portions, reduce carbs ~25%, prioritise protein and veg
- BMI ≥ 30: controlled portions, halve starches, double non-starchy veg, palm-sized protein
- Foods scored 1–4 (harder to digest) should be eaten earlier in the day (breakfast/lunch), NOT in the evening
- Foods scored 7–10 are fine at any time including dinner

TODAY'S PLANNED MEALS:
${morning ? `Morning (up to midday): ${morning}` : "Morning: not planned"}
${midday  ? `Midday (12pm–6pm): ${midday}`       : "Midday: not planned"}
${evening ? `Evening (6pm onwards): ${evening}`  : "Evening: not planned"}

For each planned meal, provide specific portion recommendations for each food item mentioned. Use practical measurements (grams, cups, palm-sized, fist-sized, tablespoons etc). Flag any foods that should be moved earlier in the day based on their experience score. Be concise and practical.

Respond in this exact JSON format only, no markdown, no preamble:
{
  "windows": [
    {
      "id": "morning",
      "label": "Morning",
      "color": "#F59E0B",
      "skipped": false,
      "items": [
        { "food": "food name", "portion": "specific amount", "note": "optional short tip or flag" }
      ],
      "summary": "one short sentence about this meal"
    },
    {
      "id": "midday",
      "label": "Midday",
      "color": "#1D9E75",
      "skipped": false,
      "items": [...],
      "summary": "..."
    },
    {
      "id": "evening",
      "label": "Evening",
      "color": "#378ADD",
      "skipped": false,
      "items": [...],
      "summary": "..."
    }
  ],
  "overall_tip": "one practical overall tip for the day"
}

If a window was not planned, set skipped: true and items: [].`;

  // Show loading state
  const btn = document.getElementById("portion-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Analysing your meals…`;
  document.getElementById("portion-result").innerHTML = "";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || "").join("").trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const plan  = JSON.parse(clean);

    renderPortionResult(plan, { morning, midday, evening });

  } catch (err) {
    document.getElementById("portion-result").innerHTML =
      `<div class="error-msg">
        <i class="ti ti-alert-circle" style="font-size:14px;vertical-align:-2px;margin-right:5px;"></i>
        Could not get recommendations. Please check your API connection and try again.
      </div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="ti ti-scale"></i>Get my portion recommendations`;
  }
}

function renderPortionResult(plan, meals) {
  let html = "";

  plan.windows.forEach(win => {
    if (win.skipped) return;

    const itemsHtml = win.items.map(item => `
      <div class="portion-item">
        <div style="flex:1;">
          <div class="portion-food">${item.food}</div>
          ${item.note ? `<div class="portion-note">${item.note}</div>` : ""}
        </div>
        <div class="portion-amount">${item.portion}</div>
      </div>`).join("");

    html += `<div class="card portion-window">
      <div class="portion-window-header">
        <div class="portion-window-dot" style="background:${win.color};"></div>
        <div class="portion-window-title">${win.label}</div>
      </div>
      ${itemsHtml}
      ${win.summary ? `<div class="info-box" style="margin-top:12px;font-size:11px;">${win.summary}</div>` : ""}
    </div>`;
  });

  if (plan.overall_tip) {
    html += `<div class="info-box">
      <i class="ti ti-bulb" style="font-size:13px;vertical-align:-2px;margin-right:4px;"></i>
      <strong>Today's tip:</strong> ${plan.overall_tip}
    </div>`;
  }

  // Cache plain text for email
  lastPortionPlanText = buildPortionEmailText(plan, meals);

  document.getElementById("portion-result").innerHTML = html;
}

function buildPortionEmailText(plan, meals) {
  const lines = [
    "NUTRIWISE — MY PORTION PLAN",
    "=".repeat(40),
    "",
    `BMI: ${bodyData.bmi} (${bodyData.bmiCat}) | Goal: ${bodyData.goal} | Target: ~${bodyData.tdee} kcal`,
    "",
  ];

  plan.windows.forEach(win => {
    if (win.skipped) return;
    lines.push(win.label.toUpperCase());
    win.items.forEach(item => {
      lines.push(`  ${(item.food).padEnd(30)} ${item.portion}`);
      if (item.note) lines.push(`    ↳ ${item.note}`);
    });
    if (win.summary) lines.push(`  → ${win.summary}`);
    lines.push("");
  });

  if (plan.overall_tip) lines.push(`TIP: ${plan.overall_tip}`, "");

  lines.push(
    "-".repeat(40),
    "Generated by NutriWise — for informational purposes only.",
    "Consult a qualified dietitian for personalised medical nutrition advice."
  );
  return lines.join("\n");
}

// ── Email helpers ────────────────────────────────────────────────────────────

function openMailto(subject, body) {
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

function emailBodyData() {
  const hVal  = document.getElementById("height-val").value;
  const hUnit = document.getElementById("height-unit").value;
  const wVal  = document.getElementById("weight-val").value;
  const wUnit = document.getElementById("weight-unit").value;
  const activityEl = document.getElementById("activity-val");
  const goalEl     = document.getElementById("bodygoal-val");

  if (!hVal || !wVal) {
    alert("Please enter your height and weight first.");
    return;
  }

  const activity = activityEl.options[activityEl.selectedIndex].text;
  const goal     = goalEl.options[goalEl.selectedIndex].text;
  const bmi      = document.getElementById("bmi-num").textContent;
  const bmiCat   = document.getElementById("bmi-cat").textContent;
  const tdee     = document.getElementById("tdee-num").textContent;
  const tdeeSub  = document.getElementById("tdee-sub").textContent;
  const ideal    = document.getElementById("ideal-num").textContent;
  const portion  = document.getElementById("portion-guide").innerText.replace(/^\s*Portion guidance:\s*/i, "").trim();

  const body = [
    "NUTRIWISE — MY BODY METRICS",
    "=".repeat(40),
    "",
    "MEASUREMENTS",
    `  Height:          ${hVal} ${hUnit}`,
    `  Weight:          ${wVal} ${wUnit}`,
    `  Activity level:  ${activity}`,
    `  Health goal:     ${goal}`,
    "",
    "CALCULATED METRICS",
    `  BMI:             ${bmi} (${bmiCat})`,
    `  Daily calories:  ${tdee} kcal (${tdeeSub})`,
    `  Ideal weight:    ${ideal}`,
    "",
    "PORTION GUIDANCE",
    `  ${portion}`,
    "",
    "-".repeat(40),
    "Generated by NutriWise — for informational purposes only.",
    "Consult a qualified dietitian for personalised medical nutrition advice.",
  ].join("\n");

  openMailto("NutriWise — My Body Metrics", body);
}

function emailFoodsData() {
  const allFoods = getAllFoods();
  if (!allFoods.length) {
    alert("No foods added yet. Please add some foods first.");
    return;
  }

  const lines = [
    "NUTRIWISE — MY FOOD LIBRARY",
    "=".repeat(40),
    "",
  ];

  CATEGORIES.forEach(cat => {
    const items = foods[cat.id].filter(f => f.name && f.name.trim());
    if (!items.length) return;
    lines.push(cat.label.toUpperCase());
    items.forEach(f => {
      const freq  = f.freq  ? `${f.freq}×/day`  : "—";
      const days  = f.days  ? `${f.days} d/wk`  : "—";
      const score = f.score ? `exp. ${f.score}/10` : "—";
      lines.push(`  ${(f.name || "").padEnd(28)} ${freq.padEnd(10)} ${days.padEnd(10)} ${score}`);
    });
    lines.push("");
  });

  lines.push(
    "COLUMNS: Food name | Times per day | Days per week | Experience score (1=disagrees, 10=highly beneficial)",
    "",
    "-".repeat(40),
    "Generated by NutriWise — for informational purposes only.",
    "Consult a qualified dietitian for personalised medical nutrition advice.",
  );

  openMailto("NutriWise — My Food Library", lines.join("\n"));
}

function emailPortionPlan() {
  if (!lastPortionPlanText) {
    alert("Please get portion recommendations first.");
    return;
  }
  openMailto("NutriWise — My Portion Plan", lastPortionPlanText);
}

// ── Global exports & init ────────────────────────────────────────────────────

window.switchTab        = switchTab;
window.calcBMI          = calcBMI;
window.toggleCat        = toggleCat;
window.addFood          = addFood;
window.removeFood       = removeFood;
window.updateFood       = updateFood;
window.getPortionAdvice = getPortionAdvice;
window.emailBodyData    = emailBodyData;
window.emailFoodsData   = emailFoodsData;
window.emailPortionPlan = emailPortionPlan;

// Load persisted data then render
loadFromStorage();
renderFoods();
loadBodyFromStorage();
