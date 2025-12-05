# 🥶 Cold Crypto Wallet Project (Cryptography 2026-1)

## 🌟 Introducción

Este proyecto es la implementación fundamental de una **Billetera Criptográfica Fría (Cold Wallet)** para una criptomoneda de estilo de cuentas (Accounts Model). Nuestro objetivo principal es desarrollar **desde cero** las funciones criptográficas esenciales para la gestión segura de claves y la autorización de transacciones, cumpliendo con estrictos estándares de seguridad e higiene de código.

Este software simula la funcionalidad central de una billetera, enfocándose en los aspectos de la criptografía y la seguridad de datos, sin requerir conexión a una red real o actualización de la cadena de bloques.

## ✨ Características Principales

* **Gestión Segura de Claves:** Generación de pares de claves (Ed25519) y almacenamiento cifrado de la clave privada.
* **Cifrado Robusto:** Utilización de **Argon2id** (Key Derivation Function) y **AES-256-GCM** (Authentic Encryption) para proteger los secretos en reposo.
* **Firma de Transacciones:** Implementación de un proceso determinista de canonicalización JSON para generar digests y firmar transacciones.
* **Verificación de Transacciones:** Funcionalidad para verificar firmas, validar la correspondencia de la dirección de origen (`tx.from`) y mitigar ataques de *replay* en la simulación.
* **Flujo de Trabajo Simulado:** Utilización de carpetas locales (`./inbox` y `./outbox`) para simular el envío y la recepción de transacciones.

## 🛠️ Tecnología

| Componente | Opción Elegida | Razón |
| :--- | :--- | :--- |
| **Lenguaje de Programación** | Node.js / TypeScript (Ejemplo) | (Proporcionar una razón breve, ej: Facilidad de prototipado y disponibilidad de bibliotecas criptográficas auditadas). |
| **Esquema de Firma** | Ed25519 | Elegido por su simplicidad, seguridad y naturaleza determinista. |
| **KDF** | Argon2id | KDF moderna y resistente a ataques de fuerza bruta. |

---

## 🏃 Cómo Ejecutar el Proyecto

# 🚀 Guía Completa de Instalación y Ejecución

## 📋 Requisitos Previos

Antes de comenzar, tu sistema debe tener instalado:

| Software | Versión Mínima | Propósito |
|----------|----------------|-----------|
| **Node.js** | v18.0 o superior | Entorno de ejecución JavaScript |
| **npm** | v9.0 o superior | Gestor de paquetes (viene con Node.js) |
| **Git** | Cualquier versión | Control de versiones |
| **Compilador C++** | - | Requerido para compilar Argon2 |

---

## 🪟 INSTALACIÓN EN WINDOWS

### Paso 1: Instalar Node.js y npm

