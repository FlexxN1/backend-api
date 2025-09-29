const express = require("express");
const pool = require("../db");
const router = express.Router();

// =============================
// GET todas las compras
// =============================
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM compras");
        res.json(rows);
    } catch {
        res.status(500).json({ error: "Error al obtener compras" });
    }
});

// =============================
// GET compra por ID
// =============================
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

// =============================
// POST crear compra
// =============================
router.post("/", async (req, res) => {
    const { usuario_id, total, ciudad, direccion, telefono, metodo_pago } = req.body;
    try {
        const [result] = await pool.query(
            `INSERT INTO compras (usuario_id, total, ciudad, direccion, telefono, metodo_pago, estado_pago) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, total, ciudad, direccion, telefono, metodo_pago || "tarjeta", "pendiente"]
        );

        res.json({
            id: result.insertId,
            usuario_id,
            total,
            metodo_pago: metodo_pago || "tarjeta",
            estado_pago: "pendiente"
        });
    } catch (err) {
        console.error("❌ Error creando compra:", err);
        res.status(500).json({ error: "Error al crear compra" });
    }
});

// =============================
// PUT actualizar compra
// =============================
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { total, ciudad, direccion, telefono, metodo_pago, estado_pago } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE compras 
             SET total=?, ciudad=?, direccion=?, telefono=?, metodo_pago=?, estado_pago=? 
             WHERE id=?`,
            [total, ciudad, direccion, telefono, metodo_pago, estado_pago, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Compra no encontrada" });
        res.json({ message: "Compra actualizada" });
    } catch {
        res.status(500).json({ error: "Error al actualizar compra" });
    }
});

// =============================
// DELETE eliminar compra
// =============================
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

// =============================
// PUT actualizar estado de pago
// =============================
router.put("/:id/estado-pago", async (req, res) => {
    const { id } = req.params;
    const { estado_pago } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE compras SET estado_pago=? WHERE id=?",
            [estado_pago, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Compra no encontrada" });
        res.json({ message: "✅ Estado de pago actualizado" });
    } catch {
        res.status(500).json({ error: "Error al actualizar estado de pago" });
    }
});

// =============================
// PUT actualizar estado de envío
// =============================
router.put("/detalle/:id/estado-envio", async (req, res) => {
    const { id } = req.params; // id del detalle_compras
    const { estado_envio } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE detalle_compras SET estado_envio=? WHERE id=?",
            [estado_envio, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Detalle no encontrado" });
        res.json({ message: "✅ Estado de envío actualizado" });
    } catch {
        res.status(500).json({ error: "Error al actualizar estado de envío" });
    }
});

module.exports = router;
