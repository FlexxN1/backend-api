const express = require("express");
const cors = require("cors");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

// =============================
// Middlewares
// =============================
app.use(express.json()); // primero JSON parser

// ✅ Configuración única de CORS
const allowedOrigins = [
    "http://localhost:3000",
    "https://tu-frontend.railway.app"
];

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

// ✅ Opcional: manejar preflight explícitamente
app.options("*", (req, res) => {
    res.header("Access-Control-Allow-Origin", allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(204);
});

// Cache headers
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
});

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// =============================
// Socket.IO setup
// =============================
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

// Middleware para inyectar io
app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado:", socket.id);
    socket.on("disconnect", () => {
        console.log("🔴 Cliente desconectado:", socket.id);
    });
});

// =============================
// Rutas
// =============================
app.get("/", (req, res) => res.send("🚀 API funcionando correctamente"));

app.use("/auth", require("./routes/auth"));
app.use("/productos", require("./routes/productos"));
app.use("/productos-auth", require("./routes/productsAuth"));
app.use("/usuarios", require("./routes/usuarios"));
app.use("/compras", require("./routes/compras"));
app.use("/detalle-compras", require("./routes/detalleCompras"));

// 404
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// =============================
// Levantar servidor
// =============================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
