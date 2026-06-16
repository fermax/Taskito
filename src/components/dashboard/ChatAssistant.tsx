"use client"

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { useTranslation } from "@/components/LanguageProvider";
import { toast } from "sonner";
import DOMPurify from "dompurify";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-lg my-2 overflow-x-auto text-xs"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
    .replace(/### (.+)/g, '<h4 class="font-bold text-sm mt-3 mb-1">$1</h4>')
    .replace(/## (.+)/g, '<h3 class="font-bold text-base mt-3 mb-1">$1</h3>')
    .replace(/# (.+)/g, '<h2 class="font-bold text-lg mt-3 mb-1">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const lines = html.split('\n');
  let result = '';
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^[\s]*[-*]\s+(.+)/);
    const olMatch = line.match(/^[\s]*\d+[.)]\s+(.+)/);

    if (ulMatch) {
      if (!inUl) { result += '<ul class="list-disc pl-4 my-1 space-y-0.5">'; inUl = true; }
      if (inOl) { result += '</ol>'; inOl = false; }
      result += `<li class="text-sm">${ulMatch[1]}</li>`;
    } else if (olMatch) {
      if (!inOl) { result += '<ol class="list-decimal pl-4 my-1 space-y-0.5">'; inOl = true; }
      if (inUl) { result += '</ul>'; inUl = false; }
      result += `<li class="text-sm">${olMatch[1]}</li>`;
    } else {
      if (inUl) { result += '</ul>'; inUl = false; }
      if (inOl) { result += '</ol>'; inOl = false; }
      if (line.trim() === '') {
        result += '<div class="h-2"></div>';
      } else if (!line.startsWith('<h') && !line.startsWith('<pre')) {
        result += `<p class="text-sm leading-relaxed">${line}</p>`;
      } else {
        result += line;
      }
    }
  }
  if (inUl) result += '</ul>';
  if (inOl) result += '</ol>';

  return result;
}

function TypewriterMessage({ content, speed = 20 }: { content: string; speed?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const fullHtml = renderMarkdown(content);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (displayed < fullHtml.length) {
      const timer = setTimeout(() => {
        const step = Math.max(1, Math.floor(fullHtml.length / 80));
        setDisplayed(Math.min(displayed + step, fullHtml.length));
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [displayed, fullHtml.length, speed]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayed]);

  const visible = fullHtml.slice(0, Math.min(displayed, fullHtml.length));

  return (
    <div
      ref={containerRef}
      className="max-w-none [&_*]:break-words"
      dir="auto"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(visible + (displayed < fullHtml.length ? '<span class="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5"></span>' : ''), { ADD_TAGS: ['span'], ADD_ATTR: ['class'] }) }}
    />
  );
}

function MessageContent({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>;
  }
  return <TypewriterMessage content={msg.content} />;
}

export default function ChatAssistant() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: 'assistant', content: t("ai.welcome") }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const userMsgId = `user-${Date.now()}`;
    setInput("");
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: tasks } = await supabase.from("tasks").select("*").eq("user_id", user?.id);
      const safeContext = (tasks || []).map((t: any) => ({
        title: t.title,
        description: t.description || "",
        priority: t.priority,
        status: t.status,
        due_date: t.due_date,
      }));

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          context: safeContext,
          userProfile: {
            name: user?.user_metadata?.full_name || "",
            email: user?.email || "",
          }
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const aiMsgId = `ai-${Date.now()}`;
      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: data.message }]);
    } catch (error: any) {
      toast.error(error.message || t("ai.error_fallback"));
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: t("ai.error") }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 start-6 w-14 h-14 rounded-full shadow-2xl z-50 gap-0 p-0"
        aria-label={isOpen ? "Close AI chat assistant" : "Open AI chat assistant"}
      >
        <Sparkles className="w-6 h-6" />
      </Button>

      {isOpen && (
        <div
          className={`fixed inset-0 z-[60] flex items-end p-4 pointer-events-none justify-end`}
          role="dialog"
          aria-modal="true"
          aria-label="AI Chat Assistant"
        >
          <div className="w-full max-w-md h-[600px] max-h-[90vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden pointer-events-auto transition-all animate-in slide-in-from-bottom-5">
            <div className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-semibold">Taskito AI Coach</span>
              </div>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary/80"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite" aria-label="Chat messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted text-foreground rounded-tl-none'
                  }`}>
                    <MessageContent msg={msg} />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-2xl rounded-tl-none text-sm animate-pulse">
                    {t("ai.thinking")}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-card">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("ai.placeholder")}
                  className="flex-1"
                  aria-label="Chat message input"
                />
                <Button type="submit" disabled={isLoading} aria-label="Send message">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
