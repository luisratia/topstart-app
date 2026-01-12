export async function onRequest(context) {
  const { env } = context;
  const DATABASE_URL = env.DATABASE_URL;

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(DATABASE_URL);

    // Consulta a tu tabla única
    const resultado = await sql`SELECT * FROM tienda_data LIMIT 1`;

    if (!resultado || resultado.length === 0) {
      return new Response(JSON.stringify({ error: "No hay datos" }), { status: 404 });
    }

    const datos = resultado[0];
    const respuesta = {
      tasa: parseFloat(datos.tasa) || 4050,
      productos: datos.productos || []
    };

    return new Response(JSON.stringify(respuesta), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}