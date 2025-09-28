// routes/products.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middlewares/auth');

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

// Crear producto (solo administradores)
router.post('/', auth(['Administrador']), async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock = 0, imagen_url } = req.body;
        if (!nombre || !precio) return res.status(400).json({ error: 'Nombre y precio requeridos' });

        const vendedor_id = req.user.id; // viene del token
        const [r] = await pool.execute(
            `INSERT INTO productos (nombre, descripcion, precio, imagen_url, stock, vendedor_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion || null, precio, imagen_url || null, stock, vendedor_id]
        );

        res.json({ id: r.insertId, message: 'Producto creado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error servidor' });
    }
});

module.exports = router