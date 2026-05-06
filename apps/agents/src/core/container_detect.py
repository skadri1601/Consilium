from __future__ import annotations

import os
import logging
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class ContainerEnvironment:
    in_container: bool
    markers: list[str] = field(default_factory=list)
    runtime: str | None = None

    def to_dict(self) -> dict:
        return {
            "in_container": self.in_container,
            "markers": self.markers,
            "runtime": self.runtime,
        }


@dataclass
class DetectionInputs:
    env_pairs: dict[str, str]
    dockerenv_exists: bool
    containerenv_exists: bool
    proc_1_cgroup: str | None


def _read_proc_cgroup() -> str | None:
    try:
        return Path("/proc/1/cgroup").read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None


def _collect_inputs() -> DetectionInputs:
    return DetectionInputs(
        env_pairs=dict(os.environ),
        dockerenv_exists=Path("/.dockerenv").exists(),
        containerenv_exists=Path("/run/.containerenv").exists(),
        proc_1_cgroup=_read_proc_cgroup(),
    )


CONTAINER_ENV_KEYS = {"CONTAINER", "DOCKER", "PODMAN", "KUBERNETES_SERVICE_HOST"}
CGROUP_NEEDLES = ("docker", "containerd", "kubepods", "podman", "libpod")


def detect_from(inputs: DetectionInputs) -> ContainerEnvironment:
    markers: list[str] = []

    if inputs.dockerenv_exists:
        markers.append("/.dockerenv")
    if inputs.containerenv_exists:
        markers.append("/run/.containerenv")

    for key in CONTAINER_ENV_KEYS:
        val = inputs.env_pairs.get(key, "")
        if val:
            markers.append(f"env:{key}={val}")

    if inputs.proc_1_cgroup:
        for needle in CGROUP_NEEDLES:
            if needle in inputs.proc_1_cgroup:
                markers.append(f"/proc/1/cgroup:{needle}")

    markers = sorted(set(markers))

    runtime = None
    if markers:
        if any("kubernetes" in m.lower() for m in markers) or any("kubepods" in m for m in markers):
            runtime = "kubernetes"
        elif any("podman" in m for m in markers) or any("libpod" in m for m in markers):
            runtime = "podman"
        elif any("docker" in m for m in markers):
            runtime = "docker"
        else:
            runtime = "unknown"

    return ContainerEnvironment(
        in_container=bool(markers),
        markers=markers,
        runtime=runtime,
    )


def detect_container_environment() -> ContainerEnvironment:
    inputs = _collect_inputs()
    result = detect_from(inputs)
    if result.in_container:
        logger.info(
            "Container environment detected: runtime=%s, markers=%s",
            result.runtime, result.markers,
        )
    return result


_cached: ContainerEnvironment | None = None


def get_container_environment() -> ContainerEnvironment:
    global _cached
    if _cached is None:
        _cached = detect_container_environment()
    return _cached
