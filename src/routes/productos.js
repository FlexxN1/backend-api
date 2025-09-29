// routes/productos.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todos los productos
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT p.*, u.nombre as vendedor 
             FROM productos p 
             LEFT JOIN usuarios u ON p.vendedor_id = u.id 
             ORDER BY p.fecha_creacion DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error servidor' });
    }
});

module.exports = router;
