# SwimNIC — despliegue en Cloudflare

## Requisitos
- Cuenta de Cloudflare (gratis)
- Node.js instalado
- `npm install -g wrangler` (CLI de Cloudflare)

## 1. Login
```
wrangler login
```

## 2. Crear la base de datos D1
```
wrangler d1 create swimnic-db
```
Esto imprime un `database_id`. Cópialo y pégalo en `wrangler.toml`, en el
campo `database_id`.

## 3. Aplicar el esquema y los datos de muestra
```
wrangler d1 execute swimnic-db --remote --file=./migrations/0001_init.sql
wrangler d1 execute swimnic-db --remote --file=./migrations/0002_seed.sql
```
(Quita el paso del seed cuando quieras arrancar limpio con datos reales.)

## 4. Crear el proyecto de Pages
```
wrangler pages project create swimnic
```

## 5. Configurar el token de importación
En el dashboard de Cloudflare → Workers & Pages → swimnic → Settings →
Environment variables, agrega:
```
IMPORT_TOKEN = un-token-secreto-que-tu-elijas
```
Este es el mismo valor que usarás en `hytek-bridge-connector.js`.

## 6. Enlazar la base de datos D1 al proyecto de Pages
En el mismo dashboard → Settings → Functions → D1 database bindings:
```
Variable name: DB
D1 database: swimnic-db
```

## 7. Deploy
Desde la carpeta del proyecto:
```
wrangler pages deploy .
```

Cada vez que hagas cambios en `index.html` o en `functions/api/*.js`, repite
este último comando.

## Cómo entran los resultados
1. Tu Hy-Tek Bridge decodifica el `.mdb` de Meet Manager en el navegador
   (esto ya lo tienes construido).
2. Pega la función de `hytek-bridge-connector.js` en ese proyecto y llámala
   con los datos ya parseados, apuntando a tu dominio real de Cloudflare
   Pages (ej. `https://swimnic.pages.dev`) y el `IMPORT_TOKEN` del paso 5.
3. El sitio público (medallero, resultados, pruebas) se actualiza solo,
   porque lee directo de D1 en cada carga de página.

## Estructura del proyecto
```
swimnic/
  index.html                     ← sitio público (fetch a /api/*)
  wrangler.toml                  ← config de Cloudflare
  hytek-bridge-connector.js      ← snippet para pegar en Hy-Tek Bridge
  migrations/
    0001_init.sql                ← esquema de tablas
    0002_seed.sql                ← datos de muestra (opcional)
  functions/api/
    eventos.js                   ← GET lista de campeonatos
    pruebas.js                   ← GET pruebas por evento/sexo
    resultados.js                ← GET últimos resultados (paginado)
    medallero.js                 ← GET medallero por club
    clubes.js                    ← GET clubes participantes
    importar.js                  ← POST ingreso de resultados (protegido)
```

## Siguientes pasos sugeridos
- Selector de evento en el sitio (hoy está fijo en `EVENTO_ID = 1`), útil
  en cuanto tengas más de un campeonato en la base de datos.
- Página de perfil de nadador con histórico de tiempos.
- Página de perfil de club con su plantel.
- Panel de administración simple para editar `pruebas`/`clubes` a mano,
  sin depender solo del import de Hy-Tek.
