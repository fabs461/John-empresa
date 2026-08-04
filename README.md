# John Empresa — Catálogo de Inventario

Sistema web de catálogo de productos para **John Empresa**.
Permite visualizar prendas, buscar productos y administrar el inventario mediante un panel protegido con autenticación.

El proyecto utiliza un frontend estático, un backend con Node.js/Express, una base de datos MySQL y almacenamiento de imágenes mediante Cloudinary.

---

## Tecnologías utilizadas

### Frontend

* HTML5
* CSS3
* JavaScript Vanilla
* Fetch API

### Backend

* Node.js
* Express.js
* JWT para autenticación
* Multer para subida de archivos
* Cloudinary para almacenamiento de imágenes

### Base de datos

* MySQL

### Hosting

* Frontend: Netlify
* Backend: Render
* Base de datos: Aiven MySQL
* Imágenes: Cloudinary

---

# Funcionalidades

## Público

* Visualización del catálogo de productos
* Búsqueda por nombre, talla, color o descripción
* Vista detallada de productos
* Consulta de stock disponible

## Administrador

* Inicio de sesión seguro
* Añadir productos
* Editar productos
* Eliminar productos
* Subir imágenes
* Control de inventario

---

# Estructura del proyecto

```
johnempresa-tag/
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── styles.css
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   │
│   └── src/
│       ├── config/
│       │   ├── db.js
│       │   └── cloudinary.js
│       │
│       ├── controllers/
│       │   ├── authController.js
│       │   └── productController.js
│       │
│       ├── middleware/
│       │   └── uploadMiddleware.js
│       │
│       └── routes/
│           ├── authRoutes.js
│           └── productRoutes.js
│
└── README.md
```

---

# Instalación local

## 1. Clonar el repositorio

```bash
git clone https://github.com/fabs461/John-empresa.git
```

Entrar al proyecto:

```bash
cd John-empresa
```

---

# Backend

Entrar a la carpeta backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear un archivo `.env`:

```
PORT=3000

DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Ejecutar servidor:

```bash
npm start
```

El backend estará disponible en:

```
http://localhost:3000
```

---

# Base de datos

Crear las tablas necesarias:

```sql
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    size VARCHAR(5) NOT NULL,
    color VARCHAR(50) NOT NULL,
    description TEXT,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url VARCHAR(255)
);
```

---

# Frontend

Abrir la carpeta frontend y ejecutar usando un servidor local.

Ejemplo con VS Code:

* Instalar extensión Live Server
* Abrir `index.html`
* Ejecutar "Open with Live Server"

---

# Variables importantes

## JWT

`JWT_SECRET` se utiliza para firmar los tokens de administrador.

## Cloudinary

Las imágenes no se almacenan en el servidor.
Cuando un administrador sube una imagen:

1. El backend recibe el archivo.
2. Multer lo envía a Cloudinary.
3. Cloudinary devuelve la URL.
4. La URL se guarda en MySQL.

---

# API Endpoints

## Productos

### Obtener productos

```
GET /api/products
```

### Crear producto

```
POST /api/products
```

Requiere autenticación.

### Editar producto

```
PUT /api/products/:id
```

Requiere autenticación.

### Eliminar producto

```
DELETE /api/products/:id
```

Requiere autenticación.

---

## Autenticación

### Login

```
POST /api/auth/login
```

Ejemplo:

```json
{
  "username": "admin",
  "password": "password"
}
```

---

# Seguridad

* Las contraseñas se almacenan usando hashes con bcrypt.
* Las rutas administrativas requieren JWT.
* Las variables sensibles están almacenadas en `.env`.
* `.env` no debe subirse al repositorio.

---

# Autor

Proyecto desarrollado por Fabri.
