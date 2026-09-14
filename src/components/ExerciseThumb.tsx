import Image from "next/image";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
};

/** Server-friendly list thumbnail — no client hydration / video. */
export function ExerciseThumb({ src, alt, className = "" }: Props) {
  return (
    <div
      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-accent-soft ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="64px"
          quality={65}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-display text-sm font-semibold text-accent">
            FF
          </span>
        </div>
      )}
    </div>
  );
}
