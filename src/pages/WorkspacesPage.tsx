import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { workspaces, Workspace } from "../api";

export default function WorkspacesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await workspaces.listByUser(user.user_id);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await workspaces.create(newTitle.trim());
    setNewTitle("");
    setShowCreate(false);
    load();
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    await workspaces.update(id, editTitle.trim());
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workspace?")) return;
    await workspaces.delete(id);
    load();
  };

  return (
    <div className="app-layout">
      <header className="top-bar">
        <h1>Workspaces</h1>
        <div className="top-right">
          <span className="user-badge">{user?.username}</span>
          <button className="btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <div className="toolbar">
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New Workspace
          </button>
        </div>

        {showCreate && (
          <div className="inline-form">
            <form onSubmit={handleCreate}>
              <input
                autoFocus
                placeholder="Workspace title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                Create
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowCreate(false);
                  setNewTitle("");
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            No workspaces yet. Create one to get started.
          </div>
        ) : (
          <div className="card-grid">
            {items.map((ws) => (
              <div key={ws.workspace_id} className="card">
                {editing === ws.workspace_id ? (
                  <div className="inline-form">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRename(ws.workspace_id);
                      }}
                    >
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <button type="submit" className="btn-primary btn-sm">
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                    <Link
                      to={`/workspaces/${ws.workspace_id}/boards`}
                      className="card-title"
                    >
                      {ws.title}
                    </Link>
                    <div className="card-meta">
                      Created {new Date(ws.created_at).toLocaleDateString()}
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => {
                          setEditing(ws.workspace_id);
                          setEditTitle(ws.title);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => handleDelete(ws.workspace_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
