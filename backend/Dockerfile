# === Stage 1: YaneuraOuビルド ===
FROM ubuntu:24.04 AS yaneura-builder

RUN apt-get update && apt-get install -y \
    git make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build
RUN git clone --depth 1 https://github.com/yaneurao/YaneuraOu.git
WORKDIR /build/YaneuraOu/source
ARG TARGET_CPU=SSE42
RUN make -j$(nproc) YANEURAOU_EDITION=YANEURAOU_ENGINE_NNUE TARGET_CPU=${TARGET_CPU} COMPILER=g++

# === Stage 2: Goバックエンド ===
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
    golang-go ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# YaneuraOuバイナリをコピー
COPY --from=yaneura-builder /build/YaneuraOu/source/YaneuraOu-by-gcc /AI/YaneuraOu-by-gcc-docker

# Goモジュール定義ファイルをコピー
COPY go.mod ./
COPY go.sum* ./

# 依存関係をダウンロード
RUN go mod download

# ソースコードをコピー
COPY . .

# サーバー起動
CMD ["go", "run", "."]