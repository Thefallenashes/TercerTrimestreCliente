const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// Caché en memoria (TTL: 5 minutos)
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Función de scraping
// Navega hasta quotes.toscrape.com, opcionalmente
// filtra por tag, y recorre hasta MAX_PAGES páginas
// pulsando el botón "Next".
// ──────────────────────────────────────────────
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

    // Construir URL inicial
    const baseUrl = tag
        ? `https://quotes.toscrape.com/tag/${encodeURIComponent(tag)}/`
        : "https://quotes.toscrape.com/";

    await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // Interacción: si hay tag, lo buscamos clicando en la nube de tags de la
    // página principal (sólo cuando venimos sin tag para simular navegación).
    // En cualquier caso navegamos varias páginas con el botón "Next".

    const MAX_PAGES = 5;
    const quotes = [];

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        console.log(`[puppeteer] Extrayendo página ${pageNum}…`);

        // Extraer citas de la página actual
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

        // Intentar pulsar el botón "Next"
        const nextBtn = await page.$("li.next > a");
        if (!nextBtn) break; // No hay más páginas

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

// ──────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────

/**
 * GET /quotes
 * Query params:
 *   tag      – filtrar por etiqueta (opcional)
 *   refresh  – si es "true" ignora la caché
 */
app.get("/quotes", async (req, res) => {
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

/**
 * GET /tags
 * Devuelve la lista de tags disponibles (de la nube de la página principal).
 */
app.get("/tags", async (req, res) => {
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

// ──────────────────────────────────────────────
// Arrancar servidor
// ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`  GET /quotes          → todas las citas (5 páginas)`);
    console.log(`  GET /quotes?tag=love → citas filtradas por tag`);
    console.log(`  GET /quotes?refresh=true → forzar actualización`);
    console.log(`  GET /tags            → lista de tags disponibles`);
});
