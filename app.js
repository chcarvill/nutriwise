const API = "https://nutriwise-proxy.chriscarvill.workers.dev";

const CATEGORIES = [
  { id: "snacks", label: "Snacks & desserts", icon: "ti-cookie" },
  { id: "drinks", label: "Drinks & beverages", icon: "ti-glass" },
  { id: "vegetables", label: "Vegetables", icon: "ti-leaf" },
  { id: "fruits", label: "Fruits", icon: "ti-apple" },
  { id: "legumes", label: "Legumes & pulses", icon: "ti-circle-dotted" },
  { id: "starches", label: "Starch & carbohydrates", icon: "ti-bread" },
  { id: "protein", label: "Lean meat & protein", icon: "ti-meat" },
  { id: "dairy", label: "Dairy & alternatives", icon: "ti-droplet" },
  { id: "condiments", label: "Condiments & sauces", icon: "ti-bottle" }
];

let foods = {};
CATEGORIES.forEach(c => (foods[c.id] = []));
let openCats = { snacks: true };
let bodyData = {};

function switchTab(t) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("panel-" + t).classList.add("active");
  document.getElementById("tab-" + t).classList.add("active");
}

function calcBMI() {
  const hVal = parseFloat(document.getElementById("height-val").value);
  const hUnit = document.getElementById("height-unit").value;
  const wVal = parseFloat(document.getElementById("weight-val").value);
  const wUnit = document.getElementById("weight-unit").value;
  const activity = document.getElementById("activity-val").value;
  const goal = document.getElementById("bodygoal-val").value;

  if (!hVal || !wVal) return;

  let hM = hUnit === "cm" ? hVal / 100 : hVal * 0.3048;
  let wKg = wUnit === "kg" ? wVal : wVal * 0.453592;

  const bmi = wKg / (hM * hM);
  let bmiCat, bmiColor;
  if (bmi < 18.5) { bmiCat = "Underweight"; bmiColor = "#BA7517"; }
  else if (bmi < 25) { bmiCat = "Healthy weight"; bmiColor = "#1D9E75"; }
  else if (bmi < 30) { bmiCat = "Overweight"; bmiColor = "#EF9F27"; }
  else { bmiCat = "Obese range"; bmiColor = "#E24B4A"; }

  const pct = Math.min(100, Math.max(0, ((bmi - 15) / (45 - 15)) * 100));

  document.getElementById("bmi-num").textContent = bmi.toFixed(1);
  document.getElementById("bmi-num").style.color = bmiColor;
  document.getElementById("bmi-cat").textContent = bmiCat;
  document.getElementById("bmi-fill").style.width = pct + "%";
  document.getElementById("bmi-fill").style.background = bmiColor;
  document.getElementById("bmi-marker").style.left = pct + "%";

  // Estimate TDEE using weight & height only (Mifflin base without age/sex factor)
  const bmrApprox = 10 * wKg + 6.25 * hM * 100;
  const mults = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryactive: 1.9 };
  let tdee = Math.round(bmrApprox * (mults[activity] || 1.55));
  if (goal === "lose") tdee -= 500;
  else if (goal === "gain") tdee += 300;
  document.getElementById("tdee-num").textContent = tdee.toLocaleString();
  document.getElementById("tdee-sub").textContent =
    goal === "lose" ? "deficit target" : goal === "gain" ? "surplus target" : "maintenance";

  const minKg = Math.round(18.5 * hM * hM * 10) / 10;
  const maxKg = Math.round(24.9 * hM * hM * 10) / 10;
  const idealStr =
    wUnit === "kg"
      ? `${minKg}–${maxKg} kg`
      : `${Math.round(minKg * 2.205 * 10) / 10}–${Math.round(maxKg * 2.205 * 10) / 10} lbs`;
  document.getElementById("ideal-num").textContent = idealStr;

  let portionNote = "";
  if (bmi < 18.5)
    portionNote = "Your BMI suggests underweight. Portions should be generous — focus on calorie-dense, nutrient-rich foods. Aim for larger servings of healthy fats, proteins and complex carbs.";
  else if (bmi < 25)
    portionNote = "Your BMI is in the healthy range. Standard portions apply — use the plate method: half vegetables, quarter protein, quarter complex carbs. Maintain this balance.";
  else if (bmi < 30)
    portionNote = "Your BMI suggests overweight. Moderate your portions — reduce carbohydrate servings by ~25%, prioritise protein and non-starchy vegetables. Use smaller plates.";
  else
    portionNote = "Your BMI is in the obese range. Portion control is important — halve starch/carb servings, double non-starchy vegetables, and keep protein portions palm-sized. Consider consulting a dietitian.";

  document.getElementById("portion-guide").innerHTML =
    '<i class="ti ti-ruler" style="font-size:14px;vertical-align:-2px;margin-right:5px;" aria-hidden="true"></i><strong style="font-weight:500;">Portion guidance:</strong> ' + portionNote;

  document.getElementById("bmi-result").style.display = "block";
  bodyData = { bmi: bmi.toFixed(1), bmiCat, wKg, hM, activity, goal };
}

