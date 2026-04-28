const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "Front"), { index: false }));

const FRONTEND_SCRIPT = `
const API_BASE = "/api";

const btnBuscar = document.getElementById("btn-buscar");
const btnActualizar = document.getElementById("btn-actualizar");
const searchInput = document.getElementById("search-input");
const tagSelect = document.getElementById("tag-select");
const grid = document.getElementById("grid");
const loader = document.getElementById("loader");
const statusBar = document.getElementById("status-bar");
const emptyMsg = document.getElementById("empty-msg");

let allQuotes = [];

function setLoading(active) {
    loader.classList.toggle("visible", active);
    grid.style.display = active ? "none" : "grid";
    btnBuscar.disabled = active;
    btnActualizar.disabled = active;
}

function setStatus(message) {
    statusBar.textContent = message;
}

function getTagOptions() {
    return Object.fromEntries(
        Array.from(tagSelect.options).map(option => [option.value, true])
    );
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");
}

function renderCards(quotes) {
    Array.from(grid.children).forEach(child => {
        if (child.id !== "empty-msg") child.remove();
    });

    if (quotes.length === 0) {
        emptyMsg.style.display = "block";
        return;
    }

    emptyMsg.style.display = "none";

    quotes.forEach((quote, index) => {
        const card = document.createElement("div");
        const initial = (quote.author && quote.author[0] ? quote.author[0] : "?").toUpperCase();
        const tagsHtml = (quote.tags || []).map(tag => {
            return '<span class="tag" data-tag="' + tag + '">' + tag + '</span>';
        }).join("");

        card.className = "quote";
        card.style.animationDelay = Math.min(index * 40, 600) + "ms";
        card.innerHTML =
            '<p class="card-quote">' + escapeHtml(quote.text) + '</p>' +
            '<div class="card-author">' +
                '<div class="avatar">' + escapeHtml(initial) + '</div>' +
                '<div>' +
                    '<div class="author-name">' + escapeHtml(quote.author) + '</div>' +
                    '<a class="author-link" href="' + escapeHtml(quote.authorLink) + '" target="_blank" rel="noopener">Ver mas</a>' +
                '</div>' +
            '</div>' +
            (tagsHtml ? '<div class="card-tags">' + tagsHtml + '</div>' : '');

        card.querySelectorAll(".tag").forEach(tagElement => {
            tagElement.addEventListener("click", () => {
                const tag = tagElement.dataset.tag;
                tagSelect.value = tag in getTagOptions() ? tag : "";
                fetchQuotes(tag);
            });
        });

        grid.appendChild(card);
    });
}

function applyLocalFilter() {
    const term = searchInput.value.trim().toLowerCase();

    if (!term) {
        renderCards(allQuotes);
        setStatus("Mostrando " + allQuotes.length + " citas.");
        return;
    }

    const filtered = allQuotes.filter(quote =>
        quote.text.toLowerCase().includes(term) ||
        quote.author.toLowerCase().includes(term) ||
        quote.tags.some(tag => tag.toLowerCase().includes(term))
    );

    renderCards(filtered);
    setStatus("Filtro local: " + filtered.length + " de " + allQuotes.length + " citas.");
}

async function fetchQuotes(tag = "", forceRefresh = false) {
    setLoading(true);
    setStatus("Conectando con el servidor...");
    searchInput.value = "";

    try {
        const params = new URLSearchParams();
        if (tag) params.set("tag", tag);
        if (forceRefresh) params.set("refresh", "true");

        const query = params.toString();
        const url = API_BASE + "/quotes" + (query ? "?" + query : "");
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        allQuotes = data.quotes || [];
        renderCards(allQuotes);
        setStatus(
            "Cargadas " + allQuotes.length + " citas" +
            (tag ? ' para el tag "' + tag + '"' : "") +
            (forceRefresh ? " (datos actualizados)" : "")
        );
    } catch (error) {
        console.error("[error]", error);
        setStatus("Error: " + error.message + ". Comprueba que el servidor sigue arrancado.");
        renderCards([]);
    } finally {
        setLoading(false);
    }
}

async function loadTags() {
    try {
        const response = await fetch(API_BASE + "/tags");
        const tags = await response.json();

        if (!Array.isArray(tags)) {
            return;
        }

        tags.forEach(tag => {
            const option = document.createElement("option");
            option.value = tag;
            option.textContent = tag;
            tagSelect.appendChild(option);
        });
    } catch (error) {
        console.error("[error loadTags]", error);
    }
}

btnBuscar.addEventListener("click", () => {
    fetchQuotes(tagSelect.value, false);
});

btnActualizar.addEventListener("click", () => {
    fetchQuotes(tagSelect.value, true);
});

searchInput.addEventListener("input", applyLocalFilter);

tagSelect.addEventListener("change", () => {
    fetchQuotes(tagSelect.value, false);
});

(async () => {
    await loadTags();
    fetchQuotes("", false);
})();
`;


