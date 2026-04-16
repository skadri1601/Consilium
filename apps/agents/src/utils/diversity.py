from sentence_transformers import SentenceTransformer, util
import numpy as np

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def compute_diversity_score(texts: list[str]) -> dict:
    if len(texts) < 2:
        return {"diversity_score": 1.0, "mean_similarity": 0.0, "matrix": [], "echo_chamber_warning": False}

    model = _get_model()
    embeddings = model.encode(texts, convert_to_tensor=True)
    sim_matrix = util.cos_sim(embeddings, embeddings)
    n = len(texts)

    off_diag = [sim_matrix[i][j].item() for i in range(n) for j in range(n) if i != j]
    mean_sim = float(np.mean(off_diag))
    diversity_score = round(1.0 - mean_sim, 4)

    return {
        "diversity_score": diversity_score,
        "mean_similarity": round(mean_sim, 4),
        "matrix": sim_matrix.tolist(),
        "echo_chamber_warning": diversity_score < 0.15,
        "model_count": n,
    }
