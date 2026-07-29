FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# System essentials
RUN apt-get update && apt-get install -y \
    curl wget git sudo build-essential \
    ca-certificates gnupg lsb-release \
    python3 python3-pip python3-venv \
    net-tools lsof \
    && rm -rf /var/lib/apt/lists/*

# Docker
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl --retry 3 --retry-delay 5 -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce=5:28.5.2-1~ubuntu.24.04~noble docker-ce-cli=5:28.5.2-1~ubuntu.24.04~noble containerd.io docker-buildx-plugin docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# Docker-in-Docker workarounds for Firecracker VMs
RUN apt-get update && apt-get install -y fuse-overlayfs iptables && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /etc/docker && printf '%s\n' '{' '  "storage-driver": "fuse-overlayfs"' '}' > /etc/docker/daemon.json
RUN update-alternatives --set iptables /usr/sbin/iptables-legacy \
    && update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy

# Node.js 22 via nvm
ENV NVM_DIR=/usr/local/nvm
RUN mkdir -p $NVM_DIR \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash \
    && . $NVM_DIR/nvm.sh && nvm install 22 && nvm alias default 22
ENV PATH=$NVM_DIR/versions/node/v22.22.1/bin:$PATH

# pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Poetry
RUN pip install --break-system-packages poetry

ENV PATH="/root/.local/bin:$PATH"
