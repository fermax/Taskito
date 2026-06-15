"use client"

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CheckCircle2, Circle, Plus, Trash2, Edit3, Filter, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import TaskForm from "./TaskForm";
import { useTranslation } from "@/components/LanguageProvider";
import Tooltip from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  status: "Todo" | "In Progress" | "Done";
  due_date: string;
  user_id: string;
}

export default function TaskManagement() {
  const { locale, t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterToday, setFilterToday] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (showForm && firstFocusableRef.current) {
      setTimeout(() => firstFocusableRef.current?.focus(), 50);
    }
  }, [showForm]);

  useEffect(() => {
    if (!showForm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowForm(false);
        setEditingTask(undefined);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

  async function fetchTasks() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(t("dashboard.task_load_error"));
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }

  async function handleCreateOrUpdate(taskData: any) {
    if (editingTask) {
      const { error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", editingTask.id);
      if (error) {
        toast.error(t("dashboard.task_update_error"));
        return;
      }
      toast.success(t("dashboard.task_update_success"));
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("tasks")
        .insert([{ ...taskData, user_id: user?.id }]);
      if (error) {
        toast.error(t("dashboard.task_create_error"));
        return;
      }
      toast.success(t("dashboard.task_create_success"));
    }
    setShowForm(false);
    setEditingTask(undefined);
    fetchTasks();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", deleteTarget)
      .eq("user_id", user.id);
    if (error) {
      toast.error(t("dashboard.task_delete_error"));
    } else {
      toast.success(t("dashboard.task_delete_success"));
      fetchTasks();
    }
    setDeleteTarget(null);
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "Done" ? "Todo" : "Done";
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error(t("dashboard.task_status_error"));
    } else {
      fetchTasks();
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === "All" || task.status === filterStatus;
    const priorityMatch = filterPriority === "All" || task.priority === filterPriority;
    const todayMatch = !filterToday || task.due_date === new Date().toISOString().split("T")[0];
    const searchMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (task.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && priorityMatch && todayMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPriority, filterToday, searchTerm, tasks.length]);

  if (loading) return <div className="p-6 text-center text-muted-foreground">{t("dashboard.loading_tasks")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-semibold text-lg">{t("dashboard.tasks")}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
            <Filter className="w-4 h-4" />
            {t("dashboard.filters")}
          </div>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("dashboard.search_placeholder")}
            className="w-[160px] h-9 text-sm"
            aria-label="Search tasks"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-[120px]"
            aria-label="Filter by status"
          >
            <option value="All">{t("dashboard.all_status")}</option>
            <option value="Todo">{t("status.todo")}</option>
            <option value="In Progress">{t("status.in_progress")}</option>
            <option value="Done">{t("status.done")}</option>
          </Select>
          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-[120px]"
            aria-label="Filter by priority"
          >
            <option value="All">{t("dashboard.all_priority")}</option>
            <option value="Low">{t("priority.low")}</option>
            <option value="Medium">{t("priority.medium")}</option>
            <option value="High">{t("priority.high")}</option>
          </Select>
          <Button
            variant={filterToday ? "default" : "outline"}
            onClick={() => setFilterToday(!filterToday)}
            className="gap-1 text-xs h-9"
            aria-label={filterToday ? "Show all tasks" : "Show today's tasks"}
          >
            <Calendar className="w-3.5 h-3.5" />
            {t("dashboard.today")}
          </Button>
          <Button onClick={() => { setEditingTask(undefined); setShowForm(true); }} className="gap-2" aria-label="Add new task">
            <Plus className="w-4 h-4" />
            {t("dashboard.add_task")}
          </Button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingTask(undefined); } }}
          role="dialog"
          aria-modal="true"
          aria-label={editingTask ? t("dashboard.edit_task") : t("dashboard.create_task")}
        >
          <div ref={modalRef} className="w-full max-w-lg bg-background rounded-xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <h4 className="font-semibold">{editingTask ? t("dashboard.edit_task") : t("dashboard.create_task")}</h4>
              <Button
                ref={firstFocusableRef}
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => { setShowForm(false); setEditingTask(undefined); }}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <TaskForm
              initialData={editingTask}
              onSubmit={handleCreateOrUpdate}
              onCancel={() => { setShowForm(false); setEditingTask(undefined); }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div className="w-full max-w-sm bg-background rounded-xl shadow-lg overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <h4 className="font-semibold text-lg mb-2">{t("dashboard.delete_title")}</h4>
            <p className="text-sm text-muted-foreground mb-6">{t("dashboard.delete_confirm")}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} aria-label={t("dashboard.cancel_deletion")}>
                {t("dashboard.cancel")}
              </Button>
              <Button variant="destructive" onClick={confirmDelete} aria-label={t("dashboard.confirm_deletion")}>
                {t("dashboard.delete_title")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card/50">
            {t("dashboard.no_tasks")}
          </div>
        ) : (
          paginatedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={() => handleToggleStatus(task.id, task.status)}
                  className="cursor-pointer transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                  aria-label={task.status === "Done" ? "Mark as incomplete" : "Mark as complete"}
                  role="checkbox"
                  aria-checked={task.status === "Done"}
                >
                  {task.status === "Done" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 hover:text-primary transition-colors" />
                  )}
                </button>
                <div className="overflow-hidden">
                  <Tooltip content={task.description || ""}>
                    <p className={`font-medium truncate ${task.status === "Done" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                  </Tooltip>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded-full ${
                      task.priority === "High" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                      task.priority === "Medium" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {t(`priority.${task.priority.toLowerCase()}`)}
                    </span>
                    <span>{t(`status.${task.status === "In Progress" ? "in_progress" : task.status.toLowerCase()}`)}</span>
                    <span>{t("dashboard.task_due")}: {task.due_date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => { setEditingTask(task); setShowForm(true); }}
                  aria-label={`Edit task: ${task.title}`}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(task.id)}
                  aria-label={`Delete task: ${task.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="gap-1 h-9 text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("pagination.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pagination.page")} {currentPage} {t("pagination.of")} {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="gap-1 h-9 text-xs"
          >
            {t("pagination.next")}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
