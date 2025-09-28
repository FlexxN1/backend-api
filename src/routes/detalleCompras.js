const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET detalles
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM detalle_compras");
        res.json(rows);
    } catch {
        res.status(500).json({ error: "Error al obtener detalles" });
    }
});

// GET detalle por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM detalle_compras WHERE id=?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Detalle no encontrado" });
        res.json(rows[0]);
    } catch {
        res.status(500).json({ error: "Error al obtener detalle" });
    }
});

// POST crear detalle
router.post("/", async (req, res) => {
    const { compra_id, producto_id, cantidad, precio_unitario } = req.body;
    try {
        const [result] = await pool.query(
            "INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
            [compra_id, producto_id, cantidad, precio_unitario]
        );
        res.json({ id: result.insertId, compra_id, producto_id, cantidad });
    } catch {
        res.status(500).json({ error: "Error al crear detalle" });
    }
});

// PUT actualizar detalle
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { cantidad, precio_unitario } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE detalle_compras SET cantidad=?, precio_unitario=? WHERE id=?",
            [cantidad, precio_unitario, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Detalle no encontrado" });
        res.json({ message: "Detalle actualizado" });
    } catch {
        res.status(500).json({ error: "Error al actualizar detalle" });
    }
});

// DELETE detalle
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM detalle_compras WHERE id=?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Detalle no encontrado" });
        res.json({ message: "Detalle eliminado" });
    } catch {
        res.status(500).json({ error: "Error al eliminar detalle" });
    }
});

module.exports = router;
