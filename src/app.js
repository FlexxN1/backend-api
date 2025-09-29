const express = require("express");
const cors = require("cors");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// Documentación Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// rutas
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const productosRoutes = require('./routes/productos');
const productsAuthRoutes = require('./routes/productsAuth');
const comprasRoutes = require('./routes/compras');
const detalleComprasRoutes = require('./routes/detalleCompras');

app.get("/", (req, res) => res.send("🚀 API funcionando correctamente"));

app.use("/auth", authRoutes);
app.use("/productos", productosRoutes);
app.use("/productos-auth", productsAuthRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/compras", comprasRoutes);
app.use("/detalle-compras", detalleComprasRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// =============================
// Socket.IO setup
// =============================
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // ⚠️ en producción pon aquí tu frontend (ej: "http://localhost:5173")
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Evento de conexión
io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔴 Cliente desconectado:", socket.id);
    });
});

// Exportamos io para usarlo en rutas como compras.js
module.exports = { app, server, io };

// =============================
// Levantar servidor
// =============================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
