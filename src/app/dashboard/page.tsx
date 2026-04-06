"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Scroll,
  ArrowLeft,
  Timer,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  CHAT_RATE_WINDOW_MS_DEFAULT,
  getChatRateSecondsLeft,
} from "@/lib/chat-rate-constants";
import { GAME_GENRES, extraGenresFromGames } from "@/lib/game-genres";
import { useSubmitLock } from "@/hooks/use-submit-lock";
import { Spinner, SpinnerBlock } from "@/components/ui/spinner";

const GENRE_FILTER_NONE = "__none__";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type GameOption = {
  id: string;
  title: string;
  genre: string | null;
  thumbnail_url: string | null;
};

type GameSort = "genre" | "title";

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
  const [sendTimestamps, setSendTimestamps] = useState<number[]>([]);
  const [lockUntilServer, setLockUntilServer] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [gameSort, setGameSort] = useState<GameSort>("genre");
  const [genreFilter, setGenreFilter] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [realmNavBusy, setRealmNavBusy] = useState(false);
  const backNavLockRef = useRef(false);
  const sendChatBtnRef = useRef<HTMLButtonElement>(null);
  const chatSubmitLock = useSubmitLock();

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (lockUntilServer != null && Date.now() >= lockUntilServer) {
      setLockUntilServer(null);
    }
  }, [lockUntilServer, tick]);

  const now = Date.now();
  const clientCooldownSec = getChatRateSecondsLeft(sendTimestamps, now);
  const serverCooldownSec =
    lockUntilServer != null && lockUntilServer > now
      ? Math.max(0, Math.ceil((lockUntilServer - now) / 1000))
      : 0;
  const rateLimitSecondsLeft = Math.max(clientCooldownSec, serverCooldownSec);
  void tick;

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
        return "";
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

  useEffect(() => {
    if (gameId === "") {
      setRealmNavBusy(false);
    }
  }, [gameId]);

  const selectRealm = useCallback(
    (id: string) => {
      if (realmNavBusy) return;
      flushSync(() => {
        setRealmNavBusy(true);
        setGameId(id);
      });
    },
    [realmNavBusy]
  );

  const returnToRealmSelection = useCallback(() => {
    if (backNavLockRef.current) return;
    backNavLockRef.current = true;
    setGameId("");
    setMessages(WELCOME_MESSAGES);
    queueMicrotask(() => {
      backNavLockRef.current = false;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (rateLimitSecondsLeft > 0) {
      toast.error(`Wait ${rateLimitSecondsLeft}s before sending another message.`);
      return;
    }
    if (!gameId) {
      toast.error("Select a game first");
      return;
    }
    if (!chatSubmitLock.acquire()) return;
    const sendBtn = sendChatBtnRef.current;
    if (sendBtn?.disabled) {
      chatSubmitLock.release();
      return;
    }
    if (sendBtn) sendBtn.disabled = true;

    try {
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
        if (!res.ok) {
          if (res.status === 429) {
            const retryRaw = res.headers.get("Retry-After");
            let retrySec = retryRaw ? Number.parseInt(retryRaw, 10) : NaN;
            if (!Number.isFinite(retrySec) || retrySec < 1) retrySec = 60;
            setLockUntilServer(Date.now() + retrySec * 1000);
            const msg =
              typeof data.error === "string"
                ? data.error
                : "Too many messages per minute. Please wait before sending another.";
            toast.error(msg);
            return;
          }
          throw new Error(data.error ?? "Chat request failed");
        }

        const w = CHAT_RATE_WINDOW_MS_DEFAULT;
        setSendTimestamps((prev) => [
          ...prev.filter((t) => Date.now() - t < w),
          Date.now(),
        ]);

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
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      chatSubmitLock.release();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const currentGame = games.find((g) => g.id === gameId);

  const legacyGenreOptions = useMemo(
    () => extraGenresFromGames(games.map((g) => g.genre)),
    [games]
  );

  const displayGames = useMemo(() => {
    let list = games.filter((g) => {
      if (genreFilter === "") return true;
      if (genreFilter === GENRE_FILTER_NONE) return !(g.genre ?? "").trim();
      return g.genre === genreFilter;
    });
    const cmpGenre = (a: GameOption, b: GameOption) => {
      const sa = (a.genre ?? "").trim();
      const sb = (b.genre ?? "").trim();
      if (!sa && !sb) return 0;
      if (!sa) return 1;
      if (!sb) return -1;
      const g = sa.localeCompare(sb, undefined, { sensitivity: "base" });
      if (g !== 0) return g;
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    };
    if (gameSort === "title") {
      list.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
    } else {
      list.sort(cmpGenre);
    }
    return list;
  }, [games, gameSort, genreFilter]);

  if (gamesLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <SpinnerBlock label="Scrying the realms..." />
      </div>
    );
  }

  if (gameId === "") {
    return (
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.08),transparent_50%)]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center space-y-2">
            <h2
              className="text-3xl md:text-4xl text-white font-bold tracking-tight"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Select your Realm
            </h2>
            <p className="text-[#8b7faa]">Choose a game to begin your lore quest</p>
          </div>

          {games.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-[#8b7faa] uppercase tracking-wider">
                  Genre
                </label>
                <select
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="rounded-xl bg-[rgba(15,10,30,0.9)] border border-[rgba(139,92,246,0.2)] text-sm text-[#e8e0f0] px-3 py-2 outline-none focus:border-purple-500/50 min-w-[11rem]"
                >
                  <option value="">All genres</option>
                  <option value={GENRE_FILTER_NONE}>No genre</option>
                  {GAME_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  {legacyGenreOptions.length > 0 ? (
                    <optgroup label="Other (legacy)">
                      {legacyGenreOptions.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-[#8b7faa] uppercase tracking-wider">
                  Sort by
                </label>
                <select
                  value={gameSort}
                  onChange={(e) => setGameSort(e.target.value as GameSort)}
                  className="rounded-xl bg-[rgba(15,10,30,0.9)] border border-[rgba(139,92,246,0.2)] text-sm text-[#e8e0f0] px-3 py-2 outline-none focus:border-purple-500/50"
                >
                  <option value="genre">Genre, then title</option>
                  <option value="title">Title (A–Z)</option>
                </select>
              </div>
            </div>
          ) : null}

          {games.length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed border-2 border-[rgba(139,92,246,0.15)] bg-transparent">
              <Scroll className="w-12 h-12 text-[rgba(139,92,246,0.3)] mx-auto mb-4" />
              <p className="text-[#8b7faa]">
                No realms have been indexed yet. Ask an admin to upload lore documents.
              </p>
            </div>
          ) : displayGames.length === 0 ? (
            <div className="glass-card p-12 text-center border border-[rgba(139,92,246,0.15)] bg-transparent max-w-lg mx-auto">
              <p className="text-[#8b7faa] text-sm">
                No games match this genre filter. Try &quot;All genres&quot; or another option.
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12 ${
                realmNavBusy ? "pointer-events-none opacity-70" : ""
              }`}
            >
              {displayGames.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  disabled={realmNavBusy}
                  aria-busy={realmNavBusy}
                  onClick={() => selectRealm(g.id)}
                  className="group relative flex flex-col items-stretch text-left transition-all duration-300 hover:-translate-y-2 focus:outline-none disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-[rgba(139,92,246,0.2)] bg-[#0f0a1e] relative">
                    {g.thumbnail_url ? (
                      <img
                        src={g.thumbnail_url}
                        alt={g.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a0f3c] to-[#0f0a1e]">
                        <Sparkles className="w-10 h-10 text-[rgba(139,92,246,0.2)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06020f] via-transparent to-transparent opacity-60" />
                  </div>

                  <div className="mt-4 px-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                      {g.title}
                    </h3>
                    {g.genre ? (
                      <p className="text-xs text-[#8b7faa] mt-1 truncate">{g.genre}</p>
                    ) : null}
                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">
                        Enter Realm
                      </span>
                      <div className="h-px flex-1 bg-purple-500/30" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.03),transparent_50%)]">
      <div className="flex-shrink-0 border-b border-[rgba(139,92,246,0.1)] px-4 md:px-6 py-3 bg-[rgba(6,2,15,0.4)] backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              type="button"
              onClick={returnToRealmSelection}
              className="p-2 rounded-lg hover:bg-white/5 text-[#8b7faa] hover:text-white transition-colors flex-shrink-0"
              title="Return to selection"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-white/10" />
            <h2 className="text-sm font-medium text-white truncate">
              {currentGame?.title}
            </h2>
          </div>

          {currentGame?.thumbnail_url && (
            <img
              src={currentGame.thumbnail_url}
              alt=""
              className="w-8 h-8 rounded-lg object-cover border border-[rgba(139,92,246,0.2)]"
            />
          )}
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
                <Spinner size="sm" />
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
              ref={sendChatBtnRef}
              type="submit"
              disabled={
                !input.trim() ||
                isLoading ||
                !gameId ||
                rateLimitSecondsLeft > 0
              }
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:from-purple-500 hover:to-purple-600 transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {rateLimitSecondsLeft > 0 ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(236,72,153,0.35)] bg-[rgba(236,72,153,0.12)] px-2.5 py-1 text-[11px] font-medium text-pink-200"
                role="status"
                aria-live="polite"
              >
                <Timer className="w-3.5 h-3.5 shrink-0 opacity-90" />
                Next message in {rateLimitSecondsLeft}s
              </span>
            ) : null}
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[rgba(139,92,246,0.3)]" />
              <p className="text-[10px] text-[rgba(139,92,246,0.3)]">
                Answers use RAG over your uploads; they are not general web knowledge.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
