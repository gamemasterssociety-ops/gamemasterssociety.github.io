const SYSTEMS_URL = "systems.json";

const searchInput = document.querySelector("#system-search");
const categoryFilter = document.querySelector("#system-category");
const availabilityFilter = document.querySelector("#system-availability");
const clearButton = document.querySelector("#clear-system-filters");
const currentGrid = document.querySelector("#current-system-grid");
const interestGrid = document.querySelector("#interest-system-grid");
const currentSection = document.querySelector("#current-systems");
const interestSection = document.querySelector("#interest-systems");
const summary = document.querySelector("#system-results-summary");

const normalize = value => String(value || "").toLowerCase().trim();

function createSystemCard(system) {
  const card = document.createElement("article");
  card.className = "system-card";

  const mark = document.createElement("div");
  mark.className = "system-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = system.mark;

  const body = document.createElement("div");
  body.className = "system-card-body";

  const category = document.createElement("p");
  category.className = "section-kicker";
  category.textContent = system.category;

  const title = document.createElement("h3");
  title.textContent = system.name;

  const description = document.createElement("p");
  description.className = "system-summary";
  description.textContent = system.summary;

  const facts = document.createElement("dl");
  facts.className = "system-facts";
  facts.innerHTML = `
    <div><dt>Rules feel</dt><dd>${system.rules}</dd></div>
    <div><dt>Typical focus</dt><dd>${system.focus}</dd></div>
  `;

  body.append(category, title, description, facts);

  if (Array.isArray(system.games) && system.games.length) {
    const games = document.createElement("div");
    games.className = "system-games";
    const heading = document.createElement("h4");
    heading.textContent = system.games.length === 1 ? "Current GMS adventure" : "Current GMS adventures";
    games.append(heading);
    system.games.forEach(([label, href]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      games.append(link);
    });
    body.append(games);
  }

  card.append(mark, body);
  return card;
}

function render(systems) {
  const query = normalize(searchInput.value);
  const category = categoryFilter.value;
  const availability = availabilityFilter.value;

  const filtered = systems.filter(system => {
    const searchable = normalize([system.name, system.category, system.summary, system.focus, system.rules].join(" "));
    return (!query || searchable.includes(query))
      && (!category || system.category === category)
      && (!availability || system.status === availability);
  });

  const current = filtered.filter(system => system.status === "current");
  const interest = filtered.filter(system => system.status === "interest");

  currentGrid.replaceChildren(...current.map(createSystemCard));
  interestGrid.replaceChildren(...interest.map(createSystemCard));

  currentSection.hidden = current.length === 0;
  interestSection.hidden = interest.length === 0;

  const count = filtered.length;
  summary.textContent = `${count} system${count === 1 ? "" : "s"} shown`;

  if (!count) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No systems match those filters.";
    interestGrid.replaceChildren(empty);
    interestSection.hidden = false;
  }
}

fetch(SYSTEMS_URL)
  .then(response => {
    if (!response.ok) throw new Error("Unable to load systems.");
    return response.json();
  })
  .then(data => {
    const systems = data.systems || [];
    [...new Set(systems.map(system => system.category))].sort().forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.append(option);
    });

    [searchInput, categoryFilter, availabilityFilter].forEach(control => {
      control.addEventListener(control === searchInput ? "input" : "change", () => render(systems));
    });

    clearButton.addEventListener("click", () => {
      searchInput.value = "";
      categoryFilter.value = "";
      availabilityFilter.value = "";
      render(systems);
      searchInput.focus();
    });

    render(systems);
  })
  .catch(() => {
    summary.textContent = "Systems could not be loaded.";
    interestGrid.innerHTML = '<p class="empty-state">Please refresh the page or try again shortly.</p>';
    currentSection.hidden = true;
    interestSection.hidden = false;
  });
