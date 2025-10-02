// routes/compras.js
const express = require("express");
const pool = require("../db");
const router = express.Router();
const requireAuth = require("../middlewares/auth");

// GET todas las compras (agrupadas con productos)
router.get("/", requireAuth(), async (req, res) => {
    // ... (mantengo el mismo SQL)
    try {
        const [rows] = await pool.query(`
      SELECT 
        c.id AS compra_id,
        c.usuario_id,
        u.nombre AS usuario_nombre,
        DATE_FORMAT(c.fecha_compra, '%Y-%m-%d %H:%i:%s') AS fecha_compra,
        c.ciudad,
        c.direccion,
        c.telefono,
        c.total,
        c.estado_pago,
        dc.id AS detalle_id,
        dc.producto_id,
        p.nombre AS producto_nombre,
        p.vendedor_id,
        p.stock,
        dc.cantidad,
        dc.precio_unitario,
        dc.estado_envio
      FROM compras c
      INNER JOIN usuarios u ON c.usuario_id = u.id
      INNER JOIN detalle_compras dc ON c.id = dc.compra_id
      INNER JOIN productos p ON dc.producto_id = p.id
    `);

        // agrupar como antes...
        const compras = rows.reduce((acc, row) => {
            let compra = acc.find(c => c.compra_id === row.compra_id);
            if (!compra) {
                compra = {
                    compra_id: row.compra_id,
                    usuario_id: row.usuario_id,
                    usuario_nombre: row.usuario_nombre,
                    fecha_compra: row.fecha_compra,
                    ciudad: row.ciudad,
                    direccion: row.direccion,
                    telefono: row.telefono,
                    total: row.total,
                    estado_pago: row.estado_pago,
                    productos: []
                };
                acc.push(compra);
            }
            compra.productos.push({
                detalle_id: row.detalle_id,
                producto_id: row.producto_id,
                nombre: row.producto_nombre,
                cantidad: row.cantidad,
                precio_unitario: row.precio_unitario,
                estado_envio: row.estado_envio,
                vendedor_id: row.vendedor_id
            });
            return acc;
        }, []);

        res.json(compras);
    } catch (err) {
        console.error("❌ Error en GET /compras:", err);
        res.status(500).json({ error: "Error al obtener compras" });
    }
});

// GET compra por ID
router.get("/:id", requireAuth(), async (req, res) => {
    // idem a tu implementación previa, con requireAuth()
    // ...
});

// POST crear compra con detalles (ahora exige auth y usa req.user.id)
// POST crear compra con detalles
router.post("/", requireAuth(), async (req, res) => {
    const user = req.user;
    const { total, ciudad, direccion, telefono, metodo_pago, productos, estado_pago } = req.body;

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
        const [compraResult] = await conn.query(
            `INSERT INTO compras (usuario_id, total, ciudad, direccion, telefono, metodo_pago, estado_pago)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user.id, total, ciudad, direccion, telefono, metodo_pago, estado_pago || "pendiente"]
        );

        const compraId = compraResult.insertId;

        for (let p of productos) {
            const [[producto]] = await conn.query(
                "SELECT stock FROM productos WHERE id=? FOR UPDATE",
                [p.id]
            );

            if (!producto) throw new Error(`❌ Producto con id ${p.id} no existe`);
            if (producto.stock < p.cantidad) throw new Error(`❌ Stock insuficiente para el producto ID ${p.id}`);

            await conn.query(
                `INSERT INTO detalle_compras 
                 (compra_id, producto_id, cantidad, precio_unitario, estado_envio) 
                 VALUES (?, ?, ?, ?, ?)`,
                [compraId, p.id, p.cantidad || 1, p.precio, "Pendiente"]
            );

            await conn.query("UPDATE productos SET stock = stock - ? WHERE id=?", [p.cantidad, p.id]);
        }

        await conn.commit();

        // 🔥 Emitir evento global (todos los admins conectados lo reciben)
        req.io.emit("nuevaCompra", {
            compraId,
            usuarioId: user.id,
            productos
        });

        res.json({ message: "✅ Compra creada con éxito", compra_id: compraId });
    } catch (err) {
        await conn.rollback();
        console.error("❌ Error en compra:", err);
        res.status(400).json({ error: err.message || "Error al registrar compra" });
    } finally {
        conn.release();
    }
});


// PUT actualizar compra, DELETE, etc... (añadir requireAuth() cuando corresponda)
router.put("/:id", requireAuth(), async (req, res) => {
    // ...
});

// PUT estado-pago
router.put("/:id/estado-pago", requireAuth(), async (req, res) => {
    // ...
});

// PUT estado-envio en detalle: mantiene io.emit
// PUT estado-envio en detalle
router.put("/detalle/:id/estado-envio", requireAuth(), async (req, res) => {
    const { id } = req.params;
    const { estado_envio } = req.body;

    try {
        const [result] = await pool.query(
            "UPDATE detalle_compras SET estado_envio=? WHERE id=?",
            [estado_envio, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Detalle no encontrado" });

        // 🔥 Emitir cambio de estado (para actualizar en tiempo real en el front)
        req.io.emit("estadoEnvioActualizado", {
            detalleId: parseInt(id),
            nuevoEstado: estado_envio,
        });

        // Si este detalle pasó a entregado, verificamos si la compra entera ya está entregada
        if (estado_envio === "Entregado") {
            const [[detalle]] = await pool.query(
                "SELECT compra_id FROM detalle_compras WHERE id=?",
                [id]
            );

            if (detalle) {
                const [[pendientes]] = await pool.query(
                    "SELECT COUNT(*) AS pendientes FROM detalle_compras WHERE compra_id =? AND estado_envio != 'Entregado'",
                [detalle.compra_id]
                );

                // Si ya no hay pendientes, emitimos que la compra está cerrada
                if (pendientes.pendientes === 0) {
                    req.io.emit("compraCompletada", { compraId: detalle.compra_id });
                }
            }
        }

        res.json({ message: "✅ Estado de envío actualizado" });
    } catch (err) {
        console.error("❌ Error al actualizar estado de envío", err);
        res.status(500).json({ error: "Error al actualizar estado de envío" });
    }
});




module.exports = router;
