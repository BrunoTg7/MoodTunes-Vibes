import axios from "axios";

const CLIENT_ID = process.env.CLIENT_ID || "9621477c77e34408ad5b4256d59bfd6d";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "98c164b6fcd7499095a836e4c7b2c3f7";

const emotionKeywords = {
  feliz: ["happy", "feliz", "alegre", "joy", "felicidade", "upbeat", "cheerful", "alegria"],
  triste: ["sad", "triste", "tristeza", "melancolico", "depressed", "blue", "down"],
  animado: ["energetic", "animado", "excited", "party", "dance", "festa", "high energy"],
  relaxado: ["relax", "calm", "relaxado", "chill", "peaceful", "tranquilo", "soft"],
  romântico: ["romantic", "romantico", "rometica", "romantica", "love", "amor", "romance", "tender", "sweet"],
  motivado: ["motivated", "motivado", "inspiration", "inspiracao", "motivation", "drive"],
  nostálgico: ["nostalgic", "nostalgico", "oldies", "classicos", "retro", "memories"],
  calmo: ["calm", "calmo", "peace", "serene", "tranquil", "soothing", "gentle"],
  apaixonado: ["passionate", "apaixonado", "intense", "deep love", "ardent"],
  raivoso: ["angry", "raiva", "rage", "furious", "intense", "aggressive"],
  ansioso: ["anxious", "ansioso", "nervous", "tension", "worry", "stress"],
  confiante: ["confident", "confiante", "strong", "powerful", "bold", "empowered"],
};

function stripAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getEmotionKeywords(emocao) {
  const normalized = stripAccents(emocao.toLowerCase());
  for (const [key, kws] of Object.entries(emotionKeywords)) {
    const nk = stripAccents(key.toLowerCase());
    const nkw = kws.map(k => stripAccents(k.toLowerCase()));
    if (nkw.includes(normalized) || nk === normalized) {
      return kws;
    }
  }
  for (const [key, kws] of Object.entries(emotionKeywords)) {
    const nk = stripAccents(key.toLowerCase());
    const nkw = kws.map(k => stripAccents(k.toLowerCase()));
    for (const kw of nkw) {
      if (kw.includes(normalized) || normalized.includes(kw)) {
        return emotionKeywords[key];
      }
    }
  }
  return [emocao];
}

export default async function handler(req, res) {
  console.error("[Handler] Start:", req.query.emocao);
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { emocao } = req.query;
  if (!emocao) return res.status(400).json({ error: "Emoção não fornecida" });

  try {
    const keywords = getEmotionKeywords(emocao).slice(0, 2); // apenas 2 keywords
    let spotifyTracks = [];
    
    // Spotify (opcional, com timeout curto)
    try {
      const tokenRes = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 5000 }
      );
      const token = tokenRes.data.access_token;
      
      const searches = keywords.map(kw => 
        axios.get("https://api.spotify.com/v1/search", {
          params: { q: kw, type: "track", limit: 5 },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 3000
        }).catch(() => ({ data: { tracks: { items: [] } } }))
      );
      
      const results = await Promise.allSettled(searches);
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.data.tracks?.items) {
          for (const t of r.value.data.tracks.items) {
            spotifyTracks.push({
              nome: t.name,
              artista: t.artists?.[0]?.name || "Unknown",
              id: t.id,
              link: t.external_urls?.spotify,
              cover: t.album?.images?.[0]?.url || null,
              preview_url: t.preview_url,
              source: "spotify",
              popularity: t.popularity || 0,
            });
          }
        }
      }
    } catch (e) {
      console.error("Spotify error:", e.message);
    }

    // Deezer (principal, com timeout)
    let deezerTracks = [];
    try {
      const searches = keywords.map(kw =>
        axios.get(`https://api.deezer.com/search/track?q=${encodeURIComponent(kw)}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 5000
        }).catch(() => ({ data: { data: [] } }))
      );
      
      const results = await Promise.allSettled(searches);
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.data?.data) {
          for (const t of r.value.data.data) {
            deezerTracks.push({
              nome: t.title,
              artista: t.artist?.name || "Unknown",
              id: t.id,
              link: t.link,
              cover: t.album?.cover_big || t.album?.cover_medium || t.album?.cover || "https://placehold.co/640x640/5D36B4/ffffff?text=No+Image",
              preview_url: t.preview,
              source: "deezer",
              popularity: t.rank || 0,
            });
          }
        }
      }
      console.error("[Handler] Deezer got:", deezerTracks.length, "tracks");
    } catch (e) {
      console.error("Deezer error:", e.message, e.code);
    }

    // Combine
    const allTracks = [...spotifyTracks, ...deezerTracks];
    const score = t => t.source === "spotify" ? t.popularity || 0 : Math.min((t.popularity || 0) / 10000, 100);
    allTracks.sort((a, b) => score(b) - score(a));
    
    const seen = new Set();
    const unique = [];
    for (const t of allTracks) {
      if (!seen.has(t.id)) { seen.add(t.id); unique.push(t); }
    }
    
    return res.json({ emocao, quantidade: unique.slice(0, 20).length, musicas: unique.slice(0, 20) });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ error: "Erro interno" });
  }
}