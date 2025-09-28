const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// Documentación Swagger (solo en dev/prod si quieres)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// rutas (las tuyas)
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
