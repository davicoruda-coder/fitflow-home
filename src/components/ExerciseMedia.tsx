"use client";

import Image from "next/image";
import { memo, useEffect, useRef, useState } from "react";

type Props = {
  src?: string | null;
  videoSrc?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  /** Thumbnail lists: skip video entirely */
  thumb?: boolean;
  aspectRatio?: string;
  badge?: React.ReactNode;
};

function ExerciseMediaInner({
  src,
  videoSrc,
  alt,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 480px",
  thumb = false,
  aspectRatio,
  badge,
}: Props) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [prevMediaKey, setPrevMediaKey] = useState(`${src ?? ""}|${videoSrc ?? ""}`);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentMediaKey = `${src ?? ""}|${videoSrc ?? ""}`;
  if (prevMediaKey !== currentMediaKey) {
    setPrevMediaKey(currentMediaKey);
    setVideoFailed(false);
    setImageFailed(false);
  }

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoSrc) return;
    if (el.getAttribute("data-src") !== videoSrc) {
      el.setAttribute("data-src", videoSrc);
      el.src = videoSrc;
      el.load();
    }
    void el.play().catch(() => {
      // Autoplay blocked — poster still shows
    });
  }, [videoSrc]);

  const showVideo = Boolean(videoSrc) && !videoFailed && !thumb;
  const showImage = Boolean(src) && !imageFailed && !showVideo;
  const showPlaceholder = !showVideo && !showImage;

  return (
    <div
      className={`relative overflow-hidden bg-accent-soft ${
        aspectRatio
          ? ""
          : "aspect-[16/10] sm:aspect-[4/3] lg:aspect-square max-h-[220px] sm:max-h-[280px] lg:max-h-none"
      } ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {badge ? (
        <div className="absolute left-3 top-3 z-10 pointer-events-none">{badge}</div>
      ) : null}
      {showVideo && videoSrc ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={src && !imageFailed ? src : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload={priority ? "auto" : "metadata"}
          aria-label={alt}
          onError={() => setVideoFailed(true)}
        />
      ) : null}

      {showImage && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          quality={thumb ? 65 : 78}
          className="object-cover"
          unoptimized={src.includes("placehold.co")}
          onError={() => setImageFailed(true)}
        />
      ) : null}

      {showPlaceholder ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="font-display text-4xl font-semibold text-accent">
            FF
          </span>
          <p className="text-sm text-muted">Mídia em breve</p>
          <p className="text-xs text-muted/80 line-clamp-2">{alt}</p>
        </div>
      ) : null}
    </div>
  );
}

export const ExerciseMedia = memo(ExerciseMediaInner);
