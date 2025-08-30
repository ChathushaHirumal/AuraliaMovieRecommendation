import { useEffect, useState } from "react";
import { getAllMovies, getMoviesSorted, getMoviesByGenre } from "./services/movies";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [sort, setSort] = useState("rating");
  const [genre, setGenre] = useState("");
  const [search, setSearch] = useState("");

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

  const filtered = movies.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

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
      </div>
<div className="movie-grid">
  {filtered.map(m => (
    <div className="movie-card" key={m.id}>
      <img src={m.posterUrl} alt={m.title} />
      <h3>{m.title}</h3>
      <p>⭐ {m.rating} | {m.year}</p>
      <p className="genres">{m.genre.join(", ")}</p>
    </div>
  ))}
</div>

    </div>
  );
}
