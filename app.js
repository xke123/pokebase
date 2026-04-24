const types = [
  { id: "normal", zh: "一般", color: "#9fa19f" },
  { id: "fire", zh: "火", color: "#e66d2f" },
  { id: "water", zh: "水", color: "#3f91d7" },
  { id: "electric", zh: "电", color: "#f1c93b" },
  { id: "grass", zh: "草", color: "#5aaa48" },
  { id: "ice", zh: "冰", color: "#75cfc0" },
  { id: "fighting", zh: "格斗", color: "#c54840" },
  { id: "poison", zh: "毒", color: "#9b5ba5" },
  { id: "ground", zh: "地面", color: "#d6a54a" },
  { id: "flying", zh: "飞行", color: "#89a9de" },
  { id: "psychic", zh: "超能力", color: "#e96c8c" },
  { id: "bug", zh: "虫", color: "#92a530" },
  { id: "rock", zh: "岩石", color: "#b9a156" },
  { id: "ghost", zh: "幽灵", color: "#6e6297" },
  { id: "dragon", zh: "龙", color: "#5b78d3" },
  { id: "dark", zh: "恶", color: "#5a4b42" },
  { id: "steel", zh: "钢", color: "#5f8fa1" },
  { id: "fairy", zh: "妖精", color: "#dc86bd" },
];

const typeMap = Object.fromEntries(types.map((type) => [type.id, type]));

