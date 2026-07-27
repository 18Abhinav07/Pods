"use client";

import { useEffect, useState } from "react";

function remainingLabel(target: string) {
  const difference = new Date(target).getTime() - Date.now();
  if (difference <= 0) return "Roster lock in progress";

  const totalMinutes = Math.ceil(difference / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function WaitingCountdown({ cutoffAt }: { cutoffAt: string }) {
  const [label, setLabel] = useState("Calculating");

  useEffect(() => {
    const update = () => setLabel(remainingLabel(cutoffAt));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [cutoffAt]);

  return (
    <div aria-label="Time until roster lock" role="timer">
      <small>Roster locks in</small>
      <strong>{label}</strong>
    </div>
  );
}
