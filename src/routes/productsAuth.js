// routes/productsAuth.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// ===========================
// Listar productos del admin
// ===========================
router.get("/", async (req, res) => {
    try {
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
// Crear producto (solo admin)
// ===========================
router.post("/", async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock = 0, imagen_url } = req.body;

        if (!nombre || !precio) {
            return res.status(400).json({ error: "Nombre y precio requeridos" });
        }

        const vendedor_id = req.user.id; // 👈 viene del token
        const [r] = await pool.execute(
            `INSERT INTO productos (nombre, descripcion, precio, imagen_url, stock, vendedor_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion || null, precio, imagen_url || null, stock, vendedor_id]
        );

        const nuevoId = r.insertId;

        // 🔥 Recuperamos el producto recién creado con el vendedor
        const [rows] = await pool.execute(
            `SELECT p.*, u.nombre as vendedor 
             FROM productos p
             LEFT JOIN usuarios u ON p.vendedor_id = u.id
             WHERE p.id = ?`,
            [nuevoId]
        );

        res.json(rows[0]); // enviamos el producto completo
    } catch (err) {
        console.error("❌ Error en POST /productos-auth:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// ===========================
// Eliminar producto (solo admin dueño)
// ===========================
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar que el producto pertenezca al admin
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
