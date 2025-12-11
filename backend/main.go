package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"my-backend-app/game"
	"my-backend-app/handlers"
)

// CORS ミドルウェア
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// 作業ディレクトリを取得
	workDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("作業ディレクトリの取得に失敗: %v", err)
	}

	// YaneuraOuのパスを設定
	// Docker環境では /AI にマウントされている
	// ローカル環境では backendディレクトリからの相対パス
	var enginePath, evalDir string

	// Docker環境のパスを優先
	dockerEnginePath := "/AI/YaneuraOu-by-gcc-mac"
	dockerEvalDir := "/AI/eval"

	if _, err := os.Stat(dockerEnginePath); err == nil {
		enginePath = dockerEnginePath
		evalDir = dockerEvalDir
	} else {
		// ローカル環境用のパス
		enginePath = filepath.Join(workDir, "..", "AI", "YaneuraOu-by-gcc-mac")
		evalDir = filepath.Join(workDir, "..", "AI", "eval")
	}

	// ファイルの存在確認
	if _, err := os.Stat(enginePath); os.IsNotExist(err) {
		log.Fatalf("エンジンファイルが見つかりません: %s", enginePath)
	}
	if _, err := os.Stat(evalDir); os.IsNotExist(err) {
		log.Fatalf("評価関数ディレクトリが見つかりません: %s", evalDir)
	}

	log.Printf("将棋エンジンパス: %s", enginePath)
	log.Printf("評価関数ディレクトリ: %s", evalDir)

	// GameManagerを初期化
	gameManager := game.NewGameManager(enginePath, evalDir)

	// WebSocketハンドラを作成
	wsHandler := handlers.NewWebSocketHandler(gameManager)

	// ルーティング設定
	mux := http.NewServeMux()

	// ヘルスチェック
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "将棋AIバックエンド稼働中")
	})

	// API: サーバー情報
	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"running","engine":"YaneuraOu/水匠"}`)
	})

	// WebSocket接続
	mux.HandleFunc("/ws", wsHandler.HandleConnection)

	// CORSミドルウェアを適用
	handler := corsMiddleware(mux)

	// サーバー起動
	port := ":8080"
	log.Printf("サーバー起動中... http://localhost%s", port)
	log.Printf("WebSocket: ws://localhost%s/ws", port)

	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatalf("サーバー起動に失敗: %v", err)
	}
}
