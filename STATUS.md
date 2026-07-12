# STATUS — ZYCC Recruit LP (PJ-003)

このファイルはZYCC LPリポジトリの「今」を表す。詳細な経緯・設計判断はObsidian Vault側 `01_Projects/AI-DOS/ProjectState.md` 7章（要約）および `DecisionLog.md`（判断理由）を参照。**タスク終了時に必ず更新すること。**

最終更新: 2026-07-12
更新者: Claude Code

## 進捗

| 内容 | 状態 |
|---|---|
| Basic-Auth認証情報をNetlify環境変数化（`_headers` / `netlify/edge-functions/basic-auth.js`） | main反映済み（`ae5b726`）。本番HTTP 401で正常動作確認済み |
| works-cache生成スクリプトのスキーマバージョン不整合を修正（`update-works-cache.mjs` の `SCHEMA_VERSION` 4→5） | main反映済み（`066fe26`） |
| 画像8点（hero/studio1/studio2/process1-3/member1-2）にalt属性を追加（`index.html`） | ローカル変更のみ、**未commit・承認待ち** |

## 次タスク

1. alt属性追加の承認 → commit・push
2. Worksキャッシュの手動再生成（`assets/cache/works.json` が2026-07-09から更新なし）
3. Netlifyダッシュボードでの自動Deploy最終確認（`DeployVerification.md` のNO-GO判定を解消）
4. `verify/netlify-deploy-check` ブランチの後始末（merge or 削除）
5. Desktop上の重複フォルダ（`zycc_creative_archive_board_v1_1 2`〜`11`、`zycc_recruit_site`）の整理方針決定

## 承認待ち（人間の判断が必要）

| 項目 | 内容 |
|---|---|
| alt属性追加のcommit・push可否 | `index.html` 4行変更、内容確認済み |
| Basic-Auth解除（一般公開）のタイミング | 解除するまでSEO/OGP等は判断保留のまま |
| Worksキャッシュ自動更新の導入要否 | GitHub Actions等での定期実行を検討するか |
