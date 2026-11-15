import json
from pathlib import Path
from typing import Any


class RolesManager:
    def __init__(self, data_path: Path | None = None) -> None:
        if data_path is None:
            data_path = Path(__file__).resolve().parent.parent / "data" / "roles.json"

        with open(data_path, encoding="utf-8") as f:
            self.raw_roles: list[dict[str, Any]] = json.load(f)

        self.roles_by_id: dict[str, dict[str, Any]] = {r["id"]: r for r in self.raw_roles}

    def get_role(self, role_id: str) -> dict[str, Any] | None:
        return self.roles_by_id.get(role_id)

    def list_roles(self) -> list[dict[str, Any]]:
        return self.raw_roles


roles_manager = RolesManager()
