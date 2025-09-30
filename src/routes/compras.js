const express = require("express");
const pool = require("../db");
const { io } = require("../app"); // 👈 importar io para emitir eventos
const router = express.Router();
const auth = require("../middlewares/auth"); // 👈 usa tu middleware real

// =============================
// GET todas las compras (agrupadas con productos)
// =============================
router.get("/", async (req, res) => {
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
                dc.cantidad,
                dc.precio_unitario,
                dc.estado_envio
            FROM compras c
            INNER JOIN usuarios u ON c.usuario_id = u.id
            INNER JOIN detalle_compras dc ON c.id = dc.compra_id
            INNER JOIN productos p ON dc.producto_id = p.id
        `);

        // 🔑 Agrupar compras en objetos con productos[]
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

// =============================
// GET compra por ID (con productos)
// =============================
router.get("/:id", async (req, res) => {
    const { id } = req.params;
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
                dc.cantidad,
                dc.precio_unitario,
                dc.estado_envio
            FROM compras c
            INNER JOIN usuarios u ON c.usuario_id = u.id
            INNER JOIN detalle_compras dc ON c.id = dc.compra_id
            INNER JOIN productos p ON dc.producto_id = p.id
            WHERE c.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Compra no encontrada" });
        }

        const compra = {
            compra_id: rows[0].compra_id,
            usuario_id: rows[0].usuario_id,
            usuario_nombre: rows[0].usuario_nombre,
            fecha_compra: rows[0].fecha_compra,
            ciudad: rows[0].ciudad,
            direccion: rows[0].direccion,
            telefono: rows[0].telefono,
            total: rows[0].total,
            estado_pago: rows[0].estado_pago,
            productos: rows.map(r => ({
                detalle_id: r.detalle_id,
                producto_id: r.producto_id,
                nombre: r.producto_nombre,
                cantidad: r.cantidad,
                precio_unitario: r.precio_unitario,
                estado_envio: r.estado_envio,
                vendedor_id: r.vendedor_id
            }))
        };

        res.json(compra);
    } catch (err) {
        console.error("❌ Error en GET /compras/:id:", err);
        res.status(500).json({ error: "Error al obtener compra" });
    }
});

// =============================
// POST crear compra con detalles
// =============================
router.post("/",async (req, res) => {
    const { usuario_id, total, ciudad, direccion, telefono, metodo_pago, productos, estado_pago } = req.body;

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
        const [compraResult] = await conn.query(
            `INSERT INTO compras (usuario_id, total, ciudad, direccion, telefono, metodo_pago, estado_pago)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, total, ciudad, direccion, telefono, metodo_pago, estado_pago || "pendiente"]
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

            await conn.query(
                "UPDATE productos SET stock = stock - ? WHERE id=?",
                [p.cantidad, p.id]
            );
        }

        await conn.commit();
        res.json({ message: "✅ Compra creada con éxito", compra_id: compraId });

    } catch (err) {
        await conn.rollback();
        console.error("❌ Error en compra:", err);
        res.status(400).json({ error: err.message || "Error al registrar compra" });
    } finally {
        conn.release();
    }
});

// =============================
// PUT actualizar compra
// =============================
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { total, ciudad, direccion, telefono, metodo_pago, estado_pago } = req.body;
    try {
        const [result] = await pool.query(
            `UPDATE compras 
             SET total=?, ciudad=?, direccion=?, telefono=?, metodo_pago=?, estado_pago=? 
             WHERE id=?`,
            [total, ciudad, direccion, telefono, metodo_pago, estado_pago, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Compra no encontrada" });
        res.json({ message: "Compra actualizada" });
    } catch {
        res.status(500).json({ error: "Error al actualizar compra" });
    }
});

// =============================
// DELETE eliminar compra
// =============================
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM compras WHERE id=?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Compra no encontrada" });
        res.json({ message: "Compra eliminada" });
    } catch {
        res.status(500).json({ error: "Error al eliminar compra" });
    }
});

// =============================
// PUT actualizar estado de pago
// =============================
router.put("/:id/estado-pago", async (req, res) => {
    const { id } = req.params;
    const { estado_pago } = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE compras SET estado_pago=? WHERE id=?",
            [estado_pago, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Compra no encontrada" });
        res.json({ message: "✅ Estado de pago actualizado" });
    } catch {
        res.status(500).json({ error: "Error al actualizar estado de pago" });
    }
});

// =============================
// PUT actualizar estado de envío
// =============================
router.put("/detalle/:id/estado-envio", auth, async (req, res) => {
    const { id } = req.params;
    const { estado_envio } = req.body;

    console.log("📦 Body recibido:", req.body); // <-- LOG
    console.log("🆔 ID recibido:", id);
    try {
        const [result] = await pool.query(
            "UPDATE detalle_compras SET estado_envio=? WHERE id=?",
            [estado_envio, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Detalle no encontrado" });
        }
        io.emit("estadoEnvioActualizado", {
            detalleId: parseInt(id),
            nuevoEstado: estado_envio,
        });

        res.json({ message: "✅ Estado de envío actualizado" });
    } catch (err) {
        console.error("❌ Error al actualizar estado de envío:", err);
        res.status(500).json({ error: "Error al actualizar estado de envío" });
    }
});

module.exports = router;
