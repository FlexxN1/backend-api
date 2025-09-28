const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET productos
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM productos");
        res.json(rows);
    } catch {
        res.status(500).json({ error: "Error al obtener productos" });
    }
});

// GET producto por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM productos WHERE id=?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
        res.json(rows[0]);
    } catch {
        res.status(500).json({ error: "Error al obtener producto" });
    }
});

// POST crear producto
router.post("/", async (req, res) => {
    const { nombre, descripcion, precio, stock, vendedor_id, imagen_url } = req.body;
    try {
        const [result] = await pool.query(
            "INSERT INTO productos (nombre, descripcion, precio, stock, vendedor_id, imagen_url) VALUES (?, ?, ?, ?, ?, ?)",
            [nombre, descripcion, precio, stock, vendedor_id, imagen_url]
        );
        res.json({ id: result.insertId, nombre, precio, stock });
    } catch {
        res.status(500).json({ error: "Error al crear producto" });
    }
});

// PUT actualizar producto
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, imagen_url } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE productos SET nombre=?, descripcion=?, precio=?, stock=?, imagen_url=? WHERE id=?",
            [nombre, descripcion, precio, stock, imagen_url, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Producto no encontrado" });
        res.json({ message: "Producto actualizado" });
    } catch {
        res.status(500).json({ error: "Error al actualizar producto" });
    }
});

// DELETE producto
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM productos WHERE id=?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Producto no encontrado" });
        res.json({ message: "Producto eliminado" });
    } catch {
        res.status(500).json({ error: "Error al eliminar producto" });
    }
});

module.exports = router;
