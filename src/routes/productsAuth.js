const express = require("express");
const router = express.Router();
const pool = require("../db");

// ===========================
// Listar productos del usuario logueado con sus imágenes
// ===========================
router.get("/", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        // obtenemos productos
        const [productos] = await pool.execute(
            `SELECT p.*, u.nombre as vendedor 
             FROM productos p
             LEFT JOIN usuarios u ON p.vendedor_id = u.id
             WHERE p.vendedor_id = ?
             ORDER BY p.fecha_creacion DESC`,
            [req.user.id]
        );

        if (productos.length === 0) return res.json([]);

        // obtenemos imágenes asociadas
        const ids = productos.map(p => p.id);
        const [imagenes] = await pool.query(
            `SELECT * FROM imagenes_producto WHERE producto_id IN (?)`,
            [ids]
        );

        // asociamos imágenes a cada producto
        const productosConImagenes = productos.map(p => ({
            ...p,
            imagenes: imagenes
                .filter(img => img.producto_id === p.id)
                .map(img => img.url)
        }));

        res.json(productosConImagenes);
    } catch (err) {
        console.error("❌ Error en GET /productos-auth:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

// ===========================
// Crear producto con imágenes
// ===========================
router.post("/", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        if (!req.user) {
            conn.release();
            return res.status(401).json({ error: "No autenticado" });
        }

        const { nombre, descripcion, precio, stock, imagenes } = req.body;

        if (!nombre || !precio) {
            conn.release();
            return res.status(400).json({ error: "Nombre y precio requeridos" });
        }
        if (stock == null || isNaN(stock) || stock <= 0) {
            conn.release();
            return res.status(400).json({ error: "El stock inicial es obligatorio y debe ser mayor que 0" });
        }
        if (!Array.isArray(imagenes) || imagenes.length === 0) {
            conn.release();
            return res.status(400).json({ error: "Debes subir al menos una imagen" });
        }

        await conn.beginTransaction();

        // insertamos producto
        const [r] = await conn.execute(
            `INSERT INTO productos (nombre, descripcion, precio, stock, vendedor_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [nombre, descripcion || null, precio, stock, req.user.id]
        );

        const nuevoId = r.insertId;

        // insertamos imágenes
        for (let url of imagenes) {
            await conn.execute(
                "INSERT INTO imagenes_producto (producto_id, url) VALUES (?, ?)",
                [nuevoId, url]
            );
        }

        // recuperamos producto recién creado
        const [rows] = await conn.execute(
            `SELECT p.*, u.nombre as vendedor 
             FROM productos p
             LEFT JOIN usuarios u ON p.vendedor_id = u.id
             WHERE p.id = ?`,
            [nuevoId]
        );

        // añadimos imágenes
        const [imgs] = await conn.execute(
            "SELECT url FROM imagenes_producto WHERE producto_id = ?",
            [nuevoId]
        );

        await conn.commit();
        res.json({ ...rows[0], imagenes: imgs.map(i => i.url) });
    } catch (err) {
        await conn.rollback();
        console.error("❌ Error en POST /productos-auth:", err);
        res.status(500).json({ error: "Error servidor" });
    } finally {
        conn.release();
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

        // verificar que el producto sea del usuario logueado
        const [rows] = await pool.execute(
            "SELECT * FROM productos WHERE id = ? AND vendedor_id = ?",
            [id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado o no autorizado" });
        }

        // gracias a ON DELETE CASCADE en imagenes_producto, no hace falta borrar manualmente
        await pool.execute("DELETE FROM productos WHERE id = ?", [id]);

        res.json({ id, message: "Producto eliminado correctamente" });
    } catch (err) {
        console.error("❌ Error en DELETE /productos-auth/:id:", err);
        res.status(500).json({ error: "Error servidor" });
    }
});

module.exports = router;
