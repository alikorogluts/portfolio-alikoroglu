"use client";

import { FormEvent, KeyboardEvent, RefObject } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";

import type { AssistantChatMessage } from "./assistant-chat.types";

const SUGGESTIONS = [
  "DeepSecure ne işe yarıyor?",
  "RabbitMQ hangi projelerde kullanılıyor?",
  "What technologies are used in this portfolio?",
];

type AssistantChatPanelProps = {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  messages: AssistantChatMessage[];
  input: string;
  isLoading: boolean;
  errorMessage: string | null;
  isMobile: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
  onSuggestion: (question: string) => void;
  onClose: () => void;
  onPanelKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

export function AssistantChatPanel({
  inputRef,
  messages,
  input,
  isLoading,
  errorMessage,
  isMobile,
  onInputChange,
  onSubmit,
  onSuggestion,
  onClose,
  onPanelKeyDown,
}: AssistantChatPanelProps) {
  const hasMessages = messages.length > 0;

  return (
    <section
      className={[
        "fixed z-[80] flex flex-col border border-white/10 bg-background/92 text-foreground shadow-2xl shadow-black/45 backdrop-blur-2xl",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150",
        isMobile
          ? "inset-0 h-[100dvh] w-screen rounded-none border-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          : "bottom-24 right-6 h-[min(680px,calc(100dvh-8rem))] w-[min(430px,calc(100vw-3rem))] rounded-2xl",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-chat-title"
      onKeyDown={onPanelKeyDown}
    >
      <header className="flex min-h-16 items-center justify-between border-b border-white/10 px-4">
        <div className="min-w-0">
          <h2 id="assistant-chat-title" className="truncate text-sm font-medium tracking-tight">
            Portfolio Assistant
          </h2>
          <div className="mt-1 inline-flex h-5 items-center rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 text-[11px] font-medium text-emerald-100">
            local/dev
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground/80 transition hover:bg-white/[0.08] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={onClose}
          aria-label="Assistant chat'i kapat"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        {!hasMessages ? (
          <div className="flex min-h-full flex-col justify-end gap-4">
            <div>
              <p className="text-sm leading-6 text-foreground/72">
                Portföy projeleri, kullanılan teknolojiler ve çalışma detayları hakkında sorular sorabilirsin.
              </p>
            </div>
            <div className="grid gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="min-h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm leading-5 text-foreground/85 transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  onClick={() => onSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={[
                    "max-w-[86%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                    message.role === "user"
                      ? "rounded-br-md bg-foreground text-background"
                      : "rounded-bl-md border border-white/10 bg-white/[0.05] text-foreground/88",
                  ].join(" ")}
                >
                  {message.content}
                </p>
              </article>
            ))}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="flex max-w-[86%] items-center gap-3 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.055] px-3.5 py-3 text-sm text-foreground/78 shadow-lg shadow-black/10">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-foreground text-background">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[13px] font-medium text-foreground/86">Assistant düşünüyor</span>
                    <span className="flex h-3 items-center gap-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/45" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/45 [animation-delay:140ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/45 [animation-delay:280ms]" />
                    </span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {errorMessage ? (
        <div className="mx-4 mb-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm leading-5 text-amber-100">
          {errorMessage}
        </div>
      ) : null}

      <form className="border-t border-white/10 p-3" onSubmit={onSubmit}>
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 focus-within:border-white/25">
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            maxLength={500}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-5 text-foreground placeholder:text-foreground/38 focus:outline-none"
            placeholder="Portföy hakkında sor..."
            aria-label="Assistant sorusu"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition hover:bg-foreground/88 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            disabled={isLoading || input.trim().length === 0}
            aria-label="Soruyu gönder"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
