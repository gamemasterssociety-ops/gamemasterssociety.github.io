const archiveGrid = document.querySelector("#archive-grid");
const archiveSummary = document.querySelector("#archive-summary");
const searchInput = document.querySelector("#archive-search");
const systemFilter = document.querySelector("#archive-system");
const gmFilter = document.querySelector("#archive-gm");
const yearFilter = document.querySelector("#archive-year");
const clearButton = document.querySelector("#archive-clear");

let archiveGames = [];
let systemGuides = {};

function addOptions(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function buildArchiveCard(game) {
  const article = document.createElement("article");
  article.className = "archive-card";

  const badges = document.createElement("div");
  badges.className = "archive-card-badges";
  const archivedBadge = document.createElement("span");
  archivedBadge.className = "archive-badge";
  archivedBadge.textContent = "Archived";
  badges.append(archivedBadge);
  if (game.year) {
    const yearBadge = document.createElement("span");
    yearBadge.className = "archive-badge archive-badge-muted";
    yearBadge.textContent = game.year;
    badges.append(yearBadge);
  }
  article.append(badges);

  const title = document.createElement("h3");
  title.textContent = game.title;
  article.append(title);

  const facts = document.createElement("dl");
  facts.className = "archive-facts";
  const factRows = [
    ["System", game.system],
    ["Game Master", game.gm],
    ["Format", game.format]
  ].filter(([, value]) => value);
  factRows.forEach(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    row.append(term, description);
    facts.append(row);
  });
  article.append(facts);

  const summary = document.createElement("p");
  summary.className = "archive-card-summary";
  summary.textContent = game.summary;
  article.append(summary);

  if (game.details) {
    const details = document.createElement("p");
    details.className = "archive-card-details";
    details.textContent = game.details;
    article.append(details);
  }

  const guideText = systemGuides[game.system];
  if (guideText) {
    const guide = document.createElement("details");
    guide.className = "system-expectation";
    const guideSummary = document.createElement("summary");
    guideSummary.textContent = "What this system feels like";
    const guideBody = document.createElement("p");
    guideBody.textContent = guideText;
    guide.append(guideSummary, guideBody);
    article.append(guide);
  }

  return article;
}

function renderArchive() {
  const query = normalize(searchInput.value.trim());
  const selectedSystem = systemFilter.value;
  const selectedGm = gmFilter.value;
  const selectedYear = yearFilter.value;

  const visible = archiveGames.filter((game) => {
    const searchable = normalize([
      game.title,
      game.system,
      game.gm,
      game.year,
      game.format,
      game.summary,
      game.details
    ].filter(Boolean).join(" "));
    return (!query || searchable.includes(query)) &&
      (!selectedSystem || game.system === selectedSystem) &&
      (!selectedGm || game.gm === selectedGm) &&
      (!selectedYear || String(game.year) === selectedYear);
  });

  archiveGrid.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No archived adventures match those filters.";
    archiveGrid.append(empty);
  } else {
    visible.forEach((game) => archiveGrid.append(buildArchiveCard(game)));
  }

  const noun = visible.length === 1 ? "adventure" : "adventures";
  archiveSummary.textContent = `Showing ${visible.length} of ${archiveGames.length} archived ${noun}`;
}

async function loadArchive() {
  try {
    const response = await fetch("past-games.json?v=20260713-1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Archive request failed: ${response.status}`);
    const data = await response.json();
    systemGuides = data.system_guides || {};
    archiveGames = [...(data.games || [])].sort((a, b) => {
      const yearDifference = (b.year || 0) - (a.year || 0);
      return yearDifference || a.title.localeCompare(b.title);
    });

    addOptions(systemFilter, [...new Set(archiveGames.map((game) => game.system))].sort());
    addOptions(gmFilter, [...new Set(archiveGames.map((game) => game.gm).filter(Boolean))].sort());
    addOptions(yearFilter, [...new Set(archiveGames.map((game) => game.year).filter(Boolean))].sort((a, b) => b - a));
    renderArchive();
  } catch (error) {
    archiveSummary.textContent = "The campaign archive could not be loaded.";
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = "Please refresh the page or try again shortly.";
    archiveGrid.replaceChildren(message);
  }
}

[searchInput, systemFilter, gmFilter, yearFilter].forEach((control) => {
  control.addEventListener(control === searchInput ? "input" : "change", renderArchive);
});

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  systemFilter.value = "";
  gmFilter.value = "";
  yearFilter.value = "";
  renderArchive();
  searchInput.focus();
});

loadArchive();
