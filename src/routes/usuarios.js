const express = require("express");
const pool = require("../db");
const bcrypt = require("bcryptjs");
const router = express.Router();

router.put("/:id", async (req, res) => {
    console.log("✅ Entró al endpoint /usuarios/:id");
    console.log("🔎 Params:", req.params);
    console.log("🔎 Body:", req.body);

    const { id } = req.params;
    let { nombre, email, password, tipo_usuario } = req.body;

    try {
        if (!password || password === "undefined" || password.trim() === "") {
            // 👆 evitamos que "undefined" en string pase la validación
            const [result] = await pool.query(
                "UPDATE usuarios SET nombre=?, email=?, tipo_usuario=? WHERE id=?",
                [nombre, email, tipo_usuario, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            // 🔎 Traemos el usuario actualizado
            const [rows] = await pool.query(
                "SELECT id, nombre, email, tipo_usuario FROM usuarios WHERE id=?",
                [id]
            );

            return res.json({
                message: "Usuario actualizado (sin cambiar contraseña)",
                user: rows[0],
            });
        }

        // 🔐 Siempre encriptamos si password existe
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "UPDATE usuarios SET nombre=?, email=?, tipo_usuario=?, password=? WHERE id=?",
            [nombre, email, tipo_usuario, hashedPassword, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // 🔎 Traemos el usuario actualizado
        const [rows] = await pool.query(
            "SELECT id, nombre, email, tipo_usuario FROM usuarios WHERE id=?",
            [id]
        );

        res.json({
            message: "Usuario actualizado con nueva contraseña",
            user: rows[0],
        });
    } catch (err) {
        console.error("❌ Error en PUT /usuarios/:id:", err);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

module.exports = router;
