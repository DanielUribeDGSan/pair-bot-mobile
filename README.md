# Pair Bot Mobile 📱

Aplicación móvil complementaria para el ecosistema **Pair Bot**. Esta app te permite interactuar con tu asistente de programación (OpenHands) de forma remota, gestionar tus espacios de trabajo (Workspaces) y enviar prompts o imágenes directamente desde tu celular.

## 🚀 Características
- **Sincronización en tiempo real:** Comunicación directa con tu entorno de desarrollo mediante Supabase.
- **Multimodal:** Sube capturas de pantalla o imágenes de mockups desde tu galería para que el asistente las analice.
- **Selector de Perfiles (LLM):** Cambia entre modelos de Inteligencia Artificial (Claude, Gemini, DeepSeek, etc.) sobre la marcha.
- **Zero Configuración:** Configuración dinámica importando un archivo JSON generado por la app de escritorio.

## 📦 Requisitos Previos
1. [Node.js](https://nodejs.org/) (versión 18 o superior).
2. [Expo CLI](https://docs.expo.dev/get-started/installation/) instalado globalmente o usado mediante `npx`.
3. (Opcional) La aplicación de **Expo Go** en tu celular (disponible en App Store / Play Store) para probar en un dispositivo físico.

## 🛠️ Instalación y Uso

1. **Instala las dependencias**
   Abre una terminal en esta carpeta (`ia-chat-mobile`) y ejecuta:
   ```bash
   npm install
   ```

2. **Levanta el servidor de desarrollo**
   Ejecuta el siguiente comando para iniciar Metro (el empaquetador de React Native):
   ```bash
   npm start
   ```
   *(o puedes usar `npx expo start` / `npm run ios` si prefieres abrir el simulador directo)*

3. **Prueba la aplicación**
   - **En tu celular:** Abre la app de Expo Go y escanea el código QR que aparece en la terminal.
   - **En un simulador:** Presiona la tecla `i` en tu terminal para abrir en el simulador de iOS, o la tecla `a` para el emulador de Android.

## ⚙️ Configuración (Muy Importante)
Al abrir la aplicación por primera vez, verás la pantalla de inicio pero los workspaces estarán vacíos. 

Para conectar tu celular a tu base de datos y a tus perfiles de IA:
1. Ve a los **Ajustes** en tu **Aplicación de Escritorio (Pair Bot)**.
2. Llena los datos de tu base de datos de Supabase.
3. Desplázate hacia abajo y haz clic en el botón de descargar para exportar tu configuración (generará un archivo `.json`).
4. Abre ese archivo `.json` desde la pantalla inicial de esta app móvil.
5. ¡Listo! La app se sincronizará automáticamente y podrás empezar a chatear con tu asistente.
