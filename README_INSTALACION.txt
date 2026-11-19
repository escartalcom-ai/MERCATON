# MERCATON — paquete de actualización

## Archivos incluidos

- `index.html`: interfaz y panel CEO actualizados.
- `Appscript_Mercaton.gs`: API de Apps Script actualizada.
- `Mercaton_actualizado.xlsx`: estructura del libro con una pestaña nueva `CEO`.
- `sw.js`: versión de caché PWA incrementada para forzar actualización.
- `manifest.json`: conservado.
- `firebase-functions/`: servicio seguro de baja de cuentas en Firebase Authentication.

## Cambios implementados

1. Se crea la pestaña `CEO` para registrar auditoría de acciones administrativas.
2. La búsqueda CEO consulta los campos del registro activo y datos relacionados en calificaciones/favoritos; se agrega la pestaña de auditoría.
3. La baja de puestos y compradores mantiene trazabilidad con estado `Eliminado`, bloquea nuevas sesiones por Apps Script y retira los registros de la vista pública. La eliminación de Firebase Authentication requiere desplegar la Cloud Function incluida y configurarla en Apps Script (ver abajo).
4. Error de login: `Credenciales o contraseña incorrectas.` se muestra en el cuadro existente.
5. Mensajes de calificación singular/plural.
6. La insignia pública se guarda como `Oficial` en la columna existente `Verificado` (se conserva el nombre de la columna para no romper la estructura); la lectura acepta datos antiguos `Verificado`.
7. Botones de actualización y calificación muestran el indicador animado y texto de proceso.
8. Se añade ventana de términos y condiciones y checkbox obligatorio compartido por ambos formularios de perfil.
9. Publicidad: orden numérico ascendente (1 primero); los banners sin orden van después conservando su orden de hoja.
10. El detalle de cada mercadero/comprador muestra todos los campos disponibles del registro; el CEO puede calificar/comentar desde el panel, guardar puestos en favoritos y editar/eliminar calificaciones del historial.
11. Se redujo el intervalo inicial de consulta del estado RPC y se versionó el service worker. El tiempo real también depende de la latencia de Google Apps Script, Firebase y la red del visitante.
12. Se añade formulario CEO para publicar banners/videos por URL y guardar los datos en la hoja `publicidad`.
13. El buscador de Puestos acepta `Oficial` y números 1–5 (calificación media redondeada).

## Instalación

### A. Google Sheets

1. Haz una copia de seguridad del Google Sheets actual.
2. Abre el Google Sheets vinculado al Apps Script.
3. Confirma que las pestañas existentes se llamen exactamente `puestos`, `usuarios`, `calificaciones`, `favoritos` y `publicidad`.
4. Crea una pestaña `CEO` con estos encabezados (si no existe):
   `ID_Evento | Fecha_Hora | Accion | Hoja | Registro_ID | CEO_UID | Detalle`
   Apps Script también la crea automáticamente cuando el CEO abre el panel.
5. No cambies el orden de las columnas existentes: Apps Script usa los índices actuales del libro adjunto.

### B. Apps Script

1. Copia el contenido de `Appscript_Mercaton.gs` al proyecto Apps Script vinculado al libro.
2. En **Configuración del proyecto > Propiedades del script**, conserva/configura:
   - `FIREBASE_API_KEY`: la misma `apiKey` que usa `index.html`.
   - `CEO_UID`: UID exacto de la cuenta CEO.
   - `FIREBASE_ADMIN_DELETE_URL`: URL HTTPS de la Cloud Function desplegada.
   - `FIREBASE_ADMIN_DELETE_SECRET`: secreto compartido configurado en Firebase Secret Manager.
3. Implementa como aplicación web, ejecutar como propietario y acceso según la configuración actual de tu despliegue (el código verifica los tokens en cada POST).
4. Actualiza `APPS_SCRIPT_URL` en `index.html` solo si el despliegue genera una URL distinta. El archivo conserva la URL que tenía el código recibido.

### C. Firebase Authentication — baja real de cuentas

El Apps Script no puede borrar usuarios de Firebase Authentication de forma segura por sí solo. La carpeta `firebase-functions` incluye una función que utiliza Firebase Admin SDK en el entorno servidor.

1. En tu proyecto Firebase existente, inicializa/usa Firebase CLI.
2. Copia `firebase-functions/index.js` y `firebase-functions/package.json` a la carpeta `functions` de tu proyecto Firebase.
3. Configura el secreto:
   `firebase functions:secrets:set MERCATON_ADMIN_SECRET`
   Usa un valor largo y aleatorio. No lo publiques en GitHub ni en `index.html`.
4. Define `CEO_UID` en la configuración de despliegue de Functions con el UID de la cuenta CEO.
5. Despliega:
   `firebase deploy --only functions:eliminarCuentaMercaton`
6. Copia la URL HTTPS que devuelve Firebase a la propiedad `FIREBASE_ADMIN_DELETE_URL` de Apps Script.
7. Guarda el mismo valor secreto en `FIREBASE_ADMIN_DELETE_SECRET` de las propiedades de Apps Script.
8. Prueba primero con una cuenta de prueba. La función protege expresamente el UID CEO.

Si la función no está desplegada/configurada, el usuario queda desactivado en MERCATON/Sheets y no puede abrir sesión autorizada, pero seguirá existiendo en Firebase Authentication hasta completar esta integración.

### D. Vercel / GitHub

1. Reemplaza el `index.html`, `sw.js` y `manifest.json` del repositorio con los archivos del paquete.
2. Conserva los demás recursos estáticos del repositorio (logos, favicon, imágenes).
3. Haz commit y push a la rama que Vercel despliega.
4. Abre la plataforma y fuerza una recarga completa. El nuevo nombre de caché PWA `mercaton-pwa-v3` evita reutilizar el shell anterior.
5. Comprueba en móvil y escritorio.

## Seguridad y límites que debes conocer

- El archivo `index.html` usa Firebase Authentication; no carga Firestore ni Realtime Database. Por eso no se incluye una regla Firebase Database inventada: las hojas de Google Sheets son la base de datos que usa este código y Apps Script es el backend.
- La `apiKey` de Firebase que aparece en el HTML es un identificador público de proyecto, no una contraseña. La seguridad depende de reglas de Firebase y validación de ID Token/rol en servidor.
- No publiques el secreto de la Cloud Function en GitHub, HTML, Vercel ni mensajes.
- El texto legal añadido es una plantilla informativa y debe ser revisado por un abogado peruano antes de usarlo como documento legal definitivo.
- La aceleración no puede garantizarse solo desde el front-end. Apps Script tiene latencia propia; la mejora mayor requiere mediciones y optimización adicional del backend, especialmente lectura de hojas grandes y número de llamadas.
- La hoja `CEO` es un registro de auditoría de acciones del panel; las calificaciones y favoritos continúan en sus hojas normalizadas para no duplicar datos.
