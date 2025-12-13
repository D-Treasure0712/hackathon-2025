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
	cmd     *exec.Cmd      // 外部コマンド（AIエンジン）を実行するための司令塔です。
	stdin   io.WriteCloser // AIへの「入力パイプ」。こちらからAIに命令を書き込む場所です。
	stdout  *bufio.Scanner // AIからの「出力」を受け取るスキャナー。AIの返事を1行ずつ読み取ります。
	mu      sync.Mutex     // 排他制御。複数の命令が同時に走って混乱しないようにロックをかけます。
	bookDir string         // 定石（じょうせき）ファイルが置いてある場所のパスです。
}

// NewUSIEngine は新しいUSIエンジンインスタンスを作成する
// enginePath: YaneuraOu-by-gcc-macへのパス
// evalDir: 評価関数（nn.bin）があるディレクトリへのパス
func NewUSIEngine(enginePath, evalDir string) (*USIEngine, error) {
	// 絶対パスに変換（AI/YaneuraOu-by-gcc-mac）
	absEnginePath, err := filepath.Abs(enginePath)
	if err != nil {
		return nil, fmt.Errorf("エンジンパスの解決に失敗: %w", err)
	}

	// 絶対パスに変換（AI/eval）
	absEvalDir, err := filepath.Abs(evalDir)
	if err != nil {
		return nil, fmt.Errorf("評価関数ディレクトリパスの解決に失敗: %w", err)
	}

	// 定石ファイルのディレクトリ（evalDirの親ディレクトリにbookがある想定）
	bookDir := filepath.Join(filepath.Dir(absEvalDir), "book")

	// exec.Commandで、指定されたパスにある将棋エンジンを実行する準備をします。
	cmd := exec.Command(absEnginePath)
	// AIが評価関数ファイル（nn.binなど）を読み込めるよう、作業ディレクトリを設定します。
	cmd.Dir = absEvalDir
	// 環境変数としてもディレクトリを教えてあげます（エンジンによっては必要）。
	cmd.Env = append(os.Environ(), fmt.Sprintf("EVAL_DIR=%s", absEvalDir))

	// AIへの入力用パイプ（stdin）を作成します。これがないと命令を送れません。
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("stdinパイプの作成に失敗: %w", err)
	}

	// AIからの出力用パイプ（stdout）を作成します。これがないと返事が聞けません。
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("stdoutパイプの作成に失敗: %w", err)
	}

	// ここで実際にエンジンを起動（スタート）します！
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("エンジンの起動に失敗: %w", err)
	}

	engine := &USIEngine{
		cmd:     cmd,
		stdin:   stdin,
		stdout:  bufio.NewScanner(stdout),
		bookDir: bookDir,
	}

	// 準備できた部品を構造体にまとめて返します。
	return engine, nil
}

