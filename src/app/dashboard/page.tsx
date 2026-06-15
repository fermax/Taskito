"use client"

import UserProfile from "@/components/dashboard/UserProfile";
import TaskManagement from "@/components/dashboard/TaskManagement";
import ProgressOverview from "@/components/dashboard/ProgressOverview";
import FocusTimer from "@/components/dashboard/FocusTimer";
import { useTranslation } from "@/components/LanguageProvider";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </header>

      <UserProfile />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TaskManagement />
        </div>
        <div className="space-y-8">
          <ProgressOverview />
          <FocusTimer />
        </div>
      </div>
    </div>
  );
}
