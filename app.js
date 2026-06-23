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
let tryItems   = [];  // [{ name, reason }]
let avoidItems = [];  // [{ name, reason }]

// ── Local storage ────────────────────────────────────────────────────────────

const LS_FOODS    = "nutriwise_foods";
const LS_BODY     = "nutriwise_body";
const LS_OPENCATS = "nutriwise_opencats";
const LS_TRY      = "nutriwise_try";
const LS_AVOID    = "nutriwise_avoid";

const MEAL_CYCLE = ["", "B", "L", "D", "LD"];
const MEAL_LABELS = { "": "—", "B": "B", "L": "L", "D": "D", "LD": "LD" };

function saveToStorage() {
  try {
    localStorage.setItem(LS_FOODS,    JSON.stringify(foods));
    localStorage.setItem(LS_OPENCATS, JSON.stringify(openCats));
    localStorage.setItem(LS_TRY,      JSON.stringify(tryItems));
    localStorage.setItem(LS_AVOID,    JSON.stringify(avoidItems));
  } catch (e) {}
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
    const tr = localStorage.getItem(LS_TRY);
    if (tr) tryItems = JSON.parse(tr);
    const av = localStorage.getItem(LS_AVOID);
    if (av) avoidItems = JSON.parse(av);
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
  if (t === "try")    renderTryList();
  if (t === "avoid")  renderAvoidList();
  if (t === "health") renderHealthPanel();
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

// ── Avoid helpers ────────────────────────────────────────────────────────────

function getAvoidMatch(name) {
  if (!name || !name.trim()) return null;
  const lower = name.trim().toLowerCase();
  return avoidItems.find(a => a.name && a.name.trim().toLowerCase() === lower) || null;
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
      const missingPortion = item.name && item.name.trim() && !item.portion;
      const meal = item.meal || "";
      const avoidMatch = getAvoidMatch(item.name);
      const avoidBanner = avoidMatch
        ? `<div class="avoid-warning"><i class="ti ti-ban" style="font-size:11px;vertical-align:-1px;margin-right:4px;"></i><strong>Foods to Avoid:</strong> ${avoidMatch.reason ? avoidMatch.reason : "Listed in your Foods to Avoid."}</div>`
        : "";
      rowsHtml += `<div class="food-row-wrap${avoidMatch ? " avoid-flagged" : ""}">
        <div class="food-row">
          <input class="food-name-input${avoidMatch ? " avoid-input" : ""}" type="text" placeholder="Food name..." value="${item.name || ""}"
            oninput="updateFood('${cat.id}',${idx},'name',this.value)" />
          <input class="num-input" type="number" min="1" max="10" value="${item.freq  || ""}" placeholder="—"
            title="Times per day (1–10)" oninput="updateFood('${cat.id}',${idx},'freq',this.value)" />
          <input class="num-input" type="number" min="1" max="7"  value="${item.days  || ""}" placeholder="—"
            title="Days per week (1–7)"  oninput="updateFood('${cat.id}',${idx},'days',this.value)" />
          <input class="num-input" type="number" min="1" max="10" value="${item.score || ""}" placeholder="—"
            title="Experience (1–10)"    oninput="updateFood('${cat.id}',${idx},'score',this.value)" />
          <button class="meal-sel" data-meal="${meal}" title="Tap to set meal (B=Breakfast, L=Lunch, D=Dinner, LD=Lunch &amp; Dinner)"
            onclick="cycleMeal('${cat.id}',${idx},this)">${meal || "—"}</button>
          <button class="del-btn" onclick="removeFood('${cat.id}',${idx})" aria-label="Remove">
            <i class="ti ti-x"></i>
          </button>
        </div>
        <div class="portion-input-row">
          <i class="ti ti-scale" style="font-size:12px;color:var(--muted);flex-shrink:0;margin-top:9px;"></i>
          <input class="portion-text-input" type="text" placeholder="My portion size (e.g. 1 cup, palm-sized, 150g)…"
            value="${item.portion || ""}"
            oninput="updateFoodPortion('${cat.id}',${idx},this.value)" />
        </div>
        ${missingPortion ? `<div class="portion-nudge"><i class="ti ti-info-circle" style="font-size:11px;vertical-align:-1px;margin-right:3px;"></i>Add your recommended portion size — used in Portions &amp; Recommendations tabs.</div>` : ""}
        ${avoidBanner}
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
          <span class="col-head" title="Meal assignment">meal</span>
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
function addFood(catId)                      { foods[catId].push({ name:"", freq:"", days:"", score:"", portion:"", meal:"" }); openCats[catId] = true; renderFoods(); saveToStorage(); }
function removeFood(catId, idx)              { foods[catId].splice(idx, 1); renderFoods(); saveToStorage(); }
function updateFood(catId, idx, field, val)  { foods[catId][idx][field] = val; saveToStorage(); }
function updateFoodPortion(catId, idx, val)  { foods[catId][idx].portion = val; saveToStorage(); if (!val) renderFoods(); }

function cycleMeal(catId, idx, btn) {
  const current = foods[catId][idx].meal || "";
  const pos = MEAL_CYCLE.indexOf(current);
  const next = MEAL_CYCLE[(pos + 1) % MEAL_CYCLE.length];
  foods[catId][idx].meal = next;
  btn.textContent = next || "—";
  btn.setAttribute("data-meal", next);
  saveToStorage();
}

function getAllFoods() {
  const all = [];
  CATEGORIES.forEach(cat => {
    foods[cat.id].forEach(f => {
      if (f.name && f.name.trim()) all.push({ ...f, category: cat.label, catId: cat.id });
    });
  });
  return all;
}

// ── Portions tab — personal reference ────────────────────────────────────────

function renderPortionsTab() {
  const el = document.getElementById("portions-content");
  const allFood = getAllFoods();

  if (!allFood.length) {
    el.innerHTML = `<div class="error-msg">
      <i class="ti ti-alert-circle" style="font-size:14px;vertical-align:-2px;margin-right:5px;"></i>
      Please add foods in the <strong>My foods</strong> tab first.
    </div>`;
    return;
  }

  const windows = [
    { label: "Morning",  color: "#F59E0B", desc: "up to midday",
      foods: allFood.filter(f => { const s = parseInt(f.score); return !s || s >= 5; }) },
    { label: "Midday",   color: "#1D9E75", desc: "12pm – 6pm · includes lower-scored foods",
      foods: allFood.filter(f => { const s = parseInt(f.score); return !s || s <= 6; }) },
    { label: "Evening",  color: "#378ADD", desc: "6pm onwards · high-experience foods only",
      foods: allFood.filter(f => { const s = parseInt(f.score); return !s || s >= 7; }) },
  ];

  let html = "";
  windows.forEach(win => {
    if (!win.foods.length) return;
    const rows = win.foods.map(f => {
      const portionHtml = f.portion
        ? `<span class="portion-ref-amount">${f.portion}</span>`
        : `<span class="portion-ref-missing">— add portion</span>`;
      const sc = parseInt(f.score) || 0;
      const badge = sc >= 7 ? `<span class="pill pill-green" style="font-size:10px;">High benefit</span>`
                  : sc >= 5 ? `<span class="pill pill-blue"  style="font-size:10px;">Neutral</span>`
                  : sc > 0  ? `<span class="pill pill-amber" style="font-size:10px;">Easier earlier</span>`
                  : "";
      return `<div class="portion-ref-row">
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:500;">${f.name}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">${f.category} ${badge}</div>
        </div>
        ${portionHtml}
      </div>`;
    }).join("");

    html += `<div class="card" style="margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <div style="width:9px;height:9px;border-radius:50%;background:${win.color};flex-shrink:0;"></div>
        <div style="font-size:14px;font-weight:600;">${win.label}</div>
        <div style="font-size:11px;color:var(--muted);">${win.desc}</div>
      </div>
      ${rows}
    </div>`;
  });

  const missing = allFood.filter(f => !f.portion).length;
  if (missing) {
    html = `<div class="info-box" style="margin-bottom:14px;">
      <i class="ti ti-info-circle" style="font-size:13px;vertical-align:-2px;margin-right:4px;"></i>
      <strong>${missing} food${missing > 1 ? "s are" : " is"} missing a portion size.</strong> Go to <strong>My foods</strong> to add them.
    </div>` + html;
  }

  el.innerHTML = html;
}

// ── Recommendations — multi-day meal plan ─────────────────────────────────────

function portionLabel(bmi, catId, userPortion) {
  if (userPortion) return userPortion;
  if (!bmi) return "";
  const b = parseFloat(bmi);
  if (catId === "starches") {
    if (b < 18.5) return "Large portion";
    if (b < 25)   return "Standard portion";
    if (b < 30)   return "Reduced portion (~¾ normal)";
    return "Small portion (~½ normal)";
  }
  if (catId === "protein") {
    if (b < 18.5) return "Large serving (palm × 1.5)";
    return "Standard serving (palm-sized)";
  }
  if (catId === "vegetables" && b >= 25) return "Generous — fill half the plate";
  return "";
}

function pickFoods(pool, count) {
  const weighted = [];
  pool.forEach(f => {
    const w = Math.max(1, parseInt(f.days) || 1);
    for (let i = 0; i < w; i++) weighted.push(f);
  });
  const shuffled = weighted.sort(() => Math.random() - 0.5);
  const seen = new Set();
  const result = [];
  for (const f of shuffled) {
    if (!seen.has(f.name)) { seen.add(f.name); result.push(f); }
    if (result.length >= count) break;
  }
  return result;
}

function generateMealPlan() {
  const days    = parseInt(document.getElementById("plan-days").value);
  const allFood = getAllFoods();

  if (!allFood.length) {
    document.getElementById("mealplan-result").innerHTML =
      `<div class="error-msg">
        <i class="ti ti-alert-circle" style="font-size:14px;vertical-align:-2px;margin-right:5px;"></i>
        Please add some foods in the <strong>My foods</strong> tab first.
      </div>`;
    return;
  }

  const bmi  = bodyData.bmi  || null;
  const goal = bodyData.goal || "maintain";

  const highExp  = allFood.filter(f => parseInt(f.score) >= 7);
  const midExp   = allFood.filter(f => parseInt(f.score) >= 5 && parseInt(f.score) < 7);
  const lowExp   = allFood.filter(f => parseInt(f.score) > 0  && parseInt(f.score) < 5);
  const unscored = allFood.filter(f => !f.score || f.score === "");

  // Meal-assigned foods take priority; fall back to score-based logic if no meal set
  const mealB  = allFood.filter(f => f.meal === "B");
  const mealL  = allFood.filter(f => f.meal === "L" || f.meal === "LD");
  const mealD  = allFood.filter(f => f.meal === "D" || f.meal === "LD");
  const noMeal = allFood.filter(f => !f.meal);

  // Build pools: meal-assigned foods first, then score-based fallback from unassigned foods
  const noMealHigh  = noMeal.filter(f => parseInt(f.score) >= 7);
  const noMealMid   = noMeal.filter(f => parseInt(f.score) >= 5 && parseInt(f.score) < 7);
  const noMealLow   = noMeal.filter(f => parseInt(f.score) > 0  && parseInt(f.score) < 5);
  const noMealUnsc  = noMeal.filter(f => !f.score || f.score === "");

  const breakfastPool = mealB.length  ? [...mealB,  ...(noMealMid.length  ? noMealMid  : noMeal)]
                                      : (midExp.length  ? [...midExp,  ...unscored] : allFood);
  const lunchPool     = mealL.length  ? [...mealL,  ...(noMealLow.length  ? noMealLow  : noMeal)]
                                      : (lowExp.length  ? [...lowExp,  ...unscored] : allFood);
  const dinnerPool    = mealD.length  ? [...mealD,  ...(noMealHigh.length ? noMealHigh : noMeal)]
                                      : (highExp.length ? [...highExp, ...unscored] : allFood);
  const snackPool     = allFood.filter(f => f.catId === "snacks" || f.catId === "fruits");

  const tips = [];
  if (goal === "lose")             tips.push("Calorie deficit — reduced carb portions at each meal.");
  else if (goal === "gain")        tips.push("Muscle gain — larger protein portions and extra complex carbs.");
  else if (goal === "performance") tips.push("Performance — carb-forward meals around activity.");
  if (bmi && parseFloat(bmi) >= 30)  tips.push("Larger vegetable portions to increase satiety.");
  if (bmi && parseFloat(bmi) < 18.5) tips.push("Generous portions — prioritise calorie-dense foods.");
  const hasMealAssigned = allFood.some(f => f.meal);
  if (hasMealAssigned) tips.push("Meal assignments (B/L/D/LD) from your food library are used to build each meal slot.");
  else {
    tips.push("Low-experience foods (score 1–4) scheduled at lunch.");
    tips.push("High-experience foods (score 7–10) scheduled at dinner.");
  }

  let html = `<div class="card" style="margin-bottom:14px;">
    <p style="font-size:13px;font-weight:500;margin-bottom:8px;">Your ${days}-day personalised plan</p>
    ${tips.map(t => `
      <div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:5px;font-size:12px;color:#666;">
        <i class="ti ti-circle-check" style="color:#1D9E75;font-size:14px;flex-shrink:0;margin-top:1px;"></i>${t}
      </div>`).join("")}
  </div>`;

  for (let d = 0; d < days; d++) {
    const dayLabel = `Day ${d + 1} — ${DAY_NAMES[d % 7]}`;
    const slots = [
      { time: "7:30 am",  type: "Breakfast", pool: breakfastPool, count: 2 },
      { time: "12:30 pm", type: "Lunch",     pool: lunchPool,     count: 3 },
      { time: "3:00 pm",  type: "Snack",     pool: snackPool.length ? snackPool : allFood, count: 1 },
      { time: "7:00 pm",  type: "Dinner",    pool: dinnerPool,    count: 3 }
    ];

    let dayHtml = `<div class="card"><p style="font-size:14px;font-weight:500;margin-bottom:12px;">${dayLabel}</p>`;

    slots.forEach(slot => {
      const picked = pickFoods(slot.pool, slot.count);
      if (!picked.length) return;

      const main    = picked[0];
      const sides   = picked.slice(1).map(f => f.name).join(", ");
      const name    = main.name + (sides ? ` with ${sides}` : "");
      const portion = portionLabel(bmi, main.catId, main.portion);
      const sc      = parseInt(main.score) || 0;
      const badge   = sc >= 7 ? { cls: "pill-green", txt: "High benefit" }
                    : sc <= 3 && sc > 0 ? { cls: "pill-amber", txt: "Easier at this time" }
                    : null;

      dayHtml += `<div class="meal-slot">
        <div class="meal-time">${slot.time}<br><span style="font-size:10px;">${slot.type}</span></div>
        <div class="meal-body">
          <div class="meal-name">${name}</div>
          ${portion ? `<div style="font-size:11px;color:var(--green);font-weight:600;margin-top:3px;">
            <i class="ti ti-scale" style="font-size:11px;vertical-align:-1px;margin-right:3px;"></i>${portion}
          </div>` : ""}
          ${badge ? `<div style="margin-top:4px;">
            <span class="pill ${badge.cls}" style="font-size:10px;">${badge.txt}</span>
          </div>` : ""}
        </div>
      </div>`;
    });

    dayHtml += `</div>`;
    html += dayHtml;
  }

  html += `<div class="info-box" style="margin-top:0;">
    <i class="ti ti-bulb" style="font-size:13px;vertical-align:-2px;margin-right:4px;"></i>
    <strong>Tip:</strong> Rotate foods regularly for nutritional variety. Stay well hydrated throughout the day.
  </div>`;

  document.getElementById("mealplan-result").innerHTML = html;
}

// ── Email helpers ────────────────────────────────────────────────────────────

function openMailto(subject, body) {
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

function buildBodyDataText() {
  const hVal  = document.getElementById("height-val").value;
  const hUnit = document.getElementById("height-unit").value;
  const wVal  = document.getElementById("weight-val").value;
  const wUnit = document.getElementById("weight-unit").value;
  const activityEl = document.getElementById("activity-val");
  const goalEl     = document.getElementById("bodygoal-val");

  if (!hVal || !wVal) return null;

  const activity = activityEl.options[activityEl.selectedIndex].text;
  const goal     = goalEl.options[goalEl.selectedIndex].text;
  const bmi      = document.getElementById("bmi-num").textContent;
  const bmiCat   = document.getElementById("bmi-cat").textContent;
  const tdee     = document.getElementById("tdee-num").textContent;
  const tdeeSub  = document.getElementById("tdee-sub").textContent;
  const ideal    = document.getElementById("ideal-num").textContent;
  const portion  = document.getElementById("portion-guide").innerText.replace(/^\s*Portion guidance:\s*/i, "").trim();

  return [
    "NUTRIWISE — MY BODY METRICS", "=".repeat(40), "",
    "MEASUREMENTS",
    `  Height:          ${hVal} ${hUnit}`,
    `  Weight:          ${wVal} ${wUnit}`,
    `  Activity level:  ${activity}`,
    `  Health goal:     ${goal}`, "",
    "CALCULATED METRICS",
    `  BMI:             ${bmi} (${bmiCat})`,
    `  Daily calories:  ${tdee} kcal (${tdeeSub})`,
    `  Ideal weight:    ${ideal}`, "",
    "PORTION GUIDANCE", `  ${portion}`, "",
    "-".repeat(40),
    "Generated by NutriWise — for informational purposes only.",
    "Consult a qualified dietitian for personalised medical nutrition advice.",
  ].join("\n");
}

function emailBodyData() {
  const body = buildBodyDataText();
  if (!body) { alert("Please enter your height and weight first."); return; }
  openMailto("NutriWise — My Body Metrics", body);
}

function buildFoodsDataText() {
  const allFoods = getAllFoods();
  if (!allFoods.length) return null;

  const lines = ["NUTRIWISE — MY FOOD LIBRARY", "=".repeat(40), ""];
  CATEGORIES.forEach(cat => {
    const items = foods[cat.id].filter(f => f.name && f.name.trim());
    if (!items.length) return;
    lines.push(cat.label.toUpperCase());
    items.forEach(f => {
      const freq    = f.freq    ? `${f.freq}×/day`     : "—";
      const days    = f.days    ? `${f.days} d/wk`     : "—";
      const score   = f.score   ? `exp. ${f.score}/10` : "—";
      const portion = f.portion ? f.portion             : "—";
      const meal    = f.meal    ? f.meal                : "—";
      lines.push(`  ${(f.name || "").padEnd(28)} ${freq.padEnd(10)} ${days.padEnd(10)} ${score.padEnd(14)} ${meal.padEnd(5)} ${portion}`);
    });
    lines.push("");
  });
  lines.push(
    "COLUMNS: Food name | Times per day | Days per week | Experience score | Meal | My portion",
    "", "-".repeat(40),
    "Generated by NutriWise — for informational purposes only.",
    "Consult a qualified dietitian for personalised medical nutrition advice.",
  );
  return lines.join("\n");
}

function emailFoodsData() {
  const body = buildFoodsDataText();
  if (!body) { alert("No foods added yet. Please add some foods first."); return; }
  openMailto("NutriWise — My Food Library", body);
}

function emailMealPlan() {
  const resultEl = document.getElementById("mealplan-result");
  if (!resultEl.innerHTML.trim()) { alert("Please generate a plan first."); return; }

  const lines = ["NUTRIWISE — MY RECOMMENDATIONS", "=".repeat(40), ""];
  const cards = resultEl.querySelectorAll(".card");
  Array.from(cards).slice(1).forEach(card => {
    const dayTitle = card.querySelector("p");
    if (dayTitle) lines.push(dayTitle.textContent.trim().toUpperCase());
    card.querySelectorAll(".meal-slot").forEach(slot => {
      const timeEl   = slot.querySelector(".meal-time");
      const nameEl   = slot.querySelector(".meal-name");
      const time     = timeEl ? timeEl.textContent.replace(/\s+/g, " ").trim() : "";
      const mealName = nameEl ? nameEl.textContent.trim() : "";
      lines.push(`  ${time.padEnd(18)} ${mealName}`);
    });
    lines.push("");
  });
  lines.push("-".repeat(40), "Generated by NutriWise — for informational purposes only.", "Consult a qualified dietitian for personalised medical nutrition advice.");
  openMailto("NutriWise — My Recommendations", lines.join("\n"));
}

// ── Foods to Try ──────────────────────────────────────────────────────────────

function renderTryList() {
  const el = document.getElementById("try-list");
  if (!el) return;
  if (!tryItems.length) {
    el.innerHTML = `<p style="font-size:13px;color:var(--muted);padding:8px 0;">No foods added yet — tap below to start your list.</p>`;
    return;
  }
  el.innerHTML = tryItems.map((item, idx) => `
    <div class="try-row">
      <div class="try-fields">
        <input class="try-food-input" type="text" placeholder="Food name…" value="${item.name || ""}"
          oninput="updateTryItem(${idx},'name',this.value)" />
        <textarea class="try-reason-input" placeholder="Why is it beneficial? (e.g. high in omega-3, anti-inflammatory, gut health…)"
          oninput="updateTryItem(${idx},'reason',this.value)">${item.reason || ""}</textarea>
      </div>
      <button class="try-del-btn" onclick="removeTryItem(${idx})" aria-label="Remove">
        <i class="ti ti-x"></i>
      </button>
    </div>`).join("");
}

function addTryItem()                        { tryItems.push({ name:"", reason:"" }); renderTryList(); saveToStorage(); }
function removeTryItem(idx)                  { tryItems.splice(idx, 1); renderTryList(); saveToStorage(); }
function updateTryItem(idx, field, val)      { tryItems[idx][field] = val; saveToStorage(); }

function buildTryListText() {
  const valid = tryItems.filter(t => t.name && t.name.trim());
  if (!valid.length) return null;
  const lines = ["NUTRIWISE — FOODS TO TRY", "=".repeat(40), ""];
  valid.forEach((t, i) => {
    lines.push(`${i + 1}. ${t.name}`);
    if (t.reason) lines.push(`   Why: ${t.reason}`);
    lines.push("");
  });
  lines.push("-".repeat(40), "Generated by NutriWise — for informational purposes only.", "Consult a qualified dietitian for personalised medical nutrition advice.");
  return lines.join("\n");
}

function emailTryList() {
  const body = buildTryListText();
  if (!body) { alert("No foods in your list yet."); return; }
  openMailto("NutriWise — Foods to Try", body);
}

// ── Foods to Avoid ────────────────────────────────────────────────────────────

function renderAvoidList() {
  const el = document.getElementById("avoid-list");
  if (!el) return;
  if (!avoidItems.length) {
    el.innerHTML = `<p style="font-size:13px;color:var(--muted);padding:8px 0;">No foods added yet — tap below to build your avoidance list.</p>`;
    return;
  }
  el.innerHTML = avoidItems.map((item, idx) => `
    <div class="try-row">
      <div class="try-fields">
        <input class="try-food-input avoid-list-input" type="text" placeholder="Food name…" value="${item.name || ""}"
          oninput="updateAvoidItem(${idx},'name',this.value)" />
        <textarea class="try-reason-input" placeholder="Why avoid it? (e.g. triggers reflux, high sugar, intolerance…)"
          oninput="updateAvoidItem(${idx},'reason',this.value)">${item.reason || ""}</textarea>
      </div>
      <button class="try-del-btn" onclick="removeAvoidItem(${idx})" aria-label="Remove">
        <i class="ti ti-x"></i>
      </button>
    </div>`).join("");
}

function addAvoidItem() {
  avoidItems.push({ name: "", reason: "" });
  renderAvoidList();
  saveToStorage();
}

function removeAvoidItem(idx) {
  avoidItems.splice(idx, 1);
  renderAvoidList();
  saveToStorage();
  renderFoods(); // refresh My foods highlighting
}

function updateAvoidItem(idx, field, val) {
  avoidItems[idx][field] = val;
  saveToStorage();
  renderFoods(); // refresh My foods highlighting live
}

function buildAvoidListText() {
  const valid = avoidItems.filter(a => a.name && a.name.trim());
  if (!valid.length) return null;
  const lines = ["NUTRIWISE — FOODS & DRINKS TO AVOID", "=".repeat(40), ""];
  valid.forEach((a, i) => {
    lines.push(`${i + 1}. ${a.name}`);
    if (a.reason) lines.push(`   Reason: ${a.reason}`);
    lines.push("");
  });
  lines.push("-".repeat(40), "Generated by NutriWise — for informational purposes only.", "Consult a qualified dietitian for personalised medical nutrition advice.");
  return lines.join("\n");
}

function emailAvoidList() {
  const body = buildAvoidListText();
  if (!body) { alert("No foods in your avoid list yet."); return; }
  openMailto("NutriWise — Foods & Drinks to Avoid", body);
}

// ── Combined backup email ────────────────────────────────────────────────────
// Pulls together every section's data into one single email, using the same
// builder functions the individual buttons use — so it always stays in sync
// with whatever those already produce.

function emailEverything() {
  const sections = [
    buildBodyDataText(),
    buildFoodsDataText(),
    buildTryListText(),
    buildAvoidListText()
  ].filter(Boolean); // drop any section with no data yet

  if (!sections.length) {
    alert("There's no data saved yet to back up. Add some foods or body metrics first.");
    return;
  }

  const header = [
    "NUTRIWISE — FULL BACKUP",
    `Generated: ${new Date().toLocaleString()}`,
    "=".repeat(40),
    "",
    "This email contains everything currently saved in NutriWise on this device.",
    "Keep it somewhere safe — you can copy this data back in manually if needed.",
    ""
  ].join("\n");

  const body = header + "\n\n" + sections.join("\n\n" + "=".repeat(40) + "\n\n");
  openMailto("NutriWise — Full Backup " + new Date().toLocaleDateString(), body);
}
window.emailEverything = emailEverything;

// ── My Health panel ───────────────────────────────────────────────────────────

let healthFlareMode = false; // false = normal, true = flare

const HEALTH_DATA = {
  traffic: {
    avoid: [
      { name: "Solo (& other full-sugar soft drinks)", note: "High fructose drives uric acid (joint inflammation) and disrupts gut microbiome. Acidic — irritates gut lining and diverticula." },
      { name: "Processed & packaged snack foods", note: "Ultra-processed foods feed harmful gut bacteria, promote systemic inflammation, and stress the liver — all of which flow through to joints." },
      { name: "Sausages, bacon & processed meats", note: "High in saturated fat, additives, and pro-inflammatory compounds. Hard on the gut without a gallbladder." },
      { name: "Deep-fried foods", note: "Large fat loads are poorly managed without a gallbladder — bile can't be released in the controlled burst needed. Triggers cramping and gut inflammation." },
      { name: "Large, high-fat meals", note: "Without a gallbladder, bile drips continuously rather than surging. Big fat loads overwhelm this — keep fat spread across small meals." },
      { name: "Alcohol", note: "Damages gut lining, disrupts microbiome, and worsens diverticula inflammation. (Already avoided — noted here for completeness.)" },
    ],
    reduce: [
      { name: "Pepsi Max (and diet soft drinks generally)", note: "Caffeine stimulates gut motility — speeds transit and can trigger cramps, especially without a gallbladder. Artificial sweeteners (aspartame) may disrupt gut microbiome. Carbonation adds gas pressure on diverticula. Worth reducing, particularly during flares." },
      { name: "Refined white bread, white rice, pastries", note: "Rapid blood sugar spikes keep inflammatory markers elevated. Swap for wholegrain versions when gut is settled." },
      { name: "Nightshades (tomatoes, capsicum, eggplant, potatoes)", note: "Evidence is mixed, but some people with joint and gut inflammation notice a real improvement when reducing these. Worth a trial elimination." },
      { name: "Red meat (unprocessed)", note: "A couple of times per week is fine for most people, but daily consumption is associated with higher inflammatory markers." },
      { name: "Full-fat dairy", note: "Inflammatory for some, neutral for others. Worth observing whether it correlates with cramps or joint flares." },
      { name: "Caffeine generally", note: "Stimulates gut motility. Without a gallbladder this is more significant — can worsen cramping and urgency." },
    ],
    okay: [
      { name: "Sparkling water (plain)", note: "Scratches the carbonation itch without sugar or artificial sweeteners. Best everyday soft drink swap." },
      { name: "Herbal teas (peppermint, chamomile, ginger)", note: "Peppermint and chamomile are particularly gut-soothing. Ginger has mild anti-inflammatory properties." },
      { name: "Plain yoghurt (small amounts)", note: "Probiotics support gut microbiome. Keep portions modest — full-fat versions bring a fat load challenge without a gallbladder." },
      { name: "Eggs", note: "Good protein, easy on digestion. Scrambled or poached rather than fried keeps fat load low." },
      { name: "White fish & lean chicken", note: "Low-fat protein — easier to digest without a gallbladder than fatty fish or red meat. Fine daily." },
      { name: "Oats (rolled)", note: "Soluble fibre feeds good gut bacteria and helps regulate gut motility. Gentle on the gut. Good choice when settled." },
    ],
    good: [
      { name: "Oily fish (salmon, sardines, mackerel)", note: "Omega-3 fatty acids directly counter the inflammatory pathways driving your joint pain. Aim for 2–3 servings per week. Smaller portions spread across the day are better tolerated without a gallbladder." },
      { name: "Leafy greens (spinach, kale, silverbeet)", note: "High in antioxidants and anti-inflammatory compounds. Low fat load — easy on digestion without a gallbladder." },
      { name: "Berries (blueberries, strawberries)", note: "Polyphenols with strong anti-inflammatory and antioxidant effects. Good snack — low sugar load relative to most fruits." },
      { name: "Walnuts & flaxseed", note: "Plant-based omega-3s. Small amounts daily help shift the omega-6:omega-3 ratio, which drives joint inflammation." },
      { name: "Olive oil (extra virgin)", note: "Anti-inflammatory fats. Use as your main cooking and dressing oil. Keep quantities modest — still a fat load without a gallbladder." },
      { name: "Legumes (lentils, chickpeas, beans)", note: "Soluble fibre feeds good gut bacteria. When gut is settled — introduce gradually and in small amounts to avoid gas pressure on diverticula." },
      { name: "Turmeric", note: "Curcumin has well-studied anti-inflammatory properties. Add to cooking, or a small amount in warm water. Pairs with black pepper for better absorption." },
      { name: "Ginger", note: "Natural anti-inflammatory and digestive aid. Good in teas, cooking, or warm water. Particularly helpful for gut cramping." },
    ],
  },
  drinks: [
    { icon: "🚫", name: "Solo", verdict: "avoid", note: "Full sugar, high fructose, acidic. The clearest single change you can make — directly drives joint inflammation via uric acid, disrupts gut microbiome, and irritates diverticula." },
    { icon: "⚠️", name: "Pepsi Max", verdict: "reduce", note: "No sugar, but caffeine stimulates gut motility (worsened without a gallbladder), artificial sweeteners may disrupt microbiome, and carbonation adds gut pressure. Reduce gradually — don't go cold turkey if it's a strong habit." },
    { icon: "✅", name: "Plain sparkling water", verdict: "good", note: "The best direct swap. Gives the carbonation and cold drink sensation. Add a slice of lemon or lime to make it feel more like a 'drink'. Keep ice cold." },
    { icon: "✅", name: "Herbal teas (cold or hot)", verdict: "good", note: "Peppermint — particularly soothing for gut cramps. Chamomile — calming and anti-inflammatory. Ginger — gut motility support and mild anti-inflammatory. Can be made in batches and served cold." },
    { icon: "✅", name: "Water (plain)", verdict: "good", note: "Especially important when increasing fibre intake. Aim for 8+ glasses/day. Hydration directly affects gut motility and reduces pressure in diverticula." },
  ],
  normal: {
    fibre: [
      "Gradually increase soluble fibre — oats, legumes, fruit.",
      "Include some insoluble fibre — wholegrains, cooked vegetables — to keep gut moving and reduce pressure in diverticula pouches.",
      "Increase water intake alongside any fibre increase.",
      "Small, regular meals are better than large ones — reduces bile load (no gallbladder) and gut pressure.",
      "Introduce new high-fibre foods slowly, one at a time, so you can identify any triggers.",
    ],
    joints: [
      "Prioritise oily fish 2–3 times per week — most direct dietary lever for joint inflammation.",
      "Add turmeric and ginger to cooking regularly.",
      "Swap seed oils (sunflower, canola, corn) for olive oil as your primary cooking fat.",
      "Include walnuts or ground flaxseed daily — small amounts make a difference over weeks.",
      "Reducing Solo is the highest-impact single change for uric acid and joint inflammation.",
    ],
    gallbladder: [
      "Space meals at least 4 hours apart — continuous bile flow needs time to replenish.",
      "Keep individual meal fat content low-to-moderate. Spread fat across the day rather than one big serving.",
      "Avoid large, fatty meals — these overwhelm the continuous bile drip and cause cramping.",
      "Fatty fish (salmon, sardines) is beneficial for joints — but eat in modest portions and not with other high-fat foods in the same meal.",
      "Cook with small amounts of olive oil rather than deep frying or pan frying in excess oil.",
    ],
  },
  flare: {
    fibre: [
      "During a flare, reduce insoluble fibre (wholegrains, raw vegetables, skins).",
      "Stick to easy-to-digest, low-residue foods: white rice, white bread, cooked peeled vegetables, eggs, lean chicken.",
      "Avoid legumes and raw salads until the flare settles — these add gas pressure.",
      "Small sips of water frequently — stay hydrated but don't flood the gut.",
      "Avoid Pepsi Max entirely during flares — caffeine and carbonation will worsen cramping.",
    ],
    joints: [
      "During a gut flare, systemic inflammation is elevated — joint pain may worsen regardless of diet.",
      "Focus on anti-inflammatory foods that are also gut-gentle: ginger tea, cooked salmon, olive oil.",
      "Avoid Solo entirely — fructose worsens both gut and joint inflammation.",
      "Keep meals very small and low-fat to reduce gut stress that feeds systemic inflammation.",
    ],
    gallbladder: [
      "During a flare, fat tolerance is reduced further — keep meals very low fat.",
      "Stick to lean protein: poached chicken, white fish, eggs.",
      "Avoid dairy, fatty fish, and oils until the flare settles.",
      "Small, frequent meals (every 3–4 hours) rather than any large meals.",
      "Bone broth or diluted vegetable soup can be helpful — easy to digest and soothing.",
    ],
  },
};

function setFlareMode(isFlare) {
  healthFlareMode = isFlare;
  renderHealthPanel();
}

function renderHealthPanel() {
  const el = document.getElementById("health-content");
  if (!el) return;

  const mode = healthFlareMode ? "flare" : "normal";
  const modeData = HEALTH_DATA[mode];

  // Traffic light rows
  function trafficRows(items, dotClass) {
    return items.map(item => `
      <div class="traffic-row">
        <div class="traffic-dot ${dotClass}"></div>
        <div class="traffic-info">
          <div class="traffic-name">${item.name}</div>
          <div class="traffic-note">${item.note}</div>
        </div>
      </div>`).join("");
  }

  // Drink rows
  const drinkRows = HEALTH_DATA.drinks.map(d => {
    const pillCls = d.verdict === "avoid" ? "pill-red" : d.verdict === "reduce" ? "pill-amber" : "pill-green";
    const pillTxt = d.verdict === "avoid" ? "Avoid" : d.verdict === "reduce" ? "Reduce" : "Good choice";
    return `<div class="drink-row">
      <div class="drink-icon">${d.icon}</div>
      <div class="drink-info">
        <div class="drink-name">${d.name} <span class="pill ${pillCls}" style="font-size:10px;margin-left:4px;">${pillTxt}</span></div>
        <div class="drink-note">${d.note}</div>
      </div>
    </div>`;
  }).join("");

  // Tip list
  function tipList(tips, cls) {
    return tips.map(t => `
      <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:7px;">
        <i class="ti ti-circle-check" style="color:var(--green);font-size:14px;flex-shrink:0;margin-top:1px;"></i>
        <span style="font-size:12px;color:var(--muted);line-height:1.6;">${t}</span>
      </div>`).join("");
  }

  const modeLabel = healthFlareMode
    ? `<span class="pill pill-amber">Flare mode — settle &amp; protect</span>`
    : `<span class="pill pill-green">Normal mode — maintain &amp; improve</span>`;

  const flareNotice = healthFlareMode
    ? `<div class="health-tip-box amber" style="margin-bottom:16px;">
        <strong>⚠️ Flare mode is on.</strong> Guidance below is adjusted for when your gut is actively inflamed or cramping. Switch back to Normal once settled.
      </div>`
    : `<div class="health-tip-box" style="margin-bottom:16px;">
        <strong>Your conditions at a glance:</strong> Diverticula · No gallbladder · Joint inflammation (gut-driven). All three are connected — managing gut inflammation is the common lever.
      </div>`;

  el.innerHTML = `
    <div class="flare-toggle">
      <button class="flare-btn ${!healthFlareMode ? "active-normal" : ""}" onclick="setFlareMode(false)">
        <i class="ti ti-sun" style="display:block;font-size:16px;margin-bottom:3px;"></i>Normal — settled gut
      </button>
      <button class="flare-btn ${healthFlareMode ? "active-flare" : ""}" onclick="setFlareMode(true)">
        <i class="ti ti-flame" style="display:block;font-size:16px;margin-bottom:3px;"></i>Flare — gut inflamed
      </button>
    </div>

    ${flareNotice}

    <!-- DRINKS -->
    <div class="card">
      <h2><i class="ti ti-glass" style="font-size:16px;vertical-align:-2px;margin-right:6px;"></i>Drinks guide</h2>
      ${drinkRows}
    </div>

    <!-- TRAFFIC LIGHTS — only in normal mode -->
    ${!healthFlareMode ? `
    <div class="card">
      <h2><i class="ti ti-traffic-lights" style="font-size:16px;vertical-align:-2px;margin-right:6px;"></i>Food traffic lights</h2>
      <div class="health-section-title" style="margin-top:0;">🔴 Avoid</div>
      ${trafficRows(HEALTH_DATA.traffic.avoid, "traffic-dot-red")}
      <div class="health-section-title">🟡 Reduce</div>
      ${trafficRows(HEALTH_DATA.traffic.reduce, "traffic-dot-amber")}
      <div class="health-section-title">🟢 Good choices</div>
      ${trafficRows(HEALTH_DATA.traffic.good, "traffic-dot-green")}
      <div class="health-section-title">⚪ Okay</div>
      ${trafficRows(HEALTH_DATA.traffic.okay, "traffic-dot-gray")}
    </div>` : ""}

    <!-- DIVERTICULA / FIBRE -->
    <div class="card">
      <h2><i class="ti ti-gut" style="font-size:16px;vertical-align:-2px;margin-right:6px;"></i>Gut &amp; diverticula</h2>
      ${tipList(modeData.fibre)}
    </div>

    <!-- NO GALLBLADDER -->
    <div class="card">
      <h2><i class="ti ti-scale" style="font-size:16px;vertical-align:-2px;margin-right:6px;"></i>No gallbladder — key rules</h2>
      ${tipList(modeData.gallbladder)}
    </div>

    <!-- JOINT INFLAMMATION -->
    <div class="card">
      <h2><i class="ti ti-activity" style="font-size:16px;vertical-align:-2px;margin-right:6px;"></i>Joint inflammation</h2>
      ${tipList(modeData.joints)}
    </div>

    <div class="info-box" style="margin-top:4px;">
      <i class="ti ti-info-circle" style="font-size:13px;vertical-align:-2px;margin-right:4px;"></i>
      This guidance is personalised to your specific conditions (diverticula, no gallbladder, joint inflammation) and is for informational purposes. For medical nutrition advice, consult a dietitian or gastroenterologist.
    </div>
  `;
}

// ── Global exports & init ────────────────────────────────────────────────────

window.switchTab         = switchTab;
window.setFlareMode      = setFlareMode;
window.renderHealthPanel = renderHealthPanel;
window.calcBMI           = calcBMI;
window.toggleCat         = toggleCat;
window.addFood           = addFood;
window.removeFood        = removeFood;
window.updateFood        = updateFood;
window.updateFoodPortion = updateFoodPortion;
window.cycleMeal         = cycleMeal;
window.renderPortionsTab = renderPortionsTab;
window.generateMealPlan  = generateMealPlan;
window.emailBodyData     = emailBodyData;
window.emailFoodsData    = emailFoodsData;
window.emailMealPlan     = emailMealPlan;
window.addTryItem        = addTryItem;
window.removeTryItem     = removeTryItem;
window.updateTryItem     = updateTryItem;
window.emailTryList      = emailTryList;
window.addAvoidItem      = addAvoidItem;
window.removeAvoidItem   = removeAvoidItem;
window.updateAvoidItem   = updateAvoidItem;
window.emailAvoidList    = emailAvoidList;

// Load persisted data then render
loadFromStorage();
renderFoods();
loadBodyFromStorage();
renderTryList();
renderAvoidList();
renderHealthPanel();
