import React, { useMemo } from "react";

type AddressLinkProps = {
  address: string | null | undefined;
  className?: string;
  truncate?: boolean;
};

function mapsUrl(address: string): string {
  const query = encodeURIComponent(address.trim());
  if (!query) return "";
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isApple = /iPhone|iPad|Macintosh/.test(userAgent);
  return isApple ? `maps://?q=${query}` : `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function shortenAddress(raw: string): string {
  const countries = [
    "united states of america",
    "united states",
    "usa",
    "u.s.a",
    "america",
  ];

  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .filter((p) => !countries.includes(p.toLowerCase()));

  // Strip zip codes from any segment, e.g., "IN 46989" => "IN"
  const zipRegex = /\b\d{5}(?:-\d{4})?\b/g;
  const cleaned = parts
    .map((p) => p.replace(zipRegex, "").replace(/\s{2,}/g, " ").trim())
    .filter((p) => p.length > 0);

  // Keep up to 4 meaningful segments (e.g., Place, Street, City, State)
  const limited = cleaned.slice(0, 4);
  return limited.join(", ");
}

export default function AddressLink({ address, className = "", truncate }: AddressLinkProps) {
  const clean = (address ?? "").trim();
  const href = useMemo(() => (clean ? mapsUrl(clean) : ""), [clean]);
  const display = useMemo(() => (clean ? shortenAddress(clean) : ""), [clean]);

  if (!clean) return <span className={className}>-</span>;

  const isUrl = /^https?:\/\//i.test(clean);
  const finalHref = isUrl ? clean : href;

  return (
    <a
      href={finalHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open in Maps: ${clean}`}
      className={`${className} underline underline-offset-4 hover:underline hover:text-[#00AFCE] ${truncate ? "truncate" : ""}`}
      title={clean}
    >
      {display}
    </a>
  );
}

