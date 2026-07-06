import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/business-data";

// AI/LLM crawlers we explicitly welcome. Allowing these is what lets ChatGPT,
// Claude, Perplexity and Google's AI surfaces read and cite the site. They are
// listed individually (not just under "*") so intent is unambiguous to each bot.
const aiCrawlers = [
  "GPTBot", // OpenAI training
  "OAI-SearchBot", // ChatGPT search index
  "ChatGPT-User", // ChatGPT live browsing
  "ClaudeBot", // Anthropic training
  "anthropic-ai", // Anthropic (legacy token)
  "Claude-SearchBot", // Claude search
  "Claude-User", // Claude live browsing
  "PerplexityBot", // Perplexity index
  "Perplexity-User", // Perplexity live browsing
  "Google-Extended", // Google Gemini / AI Overviews opt-in
  "Applebot-Extended", // Apple Intelligence opt-in
  "CCBot", // Common Crawl (feeds many models)
  "cohere-ai",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      ...aiCrawlers.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: "/api/",
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
