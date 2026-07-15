// Recibe el JSON ya decodificado por Hy-Tek Bridge (en el navegador) y lo
// escribe en D1. Protegido con un token simple vía header Authorization.
//
// Cuerpo esperado:
// {
//   "evento_id": 1,
//   "prueba": { "codigo":"E05", "nombre":"1500m Libre", "categoria":"Abierta",
//               "sexo":"F", "estilo":"Libre", "distancia":1500 },
//   "resultados": [
//     { "nadador":"Nombre Apellido", "club":"Swim Tigers", "tiempo":"16:42.10",
//       "tiempo_centesimas":100210, "posicion":1, "serie":"1", "ronda":"Final" }
//   ]
// }

async function getOrCreateClub(env, nombre) {
  if (!nombre) return null;
  const existing = await env.DB.prepare(`SELECT id FROM clubes WHERE nombre = ?`).bind(nombre).first();
  if (existing) return existing.id;
  const inserted = await env.DB.prepare(`INSERT INTO clubes (nombre) VALUES (?)`).bind(nombre).run();
  return inserted.meta.last_row_id;
}

async function getOrCreateNadador(env, nombre, clubId, categoria, sexo) {
  const existing = await env.DB.prepare(
    `SELECT id FROM nadadores WHERE nombre = ? AND club_id = ?`
  ).bind(nombre, clubId).first();
  if (existing) return existing.id;
  const inserted = await env.DB.prepare(
    `INSERT INTO nadadores (nombre, club_id, categoria, sexo) VALUES (?,?,?,?)`
  ).bind(nombre, clubId, categoria || null, sexo || null).run();
  return inserted.meta.last_row_id;
}

async function getOrCreatePrueba(env, eventoId, prueba) {
  const existing = await env.DB.prepare(
    `SELECT id FROM pruebas WHERE evento_id = ? AND codigo = ? AND categoria = ? AND sexo = ?`
  ).bind(eventoId, prueba.codigo, prueba.categoria, prueba.sexo).first();
  if (existing) return existing.id;
  const inserted = await env.DB.prepare(
    `INSERT INTO pruebas (evento_id, codigo, nombre, categoria, sexo, estilo, distancia, tiene_resultados)
     VALUES (?,?,?,?,?,?,?,0)`
  ).bind(eventoId, prueba.codigo, prueba.nombre, prueba.categoria, prueba.sexo, prueba.estilo || null, prueba.distancia || null).run();
  return inserted.meta.last_row_id;
}

function medallaDe(posicion) {
  if (posicion === 1) return 'oro';
  if (posicion === 2) return 'plata';
  if (posicion === 3) return 'bronce';
  return null;
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  if (auth !== `Bearer ${env.IMPORT_TOKEN}`) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  const { evento_id, prueba, resultados } = body;
  if (!evento_id || !prueba || !Array.isArray(resultados)) {
    return new Response(JSON.stringify({ error: 'Formato de payload incorrecto' }), { status: 400 });
  }

  const pruebaId = await getOrCreatePrueba(env, evento_id, prueba);

  for (const r of resultados) {
    const clubId = await getOrCreateClub(env, r.club);
    const nadadorId = await getOrCreateNadador(env, r.nadador, clubId, prueba.categoria, prueba.sexo);
    const medalla = r.medalla || medallaDe(r.posicion);

    await env.DB.prepare(
      `INSERT INTO resultados
        (prueba_id, nadador_id, club_id, tiempo, tiempo_centesimas, posicion, medalla, serie, ronda, estado)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      pruebaId, nadadorId, clubId,
      r.tiempo || null, r.tiempo_centesimas || null, r.posicion || null,
      medalla, r.serie || null, r.ronda || 'Final', r.estado || 'oficial'
    ).run();
  }

  await env.DB.prepare(`UPDATE pruebas SET tiene_resultados = 1 WHERE id = ?`).bind(pruebaId).run();

  return Response.json({ ok: true, prueba_id: pruebaId, insertados: resultados.length });
}
