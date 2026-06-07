"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  className,
  size,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size={size} disabled={pending} className={cn("bg-white text-black hover:bg-white/85", className)}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function ConfirmSubmitButton({
  children,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  className,
  size,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const { pending } = useFormStatus();
  const submitRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog>
      <button ref={submitRef} type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={pending}
          className={cn("border-red-400/20 bg-red-400/5 text-red-200 hover:bg-red-400/10 hover:text-red-100", className)}
        >
          {pending ? "Working..." : children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-[#070708] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-white/50">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 text-white hover:bg-red-400"
            onClick={() => submitRef.current?.form?.requestSubmit(submitRef.current)}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminFeedback({ message, type = "success" }: { message?: string; type?: "success" | "error" }) {
  if (!message) return null;
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        "mb-5 flex items-center gap-3 rounded-lg border p-4 text-sm",
        type === "success"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
          : "border-red-400/20 bg-red-400/10 text-red-100",
      )}
    >
      <Icon className="h-4 w-4" />
      {message}
    </div>
  );
}
