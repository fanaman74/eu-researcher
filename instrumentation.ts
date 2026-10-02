/**
 * Runs once when the Next.js server boots. The scheduler pulls in Node-only modules
 * (database driver), so it is imported inside the runtime check: Next.js also compiles
 * this file for the edge runtime, where those modules cannot be bundled.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}