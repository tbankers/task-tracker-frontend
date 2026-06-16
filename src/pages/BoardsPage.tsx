import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { boards as boardsApi, Board, workspaces } from "../api";

export default function BoardsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Board[]>([]);
  const [wsTitle, setWsTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const load = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [boardsData, wsData] = await Promise.all([
        boardsApi.listByWorkspace(workspaceId),
        workspaces.get(workspaceId),
      ]);
      setItems(boardsData);
      setWsTitle(wsData.title);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !workspaceId) return;
    await boardsApi.create(workspaceId, newTitle.trim());
    setNewTitle("");
    setShowCreate(false);
    load();
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    await boardsApi.update(id, editTitle.trim());
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this board?")) return;
    await boardsApi.delete(id);
    load();
  };

  return (
    <div className="app-layout">
      <header className="top-bar">
        <div className="top-left">
          <Link to="/workspaces" className="back-link">
            &larr; Workspaces
          </Link>
          <h1>{wsTitle || "Boards"}</h1>
        </div>
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
            + New Board
          </button>
        </div>

        {showCreate && (
          <div className="inline-form">
            <form onSubmit={handleCreate}>
              <input
                autoFocus
                placeholder="Board title"
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
            No boards yet. Create one to get started.
          </div>
        ) : (
          <div className="card-grid">
            {items.map((board) => (
              <div key={board.board_id} className="card">
                {editing === board.board_id ? (
                  <div className="inline-form">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRename(board.board_id);
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
                      to={`/boards/${board.board_id}/tasks`}
                      className="card-title"
                    >
                      {board.title}
                    </Link>
                    <div className="card-meta">
                      Created {new Date(board.created_at).toLocaleDateString()}
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => {
                          setEditing(board.board_id);
                          setEditTitle(board.title);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => handleDelete(board.board_id)}
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
