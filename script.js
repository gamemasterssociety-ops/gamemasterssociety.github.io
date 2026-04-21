document.addEventListener("DOMContentLoaded", async () => {
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const gamesGrid = document.getElementById("games-grid");
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
    if (!container) return;
    container.innerHTML = `<div class="empty-state">${message}</div>`;
  };

  const titleCase = (value) => {
    if (!value) return "";
    return value
      .toString()
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const prettyStatus = (value) => {
    const map = {
      recruiting: "Recruiting",
      running: "Running",
      full: "Full",
      upcoming: "Upcoming",
      archived: "Archived"
    };
    return map[value] || titleCase(value);
  };

  const prettyFormat = (value) => {
    const map = {
      short: "Short Adventure",
      long: "Long Adventure"
    };
    return map[value] || titleCase(value);
  };

  const populateSelect = (select, values, placeholder) => {
    if (!select) return;
    select.innerHTML = `<option value="">${placeholder}</option>`;

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent =
        select.id === "status-filter"
          ? prettyStatus(value)
          : select.id === "format-filter"
          ? prettyFormat(value)
          : value;
      select.appendChild(option);
    });
  };

  const renderGameCards = (games) => {
    if (!gamesGrid || !gameTemplate) return;

    gamesGrid.innerHTML = "";

    if (!games.length) {
      showEmptyState(
        gamesGrid,
        "No games match your current filters. Try clearing them and browsing the full lineup."
      );
      return;
    }

    games.forEach((game) => {
      const fragment = gameTemplate.content.cloneNode(true);

      const status = fragment.querySelector(".game-status");
      const format = fragment.querySelector(".game-format");
      const title = fragment.querySelector(".game-title");
      const system = fragment.querySelector(".game-system");
      const gm = fragment.querySelector(".game-gm");
      const description = fragment.querySelector(".game-description");
      const link = fragment.querySelector(".game-link");

      status.textContent = prettyStatus(game.status || "running");
      format.textContent = prettyFormat(game.format || "");
      title.textContent = game.title || "Untitled Game";
      system.textContent = game.system || "System TBA";
      gm.textContent = game.gm ? `GM ${game.gm}` : "GM TBA";
      description.textContent = game.description || "Description coming soon.";

      if (game.discord_link) {
        link.href = game.discord_link;
      } else {
        link.removeAttribute("href");
        link.textContent = "Link Coming Soon";
        link.setAttribute("aria-disabled", "true");
      }

      gamesGrid.appendChild(fragment);
    });
  };

  const renderGMCards = (gms) => {
    if (!gmGrid || !gmTemplate) return;

    gmGrid.innerHTML = "";

    if (!gms.length) {
      showEmptyState(gmGrid, "No Game Masters are listed yet.");
      return;
    }

    gms.forEach((gmEntry) => {
      const fragment = gmTemplate.content.cloneNode(true);

      const name = fragment.querySelector(".gm-name");
      const role = fragment.querySelector(".gm-role");
      const bio = fragment.querySelector(".gm-bio");
      const link = fragment.querySelector(".gm-link");

      name.textContent = gmEntry.name || "Game Master";
      role.textContent = gmEntry.role || "Game Master";
      bio.textContent = gmEntry.short_bio || "";

      if (gmEntry.discord_link) {
        link.href = gmEntry.discord_link;
      } else {
        link.removeAttribute("href");
        link.textContent = "Link Coming Soon";
        link.setAttribute("aria-disabled", "true");
      }

      gmGrid.appendChild(fragment);
    });
  };

  try {
    const [gamesResponse, gmsResponse] = await Promise.all([
      fetch("games.json", { cache: "no-store" }),
      fetch("gms.json", { cache: "no-store" })
    ]);

    if (!gamesResponse.ok) {
      throw new Error(`Failed to load games.json (${gamesResponse.status})`);
    }

    if (!gmsResponse.ok) {
      throw new Error(`Failed to load gms.json (${gmsResponse.status})`);
    }

    const gamesData = await gamesResponse.json();
    const gmsData = await gmsResponse.json();

    const allGames = Array.isArray(gamesData.games) ? gamesData.games : [];
    const allGms = Array.isArray(gmsData.gms) ? gmsData.gms : [];

    renderGMCards(allGms);

    if (gamesGrid) {
      const systems = [...new Set(allGames.map((game) => game.system).filter(Boolean))].sort();
      const statuses = [...new Set(allGames.map((game) => game.status).filter(Boolean))].sort();
      const formats = [...new Set(allGames.map((game) => game.format).filter(Boolean))].sort();

      populateSelect(systemFilter, systems, "All systems");
      populateSelect(statusFilter, statuses, "All statuses");
      populateSelect(formatFilter, formats, "All formats");

      const applyFilters = () => {
        const searchTerm = (searchInput?.value || "").trim().toLowerCase();
        const selectedSystem = systemFilter?.value || "";
        const selectedStatus = statusFilter?.value || "";
        const selectedFormat = formatFilter?.value || "";

        const filteredGames = allGames.filter((game) => {
          const haystack = [
            game.title,
            game.gm,
            game.system,
            game.description,
            game.status,
            game.format
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch = !searchTerm || haystack.includes(searchTerm);
          const matchesSystem = !selectedSystem || game.system === selectedSystem;
          const matchesStatus = !selectedStatus || game.status === selectedStatus;
          const matchesFormat = !selectedFormat || game.format === selectedFormat;

          return matchesSearch && matchesSystem && matchesStatus && matchesFormat;
        });

        if (resultsSummary) {
          resultsSummary.innerHTML = `<strong>${filteredGames.length}</strong> game${filteredGames.length === 1 ? "" : "s"} shown`;
        }

        renderGameCards(filteredGames);
      };

      [searchInput, systemFilter, statusFilter, formatFilter].forEach((control) => {
        if (!control) return;
        control.addEventListener("input", applyFilters);
        control.addEventListener("change", applyFilters);
      });

      if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
          if (searchInput) searchInput.value = "";
          if (systemFilter) systemFilter.value = "";
          if (statusFilter) statusFilter.value = "";
          if (formatFilter) formatFilter.value = "";
          applyFilters();
        });
      }

      applyFilters();
    }
  } catch (error) {
    console.error(error);

    if (gamesGrid) {
      showEmptyState(
        gamesGrid,
        "Unable to load games right now. Please check games.json."
      );
    }

    if (gmGrid) {
      showEmptyState(
        gmGrid,
        "Unable to load Game Masters right now. Please check gms.json."
      );
    }
  }
});
