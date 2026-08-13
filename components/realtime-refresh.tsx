"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type ConnectionState = "connected" | "offline";

export function RealtimeRefresh({ url, publishableKey, topics }: { url: string; publishableKey: string; topics: string[] }) {
  const router = useRouter();
  const [state, setState] = useState<ConnectionState>("connected");
  const topicKey = topics.join("|");
  const stableTopics = useMemo(() => topicKey.split("|").filter(Boolean), [topicKey]);

  useEffect(() => {
    const client = createBrowserClient(url, publishableKey);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };

    const channels = stableTopics.map((topic) =>
      client
        .channel(topic, { config: { private: topic.startsWith("schedule:") } })
        .on("broadcast", { event: "*" }, refresh)
        .subscribe(),
    );

    const online = () => {
      setState("connected");
      refresh();
    };
    const offline = () => setState("offline");
    const visible = () => {
      if (document.visibilityState !== "visible") return;
      setState(navigator.onLine ? "connected" : "offline");
      refresh();
    };

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", visible);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", visible);
      channels.forEach((channel) => void client.removeChannel(channel));
    };
  }, [publishableKey, router, stableTopics, url]);

  if (state === "connected") return null;
  return <div role="status" aria-live="polite" className="fixed inset-x-4 top-20 z-40 mx-auto max-w-md rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-center text-sm font-semibold text-warning shadow-lg">You are offline. Displayed information may be outdated.</div>;
}
