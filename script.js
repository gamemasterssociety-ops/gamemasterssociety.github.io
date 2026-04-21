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

  const shortGamesContainer = document.getElementById("short-games");
  const longGamesContainer = document.getElementById("long-games");
  const gmGrid = document.getElementById("gm-grid");

  const gameTemplate = document.getElementById("game-card-template");
  const gmTemplate = document.getElementById("gm-card-template");

  const showEmptyState = (container, message) => {
    if (!container) return;
    container.innerHTML = `<div class="empty-state">${message}</div>`;
  };

  const normalizeCategory = (value) => {
    if (!value) return "";
    return value.toLowerCase().trim();
  };

  const prettyCategory = (value) => {
    const normalized = normalizeCategory(value);
    if (normalized === "short") return "Short Adventure";
    if (normalized === "long") return "Long Adventure";
    return value || "";
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

    const games = Array.isArray(gamesData.games) ? gamesData.games : [];
    const gms = Array.isArray(gmsData.gms) ? gmsData.gms : [];

    const shortGames = games.filter(
      (game) => normalizeCategory(game.category) === "short"
    );

    const longGames = games.filter(
      (game) => normalizeCategory(game.category) === "long"
    );

    if (!shortGames.length) {
      showEmptyState(
        shortGamesContainer,
        "No short adventures are listed yet."
      );
    } else {
      shortGames.forEach((game) => {
        const fragment = gameTemplate.content.cloneNode(true);

        const status = fragment.querySelector(".game-status");
        const type = fragment.querySelector(".game-type");
        const title = fragment.querySelector(".game-title");
        const gm = fragment.querySelector(".game-gm");
        const category = fragment.querySelector(".game-category");
        const description = fragment.querySelector(".game-description");
        const link = fragment.querySelector(".game-link");

        status.textContent = game.status || "Current";
        type.textContent = game.type || "Adventure";
        title.textContent = game.title || "Untitled Game";
        gm.textContent = game.gm ? `GM ${game.gm}` : "GM TBA";
        category.textContent = prettyCategory(game.category);
        description.textContent =
          game.description || "Description coming soon.";

        if (game.discord_link) {
          link.href = game.discord_link;
        } else {
          link.removeAttribute("href");
          link.textContent = "Link Coming Soon";
          link.setAttribute("aria-disabled", "true");
        }

        shortGamesContainer.appendChild(fragment);
      });
    }

    if (!longGames.length) {
      showEmptyState(
        longGamesContainer,
        "No long adventures are listed yet."
      );
    } else {
      longGames.forEach((game) => {
        const fragment = gameTemplate.content.cloneNode(true);

        const status = fragment.querySelector(".game-status");
        const type = fragment.querySelector(".game-type");
        const title = fragment.querySelector(".game-title");
        const gm = fragment.querySelector(".game-gm");
        const category = fragment.querySelector(".game-category");
        const description = fragment.querySelector(".game-description");
        const link = fragment.querySelector(".game-link");

        status.textContent = game.status || "Current";
        type.textContent = game.type || "Adventure";
        title.textContent = game.title || "Untitled Game";
        gm.textContent = game.gm ? `GM ${game.gm}` : "GM TBA";
        category.textContent = prettyCategory(game.category);
        description.textContent =
          game.description || "Description coming soon.";

        if (game.discord_link) {
          link.href = game.discord_link;
        } else {
          link.removeAttribute("href");
          link.textContent = "Link Coming Soon";
          link.setAttribute("aria-disabled", "true");
        }

        longGamesContainer.appendChild(fragment);
      });
    }

    if (!gms.length) {
      showEmptyState(gmGrid, "No Game Masters are listed yet.");
    } else {
      gms.forEach((gmEntry) => {
        const fragment = gmTemplate.content.cloneNode(true);

        const name = fragment.querySelector(".gm-name");
        const role = fragment.querySelector(".gm-role");
        const link = fragment.querySelector(".gm-link");

        name.textContent = gmEntry.name || "Game Master";
        role.textContent = gmEntry.role || "Game Master";

        if (gmEntry.discord_link) {
          link.href = gmEntry.discord_link;
        } else {
          link.removeAttribute("href");
          link.textContent = "Link Coming Soon";
          link.setAttribute("aria-disabled", "true");
        }

        gmGrid.appendChild(fragment);
      });
    }
  } catch (error) {
    console.error(error);

    showEmptyState(
      shortGamesContainer,
      "Unable to load games right now. Please check games.json."
    );
    showEmptyState(
      longGamesContainer,
      "Unable to load games right now. Please check games.json."
    );
    showEmptyState(
      gmGrid,
      "Unable to load Game Masters right now. Please check gms.json."
    );
  }
});
