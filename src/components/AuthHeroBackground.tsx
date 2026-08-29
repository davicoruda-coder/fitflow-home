"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Tile = {
  src: string;
  video?: string;
  objectPosition?: string;
};

const TILES: Tile[] = [
  {
    src: "/exercises/mergulho-diamante.webp",
    video: "/exercises/mergulho-diamante.mp4",
    objectPosition: "center 28%",
  },
  {
    src: "/exercises/flexao-apoios.webp",
    video: "/exercises/flexao-apoios.mp4",
    objectPosition: "center 35%",
  },
  {
    src: "/exercises/ab-wheel-rollout.webp",
    video: "/exercises/ab-wheel-rollout.mp4",
    objectPosition: "center 38%",
  },
  {
    src: "/exercises/superman-yt.webp",
    video: "/exercises/superman-yt.mp4",
    objectPosition: "center 25%",
  },
];

function MosaicTile({
  tile,
  reduceMotion,
  priority,
}: {
  tile: Tile;
  reduceMotion: boolean;
  priority?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const showVideo = Boolean(tile.video) && !reduceMotion;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !showVideo) return;
    void el.play().catch(() => {
      // Autoplay blocked — poster still shows
    });
  }, [showVideo]);

  return (
    <div className="relative min-h-0 min-w-0 overflow-hidden bg-background">
      {showVideo && tile.video ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: tile.objectPosition,
            backgroundColor: "var(--bg)",
          }}
          src={tile.video}
          poster={tile.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <Image
          src={tile.src}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 1023px) 50vw, 33vw"
          quality={68}
          className="object-cover"
          style={{ objectPosition: tile.objectPosition }}
        />
      )}
    </div>
  );
}

export function AuthHeroBackground() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <>
      {/* Mobile: no fluxo — mosaico em cima, texto embaixo */}
      <div
        className="auth-mosaic-panel pointer-events-none relative -mx-6 w-[calc(100%+3rem)] shrink-0 overflow-hidden lg:hidden"
        aria-hidden
      >
        <MosaicGrid reduceMotion={reduceMotion} />
        <MosaicFade />
      </div>

      {/* Desktop: overlay no fluxo do layout */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden overflow-hidden lg:block lg:auth-mosaic-panel"
        aria-hidden
      >
        <MosaicGrid reduceMotion={reduceMotion} />
        <MosaicFade />
      </div>
    </>
  );
}

function MosaicGrid({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="auth-mosaic-media grid grid-cols-2 grid-rows-2 gap-0">
      {TILES.map((tile, i) => (
        <MosaicTile
          key={tile.src}
          tile={tile}
          reduceMotion={reduceMotion}
          priority={i < 2}
        />
      ))}
    </div>
  );
}

function MosaicFade() {
  return (
    <div className="auth-mosaic-fade">
      <div
        className="absolute inset-x-0 bottom-0 h-3.5 lg:h-16"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, var(--bg) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-28"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 90% 0%, color-mix(in srgb, var(--energy) 28%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}
