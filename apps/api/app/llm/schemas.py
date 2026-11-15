"""Pydantic structured output schemas for Gemini API responses.
All schemas are kept plain (types, enums, lists, optionals) to comply with Gemini response_schema.
"""

from pydantic import BaseModel, Field


# 1. Resume Profile
class ExtractedSkillItem(BaseModel):
    skill: str
    evidence_quote: str


class ExtractedProjectItem(BaseModel):
    name: str
    summary: str
    tech_used: list[str] = Field(default_factory=list)


class ResumeProfileResponse(BaseModel):
    skills_with_evidence: list[ExtractedSkillItem] = Field(default_factory=list)
    projects: list[ExtractedProjectItem] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    job_titles: list[str] = Field(default_factory=list)


# 2. Job Profile
class JobProfileResponse(BaseModel):
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    required_years: float | None = None
    seniority: str | None = None


# 3. Match Explanation
class StrengthItem(BaseModel):
    title: str
    description: str
    evidence_quote: str


class MatchExplanationResponse(BaseModel):
    summary: str
    strengths: list[StrengthItem] = Field(default_factory=list)


# 4. Improvements / Rewrites
class RewriteItem(BaseModel):
    section: str
    original: str
    suggested: str
    rationale: str
    needs_user_input: bool = False
    placeholders: list[str] = Field(default_factory=list)


class ImprovementsResponse(BaseModel):
    rewrites: list[RewriteItem] = Field(default_factory=list)


# 5. Careers Rationale
class CareerRationaleItem(BaseModel):
    role_id: str
    rationale: str


class CareersRationaleResponse(BaseModel):
    rationales: list[CareerRationaleItem] = Field(default_factory=list)


# 6. Learning Roadmap
class RoadmapStepItem(BaseModel):
    goal: str
    why_it_matters: str
    actions: list[str] = Field(default_factory=list)
    est_hours: int = 10
    milestone: str
    resource_ids: list[str] = Field(default_factory=list)


class RoadmapResponse(BaseModel):
    steps: list[RoadmapStepItem] = Field(default_factory=list)


# 7. Interview Prep
class InterviewQuestionItem(BaseModel):
    question: str
    category: str  # "technical", "behavioral", "project"
    why_asked: str = Field(default="")
    good_answer_covers: list[str] = Field(default_factory=list)
    grounded_in: str = Field(default="")


class InterviewPrepResponse(BaseModel):
    questions: list[InterviewQuestionItem] = Field(default_factory=list)
