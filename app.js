import express, { json } from "express";
import { createMovieRouter } from "./routes/movies.js"
import { corsMiddleware } from "./middlewares/cors.js";
// esto es para cargar las variables de entorno del archivo .env
// para la conexion con una base de datos en la nube
import "dotenv/config"

// Como leer un json en ESModules
// import fs from "node:fs"
// const movies = JSON.parse(fs.readFileSync("./movies.json","utf-8"))


export const createApp = ({ movieModel }) => {
    const app = express();

    app.use(json())
    app.use(corsMiddleware())
    app.disable("x-powered-by");


    app.use("/movies", createMovieRouter({ movieModel }))


    const PORT = process.env.PORT ?? 1234;

    app.listen(PORT, () => {
        console.log("server listening on port: http://localhost:" + PORT)
    })
}