fetch("https://jsonplaceholder.typicode.com/posts", {
    methon: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        title: "nuevo post",
        body: "Contenido",
        userId: 1
    })
}).then(res => res.json()).then(data => console.log(data));

async function crearPost() {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
            methon: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: "nuevo post",
                body: "Contenido",
                userId: 1
            })
        })
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error)
    }
}