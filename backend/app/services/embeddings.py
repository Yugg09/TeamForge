"""Interest similarity: local sentence-transformers when installed, Jaccard otherwise.

The app must boot and demo with zero API keys, so the fallback is not a
degraded-mode afterthought — it is the default path unless the optional
`embeddings` extra is installed and the model is already cached locally.
"""

import logging
from functools import lru_cache

from app.config import settings

log = logging.getLogger(__name__)

_model = None
_model_tried = False


def _load_model():
    """Load the local model once; any failure permanently selects Jaccard."""
    global _model, _model_tried
    if _model_tried:
        return _model
    _model_tried = True
    try:
        from sentence_transformers import SentenceTransformer  # noqa: PLC0415

        _model = SentenceTransformer(settings.embedding_model)
        log.info("Loaded embedding model %s", settings.embedding_model)
    except Exception as exc:  # not installed, no cached weights, no network
        log.info("Embeddings unavailable (%s); using Jaccard similarity", exc)
        _model = None
    return _model


def backend_name() -> str:
    return "sentence-transformers" if _load_model() is not None else "jaccard"


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


@lru_cache(maxsize=1)
def _warn_once() -> None:
    log.info("Similarity backend: %s", backend_name())


def similarity_matrix(profiles: dict[str, dict]) -> dict[tuple[str, str], float]:
    """Pairwise 0..1 similarity for every participant pair.

    `profiles` maps participant id -> {"interests": [...], "text": "free text"}.
    """
    _warn_once()
    ids = list(profiles)
    model = _load_model()

    if model is not None:
        try:
            return _embedding_similarity(ids, profiles, model)
        except Exception as exc:
            log.warning("Embedding pass failed (%s); falling back to Jaccard", exc)

    out: dict[tuple[str, str], float] = {}
    sets = {pid: {i.lower().strip() for i in profiles[pid].get("interests", [])} for pid in ids}
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            out[(a, b)] = round(jaccard(sets[a], sets[b]), 4)
    return out


def _embedding_similarity(ids, profiles, model) -> dict[tuple[str, str], float]:
    import numpy as np  # noqa: PLC0415

    texts = [
        " ".join(profiles[pid].get("interests", [])) + " " + profiles[pid].get("text", "")
        for pid in ids
    ]
    vectors = model.encode(texts, normalize_embeddings=True)
    matrix = np.asarray(vectors) @ np.asarray(vectors).T
    out: dict[tuple[str, str], float] = {}
    for i, a in enumerate(ids):
        for j in range(i + 1, len(ids)):
            # Cosine on normalized vectors is in [-1, 1]; clamp to the 0..1 the
            # objective expects.
            out[(a, ids[j])] = round(float(max(0.0, min(1.0, matrix[i][j]))), 4)
    return out
