// src/swagger.js
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "BiteBack API",
            version: "1.0.0",
            description: "API REST para BiteBack (usuarios, productos, compras, detalle_compras)",
        },
        servers: [
            { url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}` }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },
            schemas: {
                Usuario: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        nombre: { type: "string", example: "Juan Pérez" },
                        email: { type: "string", example: "juan@example.com" },
                        tipo_usuario: { type: "string", enum: ["Cliente", "Administrador"], example: "Cliente" },
                        fecha_registro: { type: "string", format: "date-time" }
                    }
                },
                UsuarioCreate: {
                    type: "object",
                    required: ["nombre", "email", "password", "tipo_usuario"],
                    properties: {
                        nombre: { type: "string" },
                        email: { type: "string", format: "email" },
                        password: { type: "string" },
                        tipo_usuario: { type: "string", enum: ["Usuario", "Administrador"] }
                    }
                },
                Producto: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        nombre: { type: "string", example: "Aguacate Hass" },
                        descripcion: { type: "string" },
                        precio: { type: "number", example: 5000 },
                        imagen_url: { type: "string", format: "uri" },
                        stock: { type: "integer", example: 100 },
                        vendedor_id: { type: "integer" },
                        fecha_creacion: { type: "string", format: "date-time" }
                    }
                },
                ProductoCreate: {
                    type: "object",
                    required: ["nombre", "precio", "vendedor_id"],
                    properties: {
                        nombre: { type: "string" },
                        descripcion: { type: "string" },
                        precio: { type: "number" },
                        stock: { type: "integer" },
                        vendedor_id: { type: "integer" },
                        imagen_url: { type: "string" }
                    }
                },
                Compra: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        usuario_id: { type: "integer" },
                        fecha_compra: { type: "string", format: "date-time" },
                        total: { type: "number" },
                        ciudad: { type: "string" },
                        direccion: { type: "string" },
                        telefono: { type: "string" },
                        estado: { type: "string", enum: ["pendiente", "pagado", "enviado", "cancelado"] }
                    }
                },
                CompraCreate: {
                    type: "object",
                    required: ["usuario_id", "total", "ciudad", "direccion"],
                    properties: {
                        usuario_id: { type: "integer" },
                        total: { type: "number" },
                        ciudad: { type: "string" },
                        direccion: { type: "string" },
                        telefono: { type: "string" },
                        estado: { type: "string" }
                    }
                },
                DetalleCompra: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        compra_id: { type: "integer" },
                        producto_id: { type: "integer" },
                        cantidad: { type: "integer" },
                        precio_unitario: { type: "number" }
                    }
                },
                AuthRegister: {
                    type: "object",
                    required: ["nombre", "email", "password", "tipoUsuario"],
                    properties: {
                        nombre: { type: "string" },
                        email: { type: "string", format: "email" },
                        password: { type: "string" },
                        tipoUsuario: { type: "string", enum: ["Usuario", "Administrador"] }
                    }
                },
                AuthLogin: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email" },
                        password: { type: "string" }
                    }
                },
                TokenResponse: {
                    type: "object",
                    properties: {
                        token: { type: "string" },
                        user: { $ref: "#/components/schemas/Usuario" }
                    }
                }
            }
        }
    },
    apis: [] // no usamos comentarios en archivos; definimos rutas manualmente abajo
};

const swaggerSpec = swaggerJSDoc(options);

// Añadir paths manualmente (más claro y completo)
swaggerSpec.paths = {
    "/auth/register": {
        post: {
            tags: ["Auth"],
            summary: "Registrar usuario",
            requestBody: {
                required: true,
                content: {
                    "application/json": { schema: { $ref: "#/components/schemas/AuthRegister" } }
                }
            },
            responses: {
                "200": { description: "Usuario creado", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } },
                "400": { description: "Faltan datos / tipo inválido", content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" } } } } } },
                "409": { description: "Email ya registrado", content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" } } } } } }
            }
        }
    },
    "/auth/login": {
        post: {
            tags: ["Auth"],
            summary: "Login de usuario",
            requestBody: {
                required: true,
                content: {
                    "application/json": { schema: { $ref: "#/components/schemas/AuthLogin" } }
                }
            },
            responses: {
                "200": { description: "Login ok", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } },
                "401": { description: "Credenciales inválidas" }
            }
        }
    },

    "/usuarios": {
        get: {
            tags: ["Usuarios"],
            summary: "Listar todos los usuarios",
            responses: {
                "200": { description: "Lista usuarios", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Usuario" } } } } }
            }
        },
        post: {
            tags: ["Usuarios"],
            summary: "Crear usuario (admin)",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/UsuarioCreate" } } }
            },
            responses: {
                "200": { description: "Usuario creado" },
                "401": { description: "No autorizado" }
            }
        }
    },

    "/productos": {
        get: {
            tags: ["Productos"],
            summary: "Listar productos",
            responses: {
                "200": { description: "Lista productos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Producto" } } } } }
            }
        },
        post: {
            tags: ["Productos"],
            summary: "Crear producto (admin)",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/ProductoCreate" } } }
            },
            responses: {
                "200": { description: "Producto creado" },
                "401": { description: "No autorizado" }
            }
        }
    },

    "/compras": {
        get: {
            tags: ["Compras"],
            summary: "Listar compras",
            responses: { "200": { description: "Lista compras" } }
        },
        post: {
            tags: ["Compras"],
            summary: "Crear compra",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/CompraCreate" } } }
            },
            responses: { "200": { description: "Compra creada" }, "401": { description: "No autorizado" } }
        }
    },

    "/detalle-compras": {
        get: {
            tags: ["DetalleCompras"],
            summary: "Listar detalle de compras",
            responses: { "200": { description: "Lista detalle compras" } }
        },
        post: {
            tags: ["DetalleCompras"],
            summary: "Crear detalle de compra",
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/DetalleCompra" } } }
            },
            responses: { "200": { description: "Detalle creado" } }
        }
    }
};

module.exports = swaggerSpec;
