# NOVA ARENA

Una aventura educativa para navegador: elige **tamaño de modelo** y **esfuerzo** por separado, recupera cuatro sistemas de Órbita Cero y administra 100 de energía. Implementada con **Vite, TypeScript y Kaplay**; interfaz HTML accesible y escena espacial WebGL con ilustraciones SVG locales.

El juego es una simulación de contenido redactado. No consulta modelos reales, no requiere claves ni cuentas y no transmite el progreso a un servidor.

## Desarrollo

Requiere Node.js 22.12+ o 24 LTS y npm. Este entorno se ha validado con Node 24.19.0.

```bash
cd /workspace/nova
npm ci --cache /workspace/.cache/npm
npm run dev
```

Vite escucha en el puerto **5173**. Para usar otro puerto: `npm run dev -- --port 5174`. No se necesitan variables de entorno ni servicios de datos. La caché explícita evita escribir en el directorio personal del contenedor.

```bash
npm run build       # TypeScript y compilación estática a dist/
npm run preview     # Servir la compilación en el puerto 4173
npm test            # Reglas, costes, variantes, semillas, estrellas y guardado
npm run test:e2e    # Flujo real en Chromium, móvil, teclado y recuperación
```

Las pruebas de navegador usan `/usr/bin/chromium` cuando está instalado. En otra máquina, instala el navegador de Playwright con `npx playwright install chromium`, o define `CHROMIUM_PATH` con la ruta del ejecutable. El renderizado por software se habilita solo para las pruebas de navegador en contenedores.

## Qué incluye

- Cuatro compañeros ilustrados, tres esfuerzos y doce combinaciones independientes.
- Seis misiones con dos variantes cada una, reglas deterministas y explicaciones acordes con la selección real.
- Introducción de cuatro paneles, tutorial omisible y expediciones de cuatro encuentros.
- Escaneo gratuito, resultados aptos/incompletos/sin datos, reintentos y reinicio inmediato.
- Tres estrellas acumulativas y seis recompensas cosméticas previsibles.
- Guardado versionado en `localStorage`, recuperación del resultado sin repetir el coste y juego en memoria si el almacenamiento falla.
- Práctica que prioriza un principio fallado y otra variante, desafío diario según la fecha local y códigos reproducibles como `NOVA1-P-12AB34CD`.
- Copia del resultado, sonido opcional desactivado al inicio, movimiento reducido y borrado de progreso con confirmación.
- Controles con teclado, foco visible, diseño a 320 píxeles y recursos locales, incluidas las fuentes.

Las ilustraciones espaciales se dibujan con Kaplay. Si el navegador no dispone de WebGL, se presenta una ilustración estática y el juego HTML conserva sus controles y reglas. No hay animaciones necesarias para resolver una misión.

La resolución se guarda **antes** de animarse. Cada intento recibe un ID; durante el resultado el motor bloquea nuevas ejecuciones. La recuperación valida el estado reproduciendo los intentos y rechaza una expedición dañada sin eliminar los hallazgos y ajustes válidos.

## Estructura

```text
src/content.ts     Compañeros, misiones, variantes y reglas explícitas
src/engine.ts      Costes, resolución, semillas, desafíos y estrellas
src/storage.ts     Esquema, validación y persistencia tolerante a fallos
src/main.ts        Nave, introducción, combate, resultados y ajustes
src/space.ts       Escena Kaplay, órbitas, compañeros y pulsos visuales
src/audio.ts       Señales sintetizadas opcionales
src/style.css      Interfaz adaptable y movimiento reducido
public/crew/       Cuatro ilustraciones SVG originales incluidas
tests/unit/        Cobertura exhaustiva del motor y guardado
tests/browser/     Pruebas funcionales con Playwright
```

## Publicación

### GitHub Pages

El workflow [Publicar NOVA ARENA](.github/workflows/pages.yml) instala las dependencias con el lockfile, ejecuta las pruebas, compila `dist/` y lo publica al actualizar `main`. También puede ejecutarse desde **Actions → Publicar NOVA ARENA → Run workflow**.

La primera vez, en [Settings → Pages](https://github.com/deuxterio/nova/settings/pages), selecciona **Build and deployment → Source → GitHub Actions**. Si GitHub exige elegir primero una rama por tratarse de un repositorio vacío, sube el primer commit a `main` antes de activar Pages. No hacen falta secretos de despliegue: el workflow utiliza el token temporal de GitHub con permisos de Pages.

La dirección esperada es **https://deuxterio.github.io/nova/**. Solo estará disponible después de activar Pages y completar correctamente el job de publicación. Consulta **Actions** para ver el estado o reejecutar una ejecución que haya fallado antes de activar Pages.

`base: './'` en Vite mantiene rutas relativas para JavaScript, fuentes e ilustraciones; por eso el juego funciona en `/nova/` y también en un dominio personalizado. No se necesita un servidor Node.js para jugar.

### Otros alojamientos estáticos

`dist/` se puede servir con cualquier alojamiento estático. La base relativa permite desplegarlo en un subdirectorio. El progreso es específico del navegador y origen: cambiar de dominio no lo sincroniza. No se incluye un service worker; después de cargar los recursos el juego no necesita peticiones de gameplay, pero la primera carga sí requiere acceso al sitio.

En Codex, cada tarea dispone de un entorno aislado. Usa el checkout existente en `/workspace/nova`; no es necesario crear un worktree. Los procesos no sobreviven necesariamente a la publicación del entorno: hay que volver a ejecutar `npm run dev` al empezar una tarea que necesite el servidor.

## Límites de esta versión

Extraalto, Máximo, cuentas, multijugador, clasificación mundial e integración con IA real quedan fuera del alcance inicial. Los costes son ficticios. La comprensión, el ritmo de tres a cinco minutos y la transferencia educativa necesitan pruebas con jugadores; las pruebas automatizadas verifican funcionamiento y reglas, no eficacia educativa.
