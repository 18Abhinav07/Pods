"use client";

import { useState } from "react";

export function ProofShareButton({
  title,
  text
}: {
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      await navigator.share({ title, text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
  }

  return (
    <button className="secondary-action" onClick={() => void share()} type="button">
      {copied ? "Share link copied" : "Share this milestone"}
    </button>
  );
}
