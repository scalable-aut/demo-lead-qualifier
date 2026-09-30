/**
 * trigger/types.ts
 *
 * Shared types for the AI Lead Qualifier.
 *
 * Imported by:
 *   - trigger/tasks/qualify-lead.ts
 *   - frontend/app/api/qualify/route.ts
 *   - tools/test-anthropic.ts
 *   - tools/test-trigger-task.ts
 *
 * Do not duplicate these definitions elsewhere.
 * To change the schema: update workflows/lead-qualifier.md first, then update here.
 */

export interface LeadPayload {
  firstName: string;
  lastName: string;
  company: string;
  industry: string;
  companySize: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
  role: string;
  useCase: string;
  budget?: "Under $1k" | "$1k–$5k" | "$5k–$20k" | "$20k+";
  timeline?: "Immediate" | "1-3 months" | "3-6 months" | "6+ months";
  source?: string;
}

export interface QualificationResult {
  /** 0–100 integer — sum of all 5 scoring criteria */
  score: number;
  /** Derived from score: 80-100=hot, 60-79=warm, 40-59=cold, 0-39=disqualified */
  tier: "hot" | "warm" | "cold" | "disqualified";
  /** 2–3 sentence human-readable summary */
  summary: string;
  /** 2–4 specific positive signals referencing actual lead data */
  strengths: string[];
  /** 1–3 specific gaps or risk factors; empty array if none */
  concerns: string[];
  /** One imperative sentence specific to the tier */
  recommendedAction: string;
  /** Step-by-step breakdown showing sub-score for each of the 5 criteria */
  reasoning: string;
}
