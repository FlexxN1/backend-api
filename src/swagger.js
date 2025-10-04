// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "BiteBack API",
            version: "1.0.0",
            description: "Documentación de la API para la tienda BiteBack",
        },
        servers: [
            {
                url: "http://localhost:4000/api", // Cambia a Railway/Netlify en producción
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                Usuario: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        nombre: { type: "string", example: "Juan Pérez" },
                        email: { type: "string", example: "juan@example.com" },
                        password: { type: "string", example: "hashedpassword123" },
                        rol: { type: "string", example: "cliente" },
                    },
                },
                Producto: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 10 },
                        nombre: { type: "string", example: "Camiseta BiteBack" },
                        descripcion: { type: "string", example: "Camiseta de algodón" },
                        precio: { type: "number", example: 59.99 },
                        stock: { type: "integer", example: 20 },
                    },
                },
                Compra: {
                    type: "object",
                    properties: {
                        compra_id: { type: "integer", example: 101 },
                        usuario_id: { type: "integer", example: 1 },
                        total: { type: "number", example: 200000 },
                        ciudad: { type: "string", example: "Cali" },
                        direccion: { type: "string", example: "Calle 123 #45-67" },
                        telefono: { type: "string", example: "3001234567" },
                        estado_pago: { type: "string", example: "pendiente" },
                        estado_envio: { type: "string", example: "Pendiente" },
                        productos: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "integer", example: 10 },
                                    cantidad: { type: "integer", example: 2 },
                                    precio: { type: "number", example: 59.99 },
                                },
                            },
                        },
                    },
                },
                DetalleCompra: {
                    type: "object",
                    properties: {
                        detalle_id: { type: "integer", example: 1 },
                        compra_id: { type: "integer", example: 101 },
                        producto_id: { type: "integer", example: 10 },
                        cantidad: { type: "integer", example: 2 },
                        precio: { type: "number", example: 59.99 },
                    },
                },
                AuthLogin: {
                    type: "object",
                    properties: {
                        email: { type: "string", example: "juan@example.com" },
                        password: { type: "string", example: "123456" },
                    },
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        token: { type: "string", example: "eyJhbGciOi..." },
                    },
                },
            },
        },
    },
    apis: [],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Definición de rutas (Paths)
swaggerOptions.definition.paths = {
    // ================= AUTH =================
    "/auth/register": {
        post: {
            tags: ["Auth"],
            summary: "Registrar nuevo usuario",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Usuario" },
                    },
                },
            },
            responses: {
                201: { description: "Usuario registrado" },
                400: { description: "Error en validación" },
            },
        },
    },
    "/auth/login": {
        post: {
            tags: ["Auth"],
            summary: "Login de usuario",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/AuthLogin" },
                    },
                },
            },
            responses: {
                200: {
                    description: "Login exitoso",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AuthResponse" },
                        },
                    },
                },
                401: { description: "Credenciales inválidas" },
            },
        },
    },

    // ================= USUARIOS =================
    "/usuarios": {
        get: {
            tags: ["Usuarios"],
            summary: "Obtener todos los usuarios",
            security: [{ bearerAuth: [] }],
            responses: {
                200: { description: "Lista de usuarios" },
            },
        },
        post: {
            tags: ["Usuarios"],
            summary: "Crear un nuevo usuario",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Usuario" },
                    },
                },
            },
            responses: {
                201: { description: "Usuario creado" },
            },
        },
    },
    "/usuarios/{id}": {
        get: {
            tags: ["Usuarios"],
            summary: "Obtener un usuario por ID",
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Usuario encontrado" } },
        },
        put: {
            tags: ["Usuarios"],
            summary: "Actualizar un usuario",
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Usuario" },
                    },
                },
            },
            responses: { 200: { description: "Usuario actualizado" } },
        },
        delete: {
            tags: ["Usuarios"],
            summary: "Eliminar un usuario",
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            responses: { 204: { description: "Usuario eliminado" } },
        },
    },

    // ================= PRODUCTOS =================
    "/productos": {
        get: {
            tags: ["Productos"],
            summary: "Obtener todos los productos",
            responses: { 200: { description: "Lista de productos" } },
        },
        post: {
            tags: ["Productos"],
            summary: "Crear un nuevo producto",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Producto" },
                    },
                },
            },
            responses: { 201: { description: "Producto creado" } },
        },
    },
    "/productos/{id}": {
        get: {
            tags: ["Productos"],
            summary: "Obtener producto por ID",
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            responses: { 200: { description: "Producto encontrado" } },
        },
        put: {
            tags: ["Productos"],
            summary: "Actualizar producto",
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Producto" },
                    },
                },
            },
            responses: { 200: { description: "Producto actualizado" } },
        },
        delete: {
            tags: ["Productos"],
            summary: "Eliminar producto",
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            responses: { 204: { description: "Producto eliminado" } },
        },
    },

    // ================= COMPRAS =================
    "/compras": {
        get: {
            tags: ["Compras"],
            summary: "Obtener todas las compras",
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: "Lista de compras" } },
        },
        post: {
            tags: ["Compras"],
            summary: "Crear nueva compra",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Compra" },
                    },
                },
            },
            responses: { 201: { description: "Compra creada" } },
        },
    },
    "/compras/{id}": {
        get: {
            tags: ["Compras"],
            summary: "Obtener compra por ID",
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: "Compra encontrada" } },
        },
        put: {
            tags: ["Compras"],
            summary: "Actualizar compra",
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Compra" },
                    },
                },
            },
            responses: { 200: { description: "Compra actualizada" } },
        },
        delete: {
            tags: ["Compras"],
            summary: "Eliminar compra",
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            security: [{ bearerAuth: [] }],
            responses: { 204: { description: "Compra eliminada" } },
        },
    },

    // ================= DETALLE COMPRAS =================
    "/detalle_compras": {
        get: {
            tags: ["DetalleCompras"],
            summary: "Obtener todos los detalles de compras",
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: "Lista de detalles" } },
        },
        post: {
            tags: ["DetalleCompras"],
            summary: "Agregar detalle de compra",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/DetalleCompra" },
                    },
                },
            },
            responses: { 201: { description: "Detalle creado" } },
        },
    },
    "/detalle_compras/{id}": {
        get: {
            tags: ["DetalleCompras"],
            summary: "Obtener detalle por ID",
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: "Detalle encontrado" } },
        },
        put: {
            tags: ["DetalleCompras"],
            summary: "Actualizar detalle",
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/DetalleCompra" },
                    },
                },
            },
            responses: { 200: { description: "Detalle actualizado" } },
        },
        delete: {
            tags: ["DetalleCompras"],
            summary: "Eliminar detalle",
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
            ],
            security: [{ bearerAuth: [] }],
            responses: { 204: { description: "Detalle eliminado" } },
        },
    },
};

module.exports = { swaggerUi, swaggerDocs };