1. Descarga el instalador desde [nodejs.org](https://nodejs.org/)
   - Recomendado: **LTS (Long Term Support)** - versión 20.x o superior
2. Ejecuta el instalador `.msi` descargado
3. Durante la instalación:
   - ✅ Marca la opción **"Automatically install necessary tools"**
   - ✅ Esto instalará **Chocolatey**, **Python** y **Visual Studio Build Tools** (necesarios para Argon2)
4. Reinicia tu computadora
5. Verifica la instalación abriendo **PowerShell** o **CMD**:
   ```bash
   node --version
   # Salida esperada: v20.x.x o superior
   
   npm --version
   # Salida esperada: 10.x.x o superior
   ```

### Paso 2: Instalar Git

1. Descarga Git desde [git-scm.com](https://git-scm.com/download/win)
2. Ejecuta el instalador y acepta las opciones predeterminadas
3. Verifica la instalación:
   ```bash
   git --version
   # Salida esperada: git version 2.x.x
   ```

### Paso 3: Instalar Herramientas de Compilación (si no se instalaron automáticamente)

Si al instalar dependencias obtienes errores con `node-gyp` o `argon2`, ejecuta:

```bash
# Abre PowerShell como Administrador y ejecuta:
npm install --global windows-build-tools
```

**Nota:** Esto puede tardar 10-15 minutos.

### Paso 4: Clonar el Repositorio

Abre **PowerShell** o **CMD** en la carpeta donde desees guardar el proyecto:

```bash
git clone https://github.com/AlePG1/Cold-Wallet-Project.git
cd Cold-Wallet-Project
```

### Paso 5: Instalar Dependencias del Proyecto

```bash
npm install
```

**Tiempo estimado:** 3-5 minutos  
**Tamaño de descarga:** ~200 MB (Electron es pesado)

### Paso 6: Ejecutar la Aplicación

```bash
npm start
```

✅ **Resultado esperado:** Se abrirá una ventana de Electron con la interfaz gráfica de la Cold Wallet.

### Paso 7 (Opcional): Ejecutar Tests

```bash
npm test
```

✅ **Salida esperada:**
```
PASS tests/cryptoUtils.test.js
PASS tests/transactionManager.test.js
PASS tests/multiKeyStore.test.js
PASS tests/golden_vectors.test.js
PASS tests/transactionManager.negative.test.js

Test Suites: 5 passed, 5 total
Tests: 51 passed, 51 total
```

---

## 🍎 INSTALACIÓN EN macOS

### Paso 1: Instalar Homebrew (Gestor de Paquetes)

Si no tienes Homebrew instalado:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Paso 2: Instalar Node.js y npm

```bash
brew install node
```

Verifica la instalación:
```bash
node --version
# Salida esperada: v20.x.x o superior

npm --version
# Salida esperada: 10.x.x o superior
```

### Paso 3: Instalar Git

Git viene preinstalado en macOS, pero puedes actualizarlo:

```bash
brew install git
```

Verifica:
```bash
git --version
# Salida esperada: git version 2.x.x
```

### Paso 4: Instalar Xcode Command Line Tools (para compilar Argon2)

```bash
xcode-select --install
```

Aparecerá una ventana emergente, haz clic en **"Instalar"**.

### Paso 5: Clonar el Repositorio

```bash
cd ~/Desktop  # O la carpeta que prefieras
git clone https://github.com/AlePG1/Cold-Wallet-Project.git
cd Cold-Wallet-Project
```

### Paso 6: Instalar Dependencias del Proyecto

```bash
npm install
```

**Tiempo estimado:** 3-5 minutos

### Paso 7: Ejecutar la Aplicación

```bash
npm start
```

✅ **Resultado esperado:** Se abrirá una ventana de Electron con la interfaz gráfica.

### Paso 8 (Opcional): Ejecutar Tests

```bash
npm test
```

---

## 🐧 INSTALACIÓN EN LINUX

### Instrucciones para Ubuntu/Debian/Linux Mint

#### Paso 1: Actualizar el Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

#### Paso 2: Instalar Node.js y npm

**Opción A: Desde repositorios oficiales de NodeSource (Recomendado)**

```bash
# Descargar e instalar Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Opción B: Usando NVM (Node Version Manager) - Alternativa**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

Verifica la instalación:
```bash
node --version
npm --version
```

#### Paso 3: Instalar Git

```bash
sudo apt install -y git
```

Verifica:
```bash
git --version
```

#### Paso 4: Instalar Herramientas de Compilación (para Argon2)

```bash
sudo apt install -y build-essential python3
```

#### Paso 5: Instalar Dependencias de Electron (librerías gráficas)

```bash
sudo apt install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1 libasound2
```

#### Paso 6: Clonar el Repositorio

```bash
cd ~/Desktop  # O la carpeta que prefieras
git clone https://github.com/AlePG1/Cold-Wallet-Project.git
cd Cold-Wallet-Project
```

#### Paso 7: Instalar Dependencias del Proyecto

```bash
npm install
```

#### Paso 8: Ejecutar la Aplicación

```bash
npm start
```

✅ **Resultado esperado:** Se abrirá una ventana de Electron.

#### Paso 9 (Opcional): Ejecutar Tests

```bash
npm test
```

---

### Instrucciones para Fedora/CentOS/RHEL

#### Paso 1: Instalar Node.js

```bash
# Fedora
sudo dnf install -y nodejs npm

# CentOS/RHEL (requiere EPEL)
sudo yum install -y epel-release
sudo yum install -y nodejs npm
```

#### Paso 2: Instalar Herramientas de Desarrollo

```bash
sudo dnf groupinstall "Development Tools" -y
# O en CentOS/RHEL:
sudo yum groupinstall "Development Tools" -y
```

#### Paso 3: Continuar desde el Paso 6 de Ubuntu/Debian

---

### Instrucciones para Arch Linux/Manjaro

```bash
sudo pacman -S nodejs npm git base-devel

cd ~/Desktop
git clone https://github.com/AlePG1/Cold-Wallet-Project.git
cd Cold-Wallet-Project
npm install
npm start
```

---

## 🛠️ Solución de Problemas Comunes

### ❌ Error: `gyp ERR! find Python`

**Causa:** Falta Python (requerido para compilar módulos nativos como Argon2)

**Solución:**
```bash
# Windows
npm install --global windows-build-tools

# macOS
xcode-select --install

# Linux (Ubuntu/Debian)
sudo apt install python3
```

---

### ❌ Error: `Cannot find module 'electron'`

**Causa:** Electron no se instaló correctamente

**Solución:**
```bash
npm install electron --save-dev
```

---

### ❌ Error: `EACCES: permission denied` (Linux/macOS)

**Causa:** Permisos insuficientes en carpetas de npm

**Solución:**
```bash
# Opción 1: Usar NVM (recomendado)
# Reinstala Node.js con NVM para evitar problemas de permisos

# Opción 2: Cambiar propietario de carpetas npm
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

---

### ❌ Error: `node-gyp rebuild` falla en Argon2

**Causa:** Faltan compiladores C++

**Solución:**
```bash
# Windows
npm install --global windows-build-tools

# macOS
xcode-select --install

# Linux
sudo apt install build-essential  # Ubuntu/Debian
sudo dnf groupinstall "Development Tools"  # Fedora
```

---

### ❌ La ventana de Electron no se abre (Linux)

**Causa:** Faltan librerías gráficas

**Solución:**
```bash
sudo apt install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1 libasound2
```

---

### ❌ Tests fallan con `Jest is not recognized`

**Causa:** Jest no está instalado

**Solución:**
```bash
npm install --save-dev jest
```

---

## 📁 Estructura del Proyecto Después de la Instalación

```
Cold-Wallet-Project/
├── app/
│   ├── cryptoUtils.js          # Derivación de direcciones KECCAK-256
│   ├── multiKeyStore.js        # Gestión multi-cuenta con Argon2id + AES-256-GCM
│   └── transactionManager.js   # Firma/verificación Ed25519
├── tests/
│   ├── cryptoUtils.test.js
│   ├── multiKeyStore.test.js
│   ├── transactionManager.test.js
│   ├── transactionManager.negative.test.js
│   └── golden_vectors.test.js
├── keystores/                   # Se crea al inicializar primera cuenta
├── inbox/                       # Se crea automáticamente
├── outbox/                      # Se crea automáticamente
├── verified/                    # Se crea automáticamente
├── accounts.json                # Índice de cuentas (se crea al usar)
├── nonce_tracker.json           # Prevención de replay attacks
├── main.js                      # Proceso principal Electron
├── preload.js                   # Bridge IPC seguro
├── index.html                   # Interfaz gráfica
├── styles.css                   # Estilos
├── renderer.js                  # Lógica frontend
├── package.json                 # Dependencias y scripts
└── README.md                    # Este archivo
```

---

## 🎯 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia la aplicación GUI con Electron |
| `npm test` | Ejecuta todos los tests con Jest (51 tests) |
| `npm test -- --coverage` | Ejecuta tests con reporte de cobertura (98%) |
| `npm test -- --watch` | Modo watch para desarrollo |
| `npm run package` | Genera ejecutable portable (opcional) |

---

## 🔒 Uso Básico de la Aplicación

### 1️⃣ Crear una cuenta

- Abre la aplicación → Pestaña **"👥 Cuentas"**
- Click en **"➕ Crear Cuenta"**
- Ingresa nombre (ej. "Ahorros 2025") y contraseña ≥12 caracteres
- Se genera keystore cifrado en `keystores/`

### 2️⃣ Firmar una transacción (Cold Wallet)

- Pestaña **"✍️ Firmar"**
- Selecciona cuenta, completa: `To`, `Value`, `Nonce`
- Se genera archivo `.json` en `outbox/`

### 3️⃣ Transferir transacción (Air-Gapped Simulado)

- Copia archivo de `outbox/` a `inbox/` (simula USB/QR)

### 4️⃣ Verificar transacción (Hot Wallet)

- Pestaña **"✅ Verificar"** → Click **"🔄 Actualizar Lista"**
- Click en **"✅ Verificar"** junto al archivo
- Si es válida → se mueve a `verified/`

---

## 📞 Soporte

Si encuentras problemas no cubiertos aquí:

1. Revisa la sección **"Solución de Problemas Comunes"**
2. Verifica que Node.js ≥18.0 esté instalado: `node --version`
3. Asegúrate de tener las herramientas de compilación instaladas
4. Consulta el repositorio: [https://github.com/AlePG1/Cold-Wallet-Project](https://github.com/AlePG1/Cold-Wallet-Project)

---

## 📄 Licencia

Este proyecto es un trabajo académico para el curso de Criptografía 2026-1, UNAM Facultad de Ingeniería.

---

**✅ ¡Listo! Ahora tienes todo lo necesario para ejecutar el proyecto en cualquier sistema operativo.**