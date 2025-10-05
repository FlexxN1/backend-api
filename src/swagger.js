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
            { url: "http://localhost:4000/api" },
            { url: "https://tu-dominio.railway.app/api" },
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
                        id: { type: "integer" },
                        nombre: { type: "string" },
                        email: { type: "string" },
                        password: { type: "string" },
                        rol: { type: "string" },
                    },
                },
                Producto: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        nombre: { type: "string" },
                        descripcion: { type: "string" },
                        precio: { type: "number" },
                        stock: { type: "integer" },
                        imagen_url: { type: "string" },
                    },
                },
                Compra: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        usuario_id: { type: "integer" },
                        total: { type: "number" },
                        estado_pago: { type: "string" },
                        estado_envio: { type: "string" },
                        productos: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Producto" },
                        },
                    },
                },
                DetalleCompra: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        compra_id: { type: "integer" },
                        producto_id: { type: "integer" },
                        cantidad: { type: "integer" },
                        precio: { type: "number" },
                    },
                },
                Auth: {
                    type: "object",
                    properties: {
                        token: { type: "string" },
                    },
                },
            },
        },
        paths: {
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
                        400: { description: "Error en los datos" },
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
                                schema: {
                                    type: "object",
                                    properties: {
                                        email: { type: "string" },
                                        password: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Login exitoso",
                            content: {
                                "application/json": { schema: { $ref: "#/components/schemas/Auth" } },
                            },
                        },
                        401: { description: "Credenciales inválidas" },
                    },
                },
            },

            "/usuarios": {
                get: {
                    tags: ["Usuarios"],
                    summary: "Listar usuarios",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: "Lista de usuarios",
                            content: {
                                "application/json": {
                                    schema: { type: "array", items: { $ref: "#/components/schemas/Usuario" } },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ["Usuarios"],
                    summary: "Crear usuario",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Usuario" } },
                        },
                    },
                    responses: { 201: { description: "Usuario creado" } },
                },
            },
            "/usuarios/{id}": {
                get: {
                    tags: ["Usuarios"],
                    summary: "Obtener usuario por ID",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    responses: {
                        200: { description: "Usuario encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Usuario" } } } },
                        404: { description: "Usuario no encontrado" },
                    },
                },
                put: {
                    tags: ["Usuarios"],
                    summary: "Actualizar usuario",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    requestBody: {
                        content: { "application/json": { schema: { $ref: "#/components/schemas/Usuario" } } },
                    },
                    responses: { 200: { description: "Usuario actualizado" } },
                },
                delete: {
                    tags: ["Usuarios"],
                    summary: "Eliminar usuario",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    responses: { 200: { description: "Usuario eliminado" } },
                },
            },

            "/productos": {
                get: {
                    tags: ["Productos"],
                    summary: "Listar productos",
                    responses: {
                        200: {
                            description: "Lista de productos",
                            content: {
                                "application/json": {
                                    schema: { type: "array", items: { $ref: "#/components/schemas/Producto" } },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ["Productos"],
                    summary: "Crear producto",
                    requestBody: {
                        content: { "application/json": { schema: { $ref: "#/components/schemas/Producto" } } },
                    },
                    responses: { 201: { description: "Producto creado" } },
                },
            },
            "/productos/{id}": {
                get: {
                    tags: ["Productos"],
                    summary: "Obtener producto",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    responses: {
                        200: { description: "Producto encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Producto" } } } },
                        404: { description: "Producto no encontrado" },
                    },
                },
                put: {
                    tags: ["Productos"],
                    summary: "Actualizar producto",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    requestBody: {
                        content: { "application/json": { schema: { $ref: "#/components/schemas/Producto" } } },
                    },
                    responses: { 200: { description: "Producto actualizado" } },
                },
                delete: {
                    tags: ["Productos"],
                    summary: "Eliminar producto",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    responses: { 200: { description: "Producto eliminado" } },
                },
            },

            "/compras": {
                get: {
                    tags: ["Compras"],
                    summary: "Listar compras",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: "Lista de compras",
                            content: {
                                "application/json": {
                                    schema: { type: "array", items: { $ref: "#/components/schemas/Compra" } },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ["Compras"],
                    summary: "Crear compra",
                    requestBody: {
                        content: { "application/json": { schema: { $ref: "#/components/schemas/Compra" } } },
                    },
                    responses: { 201: { description: "Compra creada" } },
                },
            },
            "/compras/{id}/estado-pago": {
                put: {
                    tags: ["Compras"],
                    summary: "Actualizar estado de pago",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: { type: "object", properties: { estado_pago: { type: "string" } } },
                            },
                        },
                    },
                    responses: { 200: { description: "Estado actualizado" } },
                },
            },

            "/detalle-compras": {
                post: {
                    tags: ["DetalleCompras"],
                    summary: "Agregar detalle a compra",
                    requestBody: {
                        content: { "application/json": { schema: { $ref: "#/components/schemas/DetalleCompra" } } },
                    },
                    responses: { 201: { description: "Detalle agregado" } },
                },
            },
        },
    },
    apis: [],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerDocs };
