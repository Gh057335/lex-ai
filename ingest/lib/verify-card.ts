import Anthropic from "@anthropic-ai/sdk";
import type { Card } from "./parse-cards";
import type { FetchResult } from "./fetch-source";

export type Verdict = "verified" | "partial" | "mismatch" | "inconclusive";

export type LLMVerification = {
  verdict: Verdict;
  evidence: string[];
  concerns: string[];
  criteria: {
    title_supported: "supported" | "absent" | "contradicted";
    date_supported: "supported" | "absent" | "contradicted";
    key_parts_supported: "supported" | "absent" | "contradicted";
    amendments_or_supersession: "none" | "noted" | "contradicts_status";
  };
  raw_response: string;
};

const SYSTEM_PROMPT = `You are a legal-source verifier for LEXAI's primary-source knowledge base.

You are given:
(a) Structured metadata for a legal norm that a knowledge-base entry claims to describe.
(b) The visible text extracted from the publisher web page that the entry cites as the canonical source.

Assess whether the page actually corresponds to that norm. The page is often a publisher landing page or index, not the statute text — that is acceptable. You are checking that the page is the right place to find the norm, that it references the norm by title or number, and whether the declared facts in the metadata are supported, contradicted, or simply absent from this page.

Be conservative. If the page is empty, blocked, returns a login wall, or is dominated by navigation chrome, output verdict "inconclusive". Never invent facts the page does not show.

Output strictly valid JSON matching the schema in the user message. No prose, no markdown fences.

Criterion outcomes:
- "supported": the page visibly confirms the declared fact (title, year, status, chapter names, etc.).
- "contradicted": the page shows information that disagrees with the declared fact (e.g., a newer law that supersedes it, a different effective date, an explicit repeal notice).
- "absent": the page does not address the fact; you cannot tell from this page.

Overall verdict:
- "verified": title supported and no contradictions on date or status.
- "partial": title supported but some declared facts are absent (not contradicted).
- "mismatch": page contradicts a declared fact (wrong norm, repealed, replaced) — high priority for human review.
- "inconclusive": page text is empty / blocked / unusable.`;

const SCHEMA = `{
  "verdict": "verified" | "partial" | "mismatch" | "inconclusive",
  "criteria": {
    "title_supported": "supported" | "absent" | "contradicted",
    "date_supported": "supported" | "absent" | "contradicted",
    "key_parts_supported": "supported" | "absent" | "contradicted",
    "amendments_or_supersession": "none" | "noted" | "contradicts_status"
  },
  "evidence": [ "short verbatim quote from the page that supports a 'supported' verdict", "..." ],
  "concerns": [ "anything a human reviewer should double-check, including suspected supersession / amendments", "..." ]
}`;

export async function verifyCardWithLLM(
  client: Anthropic,
  model: string,
  card: Card,
  fetched: FetchResult,
): Promise<LLMVerification> {
  if (!fetched.text || fetched.text.length < 60) {
    return {
      verdict: "inconclusive",
      evidence: [],
      concerns: ["page text too short to verify (empty / blocked / JS-rendered)"],
      criteria: {
        title_supported: "absent",
        date_supported: "absent",
        key_parts_supported: "absent",
        amendments_or_supersession: "none",
      },
      raw_response: "",
    };
  }

  const userPayload = {
    card: {
      citation_key: card.citation_key,
      declared_title: card.title,
      type: card.type,
      jurisdiction: card.jurisdiction,
      effective_from: card.effective_from,
      effective_to: card.effective_to,
      publisher: card.publisher,
      language: card.language,
      key_parts: card.key_parts,
    },
    page: {
      url: fetched.url,
      final_url: fetched.final_url,
      content_type: fetched.content_type,
      extracted_text: fetched.text,
    },
  };

  const userMessage = [
    "Verify whether the page corresponds to the legal norm described by the metadata.",
    "",
    "Output strictly JSON matching this schema:",
    SCHEMA,
    "",
    "Inputs:",
    JSON.stringify(userPayload),
  ].join("\n");

  const response = await client.messages.create({
    model,
    max_tokens: 800,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return parseLLMResponse(text);
}

function parseLLMResponse(raw: string): LLMVerification {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const fallback: LLMVerification = {
    verdict: "inconclusive",
    evidence: [],
    concerns: ["could not parse LLM response as JSON"],
    criteria: {
      title_supported: "absent",
      date_supported: "absent",
      key_parts_supported: "absent",
      amendments_or_supersession: "none",
    },
    raw_response: raw,
  };
  try {
    const parsed = JSON.parse(stripped);
    return {
      verdict: parsed.verdict ?? "inconclusive",
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      criteria: {
        title_supported: parsed.criteria?.title_supported ?? "absent",
        date_supported: parsed.criteria?.date_supported ?? "absent",
        key_parts_supported: parsed.criteria?.key_parts_supported ?? "absent",
        amendments_or_supersession: parsed.criteria?.amendments_or_supersession ?? "none",
      },
      raw_response: raw,
    };
  } catch {
    return fallback;
  }
}
