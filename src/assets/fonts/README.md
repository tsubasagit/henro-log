# 同梱フォント

## yuji-board-subset.woff2

すごろく盤（`/board`）の御朱印風スタンプ・札所番号用の毛筆体。

- 元フォント: **Yuji Syuku**（祐字 肅） / Google Fonts, SIL Open Font License 1.1
- ライセンス全文: [OFL.txt](./OFL.txt)
- サブセット字形: `0123456789済巡拝`（盤で描画する文字のみに限定。約5KB）
- 生成コマンド:
  ```
  pyftsubset YujiSyuku-Regular.ttf --text="0123456789済巡拝" \
    --flavor=woff2 --output-file=yuji-board-subset.woff2 --no-hinting --desubroutinize
  ```
- 字形を追加する場合は `--text` に文字を足して再生成する。
