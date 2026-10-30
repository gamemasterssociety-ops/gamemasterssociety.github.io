document.addEventListener("DOMContentLoaded", async () => {
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (navToggle && siteNav) {
    const menuGroups = [...siteNav.querySelectorAll(".nav-group")];
    const closeSubmenus = (except = null) => {
      menuGroups.forEach(group => {
        if (group === except) return;
        group.classList.remove("is-open");
        group.querySelector(".nav-menu-toggle")?.setAttribute("aria-expanded", "false");
      });
    };
    const closeNavigation = () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      closeSubmenus();
    };
    navToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      if (!isOpen) closeSubmenus();
    });
    menuGroups.forEach(group => {
      const button = group.querySelector(".nav-menu-toggle");
      if (!button) return;
      button.addEventListener("click", event => {
        event.stopPropagation();
        const willOpen = !group.classList.contains("is-open");
        closeSubmenus(group);
        group.classList.toggle("is-open", willOpen);
        button.setAttribute("aria-expanded", String(willOpen));
      });
    });
    siteNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeNavigation));
    document.addEventListener("click", event => {
      if (!siteNav.contains(event.target) && event.target !== navToggle) closeSubmenus();
    });
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      closeSubmenus();
      if (siteNav.classList.contains("is-open")) closeNavigation();
    });
  }

  const openGamesGrid = document.getElementById("open-games-grid");
  const communityGamesGrid = document.getElementById("community-games-grid");
  const legacyGamesGrid = document.getElementById("games-grid");
  const gmGrid = document.getElementById("gm-grid");
  const gameTemplate = document.getElementById("game-card-template");
  const gmTemplate = document.getElementById("gm-card-template");
  const searchInput = document.getElementById("game-search");
  const systemFilter = document.getElementById("system-filter");
  const statusFilter = document.getElementById("status-filter");
  const formatFilter = document.getElementById("format-filter");
  const clearFiltersButton = document.getElementById("clear-filters");
  const resultsSummary = document.getElementById("results-summary");

  const showEmptyState = (container, message) => {
    if (container) container.innerHTML = `<div class="empty-state">${message}</div>`;
  };
  const titleCase = value => String(value || "").replace(/[-_]/g, " ").replace(/\b\w/g, char => char.toUpperCase());
  const prettyStatus = value => ({ recruiting: "Recruiting", running: "Running", full: "Full", upcoming: "Upcoming", archived: "Archived" }[value] || titleCase(value));
  const prettyFormat = value => ({ short: "Short Adventure", long: "Long Adventure" }[value] || titleCase(value));
  const gamePageUrl = title => `game-${String(title || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.html`;
  const pluralize = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;
  const formatCurrency = value => typeof value === "number" ? `${value}` : String(value || "");
  const seatCount = game => {
    if (game.seats_available === null || game.seats_available === undefined || game.seats_available === "") return null;
    const count = Number(game.seats_available);
    return Number.isInteger(count) && count >= 0 ? count : null;
  };
  const displayStatus = game => seatCount(game) === 0 ? "full" : (game.status || "running");
  const acceptingInquiries = game => {
    const status = displayStatus(game);
    if (status === "full" || status === "archived") return false;
    const seats = seatCount(game);
    return seats !== null ? seats > 0 : status === "recruiting" || status === "upcoming";
  };

  const buildFacts = game => {
    const facts = [];
    if (game.price_per_session !== undefined && game.price_per_session !== null) facts.push(`${formatCurrency(game.price_per_session)}/session`);
    else if (game.price) facts.push(String(game.price));
    const seats = seatCount(game);
    if (seats !== null) facts.push(seats > 0 ? `${seats} open ${seats === 1 ? "seat" : "seats"}` : "No seats currently available");
    else if (game.players_min && game.players_max) facts.push(`${game.players_min}-${game.players_max} players`);
    else if (game.players_max) facts.push(`Up to ${game.players_max} players`);
    if (game.session_length_hours) facts.push(pluralize(game.session_length_hours, "hour", "hours"));
    else if (game.session_length) facts.push(String(game.session_length));
    if (game.sessions_min && game.sessions_max) facts.push(game.sessions_min === game.sessions_max ? pluralize(game.sessions_max, "session", "sessions") : `${game.sessions_min}-${game.sessions_max} sessions`);
    else if (game.sessions_max) facts.push(`Up to ${pluralize(game.sessions_max, "session", "sessions")}`);
    if (game.schedule) facts.push(String(game.schedule));
    if (game.experience_level) facts.push(String(game.experience_level));
    return facts;
  };

  const makeChip = (text, className) => {
    const chip = document.createElement("span");
    chip.className = className;
    chip.textContent = text;
    return chip;
  };

  const renderGameCards = (container, games, emptyMessage) => {
    if (!container || !gameTemplate) return;
    container.innerHTML = "";
    if (!games.length) return showEmptyState(container, emptyMessage);
    games.forEach(game => {
      const fragment = gameTemplate.content.cloneNode(true);
      const subtitle = fragment.querySelector(".game-subtitle");
      subtitle.textContent = game.subtitle || "";
      subtitle.hidden = !game.subtitle;
      fragment.querySelector(".game-title").textContent = game.title || "Untitled Game";
      fragment.querySelector(".game-status").textContent = prettyStatus(displayStatus(game));
      fragment.querySelector(".game-format").textContent = prettyFormat(game.format || "");
      fragment.querySelector(".game-system").textContent = game.system || "System TBA";
      fragment.querySelector(".game-gm").textContent = game.gm ? `GM ${game.gm}` : "GM TBA";
      fragment.querySelector(".game-short-description").textContent = game.short_description || game.description || "Description coming soon.";
      const facts = fragment.querySelector(".game-facts");
      buildFacts(game).forEach(fact => facts.appendChild(makeChip(fact, "fact-chip")));
      const tags = fragment.querySelector(".game-tags");
      (game.tags || []).forEach(tag => tags.appendChild(makeChip(tag, "tag-chip")));
      fragment.querySelector(".game-details-button")?.addEventListener("click", () => { window.location.href = gamePageUrl(game.title); });
      const link = fragment.querySelector(".game-link");
      if (game.discord_link) link.href = game.discord_link;
      else {
        link.removeAttribute("href");
        link.textContent = "Link Coming Soon";
        link.setAttribute("aria-disabled", "true");
      }
      container.appendChild(fragment);
    });
  };

  // The JSON listing is authoritative for changing facts on each individual game page.
  const syncGameDetail = games => {
    const filename = decodeURIComponent(window.location.pathname.split("/").pop() || "");
    const game = games.find(entry => gamePageUrl(entry.title) === filename);
    const hero = document.querySelector(".game-detail-hero");
    if (!game || !hero) return;

    const seats = seatCount(game);
    const facts = {
      "Game Master": game.gm,
      "System": game.system,
      "Price": game.price_per_session != null ? `${formatCurrency(game.price_per_session)} per session` : game.price,
      "Schedule": game.schedule,
      "Experience": game.experience_level,
      "Seats available": seats,
      "Table size": game.players_max
        ? `Up to ${game.players_max} players${seats !== null && seats > 0 ? ` · ${seats} ${seats === 1 ? "seat" : "seats"} open` : ""}`
        : null
    };
    document.querySelectorAll(".detail-facts > div").forEach(row => {
      const label = row.querySelector("dt")?.textContent.trim();
      const value = row.querySelector("dd");
      if (value && facts[label] !== null && facts[label] !== undefined) value.textContent = String(facts[label]);
    });

    const statusBadges = document.querySelectorAll(".detail-main .game-card-badges .game-status");
    if (statusBadges[0]) statusBadges[0].textContent = prettyStatus(displayStatus(game));
    if (statusBadges[1]) {
      statusBadges[1].textContent = seats !== null && seats > 0
        ? `${seats} open ${seats === 1 ? "seat" : "seats"}` : "No seats open";
      statusBadges[1].hidden = seats === null;
    }

    const eyebrow = hero.querySelector(".eyebrow");
    if (eyebrow) eyebrow.textContent = `${game.system || "Tabletop RPG"} · GM ${game.gm || "TBA"}${seats !== null && seats > 0 ? ` · ${seats} open ${seats === 1 ? "seat" : "seats"}` : ""}`;
    const heroLink = hero.querySelector(".hero-actions .button-primary");
    if (heroLink && game.discord_link) {
      heroLink.href = game.discord_link;
      heroLink.textContent = acceptingInquiries(game) ? "Ask About a Seat" : "Contact the Game Master";
    }
    document.querySelectorAll(".detail-sidebar a[href*='discord']").forEach(link => {
      if (game.discord_link) link.href = game.discord_link;
    });
  };

  const renderGMCards = gms => {
    if (!gmGrid || !gmTemplate) return;
    gmGrid.innerHTML = "";
    if (!gms.length) return showEmptyState(gmGrid, "No Game Masters are listed yet.");
    gms.forEach(gmEntry => {
      const fragment = gmTemplate.content.cloneNode(true);
      fragment.querySelector(".gm-name").textContent = gmEntry.name || "Game Master";
      fragment.querySelector(".gm-role").textContent = gmEntry.role || "Game Master";
      fragment.querySelector(".gm-bio").textContent = gmEntry.short_bio || "";
      const link = fragment.querySelector(".gm-link");
      if (gmEntry.discord_link) link.href = gmEntry.discord_link;
      else {
        link.removeAttribute("href");
        link.textContent = "Link Coming Soon";
        link.setAttribute("aria-disabled", "true");
      }
      gmGrid.appendChild(fragment);
    });
  };

  const populateSelect = (select, values, placeholder, formatter = value => value) => {
    if (!select) return;
    select.innerHTML = `<option value="">${placeholder}</option>`;
    values.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = formatter(value);
      select.appendChild(option);
    });
  };

  try {
    const loadData = async path => {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      return response.json();
    };
    const [gamesResult, gmsResult] = await Promise.allSettled([
      loadData("games.json"),
      loadData("gms.json")
    ]);
    if (gmsResult.status === "fulfilled") {
      renderGMCards(Array.isArray(gmsResult.value.gms) ? gmsResult.value.gms : []);
    } else {
      console.error(gmsResult.reason);
      showEmptyState(gmGrid, "Unable to load Game Masters right now.");
    }
    if (gamesResult.status !== "fulfilled") throw gamesResult.reason;
    const gamesData = gamesResult.value;
    const priority = { recruiting: 0, upcoming: 1, running: 2, full: 3, archived: 4 };
    const allGames = Array.isArray(gamesData.games) ? [...gamesData.games].sort((a, b) => (priority[a.status] ?? 5) - (priority[b.status] ?? 5)) : [];

    syncGameDetail(allGames);

    if (legacyGamesGrid && !openGamesGrid && !communityGamesGrid) {
      renderGameCards(legacyGamesGrid, allGames.filter(game => game.status !== "archived"), "No current games are listed.");
      return;
    }

    populateSelect(systemFilter, [...new Set(allGames.map(game => game.system).filter(Boolean))].sort(), "All systems");
    populateSelect(statusFilter, [...new Set(allGames.map(game => game.status).filter(Boolean))].sort(), "All statuses", prettyStatus);
    populateSelect(formatFilter, [...new Set(allGames.map(game => game.format).filter(Boolean))].sort(), "All formats", prettyFormat);

    const applyFilters = () => {
      const searchTerm = (searchInput?.value || "").trim().toLowerCase();
      const selectedSystem = systemFilter?.value || "";
      const selectedStatus = statusFilter?.value || "";
      const selectedFormat = formatFilter?.value || "";
      const filtered = allGames.filter(game => {
        const haystack = [game.title, game.subtitle, game.gm, game.system, game.description, game.short_description, game.full_description, game.status, game.format, ...(game.tags || [])].filter(Boolean).join(" ").toLowerCase();
        return (!searchTerm || haystack.includes(searchTerm)) && (!selectedSystem || game.system === selectedSystem) && (!selectedStatus || game.status === selectedStatus) && (!selectedFormat || game.format === selectedFormat);
      });
      const openGames = filtered.filter(acceptingInquiries);
      const communityGames = filtered.filter(game => game.status !== "archived" && !openGames.includes(game));
      renderGameCards(openGamesGrid, openGames, "No open games match these filters. Use the player-interest email below and we can point you toward future opportunities.");
      renderGameCards(communityGamesGrid, communityGames, "No additional community games match these filters.");
      if (resultsSummary) resultsSummary.innerHTML = `<strong>${openGames.length}</strong> open game${openGames.length === 1 ? "" : "s"} shown`;
    };

    [searchInput, systemFilter, statusFilter, formatFilter].forEach(control => {
      control?.addEventListener("input", applyFilters);
      control?.addEventListener("change", applyFilters);
    });
    clearFiltersButton?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (systemFilter) systemFilter.value = "";
      if (statusFilter) statusFilter.value = "";
      if (formatFilter) formatFilter.value = "";
      applyFilters();
    });
    applyFilters();
  } catch (error) {
    console.error(error);
    showEmptyState(openGamesGrid || legacyGamesGrid, "Unable to load games right now.");
    showEmptyState(communityGamesGrid, "Unable to load community games right now.");
    if (gmGrid && gmGrid.childElementCount === 0) {
      showEmptyState(gmGrid, "Unable to load Game Masters right now.");
    }
  }
});