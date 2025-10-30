import axios from "axios";
import querystring from "querystring";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { emocao } = req.query;

  if (!emocao) {
    return res.status(400).json({ error: "Emoção não fornecida" });
  }

  try {
    // Gera token via Client Credentials
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "client_credentials",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const access_token = tokenResponse.data.access_token;

    // Busca músicas por emoção
    const searchResponse = await axios.get(
      "https://api.spotify.com/v1/search",
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: {
          q: emocao,
          type: "track",
          limit: 10,
        },
      }
    );

    const tracks = searchResponse.data.tracks.items;

    const resultado = tracks.map((track) => ({
      nome: track.name,
      artista: track.artists[0].name,
      id: track.id,
      link: track.external_urls.spotify,
      cover:
        track.album && track.album.images && track.album.images.length > 0
          ? track.album.images[0].url
          : null,
      preview_url: track.preview_url,
    }));

    res.json({
      emocao: emocao,
      quantidade: resultado.length,
      musicas: resultado,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
