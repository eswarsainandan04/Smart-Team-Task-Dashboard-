"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/lib/auth";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";

const STATUS_META = {
  pending: {
    label: "Pending",
    badge: "border-yellow-200 bg-yellow-50 text-yellow-700",
    option: "text-yellow-700",
  },
  in_progress: {
    label: "In Progress",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    option: "text-blue-700",
  },
  completed: {
    label: "Completed",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    option: "text-emerald-700",
  },
  delayed: {
    label: "Delayed",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    option: "text-orange-700",
  },
  cancelled: {
    label: "Cancelled",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    option: "text-rose-700",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    recentActivity: null,
  });
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterDueDate, setFilterDueDate] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskActivity, setEditingTaskActivity] = useState([]);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    status: "pending",
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("smart-team-user");
    if (!stored) {
      router.replace("/login");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed?.name && !parsed?.email) {
        sessionStorage.removeItem("smart-team-user");
        router.replace("/login");
        return;
      }

      setProfile({
        name: parsed.name || "",
        email: parsed.email || "",
      });
      setIsAuthed(true);
    } catch {
      sessionStorage.removeItem("smart-team-user");
      router.replace("/login");
    }
  }, [router]);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    setTaskError("");

    try {
      const params = new URLSearchParams();
      if (searchText.trim()) params.set("q", searchText.trim());
      if (filterStatus) params.set("status", filterStatus);
      if (filterPriority) params.set("priority", filterPriority);
      if (filterDueDate) params.set("due_date", filterDueDate);

      const response = await fetch(`/api/search?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setTaskError(data.message || "Unable to load tasks.");
        setTasks([]);
        return;
      }

      setTasks(data.tasks || []);
    } catch {
      setTaskError("Unable to load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }, [filterDueDate, filterPriority, filterStatus, searchText]);

  const loadInsights = useCallback(async () => {
    setLoadingInsights(true);

    try {
      const response = await fetch("/api/insights", {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return;
      }

      setInsights({
        totalTasks: data.totalTasks || 0,
        completedTasks: data.completedTasks || 0,
        pendingTasks: data.pendingTasks || 0,
        recentActivity: data.recentActivity || null,
      });
    } catch {
      return;
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthed) return;

    loadTasks();
  }, [isAuthed, loadTasks]);

  useEffect(() => {
    if (!isAuthed) return;

    loadInsights();
  }, [isAuthed, loadInsights]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterStatus, filterPriority, filterDueDate]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      sessionStorage.removeItem("smart-team-user");
      sessionStorage.removeItem("smart-team-token");
      window.location.replace("/login");
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.pending;

  const getTitlePreview = (value) => {
    if (!value) return "Task";
    const text = String(value).trim();
    return text.length > 10 ? `${text.slice(0, 10)}...` : text;
  };

  const getTextPreview = (value, maxLength = 16) => {
    if (!value) return "";
    const text = String(value).trim();
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const summaryCards = [
    {
      label: "Total Tasks",
      value: loadingInsights ? "..." : String(insights.totalTasks),
      tone: "from-slate-900 to-slate-700",
    },
    {
      label: "Completed Tasks",
      value: loadingInsights ? "..." : String(insights.completedTasks),
      tone: "from-emerald-600 to-emerald-500",
    },
    {
      label: "Pending Tasks",
      value: loadingInsights ? "..." : String(insights.pendingTasks),
      tone: "from-amber-500 to-orange-500",
    },
    {
      label: "Recent Activity",
      value: loadingInsights ? "..." : insights.recentActivity ? getTitlePreview(insights.recentActivity.title) : "No activity",
      tone: "from-blue-600 to-indigo-500",
      meta: loadingInsights
        ? "Loading latest event"
        : insights.recentActivity
          ? `${insights.recentActivity.action || "action"} by ${getTextPreview(insights.recentActivity.user_email || "unknown", 18)}`
          : "No task activity yet",
      timestamp: loadingInsights
        ? ""
        : insights.recentActivity
          ? formatDateTime(insights.recentActivity.timestamp)
          : "",
    },
  ];

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(tasks.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, startIndex + itemsPerPage);

  const pageWindowStart = Math.max(1, safeCurrentPage - 1);
  const pageWindowEnd = Math.min(totalPages, pageWindowStart + 2);
  const visiblePages = [];

  for (let pageNumber = pageWindowStart; pageNumber <= pageWindowEnd; pageNumber += 1) {
    visiblePages.push(pageNumber);
  }

  const latestTaskActivity =
    editingTaskActivity.length > 0
      ? editingTaskActivity[editingTaskActivity.length - 1]
      : null;

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      status: "pending",
    });
    setEditingTaskId(null);
    setEditingTaskActivity([]);
    setIsStatusMenuOpen(false);
  };

  const openCreateTaskModal = () => {
    resetTaskForm();
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTaskId(task.task_id);
    setIsStatusMenuOpen(false);
    setEditingTaskActivity(Array.isArray(task.activity) ? task.activity : []);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      due_date: task.due_date ? String(task.due_date).slice(0, 10) : "",
      status: task.status || "pending",
    });
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    resetTaskForm();
  };

  const handleTaskInputChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const refreshTasks = async () => {
    const params = new URLSearchParams();
    if (searchText.trim()) params.set("q", searchText.trim());
    if (filterStatus) params.set("status", filterStatus);
    if (filterPriority) params.set("priority", filterPriority);
    if (filterDueDate) params.set("due_date", filterDueDate);

    const response = await fetch(`/api/search?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setTasks(data.tasks || []);
    }
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();
    if (savingTask) return;
    setSavingTask(true);
    setTaskError("");

    try {
      const method = editingTaskId ? "PATCH" : "POST";
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        due_date: taskForm.due_date,
        ...(editingTaskId ? { task_id: editingTaskId, status: taskForm.status } : {}),
      };

      const targetEndpoint = editingTaskId ? "/api/update" : "/api/insert";

      const response = await fetch(targetEndpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setTaskError(data.message || "Unable to save task.");
        if (response.status === 409 && data.message) {
          window.alert(data.message);
        }
        return;
      }

      if (editingTaskId) {
        setTasks((prev) =>
          prev.map((task) => (task.task_id === data.task.task_id ? data.task : task))
        );
        setEditingTaskActivity(Array.isArray(data.task.activity) ? data.task.activity : []);
      } else {
        setTasks((prev) => [...prev, data.task]);
        setCurrentPage((prev) => Math.max(1, Math.ceil((tasks.length + 1) / 10)));
      }

      closeTaskModal();
      await refreshTasks();
    } catch {
      setTaskError("Unable to save task.");
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      const response = await fetch("/api/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ task_id: taskId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setTaskError(data.message || "Unable to delete task.");
        return;
      }

      setTasks((prev) => prev.filter((task) => task.task_id !== taskId));
      setCurrentPage((prev) => Math.max(1, prev));
    } catch {
      setTaskError("Unable to delete task.");
    }
  };

  if (!isAuthed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Checking session...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xl font-black uppercase tracking-[0.25em] text-slate-900 sm:text-2xl">
              Smart Team
            </p>
          </div>

          <nav className="relative flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right transition hover:border-slate-300 hover:bg-slate-100"
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
            >
              <div className="leading-tight text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {profile.name || "User"}
                </p>
                <p className="text-xs text-slate-500">{profile.email}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {(profile.name || "U").trim().charAt(0).toUpperCase()}
              </div>
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                <a
                  href="/login"
                  onClick={handleLogout}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  LOGOUT
                </a>
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              >
                <div className={`h-1.5 w-20 rounded-full bg-gradient-to-r ${card.tone}`} />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {card.label}
                </p>
                {card.label === "Recent Activity" ? (
                  <>
                    <p className="mt-2 max-w-full truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                      {card.value}
                    </p>
                    {card.meta ? (
                      <p className="mt-2 max-w-full truncate text-sm text-slate-600">
                        {card.meta}
                      </p>
                    ) : null}
                    {card.timestamp ? (
                      <p className="mt-1 text-sm text-slate-500">{card.timestamp}</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="mt-2 max-w-full truncate text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                      {card.value}
                    </p>
                    {card.meta ? (
                      <p className="mt-2 text-sm text-slate-600">{card.meta}</p>
                    ) : null}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="md:col-span-2 xl:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Search
                </label>
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search title or description"
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(event) => setFilterPriority(event.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Due Date
                </label>
                <input
                  type="date"
                  value={filterDueDate}
                  onChange={(event) => setFilterDueDate(event.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateTaskModal}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <FaPlus aria-hidden="true" />
              Create Task
            </button>
          </div>

          {taskError ? (
            <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {taskError}
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full table-fixed divide-y divide-slate-200 bg-white">
              <colgroup>
                <col className="w-16" />
                <col className="w-40" />
                <col className="w-[20%]" />
                <col className="w-28" />
                <col className="w-32" />
                <col className="w-32" />
                <col className="w-44" />
              </colgroup>
              <thead className="bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left align-middle text-sm font-semibold text-slate-700">SI NO</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left align-middle text-sm font-semibold text-slate-700">Title</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left align-middle text-sm font-semibold text-slate-700">Description</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left align-middle text-sm font-semibold text-slate-700">Priority</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left align-middle text-sm font-semibold text-slate-700">Due Date</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left align-middle text-sm font-semibold text-slate-700">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left align-middle text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loadingTasks ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                      Loading tasks...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                      No tasks available.
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task, index) => (
                    <tr key={task.task_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">{startIndex + index + 1}</td>
                      <td className="truncate px-4 py-3 text-sm font-medium text-slate-900" title={task.title}>
                        {task.title}
                      </td>
                      <td
                        className="max-w-[180px] truncate px-4 py-3 text-xs text-slate-600 sm:text-sm"
                        title={task.description || ""}
                      >
                        {task.description || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{task.priority}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(task.due_date)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusMeta(task.status).badge}`}
                        >
                          {getStatusMeta(task.status).label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditTaskModal(task)}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                          >
                            <FaEdit aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.task_id)}
                            className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
                          >
                            <FaTrash aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, tasks.length)} of {tasks.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>

                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`min-w-10 rounded-full px-3 py-2 text-sm font-semibold transition ${
                      pageNumber === safeCurrentPage
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {isTaskModalOpen ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/50 px-4 py-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {editingTaskId ? "Edit Task" : "Create Task"}
                </h3>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                  Fill in the task details below.
                </p>
              </div>
              <button
                type="button"
                onClick={closeTaskModal}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:px-4 sm:py-2 sm:text-sm"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleSaveTask}
              className={`mt-4 grid gap-3 ${editingTaskId ? "lg:grid-cols-[minmax(0,1fr)_260px]" : ""}`}
            >
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
                  Task Details
                </h4>

                <div className="mt-3 grid gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 sm:text-sm" htmlFor="title">
                      Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      value={taskForm.title}
                      onChange={handleTaskInputChange}
                      required
                      className="mt-1.5 w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 sm:text-sm" htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={taskForm.description}
                      onChange={handleTaskInputChange}
                      rows={3}
                      className="mt-1.5 w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-700 sm:text-sm" htmlFor="priority">
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={taskForm.priority}
                        onChange={handleTaskInputChange}
                        className="mt-1.5 w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700 sm:text-sm" htmlFor="due_date">
                        Due Date
                      </label>
                      <input
                        id="due_date"
                        name="due_date"
                        type="date"
                        value={taskForm.due_date}
                        onChange={handleTaskInputChange}
                        className="mt-1.5 w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {editingTaskId ? (
                <div className="grid gap-3 lg:self-start">
                  <div className="rounded-3xl border border-slate-200 bg-white p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
                        Status
                      </h4>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${getStatusMeta(taskForm.status).badge}`}
                      >
                        {getStatusMeta(taskForm.status).label}
                      </span>
                    </div>

                    <div className="relative mt-3">
                      <button
                        type="button"
                        onClick={() => setIsStatusMenuOpen((prev) => !prev)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold ${getStatusMeta(taskForm.status).badge}`}
                      >
                        <span>{getStatusMeta(taskForm.status).label}</span>
                        <span>▾</span>
                      </button>

                      {isStatusMenuOpen ? (
                        <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                          {Object.entries(STATUS_META).map(([value, meta]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setTaskForm((prev) => ({ ...prev, status: value }));
                                setIsStatusMenuOpen(false);
                              }}
                              className={`block w-full px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-50 ${meta.option}`}
                            >
                              {meta.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
                      Activity
                    </h4>

                    <div className="mt-3">
                      {latestTaskActivity ? (
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <p className="text-sm font-medium text-slate-900">
                            {latestTaskActivity.action || "action"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {latestTaskActivity.user_email || "unknown"} at {formatDateTime(latestTaskActivity.timestamp)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No activity yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {taskError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {taskError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingTask ? "Saving..." : editingTaskId ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
