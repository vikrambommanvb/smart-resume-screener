import json
from pathlib import Path
from typing import Any, cast

import pytest


@pytest.fixture
def taxonomy_data() -> list[dict[str, Any]]:
    path = Path(__file__).resolve().parent.parent.parent / "app" / "data" / "taxonomy.json"
    with open(path, encoding="utf-8") as f:
        return cast(list[dict[str, Any]], json.load(f))


@pytest.fixture
def roles_data() -> list[dict[str, Any]]:
    path = Path(__file__).resolve().parent.parent.parent / "app" / "data" / "roles.json"
    with open(path, encoding="utf-8") as f:
        return cast(list[dict[str, Any]], json.load(f))


def test_taxonomy_skill_count(taxonomy_data: list[dict[str, Any]]) -> None:
    assert len(taxonomy_data) >= 300, f"Expected at least 300 skills, found {len(taxonomy_data)}"


def test_taxonomy_unique_aliases(taxonomy_data: list[dict[str, Any]]) -> None:
    seen_aliases: dict[str, str] = {}
    for skill in taxonomy_data:
        sid = skill["id"]
        for alias in skill.get("aliases", []):
            norm = alias.lower().strip()
            assert norm not in seen_aliases, f"Duplicate alias '{norm}' used in '{seen_aliases[norm]}' and '{sid}'"
            seen_aliases[norm] = sid


def test_taxonomy_referential_integrity(taxonomy_data: list[dict[str, Any]]) -> None:
    skill_ids = {s["id"] for s in taxonomy_data}

    for skill in taxonomy_data:
        sid = skill["id"]
        for rel in skill.get("related", []):
            target = rel["id"]
            assert target in skill_ids, f"Skill '{sid}' references unknown related id '{target}'"
        for imp in skill.get("implies", []):
            target = imp["id"]
            assert target in skill_ids, f"Skill '{sid}' references unknown implies id '{target}'"


def test_taxonomy_ambiguous_short_names(taxonomy_data: list[dict[str, Any]]) -> None:
    short_ids = {"c", "r_lang", "golang", "rust", "sas"}
    for skill in taxonomy_data:
        if skill["id"] in short_ids:
            assert skill.get("requires_context") is True, f"Short skill '{skill['id']}' must require context"
            assert len(skill.get("context_words", [])) >= 2, f"Short skill '{skill['id']}' must have context words"


def test_roles_integrity(roles_data: list[dict[str, Any]], taxonomy_data: list[dict[str, Any]]) -> None:
    assert len(roles_data) >= 14, f"Expected >= 14 curated roles, found {len(roles_data)}"
    valid_skill_ids = {s["id"] for s in taxonomy_data}

    for role in roles_data:
        rid = role["id"]
        # Core skills must exist in taxonomy
        for sid in role["core_skills"]:
            assert sid in valid_skill_ids, f"Role '{rid}' has unknown core skill '{sid}'"
        # Common skills must exist in taxonomy
        for sid in role["common_skills"]:
            assert sid in valid_skill_ids, f"Role '{rid}' has unknown common skill '{sid}'"
        # Responsibilities must be between 6 and 10 sentences
        resps = role["responsibilities"]
        assert 6 <= len(resps) <= 10, f"Role '{rid}' has {len(resps)} responsibilities, expected 6-10"
