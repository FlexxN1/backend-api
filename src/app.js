// src/app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Rutas
const authRoutes = require("./routes/auth");
const productosRoutes = require("./routes/productos");
const productsAuthRoutes = require("./routes/productsAuth");
const usuariosRoutes = require("./routes/usuarios");
const comprasRoutes = require("./routes/compras");
const detalleComprasRoutes = require("./routes/detalleCompras");

const app = express();

// ===== Middlewares =====
app.use(cors()); // habilitar CORS
app.use(express.json()); // parsear JSON

// ===== Rutas =====
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
