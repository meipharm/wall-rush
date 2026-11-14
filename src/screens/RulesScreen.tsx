import { BOARD_SIZE, INITIAL_WALLS, RPS_TIME_LIMIT_SECONDS } from '../game/config';

type Props = {
  onStart: () => void;
  onHome: () => void;
};

export function RulesScreen({ onStart, onHome }: Props) {
  return (
    <main className="rules">
      <h1>快速規則</h1>
      <ol className="rules-list">
        <li>
          <strong>棋盤 {BOARD_SIZE}×{BOARD_SIZE}</strong>：紅隊從第 8 列出發、目標第 1 列；藍隊從第 1 列出發、目標第 8 列。
          先抵達對方底線任一格者獲勝。
        </li>
        <li>
          <strong>每回合二擇一</strong>：移動球一次，或放一道牆。
        </li>
        <li>
          <strong>移動</strong>：上下左右走一格，不可斜走、出界、穿牆，也不能與對手同格。
        </li>
        <li>
          <strong>直線跳躍</strong>：對手就在相鄰格時，可沿同方向跳到他正後方一格；中間兩段格線都不能有牆。
          正後方被牆或邊界擋住時<strong>不能側跳</strong>。
        </li>
        <li>
          <strong>牆</strong>：每人 {INITIAL_WALLS} 道，每道牆長兩格、放在格線上，水平或垂直皆可；
          不可重疊、不可在中點交叉，也<strong>不能把任何一方完全封死</strong>。
        </li>
        <li>
          <strong>猜拳決定先手</strong>：紅隊先密選、再把畫面交給藍隊密選，每人 {RPS_TIME_LIMIT_SECONDS} 秒；
          逾時由系統隨機代選；兩人都選好才同時揭曉，平手重猜。
        </li>
      </ol>
      <div className="rules-actions">
        <button type="button" className="btn btn-primary btn-large" onClick={onStart}>
          開始猜拳
        </button>
        <button type="button" className="btn btn-ghost btn-large" onClick={onHome}>
          返回首頁
        </button>
      </div>
    </main>
  );
}
