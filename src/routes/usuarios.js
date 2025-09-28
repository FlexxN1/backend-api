const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET todos los usuarios
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios");
        res.json(rows);
    } catch {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// GET un usuario por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        res.json(rows[0]);
    } catch {
        res.status(500).json({ error: "Error al obtener usuario" });
    }
});

// POST crear usuario
router.post("/", async (req, res) => {
    const { nombre, email, password, tipo_usuario } = req.body;
    try {
        const [result] = await pool.query(
            "INSERT INTO usuarios (nombre, email, password, tipo_usuario) VALUES (?, ?, ?, ?)",
            [nombre, email, password, tipo_usuario || "Cliente"]
        );
        res.json({ id: result.insertId, nombre, email, tipo_usuario });
    } catch {
        res.status(500).json({ error: "Error al crear usuario" });
    }
});

// PUT actualizar usuario
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { nombre, email, password, tipo_usuario } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE usuarios SET nombre=?, email=?, password=?, tipo_usuario=? WHERE id=?",
            [nombre, email, password, tipo_usuario, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        res.json({ message: "Usuario actualizado" });
    } catch {
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

// DELETE usuario
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM usuarios WHERE id=?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Usuario no encontrado" });
        res.json({ message: "Usuario eliminado" });
    } catch {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

module.exports = router;
