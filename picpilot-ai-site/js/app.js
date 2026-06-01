const scenes = ["电商主图", "小红书封面", "朋友圈海报", "节日促销"];
const styles = ["极简高级", "黑金奢华", "清新自然", "科技蓝紫", "国潮醒目", "可爱活力"];
const industries = ["美妆护肤", "食品饮料", "服饰鞋包", "数码家电", "家居生活", "母婴用品", "宠物用品", "本地服务"];
const templates = [
  { name: "爆款主图", scene: "电商主图", style: "极简高级", tone: "专业可信", promo: "新品首发，到手立减" },
  { name: "种草封面", scene: "小红书封面", style: "清新自然", tone: "温柔治愈", promo: "自用好物，限时福利" },
  { name: "黑金大促", scene: "节日促销", style: "黑金奢华", tone: "强促销转化", promo: "今晚 8 点，限量秒杀" },
  { name: "年轻潮流", scene: "朋友圈海报", style: "可爱活力", tone: "年轻活力", promo: "朋友专享，今日下单更划算" },
  { name: "科技新品", scene: "电商主图", style: "科技蓝紫", tone: "高级克制", promo: "新品预售，提前锁定" },
];
const ideaBank = [
  { title: "云感护颈枕", industry: "家居生活", benefits: "慢回弹支撑，午休不压颈，办公室和旅行都能用", target: "久坐办公人群、学生党", promo: "今日下单送收纳袋" },
  { title: "冻干水果燕麦杯", industry: "食品饮料", benefits: "真实果粒，低糖高纤，3 分钟快速早餐", target: "健身人群、上班族、学生党", promo: "第二件半价" },
  { title: "小云朵补水面膜", industry: "美妆护肤", benefits: "急救补水，轻薄服帖，熬夜后也能快速提亮", target: "年轻女性、熬夜党", promo: "买 2 盒送旅行装" },
  { title: "磁吸快充移动电源", industry: "数码家电", benefits: "小巧便携，磁吸快充，出门不断电", target: "通勤族、旅行用户、数码爱好者", promo: "限时 8 折，新品首发" },
];
const storageKey = "picpilot-project-history";

let selectedScene = scenes[0];
let selectedStyle = styles[0];
let selectedIndustry = industries[4];
let uploadedImage = null;
let currentEditorSvg = "";

const routePages = [...document.querySelectorAll(".page")];
const resultGrid = document.querySelector("#resultGrid");
const editorCanvas = document.querySelector("#editorCanvas");

function setRoute() {
  const route = (location.hash || "#home").replace("#", "");
  routePages.forEach((page) => page.classList.toggle("active", page.dataset.route === route));
  document.querySelectorAll(".nav a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${route}`));
}

function renderOptions(targetId, options, current, onSelect) {
  const target = document.querySelector(targetId);
  target.innerHTML = "";
  options.forEach((option) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `option-chip ${option === current ? "selected" : ""}`;
    chip.textContent = option;
    chip.addEventListener("click", () => onSelect(option));
    target.appendChild(chip);
  });
}

function selectedPalette(style) {
  const palettes = {
    "极简高级": ["#0f1117", "#f8fafc", "#6366f1"],
    "黑金奢华": ["#0b0b0f", "#f59e0b", "#f8fafc"],
    "清新自然": ["#102018", "#22c55e", "#f8fafc"],
    "科技蓝紫": ["#0f172a", "#6366f1", "#38bdf8"],
    "国潮醒目": ["#18080a", "#ef4444", "#f59e0b"],
    "可爱活力": ["#201332", "#f472b6", "#facc15"],
  };
  return palettes[style] || palettes["极简高级"];
}

function escapeXml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  }[char]));
}

