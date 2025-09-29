// middlewares/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (allowedRoles = []) {
    return (req, res, next) => {
        try {
            const header = req.headers.authorization;
            if (!header) {
                return res.status(401).json({ error: "Token no provisto" });
            }

            const token = header.split(" ")[1];
            const payload = jwt.verify(token, process.env.JWT_SECRET);

            req.user = payload; // { id, nombre, email, tipo_usuario }

            // Validar roles (si aplica)
            if (
                allowedRoles.length > 0 &&
                !allowedRoles.includes(payload.tipo_usuario)
            ) {
                return res.status(403).json({ error: "Acceso denegado" });
            }

            next();
        } catch (err) {
            console.error("❌ Error auth middleware:", err.message);

            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ error: "jwt expired" });
            }

            return res.status(401).json({ error: "Token inválido" });
        }
    };
};
