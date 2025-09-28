const express = require("express");
const cors = require("cors");

const usuariosRoutes = require("./routes/usuarios");
const productosRoutes = require("./routes/productos");
const comprasRoutes = require("./routes/compras");
const detalleRoutes = require("./routes/detalleCompras");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.get("/", (req, res) => {
    res.send("🚀 API BiteBack funcionando");
});

app.use("/usuarios", usuariosRoutes);
app.use("/productos", productosRoutes);
app.use("/compras", comprasRoutes);
app.use("/detalle-compras", detalleRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ API corriendo en puerto ${PORT}`);
});
