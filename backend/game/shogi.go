package game

import (
	"fmt"
	"strings"

	"github.com/mururu/gshogi"
)

// ShogiBoard はgshogiを使って将棋の盤面を管理する構造体
type ShogiBoard struct {
	board *gshogi.Board
}

// NewShogiBoard は新しい盤面を作成する（平手初期配置）
func NewShogiBoard() *ShogiBoard {
	return &ShogiBoard{
		board: gshogi.NewBoard(),
	}
}

// ApplyMove はUSI形式の手を盤面に適用する
// move: "7g7f" や "P*5e" のようなUSI形式
func (sb *ShogiBoard) ApplyMove(move string) error {
	m := gshogi.NewMoveFromUSI(move)
	if m == nil {
		return fmt.Errorf("不正な手の形式: %s", move)
	}

	// 合法手かチェック
	if !sb.IsLegalMove(move) {
		return fmt.Errorf("不正な手: %s", move)
	}

	sb.board.Push(m)
	return nil
}

// ApplyMoves は複数の手を順番に適用する
func (sb *ShogiBoard) ApplyMoves(moves []string) error {
	for _, move := range moves {
		if err := sb.ApplyMove(move); err != nil {
			return err
		}
	}
	return nil
}

// IsLegalMove は指定した手が合法かどうかを判定する
func (sb *ShogiBoard) IsLegalMove(move string) bool {
	// gshogiライブラリのパニックをキャッチ
	defer func() {
		if r := recover(); r != nil {
			// パニックが発生した場合は不正な手として扱う
		}
	}()

	m := gshogi.NewMoveFromUSI(move)
	if m == nil {
		return false
	}

	// 合法手リストに含まれているかチェック
	legalMoves := sb.board.LegalMoves()
	for _, lm := range legalMoves {
		if lm.USI() == move {
			return true
		}
	}
	return false
}

// GetPosition は現在の局面をUSI形式で返す（未実装）
func (sb *ShogiBoard) GetPosition() string {
	return ""
}

// IsCheck は現在の手番が王手されているかを判定する
func (sb *ShogiBoard) IsCheck() bool {
	// gshogiライブラリのパニックをキャッチ
	defer func() {
		if r := recover(); r != nil {
			// パニックが発生した場合はfalseを返す
		}
	}()

	// 相手の駒が自分の玉を攻撃しているかチェック
	turn := sb.board.Turn
	opponentColor := gshogi.BLACK
	if turn == gshogi.BLACK {
		opponentColor = gshogi.WHITE
	}
	kingSquare := sb.board.KingAt(turn)
	// 玉が見つからない場合（無効なSquare）
	if int(kingSquare) >= 81 || int(kingSquare) < 0 {
		return false
	}
	return sb.board.IsAttackedBy(opponentColor, kingSquare)
}

// IsCheckmate は現在の手番が詰んでいるかを判定する
func (sb *ShogiBoard) IsCheckmate() bool {
	// gshogiライブラリのパニックをキャッチ
	defer func() {
		if r := recover(); r != nil {
			// パニックが発生した場合は詰みではないとして扱う
		}
	}()

	// 合法手が0で、かつ王手されている場合は詰み
	legalMoves := sb.board.LegalMoves()
	if len(legalMoves) == 0 && sb.IsCheck() {
		return true
	}
	return false
}

// GetLegalMoves は合法手のリストを返す
func (sb *ShogiBoard) GetLegalMoves() []string {
	moves := sb.board.LegalMoves()
	result := make([]string, len(moves))
	for i, m := range moves {
		result[i] = m.USI()
	}
	return result
}

// Turn は現在の手番を返す（true: 先手, false: 後手）
func (sb *ShogiBoard) Turn() bool {
	return sb.board.Turn == gshogi.BLACK
}

// Copy は盤面のコピーを作成する（未実装）
func (sb *ShogiBoard) Copy() *ShogiBoard {
	return NewShogiBoard()
}

// ParsePositionCommand はUSIのpositionコマンドをパースする
// "position startpos moves 7g7f 3c3d ..." -> []string{"7g7f", "3c3d", ...}
func ParsePositionCommand(cmd string) ([]string, error) {
	parts := strings.Fields(cmd)
	if len(parts) < 2 {
		return nil, fmt.Errorf("不正なpositionコマンド: %s", cmd)
	}

	if parts[0] != "position" {
		return nil, fmt.Errorf("positionで始まっていません: %s", cmd)
	}

	// "position startpos" の場合
	if parts[1] == "startpos" {
		if len(parts) < 3 {
			return []string{}, nil
		}
		if parts[2] != "moves" {
			return nil, fmt.Errorf("movesキーワードが見つかりません")
		}
		return parts[3:], nil
	}

	// "position sfen ..." の場合は未対応
	return nil, fmt.Errorf("sfenはまだサポートされていません")
}
