import mysql from "mysql2/promise"

const config = {
    host: "localhost",
    user: "root",
    port: "3310",
    password: "123456789",
    database: "moviesdb"
}

const connection = await mysql.createConnection(config)

// Conexion a una base de datos en la nube

const DEFAULT_CONFIG = {
    host: "localhost",
    user: "root",
    port: "3310",
    password: "123456789",
    database: "moviesdb"
}

const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONFIG

const connectionToDatabase = await mysql.createConnection(connectionString)




export class MovieModel {
    static async getAll({ genre }) {
        if (genre) {
            const lowerCaseGenre = genre.toLowerCase();

            const [genres] = await connection.query(
                "SELECT id, name FROM genre WHERE LOWER(name) = ?; ", [lowerCaseGenre]
            )

            if (genres.length == 0) return []

            const [{ id }] = genres;

            const [movies] = await connection.query(
                `SELECT BIN_TO_UUID(id) id, title, year, director, duration, poster, rate FROM movie_genre
                 JOIN movie ON movie.id = movie_genre.movie_id WHERE genre_id = ?;`, [id]
            )

            await addGenresToMany(movies)

            return movies;
        }

        const [movies, tableinfo] = await connection.query(
            "SELECT *, BIN_TO_UUID(id) id FROM movie"
        )

        return movies;
    }

    static async getById({ id }) {
        const [movies, tableinfo] = await connection.query(
            "SELECT *, BIN_TO_UUID(id) id FROM movie WHERE id = UUID_TO_BIN(?);",
            [id]
        )
        if (movies.length == 0) return null;
        return movies[0]
    }

    static async create({ input }) {
        const {
            genre: genreInput,
            title,
            year,
            duration,
            director,
            rate,
            poster
        } = input;


        const [uuidResult] = await connection.query("SELECT UUID() uuid;")
        const [{ uuid }] = uuidResult;


        try {
            await connection.query(
                `INSERT INTO movie(id, title, year, director, duration, poster, rate) 
                VALUES(UUID_TO_BIN("${uuid}"),?,?,?,?,?,?)`,
                [title, year, director, duration, poster, rate]
            )
        } catch (e) {
            console.log(e)
        }

        for (const gen of genreInput) {
            const [[{ id }]] = await connection.query(
                "SELECT id, name FROM genre WHERE LOWER(name) = ?; ", [gen]
            )

            try {
                await connection.query(
                    `INSERT INTO movie_genre (movie_id, genre_id)
                    VALUES(UUID_TO_BIN("${uuid}"),${id})`,
                )
            } catch (e) {
                console.log(e)
            }
        }

        const [movie] = await connection.query(
            "SELECT BIN_TO_UUID(id) id, title, year, director, duration, poster, rate FROM movie WHERE id = UUID_TO_BIN(?);",
            [uuid]
        )

        movie[0].genre = genreInput;

        return movie[0]
    }

    static async delete({ id }) {
        try {
            await connection.query(
                "DELETE FROM movie_genre WHERE movie_id = UUID_TO_BIN(?);",
                [id]
            )
        } catch (e) {
            console.log(e)
        }
        try {
            await connection.query(
                "DELETE FROM movie WHERE id = UUID_TO_BIN(?);",
                [id]
            )
        } catch (e) {
            console.log(e)
        }

    }

    static async update({ id, input }) {
        let moviesToFind;
        try {
            moviesToFind = await connection.query(
                "SELECT *, BIN_TO_UUID(id) id FROM movie WHERE id = UUID_TO_BIN(?);",
                [id]
            )
        } catch (e) {
            return { message: "Movie not found" }
        }

        const [[movie]] = moviesToFind;

        const { title, year, director, duration, poster, rate } = {
            ...movie,
            ...input
        }

        try {
            await connection.query(
                `UPDATE movie 
                SET title = ? , year = ?, director = ?, duration = ?, poster = ?, rate = ? 
                WHERE id = UUID_TO_BIN(?);`,
                [title, year, director, duration, poster, rate, id]
            )
        } catch (e) {
            console.log(e)
        }

        return { message: "Movie updated" }

    }
}

async function addGenresToMany(movies) {
    for (const m of movies) {
        const { id } = m;

        const [movie_genres] = await connection.query(
            `SELECT name FROM movie_genre
            JOIN genre ON genre.id = movie_genre.genre_id WHERE movie_id = UUID_TO_BIN(?);`, [id]
        )

        let genres = [];

        movie_genres.forEach(({ name }) => {
            genres.push(name)
        })

        m.genres = genres;
    }
}

