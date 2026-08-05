"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/layout/theme-provider";
import { CURRENCY_CODE, CURRENCY_SYMBOL } from "@/lib/constants";
import {
  downloadBackup, getLastBackupTimestamp, isValidBackupPayload, restoreFromBackup, resetAllData,
} from "@/lib/backup";
import { getNotificationSupport, requestNotificationPermission, type NotificationSupport } from "@/lib/notifications";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<NotificationSupport>("default");
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    setLastBackup(getLastBackupTimestamp());
    setNotifStatus(getNotificationSupport());
  }, []);

  async function handleBackup() {
    try {
      const ts = await downloadBackup();
      setLastBackup(ts);
      toast.success("Backup downloaded");
    } catch {
      toast.error("Backup failed");
    }
  }

  function handleFilePicked(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPendingRestoreFile(file);
      setRestoreConfirmOpen(true);
    }
    e.target.value = "";
  }

  async function confirmRestore() {
    if (!pendingRestoreFile) return;
    try {
      const text = await pendingRestoreFile.text();
      const json = JSON.parse(text);
      if (!isValidBackupPayload(json)) {
        toast.error("This doesn't look like a valid FinanceFlow backup file");
        return;
      }
      await restoreFromBackup(json);
      toast.success("Backup restored successfully");
    } catch {
      toast.error("Could not read that file");
    } finally {
      setPendingRestoreFile(null);
    }
  }

  async function handleReset() {
    await resetAllData();
    setLastBackup(null);
    toast.success("All app data has been reset");
  }

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setNotifStatus(result);
    if (result === "granted") toast.success("Notifications enabled");
    else if (result === "denied") toast.error("Notification permission denied");
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium capitalize transition-colors",
                  theme === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {t === "light" && <Icons.Sun className="h-4 w-4" />}
                {t === "dark" && <Icons.Moon className="h-4 w-4" />}
                {t === "system" && <Icons.Monitor className="h-4 w-4" />}
                {t}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Currency</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between pt-0">
          <span className="text-sm text-muted-foreground">Default currency</span>
          <span className="font-semibold">{CURRENCY_CODE} ({CURRENCY_SYMBOL})</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0">
          {notifStatus === "unsupported" && (
            <p className="text-sm text-muted-foreground">This browser doesn&apos;t support notifications.</p>
          )}
          {notifStatus === "granted" && (
            <p className="flex items-center gap-2 text-sm text-income"><Icons.CheckCircle2 className="h-4 w-4" /> Notifications enabled</p>
          )}
          {(notifStatus === "default" || notifStatus === "denied") && (
            <Button variant="outline" onClick={handleEnableNotifications} className="w-full">
              <Icons.Bell className="h-4 w-4" /> Enable Notifications
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Data &amp; Backup</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-xs text-muted-foreground">
            {lastBackup ? `Last backup: ${formatDateTime(lastBackup)}` : "No backup taken yet"}
          </p>
          <Button onClick={handleBackup} className="w-full justify-start" variant="outline">
            <Icons.Download className="h-4 w-4" /> Backup Data (.json)
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFilePicked} />
          <Button className="w-full justify-start" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Icons.Upload className="h-4 w-4" /> Restore from Backup
          </Button>
          <Button onClick={() => setResetConfirmOpen(true)} className="w-full justify-start" variant="destructive">
            <Icons.Trash2 className="h-4 w-4" /> Reset App Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent className="space-y-1 pt-0 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">FinanceFlow - v1.0.0</p>
          <p>100% offline. All data lives in this browser&apos;s IndexedDB.</p>
          <p>Nothing is ever uploaded, tracked, or shared.</p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={restoreConfirmOpen}
        onOpenChange={setRestoreConfirmOpen}
        title="Restore backup?"
        description="This will replace ALL current data with the contents of the selected backup file. This cannot be undone."
        confirmLabel="Restore"
        onConfirm={confirmRestore}
      />
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Reset all data?"
        description="This permanently deletes every transaction, wallet, loan, budget, goal, and bike record. This cannot be undone."
        confirmLabel="Delete Everything"
        destructive
        onConfirm={handleReset}
      />
    </div>
  );
}
