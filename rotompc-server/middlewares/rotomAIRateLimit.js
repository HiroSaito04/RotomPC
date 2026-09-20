// rotompc-server/middlewares/rotomAIRateLimit.js

/* =========================================================
   CONFIG
========================================================= */

const WINDOW_MS = 15 * 60 * 1000;

const MAX_REQUESTS = 30;

/* =========================================================
   MEMORY STORE
========================================================= */

const buckets = new Map();

/* =========================================================
   CLEANUP
========================================================= */

const cleanup = () => {
  const now = Date.now();

  for (const [key, bucket] of buckets) {
    if (now - bucket.startedAt > WINDOW_MS * 2) {
      buckets.delete(key);
    }
  }
};

const cleanupTimer = setInterval(cleanup, WINDOW_MS);

/*
 * Don't keep the Node
 * process alive just
 * because of this timer.
 */
if (typeof cleanupTimer.unref === "function") {
  cleanupTimer.unref();
}

/* =========================================================
   RATE LIMITER
========================================================= */

const rotomAIRateLimit = (req, res, next) => {
  const key = req.ip || req.socket?.remoteAddress || "unknown";

  const now = Date.now();

  let bucket = buckets.get(key);

  /*
   * Create a fresh window
   * if this IP has no bucket
   * or its old window expired.
   */
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    bucket = {
      startedAt: now,
      count: 0,
    };

    buckets.set(key, bucket);
  }

  bucket.count += 1;

  const remaining = Math.max(0, MAX_REQUESTS - bucket.count);

  res.setHeader("X-RateLimit-Limit", String(MAX_REQUESTS));

  res.setHeader("X-RateLimit-Remaining", String(remaining));

  /*
   * Reject requests beyond
   * the allowed window.
   */
  if (bucket.count > MAX_REQUESTS) {
    const elapsed = now - bucket.startedAt;

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((WINDOW_MS - elapsed) / 1000),
    );

    res.setHeader("Retry-After", String(retryAfterSeconds));

    return res.status(429).json({
      message: "RotomAI needs to recharge. Please try again in a few minutes.",
    });
  }

  return next();
};

module.exports = rotomAIRateLimit;
