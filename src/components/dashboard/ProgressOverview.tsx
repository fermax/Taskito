"use client"

import React, { useEffect, useState } from "react";
import { Target, Clock, CheckCircle2, Flame, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useTranslation } from "@/components/LanguageProvider";
import { format, subDays, isSameDay, parseISO } from "date-fns";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="p-6 bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col items-center text-center gap-3 transition-all hover:border-primary/30 group">
      <div className={`p-4 rounded-2xl ${bgColor} ${color} transition-transform group-hover:scale-110`}>
        <Icon className="w-8 h-8" />
      </div>
      <div className="flex flex-col items-center">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold tracking-tight mt-1">{value}</p>
      </div>
    </div>
  );
}

export default function ProgressOverview() {
  const { locale, t } = useTranslation();
  const supabase = createClient();
  const [stats, setStats] = useState({
    completed: 0,
    dueToday: 0,
    streak: 0,
    weeklyData: Array(7).fill(0),
  });
  const [loading, setLoading] = useState(true);
  const [focusMinutes, setFocusMinutes] = useState(0);

  useEffect(() => {
    const loadFocusMinutes = () => {
      const mins = localStorage.getItem("taskito_focus_minutes") || "0";
      setFocusMinutes(parseInt(mins, 10));
    };
    loadFocusMinutes();
    window.addEventListener("taskito_focus_updated", loadFocusMinutes);
    return () => {
      window.removeEventListener("taskito_focus_updated", loadFocusMinutes);
    };
  }, []);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Run both count queries in parallel
        const [completedResult, dueTodayResult, allCompletedResult] = await Promise.all([
          supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "Done").eq("user_id", user.id),
          supabase.from("tasks").select("*", { count: "exact", head: true }).eq("due_date", today).eq("user_id", user.id),
          supabase.from("tasks").select("created_at").eq("status", "Done").eq("user_id", user.id).order("created_at", { ascending: false }),
        ]);

        const completedCount = completedResult.count || 0;
        const dueTodayCount = dueTodayResult.count || 0;
        const completedTasks = allCompletedResult.data || [];

        // Weekly data + streak from a single result set
        const sevenDaysAgo = subDays(new Date(), 6);
        const weeklyData = Array(7).fill(0);
        const completionDates = new Set<string>();

        completedTasks.forEach((task: { created_at: string }) => {
          const date = parseISO(task.created_at);
          const dateStr = format(date, "yyyy-MM-dd");
          completionDates.add(dateStr);

          const diff = Math.floor((new Date().setHours(0,0,0,0) - date.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff < 7) {
            weeklyData[6 - diff]++;
          }
        });

        let streak = 0;
        let checkDate = new Date();
        while (true) {
          const dateStr = format(checkDate, "yyyy-MM-dd");
          if (completionDates.has(dateStr)) {
            streak++;
            checkDate = subDays(checkDate, 1);
          } else {
            if (isSameDay(checkDate, new Date())) {
              checkDate = subDays(checkDate, 1);
              continue;
            }
            break;
          }
        }

        setStats({
          completed: completedCount,
          dueToday: dueTodayCount,
          streak,
          weeklyData,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <div className="p-6 text-center animate-pulse text-muted-foreground">{t("dashboard.calculating_stats")}</div>;

  const maxWeekly = Math.max(...stats.weeklyData, 1);

  const focusHours = (focusMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          label={t("dashboard.metrics_completed")} 
          value={stats.completed} 
          icon={CheckCircle2} 
          color="text-green-500" 
          bgColor="bg-green-500/10" 
        />
        <StatCard 
          label={t("dashboard.due_today")} 
          value={stats.dueToday} 
          icon={Calendar} 
          color="text-blue-500" 
          bgColor="bg-blue-500/10" 
        />
        <StatCard 
          label={t("dashboard.streak")} 
          value={`${stats.streak} ${t("dashboard.days")}`} 
          icon={Flame} 
          color="text-orange-500" 
          bgColor="bg-orange-500/10" 
        />
        <StatCard 
          label={t("dashboard.metrics_focus")} 
          value={`${focusHours} ${locale === "ar" ? "س" : "h"}`} 
          icon={Clock} 
          color="text-purple-500" 
          bgColor="bg-purple-500/10" 
        />
      </div>

      <div className="p-6 bg-card rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">{t("dashboard.weekly_activity")}</h3>
          <p className="text-xs text-muted-foreground">{t("dashboard.weekly_activity_desc")}</p>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-32 px-2">
          {stats.weeklyData.map((count, index) => {
            const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
            const today = new Date();
            const currentDay = today.getDay();
            const dayKey = dayKeys[(currentDay - 6 + index + 7) % 7];
            const dayName = t(`days.${dayKey}`);
            const heightPercentage = (count / maxWeekly) * 100;

            return (
              <div key={index} className="flex flex-col items-center gap-2 flex-1 max-w-[40px]">
                <div className="relative w-full group">
                  <div 
                    className="bg-primary rounded-t-sm transition-all duration-500 ease-out"
                    style={{ height: `${heightPercentage}%`, minHeight: count > 0 ? '4px' : '0px' }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
