export async function onRequest(context) {
  const { request, env } = context;
  const DATABASE_URL = env.DATABASE_URL;

  // 1. Verificación de seguridad
  if (!DATABASE_URL) {
    return new Response(JSON.stringify({ error: "Falta DATABASE_URL" }), { status: 500 });
  }

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(DATABASE_URL);

    // --- CASO 1: LOUIS GUARDA DATOS (POST) ---
    if (request.method === "POST") {
      const body = await request.json();
      const { tasa, productos } = body;

      // Actualizamos la fila id=1 (o la creamos si no existe)
      // Usamos ON CONFLICT para que siempre sea la misma fila la que se sobreescriba
      await sql`
        INSERT INTO tienda_data (id, tasa, productos) 
        VALUES (1, ${tasa}, ${JSON.stringify(productos)})
        ON CONFLICT (id) DO UPDATE 
        SET tasa = EXCLUDED.tasa, productos = EXCLUDED.productos
      `;

      return new Response(JSON.stringify({ mensaje: "Guardado con éxito" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // --- CASO 2: EL CLIENTE VE LOS PRODUCTOS (GET) ---
    const resultado = await sql`SELECT * FROM tienda_data WHERE id = 1 LIMIT 1`;

    if (!resultado || resultado.length === 0) {
      // Si la base está vacía, enviamos un estado inicial
      return new Response(JSON.stringify({ tasa: 4050, productos: [] }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const datos = resultado[0];
    return new Response(JSON.stringify({
      tasa: parseFloat(datos.tasa),
      productos: typeof datos.productos === 'string' ? JSON.parse(datos.productos) : datos.productos
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}