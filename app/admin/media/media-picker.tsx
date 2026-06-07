"use client";

import { useMemo, useState } from "react";
import { FileText, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FieldDescription } from "../admin-ui";

export type MediaPickerAsset = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  kind: "IMAGE" | "DOCUMENT";
  createdAt: string;
};

type MediaUrlInputProps = {
  assets: MediaPickerAsset[];
  name: string;
  label: string;
  defaultValue?: string | null;
  accept?: "IMAGE" | "DOCUMENT" | "ANY";
  required?: boolean;
  placeholder?: string;
  description?: React.ReactNode;
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUrlInput({
  assets,
  name,
  label,
  defaultValue = "",
  accept = "ANY",
  required = false,
  placeholder,
  description,
}: MediaUrlInputProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const visibleAssets = useMemo(
    () => assets.filter((asset) => accept === "ANY" || asset.kind === accept),
    [accept, assets],
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-white/65">
        {label}
      </Label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          id={name}
          name={name}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          className="border-white/10 bg-black/30 text-white placeholder:text-white/28"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
              Choose media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden border-white/10 bg-[#070708] text-white">
            <DialogHeader>
              <DialogTitle>Select media</DialogTitle>
              <DialogDescription className="text-white/45">
                Pick an uploaded asset or keep editing the URL manually.
              </DialogDescription>
            </DialogHeader>

            <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {visibleAssets.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-black/20 p-4 text-sm text-white/45 sm:col-span-2 lg:col-span-3">
                  No matching media assets yet.
                </div>
              ) : null}

              {visibleAssets.map((asset) => {
                const Icon = asset.kind === "IMAGE" ? ImageIcon : FileText;

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      setValue(asset.url);
                      setOpen(false);
                    }}
                    className="group overflow-hidden rounded-md border border-white/10 bg-white/[0.025] text-left transition hover:border-white/30 hover:bg-white/[0.05]"
                  >
                    <div className="flex aspect-video items-center justify-center bg-black/35">
                      {asset.kind === "IMAGE" ? (
                        <img src={asset.url} alt={asset.originalName} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-9 w-9 text-white/35" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-white/40" />
                        <p className="truncate text-sm text-white/78">{asset.originalName}</p>
                      </div>
                      <p className="mt-2 truncate text-xs text-white/35">{asset.url}</p>
                      <p className="mt-1 text-xs text-white/30">{formatBytes(asset.size)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </div>
  );
}
