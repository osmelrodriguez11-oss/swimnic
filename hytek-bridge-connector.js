// Pega esta función en tu Hy-Tek Bridge (o donde ya tengas el .mdb decodificado
// en el navegador). Se llama una vez por cada prueba ya decodificada.
//
// IMPORT_TOKEN debe coincidir con la variable de entorno IMPORT_TOKEN
// configurada en Cloudflare Pages (Settings → Environment variables).

async function enviarResultadosASwimNIC({ eventoId, prueba, resultados, apiBase, importToken }) {
  const res = await fetch(`${apiBase}/api/importar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${importToken}`
    },
    body: JSON.stringify({
      evento_id: eventoId,
      prueba: {
        codigo: prueba.codigo,       // ej "E05"
        nombre: prueba.nombre,       // ej "1500m Libre"
        categoria: prueba.categoria, // ej "Abierta" o "13-14"
        sexo: prueba.sexo,           // "F" | "M" | "X"
        estilo: prueba.estilo,       // ej "Libre"
        distancia: prueba.distancia  // ej 1500
      },
      resultados: resultados.map(r => ({
        nadador: r.nombreCompleto,
        club: r.club,
        tiempo: r.tiempoFormateado,       // ej "16:42.10"
        tiempo_centesimas: r.centesimas,  // ej 100210 (para ordenar)
        posicion: r.posicion,             // 1, 2, 3...
        serie: r.serie,
        ronda: r.ronda                    // "Prelim" | "Final"
      }))
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Error al importar: ${err.error || res.status}`);
  }
  return res.json();
}

// Ejemplo de uso dentro de tu Hy-Tek Bridge, después de parsear el .mdb:
//
// await enviarResultadosASwimNIC({
//   eventoId: 1,
//   prueba: pruebaDecodificada,
//   resultados: resultadosDecodificados,
//   apiBase: 'https://swimnic.pages.dev',
//   importToken: 'TU_TOKEN_SECRETO'
// });
