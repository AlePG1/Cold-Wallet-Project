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

Para configurar y ejecutar el proyecto, sigue los siguientes pasos:

1.  **Clonar el Repositorio:**
    ```bash
    git clone [https://github.com/tu_usuario/cold-crypto-wallet-2026-1.git](https://github.com/tu_usuario/cold-crypto-wallet-2026-1.git)
    cd cold-crypto-wallet-2026-1
    ```
2.  **Instalar Dependencias:**
    ```bash
    npm install
    ```
3.  **Ejecutar la Aplicación:**
    ```bash
    # (El comando real dependerá de tu configuración, ej:)
    npm start
    # O
    node app.js
    ```
    *(Asegúrate de que este comando cumpla con el requisito de "one-command run").*
