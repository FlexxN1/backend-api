// routes/productsAuth.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// ===========================
// Listar productos del usuario logueado
// ===========================
router.get("/", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const [rows] = await pool.execute(
            `SELECT p.*, u.nombre as vendedor 
             FROM productos p
             LEFT JOIN usuarios u ON p.vendedor_id = u.id
             WHERE p.vendedor_id = ?
             ORDER BY p.fecha_creacion DESC`,
            [req.user.id]
        );

        res.json(rows);
    } catch (err) {
        console.error("❌ Error en GET /productos-auth:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// ===========================
// Crear producto (solo si está logueado)
// ===========================
router.post("/", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const { nombre, descripcion, precio, stock, imagen_url } = req.body;

        // Validaciones
        if (!nombre || !precio) {
            return res.status(400).json({ error: "Nombre y precio requeridos" });
        }

        // Stock obligatorio y mayor a 0
        if (stock == null || isNaN(stock) || stock <= 0) {
            return res.status(400).json({ error: "El stock inicial es obligatorio y debe ser mayor que 0" });
        }

        const vendedor_id = req.user.id;

        const [r] = await pool.execute(
            `INSERT INTO productos (nombre, descripcion, precio, imagen_url, stock, vendedor_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion || null, precio, imagen_url || null, stock, vendedor_id]
        );

        const nuevoId = r.insertId;

        // 🔥 Recuperamos el producto recién creado
        const [rows] = await pool.execute(
            `SELECT p.*, u.nombre as vendedor 
             FROM productos p
             LEFT JOIN usuarios u ON p.vendedor_id = u.id
             WHERE p.id = ?`,
            [nuevoId]
        );

        res.json(rows[0]);
    } catch (err) {
        console.error("❌ Error en POST /productos-auth:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// ===========================
// Eliminar producto (solo si es dueño)
// ===========================
router.delete("/:id", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const { id } = req.params;

        // Verificar que el producto sea del usuario logueado
        const [rows] = await pool.execute(
            "SELECT * FROM productos WHERE id = ? AND vendedor_id = ?",
            [id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado o no autorizado" });
        }

        await pool.execute("DELETE FROM productos WHERE id = ?", [id]);

        res.json({ id, message: "Producto eliminado correctamente" });
    } catch (err) {
        console.error("❌ Error en DELETE /productos-auth/:id:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

module.exports = router;
