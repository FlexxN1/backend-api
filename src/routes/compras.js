const express = require("express");
const pool = require("../db");
const router = express.Router();

// =============================
// GET todas las compras
// =============================
// GET compras con detalle de productos y usuarios
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                c.id AS compra_id,
                c.usuario_id,
                u.nombre AS usuario_nombre,
                c.ciudad,
                c.direccion,
                c.telefono,
                c.total,
                c.estado_pago,
                dc.id AS detalle_id,
                dc.producto_id,
                p.nombre AS producto_nombre,
                p.vendedor_id,
                dc.cantidad,
                dc.precio_unitario,
                dc.estado_envio
            FROM compras c
            INNER JOIN usuarios u ON c.usuario_id = u.id
            INNER JOIN detalle_compras dc ON c.id = dc.compra_id
            INNER JOIN productos p ON dc.producto_id = p.id
        `);

        res.json(rows);
    } catch (err) {
        console.error("❌ Error en GET /compras:", err);
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
// POST crear compra con detalles
router.post("/", async (req, res) => {
    const { usuario_id, total, ciudad, direccion, telefono, metodo_pago, productos } = req.body;

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
        // Insertar en compras
        const [compraResult] = await conn.query(
            "INSERT INTO compras (usuario_id, total, ciudad, direccion, telefono, metodo_pago, estado_pago) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [usuario_id, total, ciudad, direccion, telefono, metodo_pago, "pendiente"]
        );

        const compraId = compraResult.insertId;

        // Insertar productos en detalle_compras
        for (let p of productos) {
            await conn.query(
                "INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, estado_envio) VALUES (?, ?, ?, ?, ?)",
                [compraId, p.id, p.cantidad, p.precio, "Pendiente"]
            );
        }

        await conn.commit();

        res.json({ message: "✅ Compra creada con éxito", compra_id: compraId });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: "Error al registrar compra" });
    } finally {
        conn.release();
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
