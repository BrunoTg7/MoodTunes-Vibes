import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./App.css";
import InputEmocao from "./components/SearchForm";

function App() {
  const [emocao, setEmocao] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseEmotion, setResponseEmotion] = useState("");
  const [floatingIcons, setFloatingIcons] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const vantaRef = useRef<any>(null);
  useEffect(() => {
    const initVanta = async () => {
      // @ts-ignore
      const GLOBE = (await import("vanta/dist/vanta.globe.min")).default;
      const bgElement = document.getElementById("vanta-bg");
      if (!bgElement || vantaRef.current) {
        return;
      }

      try {
        console.log("GLOBE:", GLOBE);
        vantaRef.current = GLOBE({
          el: bgElement,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x8a63f5,
          backgroundColor: null,
          size: 0.8,
          speed: 0.5,
          points: 20.0,
        });

        console.log("Vanta inicializado com sucesso");

        return () => {
          if (vantaRef.current) {
            vantaRef.current.destroy();
            vantaRef.current = null;
          }
        };
      } catch (error) {
        console.error("Erro ao inicializar Vanta:", error);
      }
    };

    initVanta();
  }, []);

  useEffect(() => {
    const icons = [];
    for (let i = 0; i < 8; i++) {
      icons.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
      });
    }
    setFloatingIcons(icons);
  }, []);

  const handleSearch = async () => {
    if (!emocao.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const apiUrl = `http://127.0.0.1:2995/talalamusic?emocao=${encodeURIComponent(
        emocao
      )}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Erro HTTP! Status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data.musicas || []);
      setResponseEmotion(data.emocao || emocao);
    } catch (error) {
      console.error("Error fetching data:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        id="vanta-bg"
        className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-900 to-blue-700"
      ></div>
      <div className="container mx-auto px-4 py-12 max-w-5xl text-white">
        <div className="text-center mb-16 relative h-64">
          {/* Ícones de notas musicais flutuantes */}
          {floatingIcons.map((icon) => (
            <div
              key={icon.id}
              className="absolute music-note"
              style={{
                left: icon.left,
                top: icon.top,
                animationDelay: icon.delay,
              }}
            >
              <svg
                className="w-6 h-6 text-pink-300"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
          ))}
          <div className="absolute -top-20 left-1/4 music-note">
            <svg
              className="w-10 h-10"
              style={{ color: "#f472b6" }}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div
            className="absolute -top-20 right-0 music-note"
            style={{ animationDelay: "0.5s" }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: "#a855f7" }}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div
            className="absolute top-40 left-1/2 transform -translate-x-1/2 music-note"
            style={{ animationDelay: "1s" }}
          >
            <svg
              className="w-12 h-12"
              style={{ color: "#60a5fa" }}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur opacity-75 animate-spin-slow"></div>
              <svg
                className="w-24 h-24 relative z-10 pulse"
                style={{ color: "#ffffff" }}
                xmlns="http://www.w3.org/2000/svg"
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
            MoodTunes Vibes
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Encontre a trilha sonora perfeita para o seu momento
          </p>
        </div>
        <div className="glass-effect rounded-3xl p-8 shadow-2xl mb-16 transform transition-all hover:scale-105">
          <div className="mb-6">
            <label>Como você está se sentindo hoje?</label>
            <div className="relative">
              <div className="flex space-x-3">
                <InputEmocao
                  ref={inputRef}
                  value={emocao}
                  onChange={(e) => setEmocao(e.target.value)}
                  onEnter={handleSearch}
                  placeholder="Feliz, Triste, Animado, Relaxado..."
                  className=" flex-grow md:px-6 md:py-4 rounded-xl bg-white bg-opacity-20 border-2 border-white border-opacity-30 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 placeholder-white placeholder-opacity-70 text-sm md:text-lg pl-2 -ml-2"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center whitespace-nowrap"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  Buscar
                </button>
              </div>
            </div>
            <p className="text-sm mt-2 opacity-80">
              Exemplos: Romântico, Motivado, Nostálgico, Calmo
            </p>
          </div>
        </div>
        <div id="results">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-8">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur opacity-75 animate-spin-slow"></div>
                <div className="relative z-10 flex items-center justify-center bg-white bg-opacity-20 rounded-full w-20 h-20">
                  <svg
                    className="w-10 h-10 animate-pulse"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                  </svg>
                </div>
              </div>
              <p className="text-lg">
                Procurando músicas que combinam com "{emocao}"...
              </p>
            </div>
          )}
          {results.length > 0 && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold mb-2">
                  Músicas para "
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
                    {responseEmotion}
                  </span>
                  "
                </h2>
                <p className="text-xl opacity-80">
                  {results.length} {results.length > 1 ? "músicas" : "música"}{" "}
                  encontrada{results.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {results.map((track: any) => {
                  const spotifyEmbedUrl = `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`;
                  const spotifyTrackLink =
                    track.link || `https://open.spotify.com/track/${track.id}`;
                  const coverUrl =
                    track.cover ||
                    `https://placehold.co/640x640/5D36B4/ffffff?text=${
                      track.nome?.substring(0, 1) || "M"
                    }${track.artista?.substring(0, 1) || "A"}`;
                  const randomBg = [
                    "bg-gradient-to-br from-yellow-400 to-pink-500",
                    "bg-gradient-to-br from-blue-400 to-purple-600",
                    "bg-gradient-to-br from-green-400 to-teal-500",
                    "bg-gradient-to-br from-red-400 to-orange-500",
                    "bg-gradient-to-br from-indigo-400 to-teal-600",
                  ];
                  const bgColor =
                    track.bgColor ||
                    randomBg[Math.floor(Math.random() * randomBg.length)];

                  return (
                    <div
                      key={track.id}
                      className="card rounded-2xl p-4 flex flex-col group transition-shadow duration-300 hover:shadow-pink-500/50"
                    >
                      <div className="relative mb-4 overflow-hidden rounded-xl">
                        <div
                          className={`absolute inset-0 z-0 opacity-80 ${bgColor}`}
                        ></div>
                        <a
                          href={spotifyTrackLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative z-10 cursor-pointer"
                        >
                          <img
                            src={coverUrl}
                            alt={`${track.nome} Cover`}
                            className="w-full aspect-square object-cover relative z-10 transform group-hover:scale-105 transition-transform duration-500 rounded-xl"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://placehold.co/640x640/5D36B4/ffffff?text=Música";
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                            <button className="bg-white rounded-full p-4 shadow-xl transform transition-all duration-300 hover:scale-110 active:scale-90">
                              <svg
                                className="w-8 h-8 text-purple-600"
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15,3 21,3 21,9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                              </svg>
                            </button>
                          </div>
                        </a>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-bold text-xl mb-0 truncate">
                          {track.nome}
                        </h3>
                        <p className="text-sm opacity-80 mb-4 truncate">
                          {track.artista}
                        </p>
                      </div>
                      <a
                        href={spotifyTrackLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-auto bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"></path>
                          <line x1="3" y1="10" x2="3" y2="10"></line>
                        </svg>
                        Abrir no Spotify
                      </a>
                      <iframe
                        src={spotifyEmbedUrl}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allowTransparency={true}
                        className="rounded-lg mt-3"
                        style={{ display: "block", minHeight: "152px" }}
                      ></iframe>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
