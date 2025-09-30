// routes/detalleCompra.js
const express = require("express");
const pool = require("../db");
const router = express.Router();

// ===========================
// Listar detalles de compras
// ===========================
router.get("/", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        let query = "SELECT * FROM detalle_compras";
        let params = [];

        // 👤 Usuario normal → solo sus compras
        if (req.session.user.tipo === "Usuario") {
            query += " WHERE usuario_id = ?";
            params.push(req.session.user.id);
        }

        // 🛠️ Admin → ve todos
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("❌ Error en GET /detalle-compras:", err);
        res.status(500).json({ error: "Error al obtener detalles" });
    }
});

// ===========================
// Obtener detalle por ID
// ===========================
router.get("/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const { id } = req.params;

        const [rows] = await pool.query("SELECT * FROM detalle_compras WHERE id=?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Detalle no encontrado" });
        }

        // Validación: usuario solo ve sus propios detalles
        if (
            req.session.user.tipo === "Usuario" &&
            rows[0].usuario_id !== req.session.user.id
        ) {
            return res.status(403).json({ error: "No autorizado" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("❌ Error en GET /detalle-compras/:id:", err);
        res.status(500).json({ error: "Error al obtener detalle" });
    }
});

// ===========================
// Crear detalle
// ===========================
router.post("/", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const { compra_id, producto_id, cantidad, precio_unitario } = req.body;

        const [result] = await pool.query(
            "INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario, usuario_id) VALUES (?, ?, ?, ?, ?)",
            [compra_id, producto_id, cantidad, precio_unitario, req.session.user.id]
        );

        res.json({
            id: result.insertId,
            compra_id,
            producto_id,
            cantidad,
            usuario_id: req.session.user.id,
        });
    } catch (err) {
        console.error("❌ Error en POST /detalle-compras:", err);
        res.status(500).json({ error: "Error al crear detalle" });
    }
});

// ===========================
// Actualizar detalle
// ===========================
router.put("/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const { id } = req.params;
        const { cantidad, precio_unitario } = req.body;

        // Verificar dueño antes de actualizar
        const [rows] = await pool.query("SELECT * FROM detalle_compras WHERE id=?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Detalle no encontrado" });
        }

        if (
            req.session.user.tipo === "Usuario" &&
            rows[0].usuario_id !== req.session.user.id
        ) {
            return res.status(403).json({ error: "No autorizado" });
        }

        await pool.query(
            "UPDATE detalle_compras SET cantidad=?, precio_unitario=? WHERE id=?",
            [cantidad, precio_unitario, id]
        );

        res.json({ message: "Detalle actualizado" });
    } catch (err) {
        console.error("❌ Error en PUT /detalle-compras/:id:", err);
        res.status(500).json({ error: "Error al actualizar detalle" });
    }
});

// ===========================
// Eliminar detalle
// ===========================
router.delete("/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const { id } = req.params;

        // Verificar dueño antes de eliminar
        const [rows] = await pool.query("SELECT * FROM detalle_compras WHERE id=?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Detalle no encontrado" });
        }

        if (
            req.session.user.tipo === "Usuario" &&
            rows[0].usuario_id !== req.session.user.id
        ) {
            return res.status(403).json({ error: "No autorizado" });
        }

        await pool.query("DELETE FROM detalle_compras WHERE id=?", [id]);

        res.json({ message: "Detalle eliminado" });
    } catch (err) {
        console.error("❌ Error en DELETE /detalle-compras/:id:", err);
        res.status(500).json({ error: "Error al eliminar detalle" });
    }
});

module.exports = router;
