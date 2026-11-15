"""Tests for ResourceCatalog, resources.json schema, and taxonomy referential integrity.
"""

from urllib.parse import urlparse

from app.pipeline.resources import catalog
from app.pipeline.taxonomy import taxonomy_engine
from scripts.verify_resources import is_allowed_host


def test_resource_catalog_loaded():
    assert catalog.total_count >= 120, f"Expected >= 120 resources, got {catalog.total_count}"
    assert catalog.covered_skill_count >= 80, f"Expected >= 80 skills, got {catalog.covered_skill_count}"


def test_resource_referential_integrity():
    valid_skill_ids = set(taxonomy_engine.skills_by_id.keys())
    for res_id, res in catalog._resources_by_id.items():
        assert len(res.skill_ids) > 0, f"Resource {res_id} has empty skill_ids"
        for sid in res.skill_ids:
            assert sid in valid_skill_ids, f"Resource {res_id} references unknown skill '{sid}'"


def test_resource_urls_and_domains():
    for res_id, res in catalog._resources_by_id.items():
        assert res.url.startswith("https://"), f"Resource {res_id} URL not HTTPS: {res.url}"
        parsed = urlparse(res.url)
        assert is_allowed_host(parsed.netloc), f"Resource {res_id} host {parsed.netloc} not allowed"


def test_catalog_query_helpers():
    # Single skill
    py_items = catalog.get_for_skill("python", limit=2)
    assert len(py_items) > 0
    assert any("python" in r.skill_ids for r in py_items)

    # Multi skills
    multi_items = catalog.get_for_skills(["docker", "kubernetes"], limit_per_skill=1)
    assert len(multi_items) >= 2
    seen = {r.id for r in multi_items}
    assert len(seen) == len(multi_items), "Expected deduplicated items"

    # Get by id
    first_id = py_items[0].id
    item = catalog.get_by_id(first_id)
    assert item is not None
    assert item.id == first_id

    # Fallback search URL
    fallback = catalog.build_fallback_search_url("Nonexistent Tech 123")
    assert fallback == "https://devdocs.io/#q=Nonexistent+Tech+123"
