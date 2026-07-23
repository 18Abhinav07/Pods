"use client";

import { Bell, SlidersHorizontal, ShareNetwork, X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function PodRoomHeader({
  isCreator,
  memberCount,
  name,
  podId,
  thumbnail
}: {
  isCreator: boolean;
  memberCount: number;
  name: string;
  podId: string;
  thumbnail: string;
}) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [shareState, setShareState] = useState("");

  async function sharePod() {
    const url = typeof window === "undefined" ? `/pods/${podId}` : `${window.location.origin}/pods/${podId}`;
    if (typeof navigator.share === "function") {
      await navigator.share({ title: name, url });
      setShareState("Shared");
      return;
    }
    await navigator.clipboard?.writeText(url);
    setShareState("Link copied");
  }

  return (
    <>
      <header className="pod-room-header">
        <span className="pod-room-identity">
          <span className="pod-room-thumbnail"><Image alt="" fill sizes="44px" src={thumbnail} /></span>
          <span><h1>{name}</h1><small>{memberCount} {memberCount === 1 ? "member" : "members"}</small></span>
        </span>
        <span className="pod-room-utilities">
          <button aria-expanded={toolsOpen} aria-label="Open Pod tools" onClick={() => setToolsOpen(true)} type="button">
            <SlidersHorizontal aria-hidden="true" size={21} weight="bold" />
          </button>
          <Link aria-label="Open updates" href="/updates"><Bell aria-hidden="true" size={21} weight="bold" /></Link>
        </span>
      </header>
      {toolsOpen ? (
        <div className="pod-tools-layer">
          <button aria-label="Close Pod tools" className="pod-tools-backdrop" onClick={() => setToolsOpen(false)} type="button" />
          <section aria-label="Pod tools" aria-modal="true" className="pod-tools-sheet" role="dialog">
            <header><span><small>Pod tools</small><strong>{name}</strong></span><button aria-label="Close Pod tools" onClick={() => setToolsOpen(false)} type="button"><X aria-hidden="true" size={21} weight="bold" /></button></header>
            <nav>
              <Link href={`/pods/${podId}/activity`} onClick={() => setToolsOpen(false)}>Proofs</Link>
              <Link href={`/pods/${podId}/members`} onClick={() => setToolsOpen(false)}>Members</Link>
              <Link href={`/pods/${podId}/rules`} onClick={() => setToolsOpen(false)}>Contract</Link>
              {isCreator ? <Link href={`/pods/${podId}/admin`} onClick={() => setToolsOpen(false)}>Creator controls</Link> : null}
            </nav>
            <button className="pod-share-action" onClick={() => void sharePod()} type="button"><ShareNetwork aria-hidden="true" size={20} weight="bold" /><span>{shareState || "Share Pod"}</span></button>
          </section>
        </div>
      ) : null}
    </>
  );
}
