# hackathon-2025
【技育CAMP2025】ハッカソン Vol.15【オンライン開催】

## セットアップ

### 1. 設定ファイルの準備

初回セットアップ時に以下のコマンドを実行してください：

```bash
# バックエンド設定ファイル
cp backend/config.go.example backend/config.go

# Docker設定ファイル
cp compose.override.yml.example compose.override.yml
```

### 2. 環境に合わせた設定

#### config.go

使用するCPUアーキテクチャに合わせてコメントを変更：

| 環境 | 設定 |
|------|------|
| Docker環境（推奨） | `const EngineBinary = "YaneuraOu-by-gcc-docker"` |
| macOS (Apple Silicon) | `const EngineBinary = "YaneuraOu-by-gcc-mac"` |
| Intel CPU (Linux) | `const EngineBinary = "YaneuraOu-by-gcc-intel"` |

#### compose.override.yml

ビルドターゲットCPUを設定：

| 環境 | TARGET_CPU |
|------|------------|
| ローカル開発 (Apple Silicon) | `SSE42` |
| 本番サーバー (Intel CPU) | `AVX2` |

## Docker環境の起動

```bash
docker compose up --build
```

初回はYaneuraOuのビルドに数分かかります。

## 確認用URL

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

## ローカル開発（Docker無し）

```bash
cd backend
go run .
```

※ `config.go` で `YaneuraOu-by-gcc-mac` を選択してください

---

皆さんがんばりましょう
