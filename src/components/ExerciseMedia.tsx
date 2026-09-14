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
};

function ExerciseMediaInner({
  src,
  videoSrc,
  alt,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 480px",
  thumb = false,
}: Props) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setVideoFailed(false);
    setImageFailed(false);
  }, [src, videoSrc]);

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
      className={`relative overflow-hidden bg-accent-soft ${className}`}
      style={{ aspectRatio: "1 / 1" }}
    >
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