const chart = {
  normal: { double: [], half: ["rock", "steel"], none: ["ghost"] },
  fire: { double: ["grass", "ice", "bug", "steel"], half: ["fire", "water", "rock", "dragon"], none: [] },
  water: { double: ["fire", "ground", "rock"], half: ["water", "grass", "dragon"], none: [] },
  electric: { double: ["water", "flying"], half: ["electric", "grass", "dragon"], none: ["ground"] },
  grass: { double: ["water", "ground", "rock"], half: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"], none: [] },
  ice: { double: ["grass", "ground", "flying", "dragon"], half: ["fire", "water", "ice", "steel"], none: [] },
  fighting: { double: ["normal", "ice", "rock", "dark", "steel"], half: ["poison", "flying", "psychic", "bug", "fairy"], none: ["ghost"] },
  poison: { double: ["grass", "fairy"], half: ["poison", "ground", "rock", "ghost"], none: ["steel"] },
  ground: { double: ["fire", "electric", "poison", "rock", "steel"], half: ["grass", "bug"], none: ["flying"] },
  flying: { double: ["grass", "fighting", "bug"], half: ["electric", "rock", "steel"], none: [] },
  psychic: { double: ["fighting", "poison"], half: ["psychic", "steel"], none: ["dark"] },
  bug: { double: ["grass", "psychic", "dark"], half: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"], none: [] },
  rock: { double: ["fire", "ice", "flying", "bug"], half: ["fighting", "ground", "steel"], none: [] },
  ghost: { double: ["psychic", "ghost"], half: ["dark"], none: ["normal"] },
  dragon: { double: ["dragon"], half: ["steel"], none: ["fairy"] },
  dark: { double: ["psychic", "ghost"], half: ["fighting", "dark", "fairy"], none: [] },
  steel: { double: ["ice", "rock", "fairy"], half: ["fire", "water", "electric", "steel"], none: [] },
  fairy: { double: ["fighting", "dragon", "dark"], half: ["fire", "poison", "steel"], none: [] },
};

const buckets = [
  { value: 4, title: "4x", tone: "danger" },
  { value: 2, title: "2x", tone: "warn" },
  { value: 1, title: "1x", tone: "neutral" },
  { value: 0.5, title: "0.5x", tone: "safe" },
  { value: 0.25, title: "0.25x", tone: "safe" },
  { value: 0, title: "0x", tone: "immune" },
];

let selected = ["grass"];
let selectionMode = "single";

const picker = document.querySelector("#type-picker");
const selectedTypes = document.querySelector("#selected-types");
const summaryGrid = document.querySelector("#summary-grid");
const cardGrid = document.querySelector("#type-card-grid");
const resetButton = document.querySelector("#reset-button");
const clearButton = document.querySelector("#clear-button");

function multiplier(attack, defense) {
  if (chart[attack].none.includes(defense)) return 0;
  if (chart[attack].double.includes(defense)) return 2;
  if (chart[attack].half.includes(defense)) return 0.5;
  return 1;
}

function defensiveMultiplier(attack, defenses) {
  return defenses.reduce((total, defense) => total * multiplier(attack, defense), 1);
}

function formatType(id, className = "chip") {
  const type = typeMap[id];
  return `<span class="${className}" style="--type-color:${type.color}">${type.zh}</span>`;
}

function setSelected(typeId) {
  if (selectionMode === "single") {
    selected = [typeId];
  } else if (selected.includes(typeId)) {
    selected = selected.length === 1 ? selected : selected.filter((id) => id !== typeId);
  } else if (selected.length === 2) {
    selected = [selected[1], typeId];
  } else {
    selected = [...selected, typeId];
  }
  render();
}

function groupedDefense() {
  const groups = Object.fromEntries(buckets.map((bucket) => [bucket.value, []]));
  types.forEach((attack) => {
    const value = defensiveMultiplier(attack.id, selected);
    groups[value].push(attack.id);
  });
  return groups;
}

function renderPicker() {
  if (!picker) return;
  picker.innerHTML = types
    .map((type) => {
      const active = selected.includes(type.id) ? " active" : "";
      return `<button class="type-button${active}" type="button" data-type="${type.id}" style="--type-color:${type.color}">${type.zh}</button>`;
    })
    .join("");
}

function renderSelected() {
  selectedTypes.innerHTML = selected.length
    ? selected.map((id) => formatType(id, "badge")).join("")
    : '<span class="selection-empty">未选择</span>';
}

function renderSummary() {
  const groups = groupedDefense();
  summaryGrid.innerHTML = buckets
    .map((bucket) => {
      const items = groups[bucket.value];
      const content = items.length
        ? `<div class="chip-row">${items.map((id) => formatType(id)).join("")}</div>`
        : `<span class="empty">无</span>`;
      return `
        <article class="summary-card" data-tone="${bucket.tone}">
          <div class="summary-meta">
            <small>${items.length} 项</small>
            <small>${bucket.title}</small>
          </div>
          ${content}
        </article>
      `;
    })
    .join("");
}

function renderCards() {
  cardGrid.innerHTML = types
    .map((type) => {
      const relations = chart[type.id];
      return `
        <article class="type-card" data-type="${type.id}" style="--type-color:${type.color}" tabindex="0" role="button" aria-label="选择${type.zh}作为防御属性">
          <h3 class="card-title">${type.zh}</h3>
          ${renderRelation("攻击效果 2x", relations.double)}
          ${renderRelation("攻击效果 0.5x", relations.half)}
          ${renderRelation("攻击效果 0x", relations.none)}
        </article>
      `;
    })
    .join("");
}

function renderRelation(label, ids) {
  const content = ids.length
    ? `<div class="chip-row">${ids.map((id) => formatType(id)).join("")}</div>`
    : `<span class="empty">无</span>`;
  return `
    <div class="relation-group">
      <div class="relation-label"><strong>${label}</strong><span>${ids.length}</span></div>
      ${content}
    </div>
  `;
}

function render() {
  renderSelected();
  renderPicker();
  renderSummary();
  resetButton.textContent = selectionMode === "single" ? "切换为双属性" : "切换为单属性";
}

if (picker) {
  picker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type]");
    if (button) setSelected(button.dataset.type);
  });
}

cardGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-type]");
  if (card) setSelected(card.dataset.type);
});

cardGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("[data-type]");
  if (card) {
    event.preventDefault();
    setSelected(card.dataset.type);
  }
});

resetButton.addEventListener("click", () => {
  selectionMode = selectionMode === "single" ? "dual" : "single";
  if (selectionMode === "single") selected = [selected[0] || "grass"];
  render();
});

clearButton.addEventListener("click", () => {
  selected = [];
  render();
});

renderCards();
render();