function renderFoods() {
  const el = document.getElementById("food-categories");
  el.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const isOpen = openCats[cat.id];
    const items = foods[cat.id];
    let rowsHtml = "";
    items.forEach((item, idx) => {
      rowsHtml += `<div class="food-row">
        <input class="food-name-input" type="text" placeholder="Food name..." value="${item.name || ""}" oninput="updateFood('${cat.id}',${idx},'name',this.value)" />
        <input class="num-input" type="number" min="1" max="10" value="${item.freq || ""}" placeholder="—" title="Times per day (1-10)" oninput="updateFood('${cat.id}',${idx},'freq',this.value)" />
        <input class="num-input" type="number" min="1" max="7" value="${item.days || ""}" placeholder="—" title="Days per week (1-7)" oninput="updateFood('${cat.id}',${idx},'days',this.value)" />
        <input class="num-input" type="number" min="1" max="10" value="${item.score || ""}" placeholder="—" title="Experience score (1-10)" oninput="updateFood('${cat.id}',${idx},'score',this.value)" />
        <button class="del-btn" onclick="removeFood('${cat.id}',${idx})" aria-label="Remove food"><i class="ti ti-x" aria-hidden="true"></i></button>
      </div>`;
    });
    const div = document.createElement("div");
    div.className = "card";
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <div class="cat-header" onclick="toggleCat('${cat.id}')">
        <div class="cat-title"><i class="ti ${cat.icon}" style="font-size:17px;" aria-hidden="true"></i>${cat.label} <span class="pill pill-gray">${items.length}</span></div>
        <i class="ti ${isOpen ? "ti-chevron-up" : "ti-chevron-down"}" style="font-size:16px;color:var(--color-text-secondary);" aria-hidden="true"></i>
      </div>
      ${isOpen ? `<div class="cat-body">
        ${items.length > 0 ? `<div class="food-row-header">
          <span style="font-size:10px;color:#888;">Food / beverage</span>
          <span class="col-head" title="Times per day">×/day</span>
          <span class="col-head" title="Days per week">d/wk</span>
          <span class="col-head" title="Experience 1-10">exp.</span>
          <span></span>
        </div>` : ""}
        ${rowsHtml}
        <button class="add-food-btn" onclick="addFood('${cat.id}')"><i class="ti ti-plus" style="font-size:14px;" aria-hidden="true"></i>Add ${cat.label.toLowerCase()}</button>
      </div>` : ""}
    `;
    el.appendChild(div);
  });
}

function toggleCat(id) { openCats[id] = !openCats[id]; renderFoods(); }
function addFood(catId) { foods[catId].push({ name: "", freq: "", days: "", score: "" }); openCats[catId] = true; renderFoods(); }
function removeFood(catId, idx) { foods[catId].splice(idx, 1); renderFoods(); }
function updateFood(catId, idx, field, val) { foods[catId][idx][field] = val; }

function getAllFoods() {
  const all = [];
  CATEGORIES.forEach(cat => {
    foods[cat.id].forEach(f => { if (f.name) all.push({ ...f, category: cat.label }); });
  });
  return all;
}

function getFoodSummary() {
  const all = getAllFoods();
  if (!all.length) return "No foods logged yet.";
  return all
    .map(f => `${f.name} (${f.category}): ${f.freq || "?"}x/day, ${f.days || "?"}d/week, experience ${f.score || "?"}/10`)
    .join("\n");
}

async function callClaude(prompt, system) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) throw new Error("API " + res.status);
  const d = await res.json();
  return d.content.map(b => b.text || "").join("");
}

async function analyseFood() {
  const food = document.getElementById("food-input").value.trim();
  const goal = document.getElementById("goal-select").value;
  if (!food) return;

  const btn = document.getElementById("analyse-btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Analysing...';
  const resultEl = document.getElementById("analyse-result");
  resultEl.innerHTML =
    '<div style="text-align:center;padding:2rem;color:#888;font-size:13px;"><i class="ti ti-leaf" style="font-size:24px;display:block;margin-bottom:8px;opacity:.5;" aria-hidden="true"></i>Checking nutritional profile...</div>';

  const bmiCtx = bodyData.bmi
    ? `User BMI: ${bodyData.bmi} (${bodyData.bmiCat}), goal: ${bodyData.goal || "general health"}.`
    : "";
  const sys = `You are a nutrition expert. Respond ONLY in valid JSON. No markdown, no backticks.`;
  const prompt = `Analyse "${food}"${goal ? " for " + goal : ""}.${bmiCtx}
Return JSON:
{"name":"","category":"","suitability_score":0,"suitability_label":"Excellent/Good/Moderate/Poor/Avoid","summary":"2 sentences","bmi_portion_note":"portion guidance based on user BMI if provided","timing":[{"period":"","rating":"Ideal/Good/Moderate/Avoid","reason":""}],"triggers":[{"name":"","severity":"Low/Moderate/High","description":""}],"benefits":[],"pairs_well_with":[],"nutrition_tip":""}`;

  try {
    const raw = await callClaude(prompt, sys);
    const d = JSON.parse(raw.replace(/```json|```/g, "").trim());
    renderAnalysis(d);
  } catch (e) {
    resultEl.innerHTML = '<div class="error-msg">Could not analyse this food. Please try again.</div>';
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-search" style="font-size:14px;vertical-align:-2px;margin-right:5px;" aria-hidden="true"></i>Analyse food';
}

function ratingColor(r) {
  if (r === "Ideal") return "#1D9E75";
  if (r === "Good") return "#639922";
  if (r === "Moderate") return "#BA7517";
  return "#E24B4A";
}

function renderAnalysis(d) {
  const sc = d.suitability_score;
  const scoreCol = sc >= 80 ? "#1D9E75" : sc >= 60 ? "#639922" : sc >= 40 ? "#BA7517" : "#E24B4A";
  const pillCls =
    d.suitability_label === "Excellent" || d.suitability_label === "Good"
      ? "pill-green"
      : d.suitability_label === "Moderate"
      ? "pill-amber"
      : "pill-red";

  document.getElementById("analyse-result").innerHTML = `
  <div class="card">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">
      <div><p style="font-size:16px;font-weight:500;">${d.name}</p><p style="font-size:12px;color:#888;">${d.category}</p></div>
      <span class="pill ${pillCls}" style="font-size:12px;padding:4px 12px;">${d.suitability_label}</span>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#666;margin-bottom:10px;">${d.summary}</p>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
      <span style="font-size:12px;color:#888;">Suitability</span>
      <span style="font-size:18px;font-weight:500;color:${scoreCol};">${sc}/100</span>
    </div>
    <div style="height:6px;border-radius:3px;background:#f0f0f0;margin-bottom:12px;overflow:hidden;">
      <div style="height:100%;border-radius:3px;width:${sc}%;background:${scoreCol};"></div>
    </div>
    ${d.bmi_portion_note ? `<div class="info-box" style="margin-bottom:12px;"><i class="ti ti-ruler" style="font-size:13px;vertical-align:-2px;margin-right:4px;" aria-hidden="true"></i><strong style="font-weight:500;">Portion for you:</strong> ${d.bmi_portion_note}</div>` : ""}
    <div class="section-label" style="margin-top:0;">Best times to eat</div>
    ${(d.timing || []).map(t => `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:0.5px solid #e8e8e8;">
      <div style="width:7px;height:7px;border-radius:50%;background:${ratingColor(t.rating)};flex-shrink:0;"></div>
      <div style="flex:1;"><span style="font-size:12px;font-weight:500;">${t.period}</span><span style="font-size:11px;color:#888;margin-left:8px;">${t.reason}</span></div>
      <span style="font-size:11px;font-weight:500;color:${ratingColor(t.rating)};">${t.rating}</span>
    </div>`).join("")}
    <div class="section-label">Triggers</div>
    ${(d.triggers || []).map(t => `<div style="padding:7px 0;border-bottom:0.5px solid #e8e8e8;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
        <span style="font-size:12px;font-weight:500;">${t.name}</span>
        <span class="pill ${t.severity === "High" ? "pill-red" : t.severity === "Moderate" ? "pill-amber" : "pill-gray"}" style="font-size:10px;">${t.severity}</span>
      </div>
      <p style="font-size:12px;color:#888;">${t.description}</p>
    </div>`).join("")}
    <div class="section-label">Benefits</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">${(d.benefits || []).map(b => `<span class="pill pill-green">${b}</span>`).join("")}</div>
    <div class="section-label">Pairs well with</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">${(d.pairs_well_with || []).map(f => `<span class="pill pill-blue">${f}</span>`).join("")}</div>
    <div class="info-box"><i class="ti ti-bulb" style="font-size:13px;vertical-align:-2px;margin-right:4px;" aria-hidden="true"></i><strong style="font-weight:500;">Tip:</strong> ${d.nutrition_tip}</div>
  </div>`;
}

async function generateMealPlan() {
  const days = document.getElementById("plan-days").value;
  const cuisine = document.getElementById("plan-cuisine").value;
  const allFoods = getFoodSummary();
  const btn = document.getElementById("plan-btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Building your plan...';
  const resultEl = document.getElementById("mealplan-result");
  resultEl.innerHTML =
    '<div style="text-align:center;padding:2rem;color:#888;font-size:13px;"><i class="ti ti-calendar" style="font-size:24px;display:block;margin-bottom:8px;opacity:.5;" aria-hidden="true"></i>Crafting a personalised plan from your food library...</div>';

  const bmiCtx = bodyData.bmi
    ? `BMI: ${bodyData.bmi} (${bodyData.bmiCat}), goal: ${bodyData.goal}.`
    : "";
  const sys = `You are a registered dietitian. Respond ONLY in valid JSON. No markdown, no backticks.`;
  const prompt = `Create a ${days}-day ${cuisine} meal plan. ${bmiCtx}

User's food library (name, category, freq/day, days/week, experience 1-10):
${allFoods}

Rules:
- Prioritise high-experience foods (score 7-10) for dinner
- Schedule low-experience foods (score 1-4) at lunch where possible
- Incorporate user's actual foods where suitable
- Add complementary foods for nutrition and variety
- Adjust portion sizes based on BMI and goal
- Return JSON:
{"plan_summary":"2 sentences","days":[{"day":"Day 1 — Monday","theme":"e.g. High protein day","meals":[{"time":"7:30am","meal_type":"Breakfast","name":"","description":"key ingredients and method","portion_note":"specific portion for this user","nutrition_highlight":""}]}],"weekly_tip":""}`;

  try {
    const raw = await callClaude(prompt, sys);
    const d = JSON.parse(raw.replace(/```json|```/g, "").trim());
    renderMealPlan(d);
  } catch (e) {
    resultEl.innerHTML = '<div class="error-msg">Could not generate meal plan. Please try again.</div>';
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-calendar-plus" style="font-size:14px;vertical-align:-2px;margin-right:5px;" aria-hidden="true"></i>Generate personalised meal plan';
}

function renderMealPlan(data) {
  let html = `<div class="card" style="margin-bottom:1rem;">
    <p style="font-size:13px;line-height:1.6;color:#666;">${data.plan_summary}</p>
  </div>`;
  (data.days || []).forEach(day => {
    html += `<div class="card">
      <p style="font-size:14px;font-weight:500;margin-bottom:2px;">${day.day}</p>
      ${day.theme ? `<p style="font-size:11px;color:#888;margin-bottom:10px;">${day.theme}</p>` : ""}
      ${(day.meals || []).map(m => `<div class="meal-slot">
        <div class="meal-time">${m.time}<br><span style="font-size:10px;">${m.meal_type}</span></div>
        <div class="meal-body">
          <div class="meal-name">${m.name}</div>
          <div class="meal-desc">${m.description}</div>
          ${m.portion_note ? `<div style="margin-top:4px;font-size:11px;color:#888;"><i class="ti ti-ruler" style="font-size:12px;vertical-align:-2px;" aria-hidden="true"></i> ${m.portion_note}</div>` : ""}
          ${m.nutrition_highlight ? `<div style="margin-top:4px;"><span class="pill pill-blue" style="font-size:10px;">${m.nutrition_highlight}</span></div>` : ""}
        </div>
      </div>`).join("")}
    </div>`;
  });
  if (data.weekly_tip)
    html += `<div class="info-box"><i class="ti ti-bulb" style="font-size:13px;vertical-align:-2px;margin-right:4px;" aria-hidden="true"></i><strong style="font-weight:500;">Weekly tip:</strong> ${data.weekly_tip}</div>`;
  document.getElementById("mealplan-result").innerHTML = html;
}

window.switchTab = switchTab;
window.calcBMI = calcBMI;
window.toggleCat = toggleCat;
window.addFood = addFood;
window.removeFood = removeFood;
window.updateFood = updateFood;
window.analyseFood = analyseFood;
window.generateMealPlan = generateMealPlan;

renderFoods();
