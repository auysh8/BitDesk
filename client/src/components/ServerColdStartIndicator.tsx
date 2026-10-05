// client/src/components/ServerColdStartIndicator.tsx
import React, { useEffect, useState } from "react";
import { Server, Loader2 } from "lucide-react";
import { registerServerStatusListener } from "../api/axiosClient";

export const ServerColdStartIndicator: React.FC = () => {
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [secondsWaiting, setSecondsWaiting] = useState(0);

  useEffect(() => {
    const unregister = registerServerStatusListener((waking) => {
      setIsWakingUp(waking);
      if (!waking) {
        setSecondsWaiting(0);
      }
    });

    return unregister;
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isWakingUp) {
      interval = setInterval(() => {
        setSecondsWaiting((prev) => prev + 1);
      }, 1000);
    } else {
      setSecondsWaiting(0);
    }
    return () => clearInterval(interval);
  }, [isWakingUp]);

  if (!isWakingUp) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex justify-center px-4 pt-3 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-3 text-white shadow-2xl shadow-orange-500/30 backdrop-blur-md">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <Server className="h-5 w-5 text-white animate-pulse" />
          <Loader2 className="absolute -bottom-1 -right-1 h-4 w-4 animate-spin text-amber-200" />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <span>Waking up Render Free-Tier Server</span>
            <span className="rounded-full bg-white/25 px-1.5 py-0.2 text-[10px] font-mono">
              {secondsWaiting}s
            </span>
          </div>
          <p className="mt-0.5 text-amber-100 leading-tight">
            Free-tier instances sleep when idle. Cold boot takes ~30–45s. Your request is queued and will load automatically!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServerColdStartIndicator;
