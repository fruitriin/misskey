# Feedback — 問題・改善アクションの記録

## 未対応

### ADDF 上流コントリビューション候補 → 計画化済み（2026-07-03）

- 計画01・02 で確定した候補4件（lint の addf-lock.json ベース判定修正、addf-knowhow-index の INDEX 選択修正、sync-lint-design への知見追記、PlanTemplate.md 新規追加）は **`docs/plans/19-ADDF上流コントリビューション.md` に移管**した。詳細・再現記録・PR 分割案はそちらを正とする
- **当面の運用**: `/addf-lint` のペア1・ペア3 ERROR は既知の誤検知として扱う（上流修正がマージされ `/addf-migrate` で追従したらこの項目ごと削除する）

（解消済み: 「ADDF ファイル群が使い捨てブランチ上にある」問題は、2026-07-03 のオーナー決定「upstream 追従の放棄」により消滅。mistems-main は長寿命ブランチとなり直接コミットが正規の運用になった）
