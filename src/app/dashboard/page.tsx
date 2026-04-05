"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGES: Message[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "⚔️ Greetings, adventurer! I am the GameLore Oracle — your guide through the vast tapestry of game mythology and lore. Ask me anything about your favorite game worlds, characters, quests, or hidden storylines. Which realm shall we explore first?",
    timestamp: new Date(),
  },
];

export default function DashboardPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (replace with actual RAG + LLM integration later)
    setTimeout(() => {
      const responses = [
        `That's a fascinating question about game lore! Let me weave this tale for you...\n\nIn the annals of gaming history, this topic connects deeply with the foundational mythology. The creators drew inspiration from ancient legends and wove them into a tapestry of interactive storytelling.\n\n*Note: This is a demo response. Connect your RAG pipeline and LLM API to get real lore answers!*`,
        `Ah, a question worthy of a true lore hunter! 📜\n\nThe threads of this narrative run deep through the game's world. Every character, every location has layers of meaning waiting to be uncovered.\n\nThe deeper lore suggests connections that most players miss on their first playthrough...\n\n*Note: This is a demo response. Your RAG + LLM integration will provide accurate, sourced answers!*`,
        `The Oracle has consulted the ancient texts... 🔮\n\nThis is one of the most debated topics in the gaming lore community. Multiple interpretations exist, each supported by different pieces of in-game evidence.\n\nLet me break it down for you...\n\n*Note: This is a placeholder response. Once you connect your LLM and RAG pipeline, I'll provide real, detailed lore answers!*`,
      ];

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 max-w-3xl mx-auto animate-fade-in-up ${
              message.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {/* Avatar */}
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

            {/* Message bubble */}
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

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl mx-auto animate-fade-in-up">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.2)]">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div className="chat-bubble px-5 py-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm text-[#8b7faa]">
                  Consulting the ancient texts...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[rgba(139,92,246,0.1)] bg-[rgba(6,2,15,0.5)] backdrop-blur-xl px-4 md:px-6 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto relative"
        >
          <div className="glass-card !rounded-2xl p-2 flex items-end gap-2 !bg-[rgba(15,10,30,0.8)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any game lore..."
              rows={1}
              className="flex-1 bg-transparent text-[#e8e0f0] placeholder:text-[rgba(139,102,204,0.4)] text-sm resize-none border-none outline-none px-4 py-3 max-h-32"
              style={{ minHeight: "44px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:from-purple-500 hover:to-purple-600 transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Sparkles className="w-3 h-3 text-[rgba(139,92,246,0.3)]" />
            <p className="text-[10px] text-[rgba(139,92,246,0.3)]">
              GameLore AI may produce inaccurate lore. Always cross-reference
              with official sources.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
