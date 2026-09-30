/**
 * frontend/lib/types.ts
 *
 * Frontend copy of the shared types defined in trigger/types.ts.
 * Keep in sync with trigger/types.ts — both files must define identical interfaces.
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
  score: number;
  tier: "hot" | "warm" | "cold" | "disqualified";
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendedAction: string;
  reasoning: string;
}
