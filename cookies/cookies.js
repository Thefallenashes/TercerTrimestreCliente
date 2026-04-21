//Ejemplo de creacion de cookies para almacenamiento
function guardarDatos() {
    let nombre=document.getElementById("nombre").value;
    document.cookie = "nombre= "+nombre;
}

function mostrarDatos() {
    console.log("Cookies :" + document.cookie);
}

function guardarDatoslocal() {
    let tema = document.getElementById("tema").value;
    localStorage.setItem("tema", tema);

}

function mostrarDatoslocal() {
    console.log("Tema actual :" + localStorage.getItem("tema"));
    document.getElementById("local").textContent = "Tema actual :" + localStorage.getItem("tema");
}

function eliminardatos(){
localStorage.clear();
}
function eliminarCookies(){

}

guardarDatos()

mostrarDatos()

guardarDatoslocal()

mostrarDatoslocal()