// routes/auth.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// helpers
function signUserToken(user) {
    // incluir los campos que necesites en el payload
    return jwt.sign({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        tipo_usuario: user.tipo_usuario
    }, process.env.JWT_SECRET, { expiresIn: "30d" }); // token largo para "mantener sesión hasta cerrar manual"
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
        const [found] = await pool.execute(`SELECT id FROM usuarios WHERE email = ?`, [email]);
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

        // Firmar token
        const token = signUserToken(user);

        res.json({ user, token });
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
        const [rows] = await pool.execute(`SELECT * FROM usuarios WHERE email = ?`, [email]);
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

        const token = signUserToken(cleanUser);

        const accessToken = signUserToken(cleanUser); // expira más corto (ej: 15m)
        const refreshToken = signUserToken(cleanUser); // expira más largo (ej: 30d)

        res.json({
            user: cleanUser,
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error("❌ Error en /login:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// =====================
// Obtener info del usuario logueado
// - Para esto el cliente debe enviar Authorization: Bearer <token>
// =====================
router.get("/me", (req, res) => {
    // Nota: app.js coloca req.user si enviaste token en headers
    if (!req.user) {
        return res.status(401).json({ error: "No autenticado" });
    }
    res.json(req.user);
});

// =====================
// Refresh Token
// =====================
router.post("/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "Falta refreshToken" });
    }

    try {
        // verificamos que el refresh token sea válido
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // puedes generar un nuevo access token con los mismos datos
        const newAccessToken = jwt.sign(
            {
                id: decoded.id,
                nombre: decoded.nombre,
                email: decoded.email,
                tipo_usuario: decoded.tipo_usuario,
            },
            process.env.JWT_SECRET,
            { expiresIn: "15m" } // vida corta para el access token
        );

        return res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error("❌ Error en /refresh:", err);
        return res.status(401).json({ error: "Refresh token inválido o expirado" });
    }
});


// =====================
// Logout
// =====================
// Con JWT no hay "destroy session" server-side sin blacklist.
// Este endpoint solo es informativo: el cliente debe borrar el token localmente.
router.post("/logout", (req, res) => {
    // Si quieres implementar blacklist, aquí es donde agregarías el token a la lista.
    res.json({ message: "Logout: elimina el token en cliente" });
});

module.exports = router;
