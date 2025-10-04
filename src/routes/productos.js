// routes/productos.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todos los productos
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
      SELECT p.*,
             u.nombre as vendedor,
             COALESCE(JSON_ARRAYAGG(i.url), JSON_ARRAY()) AS imagenes_producto
      FROM productos p
      LEFT JOIN usuarios u ON p.vendedor_id = u.id
      LEFT JOIN imagenes_producto i ON i.producto_id = p.id
      GROUP BY p.id
      ORDER BY p.fecha_creacion DESC
    `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error servidor' });
    }
});

// Últimos 5 productos (solo la primera imagen)
router.get('/ultimos', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT p.id, p.nombre, p.precio, 
                    (SELECT ip.url 
                     FROM imagenes_producto ip 
                     WHERE ip.producto_id = p.id 
                     LIMIT 1) as imagen
             FROM productos p
             ORDER BY p.fecha_creacion DESC
             LIMIT 5`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al traer últimos productos' });
    }
});




module.exports = router;
