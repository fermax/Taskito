"use client"

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Timer, Flame, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/LanguageProvider";
import { toast } from "sonner";

export default function FocusTimer() {
  const { locale, t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play beep sound when timer completes using browser's AudioContext
  const playAlarmSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Double beep
      [0, 0.4].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(660, ctx.currentTime + delay); // E5 note
        
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.3);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.3);
      });
    } catch (e) {
      console.warn("AudioContext failed to initialize:", e);
    }
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    playAlarmSound();

    if (mode === "work") {
      const focusMinutesAdded = 25;
      const currentMinutes = parseInt(localStorage.getItem("taskito_focus_minutes") || "0", 10);
      const newMinutes = currentMinutes + focusMinutesAdded;
      localStorage.setItem("taskito_focus_minutes", String(newMinutes));
      
      // Dispatch custom event to notify ProgressOverview
      window.dispatchEvent(new Event("taskito_focus_updated"));

      toast.success(
        locale === "ar"
          ? "رائع! اكتملت جلسة التركيز المحددة (25 دقيقة). خذ قسطاً من الراحة!"
          : locale === "fr"
          ? "Excellent ! Séance de travail terminée (25 min). Prenez une pause !"
          : "Great job! Focus session completed (25 min). Time for a break!"
      );
      
      // Switch to break mode
      setMode("break");
      setTimeLeft(5 * 60);
    } else {
      toast.success(
        locale === "ar"
          ? "انتهت الاستراحة. لنعد للعمل بنشاط!"
          : locale === "fr"
          ? "La pause est terminée. Retournons au travail !"
          : "Break is over. Let's get back to work!"
      );
      setMode("work");
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(mode === "work" ? 25 * 60 : 5 * 60);
  };

  const changeMode = (newMode: "work" | "break") => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setMode(newMode);
    setTimeLeft(newMode === "work" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper translations for UI labels
  const uiTexts = {
    title: locale === "ar" ? "مؤقت التركيز" : locale === "fr" ? "Minuteur Focus" : "Focus Timer",
    work: locale === "ar" ? "تركيز" : locale === "fr" ? "Travail" : "Focus",
    break: locale === "ar" ? "استراحة" : locale === "fr" ? "Pause" : "Break",
    start: locale === "ar" ? "بدء" : locale === "fr" ? "Démarrer" : "Start",
    pause: locale === "ar" ? "إيقاف مؤقت" : locale === "fr" ? "Pause" : "Pause",
    reset: locale === "ar" ? "إعادة ضبط" : locale === "fr" ? "Réinitialiser" : "Reset"
  };

  return (
    <div className="p-6 bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col items-center text-center gap-4 transition-all hover:border-primary/20">
      <div className="flex items-center gap-2 font-semibold text-lg text-foreground w-full justify-start border-b pb-2">
        <Timer className="w-5 h-5 text-primary" />
        <span>{uiTexts.title}</span>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-full max-w-[200px]">
        <button
          onClick={() => changeMode("work")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === "work"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {uiTexts.work}
        </button>
        <button
          onClick={() => changeMode("break")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === "break"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {uiTexts.break}
        </button>
      </div>

      <div className="relative py-4">
        <div className="text-5xl font-bold tracking-tight tabular-nums select-none text-foreground font-mono">
          {formatTime(timeLeft)}
        </div>
        {isActive && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 w-full max-w-[240px]">
        <Button
          onClick={toggleTimer}
          variant={isActive ? "outline" : "default"}
          className="flex-1 gap-1.5 h-10"
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4" />
              <span>{uiTexts.pause}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>{uiTexts.start}</span>
            </>
          )}
        </Button>
        <Button
          onClick={resetTimer}
          variant="ghost"
          className="w-10 h-10 p-0 border border-border"
          aria-label={uiTexts.reset}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
