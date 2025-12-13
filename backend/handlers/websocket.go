package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"my-backend-app/game"

	"github.com/gorilla/websocket"
)

// WebSocketアップグレーダーの設定（おまじない）
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// 開発環境ではすべてのオリジンを許可
		return true
	},
}

// ClientMessage はクライアントからのメッセージ形式
type ClientMessage struct {
	Type string `json:"type"`
	Move string `json:"move,omitempty"`
}

// ServerMessage はサーバーからのメッセージ形式
type ServerMessage struct {
	Type       string `json:"type"`
	Move       string `json:"move,omitempty"`
	IsBookMove bool   `json:"isBookMove,omitempty"` // 定石からの手かどうか
	Result     string `json:"result,omitempty"`
	Reason     string `json:"reason,omitempty"`
	Error      string `json:"error,omitempty"`
	ErrorType  string `json:"errorType,omitempty"` // "illegal_move", "engine_error"等
	GameID     string `json:"gameId,omitempty"`
}

// WebSocketHandler はWebSocket接続を処理する
type WebSocketHandler struct {
	GameManager *game.GameManager
}

// NewWebSocketHandler は新しいWebSocketHandlerを作成する
func NewWebSocketHandler(gm *game.GameManager) *WebSocketHandler {
	return &WebSocketHandler{
		GameManager: gm,
	}
}

// HandleConnection はWebSocket接続を処理する
func (h *WebSocketHandler) HandleConnection(w http.ResponseWriter, r *http.Request) {
	// HTTPリクエストをWebSocket接続に切り替える処理。
	// 成功すると、WebSocket接続オブジェクトが返される。
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocketアップグレードに失敗: %v", err)
		return
	}
	defer conn.Close()

	// ゲームIDを取得またはデフォルト生成
	// WebSocket接続リクエストのクエリパラメータからgameIdを取得し、なければ既定値を返す
	gameID := r.URL.Query().Get("gameId")
	if gameID == "" {
		gameID = "default"
	}

	log.Printf("WebSocket接続: gameID=%s", gameID)

	// 新しいゲームを開始
	g, err := h.GameManager.NewGame(gameID)
	if err != nil {
		log.Printf("ゲーム開始に失敗: %v", err)
		h.sendError(conn, "ゲームの開始に失敗しました")
		return
	}

	// ゲーム開始を通知
	h.sendMessage(conn, ServerMessage{
		Type:   "game_started",
		GameID: gameID,
	})

	// メッセージループ
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket読み取りエラー: %v", err)
			}
			break
		}

		var clientMsg ClientMessage
		if err := json.Unmarshal(message, &clientMsg); err != nil {
			log.Printf("JSONパースエラー: %v", err)
			h.sendError(conn, "不正なメッセージ形式です")
			continue
		}

		log.Printf("受信: %+v", clientMsg)

		switch clientMsg.Type {
		case "move":
			h.handleMove(conn, g, clientMsg.Move)
		default:
			h.sendError(conn, "不明なメッセージタイプです")
		}
	}

	// 接続終了時にゲームをクリーンアップ
	h.GameManager.RemoveGame(gameID)
	log.Printf("WebSocket切断: gameID=%s", gameID)
}

// handleMove はプレイヤーの手を処理する
func (h *WebSocketHandler) handleMove(conn *websocket.Conn, g *game.Game, move string) {
	if move == "" {
		h.sendErrorWithType(conn, "手が指定されていません", "invalid_request")
		return
	}

	log.Printf("AIの手を取得中...")
	moveResult, err := g.PlayMove(move)
	if err != nil {
		log.Printf("PlayMoveエラー: %v", err)
		// エラータイプを判定
		errorType := "engine_error"
		if strings.Contains(err.Error(), "不正な手") {
			errorType = "illegal_move"
		}
		h.sendErrorWithType(conn, err.Error(), errorType)
		return
	}

	aiMove := moveResult.Move
	log.Printf("AI応答: %s (定石: %v)", aiMove, moveResult.IsBookMove)

	// プレイヤーの手で詰んだ場合（aiMoveが"checkmate"）
	if aiMove == "checkmate" {
		h.sendMessage(conn, ServerMessage{
			Type:   "game_over",
			Result: string(g.Result),
			Reason: g.Reason,
		})
		return
	}

	// AIが投了/千日手/入玉宣言の場合
	if aiMove == "resign" || aiMove == "rep_draw" || aiMove == "win" {
		h.sendMessage(conn, ServerMessage{
			Type:   "game_over",
			Result: string(g.Result),
			Reason: g.Reason,
		})
		return
	}

	// AIの手を送信
	log.Printf("AIの手を送信: %s (定石: %v)", aiMove, moveResult.IsBookMove)
	h.sendMessage(conn, ServerMessage{
		Type:       "ai_move",
		Move:       aiMove,
		IsBookMove: moveResult.IsBookMove,
	})

	// AIの手でゲーム終了した場合（AIの手でプレイヤーが詰んだ）
	if g.IsOver {
		h.sendMessage(conn, ServerMessage{
			Type:   "game_over",
			Result: string(g.Result),
			Reason: g.Reason,
		})
	}
}

// sendMessage はメッセージを送信する
func (h *WebSocketHandler) sendMessage(conn *websocket.Conn, msg ServerMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("JSONマーシャルエラー: %v", err)
		return
	}
	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Printf("WebSocket書き込みエラー: %v", err)
	}
}

// sendError はエラーメッセージを送信する
func (h *WebSocketHandler) sendError(conn *websocket.Conn, errorMsg string) {
	h.sendMessage(conn, ServerMessage{
		Type:  "error",
		Error: errorMsg,
	})
}

// sendErrorWithType はエラータイプ付きのエラーメッセージを送信する
func (h *WebSocketHandler) sendErrorWithType(conn *websocket.Conn, errorMsg, errorType string) {
	h.sendMessage(conn, ServerMessage{
		Type:      "error",
		Error:     errorMsg,
		ErrorType: errorType,
	})
}
