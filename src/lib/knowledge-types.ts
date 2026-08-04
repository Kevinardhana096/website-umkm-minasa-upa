export type KnowledgeStatus = "draft" | "verified";

export type KnowledgeSourceType = "internal_draft" | "official";

export interface KnowledgeProvenance {
  documentId: string;
  title: string;
  sourceType: KnowledgeSourceType;
  sourceLabel: string;
  sourceUrl?: string;
  verifiedAt: string | null;
  version: string;
  status: KnowledgeStatus;
}
