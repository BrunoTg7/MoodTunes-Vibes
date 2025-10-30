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

    // Mapeamento de emoções para termos de busca relacionados
    const emotionKeywords = {
      feliz: [
        "happy",
        "feliz",
        "alegre",
        "joy",
        "felicidade",
        "upbeat",
        "cheerful",
      ],
      triste: [
        "sad",
        "triste",
        "tristeza",
        "melancólico",
        "depressed",
        "blue",
        "down",
      ],
      animado: [
        "energetic",
        "animado",
        "excited",
        "party",
        "dance",
        "festa",
        "high energy",
      ],
      relaxado: [
        "relax",
        "calm",
        "relaxado",
        "chill",
        "peaceful",
        "tranquilo",
        "soft",
      ],
      romântico: [
        "romantic",
        "romântico",
        "love",
        "amor",
        "romance",
        "tender",
        "sweet",
      ],
      motivado: [
        "motivated",
        "motivado",
        "inspiration",
        "inspiração",
        "motivation",
        "drive",
      ],
      nostálgico: [
        "nostalgic",
        "nostálgico",
        "oldies",
        "clássicos",
        "retro",
        "memories",
      ],
      calmo: [
        "calm",
        "calmo",
        "peace",
        "serene",
        "tranquil",
        "soothing",
        "gentle",
      ],
      apaixonado: [
        "passionate",
        "apaixonado",
        "intense",
        "deep love",
        "ardent",
      ],
      raivoso: ["angry", "raiva", "rage", "furious", "intense", "aggressive"],
      ansioso: ["anxious", "ansioso", "nervous", "tension", "worry", "stress"],
      confiante: [
        "confident",
        "confiante",
        "strong",
        "powerful",
        "bold",
        "empowered",
      ],
    };

    // Busca múltiplas vezes com diferentes termos relacionados
    const allTracks = [];
    const usedTrackIds = new Set();

    // Primeiro busca pela emoção exata (músicas recentes)
    try {
      const mainSearchResponse = await axios.get(
        "https://api.spotify.com/v1/search",
        {
          headers: { Authorization: `Bearer ${access_token}` },
          params: {
            q: `${emocao} year:2020-2025`,
            type: "track",
            limit: 20,
          },
        }
      );

      for (const track of mainSearchResponse.data.tracks.items) {
        if (!usedTrackIds.has(track.id)) {
          allTracks.push(track);
          usedTrackIds.add(track.id);
        }
      }
    } catch (error) {
      console.log("Erro na busca principal:", error.message);
    }

    // Busca por termos relacionados em inglês
    const relatedTerms = emotionKeywords[emocao.toLowerCase()] || [emocao];

    for (const term of relatedTerms.slice(0, 3)) {
      // Limita a 3 termos para não sobrecarregar
      try {
        const relatedSearchResponse = await axios.get(
          "https://api.spotify.com/v1/search",
          {
            headers: { Authorization: `Bearer ${access_token}` },
            params: {
              q: `${term} year:2020-2025`,
              type: "track",
              limit: 15,
            },
          }
        );

        for (const track of relatedSearchResponse.data.tracks.items) {
          if (!usedTrackIds.has(track.id)) {
            allTracks.push(track);
            usedTrackIds.add(track.id);
          }
        }
      } catch (error) {
        console.log(`Erro na busca por "${term}":`, error.message);
      }
    }

    // Limita a 50 músicas no total
    const tracks = allTracks.slice(0, 50);

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
