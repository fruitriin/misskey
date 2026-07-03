# Feedback — 問題・改善アクションの記録

## 未対応

### ADDF 上流コントリビューション候補 → 上流 Issue へ移管済み（2026-07-03）

- 候補4件（lint の addf-lock.json ベース判定修正、addf-knowhow-index の INDEX 選択修正、sync-lint-design への知見追記、PlanTemplate.md 新規追加）は**オーナーが ADDF 上流（fruitriin/ADDF）へ Issue として起票済み**。対応は上流側で行われるため、本リポジトリの計画19は削除された（詳細な再現記録が必要になったら `git show 0145a83ac5` で復元できる）
- **当面の運用**: `/addf-lint` のペア1・ペア3 ERROR は既知の誤検知として扱う（上流修正がマージされ `/addf-migrate` で追従したらこの項目ごと削除する）

（解消済み: 「ADDF ファイル群が使い捨てブランチ上にある」問題は、2026-07-03 のオーナー決定「upstream 追従の放棄」により消滅。mistems-main は長寿命ブランチとなり直接コミットが正規の運用になった）
