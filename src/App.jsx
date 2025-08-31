import { useEffect, useState } from "react";
import "./App.css";
import { Link } from "react-router-dom";
import logo from "./assets/Auralia-logo.png";

import {
  getAllMovies,
  getMoviesSorted,
  getMoviesByGenre,
  getTopKByRatingHeap,
  getByTitlePrefixBinary,
  pushHistory,
  getHistory,
  clearHistory,
  getRecommendations,
  getRecommendationsDiverse
} from "./services/movies";
import AddMovie from "./pages/AddMovie/AddMovie.jsx";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [sort, setSort] = useState("rating");
  const [genre, setGenre] = useState("");
  const [search, setSearch] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const [recs, setRecs] = useState([]);
  const [recsOpen, setRecsOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadMovies(); }, []);
  async function loadMovies() { setMovies(await getAllMovies()); }
  async function handleSort(field) { setSort(field); setMovies(await getMoviesSorted(field, "desc")); }
  async function handleFilter(g) { setGenre(g); setMovies(await getMoviesByGenre(g)); }

  function handleShowHistoryDropdown() {
    const list = getHistory(5);
    setRecent(list);
    setHistoryOpen(v => !v);
  }
  function handleClearHistory() {
    clearHistory();
    setRecent([]);
    setHistoryOpen(false);
  }
  async function handleRecs() {
    const r = await getRecommendations(10, 5, movies);
    setRecs(r); setRecsOpen(true);
  }
  async function handleRecsDiverse() {
    const r = await getRecommendationsDiverse(10, 2, movies);
    setRecs(r); setRecsOpen(true);
  }

  const filtered = search ? getByTitlePrefixBinary(movies, search) : movies;

  return (
    <div className="app">
      {/* ===== Toolbar ===== */}
      <div className="toolbar">
        <div className="toolbar-inner">
          {/* Top row: brand + auth */}
          <div className="toolbar-top">
            <div className="brand">
              <img src={logo} alt="Auralia" className="logo" />
              <h1>🎬 Movie Explorer</h1>
            </div>
            <Link to="/auth" className="loginBtn">Sign In</Link>
          </div>

          {/* Middle row: big centered search */}
          <div className="search-bar">
            <input
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Bottom row: controls */}
          <div className="controls">
            <button onClick={() => handleSort("rating")}>Sort by Rating</button>
            <button onClick={() => handleSort("year")}>Sort by Year</button>
            <button onClick={() => handleFilter("Action")}>Filter: Action</button>
            <button onClick={() => handleFilter("Drama")}>Filter: Drama</button>
            <button onClick={loadMovies}>Reset</button>
            <button onClick={async () => setMovies(await getTopKByRatingHeap(10))}>Top 10 (Heap)</button>

            <span style={{ position: "relative", display: "inline-block" }}>
              <button onClick={handleShowHistoryDropdown}>
                {historyOpen ? "Hide History" : "Show Watch History"}
              </button>
              {historyOpen && recent.length > 0 && (
                <div
                  style={{
                    position: "absolute", top: "110%", left: 0,
                    minWidth: 260, maxHeight: 260, overflowY: "auto",
                    background: "#1f1f1f", border: "1px solid #444",
                    borderRadius: 8, padding: "10px", zIndex: 1000,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Recently Watched</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {recent.map((t, i) => (
                      <li key={i}>
                        <button
                          style={{
                            width: "100%", textAlign: "left",
                            background: "transparent", border: "none",
                            padding: "6px 4px", cursor: "pointer", color: "inherit"
                          }}
                          onClick={() => {
                            const movie = movies.find(m => String(m.title) === String(t));
                            if (!movie) return;
                            const el = document.getElementById(`movie-${movie.id}`);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                            setHistoryOpen(false);
                          }}
                        >
                          {t}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </span>

            <button onClick={handleClearHistory}>Clear History</button>
            <button onClick={handleRecs}>Recommend for You</button>
            <button onClick={handleRecsDiverse}>Recommend (Diverse)</button>
            <button onClick={() => setAdding(true)}>➕ Add Movie</button>
          </div>
        </div>
      </div>

      {/* AddMovie modal */}
      {adding && (
        <div className="modal-backdrop" onClick={() => setAdding(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAdding(false)}>✕</button>
            <AddMovie onAdded={() => { setAdding(false); loadMovies(); }} />
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="movie-grid">
        {filtered.map(m => (
          <div className="movie-card" id={`movie-${m.id}`} key={m.id}>
            <img src={m.posterUrl} alt={m.title} />
            <h3 title={m.title}>{m.title}</h3>
            <p>⭐ {m.rating} &nbsp;|&nbsp; {m.year}</p>
            <p className="genres">{Array.isArray(m.genre) ? m.genre.join(", ") : String(m.genre || "")}</p>
            {Array.isArray(m.tags) && m.tags.length > 0 && (<p className="tags">Tags: {m.tags.join(", ")}</p>)}
            <button
              className="watch-btn"
              onClick={() => pushHistory({ id: m.id, title: m.title })}
              style={{
                margin: "4px", padding: "8px 10px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.08)", color: "#f1f1f1",
                cursor: "pointer"
              }}
            >
              Watch
            </button>
          </div>
        ))}
      </div>

      {/* Recommendations modal */}
      {recsOpen && (
        <div className="modal-backdrop" onClick={() => setRecsOpen(false)}>
          <div className="modal-sheet recs-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setRecsOpen(false)}>✕</button>
            <h2 style={{ marginTop: 0 }}>Recommended for You</h2>

            {recs.length === 0 ? (
              <p>No recommendations yet. Watch a few titles first.</p>
            ) : (
              <ul className="recs-list">
                {recs.map(m => (
                  <li key={m.id || m.title}>
                    <div className="recs-title">
                      <button
                        onClick={() => {
                          const el = document.getElementById(`movie-${m.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                            el.style.outline = "2px solid #e63946";
                            setTimeout(() => { el.style.outline = ""; }, 2000);
                          }
                          setRecsOpen(false);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          cursor: "pointer",
                          color: "inherit",
                          fontSize: "1rem",
                          fontWeight: "600",
                          textDecoration: "none"
                        }}
                      >
                        {m.title}
                      </button>
                      &nbsp;— ⭐ {m.rating ?? "—"} {m.year ? `| ${m.year}` : ""}
                    </div>

                    {Array.isArray(m.genre) && m.genre.length > 0 && (
                      <div className="recs-sub"><small>Genres: {m.genre.join(", ")}</small></div>
                    )}
                    <div className="recs-why"><small>{Array.isArray(m._why) && m._why.length > 0 ? m._why[0] : "Because it’s similar to your recent watches."}</small></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
