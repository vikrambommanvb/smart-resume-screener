import { z } from "zod";

// 1. Role Profile Schema
export const RoleProfileSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string().optional(),
  seniority: z.string().optional(),
  seniority_default: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  core_skills: z.array(z.string()).default([]),
  common_skills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  typical_projects: z.array(z.string()).optional(),
});
export type RoleProfile = z.infer<typeof RoleProfileSchema>;

// 2. SSE Stage Event
export const StageEventSchema = z.object({
  id: z.enum(["read", "understand", "match", "health", "guidance"]),
  label: z.string(),
  status: z.enum(["pending", "running", "done", "error"]),
});
export type StageEvent = z.infer<typeof StageEventSchema>;

// 3. Resume Profile Section Data
export const ResumeProfileDataSchema = z.object({
  detected_sections: z.array(z.string()).default([]),
  page_count: z.number().default(1),
  contact_flags: z.object({
    has_email: z.boolean().default(false),
    has_phone: z.boolean().default(false),
    has_linkedin: z.boolean().default(false),
    has_github: z.boolean().default(false),
    has_portfolio: z.boolean().default(false),
  }),
  warning: z.string().nullable().optional(),
});
export type ResumeProfileData = z.infer<typeof ResumeProfileDataSchema>;

// 4. Skills Section Data
export const MatchedSkillItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().default("skills"),
  importance: z.string().default("required"),
  evidence: z.string().default(""),
});
export type MatchedSkillItem = z.infer<typeof MatchedSkillItemSchema>;

export const MissingSkillItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().default("skills"),
  importance: z.string().default("required"),
});
export type MissingSkillItem = z.infer<typeof MissingSkillItemSchema>;

export const SkillsSectionDataSchema = z.object({
  matched: z.array(MatchedSkillItemSchema).default([]),
  partial: z.array(MatchedSkillItemSchema).default([]),
  missing: z.array(MissingSkillItemSchema).default([]),
  total_count: z.number().default(0),
});
export type SkillsSectionData = z.infer<typeof SkillsSectionDataSchema>;

// 5. Match Section Data
export const ComponentScoreSchema = z.object({
  name: z.string(),
  points: z.number(),
  max_points: z.number(),
  percentage: z.number(),
  explanation: z.string().default(""),
  is_renormalized: z.boolean().default(false),
});
export type ComponentScore = z.infer<typeof ComponentScoreSchema>;

export const BiggestMoverSchema = z.object({
  skill_id: z.string(),
  skill_name: z.string(),
  category: z.string(),
  potential_points: z.number(),
});
export type BiggestMover = z.infer<typeof BiggestMoverSchema>;

export const MatchSectionDataSchema = z.object({
  total_score: z.number(),
  band: z.enum(["strong", "solid", "partial", "needs_rework"]),
  confidence: z.string().default("high"),
  confidence_note: z.string().default(""),
  components: z.record(z.string(), ComponentScoreSchema),
  biggest_movers: z.array(BiggestMoverSchema).default([]),
});
export type MatchSectionData = z.infer<typeof MatchSectionDataSchema>;

// 6. Health Section Data
export const HealthFindingSchema = z.object({
  category: z.string(),
  severity: z.enum(["critical", "warning", "tip"]),
  message: z.string(),
  location: z.string(),
});
export type HealthFinding = z.infer<typeof HealthFindingSchema>;

export const SubscoreItemSchema = z.object({
  score: z.number(),
  max: z.number(),
});
export type SubscoreItem = z.infer<typeof SubscoreItemSchema>;

export const HealthSectionDataSchema = z.object({
  total_score: z.number(),
  subscores: z.record(z.string(), SubscoreItemSchema),
  findings: z.array(HealthFindingSchema).default([]),
});
export type HealthSectionData = z.infer<typeof HealthSectionDataSchema>;

// 7. Careers Section Data
export const CareerAlternativeSchema = z.object({
  role_id: z.string(),
  title: z.string(),
  fit_band: z.enum(["Strong fit", "Good fit", "Possible fit"]),
  similarity: z.number(),
  matched_skills: z.array(z.string()).default([]),
  gaps_to_close: z.array(z.string()).default([]),
  summary: z.string().default(""),
});
export type CareerAlternative = z.infer<typeof CareerAlternativeSchema>;

// 8. Strengths Section Data
export const VerifiedStrengthItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  evidence_quote: z.string().default(""),
  is_verified: z.boolean().default(false),
});
export type VerifiedStrengthItem = z.infer<typeof VerifiedStrengthItemSchema>;

export const StrengthsSectionDataSchema = z.object({
  summary: z.string().default(""),
  strengths: z.array(VerifiedStrengthItemSchema).default([]),
});
export type StrengthsSectionData = z.infer<typeof StrengthsSectionDataSchema>;

// 9. Improvements / Rewrites Section Data
export const RewriteItemSchema = z.object({
  section: z.string(),
  original: z.string(),
  suggested: z.string(),
  rationale: z.string(),
  needs_user_input: z.boolean().default(false),
  placeholders: z.array(z.string()).default([]),
});
export type RewriteItem = z.infer<typeof RewriteItemSchema>;

// 10. Roadmap Section Data
export const ResourcePayloadSchema = z.object({
  id: z.string(),
  title: z.string(),
  platform: z.string(),
  url: z.string(),
  type: z.enum(["course", "doc", "video", "tutorial"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  free: z.boolean().default(true),
  duration_hours: z.number().nullable().optional(),
});
export type ResourcePayload = z.infer<typeof ResourcePayloadSchema>;

export const RoadmapStepSchema = z.object({
  goal: z.string(),
  why_it_matters: z.string(),
  actions: z.array(z.string()).default([]),
  est_hours: z.number().default(10),
  milestone: z.string(),
  resource_ids: z.array(z.string()).default([]),
  resources: z.array(ResourcePayloadSchema).default([]),
});
export type RoadmapStep = z.infer<typeof RoadmapStepSchema>;

// 11. Interview Prep Section Data
export const InterviewQuestionSchema = z.object({
  question: z.string(),
  category: z.string(), // technical, behavioral, project
  why_asked: z.string(),
  good_answer_covers: z.array(z.string()).default([]),
  grounded_in: z.string(),
});
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;

// 12. Done & Error Payloads
export const DonePayloadSchema = z.object({
  degraded: z.boolean().default(false),
  request_id: z.string(),
  duration_ms: z.number().default(0),
});
export type DonePayload = z.infer<typeof DonePayloadSchema>;

export const ErrorPayloadSchema = z.object({
  section: z.string().nullable().optional(),
  code: z.string(),
  message: z.string(),
  retryable: z.boolean().default(false),
});
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;
