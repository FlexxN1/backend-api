// routes/usuarios.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");

// =============================
// Obtener todos los usuarios
// =============================
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, nombre, email, tipo_usuario, fecha_registro FROM usuarios"
        );
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
        const [rows] = await pool.query(
            "SELECT id, nombre, email, tipo_usuario, fecha_registro FROM usuarios WHERE id = ?",
            [req.params.id]
        );

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
        const { nombre, email, password, tipo_usuario = "Cliente" } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios (nombre, email, password)" });
        }

        // verificar email único
        const [existing] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: "Email ya registrado" });
        }

        const hash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, tipo_usuario) VALUES (?, ?, ?, ?)",
            [nombre, email, hash, tipo_usuario]
        );

        const newId = result.insertId;
        const [rows] = await pool.query(
            "SELECT id, nombre, email, tipo_usuario, fecha_registro FROM usuarios WHERE id = ?",
            [newId]
        );

        res.status(201).json({ user: rows[0] });
    } catch (err) {
        console.error("❌ Error al crear usuario:", err);
        res.status(500).json({ error: "Error al crear usuario" });
    }
});

// =============================
// Actualizar usuario (nombre / email / tipo_usuario / password opcional)
// =============================
router.put("/:id", async (req, res) => {
    try {
        const { nombre, email, password, tipo_usuario } = req.body;
        const updates = [];
        const params = [];

        if (nombre !== undefined) {
            updates.push("nombre = ?");
            params.push(nombre);
        }
        if (email !== undefined) {
            updates.push("email = ?");
            params.push(email);
        }
        if (tipo_usuario !== undefined) {
            updates.push("tipo_usuario = ?");
            params.push(tipo_usuario);
        }
        if (password !== undefined && password !== null && String(password).trim() !== "") {
            const hash = await bcrypt.hash(password, 10);
            updates.push("password = ?");
            params.push(hash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "Nada para actualizar" });
        }

        params.push(req.params.id);
        const sql = `UPDATE usuarios SET ${updates.join(", ")} WHERE id = ?`;

        const [result] = await pool.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const [rows] = await pool.query(
            "SELECT id, nombre, email, tipo_usuario, fecha_registro FROM usuarios WHERE id = ?",
            [req.params.id]
        );

        res.json({ message: "Usuario actualizado correctamente", user: rows[0] });
    } catch (err) {
        console.error("❌ Error al actualizar usuario:", err);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

// =============================
// Eliminar usuario
// =============================
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM usuarios WHERE id = ?", [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({ message: "Usuario eliminado correctamente" });
    } catch (err) {
        console.error("❌ Error al eliminar usuario:", err);
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

module.exports = router;
