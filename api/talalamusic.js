import axios from "axios";

function stripAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getEmotionKeywords(emotionKeywords, emocao) {
  const normalizedEmocao = stripAccents(emocao.toLowerCase());
  const normalizedEntries = Object.entries(emotionKeywords).map(([key, kws]) => {
    return [stripAccents(key.toLowerCase()), kws.map(k => stripAccents(k.toLowerCase()))];
  });

  const matched = normalizedEntries.find(([key, kws]) =>
    kws.includes(normalizedEmocao) || key === normalizedEmocao
  );

  if (matched) {
    return emotionKeywords[matched[0]] || emotionKeywords[matched[0]] || [emocao];
  }

  for (const [key, kws] of normalizedEntries) {
    for (const kw of kws) {
      if (kw.includes(normalizedEmocao) || normalizedEmocao.includes(kw)) {
        return emotionKeywords[key] || [emocao];
      }
    }
  }

  return [emocao];
}

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
        "alegria",
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
        "romantico",
        "rometica",
        "romântica",
        "romantica",
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

    // Obter token Spotify
    let spotifyTracks = [];
    try {
      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.CLIENT_ID || " ",
          client_secret: process.env.CLIENT_SECRET || " ",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      const token = tokenResponse.data.access_token;

      // Buscar por termos relacionados na Spotify
      const keywords = getEmotionKeywords(emotionKeywords, emocao);
      const spotifySearches = keywords.map((kw) =>
        axios.get("https://api.spotify.com/v1/search", {
          params: { q: kw, type: "track", limit: 5 },
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      const spotifyResults = await Promise.all(spotifySearches);
      spotifyTracks = [].concat(...spotifyResults).map((t) => ({
        nome: t.name,
        artista: t.artists[0].name,
        id: t.id,
        link: t.external_urls?.spotify,
        cover: t.album?.images?.[0]?.url || null,
        preview_url: t.preview_url,
        source: "spotify",
        popularity: t.popularity,
      }));
    } catch (e) {
      console.error("Spotify search failed:", e.message);
    }

    // Deezer search por termos relacionados
    let deezerTracks = [];
    try {
      const keywords = getEmotionKeywords(emotionKeywords, emocao);
      const deezerSearches = keywords.map((kw) =>
        axios.get(`https://api.deezer.com/search/track?q=${encodeURIComponent(kw)}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
        })
      );
      const deezerResults = await Promise.all(deezerSearches);
      deezerTracks = [].concat(...deezerResults).map((t) => ({
        nome: t.title,
        artista: t.artist.name,
        id: t.id,
        link: t.link,
        cover: t.album?.cover_big || t.album?.cover_medium || t.album?.cover || "https://placehold.co/640x640/5D36B4/ffffff?text=No+Image",
        preview_url: t.preview,
        source: "deezer",
        popularity: t.rank || 0,
      }));
    } catch (e) {
      console.error("Deezer search failed:", e.message);
    }

    // Combinar e processar
    const allTracks = [...spotifyTracks, ...deezerTracks];

    // Normalizar popularidade (Spotify: 0-100, Deezer: rank ~0-1M)
    const normalizeScore = (track) => {
      if (track.source === "spotify") return track.popularity || 0;
      if (track.source === "deezer") return Math.min((track.popularity || 0) / 10000, 100);
      return 0;
    };

    allTracks.sort((a, b) => {
      if (a.source === "deezer" && b.source === "spotify") return normalizeScore(b) - normalizeScore(a);
      if (a.source === "spotify" && b.source === "deezer") return normalizeScore(b) - normalizeScore(a);
      return normalizeScore(b) - normalizeScore(a);
    });

    // Deduplicar por ID
    const seenIds = new Set();
    const uniqueTracks = [];
    for (const track of allTracks) {
      if (!seenIds.has(track.id)) {
        seenIds.add(track.id);
        uniqueTracks.push(track);
      }
    }

    // Limitar a top 20
    const topTracks = uniqueTracks.slice(0, 20);

    res.json({
      emocao: emocao,
      quantidade: topTracks.length,
      musicas: topTracks,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}