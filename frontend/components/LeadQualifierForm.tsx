"use client";

import type { LeadPayload } from "@/lib/types";

interface Props {
  onSubmit: (payload: LeadPayload) => void;
  disabled?: boolean;
}

const COMPANY_SIZES: LeadPayload["companySize"][] = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1000+",
];

const BUDGETS: NonNullable<LeadPayload["budget"]>[] = [
  "Under $1k",
  "$1k–$5k",
  "$5k–$20k",
  "$20k+",
];

const TIMELINES: NonNullable<LeadPayload["timeline"]>[] = [
  "Immediate",
  "1-3 months",
  "3-6 months",
  "6+ months",
];

export default function LeadQualifierForm({ onSubmit, disabled = false }: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const payload: LeadPayload = {
      firstName: fd.get("firstName") as string,
      lastName: fd.get("lastName") as string,
      company: fd.get("company") as string,
      industry: fd.get("industry") as string,
      companySize: fd.get("companySize") as LeadPayload["companySize"],
      role: fd.get("role") as string,
      useCase: fd.get("useCase") as string,
    };

    const budget = fd.get("budget") as string;
    if (budget) payload.budget = budget as LeadPayload["budget"];

    const timeline = fd.get("timeline") as string;
    if (timeline) payload.timeline = timeline as LeadPayload["timeline"];

    const source = fd.get("source") as string;
    if (source) payload.source = source;

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact */}
      <fieldset className="space-y-4">
        <legend className="section-heading">Contact</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="firstName">First name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              disabled={disabled}
              placeholder="Sarah"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              disabled={disabled}
              placeholder="Chen"
              className="field-input"
            />
          </div>
        </div>
      </fieldset>

      {/* Company */}
      <fieldset className="space-y-4">
        <legend className="section-heading">Company</legend>
        <div>
          <label className="field-label" htmlFor="company">Company name</label>
          <input
            id="company"
            name="company"
            type="text"
            required
            disabled={disabled}
            placeholder="Stackline Analytics"
            className="field-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="industry">Industry</label>
            <input
              id="industry"
              name="industry"
              type="text"
              required
              disabled={disabled}
              placeholder="SaaS"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="companySize">Company size</label>
            <select
              id="companySize"
              name="companySize"
              required
              disabled={disabled}
              defaultValue=""
              className="field-input"
            >
              <option value="" disabled>Select size</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>{s} employees</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="role">Contact&apos;s role</label>
          <input
            id="role"
            name="role"
            type="text"
            required
            disabled={disabled}
            placeholder="VP of Operations"
            className="field-input"
          />
        </div>
      </fieldset>

      {/* Opportunity */}
      <fieldset className="space-y-4">
        <legend className="section-heading">Opportunity</legend>
        <div>
          <label className="field-label" htmlFor="useCase">
            Use case
            <span className="ml-1 text-ink-3 font-normal normal-case tracking-normal">
              — what do they want to automate?
            </span>
          </label>
          <textarea
            id="useCase"
            name="useCase"
            required
            disabled={disabled}
            rows={3}
            placeholder="We need to automate our lead routing process and reduce manual data entry across our CRM and email tools..."
            className="field-input resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="budget">
              Budget
              <span className="ml-1 text-ink-3 font-normal normal-case tracking-normal">optional</span>
            </label>
            <select
              id="budget"
              name="budget"
              disabled={disabled}
              defaultValue=""
              className="field-input"
            >
              <option value="">Not provided</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="timeline">
              Timeline
              <span className="ml-1 text-ink-3 font-normal normal-case tracking-normal">optional</span>
            </label>
            <select
              id="timeline"
              name="timeline"
              disabled={disabled}
              defaultValue=""
              className="field-input"
            >
              <option value="">Not provided</option>
              {TIMELINES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="source">
            How did they find you?
            <span className="ml-1 text-ink-3 font-normal normal-case tracking-normal">optional</span>
          </label>
          <input
            id="source"
            name="source"
            type="text"
            disabled={disabled}
            placeholder="LinkedIn, referral, cold email..."
            className="field-input"
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-md bg-violet text-white text-sm font-semibold py-3 px-4
          hover:bg-violet-hover active:scale-[0.99]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2 focus:ring-offset-page"
      >
        {disabled ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Analyzing…
          </span>
        ) : (
          "Analyze lead"
        )}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white/70"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
