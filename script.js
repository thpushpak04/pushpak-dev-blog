const app = document.getElementById("app");
const repositoryApiUrl =
  "https://api.github.com/repos/thpushpak04/pushpak-dev-blog";
const rawContentUrl =
  "https://raw.githubusercontent.com/thpushpak04/pushpak-dev-blog/main";
let seriesList = [];
let catalogReady = false;

document.getElementById("year").textContent =
  new Date().getFullYear();

async function loadSeries() {
  const response = await fetch(`${repositoryApiUrl}/git/trees/main?recursive=1`);

  if (!response.ok) {
    throw new Error(`GitHub returned HTTP ${response.status}`);
  }

  const repositoryTree = await response.json();

  if (repositoryTree.truncated) {
    throw new Error("GitHub returned an incomplete repository tree.");
  }

  const articlesByFolder = new Map();
  repositoryTree.tree
    .filter(entry =>
      entry.type === "blob" &&
      /\.md$/i.test(entry.path) &&
      entry.path.split("/").length === 2
    )
    .forEach(file => {
      const [folder, name] = file.path.split("/");
      if (folder.startsWith(".")) {
        return;
      }

      if (!articlesByFolder.has(folder)) {
        articlesByFolder.set(folder, []);
      }

      articlesByFolder.get(folder).push({
        title: displayName(name),
        description: `Notes from the ${displayName(folder)} series.`,
        file: file.path
      });
    });

  seriesList = [...articlesByFolder.entries()]
    .map(([folder, articles]) => ({
      name: displayName(folder),
      folder,
      slug: seriesSlug(folder),
      articles: articles.sort((first, second) =>
        first.title.localeCompare(second.title, undefined, { numeric: true })
      )
    }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

function seriesSlug(folder) {
  const slug = folder
    .replace(/-journey$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || folder.toLowerCase();
}

function displayName(value) {
  return value
    .replace(/\.md$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/day(\d+)/i, "Day $1")
    .replace(/springboot/gi, "Spring Boot")
    .trim();
}

function renderHome() {
  const seriesCards = seriesList.map(item => `
    <a class="series-card" href="#series/${encodeURIComponent(item.slug)}">
      <div class="series-icon">📚</div>
      <div class="series-info">
        <p class="card-label">LEARNING SERIES</p>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${item.articles.length} note(s) available.</p>
        <span class="text-link">Explore articles →</span>
      </div>
      <span class="card-arrow">↗</span>
    </a>
  `).join("");

  app.innerHTML = `
    <section class="hero">
      <p class="eyebrow">THE DEVELOPER LOGBOOK</p>
      <h1>Learning tech.<br><span>One concept at a time.</span></h1>
      <p class="hero-description">
        A personal space to document what I learn, the code I write,
        the bugs I fix, and the ideas that finally click.
      </p>
      <a class="primary-link" href="#series/springboot">
        Explore my journey <span>→</span>
      </a>
    </section>

    <section class="section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">DOCUMENTING THE PROCESS</p>
          <h2>Learning series</h2>
        </div>
        <span class="muted">${seriesList.length} collection(s)</span>
      </div>
      <p class="muted">
        Add a folder with Markdown notes to create another learning series.
        New .md files appear automatically after you publish them.
      </p>
      <div class="article-list">
        ${seriesCards || '<p class="notice">No folders with Markdown notes were found.</p>'}
      </div>
    </section>

    <footer>
      <p>Built with curiosity and a little bit of debugging.</p>
      <p>© ${new Date().getFullYear()} Pushpak</p>
    </footer>
  `;
}

function renderSeries(series) {
  const articleCards = series.articles.map((article, index) => `
    <a class="article-card"
       href="#article/${encodeURIComponent(article.file)}">
      <span class="article-number">
        ${String(index + 1).padStart(2, "0")}
      </span>
      <div>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.description)}</p>
        <span class="text-link">Read article →</span>
      </div>
    </a>
  `).join("");

  app.innerHTML = `
    <a class="back-link" href="#home">← Back to home</a>

    <section class="section">
      <p class="eyebrow">LEARNING SERIES</p>
      <h1 class="page-title">${escapeHtml(series.name)}</h1>
      <p class="page-description">
        Notes, experiments and lessons from this learning journey.
      </p>

      <p class="muted">${series.articles.length} article(s)</p>

      <div class="article-list">
        ${articleCards}
      </div>
    </section>

    <footer>
      <p>© ${new Date().getFullYear()} Pushpak</p>
      <a href="#home">Back to home ↑</a>
    </footer>
  `;
}

async function renderArticle(file) {
  const article = seriesList
    .flatMap(series => series.articles)
    .find(item => item.file === file);
  const parentSeries = seriesList.find(series =>
    series.articles.includes(article)
  );

  if (!article || !parentSeries) {
    showError("Article not found. Check that its folder contains a Markdown file.");
    return;
  }

  app.innerHTML = `
    <div class="reader">
      <a class="back-link" href="#home">← Back to learning series</a>
      <p class="muted">Loading article...</p>
    </div>
  `;

  try {
    const articlePath = file.split("/").map(encodeURIComponent).join("/");
    const response = await fetch(`${rawContentUrl}/${articlePath}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const markdown = await response.text();

    if (typeof marked === "undefined" ||
        typeof DOMPurify === "undefined") {
      throw new Error("Markdown libraries could not load.");
    }

    const html = marked.parse(markdown);
    const safeHtml = DOMPurify.sanitize(html);

    app.innerHTML = `
      <article class="reader">
        <a class="back-link" href="#series/${encodeURIComponent(parentSeries.slug)}">
          ← Back to ${escapeHtml(parentSeries.name)}
        </a>

        <p class="eyebrow">LEARNING SERIES</p>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="article-meta">Written by Pushpak</p>

        <div class="reader-content">${safeHtml}</div>

        <hr style="border-color: var(--border); margin-top: 48px;">

        <a class="back-link" href="#home">← More articles</a>
      </article>

      <footer>
        <p>© ${new Date().getFullYear()} Pushpak</p>
        <a href="#home">Home ↑</a>
      </footer>
    `;

    window.scrollTo(0, 0);
  } catch (error) {
    console.error("Article loading failed:", error);
    showError(
      "Could not load this article. Check the file path, " +
      "network connection, and Markdown library scripts."
    );
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showError(message) {
  app.innerHTML = `
    <div class="reader">
      <a class="back-link" href="#home">← Back to home</a>
      <p class="error">${escapeHtml(message)}</p>
    </div>
  `;
}

function route() {
  const hash = window.location.hash.slice(1) || "home";

  if (!catalogReady) {
    app.innerHTML = '<p class="muted">Loading learning series...</p>';
    return;
  }

  if (hash === "home") {
    renderHome();
    return;
  }

  if (hash.startsWith("series/")) {
    let slug;

    try {
      slug = decodeURIComponent(hash.slice("series/".length));
    } catch {
      renderHome();
      return;
    }

    const series = seriesList.find(item => item.slug === slug);
    if (series) {
      renderSeries(series);
    } else {
      renderHome();
    }
    return;
  }

  if (hash.startsWith("article/")) {
    let file;

    try {
      file = decodeURIComponent(hash.slice("article/".length));
    } catch {
      showError("Invalid article path.");
      return;
    }

    renderArticle(file);
    return;
  }

  renderHome();
}

window.addEventListener("hashchange", route);

loadSeries()
  .then(() => {
    catalogReady = true;
    route();
  })
  .catch(error => {
    console.error("Learning series discovery failed:", error);
    showError(
      "Could not load learning series from GitHub. Check your connection " +
      "and try again."
    );
  });
