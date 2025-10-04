// routes/productos.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todos los productos
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT p.*, 
                    u.nombre as vendedor, 
                    COALESCE(GROUP_CONCAT(i.url SEPARATOR '||'), '') AS imagenes_producto
             FROM productos p
             LEFT JOIN usuarios u ON p.vendedor_id = u.id
             LEFT JOIN imagenes_productos i ON i.producto_id = p.id
             GROUP BY p.id
             ORDER BY p.fecha_creacion DESC`
        );

        // 👉 Convertir string separado en array
        const productos = rows.map(p => ({
            ...p,
            imagenes_producto: p.imagenes_producto
                ? p.imagenes_producto.split('||')
                : []
        }));

        res.json(productos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error servidor' });
    }
});
