// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { swaggerUi, swaggerDocs } = require("./swagger");

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = express();

// =============================
// CORS
// =============================
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://biteback7.netlify.app",
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS no permitido"));
        }
    },
    credentials: true,
}));

app.use(express.json());

// Evitar cacheo
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
});

// =============================
// Documentación Swagger
// =============================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// =============================
// Crear servidor HTTP + Socket.IO
// =============================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

// =============================
// Middleware opcional: decodificar JWT
// =============================
app.use((req, res, next) => {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
        const token = header.split(" ")[1];
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            req.user = payload;
        } catch (err) {
            req.user = null;
        }
    }
    next();
});

// 🔥 Inyectar io en req para emitir desde controladores
app.use((req, res, next) => {
    req.io = io;
    next();
});

// =============================
// Socket.IO: autenticar por token en handshake
// =============================
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        if (!token) return next();
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = payload;
        return next();
    } catch (err) {
        console.error("Socket auth error:", err.message);
        return next();
    }
});

io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado:", socket.id, "user=", socket.user?.id || "anon");

    if (socket.user && (socket.user.tipo_usuario === "Admin" || socket.user.tipo_usuario === "Administrador")) {
        socket.join(`admin-${socket.user.id}`);
    }

    socket.on("joinAdminRoom", (adminId) => {
        if (socket.user && socket.user.id === adminId) {
            socket.join(`admin-${adminId}`);
        }
    });

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

// 404
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Exportamos app, server, io
module.exports = { app, server, io };

// Levantar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
