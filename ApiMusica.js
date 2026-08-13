import axios from "axios";
import cors from "cors";
import "dotenv/config";
import express from "express";

const app = express();
const port = 2995;
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID || "9621477c77e34408ad5b4256d59bfd6d";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "98c164b6fcd7499095a836e4c7b2c3f7";

const emotionKeywords = {
  feliz: ["happy", "feliz", "alegre", "joy", "felicidade", "upbeat", "cheerful", "alegria"],
  triste: ["sad", "triste", "tristeza", "melancolico", "depressed", "blue", "down"],
  animado: ["energetic", "animado", "excited", "party", "dance", "festa", "high energy"],
  relaxado: ["relax", "calm", "relaxado", "chill", "peaceful", "tranquilo", "soft"],
  romântico: ["romantic", "romantico", "rometica", "romântica", "romantica", "love", "amor", "romance", "tender", "sweet"],
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
  const normalizedEmocao = stripAccents(emocao.toLowerCase());
  const normalizedEntries = Object.entries(emotionKeywords).map(([key, kws]) => {
    return [stripAccents(key.toLowerCase()), kws.map(k => stripAccents(k.toLowerCase()))];
  });

  // Check if the emotion matches a known emotion keyword exactly
  const matched = normalizedEntries.find(([key, kws]) =>
    kws.includes(normalizedEmocao) || key === normalizedEmocao
  );

  if (matched) {
    const originalKey = emotionKeywords[matched[0]] ? matched[0] : null;
    return emotionKeywords[originalKey] || emotionKeywords[matched[0]] || [emocao];
  }

  // Check if any emotion keyword contains the input or vice versa
  for (const [key, kws] of normalizedEntries) {
    for (const kw of kws) {
      if (kw.includes(normalizedEmocao) || normalizedEmocao.includes(kw)) {
        return emotionKeywords[key] || [emocao];
      }
    }
  }

  return [emocao];
}

let storedSpotifyToken = null;
let storedSpotifyState = null;
let cachedClientIdToken = null;
let cachedTokenExpiry = 0;

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getSpotifyToken() {
  // First check for user OAuth token
  if (storedSpotifyToken) return storedSpotifyToken;

  // Check cache for client credentials token
  const now = Date.now();
  if (cachedClientIdToken && now < cachedTokenExpiry) {
    return cachedClientIdToken;
  }

  // Fall back to client credentials for dev/public usage
  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    cachedClientIdToken = tokenResponse.data.access_token;
    cachedTokenExpiry = now + (tokenResponse.data.expires_in - 60) * 1000;
    return cachedClientIdToken;
  } catch (error) {
    console.error("Failed to get Spotify token:", error.response?.status);
    return null;
  }
}

async function searchSpotify(token, query) {
  try {
    const searchResponse = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, type: "track", limit: 10 },
    });
    return searchResponse.data.tracks.items;
  } catch (error) {
    if (error.response?.status === 403) {
      console.error("Spotify search forbidden (invalid credentials or permissions)");
    } else {
      console.error("Erro na busca Spotify:", error.message);
    }
    return [];
  }
}

async function searchDeezer(query) {
  try {
    const searchResponse = await axios.get(
      `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    return searchResponse.data.data || [];
  } catch (error) {
    console.error("Erro na busca Deezer:", error.message);
    return [];
  }
}

function normalizeTracks(spotifyTracks, deezerTracks) {
  const normalized = [];
  for (const t of spotifyTracks) {
    const img = t.album?.images?.[0];
    normalized.push({
      nome: t.name,
      artista: t.artists?.[0]?.name || "Unknown Artist",
      id: t.id,
      link: t.external_urls?.spotify || null,
      cover: img ? img.url : null,
      preview_url: t.preview_url,
      source: "spotify",
      popularity: t.popularity,
    });
  }
  for (const t of deezerTracks) {
    const img = t.album?.cover_big || t.album?.cover_medium || t.album?.cover || `https://placehold.co/640x640/5D36B4/ffffff?text=No+Image`;
    normalized.push({
      nome: t.title,
      artista: t.artist?.name || "Unknown Artist",
      id: t.id,
      link: t.link,
      cover: img,
      preview_url: t.preview,
      source: "deezer",
      popularity: t.rank || 0,
    });
  }
  return normalized;
}

function deduplicateAndSort(tracks) {
  const normalizeScore = (track) => {
    if (track.source === "spotify") return track.popularity || 0;
    if (track.source === "deezer") return Math.min((track.popularity || 0) / 10000, 100);
    return 0;
  };
  
  tracks.sort((a, b) => normalizeScore(b) - normalizeScore(a));
  const seenIds = new Set();
  const unique = [];
  for (const t of tracks) {
    if (!seenIds.has(t.id)) {
      seenIds.add(t.id);
      unique.push(t);
    }
  }
  return unique.slice(0, 20);
}

app.get("/api/auth/spotify", (req, res) => {
  const redirectUri = "https://moodtunesvibes.vercel.app/api/auth/callback";
  const state = generateRandomString(16);
  storedSpotifyState = state;

  const authorizeUrl = "https://accounts.spotify.com/authorize?" + new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "user-read-playlist user-read-current-state",
    state: state
  });

  res.json({ authorizeUrl });
});

app.get("/api/auth/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: "Código de autorização não fornecido" });
  }

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "https://moodtunesvibes.vercel.app/api/auth/callback",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResponse.data.access_token;
    storedSpotifyToken = accessToken;

    res.json({ success: true, token: accessToken, expiresIn: tokenResponse.data.expires_in });
  } catch (error) {
    console.error("Erro ao obter token Spotify:", error.message);
    res.status(500).json({ error: "Erro ao obter token do Spotify" });
  }
});

app.get("/api/talalamusic", async (req, res) => {
  const emocao = req.query.emocao;

  if (!emocao) {
    return res.status(400).json({ error: "Emoção não fornecida" });
  }

  try {
    const token = await getSpotifyToken();
    const keywords = getEmotionKeywords(emocao);

    const [spotifyRes, deezerRes] = await Promise.all([
      token ? 
        (async () => {
          const searches = keywords.map((kw) => searchSpotify(token, kw));
          const results = await Promise.all(searches);
          return [].concat(...results);
        })() : [],

      (async () => {
        const searches = keywords.map((kw) => searchDeezer(kw));
        const results = await Promise.all(searches);
        return [].concat(...results);
      })(),
    ]);

    const normalized = normalizeTracks(spotifyRes, deezerRes);
    const topTracks = deduplicateAndSort(normalized);

    res.json({
      emocao: emocao,
      quantidade: topTracks.length,
      musicas: topTracks,
      spotifyAvailable: token !== null,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.listen(port, () => {
  console.log(`App rodando em http://127.0.0.1:${port}/api/talalamusic?emocao=feliz`);
});