import json
import secrets
import time
from collections.abc import AsyncGenerator
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse

from app.core.logging import log_event
from app.core.security import check_rate_limit, verify_turnstile
from app.llm.client import gemini_service
from app.llm.guards import (
    check_no_invented_numbers,
    strip_model_urls,
    verify_evidence_quote,
)
from app.llm.prompts import (
    build_explain_match_prompt,
    build_improvements_prompt,
    build_interview_prompt,
    build_roadmap_prompt,
)
from app.llm.schemas import (
    ImprovementsResponse,
    InterviewPrepResponse,
    MatchExplanationResponse,
    RoadmapResponse,
)
from app.pipeline.careers import compute_career_alternatives
from app.pipeline.extract import PDFExtractionError, extract_pdf_in_memory
from app.pipeline.health import evaluate_resume_health
from app.pipeline.normalise import normalise_text
from app.pipeline.redact import redact_pii
from app.pipeline.roadmap import (
    enrich_roadmap_step_with_resources,
    generate_deterministic_roadmap,
)
from app.pipeline.roles import roles_manager
from app.pipeline.scoring import calculate_match_score
from app.pipeline.section import segment_resume
from app.pipeline.taxonomy import taxonomy_engine

router = APIRouter(prefix="/v1", tags=["analyze"])


def sse_event(event_type: str, data: Any) -> str:
    """Formats payload according to SSE wire format."""
    payload = json.dumps(data) if not isinstance(data, str) else data
    return f"event: {event_type}\ndata: {payload}\n\n"


@router.get("/roles", summary="Get all predefined role profiles")
async def get_roles() -> list[dict[str, Any]]:
    return roles_manager.list_roles()


