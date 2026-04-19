"use client";

import { HashLane } from "./HashLane";

// Scripted walk-through of a Bloom filter used as the pre-check in front of
// the accounts table. Two inserts to establish state, then three queries —
// one definitely-not, one true-maybe, one false-positive-maybe.
const BLOOM_SCRIPT = [
  {
    kind: "insert" as const,
    key: "johndoe@gmail.com",
    bitIndices: [2, 7, 11] as [number, number, number],
    caption:
      "Start with an empty filter. When an account is created, three hashes of the canonical email each pick a bit, and those bits are flipped on. Nothing about the email itself is stored.",
  },
  {
    kind: "insert" as const,
    key: "alice@gmail.com",
    bitIndices: [4, 9, 13] as [number, number, number],
    caption:
      "Another account is added. Different hashes, different bits. The filter remembers that two addresses exist — without storing either of them.",
  },
  {
    kind: "query" as const,
    key: "zxcvb123@gmail.com",
    bitIndices: [0, 5, 14] as [number, number, number],
    caption:
      "Now someone types a brand-new email. The filter hashes it the same way and checks its three bits. At least one of them is zero, so the answer is definitely not — nobody who was inserted could have left a zero on a bit that their own hashes would have flipped.",
  },
  {
    kind: "query" as const,
    key: "johndoe@gmail.com",
    bitIndices: [2, 7, 11] as [number, number, number],
    caption:
      "Query an email that actually exists. All three bits are on — the filter says maybe, and this time it's correct. The real answer will come from the database.",
  },
  {
    kind: "query" as const,
    key: "different@gmail.com",
    bitIndices: [2, 7, 13] as [number, number, number],
    caption:
      "Query a brand-new email whose three hashes happen to land on bits that were set by other people. The filter says maybe — but it's wrong. That's a false positive. It still doesn't let a taken email through as new, so the correctness guarantee holds.",
  },
];

type Props = {
  initialStep?: number;
};

/**
 * BloomProbe — §"bloom filter" zoom. Thin wrapper around HashLane (lifted
 * from the bloom-filters WIP post) with a script tailored to the pre-check
 * story: two inserts, then three queries showing "definitely not",
 * "maybe-correct", and "maybe-false-positive".
 */
export function BloomProbe({ initialStep = 0 }: Props) {
  return <HashLane m={16} script={BLOOM_SCRIPT} initialStep={initialStep} />;
}
