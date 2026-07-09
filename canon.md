# ZYCC Creative Archive Canon v1.3

## Fixed logo rule
- ZYCC表記は画像ロゴのみ使用し、フォント組みは禁止。
- 黒背景は白ロゴ、明背景は黒ロゴ、中間輝度や写真背景は灰色または白ロゴを使用する。
- ロゴに過剰なモーションは付与しない。

## Suspended motion
- イントロロゴモーションは最適解が見つかるまで保留。

## Shared brand motion
- HEROおよび各セクションのメインコピーは、画像表示後に遅れてじわっと出現する。
- Motion: opacity + blur + 8〜12px translateY、約1.2秒、cubic-bezier(.22,1,.36,1)。
- 同一モーションを全セクションで反復し、セクション変化のサインにする。

## Scroll rule
- 基本はセクションスナップ。
- 主役画像が画面途中で切れる構成は避ける。


## v1.4 Fix
- Reveal motion slowed: delay 1.35s / transition 2.85–3.1s / later intersection threshold.
- Join Japanese headline line-height increased to 1.22 and font-size reduced for readability.
