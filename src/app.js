const express = require("express");
const pool = require("./db");

const app = express();

// Middlewares
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("🚀 API funcionando correctamente");
});

// Ping DB
app.get("/ping", async (req, res) => {
    try {
        const [result] = await pool.query(`SELECT "pong" as msg`);
        res.json(result[0]);
    } catch (err) {
        console.error("❌ Error en /ping:", err);
        res.status(500).json({ error: "Error en /ping" });
    }
});

// Clientes (ejemplo)
app.get("/clientes", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM clientes");
        res.json(rows);
    } catch (err) {
        console.error("❌ Error en /clientes:", err);
        res.status(500).json({ error: "Error al obtener clientes" });
    }
});

// 🚀 Usar el puerto que da la plataforma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server escuchando en puerto ${PORT}`);
});
