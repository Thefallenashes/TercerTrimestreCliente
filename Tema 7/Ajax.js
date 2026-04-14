//https://jsonplaceholder.typicode.com/posts/1
//Metodo clasico
const xhr = new XMLHttpRequest();

xhr.open("GET", "https://jsonplaceholder.typicode.com/posts/1");

xhr.onload = function () {
    if (xhr.status === 200) {
        console.log(JSON.parse(xhr.responseText));
    }
};

xhr.send();

const btn1 = document.getElementById("btn1").addEventListener("click", peticion1);

function peticion1() {
    let p = document.getElementById("res1");
    let res = (JSON.parse(xhr.responseText));
    p.textContent = res.title
    // alternativamente , xhr.send(); funciona para 
}


//Metodo moderno con fetch 

fetch("https://jsonplaceholder.typicode.com/posts/1").then(response => response.json()).then(data => console.log(data)).catch(error => console.error(error));