const cache = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key) {
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        delete cache[key];
        return null;
    }
    return entry.data;
}

function setCache(key, data) {
    cache[key] = { data, timestamp: Date.now() };
}

async function scrapeQuotes(tag = "", forceRefresh = false) {
    const cacheKey = tag ? `tag:${tag}` : "all";

    if (!forceRefresh) {
        const cached = getCached(cacheKey);
        if (cached) {
            console.log(`[cache] Devolviendo datos cacheados para "${cacheKey}"`);
            return cached;
        }
    }

    console.log(`[puppeteer] Iniciando scraping. tag="${tag}"`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const baseUrl = tag
        ? `https://quotes.toscrape.com/tag/${encodeURIComponent(tag)}/`
        : "https://quotes.toscrape.com/";

    await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 30000 });

    const MAX_PAGES = 5;
    const quotes = [];

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        console.log(`[puppeteer] Extrayendo página ${pageNum}…`);

        const pageQuotes = await page.evaluate(() => {
            const items = document.querySelectorAll("div.quote");
            return Array.from(items).map(el => {
                const text = el.querySelector("span.text")?.innerText ?? "";
                const author = el.querySelector("small.author")?.innerText ?? "";
                const authorLink = el.querySelector("a")?.href ?? "";
                const tags = Array.from(
                    el.querySelectorAll("a.tag")
                ).map(t => t.innerText);
                return { text, author, authorLink, tags };
            });
        });

        quotes.push(...pageQuotes);

        const nextBtn = await page.$("li.next > a");
        if (!nextBtn) break;

        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }),
            nextBtn.click()
        ]);
    }

    await browser.close();
    console.log(`[puppeteer] Scraping finalizado. Total citas: ${quotes.length}`);

    setCache(cacheKey, quotes);
    return quotes;
}


app.get("/api/quotes", async (req, res) => {
    try {
        const tag = (req.query.tag || "").trim().toLowerCase();
        const forceRefresh = req.query.refresh === "true";

        const quotes = await scrapeQuotes(tag, forceRefresh);
        res.json({ total: quotes.length, quotes });
    } catch (err) {
        console.error("[error]", err.message);
        res.status(500).json({ error: "Error al hacer scraping", details: err.message });
    }
});

app.get("/api/tags", async (req, res) => {
    try {
        const cached = getCached("tags");
        if (cached) return res.json(cached);

        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        const page = await browser.newPage();
        await page.goto("https://quotes.toscrape.com/", { waitUntil: "networkidle2" });

        const tags = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("div.tags-box a.tag"))
                .map(a => a.innerText.trim());
        });

        await browser.close();
        setCache("tags", tags);
        res.json(tags);
    } catch (err) {
        console.error("[error]", err.message);
        res.status(500).json({ error: "Error al obtener tags" });
    }
});

app.get("/", (req, res) => {
    const indexPath = path.join(__dirname, "..", "Front", "index.html");
    const html = fs.readFileSync(indexPath, "utf8");

    res.type("html").send(
        html.replace(
            "</body>",
            `<script>${FRONTEND_SCRIPT}</script>\n</body>`
        )
    );
});

// ──────────────────────────────────────────────
// Arrancar servidor
// ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\nServidor escuchando en http://localhost:${PORT}`);
    console.log(`  GET /             → Frontend (index.html)`);
    console.log(`  GET /api/quotes   → Todas las citas (5 páginas)`);
    console.log(`  GET /api/quotes?tag=love → Citas filtradas por tag`);
    console.log(`  GET /api/quotes?refresh=true → Forzar actualización`);
    console.log(`  GET /api/tags    → Lista de tags disponibles\n`);
});

