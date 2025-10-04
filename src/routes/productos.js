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
                    COALESCE(JSON_ARRAYAGG(i.url), JSON_ARRAY()) AS imagenes_producto
             FROM productos p
             LEFT JOIN usuarios u ON p.vendedor_id = u.id
             LEFT JOIN imagenes_productos i ON i.producto_id = p.id
             GROUP BY p.id
             ORDER BY p.fecha_creacion DESC`
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error servidor' });
    }
});


module.exports = router;
