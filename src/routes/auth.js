// routes/auth.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");

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

        // Guardar en sesión
        req.session.user = user;

        res.json({ user });
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

        // Guardar en sesión
        req.session.user = cleanUser;

        res.json({ user: cleanUser });
    } catch (err) {
        console.error("❌ Error en /login:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// =====================
// Obtener info del usuario logueado
// =====================
router.get("/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "No autenticado" });
    }
    res.json(req.session.user);
});

// =====================
// Logout
// =====================
router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("❌ Error al cerrar sesión:", err);
            return res.status(500).json({ error: "Error al cerrar sesión" });
        }
        res.clearCookie("connect.sid"); // limpiar cookie de sesión
        res.json({ message: "Sesión cerrada correctamente" });
    });
});

module.exports = router;
