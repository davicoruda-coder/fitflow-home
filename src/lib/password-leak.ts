import { createHash } from "crypto";

export type LeakCheck = "leaked" | "clean" | "unavailable";

/**
 * Have I Been Pwned k-anonymity: só os 5 primeiros hex do SHA-1 vão para a API.
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
export async function checkPasswordLeak(password: string): Promise<LeakCheck> {
  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "Add-Padding": "true",
        "User-Agent": "FitFlow-Home",
      },
      cache: "no-store",
    });
    if (!res.ok) return "unavailable";

    const text = await res.text();
    for (const line of text.split("\n")) {
      const hash = line.trim().split(":")[0];
      if (hash === suffix) return "leaked";
    }
    return "clean";
  } catch {
    return "unavailable";
  }
}
