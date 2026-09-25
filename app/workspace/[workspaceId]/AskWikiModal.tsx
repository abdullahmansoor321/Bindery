"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  ExternalLink,
  Loader2,
  Trash2,
  Copy,
  Check,
  X,
  Bot,
  User,
  CornerDownLeft,
  FileText,
} from "lucide-react";
import { generateRagResponse, RagResponse } from "@/app/actions/rag-response";

interface AskWikiModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  citations?: RagResponse["citations"];
  isError?: boolean;
};

const SUGGESTED_QUESTIONS = [
  "What is this workspace about?",
  "What are our main guidelines or policies?",
  "Summarize our current projects or roadmap",
];

export function AskWikiModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
}: AskWikiModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageSequenceRef = useRef(0);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSend(textToSend?: string) {
    const question = (textToSend ?? query).trim();
    if (!question || isLoading) return;

    messageSequenceRef.current += 1;
    const messageSequence = messageSequenceRef.current;
    const userMessage: ChatMessage = {
      id: `user-${messageSequence}`,
      sender: "user",
      text: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const result = await generateRagResponse(workspaceId, question);
      const botMessage: ChatMessage = {
        id: `bot-${messageSequence}`,
        sender: "assistant",
        text: result.answer,
        timestamp: new Date(),
        citations: result.citations,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `err-${messageSequence}`,
        sender: "assistant",
        text:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while consulting your workspace knowledge.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleCopy(messageId: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  }

  function handleClearChat() {
    if (isLoading) return;
    setMessages([]);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1F2421]/45 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Chatbot Window */}
      <div className="relative w-full max-w-2xl h-[88vh] max-h-[760px] bg-[#FAF8F5] border border-[#EAE5DC] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-[#EAE5DC] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#143325] to-[#2E5A44] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-[#DFECE8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-semibold text-[#1F2421] text-base leading-tight">
                  Ask the Wiki
                </h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-[#E9F0EC] text-[#143325] font-semibold border border-[#449E73]/20">
                  RAG Assistant
                </span>
              </div>
              <p className="text-[11px] text-[#6B6E6B] flex items-center gap-1.5 mt-0.5">
                <span>Searching knowledge in</span>
                <span className="font-medium text-[#143325] truncate max-w-[200px]">
                  {workspaceName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                disabled={isLoading}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-[#6B6E6B] hover:text-[#B83A3A] hover:bg-[#F5F2EC] transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 rounded-lg text-[#6B6E6B] hover:text-[#1F2421] hover:bg-[#F5F2EC] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Welcome / Empty State */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-[#E9F0EC] border border-[#449E73]/20 flex items-center justify-center text-[#143325] mb-3 shadow-xs">
                <Bot className="w-6 h-6 text-[#143325]" />
              </div>
              <h4 className="font-serif font-semibold text-[#1F2421] text-base sm:text-lg mb-1">
                How can I help you today?
              </h4>
              <p className="text-xs sm:text-sm text-[#6B6E6B] max-w-md mb-6 leading-relaxed">
                Ask questions about documents, notes, and guidelines stored in{" "}
                <span className="font-medium text-[#143325]">{workspaceName}</span>.
                Answers are grounded strictly in your team&apos;s pages.
              </p>

              {/* Quick suggestion prompt chips */}
              <div className="w-full max-w-md space-y-2">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#A3AAA3] text-left">
                  Suggested inquiries
                </p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTED_QUESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(suggestion)}
                      className="w-full text-left text-xs text-[#1F2421] bg-white hover:bg-[#F5F2EC] border border-[#EAE5DC] hover:border-[#143325]/30 rounded-xl px-3.5 py-2.5 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <span className="truncate">{suggestion}</span>
                      <CornerDownLeft className="w-3.5 h-3.5 text-[#A3AAA3] group-hover:text-[#143325] shrink-0 ml-2 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation history bubbles */}
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 group ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#143325] to-[#2E5A44] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#DFECE8]" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed transition-all ${
                    isUser
                      ? "bg-[#143325] text-white rounded-br-xs shadow-xs"
                      : msg.isError
                      ? "bg-[#FDF2F2] border border-[#F8B4B4] text-[#B83A3A] rounded-bl-xs"
                      : "bg-white border border-[#EAE5DC] text-[#1F2421] rounded-bl-xs shadow-xs"
                  }`}
                >
                  {/* User name / AI label in bubble header */}
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider ${
                        isUser ? "text-white/60" : "text-[#6B6E6B]"
                      }`}
                    >
                      {isUser ? "You" : "Bindery AI"}
                    </span>

                    {/* Copy action for assistant responses */}
                    {!isUser && !msg.isError && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A3AAA3] hover:text-[#1F2421] p-0.5 rounded"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3 h-3 text-[#10B981]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Body Text */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Validated Source Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#EAE5DC] space-y-1.5">
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6B6E6B] flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Referenced Sources</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, idx) => (
                          <a
                            key={`${c.pageId}-${idx}`}
                            href={`/workspace/${workspaceId}/page/${c.pageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E9F0EC] hover:bg-[#DFECE8] border border-[#449E73]/25 text-[11px] font-medium text-[#143325] transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-[#449E73] shrink-0" />
                            <span className="truncate max-w-[160px]">{c.pageName}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-[9px] mt-1.5 text-right font-mono ${
                      isUser ? "text-white/50" : "text-[#A3AAA3]"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#EAE5DC] flex items-center justify-center text-[#1F2421] shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#6B6E6B]" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator Bubble */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-start animate-in fade-in duration-150">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#143325] to-[#2E5A44] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#DFECE8]" />
              </div>
              <div className="bg-white border border-[#EAE5DC] rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 text-[#449E73] animate-spin shrink-0" />
                <span className="text-xs text-[#6B6E6B]">
                  Searching workspace & synthesizing answer...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#EAE5DC] shrink-0">
          <div className="relative flex items-center bg-[#FAF8F5] border border-[#EAE5DC] focus-within:border-[#143325] focus-within:ring-1 focus-within:ring-[#143325] rounded-xl transition-all shadow-2xs">
            <textarea
              ref={inputRef}
              rows={1}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this workspace..."
              disabled={isLoading}
              className="w-full resize-none bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-[#1F2421] placeholder:text-[#A3AAA3] focus:outline-none max-h-32 disabled:opacity-50"
            />
            <div className="pr-2 flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleSend()}
                disabled={!query.trim() || isLoading}
                className="w-8 h-8 rounded-lg bg-[#143325] hover:bg-[#204D39] text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-[#143325] shadow-xs cursor-pointer"
                title="Send message (Enter)"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#A3AAA3]">
            <span>Grounded in workspace content only</span>
            <span className="hidden sm:inline font-mono text-[10px]">
              Enter ↵ to send · Shift + Enter for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}