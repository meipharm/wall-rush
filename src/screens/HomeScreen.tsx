type Props = {
  onStart: () => void;
  onRules: () => void;
};

export function HomeScreen({ onStart, onRules }: Props) {
  return (
    <main className="home">
      <div className="home-hero">
        <div className="home-art" aria-hidden="true">
          <span className="home-ball home-ball-blue" />
          <span className="home-wall home-wall-1" />
          <span className="home-wall home-wall-2" />
          <span className="home-ball home-ball-red" />
        </div>
        <p className="home-kicker">雙人回合制策略棋盤</p>
        <h1 className="home-title">
          Wall Rush
          <span>突破防線</span>
        </h1>
        <p className="home-desc">
          搶先把你的球送到對方底線，同時用有限的牆擋住對手。
          <br />
          同一台裝置，紅藍輪流操作。
        </p>
        <div className="home-actions">
          <button type="button" className="btn btn-primary btn-large" onClick={onStart}>
            開始遊戲
          </button>
          <button type="button" className="btn btn-ghost btn-large" onClick={onRules}>
            規則說明
          </button>
        </div>
      </div>
    </main>
  );
}
