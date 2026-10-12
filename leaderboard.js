// leaderboard.js — a trending leaderboard backed by a Redis sorted set + a hash per post.
//
// Storage shape:
//   trending:posts        (sorted set)  member = postId, score = engagement  -> the ranking
//   post:<id>:meta        (hash)        title, author                        -> the metadata
//
// You implement the two exported functions below. Everything else is wired for you.

import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one unit of engagement for a post.
 * Must be a SINGLE atomic Redis command (no read-modify-write).
 *
 * @param {string} postId  e.g. "post:104"
 * @returns {Promise<string>} the post's new score
 */
export async function upvote(postId) {
  return redis.zincrby("trending:posts", 1, postId);
  // TODO: ZINCRBY trending:posts by 1 for `postId` and return the new score.
  //       ioredis: redis.zincrby(key, increment, member)
  throw new Error("upvote() not implemented");
}

/**
 * Fetch the top N posts, ranked high -> low, each WITH its metadata (title, author).
 * Must use ONE ioredis pipeline for all the HGETALL calls (not one round trip per post).
 *
 * @param {number} n  how many posts to return
 * @returns {Promise<Array<{ id: string, score: number, title?: string, author?: string }>>}
 */
export async function getTop(n) {
  const flat = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < flat.length; i += 2) {
    rows.push({
      id: flat[i],
      score: Number(flat[i + 1]),
    });

    pipeline.hgetall(flat[i] + ":meta");
  }

  const results = await pipeline.exec();

  return rows.map((row, k) => ({
    ...row,
    ...results[k][1],
  }));

  // TODO:
  // 1. redis.zrevrange("trending:posts", 0, n - 1, "WITHSCORES")  -> flat [id, score, id, score, ...]
  // 2. Build rows [{ id, score }] AND queue one pipeline.hgetall(id + ":meta") per id.
  // 3. await pipeline.exec()  -> results[k] is [error, value] for the k-th queued command.
  // 4. Merge: return rows.map((row, k) => ({ ...row, ...results[k][1] })).
  throw new Error("getTop() not implemented");
}

export { redis };
