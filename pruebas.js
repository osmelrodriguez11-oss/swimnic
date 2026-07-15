export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const eventoId = url.searchParams.get('evento_id') || 1;
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '8');
  const offset = (page - 1) * limit;

  const { results } = await env.DB.prepare(
    `SELECT r.id, p.codigo, p.nombre AS prueba, n.nombre AS nadador,
            c.nombre AS club, r.tiempo, r.posicion, r.medalla, r.ronda, r.estado
     FROM resultados r
     JOIN pruebas p ON p.id = r.prueba_id
     JOIN nadadores n ON n.id = r.nadador_id
     JOIN clubes c ON c.id = r.club_id
     WHERE p.evento_id = ?
     ORDER BY r.creado_en DESC
     LIMIT ? OFFSET ?`
  ).bind(eventoId, limit, offset).all();

  const { results: countRows } = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM resultados r
     JOIN pruebas p ON p.id = r.prueba_id WHERE p.evento_id = ?`
  ).bind(eventoId).all();

  return Response.json({
    data: results,
    page,
    limit,
    total: countRows[0].total
  });
}
