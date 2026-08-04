export const CHAT_INTENT_ROUTES = [
  "knowledge_village",
  "knowledge_group",
  "knowledge_business",
  "website_help",
  "web",
  "catalog_ai",
  "off_topic",
] as const;

export type ChatIntentRoute = (typeof CHAT_INTENT_ROUTES)[number];

export interface ChatIntentResult {
  route: ChatIntentRoute;
  confidence: number;
}

const ROUTE_ALIASES: Record<string, ChatIntentRoute> = {
  knowledge: "knowledge_village",
  village: "knowledge_village",
  location: "knowledge_village",
  knowledge_village: "knowledge_village",
  group: "knowledge_group",
  knowledge_group: "knowledge_group",
  business: "knowledge_business",
  knowledge_business: "knowledge_business",
  website: "website_help",
  site: "website_help",
  website_help: "website_help",
  help: "website_help",
  web_search: "web",
  web: "web",
  latest: "web",
  general: "web",
  catalog: "catalog_ai",
  catalog_ai: "catalog_ai",
  ai_catalog: "catalog_ai",
  off_topic: "off_topic",
  unsupported: "off_topic",
  out_of_scope: "off_topic",
  scope: "off_topic",
};

function getJsonObject(value: string) {
  const match = value.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as unknown;
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function parseChatIntent(value: string): ChatIntentResult | null {
  const parsed = getJsonObject(value);
  if (!parsed) return null;

  const rawRoute = typeof parsed.route === "string"
    ? parsed.route.trim().toLowerCase()
    : "";
  const route = ROUTE_ALIASES[rawRoute];
  const confidence = typeof parsed.confidence === "number"
    ? parsed.confidence
    : Number(parsed.confidence);

  if (!route || !Number.isFinite(confidence) || confidence < 0.65 || confidence > 1) return null;

  return { route, confidence };
}
