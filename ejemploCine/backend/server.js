
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/peliculas", async (req, res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://cinesembajadores.es/oviedo/", {
        waitUntil: "networkidle2",
    });

    const peliculas = await page.evaluate(() => {
        const items = document.querySelectorAll("li.movie");

        return Array.from(items).map(el => {
            const titulo = el.querySelector(".info h2 a")?.innerText;
            const link = el.querySelector(".info h2 a")?.href;

            // imagen (background)
            const imagen = el.querySelector(".poster img")?.src;

            return {
                titulo,
                link,
                imagen
            };
        });
    });

    await browser.close();
    res.json(peliculas);
});

app.listen(3000, () => console.log("Servidor en http://localhost:3000"));












/*
//WITH CACHE

const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

let cache = null;
let lastFetch = 0;
const CACHE_TIME = 10 * 60 * 1000; // 10 minutos

app.get("/peliculas", async (req, res) => {
  const now = Date.now();

  // ✅ usar cache si existe
  if (cache && (now - lastFetch < CACHE_TIME)) {
    console.log("⚡ Usando caché");
    return res.json(cache);
  }

  console.log("🕵️ Scrapeando...");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://cinesembajadores.es/oviedo/", {
    waitUntil: "networkidle2",
  });

  const peliculas = await page.evaluate(() => {
    const items = document.querySelectorAll("li.movie");

    return Array.from(items).map(el => {
      const titulo = el.querySelector(".info h2 a")?.innerText;
      const link = el.querySelector(".info h2 a")?.href;
      const imagen = el.querySelector(".poster img")?.src;

      const sesiones = Array.from(
        el.querySelectorAll(".showtimedetail")
      ).map(bloque => {
        const dia = bloque.querySelector("h4")?.innerText;

        const horas = Array.from(
          bloque.querySelectorAll(".showtimelist p")
        ).map(h => h.getAttribute("data-hora"));

        return { dia, horas };
      });

      return { titulo, link, imagen, sesiones };
    });
  });

  await browser.close();

  // 💾 guardar en caché
  cache = peliculas;
  lastFetch = now;

  res.json(peliculas);
});

app.listen(3000, () => console.log("Servidor en http://localhost:3000"));

*/