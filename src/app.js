const express = require("express");
const cors = require("cors");
const session = require("express-session"); // 👈 sesiones
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

// =============================
// Middlewares
// =============================

// ✅ Configuración de CORS
app.use(cors({
    origin: "http://localhost:5173", // ⚠️ cámbialo a tu frontend en producción
    credentials: true, // 👈 necesario para enviar cookies de sesión
}));

app.use(express.json());

// ✅ Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret", // 👈 define en Railway
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,   // la cookie no es accesible con JS
        secure: false,    // ponlo en true si usas HTTPS en prod
        maxAge: 1000 * 60 * 60 * 24, // 1 día
    },
}));

// Evitar cacheo
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
});

// Documentación Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// =============================
// Socket.IO setup
// =============================
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // ⚠️ tu frontend
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true, // 👈 necesario con sesiones
    }
});

// 🔥 Middleware: inyectar io en req
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Evento de conexión
io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔴 Cliente desconectado:", socket.id);
    });
});

// =============================
// Rutas
// =============================
const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const productosRoutes = require("./routes/productos");
const productsAuthRoutes = require("./routes/productsAuth");
const comprasRoutes = require("./routes/compras");
const detalleComprasRoutes = require("./routes/detalleCompras");

app.get("/", (req, res) => res.send("🚀 API funcionando correctamente"));

app.use("/auth", authRoutes);
app.use("/productos", productosRoutes);
app.use("/productos-auth", productsAuthRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/compras", comprasRoutes);
app.use("/detalle-compras", detalleComprasRoutes);

// =============================
// 404
// =============================
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Exportamos io por si lo necesitas en otro módulo
module.exports = { app, server, io };

// =============================
// Levantar servidor
// =============================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
