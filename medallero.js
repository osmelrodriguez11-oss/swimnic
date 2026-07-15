export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, nombre, siglas, logo_url FROM clubes ORDER BY nombre ASC`
  ).all();
  return Response.json(results);
}