function createPosterSvg({ width = 1080, height = 1080, title, subtitle, badge, scene, style, image, accent }) {
  const [bg, primary, secondary] = selectedPalette(style);
  const highlight = accent || secondary;
  const safeTitle = escapeXml(title || "商品名称");
  const safeSubtitle = escapeXml(subtitle || "核心卖点自动提炼");
  const safeBadge = escapeXml(badge || scene);
  const imageMarkup = image
    ? `<image href="${image}" x="${width * 0.24}" y="${height * 0.34}" width="${width * 0.52}" height="${height * 0.38}" preserveAspectRatio="xMidYMid meet" opacity="0.96"/>`
    : `<g transform="translate(${width * 0.5} ${height * 0.52})"><ellipse cx="0" cy="120" rx="210" ry="34" fill="#000" opacity=".25"/><rect x="-92" y="-150" width="184" height="300" rx="46" fill="url(#productGrad)"/><rect x="-58" y="-120" width="116" height="190" rx="28" fill="#ffffff" opacity=".12"/></g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#171b24"/></linearGradient>
      <radialGradient id="halo" cx="50%" cy="42%" r="54%"><stop offset="0" stop-color="${highlight}" stop-opacity=".42"/><stop offset="1" stop-color="${highlight}" stop-opacity="0"/></radialGradient>
      <linearGradient id="productGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${highlight}"/></linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bgGrad)"/>
    <circle cx="${width * 0.75}" cy="${height * 0.2}" r="${width * 0.36}" fill="url(#halo)"/>
    <path d="M0 ${height * 0.78} C ${width * 0.25} ${height * 0.68}, ${width * 0.62} ${height * 0.88}, ${width} ${height * 0.74} L ${width} ${height} L 0 ${height} Z" fill="${highlight}" opacity=".12"/>
    <rect x="${width * 0.08}" y="${height * 0.08}" width="${width * 0.34}" height="${height * 0.07}" rx="${height * 0.035}" fill="${highlight}" opacity=".18"/>
    <text x="${width * 0.11}" y="${height * 0.125}" fill="${highlight}" font-size="${height * 0.032}" font-weight="800" font-family="Arial, sans-serif">${safeBadge}</text>
    ${imageMarkup}
    <text x="${width * 0.08}" y="${height * 0.21}" fill="#f8fafc" font-size="${height * 0.07}" font-weight="900" font-family="Arial, sans-serif">${safeTitle}</text>
    <text x="${width * 0.08}" y="${height * 0.285}" fill="#cbd5e1" font-size="${height * 0.034}" font-weight="500" font-family="Arial, sans-serif">${safeSubtitle}</text>
    <text x="${width * 0.08}" y="${height * 0.9}" fill="#f8fafc" font-size="${height * 0.038}" font-weight="800" font-family="Arial, sans-serif">PicPilot AI Generated</text>
    <text x="${width * 0.08}" y="${height * 0.94}" fill="#94a3b8" font-size="${height * 0.026}" font-family="Arial, sans-serif">${escapeXml(scene)} · ${escapeXml(style)} · 可商用视觉草案</text>
  </svg>`;
}

function downloadTextFile(filename, content, type = "image/svg+xml") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadPngFromSvg(svg, filename) {
  const match = svg.match(/<svg[^>]*width="(\d+)"[^>]*height="(\d+)"/);
  const width = match ? Number(match[1]) : 1080;
  const height = match ? Number(match[2]) : 1080;
  const img = new Image();
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
  };
  img.src = url;
}

function getFormState() {
  return {
    title: document.querySelector("#productName").value.trim(),
    benefits: document.querySelector("#productBenefits").value.trim(),
    targetUser: document.querySelector("#targetUser").value.trim(),
    promotion: document.querySelector("#promotion").value.trim(),
    tone: document.querySelector("#brandTone").value,
    brandColor: document.querySelector("#brandColor").value,
    scene: selectedScene,
    style: selectedStyle,
    industry: selectedIndustry,
    savedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
  };
}

function buildPrompt(state) {
  return [
    `为“${state.title || "商品"}”生成一张${state.scene}。`,
    `行业：${state.industry}。视觉风格：${state.style}。品牌语气：${state.tone}。`,
    `核心卖点：${state.benefits || "突出商品质感、使用场景和购买理由"}。`,
    `目标人群：${state.targetUser || "潜在购买用户"}。促销信息：${state.promotion || "新品优惠"}。`,
    `画面要求：商品主体清晰居中，背景有商业质感，文案层级明确，留出安全边距，适合电商和社媒投放。`,
    `避免：杂乱背景、虚假夸张功效、过小文字、主体变形。`,
  ].join("\n");
}

function buildCopySuggestions(state) {
  const firstBenefit = (state.benefits || "品质升级").split(/[，,。；;、]/)[0];
  return [
    `${state.title || "这款好物"}，${firstBenefit}`,
    `给${state.targetUser || "日常生活"}的高效选择`,
    `${state.promotion || "限时福利"}，现在入手刚刚好`,
  ];
}

function renderCreativeTools(state) {
  const promptEl = document.querySelector("#promptPreview");
  const copyEl = document.querySelector("#copySuggestions");
  if (promptEl) promptEl.textContent = buildPrompt(state);
  if (copyEl) {
    copyEl.innerHTML = "";
    buildCopySuggestions(state).forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      copyEl.appendChild(p);
    });
  }
}

