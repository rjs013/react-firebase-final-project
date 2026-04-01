import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import "./App.css";

function App() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const notesCollection = collection(db, "notes");

  const addNote = async () => {
    if (note.trim() === "") return;
    setSaving(true);
    await addDoc(notesCollection, {
      text: note,
      createdAt: new Date(),
    });
    setNote("");
    await fetchNotes();
    setSaving(false);
  };

  const fetchNotes = async () => {
    const data = await getDocs(notesCollection);
    const fetched = data.docs.map((d) => ({ ...d.data(), id: d.id }));
    fetched.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    setNotes(fetched);
    setLoading(false);
  };

  const deleteNote = async (id) => {
    await deleteDoc(doc(db, "notes", id));
    fetchNotes();
  };

  const startEdit = (n) => {
    setEditingId(n.id);
    setEditText(n.text);
  };

  const saveEdit = async (id) => {
    if (editText.trim() === "") return;
    await updateDoc(doc(db, "notes", id), { text: editText });
    setEditingId(null);
    fetchNotes();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  };

  useEffect(() => {
    fetchNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = notes.filter((n) =>
    n.text.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <span className="brand-name">Noter</span>
        </div>
        <nav className="nav-links">
          <a className="nav-item active" href="/#">
            <span className="nav-icon">◈</span> All Notes
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="note-count">{notes.length} notes</div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">All Notes</h1>
            <p className="page-sub">Your personal workspace</p>
          </div>
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="composer">
          <div className="composer-inner">
            <textarea
              className="composer-input"
              placeholder="Write a new note… (Enter to save)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
            />
            <div className="composer-bar">
              <span className="composer-hint">Press Enter to save · Shift+Enter for new line</span>
              <button
                className={`btn-save ${saving ? "loading" : ""}`}
                onClick={addNote}
                disabled={saving || note.trim() === ""}
              >
                {saving ? "Saving…" : "Save Note"}
              </button>
            </div>
          </div>
        </div>

        <section className="notes-grid">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Loading notes…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <p>{search ? "No notes match your search." : "No notes yet. Write your first one above."}</p>
            </div>
          ) : (
            filtered.map((n, i) => (
              <div
                className="note-card"
                key={n.id}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="note-body">
                  {editingId === n.id ? (
                    <textarea
                      className="edit-input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      rows={4}
                    />
                  ) : (
                    <p className="note-text">{n.text}</p>
                  )}
                </div>
                <div className="note-footer">
                  <span className="note-date">{formatDate(n.createdAt)}</span>
                  <div className="note-actions">
                    {editingId === n.id ? (
                      <>
                        <button className="btn-action btn-confirm" onClick={() => saveEdit(n.id)}>
                          Save
                        </button>
                        <button className="btn-action btn-cancel" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-action btn-edit" onClick={() => startEdit(n)}>
                          Edit
                        </button>
                        <button className="btn-action btn-delete" onClick={() => deleteNote(n.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default App;