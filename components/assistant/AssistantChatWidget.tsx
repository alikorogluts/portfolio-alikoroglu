"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";

import { AssistantChatPanel } from "./AssistantChatPanel";
import type { AssistantChatMessage, AssistantChatResponse } from "./assistant-chat.types";

const LOCAL_MODEL_OFFLINE_MESSAGE =
  "Yerel model servisine ulaşılamıyor.\nÖnce local model terminalini başlatmalısın.";

function createMessage(role: AssistantChatMessage["role"], content: string): AssistantChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function AssistantChatWidget() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    inputRef.current?.focus();

    if (isMobile) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isMobile]);

  const submitQuestion = useCallback(
    async (question: string) => {
      const normalizedQuestion = question.trim();

      if (!normalizedQuestion || isLoading) {
        return;
      }

      setMessages((current) => [...current, createMessage("user", normalizedQuestion)]);
      setInput("");
      setErrorMessage(null);
      setIsLoading(true);

      try {
        const response = await fetch("/api/_dev/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: normalizedQuestion }),
        });

        if (!response.ok) {
          throw new Error("Local assistant request failed");
        }

        const payload = (await response.json()) as AssistantChatResponse;
        const answer = typeof payload.answer === "string" ? payload.answer.trim() : "";

        if (!answer) {
          throw new Error("Local assistant returned an empty answer");
        }

        setMessages((current) => [...current, createMessage("assistant", answer)]);
      } catch {
        setErrorMessage(LOCAL_MODEL_OFFLINE_MESSAGE);
      } finally {
        setIsLoading(false);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [isLoading],
  );

  const handleSubmit = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      void submitQuestion(input);
    },
    [input, submitQuestion],
  );

  const handlePanelKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }

      if (event.key !== "Tab" || !isMobile) {
        return;
      }

      const focusableElements = event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [closePanel, isMobile],
  );

  return (
    <>
      {isOpen ? (
        <AssistantChatPanel
          inputRef={inputRef}
          messages={messages}
          input={input}
          isLoading={isLoading}
          errorMessage={errorMessage}
          isMobile={isMobile}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onSuggestion={(question) => {
            setIsOpen(true);
            void submitQuestion(question);
          }}
          onClose={closePanel}
          onPanelKeyDown={handlePanelKeyDown}
        />
      ) : null}

      <button
        type="button"
        className={[
          "fixed bottom-5 right-5 z-[79] inline-flex h-14 min-h-11 w-14 min-w-11 items-center justify-center rounded-full",
          "border border-white/15 bg-foreground text-background shadow-xl shadow-black/35 transition",
          "hover:bg-foreground/88 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          "motion-safe:duration-150 motion-reduce:transition-none sm:bottom-6 sm:right-6",
          isOpen ? "scale-95 opacity-0 pointer-events-none" : "scale-100 opacity-100",
        ].join(" ")}
        onClick={() => setIsOpen(true)}
        aria-label="Portfolio Assistant chat'i aç"
        aria-expanded={isOpen}
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </button>
    </>
  );
}
