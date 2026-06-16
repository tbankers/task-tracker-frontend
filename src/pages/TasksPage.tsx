import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  tasks as tasksApi,
  boards as boardsApi,
  Task,
  TaskStatus,
  Board,
} from "../api";

type ViewMode = "table" | "kanban" | "list";

const STATUS_LABELS: Record<TaskStatus, string> = {
  to_do: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_OPTIONS: TaskStatus[] = ["to_do", "in_progress", "done"];

export default function TasksPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Task[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");

  const load = async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const [tasksData, boardData] = await Promise.all([
        tasksApi.listByBoard(boardId),
        boardsApi.get(boardId),
      ]);
      setItems(tasksData);
      setBoard(boardData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [boardId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !boardId) return;
    await tasksApi.create(boardId, newTitle.trim());
    setNewTitle("");
    setShowCreate(false);
    load();
  };

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    await tasksApi.updateStatus(taskId, status);
    load();
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm("Delete this task?")) return;
    await tasksApi.delete(taskId);
    load();
  };

  const filtered =
    filterStatus === "all"
      ? items
      : items.filter((t) => t.status === filterStatus);

  const grouped: Record<TaskStatus, Task[]> = {
    to_do: filtered.filter((t) => t.status === "to_do"),
    in_progress: filtered.filter((t) => t.status === "in_progress"),
    done: filtered.filter((t) => t.status === "done"),
  };

  return (
    <div className="app-layout">
      <header className="top-bar">
        <div className="top-left">
          <Link
            to={`/workspaces/${board?.workspace_id}/boards`}
            className="back-link"
          >
            &larr; Boards
          </Link>
          <h1>{board?.title || "Tasks"}</h1>
        </div>
        <div className="top-right">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as TaskStatus | "all")
            }
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="14" height="3" rx="0.5" />
                <rect x="1" y="6" width="14" height="3" rx="0.5" />
                <rect x="1" y="11" width="14" height="3" rx="0.5" />
              </svg>
            </button>
            <button
              className={`view-btn ${viewMode === "kanban" ? "active" : ""}`}
              onClick={() => setViewMode("kanban")}
              title="Kanban view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="4" height="14" rx="0.5" />
                <rect x="6" y="1" width="4" height="10" rx="0.5" />
                <rect x="11" y="1" width="4" height="6" rx="0.5" />
              </svg>
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="14" height="2" rx="0.5" />
                <rect x="1" y="5" width="14" height="2" rx="0.5" />
                <rect x="1" y="9" width="14" height="2" rx="0.5" />
                <rect x="1" y="13" width="14" height="2" rx="0.5" />
              </svg>
            </button>
          </div>
          <span className="user-badge">{user?.username}</span>
          <button className="btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <div className="toolbar">
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New Task
          </button>
          <span className="task-count">{filtered.length} tasks</span>
        </div>

        {showCreate && (
          <div className="inline-form">
            <form onSubmit={handleCreate}>
              <input
                autoFocus
                placeholder="Task title"
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
        ) : viewMode === "table" ? (
          <TableView
            tasks={filtered}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ) : viewMode === "kanban" ? (
          <KanbanView
            grouped={grouped}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ) : (
          <ListView
            tasks={filtered}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

// ---- Table View ----
function TableView({
  tasks,
  onStatusChange,
  onDelete,
}: {
  tasks: Task[];
  onStatusChange: (id: number, status: TaskStatus) => void;
  onDelete: (id: number) => void;
}) {
  if (tasks.length === 0)
    return <div className="empty-state">No tasks to display.</div>;

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Created</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.task_id} className={`status-row-${task.status}`}>
              <td className="id-col">{task.task_id}</td>
              <td>{task.title}</td>
              <td>
                <select
                  value={task.status}
                  onChange={(e) =>
                    onStatusChange(task.task_id, e.target.value as TaskStatus)
                  }
                  className={`status-select status-${task.status}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="date-col">
                {new Date(task.created_at).toLocaleDateString()}
              </td>
              <td className="date-col">
                {new Date(task.updated_at).toLocaleDateString()}
              </td>
              <td>
                <button
                  className="btn-sm btn-danger"
                  onClick={() => onDelete(task.task_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Kanban View ----
function KanbanView({
  grouped,
  onStatusChange,
  onDelete,
}: {
  grouped: Record<TaskStatus, Task[]>;
  onStatusChange: (id: number, status: TaskStatus) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="kanban-board">
      {STATUS_OPTIONS.map((status) => (
        <div key={status} className={`kanban-col kanban-${status}`}>
          <div className="kanban-header">
            <span className={`status-dot status-dot-${status}`}></span>
            {STATUS_LABELS[status]}
            <span className="kanban-count">{grouped[status].length}</span>
          </div>
          <div className="kanban-cards">
            {grouped[status].length === 0 ? (
              <div className="kanban-empty">No tasks</div>
            ) : (
              grouped[status].map((task) => (
                <div key={task.task_id} className="kanban-card">
                  <div className="kanban-card-title">{task.title}</div>
                  <div className="kanban-card-meta">
                    #{task.task_id}
                    {task.description && (
                      <span className="kanban-desc">
                        {task.description.length > 60
                          ? task.description.slice(0, 60) + "..."
                          : task.description}
                      </span>
                    )}
                  </div>
                  <div className="kanban-card-actions">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        onStatusChange(
                          task.task_id,
                          e.target.value as TaskStatus
                        )
                      }
                      className="status-select status-select-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => onDelete(task.task_id)}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- List View ----
function ListView({
  tasks,
  onStatusChange,
  onDelete,
}: {
  tasks: Task[];
  onStatusChange: (id: number, status: TaskStatus) => void;
  onDelete: (id: number) => void;
}) {
  if (tasks.length === 0)
    return <div className="empty-state">No tasks to display.</div>;

  return (
    <div className="list-view">
      {tasks.map((task) => (
        <div key={task.task_id} className={`list-item list-item-${task.status}`}>
          <div className="list-item-header">
            <span className={`status-dot status-dot-${task.status}`}></span>
            <span className="list-item-id">#{task.task_id}</span>
            <span className="list-item-title">{task.title}</span>
          </div>
          {task.description && (
            <div className="list-item-desc">{task.description}</div>
          )}
          <div className="list-item-footer">
            <select
              value={task.status}
              onChange={(e) =>
                onStatusChange(task.task_id, e.target.value as TaskStatus)
              }
              className={`status-select status-${task.status}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <span className="list-item-date">
              {new Date(task.created_at).toLocaleDateString()}
            </span>
            <button
              className="btn-sm btn-danger"
              onClick={() => onDelete(task.task_id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
