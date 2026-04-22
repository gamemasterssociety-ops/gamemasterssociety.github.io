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

  const modal = document.getElementById("game-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalSubtitle = document.getElementById("modal-subtitle");
  const modalStatus = document.getElementById("modal-status");
  const modalFormat = document.getElementById("modal-format");
  const modalSystem = document.getElementById("modal-system");
  const modalGm = document.getElementById("modal-gm");
  const modalDescription = document.getElementById("modal-description");
  const modalFacts = document.getElementById("modal-facts");
  const modalTagsSection = document.getElementById("modal-tags-section");
  const modalTags = document.getElementById("modal-tags");
  const modalWarningsSection = document.getElementById("modal-warnings-section");
  const modalWarnings = document.getElementById("modal-warnings");
  const modalSafetySection = document.getElementById("modal-safety-section");
  const modalSafety = document.getElementById("modal-safety");
  const modalInspirationsSection = document.getElementById("modal-inspirations-section");
  const modalInspirations = document.getElementById("modal-inspirations");
  const modalDiscordLink = document.getElementById("modal-discord-link");

  let lastFocusedElement = null;

  const showEmptyState = (container, message) => {
    if (!container) return;
    container.innerHTML = `<div class="empty-state">${message}</div>`;
  };

  const titleCase = (value) => {
    if (!value) return "";
    return String(value)
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

  const pluralize = (count, singular, plural) => {
    return `${count} ${count === 1 ? singular : plural}`;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "number") {
      return `$${value}`;
    }
    return String(value);
  };

  const buildFacts = (game) => {
    const facts = [];

    if (game.price_per_session !== undefined && game.price_per_session !== null) {
      facts.push(`${formatCurrency(game.price_per_session)}/session`);
    } else if (game.price) {
      facts.push(String(game.price));
    }

    if (game.players_min && game.players_max) {
      facts.push(`${game.players_min}-${game.players_max} players`);
    } else if (game.players) {
      facts.push(String(game.players));
    } else if (game.seats_available) {
      facts.push(`${game.seats_available} seats`);
    }

    if (game.session_length_hours) {
      facts.push(pluralize(game.session_length_hours, "hour", "hours"));
    } else if (game.session_length) {
      facts.push(String(game.session_length));
    }

    if (game.sessions_min && game.sessions_max) {
      if (game.sessions_min === game.sessions_max) {
        facts.push(pluralize(game.sessions_max, "session", "sessions"));
      } else {
        facts.push(`${game.sessions_min}-${game.sessions_max} sessions`);
      }
    } else if (game.sessions_max) {
      facts.push(`Up to ${pluralize(game.sessions_max, "session", "sessions")}`);
    } else if (game.sessions_estimate) {
      facts.push(String(game.sessions_estimate));
    }

    if (game.experience_level) {
      facts.push(String(game.experience_level));
    }

    return facts;
  };

  const createFactChip = (text) => {
    const chip = document.createElement("span");
    chip.className = "fact-chip";
    chip.textContent = text;
    return chip;
  };

  const createTagChip = (text) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = text;
    return chip;
  };

  const clearElement = (element) => {
    if (element) {
      element.innerHTML = "";
    }
  };

  const populateSelect = (select, values, placeholder, prettyPrinter = null) => {
    if (!select) return;
    select.innerHTML = `<option value="">${placeholder}</option>`;

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = prettyPrinter ? prettyPrinter(value) : value;
      select.appendChild(option);
    });
  };

  const setListSection = (section, listElement, items) => {
    if (!section || !listElement) return;

    if (!Array.isArray(items) || !items.length) {
      section.hidden = true;
      listElement.innerHTML = "";
      return;
    }

    section.hidden = false;
    listElement.innerHTML = "";

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      listElement.appendChild(li);
    });
  };

  const setTagsSection = (section, container, tags) => {
    if (!section || !container) return;

    if (!Array.isArray(tags) || !tags.length) {
      section.hidden = true;
      container.innerHTML = "";
      return;
    }

    section.hidden = false;
    container.innerHTML = "";

    tags.forEach((tag) => {
      container.appendChild(createTagChip(tag));
    });
  };

  const openModal = (game) => {
    if (!modal) return;

    lastFocusedElement = document.activeElement;

    modalTitle.textContent = game.title || "Untitled Game";
    modalSubtitle.textContent = game.subtitle || "";
    modalSubtitle.hidden = !game.subtitle;

    modalStatus.textContent = prettyStatus(game.status || "running");
    modalFormat.textContent = prettyFormat(game.format || "");
    modalSystem.textContent = game.system || "System TBA";
    modalGm.textContent = game.gm ? `GM ${game.gm}` : "GM TBA";

    clearElement(modalDescription);
    const descriptionText = game.full_description || game.description || game.short_description || "";
    const paragraphs = descriptionText
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    if (paragraphs.length) {
      paragraphs.forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        modalDescription.appendChild(p);
      });
    }

    clearElement(modalFacts);
    buildFacts(game).forEach((fact) => {
      modalFacts.appendChild(createFactChip(fact));
    });

    setTagsSection(modalTagsSection, modalTags, game.tags);
    setListSection(modalWarningsSection, modalWarnings, game.content_warnings);
    setListSection(modalSafetySection, modalSafety, game.safety_tools);
    setListSection(modalInspirationsSection, modalInspirations, game.inspirations);

    if (modalDiscordLink) {
      if (game.discord_link) {
        modalDiscordLink.href = game.discord_link;
        modalDiscordLink.removeAttribute("aria-disabled");
      } else {
        modalDiscordLink.removeAttribute("href");
        modalDiscordLink.setAttribute("aria-disabled", "true");
      }
    }

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const closeButton = modal.querySelector(".modal-close");
    if (closeButton) {
      closeButton.focus();
    }
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  };

  if (modal) {
    modal.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    });
  }

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

      const subtitle = fragment.querySelector(".game-subtitle");
      const title = fragment.querySelector(".game-title");
      const status = fragment.querySelector(".game-status");
      const format = fragment.querySelector(".game-format");
      const system = fragment.querySelector(".game-system");
      const gm = fragment.querySelector(".game-gm");
      const shortDescription = fragment.querySelector(".game-short-description");
      const factsContainer = fragment.querySelector(".game-facts");
      const tagsContainer = fragment.querySelector(".game-tags");
      const detailsButton = fragment.querySelector(".game-details-button");
      const link = fragment.querySelector(".game-link");

      const subtitleText = game.subtitle || "";
      subtitle.textContent = subtitleText;
      subtitle.hidden = !subtitleText;

      title.textContent = game.title || "Untitled Game";
      status.textContent = prettyStatus(game.status || "running");
      format.textContent = prettyFormat(game.format || "");
      system.textContent = game.system || "System TBA";
      gm.textContent = game.gm ? `GM ${game.gm}` : "GM TBA";
      shortDescription.textContent =
        game.short_description || game.description || "Description coming soon.";

      clearElement(factsContainer);
      buildFacts(game).forEach((fact) => {
        factsContainer.appendChild(createFactChip(fact));
      });

      clearElement(tagsContainer);
      if (Array.isArray(game.tags)) {
        game.tags.forEach((tag) => {
          tagsContainer.appendChild(createTagChip(tag));
        });
      }

      if (detailsButton) {
        detailsButton.addEventListener("click", () => openModal(game));
      }

      if (link) {
        if (game.discord_link) {
          link.href = game.discord_link;
          link.removeAttribute("aria-disabled");
        } else {
          link.removeAttribute("href");
          link.textContent = "Link Coming Soon";
          link.setAttribute("aria-disabled", "true");
        }
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
      populateSelect(statusFilter, statuses, "All statuses", prettyStatus);
      populateSelect(formatFilter, formats, "All formats", prettyFormat);

      const applyFilters = () => {
        const searchTerm = (searchInput?.value || "").trim().toLowerCase();
        const selectedSystem = systemFilter?.value || "";
        const selectedStatus = statusFilter?.value || "";
        const selectedFormat = formatFilter?.value || "";

        const filteredGames = allGames.filter((game) => {
          const haystack = [
            game.title,
            game.subtitle,
            game.gm,
            game.system,
            game.description,
            game.short_description,
            game.full_description,
            game.status,
            game.format,
            ...(Array.isArray(game.tags) ? game.tags : [])
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
