import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class MatchedSkill:
    id: str
    name: str
    category: str
    evidence_quote: str = ""
    section: str = ""
    is_implied: bool = False
    implied_by: str = ""
    weight: float = 1.0


class TaxonomyEngine:
    def __init__(self, data_path: Path | None = None) -> None:
        if data_path is None:
            data_path = Path(__file__).resolve().parent.parent / "data" / "taxonomy.json"

        with open(data_path, encoding="utf-8") as f:
            self.raw_taxonomy: list[dict[str, Any]] = json.load(f)

        self.skills_by_id: dict[str, dict[str, Any]] = {s["id"]: s for s in self.raw_taxonomy}
        self._build_alias_index()

    def _build_alias_index(self) -> None:
        # Pre-compile regex patterns for each alias with word boundaries
        self.alias_patterns: list[tuple[re.Pattern[str], str, dict[str, Any]]] = []

        # Sort skills by alias length descending so multi-word phrases match before substrings
        alias_entries: list[tuple[str, str, dict[str, Any]]] = []
        for skill in self.raw_taxonomy:
            for alias in skill.get("aliases", []):
                alias_entries.append((alias.lower().strip(), skill["id"], skill))

        alias_entries.sort(key=lambda item: len(item[0]), reverse=True)

        for alias, sid, skill in alias_entries:
            # Escape regex characters (e.g. c++, c#, .net)
            escaped = re.escape(alias)
            # Match with word boundaries or punctuation boundaries
            pattern = re.compile(rf"(?<!\w){escaped}(?!\w)", re.IGNORECASE)
            self.alias_patterns.append((pattern, sid, skill))

    def extract_skills_from_text(
        self,
        text: str,
        section_name: str = "general",
        full_doc_text: str | None = None,
    ) -> dict[str, MatchedSkill]:
        """Extracts skills from text with alias matching, context rules, and evidence quotes."""
        matched: dict[str, MatchedSkill] = {}
        doc_context = (full_doc_text or text).lower()

        lines = [line.strip() for line in text.splitlines() if line.strip()]

        for pattern, sid, skill in self.alias_patterns:
            if sid in matched:
                continue

            # Context requirement check for short/ambiguous skills (e.g. C, R, Go, Rust)
            if skill.get("requires_context", False):
                context_words: list[str] = skill.get("context_words", [])
                has_context = any(cw in doc_context for cw in context_words)
                if not has_context:
                    continue

            # Check if pattern matches in text
            match = pattern.search(text)
            if match:
                # Find the surrounding line / bullet as evidence quote
                matched_line = ""
                for line in lines:
                    if pattern.search(line):
                        matched_line = line
                        break

                matched[sid] = MatchedSkill(
                    id=sid,
                    name=skill["name"],
                    category=skill["category"],
                    evidence_quote=matched_line,
                    section=section_name,
                    is_implied=False,
                    weight=1.0,
                )

        # Expand implied skills (e.g. Django implies Python)
        implied_skills: dict[str, MatchedSkill] = {}
        for sid, match_obj in matched.items():
            skill_def = self.skills_by_id.get(sid, {})
            for imp in skill_def.get("implies", []):
                target_id = imp["id"]
                imp_weight = imp.get("weight", 0.8)
                if target_id not in matched and target_id not in implied_skills:
                    target_def = self.skills_by_id.get(target_id, {})
                    if target_def:
                        implied_skills[target_id] = MatchedSkill(
                            id=target_id,
                            name=target_def["name"],
                            category=target_def["category"],
                            evidence_quote=f"Implied by {match_obj.name}",
                            section=match_obj.section,
                            is_implied=True,
                            implied_by=match_obj.name,
                            weight=imp_weight,
                        )

        matched.update(implied_skills)
        return matched


taxonomy_engine = TaxonomyEngine()
