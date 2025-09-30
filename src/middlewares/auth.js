const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (allowedRoles = []) {
    return (req, res, next) => {
        try {
            const header = req.headers.authorization;
            if (!header) {
                return res.status(401).json({ error: "Token requerido" });
            }

            const token = header.split(" ")[1];
            const payload = jwt.verify(token, process.env.JWT_SECRET);

            // Normalizamos el payload para evitar undefined
            req.user = {
                id: payload.id || payload.userId || null, // 👈 asegura que siempre exista
                nombre: payload.nombre,
                email: payload.email,
                tipo_usuario: payload.tipo_usuario,
            };

            if (!req.user.id) {
                return res.status(400).json({ error: "Token sin ID de usuario" });
            }

            // Validar roles si aplica
            if (
                allowedRoles.length > 0 &&
                !allowedRoles.includes(req.user.tipo_usuario)
            ) {
                return res.status(403).json({ error: "Acceso denegado" });
            }

            next();
        } catch (err) {
            console.error("❌ Error auth middleware:", err.message);
            return res.status(401).json({ error: "Token inválido" });
        }
    };
};
