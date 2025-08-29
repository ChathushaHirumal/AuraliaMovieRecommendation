import { useEffect, useState } from "react";
import { ensureAnonSignIn, db } from "./firebase/init";
import { collection, getDocs } from "firebase/firestore";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureAnonSignIn();
      const snap = await getDocs(collection(db, "movies"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMovies(list);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <div style={{ padding: 16, fontFamily: "Arial", maxWidth: 900, margin: "0 auto" }}>
      <h1>Auralia — Movies</h1>
      <ul>
        {movies.map(m => (
          <li key={m.id} style={{ margin: "8px 0" }}>
            <b>{m.title}</b> — ⭐ {m.rating} • {m.year}
          </li>
        ))}
      </ul>
      {!movies.length && <p>No movies found. Add docs in Firestore → movies.</p>}
    </div>
  );
}
