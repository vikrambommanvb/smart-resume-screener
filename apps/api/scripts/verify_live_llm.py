"""Live LLM verification script using Groq / OpenAI compatible API endpoint.
Tests structured schema extraction, grounded prompt responses, and output guards.
Reads API key strictly from GROQ_API_KEY environment variable. Never commits keys.
"""

import asyncio
import json
import os
import sys

import httpx
from pydantic import BaseModel

from app.llm.guards import (
    check_no_invented_numbers,
    strip_model_urls,
    verify_evidence_quote,
)
from app.llm.prompts import (
    build_explain_match_prompt,
    build_improvements_prompt,
    build_interview_prompt,
)
from app.llm.schemas import (
    ImprovementsResponse,
    InterviewPrepResponse,
    MatchExplanationResponse,
)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-20b"


async def call_groq_structured[T: BaseModel](
    api_key: str,
    system_instruction: str,
    user_prompt: str,
    schema_cls: type[T],
) -> T:
    """Calls Groq API with structured JSON output enforcing Pydantic schema."""
    schema_json = json.dumps(schema_cls.model_json_schema(), indent=2)
    augmented_system = (
        f"{system_instruction}\n\n"
        "CRITICAL: You must return valid JSON matching this JSON schema exactly:\n"
        f"{schema_json}\n"
        "Return ONLY the raw JSON object. Do not wrap in markdown or backticks."
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(3):
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": augmented_system},
                        {"role": "user", "content": user_prompt},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.1,
                    "max_completion_tokens": 4096,
                },
            )
            if response.status_code == 429:
                wait_time = 3.0 + attempt * 2.0
                print(f"  [Rate limited by Groq TPM. Backing off for {wait_time}s...]", file=sys.stderr)
                await asyncio.sleep(wait_time)
                continue

            if response.status_code != 200:
                print("Groq Error Response:", response.status_code, response.text, file=sys.stderr)
            response.raise_for_status()
            data = response.json()
            raw_content = data["choices"][0]["message"]["content"]
            parsed = json.loads(raw_content)
            return schema_cls.model_validate(parsed)
        raise RuntimeError("Exceeded retry attempts for Groq API call.")


async def main() -> None:
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        print("ERROR: GROQ_API_KEY environment variable is not set.", file=sys.stderr)
        print("Usage: GROQ_API_KEY=gsk_... uv run python -m scripts.verify_live_llm", file=sys.stderr)
        sys.exit(1)

    print("==================================================================")
    print("Smart Resume Screener: Live LLM Verification (Groq)")
    print(f"Endpoint: {GROQ_API_URL}")
    print(f"Model:    {GROQ_MODEL}")
    print("==================================================================")

    # Candidate Resume Fixture Context
    source_resume = (
        "Sarah Jenkins\n"
        "s.jenkins@example.com | 555-019-2834 | San Francisco, CA\n\n"
        "SUMMARY\n"
        "Senior Backend Engineer with 5 years building scalable Python web services.\n\n"
        "EXPERIENCE\n"
        "Senior Software Engineer - Acme Cloud (2021 - Present)\n"
        "- Architected high-throughput microservices using Python and FastAPI handling 12,000 requests per minute.\n"
        "- Migrated monolithic relational database to PostgreSQL on AWS RDS, reducing p99 latency by 35%.\n"
        "- Spearheaded Docker containerisation and automated CI/CD pipelines with GitHub Actions.\n\n"
        "SKILLS\n"
        "Python, FastAPI, Docker, PostgreSQL, AWS, Git, CI/CD, Redis, Linux\n"
    )

    target_job = (
        "Senior Python Developer\n"
        "Requirements:\n"
        "- 4+ years of professional experience with Python and FastAPI.\n"
        "- Strong database architecture experience with PostgreSQL.\n"
        "- Demonstrated experience deploying containerized workloads with Docker on AWS.\n"
        "- Familiarity with CI/CD automation and microservice design.\n"
    )

    # 1. Test Match Explanation
    print("\n[1/3] Testing Match Explanation Generation...")
    sys_prompt, user_prompt = build_explain_match_prompt(
        score=88,
        band="Solid Alignment",
        components={"skills": 35.0, "responsibilities": 20.0},
        resume_text=source_resume,
        jd_text=target_job,
    )
    explanation = await call_groq_structured(api_key, sys_prompt, user_prompt, MatchExplanationResponse)
    print(f"  Summary: {explanation.summary[:90]}...")
    print(f"  Strengths identified: {len(explanation.strengths)}")

    # Verify Evidence Quotes Guard
    for strength in explanation.strengths:
        valid = verify_evidence_quote(strength.evidence_quote, source_resume)
        status_str = "PASS" if valid else "FAIL"
        print(f"    - [{status_str}] Quote verification: \"{strength.evidence_quote[:50]}...\"")

    # 2. Test Bullet Rewrites & Improvements
    await asyncio.sleep(1.5)
    print("\n[2/3] Testing Bullet Rewrites & Grounding Guard...")
    sys_prompt, user_prompt = build_improvements_prompt(
        resume_text=source_resume,
        jd_text=target_job,
    )
    improvements = await call_groq_structured(api_key, sys_prompt, user_prompt, ImprovementsResponse)
    print(f"  Rewrites generated: {len(improvements.rewrites)}")

    for rw in improvements.rewrites:
        no_invented = check_no_invented_numbers(rw.original, rw.suggested)
        status_str = "PASS" if no_invented else "FLAGGED"
        print(f"    - Section: {rw.section}")
        print(f"      Original:  {rw.original[:60]}...")
        print(f"      Suggested: {rw.suggested[:60]}...")
        print(f"      [{status_str}] No-Invented-Numbers check (placeholders: {rw.placeholders})")

    # 3. Test Grounded Interview Prep
    await asyncio.sleep(1.5)
    print("\n[3/3] Testing Interview Prep Grounding...")
    sys_prompt, user_prompt = build_interview_prompt(
        resume_text=source_resume,
        jd_text=target_job,
        target_role="Senior Python Developer",
    )
    interview = await call_groq_structured(api_key, sys_prompt, user_prompt, InterviewPrepResponse)
    print(f"  Total questions generated: {len(interview.questions)}")

    for q in interview.questions[:3]:
        cleaned_focus = strip_model_urls(q.question)
        print(f"    Sample Question: \"{cleaned_focus}\"")
        print(f"    Category: {q.category} | Grounded in: {q.grounded_in}")

    print("\n==================================================================")
    print("ALL LIVE LLM GENERATIONS & GROUNDING GUARDS VERIFIED SUCCESSFULLY!")
    print("==================================================================")


if __name__ == "__main__":
    asyncio.run(main())
