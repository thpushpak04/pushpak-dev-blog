
const app = document.getElementById("app");

document.getElementById("year").textContent =
  new Date().getFullYear();

// Add new articles here as you create Markdown files.
const articles = [
  {
    title: "Day 1: Backend with Java",
    description: "My first notes from the backend learning journey.",
    file: "SpringBoot-Journey/Day1_blog.md"
  }
];

function renderHome() {
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
        <span class="muted">01 collection</span>
      </div>

      <a class="series-card" href="#series/springboot">
        <div class="series-icon">☕</div>
        <div class="series-info">
          <p class="card-label">BACKEND DEVELOPMENT</p>
          <h3>Spring Boot Journey</h3>
          <p>
            From Java fundamentals to backend applications,
            one lecture and one lesson at a time.
          </p>
          <span class="text-link">Explore articles →</span>
        </div>
        <span class="card-arrow">↗</span>
      </a>
    </section>

    <footer>
      <p>Built with curiosity and a little bit of debugging.</p>
      <p>© ${new Date().getFullYear()} Pushpak</p>
    </footer>
  `;
}

function renderSeries() {
  const articleCards = articles.map((article, index) => `
    <a class="article-card"
       href="#article/${encodeURIComponent(article.file)}">
      <span class="article-number">
        ${String(index + 1).padStart(2, "0")}
      </span>
      <div>
        <h3>${article.title}</h3>
        <p>${article.description}</p>
        <span class="text-link">Read article →</span>
      </div>
    </a>
  `).join("");

  app.innerHTML = `
    <a class="back-link" href="#home">← Back to home</a>

    <section class="section">
      <p class="eyebrow">LEARNING SERIES / JAVA</p>
      <h1 class="page-title">Spring Boot Journey</h1>
      <p class="page-description">
        Notes, experiments and lessons from my backend development journey.
      </p>

      <p class="muted">${articles.length} article(s)</p>

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
  app.innerHTML = `
    <div class="reader">
      <a class="back-link" href="#series/springboot">
        ← Back to Spring Boot Journey
      </a>
      <p class="muted">Loading article...</p>
    </div>
  `;

  // Only load article paths inside the known series directory.
  if (!file.startsWith("SpringBoot-Journey/") ||
      file.includes("..") ||
      !file.endsWith(".md")) {
    showError("Invalid article path.");
    return;
  }

  try {
    const response = await fetch(file);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const markdown = await response.text();

    if (typeof marked === "undefined" ||
        typeof DOMPurify === "undefined") {
      throw new Error("Markdown libraries could not load.");
    }

    const html = marked.parse(markdown);

    // Sanitize HTML before adding it to the page.
    const safeHtml = DOMPurify.sanitize(html);

    const article = articles.find(item => item.file === file);
    const title = article?.title || "Article";

    app.innerHTML = `
      <article class="reader">
        <a class="back-link" href="#series/springboot">
          ← Back to Spring Boot Journey
        </a>

        <p class="eyebrow">SPRING BOOT JOURNEY</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="article-meta">Written by Pushpak</p>

        <div class="reader-content">${safeHtml}</div>

        <hr style="border-color: var(--border); margin-top: 48px;">

        <a class="back-link" href="#series/springboot">
          ← More articles
        </a>
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
      <a class="back-link" href="#series/springboot">
        ← Back to articles
      </a>
      <p class="error">${escapeHtml(message)}</p>
    </div>
  `;
}

function route() {
  const hash = decodeURIComponent(
    window.location.hash.slice(1) || "home"
  );

  if (hash === "home") {
    renderHome();
    return;
  }

  if (hash === "series/springboot") {
    renderSeries();
    return;
  }

  if (hash.startsWith("article/")) {
    const file = hash.slice("article/".length);
    renderArticle(file);
    return;
  }

  renderHome();
}

window.addEventListener("hashchange", route);
route();
