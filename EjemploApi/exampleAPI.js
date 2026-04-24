const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());

/*
app.use(cors({
  origin: "http://127.0.0.1:5500"
}));*/


app.get("/datos", (req, res) => {
  res.json({ mensaje: "Hola desde el servidor" });
});


app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});





/*
const cors = require("cors");
//app.use(cors());

app.use((req, res, next) => {
  console.log(req.headers.origin);
  next();
});

app.use(cors({
  origin: "http://127.0.0.1:5500"
}));


*/


//npm install express
//npm install cors