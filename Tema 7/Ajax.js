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


//Metodo moderno async/await

async function obtener() {
    try {
        const response = await fetch("https://restful-api.dev/collectionsu");
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}
obtener();


//https://jsonplaceholder.typicode.com/posts/1
/*
let p = document.getElementById("resultado1");

//Metodo clasico
const xhr = new XMLHttpRequest();

xhr.open("GET", "https://jsonplaceholder.typicode.com/posts/1");

xhr.onload = function () {
  if (xhr.status === 200) {
    console.log(JSON.parse(xhr.responseText));
    p.textContent = JSON.parse(xhr.responseText).title;
  }
};

document.getElementById("btn1").addEventListener("click", peticion1);

function peticion1(){
  xhr.send();
}




//Metodo moderno con fetch
fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then(response => response.json())
  .then(data => console.log(data))
  .then(data => p.textContent = data.title)
  .catch(error => console.error(error));

*/
//Metodo moderno con async/await
/**
async function obtenerPost() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts/1");

    const data = await response.json();
    console.log(data);

    return data;
  } catch (error) {
    console.error(error);
  }
}


obtenerPost();




//Post
fetch("https://jsonplaceholder.typicode.com/posts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: "Nuevo post",
    body: "Contenido",
    userId: 1
  })
})
.then(res => res.json())
.then(data => console.log(data));




//Post con async/await
async function crearPost() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Nuevo post",
          body: "Contenido",
          userId: 1
        })
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

crearPost();
