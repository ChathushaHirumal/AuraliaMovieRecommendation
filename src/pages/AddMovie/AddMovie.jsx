import { useState } from "react";
import { addMovie } from "../../services/movies";
import "./AddMovie.css";

export default function AddMovie({ onAdded }) {
  const [form, setForm] = useState({
    title: "",
    year: "",
    rating: "",
    genre: "",
    tags: "",
  });

  const [msg, setMsg] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await addMovie(form);
      setMsg("✅ Movie added successfully!");
      setForm({ title: "", year: "", rating: "", genre: "", tags: "" });
      if (onAdded) onAdded();
    } catch (err) {
      console.error(err);
      setMsg("❌ Error adding movie: " + err.message);
    }
  }

  return (
    <div className="add-wrap">
      <div className="add-card">
        <h2 className="add-title">Add Movie</h2>
        <form onSubmit={handleSubmit} className="add-form">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            required
            className="add-input"
          />
          <input
            name="year"
            value={form.year}
            onChange={handleChange}
            placeholder="Year"
            type="number"
            className="add-input"
          />
          <input
            name="rating"
            value={form.rating}
            onChange={handleChange}
            placeholder="Rating (0-10)"
            type="number"
            step="0.1"
            min="0"
            max="10"
            className="add-input"
          />
          <input
            name="genre"
            value={form.genre}
            onChange={handleChange}
            placeholder="Genres (comma separated)"
            className="add-input"
          />
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Tags (comma separated)"
            className="add-input add-full"
          />
          <div className="add-full add-btn-wrap">
            <button type="submit" className="add-btn">Save</button>
          </div>
        </form>
        {msg && <p className="add-msg">{msg}</p>}
      </div>
    </div>
  );
}
