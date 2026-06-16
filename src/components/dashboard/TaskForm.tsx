import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/components/LanguageProvider";
import { z } from "zod";
import { toast } from "sonner";

const TaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").default(""),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["Todo", "In Progress", "Done"]),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

interface Task {
  id?: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  status: "Todo" | "In Progress" | "Done";
  due_date: string;
}

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (task: Task) => void;
  onCancel: () => void;
}

export default function TaskForm({ initialData, onSubmit, onCancel }: TaskFormProps) {
  const { t } = useTranslation();
  const [task, setTask] = useState<Task>(initialData || {
    title: "",
    description: "",
    priority: "Medium",
    status: "Todo",
    due_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = TaskSchema.safeParse(task);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid input";
      toast.error(firstError);
      return;
    }
    onSubmit(result.data as Task);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-card border rounded-xl shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">{t("dashboard.task_title")}</Label>
          <Input
            id="title"
            value={task.title}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
            placeholder="..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">{t("dashboard.task_due_date")}</Label>
          <Input
            id="due_date"
            type="date"
            value={task.due_date}
            onChange={(e) => setTask({ ...task, due_date: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("dashboard.task_description")}</Label>
        <Input
          id="description"
          value={task.description}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
          placeholder="..."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">{t("dashboard.task_priority")}</Label>
            <Select
              id="priority"
              value={task.priority}
              onChange={(e) => setTask({ ...task, priority: e.target.value as any })}
            >
              <option value="Low">{t("priority.low")}</option>
              <option value="Medium">{t("priority.medium")}</option>
              <option value="High">{t("priority.high")}</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">{t("dashboard.task_status")}</Label>
            <Select
              id="status"
              value={task.status}
              onChange={(e) => setTask({ ...task, status: e.target.value as any })}
            >
              <option value="Todo">{t("status.todo")}</option>
              <option value="In Progress">{t("status.in_progress")}</option>
              <option value="Done">{t("status.done")}</option>
            </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("dashboard.cancel")}
        </Button>
        <Button type="submit">
          {initialData ? t("dashboard.update_task") : t("dashboard.create_task")}
        </Button>
      </div>
    </form>
  );
}
