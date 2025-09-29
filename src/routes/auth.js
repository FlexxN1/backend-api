// routes/auth.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth"); // 👈 ya lo tienes
require("dotenv").config();

// 🔑 claves secretas (asegúrate de definir en Railway: JWT_SECRET y JWT_REFRESH_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh123";

// =====================
// Helpers
// =====================
function generarAccessToken(user) {
    return jwt.sign(user, JWT_SECRET, { expiresIn: "15m" }); // acceso corto
}

function generarRefreshToken(user) {
    return jwt.sign(user, JWT_REFRESH_SECRET, { expiresIn: "7d" }); // sesión larga
}

// =====================
// Registro de usuario
// =====================
router.post("/register", async (req, res) => {
    const { nombre, email, password, tipo_usuario = "Cliente" } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    try {
        const [found] = await pool.execute(
            `SELECT id FROM usuarios WHERE email = ?`,
            [email]
        );
        if (found.length) {
            return res.status(409).json({ error: "Email ya registrado" });
        }

        const hash = await bcrypt.hash(password, 10);

        const [r] = await pool.execute(
            `INSERT INTO usuarios (nombre, email, password, tipo_usuario) VALUES (?, ?, ?, ?)`,
            [nombre, email, hash, tipo_usuario]
        );
        const id = r.insertId;

        const user = { id, nombre, email, tipo_usuario };

        // tokens
        const accessToken = generarAccessToken(user);
        const refreshToken = generarRefreshToken(user);

        res.json({ accessToken, refreshToken, user });
    } catch (err) {
        console.error("❌ Error en /register:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// =====================
// Login de usuario
// =====================
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT * FROM usuarios WHERE email = ?`,
            [email]
        );
        if (!rows.length) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const cleanUser = {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            tipo_usuario: user.tipo_usuario,
        };

        const accessToken = generarAccessToken(cleanUser);
        const refreshToken = generarRefreshToken(cleanUser);

        res.json({ accessToken, refreshToken, user: cleanUser });
    } catch (err) {
        console.error("❌ Error en /login:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// =====================
// Refresh token
// =====================
router.post("/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ error: "No hay refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        const user = {
            id: payload.id,
            nombre: payload.nombre,
            email: payload.email,
            tipo_usuario: payload.tipo_usuario,
        };

        const newAccessToken = generarAccessToken(user);

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error("❌ Error en /refresh:", err.message);
        return res.status(403).json({ error: "Refresh token inválido o expirado" });
    }
});

// Obtener info del usuario logueado
router.get("/me", auth(["Administrador", "Cliente"]), async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT id, nombre, email, tipo_usuario FROM usuarios WHERE id = ?",
            [req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("❌ Error en GET /auth/me:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

module.exports = router;
