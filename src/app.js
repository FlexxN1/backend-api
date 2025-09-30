const express = require("express");
const cors = require("cors");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

// =============================
// =============================
// Middlewares
// =============================
const allowedOrigins = [
    "http://localhost:3000",       // 👉 frontend local
    "https://biteback7.netlify.app" // 👉 frontend en producción
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (como Postman, curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// 👇 extra: responder siempre a preflight
app.options("*", (req, res) => {
    res.sendStatus(204);
});


app.use(express.json());

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
        origin: "*", // ⚠️ en producción usa tu frontend (ej: "http://localhost:5173")
        methods: ["GET", "POST", "PUT", "DELETE"]
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
