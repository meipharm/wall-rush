# Wall Rush 專案工作規則

## 規格來源

- 唯一規格：`Wall_Rush_V1.2_Claude_Code_開發說明書.md`（V1.2 取代舊版 7×7、單格牆、禁止跳躍）。
- 說明書 2.1 節為使用者已確認規則，不得自行更改；2.2 節為技術預設，變更時只改 `src/game/config.ts` 或對應規則與測試，並更新 README 的「技術預設與待確認事項」。

## 架構約定

- 規則一律寫在 `src/game/` 純函式，UI 不自行判斷規則。
- 所有移動、跳躍、BFS 只能透過 `edges.ts` 的 `isEdgeBlocked` 判斷格邊阻隔。
- 放牆合法性只用 `wallRules.ts` 的 `validateWallPlacement`；BFS 不把對手球當障礙。
- 狀態變更只經 `gameRules.ts` 的 reducer；action 帶 `player`，非當前玩家的操作直接忽略（防重複點擊）。
- 內部座標 0-based，UI 顯示 1-based。

## 驗證

- 修改規則後必跑 `npm run test` 與 `npm run build`，並補對應測試。
- UI 修改需在瀏覽器實際操作（桌面與手機寬度）確認。

## 範圍

- MVP 不加 AI、帳號、伺服器、排行榜、連線對戰；需使用者確認後才擴充。
