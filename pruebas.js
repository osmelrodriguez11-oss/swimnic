export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const eventoId = url.searchParams.get('evento_id') || 1;
  const sexo = url.searchParams.get('sexo');

  let query = `SELECT id, codigo, nombre, categoria, sexo, tiene_resultados
               FROM pruebas WHERE evento_id = ?`;
  const params = [eventoId];

  if (sexo) {
    query += ` AND sexo = ?`;
    params.push(sexo);
  }
  query += ` ORDER BY orden ASC`;

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return Response.json(results);
}
