// routes/usuarios.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");
const jwt = require("jsonwebtoken");

// =============================
// Obtener todos los usuarios
// =============================
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios");
        res.json(rows);
    } catch (err) {
        console.error("❌ Error al obtener usuarios:", err);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// =============================
// Obtener un usuario por ID
// =============================
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("❌ Error al obtener usuario:", err);
        res.status(500).json({ error: "Error al obtener usuario" });
    }
});

// =============================
// Crear un nuevo usuario
// =============================
router.post("/", async (req, res) => {
    try {
        const { nombre, email, password, tipo_usuario } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        const [result] = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, tipo_usuario) VALUES (?, ?, ?, ?)",
            [nombre, email, password, tipo_usuario || "Cliente"]
        );

        res.status(201).json({ id: result.insertId, nombre, email, tipo_usuario });
    } catch (err) {
        console.error("❌ Error al crear usuario:", err);
        res.status(500).json({ error: "Error al crear usuario" });
    }
});

// =============================
// Actualizar usuario
// =============================
router.put("/:id", async (req, res) => {
    try {
        const { nombre, email, password, tipo_usuario } = req.body;

        // Si no se envía password, no lo actualizamos
        let query = "UPDATE usuarios SET nombre = ?, email = ?, tipo_usuario = ? WHERE id = ?";
        let params = [nombre, email, tipo_usuario, req.params.id];

        if (password) {
            query = "UPDATE usuarios SET nombre = ?, email = ?, password = ?, tipo_usuario = ? WHERE id = ?";
            params = [nombre, email, password, tipo_usuario, req.params.id];
        }

        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Obtener usuario actualizado
        const [updatedRows] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [req.params.id]);
        const updatedUser = updatedRows[0];

        // 🔥 Generar nuevos tokens (importante si cambió contraseña)
        const accessToken = jwt.sign(updatedUser, process.env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(updatedUser, process.env.JWT_REFRESH, { expiresIn: "7d" });

        res.json({
            mensaje: "Usuario actualizado correctamente",
            user: updatedUser,
            tokens: {
                accessToken,
                refreshToken,
            },
        });
    } catch (err) {
        console.error("❌ Error al actualizar usuario:", err);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

// =============================
// Eliminar usuario
// =============================
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM usuarios WHERE id = ?", [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({ mensaje: "Usuario eliminado correctamente" });
    } catch (err) {
        console.error("❌ Error al eliminar usuario:", err);
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

module.exports = router;
