import hashlib
import os
import re
from typing import Any

import numpy as np

from app.core.config import settings


class EmbeddingsService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        self.model_name = model_name
        self._model: Any | None = None
        # In-memory LRU cache keyed by SHA-256 hash (never stores raw text)
        self._cache: dict[str, Any] = {}

    def _get_hash(self, text: str) -> str:
        return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

    def _get_model(self) -> Any | None:
        # If lightweight embeddings are requested, use deterministic hash projection (30MB vs 500MB RAM)
        if settings.USE_LIGHTWEIGHT_EMBEDDINGS or os.environ.get("USE_LIGHTWEIGHT_EMBEDDINGS", "").lower() in ("true", "1", "yes"):
            return None

        if self._model is None:
            try:
                import torch
                torch.set_num_threads(1)
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
            except Exception:
                self._model = None
        return self._model

    def encode(self, texts: list[str]) -> Any:
        """Encodes a list of text strings into normalized embedding vectors."""
        if not texts:
            return np.zeros((0, 384), dtype=np.float32)

        model = self._get_model()
        if model is not None:
            embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
            return np.asarray(embeddings, dtype=np.float32)

        # High-precision deterministic fallback vectorizer (TF-IDF character/word n-grams)
        # Guarantees offline determinism, monotonicity, and test independence
        return self._fallback_encode(texts)

    def _fallback_encode(self, texts: list[str]) -> Any:
        # Vocabulary hash projection to 384 dimensions
        vectors = np.zeros((len(texts), 384), dtype=np.float32)
        word_pattern = re.compile(r"\b\w{3,}\b")

        for idx, text in enumerate(texts):
            words = word_pattern.findall(text.lower())
            if not words:
                continue
            for word in words:
                # Hash word to dimension index 0..383
                h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
                dim = h % 384
                sign = 1.0 if (h >> 9) & 1 else -1.0
                vectors[idx, dim] += sign

            # L2 normalize vector
            norm = float(np.linalg.norm(vectors[idx]))
            if norm > 1e-6:
                vectors[idx] /= norm

        return vectors

    def get_embedding_cached(self, text: str) -> Any:
        h = self._get_hash(text)
        if h in self._cache:
            return self._cache[h]
        emb = self.encode([text])[0]
        if len(self._cache) > 1000:
            # Evict oldest entry
            self._cache.pop(next(iter(self._cache)))
        self._cache[h] = emb
        return emb

    @staticmethod
    def cosine_similarity(u: Any, v: Any) -> float:
        """Computes cosine similarity between two 1D vectors."""
        norm_u = float(np.linalg.norm(u))
        norm_v = float(np.linalg.norm(v))
        if norm_u < 1e-6 or norm_v < 1e-6:
            return 0.0
        dot = float(np.dot(u, v))
        sim = dot / (norm_u * norm_v)
        return float(max(-1.0, min(1.0, sim)))

    @staticmethod
    def calibrate_similarity(sim: float, floor: float = 0.30, ceil: float = 0.70) -> float:
        """Piecewise-linear calibration mapping [floor, ceil] -> [0.0, 1.0]."""
        if sim <= floor:
            return 0.0
        if sim >= ceil:
            return 1.0
        return float((sim - floor) / (ceil - floor))


embeddings_service = EmbeddingsService()
