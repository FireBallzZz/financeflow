/**
 * Thin wrapper around the browser Notification API. Every function checks
 * for support first and no-ops gracefully where it's unavailable (iOS Safari
 * outside of an installed PWA, browsers with permission denied, etc.) —
 * nothing here should ever throw and break the app.
 */

export type NotificationSupport = "unsupported" | "granted" | "denied" | "default";

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationSupport;
}

export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    const result = await Notification.requestPermission();
    return result as NotificationSupport;
  } catch {
    return "unsupported";
  }
}

export function showLocalNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icons/icon-192.png" });
  } catch {
    // Some browsers (notably mobile Safari) throw even when permission is
    // granted if not triggered from an installed PWA context — safe to ignore.
  }
}