@router.post("/analyze", summary="Analyze resume against a job description or role with live SSE streaming")
async def analyze_resume_stream(
    request: Request,
    resume: UploadFile = File(...),
    mode: str = Form(...),
    job_description: str | None = Form(None),
    role_id: str | None = Form(None),
    sections: str | None = Form(None),
    allow_scan_fallback: bool = Form(False),
    turnstile_token: str | None = Form(None),
) -> StreamingResponse:
    start_time = time.time()
    req_id = f"req_{secrets.token_hex(4)}"

    # 1. Rate Limiting Check
    client_ip = await check_rate_limit(request)

    # 2. Turnstile Verification
    if not await verify_turnstile(turnstile_token or "", client_ip):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CAPTCHA_FAILED", "message": "Bot verification challenge failed."},
        )

    # 3. Input Validation
    if mode not in {"custom_jd", "role"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_MODE", "message": "Mode must be either 'custom_jd' or 'role'."},
        )

    target_jd_text = ""
    target_role_title = "Target Job"
    target_role_core_skills: list[str] = []
    target_role_common_skills: list[str] = []
    target_role_resps: list[str] = []
    low_confidence_warning: str | None = None

    if mode == "custom_jd":
        if not job_description or len(job_description.strip()) < 250:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "JD_TOO_SHORT", "message": "Job description must be at least 250 characters."},
            )
        if len(job_description.strip()) > 15000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "JD_TOO_LONG", "message": "Job description exceeds 15,000 characters limit."},
            )
        target_jd_text = job_description.strip()
        if len(target_jd_text) < 400:
            low_confidence_warning = "Job description is short (under 400 chars); match confidence may be lower."

        # Extract JD skills and responsibility sentences
        jd_skills_dict = taxonomy_engine.extract_skills_from_text(target_jd_text, section_name="jd")
        target_role_core_skills = list(jd_skills_dict.keys())
        target_role_resps = [
            s.strip() for s in target_jd_text.splitlines() if len(s.strip()) > 30 and not s.strip().startswith("-")
        ][:8]
    else:  # mode == "role"
        if not role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_ROLE", "message": "role_id is required when mode is 'role'."},
            )
        role_profile = roles_manager.get_role(role_id)
        if not role_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_ROLE", "message": f"Predefined role '{role_id}' not found."},
            )
        target_role_title = role_profile.get("title", "Role")
        target_role_core_skills = role_profile.get("core_skills", [])
        target_role_common_skills = role_profile.get("common_skills", [])
        target_role_resps = role_profile.get("responsibilities", [])
        target_jd_text = f"{role_profile.get('title')}\n\n" + "\n".join(target_role_resps)

    # 4. Read PDF in-memory (max 5 MB)
    pdf_content = await resume.read()
    if len(pdf_content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOO_LARGE", "message": "PDF exceeds 5 MB size limit."},
        )

    # 5. Extract PDF text in-memory under timeout
    try:
        extracted = await extract_pdf_in_memory(pdf_content, allow_scan_fallback=allow_scan_fallback)
    except PDFExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": exc.code, "message": exc.message},
        ) from exc

    # Parse sections filter if retry requested
    requested_sections: set[str] | None = (
        {s.strip() for s in sections.split(",") if s.strip()} if sections else None
    )

    async def event_generator() -> AsyncGenerator[str, None]:
        degraded = False
        try:
            # Stage 1: Read & Parse
            yield sse_event("stage", {"id": "read", "label": "Extracting text from PDF", "status": "running"})
            normalized_text = normalise_text(extracted.raw_text)

            if len(normalized_text.strip()) < 100 and not extracted.is_scanned:
                yield sse_event("error", {"section": None, "code": "EMPTY_TEXT", "message": "No readable text found.", "retryable": False})
                return

            redaction = redact_pii(normalized_text)
            sections_result = segment_resume(redaction.redacted_text)
            yield sse_event("stage", {"id": "read", "label": "Text extracted and redacted", "status": "done"})

            # Stage 2: Understand & Profile
            yield sse_event("stage", {"id": "understand", "label": "Analyzing skills and project experience", "status": "running"})
            matched_skills = taxonomy_engine.extract_skills_from_text(redaction.redacted_text, section_name="resume")

            yield sse_event("section", {
                "name": "resume_profile",
                "data": {
                    "detected_sections": sections_result.detected_sections,
                    "page_count": extracted.page_count,
                    "contact_flags": {
                        "has_email": redaction.has_email,
                        "has_phone": redaction.has_phone,
                        "has_linkedin": redaction.has_linkedin,
                        "has_github": redaction.has_github,
                        "has_portfolio": redaction.has_portfolio,
                    },
                    "warning": low_confidence_warning or extracted.warning,
                }
            })
            yield sse_event("stage", {"id": "understand", "label": "Profile ready", "status": "done"})

            # Stage 3: Match Deterministically
            yield sse_event("stage", {"id": "match", "label": "Computing deterministic alignment score", "status": "running"})
            match_res = calculate_match_score(
                resume_sections=sections_result,
                full_resume_text=redaction.redacted_text,
                matched_skills=matched_skills,
                required_skills=target_role_core_skills,
                preferred_skills=target_role_common_skills,
                responsibilities=target_role_resps,
                required_years=None,
            )

            # Categorize skills into matched, partial, missing for UI
            matched_list = []
            partial_list = []
            missing_list = []

            for sid in target_role_core_skills:
                skill_def = taxonomy_engine.skills_by_id.get(sid, {})
                s_name = skill_def.get("name", sid)
                s_cat = skill_def.get("category", "skills")

                if sid in matched_skills:
                    ms = matched_skills[sid]
                    if ms.evidence_quote and not ms.is_implied:
                        matched_list.append({"id": sid, "name": s_name, "category": s_cat, "evidence": ms.evidence_quote, "importance": "required"})
                    else:
                        partial_list.append({"id": sid, "name": s_name, "category": s_cat, "evidence": ms.evidence_quote or "Listed in skills section", "importance": "required"})
                else:
                    missing_list.append({"id": sid, "name": s_name, "category": s_cat, "importance": "required"})

            yield sse_event("section", {
                "name": "skills",
                "data": {
                    "matched": matched_list,
                    "partial": partial_list,
                    "missing": missing_list,
                    "total_count": len(target_role_core_skills),
                }
            })

            yield sse_event("section", {
                "name": "match",
                "data": {
                    "total_score": match_res.total_score,
                    "band": match_res.band,
                    "confidence": match_res.confidence,
                    "confidence_note": match_res.confidence_note,
                    "components": {
                        k: {
                            "name": v.name,
                            "points": v.points,
                            "max_points": v.max_points,
                            "percentage": v.percentage,
                            "explanation": v.explanation,
                            "is_renormalized": v.is_renormalized,
                        }
                        for k, v in match_res.components.items()
                    },
                    "biggest_movers": [
                        {
                            "skill_id": m.skill_id,
                            "skill_name": m.skill_name,
                            "category": m.category,
                            "potential_points": m.potential_points,
                        }
                        for m in match_res.biggest_movers
                    ],
                }
            })
            yield sse_event("stage", {"id": "match", "label": "Match score computed", "status": "done"})

            # Stage 4: Resume Health
            yield sse_event("stage", {"id": "health", "label": "Auditing resume structure and ATS health", "status": "running"})
            health_res = evaluate_resume_health(
                sections=sections_result,
                full_text=redaction.redacted_text,
                redaction=redaction,
                page_count=extracted.page_count,
                is_scanned=extracted.is_scanned,
            )

            yield sse_event("section", {
                "name": "health",
                "data": {
                    "total_score": health_res.total_score,
                    "subscores": {
                        "content_strength": {"score": health_res.content_strength.score, "max": health_res.content_strength.max_score},
                        "structure_sections": {"score": health_res.structure_sections.score, "max": health_res.structure_sections.max_score},
                        "ats_friendliness": {"score": health_res.ats_friendliness.score, "max": health_res.ats_friendliness.max_score},
                        "readability_concision": {"score": health_res.readability_concision.score, "max": health_res.readability_concision.max_score},
                        "consistency": {"score": health_res.consistency.score, "max": health_res.consistency.max_score},
                        "contact_links": {"score": health_res.contact_links.score, "max": health_res.contact_links.max_score},
                    },
                    "findings": [
                        {"category": f.category, "severity": f.severity, "message": f.message, "location": f.location}
                        for f in health_res.all_findings
                    ],
                }
            })
            yield sse_event("stage", {"id": "health", "label": "Health audit complete", "status": "done"})

            # Stage 5: Guidance & AI Generation (with degradation shield)
            yield sse_event("stage", {"id": "guidance", "label": "Generating grounded strengths and actionable roadmap", "status": "running"})

            # 5a. Alternative Careers (Deterministic, instantaneous)
            if not requested_sections or "careers" in requested_sections:
                alternatives = compute_career_alternatives(
                    matched_skills=matched_skills,
                    target_role_id=role_id,
                    limit=3,
                )
                yield sse_event("section", {
                    "name": "careers",
                    "data": [
                        {
                            "role_id": a.role_id,
                            "title": a.title,
                            "fit_band": a.fit_band,
                            "similarity": a.similarity_score,
                            "matched_skills": a.matched_skills,
                            "gaps_to_close": a.gaps_to_close,
                            "summary": a.summary,
                        }
                        for a in alternatives
                    ]
                })

            # 5b. Grounded Gemini Calls
            # Call 1: Strengths & Explanation
            if not requested_sections or "strengths" in requested_sections:
                try:
                    sys_p, usr_p = build_explain_match_prompt(
                        score=match_res.total_score,
                        band=match_res.band,
                        components=match_res.components,
                        resume_text=redaction.redacted_text,
                        jd_text=target_jd_text,
                    )
                    explanation: MatchExplanationResponse | None = await gemini_service.generate_structured(
                        system_instruction=sys_p,
                        user_prompt=usr_p,
                        response_schema=MatchExplanationResponse,
                    )

                    if explanation:
                        # Guard: Verify evidence quotes
                        guarded_strengths = []
                        for st in explanation.strengths:
                            is_verified = verify_evidence_quote(st.evidence_quote, redaction.redacted_text)
                            guarded_strengths.append({
                                "title": strip_model_urls(st.title),
                                "description": strip_model_urls(st.description),
                                "evidence_quote": st.evidence_quote if is_verified else "",
                                "is_verified": is_verified,
                            })

                        yield sse_event("section", {
                            "name": "strengths",
                            "data": {
                                "summary": strip_model_urls(explanation.summary),
                                "strengths": guarded_strengths,
                            }
                        })
                    else:
                        degraded = True
                        yield sse_event("error", {"section": "strengths", "code": "AI_UNAVAILABLE", "message": "AI strengths explanation unavailable.", "retryable": True})
                except Exception as exc:
                    degraded = True
                    yield sse_event("error", {"section": "strengths", "code": "AI_ERROR", "message": str(exc), "retryable": True})

            # Call 2: Improvements & Rewrites
            if not requested_sections or "improvements" in requested_sections:
                try:
                    sys_p, usr_p = build_improvements_prompt(
                        resume_text=redaction.redacted_text,
                        jd_text=target_jd_text,
                    )
                    improvements: ImprovementsResponse | None = await gemini_service.generate_structured(
                        system_instruction=sys_p,
                        user_prompt=usr_p,
                        response_schema=ImprovementsResponse,
                    )

                    if improvements:
                        guarded_rewrites = []
                        for rw in improvements.rewrites:
                            # Guard: No invented numbers!
                            no_invented = check_no_invented_numbers(rw.original, rw.suggested)
                            if not no_invented:
                                continue  # Reject ungrounded rewrite

                            guarded_rewrites.append({
                                "section": strip_model_urls(rw.section),
                                "original": rw.original,
                                "suggested": strip_model_urls(rw.suggested),
                                "rationale": strip_model_urls(rw.rationale),
                                "needs_user_input": rw.needs_user_input,
                                "placeholders": rw.placeholders,
                            })

                        yield sse_event("section", {
                            "name": "improvements",
                            "data": guarded_rewrites,
                        })
                    else:
                        degraded = True
                        yield sse_event("error", {"section": "improvements", "code": "AI_UNAVAILABLE", "message": "AI suggestions temporarily unavailable.", "retryable": True})
                except Exception as exc:
                    degraded = True
                    yield sse_event("error", {"section": "improvements", "code": "AI_ERROR", "message": str(exc), "retryable": True})

            # Call 3: Learning Roadmap
            if not requested_sections or "roadmap" in requested_sections:
                missing_skill_ids = [m["id"] for m in missing_list]
                missing_skill_names = [m["name"] for m in missing_list]
                try:
                    sys_p, usr_p = build_roadmap_prompt(
                        missing_skills=missing_skill_names,
                        target_role=target_role_title,
                    )
                    roadmap: RoadmapResponse | None = await gemini_service.generate_structured(
                        system_instruction=sys_p,
                        user_prompt=usr_p,
                        response_schema=RoadmapResponse,
                    )

                    if roadmap and roadmap.steps:
                        enriched_steps = [
                            enrich_roadmap_step_with_resources(step.model_dump(), missing_skill_ids=missing_skill_ids)
                            for step in roadmap.steps
                        ]
                        yield sse_event("section", {
                            "name": "roadmap",
                            "data": enriched_steps,
                        })
                    else:
                        degraded = True
                        yield sse_event("error", {"section": "roadmap", "code": "AI_UNAVAILABLE", "message": "AI roadmap unavailable, providing curated skill-gap roadmap.", "retryable": True})
                        deterministic_steps = generate_deterministic_roadmap(missing_list, target_role_title)
                        yield sse_event("section", {
                            "name": "roadmap",
                            "data": deterministic_steps,
                        })
                except Exception as exc:
                    degraded = True
                    yield sse_event("error", {"section": "roadmap", "code": "AI_ERROR", "message": str(exc), "retryable": True})
                    deterministic_steps = generate_deterministic_roadmap(missing_list, target_role_title)
                    yield sse_event("section", {
                        "name": "roadmap",
                        "data": deterministic_steps,
                    })

            # Call 4: Interview Prep
            if not requested_sections or "interview" in requested_sections:
                try:
                    sys_p, usr_p = build_interview_prompt(
                        resume_text=redaction.redacted_text,
                        jd_text=target_jd_text,
                        target_role=target_role_title,
                    )
                    interview: InterviewPrepResponse | None = await gemini_service.generate_structured(
                        system_instruction=sys_p,
                        user_prompt=usr_p,
                        response_schema=InterviewPrepResponse,
                    )

                    if interview:
                        yield sse_event("section", {
                            "name": "interview",
                            "data": [
                                {
                                    "question": strip_model_urls(q.question),
                                    "category": q.category,
                                    "why_asked": strip_model_urls(q.why_asked),
                                    "good_answer_covers": [strip_model_urls(pt) for pt in q.good_answer_covers],
                                    "grounded_in": strip_model_urls(q.grounded_in),
                                }
                                for q in interview.questions
                            ]
                        })
                    else:
                        degraded = True
                        yield sse_event("error", {"section": "interview", "code": "AI_UNAVAILABLE", "message": "Interview prep unavailable.", "retryable": True})
                except Exception as exc:
                    degraded = True
                    yield sse_event("error", {"section": "interview", "code": "AI_ERROR", "message": str(exc), "retryable": True})

            yield sse_event("stage", {"id": "guidance", "label": "Analysis complete", "status": "done"})

            duration_ms = int((time.time() - start_time) * 1000)
            yield sse_event("done", {
                "request_id": req_id,
                "duration_ms": duration_ms,
                "degraded": degraded,
            })
            log_event("analyze_stream_completed", request_id=req_id, duration_ms=duration_ms, degraded=degraded)

        except Exception as exc:
            yield sse_event("error", {"section": None, "code": "STREAM_FATAL", "message": str(exc), "retryable": False})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-store",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
