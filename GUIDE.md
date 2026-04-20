# Learn English

App de vocabulario con repeticion espaciada, construida con React, Vite y Capacitor.

## Lo que hace esta version

- Menu mobile-first con una sola accion principal: aprender palabras.
- Lotes de 10 palabras nuevas.
- Nuevas tarjetas: requieren 3 aciertos.
- Repasos: aparecen en dia +1, dia +7 y dia +30.
- Si fallas una vieja, vuelve como bonus al dia siguiente.
- Persistencia local en el dispositivo.
- Recordatorio diario configurable.
- Soporte web y Android con Capacitor.

## Ejecutar como web

```bash
cmd /c npm install
cmd /c npm run dev
```

## Preparar Android localmente

```bash
cmd /c npm run android:sync
```

Eso recompila la web y sincroniza los archivos con la carpeta `android/`.

## Generar APK online con GitHub Actions

1. Ve a la pestana `Actions`.
2. Ejecuta el workflow `Build Android APK`.
3. Cuando termine, descarga el artefacto `learn-english-debug-apk`.
4. Instala el archivo `app-debug.apk` en tu telefono Android.

El workflow genera la carpeta Android en la nube si todavia no esta en el repo, asi que no necesitas subir un proyecto Android pesado para sacar el primer APK.

## Notas

- El APK generado por GitHub Actions es `debug`, ideal para instalarlo manualmente en tu telefono.
- Para publicar en Play Store despues, convendra agregar firma release.
- En Android con Capacitor, el recordatorio diario usa notificaciones locales nativas.
