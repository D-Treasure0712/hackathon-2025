FROM node:20-alpine

WORKDIR /app

# 依存関係ファイルを先にコピー（ビルド高速化のため）
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# 全ファイルをコピー
COPY . .

# 開発サーバー起動
CMD ["npm", "run", "dev"]