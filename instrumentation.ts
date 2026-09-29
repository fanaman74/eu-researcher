/**
 * Runs once when the Next.js server boots. Warms the slow upstream caches
 * (Have Your Say, EP questions) in the background so the first visitor after a
 * deploy doesn't pay a 20–30s cold start. Production only; never blocks startup.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;

  const { listConsultations } = await import("./lib/haveYourSay");
  const { warmQuestions } = await import("./lib/epQuestions");

  void listConsultations().catch((err) => console.warn("[Boot] Have Your Say warm-up failed:", err));
  void warmQuestions().catch((err) => console.warn("[Boot] EP questions warm-up failed:", err));
}
