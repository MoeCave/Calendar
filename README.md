# 📅 Calendar App - Guía de Instalación y Arranque

> Una aplicación de calendario completa con Flask, MongoDB, Tailwind CSS y FullCalendar

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#️-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación Paso a Paso](#-instalación-paso-a-paso)
- [Configuración](#️-configuración)
- [Ejecutar la Aplicación](#️-ejecutar-la-aplicación)
- [Comandos Útiles](#-comandos-útiles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Solución de Problemas](#-solución-de-problemas)

---

## 🛠️ Stack Tecnológico

### Backend
```plaintext
🐍 Python 3.x
├── Flask          - Framework web
├── pymongo        - Driver de MongoDB
└── flask-pymongo  - Integración Flask-MongoDB
```

### Frontend
```plaintext
🎨 Node.js & npm
├── Tailwind CSS      - Framework CSS
├── @tailwindcss/cli  - CLI de Tailwind
└── FullCalendar      - Biblioteca de calendario
```

### Base de Datos
```plaintext
🍃 MongoDB (Local o Atlas)
```

---

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Software | Versión Mínima | Verificar |
|----------|----------------|-----------|
| Python | 3.8+ | `python --version` |
| Node.js | 16+ | `node --version` |
| npm | 8+ | `npm --version` |
| MongoDB | 5.0+ | `mongod --version` |

---

## 🚀 Instalación Paso a Paso

### 1 Configurar Entorno Python

#### **Windows**
```bash
# Crear entorno virtual
python -m venv venv

# Crear archivos de requirements.txt
pip freeze > requirements.txt

# Descargar archivos de requirements.txt
pip install -r requirements.txt

# Activar entorno virtual
venv\Scripts\activate

# Instalar dependencias
pip install flask pymongo flask-pymongo
```

#### **Linux / macOS**
```bash
# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install flask pymongo flask-pymongo
```

### 2 Configurar Dependencias Node.js
```bash
# Inicializar npm (si no existe package.json)
npm init -y

# Instalar Tailwind CSS
npm install -D tailwindcss @tailwindcss/cli

# Instalar FullCalendar
npm install fullcalendar
```

### 3 Copiar Archivos de FullCalendar
```bash
# Windows
copy node_modules\fullcalendar\index.global.min.js static\scripts\fullcalendar.global.min.js

# Linux / macOS
cp node_modules/fullcalendar/index.global.min.js static/scripts/fullcalendar.global.min.js
```

---

## ⚙️ Configuración

### 📝 Tailwind CSS

#### 1. Crear `tailwind.config.js` en la raíz:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/scripts/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6'
      }
    }
  },
  plugins: []
};
```

#### 2. Crear `static/src/input.css`:
```css
@import "tailwindcss";
@config "../../tailwind.config.js";

/* Estilos personalizados aquí */
@layer components {
  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition;
  }
}
```

#### 3. Agregar scripts a `package.json`:
```json
{
  "name": "calendar-app",
  "version": "1.0.0",
  "scripts": {
    "dev:css": "tailwindcss -i ./static/src/input.css -o ./static/styles/styles.css --watch",
    "build:css": "tailwindcss -i ./static/src/input.css -o ./static/styles/styles.css --minify"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^3.4.0",
    "tailwindcss": "^3.4.0"
  },
  "dependencies": {
    "fullcalendar": "^6.1.0"
  }
}
```

### 🗄️ MongoDB

#### **Opción A: MongoDB Local**
```bash
# Iniciar el servicio
mongod

# Verificar conexión
mongo
```

#### **Opción B: MongoDB Atlas (Cloud)**

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear un cluster
3. Obtener la URI de conexión
4. Configurar en `app.py`:
```python
# app.py
from flask import Flask
from flask_pymongo import PyMongo

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb+srv://usuario:password@cluster.mongodb.net/calendar_db"
mongo = PyMongo(app)
```

### 🔌 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Página principal |
| `GET` | `/tasques` | Gestión de tareas |
| `GET` | `/api/events` | Obtener eventos del calendario |
| `POST` | `/api/events` | Crear nuevo evento |

---

## ▶️ Ejecutar la Aplicación

### 🎯 Orden Recomendado de Inicio

1. **Iniciar MongoDB**
2. **Iniciar Tailwind CSS** (Node)
3. **Iniciar Flask** (Python)
4. **Abrir Navegador**

### 📝 Comandos Detallados

#### **Terminal 1: MongoDB**
```bash
# Local
mongod

# O verifica que esté corriendo
mongo --eval "db.adminCommand('ping')"
```

#### **Terminal 2: Tailwind CSS (Node)**
```bash
# Activar modo watch
npm run dev:css

# Salida esperada:
# Rebuilding...
# Done in 234ms.
```

> ⚠️ **Importante:** Mantén esta terminal ABIERTA mientras desarrollas.

#### **Terminal 3: Flask (Python)**

**Windows:**
```bash
# Activar entorno virtual
venv\Scripts\activate

# Iniciar servidor
python app.py
```

**Linux / macOS:**
```bash
# Activar entorno virtual
source venv/bin/activate

# Iniciar servidor
python app.py

# O alternativamente:
flask run
```

#### **Navegador**

Abre tu navegador en:
```
🌐 http://127.0.0.1:5000/
```

---

## 📦 Comandos Útiles

### Gestión del Entorno Virtual
```bash
# Activar venv
Windows:   venv\Scripts\activate
Linux/Mac: source venv/bin/activate

# Desactivar venv
deactivate

# Ver paquetes instalados
pip list

# Guardar dependencias
pip freeze > requirements.txt

# Instalar desde requirements.txt
pip install -r requirements.txt
```

### Tailwind CSS
```bash
# Modo desarrollo (con watch)
npm run dev:css

# Build para producción (minificado)
npm run build:css

# Build manual sin scripts npm
npx tailwindcss -i ./static/src/input.css -o ./static/styles/styles.css --watch
```

### Flask
```bash
# Modo debug (desarrollo)
python app.py

# O con Flask CLI
export FLASK_APP=app.py      # Linux/Mac
set FLASK_APP=app.py          # Windows
flask run

# Modo debug con Flask CLI
export FLASK_DEBUG=1          # Linux/Mac
set FLASK_DEBUG=1             # Windows
flask run
```

### MongoDB
```bash
# Conectar a MongoDB local
mongo

# Ver bases de datos
show dbs

# Usar base de datos
use calendar_db

# Ver colecciones
show collections

# Ver documentos
db.events.find().pretty()
```
---

## 📚 Recursos Adicionales

- [Documentación Flask](https://flask.palletsprojects.com/)
- [Documentación Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación FullCalendar](https://fullcalendar.io/docs)
- [Documentación MongoDB](https://docs.mongodb.com/)
- [PyMongo Tutorial](https://pymongo.readthedocs.io/)

---

## 📝 Licencia

MIT License - ver archivo `LICENSE` para más detalles.


Hecho con ❤️ y ☕