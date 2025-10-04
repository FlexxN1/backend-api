const express = require("express");
const pool = require("../db");
const router = express.Router();
const requireAuth = require("../middlewares/auth");

// ========================
// GET todas las compras
// ========================
router.get("/", requireAuth(), async (req, res) => {
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
                vendedor_id: row.vendedor_id,
                stock: row.stock
            });
            return acc;
        }, []);

        res.json(compras);
    } catch (err) {
        console.error("❌ Error en GET /compras:", err);
        res.status(500).json({ error: "Error al obtener compras" });
    }
});

// ========================
// POST crear compra
// ========================
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

            if (!producto) throw new Error(`Producto con id ${p.id} no existe`);
            if (producto.stock < p.cantidad) throw new Error(`Stock insuficiente para el producto ID ${p.id}`);

            await conn.query(
                `INSERT INTO detalle_compras 
                 (compra_id, producto_id, cantidad, precio_unitario, estado_envio) 
                 VALUES (?, ?, ?, ?, ?)`,
                [compraId, p.id, p.cantidad || 1, p.precio, "Pendiente"]
            );

            await conn.query("UPDATE productos SET stock = stock - ? WHERE id=?", [p.cantidad, p.id]);
        }

        await conn.commit();

        req.io.emit("nuevaCompra", { compraId, usuarioId: user.id, productos });
        res.json({ message: "✅ Compra creada con éxito", compra_id: compraId });
    } catch (err) {
        await conn.rollback();
        console.error("❌ Error en compra:", err);
        res.status(400).json({ error: err.message || "Error al registrar compra" });
    } finally {
        conn.release();
    }
});

// ========================
// PUT estado-pago (nuevo)
// ========================
router.put("/:id/estado-pago", requireAuth(), async (req, res) => {
    const { id } = req.params;
    const { estado_pago } = req.body;

    try {
        const [result] = await pool.query("UPDATE compras SET estado_pago = ? WHERE id = ?", [estado_pago, id]);

        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Compra no encontrada" });

        req.io.emit("estadoPagoActualizado", { compraId: id, estado_pago });
        res.json({ message: "✅ Estado de pago actualizado" });
    } catch (err) {
        console.error("❌ Error actualizando estado de pago:", err);
        res.status(500).json({ error: "Error al actualizar estado de pago" });
    }
});

// ========================
// PUT estado-envio detalle
// ========================
router.put("/detalle/:id/estado-envio", requireAuth(), async (req, res) => {
    const { id } = req.params;
    const { estado_envio } = req.body;

    try {
        const [result] = await pool.query(
            "UPDATE detalle_compras SET estado_envio=? WHERE id=?",
            [estado_envio, id]
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Detalle no encontrado" });

        req.io.emit("estadoEnvioActualizado", {
            detalleId: parseInt(id),
            nuevoEstado: estado_envio,
        });

        res.json({ message: "✅ Estado de envío actualizado" });
    } catch (err) {
        console.error("❌ Error al actualizar estado de envío", err);
        res.status(500).json({ error: "Error al actualizar estado de envío" });
    }
});

module.exports = router;
