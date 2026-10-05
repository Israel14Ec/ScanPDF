# Mi Escáner PDF

Aplicación personal para Android, con Expo SDK 57, React Native y TypeScript.

## Funciones

- Botón central de escaneo y controles grandes en español.
- Google ML Kit Document Scanner en modo FULL: detección de hoja, corrección de perspectiva, recorte y filtros en su interfaz nativa.
- Escaneo de varias hojas; admite nuevas sesiones para seguir agregando páginas.
- Revisión, orden y eliminación de hojas antes de guardar.
- Nombre obligatorio; dos documentos con el mismo nombre conservan archivos independientes.
- PDF con cada hoja recortada a página completa, sin márgenes añadidos, conservando su proporción y los filtros del escáner.
- Biblioteca local con miniaturas, búsqueda, fecha y tamaño.
- Visor PDF con desplazamiento, zoom y contraseña cuando el archivo la requiera.
- Importación desde el selector de archivos y recepción mediante Compartir/Abrir con de Android.
- Compartir un PDF con su nombre mediante el menú de Android, incluyendo WhatsApp si está instalado.
- Borrador persistente para continuar después de cerrar la app.

## Ejecutar en Android

Se necesita Node compatible con SDK 57, Android SDK, Java compatible y un teléfono con depuración USB o un emulador con Google Play Services.

```sh
npm install
npm run android
```

Después de instalar la compilación de desarrollo:

```sh
npm run start:dev
```

**Expo Go no incluye el motor de escaneo ni el visor PDF.** Es necesario instalar una compilación nativa. La primera apertura del escáner puede descargar sus componentes de Google Play Services; después el procesamiento se realiza en el dispositivo.

## APK independiente con EAS

El perfil `preview` genera un APK que funciona sin Metro. Requiere una cuenta de Expo y configurar el proyecto en EAS:

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

El perfil `development` genera un cliente de desarrollo; `production` genera un AAB para Google Play. No se ha publicado ni enviado la app a una tienda.

## Arquitectura modular y hexagonal

```text
src/
  app/                      Rutas delgadas de Expo Router
  modules/
    scanner/
      domain/               Página escaneada y puerto DocumentScanner
      application/          Caso de uso ScanPages
      infrastructure/       Adaptador Google ML Kit
    documents/
      domain/               Documento, borrador y puertos
      application/          Guardar, importar, nombrar y compartir
      infrastructure/       Archivos locales, PDF, selector y compartir
      presentation/         Pantallas, componentes y estado React
  shared/ui/                Botones y tema
  composition/              Conexión entre puertos y adaptadores
tests/                      Reglas y persistencia con dobles del sistema nativo
```

El dominio y los casos de uso no importan Expo ni React Native. `composition` selecciona las implementaciones. El escáner devuelve imágenes procesadas; el documento conserva el orden que el usuario elige antes de exportarlas.

## Persistencia

Los documentos se guardan en el almacenamiento privado de la app, con un directorio por identificador, un PDF, una miniatura y metadatos JSON. Las rutas se reconstruyen al leer, permitiendo restauraciones que cambien el directorio raíz. El borrador se guarda separado y los cambios en metadatos se serializan para evitar perder el nombre al actualizar el conteo de páginas.

Los PDF importados se copian a la biblioteca para no depender de permisos temporales de otras apps. Los originales externos se conservan. Para guardar una copia fuera de la app, usa Compartir. Desinstalar la app elimina su almacenamiento local.

## Comprobaciones

```sh
npm run typecheck
npm run lint
npm test
npx expo-doctor
```

Las pruebas comprueban validación, orden, cancelación, errores de exportación, nombres repetidos, recuperación del borrador, escritura interrumpida, importación y actualización concurrente de metadatos. Los dobles de archivos reproducen las copias asíncronas de Expo SDK 57; no sustituyen las pruebas del teléfono.

## Estado de validación

- TypeScript y lint: aprobados.
- Pruebas automatizadas: 11 aprobadas.
- Expo Doctor: 21/21 comprobaciones aprobadas.
- Prebuild Android: generado correctamente mediante Expo, sin editar los archivos nativos generados.
- Bundle JavaScript Android: generado correctamente con `--no-bytecode`.
- APK y ejecución nativa: pendientes. El entorno de ejecución impide la conexión local que necesita Gradle (`Unable to establish loopback connection`) y la ejecución de `hermesc.exe`.

Antes de usarla a diario, probar en un teléfono real: detección sobre distintos fondos, sombras, filtros, varias páginas, reinicio con borrador, PDF externo y envío del archivo por WhatsApp. La memoria disponible limita el tamaño práctico de documentos muy grandes.
