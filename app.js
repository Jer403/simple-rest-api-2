import express, { json } from "express";
import { moviesRouter } from "./routes/movies.js"
import { corsMiddleware } from "./middlewares/cors.js";

// Como leer un json en ESModules
// import fs from "node:fs"
// const movies = JSON.parse(fs.readFileSync("./movies.json","utf-8"))

const app = express();

app.use(json())
app.use(corsMiddleware())
app.disable("x-powered-by");


app.use("/movies", moviesRouter)


const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
    console.log("server listening on port: http://localhost:" + PORT)
})