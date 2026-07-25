"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChatCircleDots
} from "@phosphor-icons/react";

export function RitualIcon({
  name,
  size = 20
}: {
  name: "back" | "forward" | "external" | "room";
  size?: number;
}) {
  if (name === "back") {
    return <ArrowLeft aria-hidden="true" size={size} weight="bold" />;
  }
  if (name === "forward") {
    return <ArrowRight aria-hidden="true" size={size} weight="bold" />;
  }
  if (name === "room") {
    return <ChatCircleDots aria-hidden="true" size={size} weight="fill" />;
  }
  return <ArrowUpRight aria-hidden="true" size={size} weight="bold" />;
}
