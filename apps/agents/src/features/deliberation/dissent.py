from __future__ import annotations

from src.features.deliberation.types import (
    Challenge,
    DissentCluster,
    DissentReport,
    Proposal,
    Rebuttal,
    RebuttalType,
)


def compute_similarity_matrix(proposals: list[Proposal]) -> list[list[float]]:
    n = len(proposals)
    word_sets = [set(p.content.lower().split()) for p in proposals]
    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j:
                matrix[i][j] = 1.0
            elif j > i:
                intersection = len(word_sets[i] & word_sets[j])
                union = len(word_sets[i] | word_sets[j])
                sim = intersection / union if union > 0 else 0.0
                matrix[i][j] = sim
                matrix[j][i] = sim
    return matrix


def cluster_proposals(
    proposals: list[Proposal], similarity_threshold: float = 0.5
) -> list[list[int]]:
    matrix = compute_similarity_matrix(proposals)
    clusters: list[list[int]] = [[i] for i in range(len(proposals))]

    def cluster_similarity(c1: list[int], c2: list[int]) -> float:
        total = 0.0
        count = 0
        for i in c1:
            for j in c2:
                total += matrix[i][j]
                count += 1
        return total / count if count > 0 else 0.0

    while len(clusters) > 1:
        best_sim = -1.0
        best_pair = (-1, -1)
        for i in range(len(clusters)):
            for j in range(i + 1, len(clusters)):
                sim = cluster_similarity(clusters[i], clusters[j])
                if sim > best_sim:
                    best_sim = sim
                    best_pair = (i, j)
        if best_sim < similarity_threshold:
            break
        i, j = best_pair
        merged = clusters[i] + clusters[j]
        clusters = [c for idx, c in enumerate(clusters) if idx not in (i, j)]
        clusters.append(merged)

    return clusters


def build_dissent_report(
    proposals: list[Proposal],
    challenges: list[Challenge],
    rebuttals: list[Rebuttal],
    clusters: list[list[int]],
) -> DissentReport:
    if not clusters or not proposals:
        return DissentReport(type="consensus", majority=None, minority=[])

    if len(clusters) == 1:
        cluster_proposals_list = [proposals[i] for i in clusters[0]]
        models = [proposals[i].model_id for i in clusters[0]]
        largest = max(cluster_proposals_list, key=lambda p: len(p.content))
        key_args = []
        for p in cluster_proposals_list:
            for c in p.claims:
                key_args.append(c.statement)
        majority = DissentCluster(
            models=models,
            position_summary=largest.content[:200],
            key_arguments=key_args,
            proposals=cluster_proposals_list,
        )
        return DissentReport(type="consensus", majority=majority, minority=[])

    sorted_clusters = sorted(clusters, key=len, reverse=True)
    majority_indices = sorted_clusters[0]
    majority_proposals = [proposals[i] for i in majority_indices]
    majority_models = [proposals[i].model_id for i in majority_indices]
    largest_majority = max(majority_proposals, key=lambda p: len(p.content))
    majority_args = []
    for p in majority_proposals:
        for c in p.claims:
            majority_args.append(c.statement)
    majority_cluster = DissentCluster(
        models=majority_models,
        position_summary=largest_majority.content[:200],
        key_arguments=majority_args,
        proposals=majority_proposals,
    )

    minority_clusters = []
    for cluster_indices in sorted_clusters[1:]:
        cluster_props = [proposals[i] for i in cluster_indices]
        cluster_models = [proposals[i].model_id for i in cluster_indices]
        largest_in_cluster = max(cluster_props, key=lambda p: len(p.content))
        cluster_args = []
        for p in cluster_props:
            for c in p.claims:
                cluster_args.append(c.statement)
        minority_clusters.append(
            DissentCluster(
                models=cluster_models,
                position_summary=largest_in_cluster.content[:200],
                key_arguments=cluster_args,
                proposals=cluster_props,
            )
        )

    disagreement_points = []
    rebuttal_map = {r.challenge_id: r for r in rebuttals}
    for idx, challenge in enumerate(challenges):
        cid = str(idx)
        rebuttal = rebuttal_map.get(cid)
        if rebuttal and rebuttal.response_type == RebuttalType.REFUTE:
            disagreement_points.append(
                {
                    "challenger": challenge.challenger_id,
                    "target": challenge.target_model_id,
                    "type": challenge.challenge_type.value,
                    "argument": challenge.argument,
                }
            )

    return DissentReport(
        type="dissent",
        majority=majority_cluster,
        minority=minority_clusters,
        disagreement_points=disagreement_points,
    )


def detect_dissent(
    proposals: list[Proposal],
    challenges: list[Challenge],
    rebuttals: list[Rebuttal],
    threshold: float = 0.5,
) -> DissentReport:
    clusters = cluster_proposals(proposals, similarity_threshold=threshold)
    return build_dissent_report(proposals, challenges, rebuttals, clusters)


def format_dissent_report(report: DissentReport) -> str:
    if report.type == "consensus":
        summary = report.majority.position_summary if report.majority else ""
        return f"All models agree: {summary}"

    lines = []
    if report.majority:
        n = len(report.majority.models)
        lines.append(f"Majority ({n} models): {report.majority.position_summary}")
    lines.append("Dissenting views:")
    for mc in report.minority:
        lines.append(f"- {mc.position_summary}")
    if report.disagreement_points:
        lines.append("Key disagreements:")
        for dp in report.disagreement_points:
            lines.append(f"- {dp['argument']}")
    return "\n".join(lines)
