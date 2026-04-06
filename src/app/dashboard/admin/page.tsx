"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";

type GameRow = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
};

export default function AdminControlPanelPage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [loreFile, setLoreFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadGames = useCallback(async () => {
    setLoadingGames(true);
    try {
      const res = await fetch("/api/games");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load games");
      setGames(data.games ?? []);
      setSelectedId((prev) => {
        if (prev && data.games?.some((g: GameRow) => g.id === prev)) return prev;
        return data.games?.[0]?.id ?? null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load games");
    } finally {
      setLoadingGames(false);
    }
  }, []);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const selected = games.find((g) => g.id === selectedId) ?? null;

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Enter a game title");
      return;
    }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("title", newTitle.trim());
      if (thumbFile) fd.append("thumbnail", thumbFile);
      const res = await fetch("/api/admin/games", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      toast.success(`Created “${data.game.title}”`);
      setNewTitle("");
      setThumbFile(null);
      await loadGames();
      setSelectedId(data.game.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleUploadLore(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) {
      toast.error("Select a game");
      return;
    }
    if (!loreFile) {
      toast.error("Choose a PDF or DOCX file");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("gameId", selectedId);
      fd.append("file", loreFile);
      const res = await fetch("/api/admin/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast.success(`Indexed ${data.chunkCount} lore chunks`);
      setLoreFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="border-b border-[rgba(139,92,246,0.15)] px-4 md:px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-[#8b7faa] hover:text-[#c4b5fd] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Oracle
        </Link>
        <div className="h-4 w-px bg-[rgba(139,92,246,0.2)]" />
        <h1 className="text-sm font-medium text-white flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-purple-400" />
          Lore control panel
        </h1>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-10 pb-16">
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgba(139,92,246,0.5)]">
            Add a game
          </h2>
          <form
            onSubmit={handleCreateGame}
            className="glass-card !rounded-2xl p-5 space-y-4 !bg-[rgba(15,10,30,0.85)] border border-[rgba(139,92,246,0.12)]"
          >
            <div>
              <label className="block text-xs text-[#8b7faa] mb-1.5">Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={creating}
                placeholder="e.g. Hollow Knight"
                className="w-full rounded-xl bg-[rgba(6,2,15,0.6)] border border-[rgba(139,92,246,0.15)] px-4 py-2.5 text-sm text-[#e8e0f0] placeholder:text-[rgba(139,102,204,0.35)] outline-none focus:border-purple-500/40 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8b7faa] mb-1.5">
                Thumbnail (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
                disabled={creating}
                className="text-xs text-[#8b7faa] file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600/20 file:px-3 file:py-1.5 file:text-xs file:text-purple-200 disabled:opacity-30"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 px-5 py-2.5 text-sm text-white disabled:opacity-40 flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create game
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgba(139,92,246,0.5)]">
            Select game & upload lore
          </h2>
          {loadingGames ? (
            <div className="flex items-center gap-2 text-sm text-[#8b7faa] py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading games…
            </div>
          ) : games.length === 0 ? (
            <p className="text-sm text-[#8b7faa] py-6">
              No games yet. Create one above, then upload PDF or DOCX lore files for that title.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {games.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  disabled={uploading || creating}
                  className={`rounded-2xl border overflow-hidden text-left transition-all ${
                    g.id === selectedId
                      ? "border-purple-500/60 ring-2 ring-purple-500/25 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                      : "border-[rgba(139,92,246,0.12)] hover:border-[rgba(139,92,246,0.25)]"
                  } bg-[rgba(15,10,30,0.85)] disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="aspect-video bg-[rgba(6,2,15,0.8)] flex items-center justify-center">
                    {g.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Gamepad2 className="w-10 h-10 text-[rgba(139,92,246,0.25)]" />
                    )}
                  </div>
                  <p className="px-3 py-2 text-xs text-[#e8e0f0] font-medium truncate">
                    {g.title}
                  </p>
                </button>
              ))}
            </div>
          )}

          {selected ? (
            <form
              onSubmit={handleUploadLore}
              className="glass-card !rounded-2xl p-5 space-y-4 !bg-[rgba(15,10,30,0.85)] border border-[rgba(139,92,246,0.12)] mt-4"
            >
              <p className="text-sm text-[#c4b5fd]">
                Uploading for:{" "}
                <span className="text-white font-medium">{selected.title}</span>
              </p>
              <div>
                <label className="block text-xs text-[#8b7faa] mb-1.5">
                  Lore file (PDF, DOCX, or JSON)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json"
                  onChange={(e) => setLoreFile(e.target.files?.[0] ?? null)}
                  disabled={uploading}
                  className="text-xs text-[#8b7faa] file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600/20 file:px-3 file:py-1.5 file:text-xs file:text-purple-200 disabled:opacity-30"
                />
              </div>
              <button
                type="submit"
                disabled={uploading || !loreFile}
                className="rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-700 px-5 py-2.5 text-sm text-white disabled:opacity-40 flex items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Extract & index for RAG
              </button>
              <p className="text-[10px] text-[#6b5f8a] leading-relaxed">
                Files are stored privately, split into chunks, embedded (Nomic or your configured API),
                and indexed in Postgres (pgvector). Chat uses Groq; vectors use NOMIC_API_KEY or EMBEDDINGS_*,
                because Groq chat keys do not include a working shared embedding model for everyone.
              </p>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}
