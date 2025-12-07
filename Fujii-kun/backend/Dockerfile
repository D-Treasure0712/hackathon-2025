FROM golang:1.20-alpine

WORKDIR /app

# Goモジュール定義ファイルをコピー
COPY go.mod ./
# go.sumはまだ無い場合があるので、あればコピーする記述
COPY go.sum* ./

# 依存関係をダウンロード
RUN go mod download

# ソースコードをコピー
COPY . .

# サーバー起動（main.goを実行）
CMD ["go", "run", "main.go"]