"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type GameOption = {
  id: string;
  title: string;
  thumbnail_url: string | null;
};

const WELCOME_MESSAGES: Message[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "⚔️ Greetings! Choose your realm above, then ask about lore from the documents your admins have uploaded. I answer from that game’s indexed knowledge — not from the open web.",
    timestamp: new Date(),
  },
];

export default function DashboardPage() {
  const [games, setGames] = useState<GameOption[]>([]);
  const [gameId, setGameId] = useState<string>("");
  const [gamesLoading, setGamesLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>(WELCOME_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadGames = useCallback(async () => {
    setGamesLoading(true);
    try {
      const res = await fetch("/api/games");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load games");
      const list: GameOption[] = data.games ?? [];
      setGames(list);
      setGameId((prev) => {
        if (prev && list.some((g) => g.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load games");
    } finally {
      setGamesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!gameId) {
      toast.error("Select a game first");
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const payloadMessages = nextMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          messages: payloadMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat request failed");

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply as string,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chat failed");
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "I could not reach the lore service. Check GROQ_API_KEY, Supabase, and that the latest pgvector migration (768-dim embeddings) is applied.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const currentGame = games.find((g) => g.id === gameId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-[rgba(139,92,246,0.12)] px-4 md:px-6 py-3 bg-[rgba(6,2,15,0.4)]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs text-[#8b7faa] whitespace-nowrap shrink-0">
            Realm
          </label>
          <div className="relative flex-1 min-w-0">
            <select
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              disabled={gamesLoading || games.length === 0}
              className="w-full appearance-none rounded-xl bg-[rgba(15,10,30,0.9)] border border-[rgba(139,92,246,0.2)] text-sm text-[#e8e0f0] px-4 py-2.5 pr-10 outline-none focus:border-purple-500/40 disabled:opacity-50"
            >
              {games.length === 0 ? (
                <option value="">
                  {gamesLoading ? "Loading…" : "No games — ask an admin to add one"}
                </option>
              ) : (
                games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b7faa] pointer-events-none" />
          </div>
          {currentGame?.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentGame.thumbnail_url}
              alt=""
              className="hidden sm:block w-12 h-12 rounded-lg object-cover border border-[rgba(139,92,246,0.2)]"
            />
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 max-w-3xl mx-auto animate-fade-in-up ${
              message.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                message.role === "assistant"
                  ? "bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)]"
                  : "bg-[rgba(236,72,153,0.15)] border border-[rgba(236,72,153,0.2)]"
              }`}
            >
              {message.role === "assistant" ? (
                <Bot className="w-5 h-5 text-purple-400" />
              ) : (
                <User className="w-5 h-5 text-pink-400" />
              )}
            </div>

            <div
              className={`max-w-[85%] ${
                message.role === "user" ? "chat-bubble-user" : "chat-bubble"
              } px-5 py-4`}
            >
              <p className="text-sm text-[#e8e0f0] leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <span className="block text-[10px] text-[#8b7faa] mt-2">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl mx-auto animate-fade-in-up">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)]">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div className="chat-bubble px-5 py-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm text-[#8b7faa]">
                  Retrieving lore & thinking…
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[rgba(139,92,246,0.1)] bg-[rgba(6,2,15,0.5)] backdrop-blur-xl px-4 md:px-6 py-4">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="max-w-3xl mx-auto relative"
        >
          <div className="glass-card !rounded-2xl p-2 flex items-end gap-2 !bg-[rgba(15,10,30,0.8)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                gameId
                  ? "Ask about this game’s uploaded lore…"
                  : "Select a realm first…"
              }
              rows={1}
              className="flex-1 bg-transparent text-[#e8e0f0] placeholder:text-[rgba(139,102,204,0.4)] text-sm resize-none border-none outline-none px-4 py-3 max-h-32"
              style={{ minHeight: "44px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !gameId}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:from-purple-500 hover:to-purple-600 transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Sparkles className="w-3 h-3 text-[rgba(139,92,246,0.3)]" />
            <p className="text-[10px] text-[rgba(139,92,246,0.3)]">
              Answers use RAG over your uploads; they are not general web knowledge.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
