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

            return res.json({ message: "Usuario actualizado (sin cambiar contraseña)" });
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

        res.json({ message: "Usuario actualizado con nueva contraseña" });
    } catch (err) {
        console.error("❌ Error en PUT /usuarios/:id:", err);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
});

module.exports = router;