// SendCommand はエンジンにコマンドを送信する
func (e *USIEngine) SendCommand(command string) error {
	// 排他制御: 同時に複数のコマンドが送られないようにする
	e.mu.Lock()
	defer e.mu.Unlock() // 関数終了時にロックを解放

	// 与えられた引数を文字列化して、末尾に改行を入れてエンジンに送信します。
	// e.stdinにcommandを書き込む
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
// usi -> usiok, setoption (BookFile, BookMoves), isready -> readyok, usinewgame
func (e *USIEngine) Initialize() error {
	// USIモード開始
	fmt.Println("[USI Init] usi コマンド送信")
	if err := e.SendCommand("usi"); err != nil {
		return err
	}

	// usiokまでのすべての出力をログに表示
	fmt.Println("[USI Init] usiok 待ち...")
	for {
		line, err := e.ReadLine()
		if err != nil {
			return fmt.Errorf("usi初期化中のエラー: %w", err)
		}
		fmt.Printf("[USI Init] %s\n", line)
		if strings.HasPrefix(line, "usiok") {
			break
		}
	}

	// 定石ファイルの設定
	// YaneuraOuのBookFileはcombo型なので、ファイル名のみを指定する（パスは不要）
	bookFileName := "user_book1.db"
	bookFilePath := filepath.Join(e.bookDir, bookFileName)
	fmt.Printf("[USI Init] 定石ファイルパス: %s\n", bookFilePath)
	if _, err := os.Stat(bookFilePath); err == nil {
		// 定石ファイルが存在する場合のみ設定
		// 注: BookFileはcombo型なので、ファイル名のみを指定
		cmd1 := fmt.Sprintf("setoption name BookFile value %s", bookFileName)
		fmt.Printf("[USI Init] コマンド送信: %s\n", cmd1)
		if err := e.SendCommand(cmd1); err != nil {
			return fmt.Errorf("BookFile設定に失敗: %w", err)
		}

		// 定石の手数を200手まで使用
		cmd2 := "setoption name BookMoves value 200"
		fmt.Printf("[USI Init] コマンド送信: %s\n", cmd2)
		if err := e.SendCommand(cmd2); err != nil {
			return fmt.Errorf("BookMoves設定に失敗: %w", err)
		}
		fmt.Printf("[USI Init] ✓ 定石ファイル設定完了\n")
	} else {
		fmt.Printf("[USI Init] ✗ 定石ファイルが見つかりません: %s\n", bookFilePath)
	}

	// 準備完了を要求
	fmt.Println("[USI Init] isready コマンド送信")
	if err := e.SendCommand("isready"); err != nil {
		return err
	}

	// readyokまでのすべての出力をログに表示
	fmt.Println("[USI Init] readyok 待ち...")
	for {
		line, err := e.ReadLine()
		if err != nil {
			return fmt.Errorf("isready応答待ち中のエラー: %w", err)
		}
		fmt.Printf("[USI Init] %s\n", line)
		if strings.HasPrefix(line, "readyok") {
			break
		}
	}

	// 新しい対局を開始
	fmt.Println("[USI Init] usinewgame コマンド送信")
	if err := e.SendCommand("usinewgame"); err != nil {
		return err
	}

	fmt.Println("[USI Init] ✓ 初期化完了")
	return nil
}

// MoveResult はAIの応答結果
type MoveResult struct {
	Move       string // 最善手
	IsBookMove bool   // 定石からの手かどうか
}

// GetBestMove は指定局面でAIの最善手を取得する
// position: "position startpos moves 7g7f 3c3d ..." 形式の局面文字列
// btime: 先手の残り時間（ミリ秒）
// wtime: 後手の残り時間（ミリ秒）
func (e *USIEngine) GetBestMove(position string, btime, wtime int) (MoveResult, error) {
	result := MoveResult{}

	// 局面を設定
	if err := e.SendCommand(position); err != nil {
		return result, err
	}

	// 思考開始
	goCmd := fmt.Sprintf("go btime %d wtime %d", btime, wtime)
	if err := e.SendCommand(goCmd); err != nil {
		return result, err
	}

	// bestmove待ち（info stringを監視しながら）
	isBookMove := false
	timeout := time.After(120 * time.Second)

	for {
		select {
		case <-timeout:
			return result, fmt.Errorf("タイムアウト: bestmoveの応答待ち")
		default:
			line, err := e.ReadLine()
			if err != nil {
				return result, err
			}

			// デバッグ: すべてのエンジン出力をログに表示
			fmt.Printf("[USI] %s\n", line)

			// 定石からの手かどうかをチェック
			// YaneuraOuは定石を使う場合、パーセンテージ (XX.XX%) を出力する
			// 例: "info depth 32 multipv 1 score cp 0 ... pv 7g7f 4a3b (58.13%)"
			if strings.Contains(line, "info") && strings.Contains(line, "%)") {
				isBookMove = true
				fmt.Printf("★★★ 定石ヒット! ★★★\n")
			}

			// bestmoveを受信したら終了
			if strings.HasPrefix(line, "bestmove") {
				parts := strings.Fields(line)
				if len(parts) < 2 {
					return result, fmt.Errorf("不正なbestmove応答: %s", line)
				}
				result.Move = parts[1]
				result.IsBookMove = isBookMove
				return result, nil
			}
		}
	}
}

// Close はエンジンを終了する
func (e *USIEngine) Close() error {
	if err := e.SendCommand("quit"); err != nil {
		// quitコマンドが失敗しても、プロセスは終了させる
	}
	e.stdin.Close()
	return e.cmd.Wait()
}
