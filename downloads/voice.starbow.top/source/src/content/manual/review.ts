import type { ManualBlock } from '../manualDocument'

// 原文正文按章加载，图像在页面中统一渲染。
const blocks: ManualBlock[] = [
  {
    "kind": "html",
    "html": "<p>当你完成了以上各项训练后，可以用以下标准检验你的综合水平：</p>\n<div class=\"table-wrap\"><table><thead><tr><th>维度</th><th>达标标准</th><th>检测方法</th></tr></thead><tbody><tr><td>F0（音高）</td><td>稳定 ≥ 180Hz</td><td>Praat 蓝线</td></tr><tr><td>F2（明亮度）</td><td>比自然状态提升 ≥ 200Hz</td><td>Praat 红点对比</td></tr><tr><td>F1（通透度）</td><td>/a/ 音 F1 ≥ 850Hz</td><td>Praat formant 读数</td></tr><tr><td>喉部健康</td><td>连续说话 5 分钟无不适</td><td>自我感受</td></tr><tr><td>自然度</td><td>能在对话中维持而不&quot;掉回去&quot;</td><td>录音回听</td></tr><tr><td>声调起伏</td><td>语句中有自然的音高变化</td><td>录音回听</td></tr></tbody></table></div>\n<p><strong>最终目标不是每个数值都完美，而是在连续自然的语句中，能够同时维持高 F0 + 高 F2 + 适当 F1 + 自然的声调起伏，并且喉部没有不适感。</strong> 这需要时间，需要耐心，更需要你像玩耍一样去探索和享受这个过程。</p>\n<hr>"
  }
]

export default blocks
