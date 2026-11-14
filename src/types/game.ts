// 遊戲核心型別（內部座標一律 0-based，UI 顯示時 +1）

export type PlayerId = 'red' | 'blue';
export type RpsChoice = 'rock' | 'paper' | 'scissors';
export type GamePhase = 'menu' | 'rules' | 'rps' | 'playing' | 'gameOver';
export type ActionMode = 'move' | 'wall';

export type Position = { row: number; col: number }; // 0..7

export type PlayerState = {
  position: Position;
  wallsRemaining: number;
};

export type WallOrientation = 'H' | 'V';

export type Wall = {
  id: string;
  owner: PlayerId;
  orientation: WallOrientation;
  anchorRow: number; // 0..6
  anchorCol: number; // 0..6
};

/** 只描述幾何位置的牆（預覽、驗證使用） */
export type WallGeom = Omit<Wall, 'id' | 'owner'>;

export type RpsStage = 'redPick' | 'passToBlue' | 'bluePick' | 'reveal';

export type RpsState = {
  round: number;
  stage: RpsStage;
  redChoice: RpsChoice | null;
  blueChoice: RpsChoice | null;
  secondsLeft: number;
  /** 是否因逾時由系統代選 */
  autoPicked: Record<PlayerId, boolean>;
};

export type NoticeTone = 'info' | 'error' | 'success';
export type Notice = { text: string; tone: NoticeTone } | null;

/** 供 UI 播放音效／動畫的事件（seq 每次遞增） */
export type GameEventType =
  | 'none'
  | 'move'
  | 'jump'
  | 'wall'
  | 'invalid'
  | 'rpsPick'
  | 'reveal'
  | 'win'
  | 'select';

export type GameState = {
  phase: GamePhase;
  currentPlayer: PlayerId | null;
  players: Record<PlayerId, PlayerState>;
  walls: Wall[];
  turnNumber: number;
  winner: PlayerId | null;
  selectedAction: ActionMode | null;
  pendingWall: WallGeom | null;
  rps: RpsState;
  notice: Notice;
  event: { type: GameEventType; seq: number };
};
