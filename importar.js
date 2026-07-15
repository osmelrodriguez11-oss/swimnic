export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const eventoId = url.searchParams.get('evento_id') || 1;

  const { results } = await env.DB.prepare(
    `SELECT c.id, c.nombre AS club, c.logo_url,
       SUM(CASE WHEN r.medalla = 'oro' THEN 1 ELSE 0 END) AS oro,
       SUM(CASE WHEN r.medalla = 'plata' THEN 1 ELSE 0 END) AS plata,
       SUM(CASE WHEN r.medalla = 'bronce' THEN 1 ELSE 0 END) AS bronce,
       SUM(CASE WHEN r.medalla IS NOT NULL THEN 1 ELSE 0 END) AS total
     FROM resultados r
     JOIN pruebas p ON p.id = r.prueba_id
     JOIN clubes c ON c.id = r.club_id
     WHERE p.evento_id = ?
     GROUP BY c.id
     HAVING total > 0
     ORDER BY oro DESC, plata DESC, bronce DESC`
  ).bind(eventoId).all();

  return Response.json(results);
}
