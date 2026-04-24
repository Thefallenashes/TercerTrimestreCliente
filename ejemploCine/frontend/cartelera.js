async function cargarPeliculas() {
    const loading = document.getElementById("loading");
    const contenedor = document.getElementById("peliculas");

    // Mostrar loading
    loading.style.display = "block";
    contenedor.innerHTML = "";

    const res = await fetch("http://localhost:3000/peliculas");
    const data = await res.json();

    loading.style.display = "none";

    data.forEach(peli => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
        <img src="${peli.imagen}" />
        <h3>${peli.titulo}</h3>
      `;

        card.addEventListener("click", () => {
            window.open(peli.link, "_blank");
        });
        contenedor.appendChild(card);
    });
}
//    