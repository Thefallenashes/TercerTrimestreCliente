// ──────────────────────────────────────────────
// peticion.js  –  Lógica del frontend
// ──────────────────────────────────────────────

const API_BASE = "http://localhost:3000";

// Referencias al DOM
const btnBuscar     = document.getElementById("btn-buscar");
const btnActualizar = document.getElementById("btn-actualizar");
const searchInput   = document.getElementById("search-input");
const tagSelect     = document.getElementById("tag-select");
const grid          = document.getElementById("grid");
const loader        = document.getElementById("loader");
const statusBar     = document.getElementById("status-bar");
const emptyMsg      = document.getElementById("empty-msg");

// Almacén de todas las citas descargadas
let allQuotes = [];

// ──────────────────────────────────────────────
// Utilidades UI
// ──────────────────────────────────────────────
function setLoading(active) {
    loader.classList.toggle("visible", active);
    grid.style.display   = active ? "none" : "grid";
    btnBuscar.disabled     = active;
    btnActualizar.disabled = active;
}

function setStatus(msg) {
    statusBar.textContent = msg;
}

// ──────────────────────────────────────────────
// Renderizado de cards
// ──────────────────────────────────────────────
function renderCards(quotes) {
    // Limpiar cards anteriores (dejar el mensaje vacío)
    Array.from(grid.children).forEach(child => {
        if (child.id !== "empty-msg") child.remove();
    });

    if (quotes.length === 0) {
        emptyMsg.style.display = "block";
        return;
    }

    emptyMsg.style.display = "none";

    quotes.forEach((q, i) => {
        const card = document.createElement("article");
        card.className = "card";
        card.style.animationDelay = `${Math.min(i * 40, 600)}ms`;

        // Inicial del autor para el avatar
        const initial = (q.author?.[0] ?? "?").toUpperCase();

        // Tags como badges clicables
        const tagsHtml = (q.tags || [])
            .map(t => `<span class="tag" data-tag="${t}">${t}</span>`)
            .join("");

        card.innerHTML = `
            <p class="card-quote">${escapeHtml(q.text)}</p>
            <div class="card-author">
                <div class="avatar">${escapeHtml(initial)}</div>
                <div>
                    <div class="author-name">${escapeHtml(q.author)}</div>
                    <a class="author-link"
                       href="${escapeHtml(q.authorLink)}"
                       target="_blank" rel="noopener">Ver más</a>
                </div>
            </div>
            ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ""}
        `;

        // Clic en tag → filtra por ese tag llamando al backend
        card.querySelectorAll(".tag").forEach(tagEl => {
            tagEl.addEventListener("click", () => {
                const tag = tagEl.dataset.tag;
                tagSelect.value = tag in getTagOptions() ? tag : "";
                fetchQuotes(tag);
            });
        });

        grid.appendChild(card);
    });
}

// Devuelve los valores actualmente en el <select> como objeto {tag:true}
function getTagOptions() {
    return Object.fromEntries(
        Array.from(tagSelect.options).map(o => [o.value, true])
    );
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ──────────────────────────────────────────────
// Filtro LOCAL (busca en las citas ya cargadas)
// ──────────────────────────────────────────────
function applyLocalFilter() {
    const term = searchInput.value.trim().toLowerCase();
    if (!term) {
        renderCards(allQuotes);
        setStatus(`Mostrando ${allQuotes.length} citas.`);
        return;
    }
    const filtered = allQuotes.filter(q =>
        q.text.toLowerCase().includes(term) ||
        q.author.toLowerCase().includes(term) ||
        q.tags.some(t => t.toLowerCase().includes(term))
    );
    renderCards(filtered);
    setStatus(`Filtro local: ${filtered.length} de ${allQuotes.length} citas.`);
}

// ──────────────────────────────────────────────
// Petición al backend
// ──────────────────────────────────────────────
async function fetchQuotes(tag = "", forceRefresh = false) {
    setLoading(true);
    setStatus("Conectando con el servidor…");
    searchInput.value = "";

    try {
        const params = new URLSearchParams();
        if (tag)          params.set("tag", tag);
        if (forceRefresh) params.set("refresh", "true");

        const url = `${API_BASE}/quotes?${params.toString()}`;
        console.log("[fetch] GET", url);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        allQuotes = data.quotes ?? [];

        renderCards(allQuotes);
        setStatus(
            `✔ ${allQuotes.length} citas cargadas` +
            (tag ? ` para el tag "${tag}"` : "") +
            (forceRefresh ? " (datos actualizados)" : "")
        );
    } catch (err) {
        console.error("[error]", err);
        setStatus(`✖ Error: ${err.message}. ¿Está el servidor arrancado en localhost:3000?`);
        renderCards([]);
    } finally {
        setLoading(false);
    }
}

// ──────────────────────────────────────────────
// Cargar lista de tags al iniciar
// ──────────────────────────────────────────────
async function loadTags() {
    try {
        const res  = await fetch(`${API_BASE}/tags`);
        const tags = await res.json();
        if (!Array.isArray(tags)) return;

        tags.forEach(tag => {
            const opt = document.createElement("option");
            opt.value       = tag;
            opt.textContent = tag;
            tagSelect.appendChild(opt);
        });
    } catch {
        // Si falla, el select solo tendrá la opción "Todos"
    }
}

// ──────────────────────────────────────────────
// Event listeners
// ──────────────────────────────────────────────
btnBuscar.addEventListener("click", () => {
    const tag = tagSelect.value;
    fetchQuotes(tag, false);
});

btnActualizar.addEventListener("click", () => {
    const tag = tagSelect.value;
    fetchQuotes(tag, true);
});

// Filtro local en tiempo real mientras se escribe
searchInput.addEventListener("input", applyLocalFilter);

// Cambio de tag → nueva petición al backend
tagSelect.addEventListener("change", () => {
    fetchQuotes(tagSelect.value, false);
});

// ──────────────────────────────────────────────
// Inicialización
// ──────────────────────────────────────────────
(async () => {
    await loadTags();
    // Carga automática inicial
    fetchQuotes("", false);
})();
