const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET compras
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM compras");
        res.json(rows);
    } catch {
        res.status(500).json({ error: "Error al obtener compras" });
    }
});

// GET compra por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM compras WHERE id=?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Compra no encontrada" });
        res.json(rows[0]);
    } catch {
        res.status(500).json({ error: "Error al obtener compra" });
    }
});

// POST crear compra
router.post("/", async (req, res) => {
    const { usuario_id, total, ciudad, direccion, telefono, estado } = req.body;
    try {
        const [result] = await pool.query(
            "INSERT INTO compras (usuario_id, total, ciudad, direccion, telefono, estado) VALUES (?, ?, ?, ?, ?, ?)",
            [usuario_id, total, ciudad, direccion, telefono, estado || "pendiente"]
        );
        res.json({ id: result.insertId, usuario_id, total });
    } catch {
        res.status(500).json({ error: "Error al crear compra" });
    }
});

// PUT actualizar compra
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { total, ciudad, direccion, telefono, estado } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE compras SET total=?, ciudad=?, direccion=?, telefono=?, estado=? WHERE id=?",
            [total, ciudad, direccion, telefono, estado, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Compra no encontrada" });
        res.json({ message: "Compra actualizada" });
    } catch {
        res.status(500).json({ error: "Error al actualizar compra" });
    }
});

// DELETE compra
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM compras WHERE id=?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Compra no encontrada" });
        res.json({ message: "Compra eliminada" });
    } catch {
        res.status(500).json({ error: "Error al eliminar compra" });
    }
});

module.exports = router;
