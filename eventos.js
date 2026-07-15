export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, nombre, sede, fecha_inicio, fecha_fin, estado FROM eventos ORDER BY fecha_inicio DESC`
  ).all();
  return Response.json(results);
}
