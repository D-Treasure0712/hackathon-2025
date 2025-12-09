package engine

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// USIEngine はUSIプロトコルを使用する将棋エンジンを管理する構造体
type USIEngine struct {
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	stdout *bufio.Scanner
	mu     sync.Mutex
}

// NewUSIEngine は新しいUSIエンジンインスタンスを作成する
// enginePath: YaneuraOu-by-gcc-macへのパス
// evalDir: 評価関数（nn.bin）があるディレクトリへのパス
func NewUSIEngine(enginePath, evalDir string) (*USIEngine, error) {
	// 絶対パスに変換
	absEnginePath, err := filepath.Abs(enginePath)
	if err != nil {
		return nil, fmt.Errorf("エンジンパスの解決に失敗: %w", err)
	}

	absEvalDir, err := filepath.Abs(evalDir)
	if err != nil {
		return nil, fmt.Errorf("評価関数ディレクトリパスの解決に失敗: %w", err)
	}

	// エンジンの作業ディレクトリを評価関数のあるディレクトリに設定
	cmd := exec.Command(absEnginePath)
	cmd.Dir = absEvalDir
	cmd.Env = append(os.Environ(), fmt.Sprintf("EVAL_DIR=%s", absEvalDir))

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("stdinパイプの作成に失敗: %w", err)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("stdoutパイプの作成に失敗: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("エンジンの起動に失敗: %w", err)
	}

	engine := &USIEngine{
		cmd:    cmd,
		stdin:  stdin,
		stdout: bufio.NewScanner(stdout),
	}

	return engine, nil
}

// SendCommand はエンジンにコマンドを送信する
func (e *USIEngine) SendCommand(command string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	_, err := fmt.Fprintln(e.stdin, command)
	if err != nil {
		return fmt.Errorf("コマンド送信に失敗: %w", err)
	}
	return nil
}

// ReadLine はエンジンから1行読み取る
func (e *USIEngine) ReadLine() (string, error) {
	if e.stdout.Scan() {
		return e.stdout.Text(), nil
	}
	if err := e.stdout.Err(); err != nil {
		return "", err
	}
	return "", io.EOF
}

// WaitForResponse は指定したプレフィックスで始まる応答を待つ
func (e *USIEngine) WaitForResponse(prefix string, timeout time.Duration) (string, error) {
	done := make(chan struct {
		line string
		err  error
	}, 1)

	go func() {
		for {
			line, err := e.ReadLine()
			if err != nil {
				done <- struct {
					line string
					err  error
				}{"", err}
				return
			}
			if strings.HasPrefix(line, prefix) {
				done <- struct {
					line string
					err  error
				}{line, nil}
				return
			}
		}
	}()

	select {
	case result := <-done:
		return result.line, result.err
	case <-time.After(timeout):
		return "", fmt.Errorf("タイムアウト: %s の応答待ち", prefix)
	}
}

// Initialize はUSIプロトコルの初期化シーケンスを実行する
// usi -> usiok, usinewgame, isready -> readyok
func (e *USIEngine) Initialize() error {
	// USIモード開始
	if err := e.SendCommand("usi"); err != nil {
		return err
	}

	// usiok待ち
	if _, err := e.WaitForResponse("usiok", 10*time.Second); err != nil {
		return fmt.Errorf("usi初期化に失敗: %w", err)
	}

	// 新しい対局を開始
	if err := e.SendCommand("usinewgame"); err != nil {
		return err
	}

	// 準備完了を要求
	if err := e.SendCommand("isready"); err != nil {
		return err
	}

	// readyok待ち
	if _, err := e.WaitForResponse("readyok", 30*time.Second); err != nil {
		return fmt.Errorf("isready応答待ちに失敗: %w", err)
	}

	return nil
}

// GetBestMove は指定局面でAIの最善手を取得する
// position: "position startpos moves 7g7f 3c3d ..." 形式の局面文字列
// btime: 先手の残り時間（ミリ秒）
// wtime: 後手の残り時間（ミリ秒）
func (e *USIEngine) GetBestMove(position string, btime, wtime int) (string, error) {
	// 局面を設定
	if err := e.SendCommand(position); err != nil {
		return "", err
	}

	// 思考開始
	goCmd := fmt.Sprintf("go btime %d wtime %d", btime, wtime)
	if err := e.SendCommand(goCmd); err != nil {
		return "", err
	}

	// bestmove待ち（最大120秒）
	response, err := e.WaitForResponse("bestmove", 120*time.Second)
	if err != nil {
		return "", err
	}

	// "bestmove 7g7f ponder 3c3d" の形式からbestmoveを抽出
	parts := strings.Fields(response)
	if len(parts) < 2 {
		return "", fmt.Errorf("不正なbestmove応答: %s", response)
	}

	return parts[1], nil
}

// Close はエンジンを終了する
func (e *USIEngine) Close() error {
	if err := e.SendCommand("quit"); err != nil {
		// quitコマンドが失敗しても、プロセスは終了させる
	}
	e.stdin.Close()
	return e.cmd.Wait()
}
