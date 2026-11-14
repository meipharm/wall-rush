import { BOARD_SIZE } from '../game/config';
import type { WallGeom } from '../types/game';

const PCT = 100 / BOARD_SIZE;
const THICK = 1.7; // 牆厚度（棋盤百分比）
const INSET = 0.5; // 牆兩端內縮

export type WallVariant = 'red' | 'blue' | 'preview-ok' | 'preview-bad' | 'pending-red' | 'pending-blue';

type Props = { geom: WallGeom; variant: WallVariant; fresh?: boolean };

export function Wall({ geom, variant, fresh }: Props) {
  const { orientation, anchorRow: r, anchorCol: c } = geom;
  const style =
    orientation === 'H'
      ? {
          left: `${c * PCT + INSET}%`,
          width: `${2 * PCT - 2 * INSET}%`,
          top: `${(r + 1) * PCT - THICK / 2}%`,
          height: `${THICK}%`,
        }
      : {
          top: `${r * PCT + INSET}%`,
          height: `${2 * PCT - 2 * INSET}%`,
          left: `${(c + 1) * PCT - THICK / 2}%`,
          width: `${THICK}%`,
        };
  return <div className={`wall wall-${variant} ${fresh ? 'wall-fresh' : ''}`} style={style} aria-hidden="true" />;
}
