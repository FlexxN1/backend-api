const express = require("express");
const pool = require("../db");
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth"); // 👈 importamos middleware
const router = express.Router();

// ✅ Cada usuario (cliente o admin) solo edita SU propio perfil
router.put("/:id", auth(), async (req, res) => {
    console.log("✅ Entró al endpoint /usuarios/:id");
    console.log("🔎 Params:", req.params);
    console.log("🔎 Body:", req.body);

    const { id } = req.params;
    let { nombre, email, password } = req.body; // 👈 quitamos tipo_usuario del body

    try {
        // 🔐 Validación: solo el dueño puede editar su perfil
        if (req.user.id != id) {
            return res.status(403).json({ error: "No puedes editar otro usuario" });
        }

        if (!password || password === "undefined" || password.trim() === "") {
            const [result] = await pool.query(
                "UPDATE usuarios SET nombre=?, email=? WHERE id=?",
                [nombre, email, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            const [rows] = await pool.query(
                "SELECT id, nombre, email, tipo_usuario FROM usuarios WHERE id=?",
                [id]
            );

            return res.json({
                message: "Usuario actualizado (sin cambiar contraseña)",
                user: rows[0],
            });
        }

        // 🔐 Encriptar si se cambia contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "UPDATE usuarios SET nombre=?, email=?, password=? WHERE id=?",
            [nombre, email, hashedPassword, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

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
