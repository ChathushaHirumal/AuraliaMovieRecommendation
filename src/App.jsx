import { useEffect, useState } from "react";
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



export default function App() {
  const [movies, setMovies] = useState([]);
  const [sort, setSort] = useState("rating");
  const [genre, setGenre] = useState("");
  const [search, setSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
const [recent, setRecent] = useState([]);
const [recs, setRecs] = useState([]);
const [recsOpen, setRecsOpen] = useState(false);



  useEffect(() => {
    loadMovies();
  }, []);

  async function loadMovies() {
    setMovies(await getAllMovies());
  }

  async function handleSort(field) {
    setSort(field);
    setMovies(await getMoviesSorted(field, "desc"));
  }

  async function handleFilter(g) {
    setGenre(g);
    setMovies(await getMoviesByGenre(g));
  }

function handleShowHistoryDropdown() {
  // load every time we open (keeps list fresh)
  const list = getHistory(5);
  setRecent(list);
  setHistoryOpen((v) => !v);
}


function handleClearHistory() {
  clearHistory();
  setRecent([]);
  setHistoryOpen(false);
}

async function handleRecs() {
  const r = await getRecommendations(10, 5, movies);

  setRecs(r);
  setRecsOpen(true);
}

async function handleRecsDiverse() {
  const r = await getRecommendationsDiverse(10, 2, movies);

  setRecs(r);
  setRecsOpen(true);
}



  const filtered = search ? getByTitlePrefixBinary(movies, search) : movies;


  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🎬 Movie Explorer</h1>

      <input
        placeholder="Search by title..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div>
        <button onClick={() => handleSort("rating")}>Sort by Rating</button>
        <button onClick={() => handleSort("year")}>Sort by Year</button>
        <button onClick={() => handleFilter("Action")}>Filter: Action</button>
        <button onClick={() => handleFilter("Drama")}>Filter: Drama</button>
        <button onClick={() => loadMovies()}>Reset</button>
        <button onClick={async () => setMovies(await getTopKByRatingHeap(10))}>Top 10 (Heap)</button>
<span style={{ position: "relative", display: "inline-block" }}>
  <button onClick={handleShowHistoryDropdown}>
    {historyOpen ? "Hide History" : "Show Watch History"}
  </button>

  {/* Dropdown panel */}
  {historyOpen && recent.length > 0 && (
    <div
      style={{
        position: "absolute",
        top: "110%",
        left: 0,
        minWidth: 260,
        maxHeight: 260,
        overflowY: "auto",
        background: "#1f1f1f",
        border: "1px solid #444",
        borderRadius: 8,
        padding: "10px",
        zIndex: 1000,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Recently Watched</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {recent.map((t, i) => (
          <li key={i}>
            <button
              style={{
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                padding: "6px 4px",
                cursor: "pointer"
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



      </div>
<div className="movie-grid">
  {filtered.map(m => (
    <div className="movie-card" id={`movie-${m.id}`} key={m.id}>

      <img src={m.posterUrl} alt={m.title} />
 <h3>{m.title}</h3>
<p>⭐ {m.rating} | {m.year}</p>
<p className="genres">
  {Array.isArray(m.genre) ? m.genre.join(", ") : String(m.genre || "")}
</p>

{Array.isArray(m.tags) && m.tags.length > 0 && (
  <p className="tags">Tags: {m.tags.join(", ")}</p>
)}

{/* Only count history when user actually chooses to watch */}
<button
  className="watch-btn"
  onClick={() => pushHistory({ id: m.id, title: m.title })}
>
  Watch
</button>


    </div>
  ))}
</div>




{recsOpen && (
  <div className="recs-panel" style={{ marginTop: 16 }}>
    <h2>Recommended for You</h2>
    {recs.length === 0 ? (
      <p>No recommendations yet. Watch a few titles first.</p>
    ) : (
      <ul>
        {recs.map((m) => (
          <li key={m.id || m.title}>
            <b>{m.title}</b> — ⭐ {m.rating} {m.year ? `| ${m.year}` : ""}
            {Array.isArray(m._why) && m._why.length > 0 && (
              <div style={{ opacity: 0.85 }}>
                <small>{m._why[0]}</small>
              </div>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
)}





    </div>
  );
}