function scoreProject(state) {
  const benefitCount = state.benefits.split(/[，,。；;、\s]+/).filter(Boolean).length;
  const benefits = Math.min(99, 52 + benefitCount * 11 + (state.industry ? 8 : 0));
  const clarity = Math.min(99, 58 + (state.title.length > 2 ? 12 : 0) + (state.promotion.length > 3 ? 13 : 0) + (state.targetUser.length > 4 ? 10 : 0));
  const visual = Math.min(99, 68 + scenes.indexOf(state.scene) * 4 + styles.indexOf(state.style) * 2);
  document.querySelector("#scoreBenefits").textContent = `${benefits}%`;
  document.querySelector("#scoreClarity").textContent = `${clarity}%`;
  document.querySelector("#scoreVisual").textContent = `${visual}%`;
}

function generateCards() {
  const state = getFormState();
  const title = state.title;
  const benefits = state.benefits;
  const promotion = state.promotion;
  const target = state.targetUser;
  const subtitles = [benefits.split(/[，,。]/)[0], `${state.industry}专属视觉方案`, `面向${target || "目标用户"}种草`, "多平台营销素材草案"];
  const variants = [selectedScene, "高转化主图", "社媒种草", "限时活动"];
  resultGrid.innerHTML = "";

  variants.forEach((variant, index) => {
    const svg = createPosterSvg({
      title,
      subtitle: subtitles[index] || benefits,
      badge: index === 0 ? promotion : variant,
      scene: variant,
      style: styles[(styles.indexOf(selectedStyle) + index) % styles.length],
      image: uploadedImage,
      accent: state.brandColor,
    });
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = `${svg}<span class="chip amber">${variant}</span><p class="card-label">${title} · ${subtitles[index] || benefits}</p><div class="card-actions"><button class="card-edit">带入编辑器</button><button class="card-dl">下载 SVG</button></div>`;
    card.querySelector(".card-dl").addEventListener("click", () => downloadTextFile(`picpilot-${index + 1}.svg`, svg));
    card.querySelector(".card-edit").addEventListener("click", () => {
      document.querySelector("#editTitle").value = title;
      document.querySelector("#editSubtitle").value = subtitles[index] || benefits;
      document.querySelector("#editBadge").value = index === 0 ? promotion : variant;
      renderEditor();
      location.hash = "#editor";
    });
    resultGrid.appendChild(card);
  });

  document.querySelector("#resultHint").textContent = `已生成 ${variants.length} 张候选图，行业：${state.industry}，可继续编辑或下载。`;
  scoreProject(state);
  renderCreativeTools(state);
  document.querySelector("#editTitle").value = title;
  document.querySelector("#editSubtitle").value = subtitles[0] || benefits;
  document.querySelector("#editBadge").value = promotion;
  renderEditor();
}

function renderEditor() {
  const [width, height] = document.querySelector("#editSize").value.split("x").map(Number);
  const svg = createPosterSvg({
    width,
    height,
    title: document.querySelector("#editTitle").value,
    subtitle: document.querySelector("#editSubtitle").value,
    badge: document.querySelector("#editBadge").value,
    scene: selectedScene,
    style: selectedStyle,
    image: uploadedImage,
    accent: document.querySelector("#editAccent").value,
  });
  editorCanvas.style.width = width > height ? "720px" : "420px";
  currentEditorSvg = svg;
  editorCanvas.innerHTML = svg;
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function setHistory(items) {
  localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 6)));
  renderHistory();
}

function saveProject() {
  const state = getFormState();
  const items = getHistory().filter((item) => item.title !== state.title || item.savedAt !== state.savedAt);
  setHistory([state, ...items]);
}

function restoreProject(item) {
  document.querySelector("#productName").value = item.title;
  document.querySelector("#productBenefits").value = item.benefits;
  document.querySelector("#targetUser").value = item.targetUser || "";
  document.querySelector("#promotion").value = item.promotion;
  document.querySelector("#brandTone").value = item.tone || "专业可信";
  document.querySelector("#brandColor").value = item.brandColor || "#6366f1";
  selectedScene = item.scene || scenes[0];
  selectedStyle = item.style || styles[0];
  selectedIndustry = item.industry || industries[0];
  renderSceneOptions();
  renderStyleOptions();
  renderIndustryOptions();
  generateCards();
}

