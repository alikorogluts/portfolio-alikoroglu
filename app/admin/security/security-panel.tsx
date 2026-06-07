"use client";

import { useState } from "react";
import { AlertTriangle, KeyRound, QrCode, RefreshCcw, ShieldCheck, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SectionCard, StatusBadge } from "../admin-ui";

type SecurityPanelProps = {
  twoFactorEnabled: boolean;
};

export function SecurityPanel({ twoFactorEnabled }: SecurityPanelProps) {
  const [qrCode, setQrCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [token, setToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function startSetup() {
    setIsBusy(true);
    setStatus("");
    const response = await fetch("/api/admin/2fa/setup", { method: "POST" });
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      qrCode?: string;
      manualCode?: string;
    } | null;

    if (!response.ok || !result?.success || !result.qrCode || !result.manualCode) {
      setStatus("2FA setup could not be started.");
      setIsBusy(false);
      return;
    }

    setQrCode(result.qrCode);
    setManualCode(result.manualCode);
    setBackupCodes([]);
    setStatus("QR kodu Google Authenticator ile okut.");
    setIsBusy(false);
  }

  async function enableTwoFactor() {
    setIsBusy(true);
    setStatus("");
    const response = await fetch("/api/admin/2fa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const result = (await response.json().catch(() => null)) as { success?: boolean; backupCodes?: string[] } | null;

    if (!response.ok || !result?.success || !result.backupCodes) {
      setStatus("Code could not be verified.");
      setIsBusy(false);
      return;
    }

    setBackupCodes(result.backupCodes);
    setStatus("2FA is enabled. Store these backup codes now; they are shown once.");
    setIsBusy(false);
  }

  async function disableTwoFactor() {
    setIsBusy(true);
    setStatus("");
    const response = await fetch("/api/admin/2fa/disable", { method: "POST" });

    setStatus(response.ok ? "2FA is disabled. You can refresh the page." : "2FA could not be disabled.");
    setIsBusy(false);
  }

  async function regenerateBackupCodes() {
    setIsBusy(true);
    setStatus("");
    const response = await fetch("/api/admin/2fa/backup-codes", { method: "POST" });
    const result = (await response.json().catch(() => null)) as { success?: boolean; backupCodes?: string[] } | null;

    if (!response.ok || !result?.success || !result.backupCodes) {
      setStatus("Backup codes could not be regenerated.");
      setIsBusy(false);
      return;
    }

    setBackupCodes(result.backupCodes);
    setStatus("Backup codes regenerated. Previous codes are now invalid.");
    setIsBusy(false);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <SectionCard className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <span className={twoFactorEnabled ? "rounded-md border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-200" : "rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-amber-200"}>
              {twoFactorEnabled ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="text-lg font-medium">2FA Durumu</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
                {twoFactorEnabled
                  ? "Google Authenticator is active. Admin login requires TOTP or backup code after password."
                  : "2FA is disabled. Google Authenticator is recommended for the admin account."}
              </p>
            </div>
          </div>
          <StatusBadge tone={twoFactorEnabled ? "success" : "warning"}>{twoFactorEnabled ? "Active" : "Disabled"}</StatusBadge>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={startSetup} disabled={isBusy || twoFactorEnabled} className="bg-white text-black hover:bg-white/85">
            <QrCode className="mr-2 h-4 w-4" />
            Enable 2FA
          </Button>
          <Button
            type="button"
            onClick={regenerateBackupCodes}
            disabled={isBusy || !twoFactorEnabled}
            variant="outline"
            className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Regenerate Backup Codes
          </Button>
          <Button
            type="button"
            onClick={disableTwoFactor}
            disabled={isBusy || !twoFactorEnabled}
            variant="outline"
            className="border-red-400/20 bg-red-400/5 text-red-200 hover:bg-red-400/10 hover:text-red-100"
          >
            <ShieldOff className="mr-2 h-4 w-4" />
            Disable 2FA
          </Button>
        </div>

        {qrCode ? (
          <div className="mt-7 grid gap-5 rounded-lg border border-white/10 bg-black/20 p-4 md:grid-cols-[240px_1fr]">
            <img src={qrCode} alt="Google Authenticator QR code" className="rounded-md border border-white/10 bg-white p-3" />
            <div>
              <Label htmlFor="token" className="text-white/65">
                Google Authenticator Code
              </Label>
              <Input
                id="token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="mt-2 border-white/10 bg-black/30 text-white"
                placeholder="123456"
              />
              <p className="mt-3 break-all text-xs text-white/35">Manual code: {manualCode}</p>
              <Button type="button" onClick={enableTwoFactor} disabled={isBusy} className="mt-4 bg-white text-black hover:bg-white/85">
                <KeyRound className="mr-2 h-4 w-4" />
                Verify and Enable
              </Button>
            </div>
          </div>
        ) : null}

        {status ? <p className="mt-5 rounded-md border border-white/10 bg-black/20 p-3 text-sm text-white/58">{status}</p> : null}
      </SectionCard>

      <SectionCard className="border-amber-400/15 bg-amber-400/[0.035]">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-1 h-5 w-5 text-amber-200" />
          <div>
            <h2 className="text-lg font-medium">Backup Codes</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">
              Codes are only shown when generated. Regenerating codes invalidates previous codes.
            </p>
          </div>
        </div>
        {backupCodes.length > 0 ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {backupCodes.map((code) => (
              <code key={code} className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/78">
                {code}
              </code>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-md border border-white/10 bg-black/20 p-3 text-sm text-white/35">
            No newly generated backup codes to show.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
