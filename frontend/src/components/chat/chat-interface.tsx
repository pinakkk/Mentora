"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Send, Loader2, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/primitives/button";
import { ScrollArea } from "@/components/primitives/scroll-area";
import { Avatar, AvatarFallback } from "@/components/primitives/avatar";
import { ToolCallDisplay } from "./tool-call-display";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  apiEndpoint?: string;
  extraBody?: Record<string, unknown>;
  placeholder?: string;
}

function TypingDots() {
  return (
    <div className="flex gap-2.5">
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarFallback className="text-[10px] bg-violet-100 text-violet-600 font-medium">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          <div className="h-2 w-2 rounded-full bg-violet-300 animate-[pulse_1.4s_ease-in-out_infinite]" />
          <div className="h-2 w-2 rounded-full bg-violet-400 animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
          <div className="h-2 w-2 rounded-full bg-violet-500 animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose-chat text-sm leading-relaxed text-gray-900">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <span className="font-semibold text-gray-900">{children}</span>
          ),
          em: ({ children }) => (
            <span className="italic text-gray-700">{children}</span>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-1.5 space-y-0.5 text-gray-800">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-1.5 space-y-0.5 text-gray-800">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-sm">{children}</li>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-gray-900 text-gray-100 rounded-lg px-3 py-2 my-2 overflow-x-auto text-xs">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-gray-100 text-violet-700 px-1 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          h1: ({ children }) => (
            <p className="font-semibold text-base mb-1">{children}</p>
          ),
          h2: ({ children }) => (
            <p className="font-semibold text-sm mb-1">{children}</p>
          ),
          h3: ({ children }) => (
            <p className="font-semibold text-sm mb-1">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 hover:underline"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-violet-200 pl-3 my-1.5 text-gray-600 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function ChatInterface({
  apiEndpoint = "/api/chat",
  extraBody,
  placeholder = "Send your message...",
}: ChatInterfaceProps) {
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: apiEndpoint,
        body: extraBody,
      }),
    [apiEndpoint, extraBody]
  );

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport,
  });

  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          if (data.messages?.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (e) {
        console.error("Failed to load chat history:", e);
      } finally {
        setLoaded(true);
      }
    }
    loadHistory();
  }, [setMessages]);

  const saveMessages = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (msgs: any[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (msgs.length === 0) return;
        try {
          await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: msgs }),
          });
        } catch (e) {
          console.error("Failed to save chat history:", e);
        }
      }, 1000);
    },
    []
  );

  useEffect(() => {
    if (loaded && messages.length > 0 && status === "ready") {
      saveMessages(messages);
    }
  }, [messages, status, loaded, saveMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  }

  function getMessageText(message: {
    parts?: Array<{ type: string; text?: string }>;
  }) {
    return (
      message.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text || "")
        .join("") || ""
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <ScrollArea className="flex-1 px-4 lg:px-6 py-6" ref={scrollRef}>
        {loaded && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              PlaceAI Coach
            </h3>
            <p className="text-gray-400 text-sm max-w-sm mt-2 leading-relaxed">
              I remember everything about your journey and proactively help you
              prepare for campus placements.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-lg">
              {[
                "Analyze my resume",
                "Create a prep plan for TCS",
                "Start a mock interview",
                "What should I focus on?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loaded && (
          <div className="flex items-center justify-center h-full py-16">
            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" ? (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-end gap-2.5">
                    <div className="bg-violet-500 text-white rounded-2xl rounded-tr-sm py-3 px-4 max-w-[85%] shadow-sm">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {getMessageText(message)}
                      </p>
                    </div>
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="text-[10px] bg-gray-100 text-gray-600 font-medium">
                        You
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-violet-100 text-violet-600 font-medium">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 max-w-[85%] min-w-0">
                    {message.parts?.map((part, i) => {
                      if (part.type.startsWith("tool-")) {
                        const toolPart = part as unknown as {
                          type: string;
                          toolCallId: string;
                          state: string;
                          input?: Record<string, unknown>;
                          output?: unknown;
                          toolName?: string;
                        };
                        const toolName =
                          toolPart.toolName || part.type.replace("tool-", "");
                        return (
                          <ToolCallDisplay
                            key={i}
                            toolCall={{
                              toolName,
                              state: toolPart.state || "call",
                              args: toolPart.input,
                              result: toolPart.output,
                            }}
                          />
                        );
                      }
                      if (
                        part.type === "text" &&
                        (part as { text?: string }).text
                      ) {
                        return (
                          <div
                            key={i}
                            className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm py-3 px-4"
                          >
                            <MarkdownMessage
                              content={(part as { text: string }).text}
                            />
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && messages.length > 0 && <TypingDots />}

          {error && (
            <div className="text-center py-3">
              <span className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
                {error.message || "Something went wrong"}
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-gray-100 bg-white p-4">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto relative">
          <div className="relative flex items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="w-full pl-4 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 transition-all placeholder:text-gray-400 resize-none min-h-[44px] max-h-32"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-lg bg-violet-500 hover:bg-violet-600 text-white shadow-sm disabled:opacity-40"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </form>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          PlaceAI remembers your conversations and acts autonomously
        </p>
      </div>
    </div>
  );
}
