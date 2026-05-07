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

function toggleCat(id)                       { openCats[id] = !openCats[id]; renderFoods(); }
function addFood(catId)                      { foods[catId].push({ name:"", freq:"", days:"", score:"" }); openCats[catId] = true; renderFoods(); }
function removeFood(catId, idx)              { foods[catId].splice(idx, 1); renderFoods(); }
function updateFood(catId, idx, field, val)  { foods[catId][idx][field] = val; }

function getAllFoods() {
  const all = [];
  CATEGORIES.forEach(cat => {
    foods[cat.id].forEach(f => {
      if (f.name && f.name.trim()) all.push({ ...f, category: cat.label, catId: cat.id });
    });
  });
  return all;
}

// ── Meal plan — pure logic, no API ───────────────────────────────────────────

function portionLabel(bmi, catId) {
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
  if (catId === "vegetables" && b >= 25) return "Generous serving — fill half the plate";
  return "";
}

function pickFoods(pool, count) {
  // Weight by days/week so frequently eaten foods appear more
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

  // Bucket foods by experience score
  const highExp  = allFood.filter(f => parseInt(f.score) >= 7);
  const midExp   = allFood.filter(f => parseInt(f.score) >= 5 && parseInt(f.score) < 7);
  const lowExp   = allFood.filter(f => parseInt(f.score) > 0  && parseInt(f.score) < 5);
  const unscored = allFood.filter(f => !f.score || f.score === "");

  // Fallback: if a bucket is empty use all foods
  const breakfastPool = (midExp.length  ? [...midExp,  ...unscored] : allFood);
  const lunchPool     = (lowExp.length  ? [...lowExp,  ...unscored] : allFood);
  const dinnerPool    = (highExp.length ? [...highExp, ...unscored] : allFood);
  const snackPool     = allFood.filter(f => f.catId === "snacks" || f.catId === "fruits");

  // Plan summary tips
  const tips = [];
  if (goal === "lose")        tips.push("Calorie deficit — reduced carb portions at each meal.");
  else if (goal === "gain")   tips.push("Muscle gain — larger protein portions and extra complex carbs.");
  else if (goal === "performance") tips.push("Performance — carb-forward meals around activity.");
  if (bmi && parseFloat(bmi) >= 30)   tips.push("Larger vegetable portions to increase satiety.");
  if (bmi && parseFloat(bmi) < 18.5)  tips.push("Generous portions — prioritise calorie-dense foods.");
  tips.push("Low-experience foods (score 1–4) scheduled at lunch.");
  tips.push("High-experience foods (score 7–10) scheduled at dinner.");

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
      const portion = portionLabel(bmi, main.catId);
      const sc      = parseInt(main.score) || 0;
      const badge   = sc >= 7 ? { cls: "pill-green", txt: "High benefit" }
                    : sc <= 3 && sc > 0 ? { cls: "pill-amber", txt: "Easier at this time" }
                    : null;

      dayHtml += `<div class="meal-slot">
        <div class="meal-time">${slot.time}<br><span style="font-size:10px;">${slot.type}</span></div>
        <div class="meal-body">
          <div class="meal-name">${name}</div>
          ${portion ? `<div style="font-size:11px;color:#888;margin-top:3px;">
            <i class="ti ti-ruler" style="font-size:11px;vertical-align:-1px;margin-right:3px;"></i>${portion}
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

// ── Global exports & init ────────────────────────────────────────────────────

window.switchTab        = switchTab;
window.calcBMI          = calcBMI;
window.toggleCat        = toggleCat;
window.addFood          = addFood;
window.removeFood       = removeFood;
window.updateFood       = updateFood;
window.generateMealPlan = generateMealPlan;

renderFoods();
