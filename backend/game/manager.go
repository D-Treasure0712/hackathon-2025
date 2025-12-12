package game

import (
	"fmt"
	"strings"
	"sync"

	"my-backend-app/engine"
)

// GameResult はゲーム結果を表す型
type GameResult string

const (
	ResultNone      GameResult = ""
	ResultPlayerWin GameResult = "player_win"
	ResultAIWin     GameResult = "ai_win"
	ResultDraw      GameResult = "draw"
)

// Game は1つの対局を管理する構造体
type Game struct {
	ID     string
	Moves  []string // USI形式の手履歴
	Engine *engine.USIEngine
	Board  *ShogiBoard // gshogiによる盤面管理
	IsOver bool // 対局終了フラグ
	Result GameResult
	Reason string // 終了理由: "resign", "checkmate", "rep_draw", "win"
	BTime  int    // 先手残り時間（ミリ秒）
	WTime  int    // 後手残り時間（ミリ秒）
	mu     sync.Mutex
}

// GameManager は複数の対局を管理する構造体
type GameManager struct {
	games      map[string]*Game
	enginePath string
	evalDir    string
	mu         sync.RWMutex
}

// NewGameManager は新しいGameManagerを作成する
func NewGameManager(enginePath, evalDir string) *GameManager {
	return &GameManager{
		games:      make(map[string]*Game),
		enginePath: enginePath,
		evalDir:    evalDir,
	}
}

// NewGame は新しい対局を開始する
func (gm *GameManager) NewGame(gameID string) (*Game, error) {
	gm.mu.Lock() // 排他制御
	defer gm.mu.Unlock() // 関数終了時にロックを解放

	// 既存のゲームがあれば終了
	if existingGame, exists := gm.games[gameID]; exists {
		existingGame.Close()
		delete(gm.games, gameID)
	}

	// 新しいUSIエンジンインスタンスを作成する
	eng, err := engine.NewUSIEngine(gm.enginePath, gm.evalDir)
	if err != nil {
		return nil, fmt.Errorf("エンジン起動に失敗: %w", err)
	}

	// エンジン初期化
	if err := eng.Initialize(); err != nil {
		eng.Close()
		return nil, fmt.Errorf("エンジン初期化に失敗: %w", err)
	}

	game := &Game{
		ID:     gameID,
		Moves:  []string{},
		Engine: eng,
		Board:  NewShogiBoard(), // gshogi.NewBoard()で初期化したやつが入る
		IsOver: false,
		Result: ResultNone,
		BTime:  60000, // デフォルト60秒
		WTime:  60000, // デフォルト60秒
	}

	// gm.games は map[string]*Game（ゲームID → Gameへのポインタ）
	// gm.games[gameID] は「そのIDの場所（箱）」を指す
	// = game で、その箱に game（対局） を入れる
	gm.games[gameID] = game
	return game, nil
}

// GetGame は指定IDの対局を取得する
func (gm *GameManager) GetGame(gameID string) (*Game, bool) {
	gm.mu.RLock()
	defer gm.mu.RUnlock()
	game, exists := gm.games[gameID]
	return game, exists
}

// RemoveGame は対局を削除する
func (gm *GameManager) RemoveGame(gameID string) {
	gm.mu.Lock()
	defer gm.mu.Unlock()
	if game, exists := gm.games[gameID]; exists {
		game.Close()
		delete(gm.games, gameID)
	}
}

// GetPosition は現在の局面をUSI形式で返す
func (g *Game) GetPosition() string {
	if len(g.Moves) == 0 {
		return "position startpos"
	}
	return fmt.Sprintf("position startpos moves %s", strings.Join(g.Moves, " "))
}

// MoveResponse はプレイヤーの手に対するAIの応答
type MoveResponse struct {
	Move       string // AIの手
	IsBookMove bool   // 定石からの手かどうか
}

// PlayMove はプレイヤーの手を受け取り、AIの応手を返す
func (g *Game) PlayMove(playerMove string) (MoveResponse, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	result := MoveResponse{}

	if g.IsOver {
		return result, fmt.Errorf("対局は既に終了しています")
	}

	// プレイヤーの手を履歴に追加
	// 注: gshogiはパニックを起こす可能性があるため、USIエンジンに検証を任せる
	g.Moves = append(g.Moves, playerMove)

	// AIの手を取得（AIが不正な手を検知した場合はエラーを返す）
	position := g.GetPosition()
	engineResult, err := g.Engine.GetBestMove(position, g.BTime, g.WTime)
	if err != nil {
		// プレイヤーの手が不正だった場合、履歴から削除
		g.Moves = g.Moves[:len(g.Moves)-1]
		return result, fmt.Errorf("不正な手です: %s", playerMove)
	}

	aiMove := engineResult.Move
	result.Move = aiMove
	result.IsBookMove = engineResult.IsBookMove

	// 特殊応答をチェック
	switch aiMove {
	case "resign":
		g.IsOver = true
		g.Result = ResultPlayerWin
		g.Reason = "resign"
		return result, nil
	case "rep_draw":
		g.IsOver = true
		g.Result = ResultDraw
		g.Reason = "rep_draw"
		return result, nil
	case "win":
		g.IsOver = true
		g.Result = ResultAIWin
		g.Reason = "win"
		return result, nil
	}

	// AIの手を履歴に追加
	g.Moves = append(g.Moves, aiMove)

	return result, nil
}

// Close は対局を終了しリソースを解放する
func (g *Game) Close() {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.Engine != nil {
		g.Engine.Close()
		g.Engine = nil
	}
}
