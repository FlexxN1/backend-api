// src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// ===== Rutas =====
const authRoutes = require(path.join(__dirname, "routes", "auth"));
const productosRoutes = require(path.join(__dirname, "routes", "productos"));
const productsAuthRoutes = require(path.join(__dirname, "routes", "productsAuth"));
const usuariosRoutes = require(path.join(__dirname, "routes", "usuarios"));
const comprasRoutes = require(path.join(__dirname, "routes", "compras"));
const detalleComprasRoutes = require(path.join(__dirname, "routes", "detalleCompras"));

// ===== Middlewares =====
app.use(cors());
app.use(express.json());

// ===== Rutas principales =====
app.get("/", (req, res) => {
    res.send("🚀 API funcionando correctamente");
});

app.use("/auth", authRoutes);
app.use("/productos", productosRoutes);
app.use("/productos-auth", productsAuthRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/compras", comprasRoutes);
app.use("/detalle-compras", detalleComprasRoutes);

// ===== Manejo de errores 404 =====
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// ===== Iniciar servidor =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
