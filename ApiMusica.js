import express from "express";
import axios from "axios";
import querystring from "querystring";
import "dotenv/config";
import cors from "cors";

const app = express();
const port = 2995;
app.use(cors());

app.get("/talalamusic", async (req, res) => {
  const emocao = req.query.emocao;

  if (!emocao) {
    return res.status(400).json({ error: "Emoção não fornecida" });
  }

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
  const searchResponse = await axios.get("https://api.spotify.com/v1/search", {
    headers: { Authorization: `Bearer ${access_token}` },
    params: {
      q: emocao,
      type: "track",
      limit: 10,
    },
  });

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
});

app.listen(port, () => {
  console.log(
    `App rodando em http://127.0.0.1:${port}/talalamusic?emocao=feliz`
  );
});
