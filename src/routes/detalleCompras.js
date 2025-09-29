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
        // 1. Insertar el detalle de la compra
        const [result] = await pool.query(
            "INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
            [compra_id, producto_id, cantidad, precio_unitario]
        );

        // 2. Descontar el stock en la tabla productos
        const [updateResult] = await pool.query(
            "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?",
            [cantidad, producto_id, cantidad]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({ error: "No hay stock suficiente para este producto" });
        }

        // 3. Obtener el nuevo stock
        const [producto] = await pool.query("SELECT id, stock FROM productos WHERE id = ?", [producto_id]);

        // 4. Emitir evento por WebSocket
        const { io } = require("../app"); // 👈 importamos io
        io.emit("stockActualizado", {
            productoId: producto[0].id,
            nuevoStock: producto[0].stock
        });

        // 5. Respuesta
        res.json({
            id: result.insertId,
            compra_id,
            producto_id,
            cantidad,
            nuevoStock: producto[0].stock
        });
    } catch (err) {
        console.error(err);
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
