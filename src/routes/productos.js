// routes/productsAuth.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");

// =====================
// Listar productos del admin logueado
// =====================
router.get("/", auth(["Administrador"]), async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM productos WHERE vendedor_id = ? ORDER BY fecha_creacion DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error("❌ Error en GET /productos-auth:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// =====================
// Crear producto
// =====================
router.post("/", auth(["Administrador"]), async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock = 0, imagen_url } = req.body;
        if (!nombre || !precio)
            return res.status(400).json({ error: "Nombre y precio requeridos" });

        const vendedor_id = req.user.id; // del token
        const [r] = await pool.execute(
            `INSERT INTO productos (nombre, descripcion, precio, imagen_url, stock, vendedor_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion || null, precio, imagen_url || null, stock, vendedor_id]
        );

        res.json({ id: r.insertId, message: "Producto creado" });
    } catch (err) {
        console.error("❌ Error en POST /productos-auth:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// =====================
// Eliminar producto
// =====================
router.delete("/:id", auth(["Administrador"]), async (req, res) => {
    const { id } = req.params;
    try {
        // verificar si el producto es del admin logueado
        const [rows] = await pool.execute(
            `SELECT * FROM productos WHERE id = ? AND vendedor_id = ?`,
            [id, req.user.id]
        );

        if (!rows.length) {
            return res
                .status(404)
                .json({ error: "Producto no encontrado o no autorizado" });
        }

        await pool.execute("DELETE FROM productos WHERE id = ?", [id]);

        res.json({ message: "Producto eliminado correctamente" });
    } catch (err) {
        console.error("❌ Error en DELETE /productos-auth/:id", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

module.exports = router;
