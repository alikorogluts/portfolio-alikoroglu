"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function MessagesFilter({ query, status }: { query: string; status: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(query);
  const [, startTransition] = useTransition();

  const currentParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(currentParams);
      params.delete("success");
      params.delete("error");
      params.delete("page");

      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");

      if (status && status !== "all") params.set("status", status);
      else params.delete("status");

      const nextQuery = params.toString();

      startTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [currentParams, pathname, router, status, value]);

  function updateStatus(nextStatus: string) {
    const params = new URLSearchParams(currentParams);
    params.delete("success");
    params.delete("error");
    params.delete("page");

    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");

    if (nextStatus !== "all") params.set("status", nextStatus);
    else params.delete("status");

    const nextQuery = params.toString();

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    });
  }

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search name, email, subject or message"
          className="border-white/10 bg-black/30 pl-9 text-white placeholder:text-white/28"
        />
      </div>
      <select
        value={status}
        onChange={(event) => updateStatus(event.target.value)}
        className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white outline-none"
      >
        <option value="all">All</option>
        <option value="unread">Unread</option>
        <option value="read">Read</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  );
}