function renderHistory() {
  const list = document.querySelector("#historyList");
  if (!list) return;
  const items = getHistory();
  list.innerHTML = items.length ? "" : `<p class="card-label">暂无保存方案，点击“保存方案”后会出现在这里。</p>`;
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `<div><strong>${escapeXml(item.title || "未命名商品")}</strong><span>${escapeXml(item.industry || "通用")} · ${escapeXml(item.scene || "场景")} · ${escapeXml(item.savedAt || "")}</span></div><button>恢复</button>`;
    row.querySelector("button").addEventListener("click", () => restoreProject(item));
    list.appendChild(row);
  });
}

function bindEvents() {
  window.addEventListener("hashchange", setRoute);
  document.querySelector("#productUpload").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadedImage = reader.result;
      generateCards();
    };
    reader.readAsDataURL(file);
  });
  document.querySelector("#generateBtn").addEventListener("click", generateCards);
  document.querySelector("#saveProjectBtn").addEventListener("click", saveProject);
  document.querySelector("#clearHistoryBtn").addEventListener("click", () => setHistory([]));
  document.querySelector("#downloadAllBtn").addEventListener("click", () => alert("MVP 当前逐张下载。正式版可接入 JSZip 打包下载。"));
  document.querySelector("#refreshPromptBtn").addEventListener("click", () => renderCreativeTools(getFormState()));
  document.querySelector("#copyPromptBtn").addEventListener("click", () => navigator.clipboard?.writeText(buildPrompt(getFormState())));
  document.querySelector("#copyCopyBtn").addEventListener("click", () => navigator.clipboard?.writeText(buildCopySuggestions(getFormState()).join("\n")));
  document.querySelector("#randomIdeaBtn").addEventListener("click", () => {
    const idea = ideaBank[Math.floor(Math.random() * ideaBank.length)];
    document.querySelector("#productName").value = idea.title;
    document.querySelector("#productBenefits").value = idea.benefits;
    document.querySelector("#targetUser").value = idea.target;
    document.querySelector("#promotion").value = idea.promo;
    selectedIndustry = idea.industry;
    renderIndustryOptions();
    generateCards();
  });
  ["#brandTone", "#brandColor"].forEach((selector) => {
    document.querySelector(selector).addEventListener("change", generateCards);
  });
  ["#editTitle", "#editSubtitle", "#editBadge", "#editAccent", "#editSize"].forEach((selector) => {
    document.querySelector(selector).addEventListener("input", renderEditor);
    document.querySelector(selector).addEventListener("change", renderEditor);
  });
  document.querySelector("#downloadEditorBtn").addEventListener("click", () => {
    const svg = editorCanvas.querySelector("svg")?.outerHTML || "";
    downloadTextFile("picpilot-editor.svg", svg);
  });
  document.querySelector("#downloadPngBtn").addEventListener("click", () => {
    downloadPngFromSvg(currentEditorSvg || editorCanvas.querySelector("svg")?.outerHTML || "", "picpilot-editor.png");
  });
}

function renderSceneOptions() {
  renderOptions("#sceneOptions", scenes, selectedScene, (option) => {
    selectedScene = option;
    renderSceneOptions();
    generateCards();
  });
}

function renderStyleOptions() {
  renderOptions("#styleOptions", styles, selectedStyle, (option) => {
    selectedStyle = option;
    renderStyleOptions();
    generateCards();
  });
}

function renderIndustryOptions() {
  renderOptions("#industryOptions", industries, selectedIndustry, (option) => {
    selectedIndustry = option;
    renderIndustryOptions();
    generateCards();
  });
}

function renderTemplates() {
  const strip = document.querySelector("#templateStrip");
  if (!strip) return;
  strip.innerHTML = "";
  templates.forEach((template) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "template-card";
    card.innerHTML = `<strong>${escapeXml(template.name)}</strong><span>${escapeXml(template.scene)} · ${escapeXml(template.style)} · ${escapeXml(template.tone)}</span>`;
    card.addEventListener("click", () => {
      selectedScene = template.scene;
      selectedStyle = template.style;
      document.querySelector("#brandTone").value = template.tone;
      document.querySelector("#promotion").value = template.promo;
      renderSceneOptions();
      renderStyleOptions();
      generateCards();
    });
    strip.appendChild(card);
  });
}

function init() {
  renderSceneOptions();
  renderStyleOptions();
  renderIndustryOptions();
  renderTemplates();
  bindEvents();
  setRoute();
  generateCards();
  renderHistory();
}

init();
