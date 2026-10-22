# 声音练习室

录音或导入音频，查看音高与共振峰，辅助声音训练。

[开始练习](https://emmm1e3m.github.io/voice_tuning/)

## 主要功能

| 页面 | 可以做什么 |
| --- | --- |
| 声音分析 | 实时录音或导入音频，在同一时间轴观察 F0、F1、F2、窗口中位数、目标带与声区估计；支持回放和下载 WAV。 |
| 音高参考 | 点击钢琴听参考音，对照音名曲线练习；手机琴键可左右滑动，聚焦琴键后可用 Enter / 空格播放。 |
| 统计分析 | 独立录制或导入最长 60 秒的片段，支持暂停与继续；提供中英朗读材料、整段回放、F0 中位数、P10/P90 和音高分布。 |
| 交互演示 | 调节声带、喉位、舌前后、舌高、圆唇和下颌，联动查看声道剖面、元音空间、F0/F1/F2 与频谱，也可拖动元音探索点。 |
| 教学文档 | 按原手册七章阅读原理、练习与参考文献，包含 15 个代码重绘图和 11 个真实 Praat 截图；支持分享章节与小节地址。 |

目标设置提供 a、o、e、i、u、ü 六个元音。「随F0推荐」联动更新共振峰，也可手动调整；目标半宽固定为 F0 ±40、F1 ±100、F2 ±150 Hz。「配置 → 声区校准」可录音采集个人换声边界，用于辅助观察声区过渡。

统计报告纳入 60–500 Hz 的有效 F0，按 10 Hz 分组；P10–P90 表示常用范围，并非最低和最高音。有效发声不足 3 秒时不显示频率指标，3–10 秒会提示样本较短。交互模型用于演示变化方向；目标带与声区估计是练习参考。

## 界面预览

以下为本地生产构建的实际界面。声音分析、音高参考与统计报告使用仓库自带的 `assets/aoe.wav` 示例音频，数值仅展示该片段的分析结果。

### 声音分析

![声音分析：频率曲线、目标设置与窗口读数](docs/analysis-preview.jpg)

### 音高参考

![音高参考：音名曲线与钢琴参考音](docs/practice-preview.jpg)

### 统计分析

![统计报告：F0中位数、常用范围与音高分布](docs/statistics-report-preview.png)

### 交互演示

![交互演示：发声结构、六部位调节、元音空间与频谱](docs/interactive-preview.jpg)

### 教学文档

![教学文档：章节目录、原作者署名与修订说明](docs/manual-preview.jpg)

### 配置与手机布局

![配置：分析参数、音频保留与个人声区校准](docs/config-preview.jpg)

<img src="docs/mobile-preview.jpg" alt="手机声音分析界面" width="320" />
<img src="docs/manual-mobile-preview.jpg" alt="手机教学文档界面" width="320" />

## 音频与数据保存

- 音频在浏览器内处理。声音分析和音高参考共用音频，默认保留最近 10 秒，可设为 5–120 秒；导入上限随之变化，下载 WAV 保存的是当前保留窗口。缩短窗口会舍弃较早片段。
- 统计分析独立保留最长 60 秒的完整片段。切页会暂停统计录音并保留草稿及最近报告，返回可继续；刷新或关闭应用后清除。需要留存主分析音频时请先下载。
- 配置、目标、显示偏好和声区校准保存在当前浏览器中；清除网站数据会重置这些设置。
- 当前 GitHub Pages 构建默认关闭使用统计。自行部署可配置 Umami / Vercel 页面与功能统计，详见[采集范围与配置说明](downloads/voice.starbow.top/source/docs/analytics.md)。

## 本地运行

安装 Node.js 后，双击「启动练习器.cmd」；首次启动会自动安装依赖并打开浏览器。

也可在仓库根目录使用终端启动（推荐 Node.js 22，与 CI 一致）：

```powershell
cd downloads/voice.starbow.top/source
npm ci
npm run dev -- --host 127.0.0.1
```

浏览器录音需要允许麦克风访问，并在 HTTPS 或 localhost 环境下使用。

## 开发与发布

源码位于 `downloads/voice.starbow.top/source/`，使用 React、TypeScript、Vite、ECharts 与 Zustand，通过 HashRouter 路由。

在源码目录执行验证：

```powershell
npm test -- --testTimeout=15000
npx tsc --noEmit
npm run build -- --base=/voice_tuning/
npm run preview -- --base=/voice_tuning/
```

推送 `main` 后，[GitHub Actions](https://github.com/emmm1e3m/voice_tuning/actions/workflows/pages.yml) 自动安装依赖、运行测试与类型检查、构建并部署 GitHub Pages。部署到本仓库路径时必须保留 `/voice_tuning/` base。

[使用说明](docs/使用说明.md) · [启动说明](scripts/启动说明.md) · [源码说明](downloads/voice.starbow.top/source/README.md) · [验证清单](docs/validation-checklist.md)

## 来源与致谢

声音练习室基于以下文档与代码进行二次开发和易用性优化，整合训练教程与声音分析功能，并优化界面布局和操作流程。

- 文档来源：[あおぎ葵](https://space.bilibili.com/942770) · [MTF 声音女性化练习手册](https://mtf-voice-training.vercel.app/)。
- 代码来源：[JPs-git/voice-builder](https://github.com/JPs-git/voice-builder) · [原项目在线体验](https://voice.starbow.top/)。

感谢原作者提供的文档与代码。

本版对原手册作了少量修订、校注与图示调整，教学页页头已标注；保留原作者署名与原站链接。上游源码 README 标注 MIT，但原下载版本没有独立 LICENSE 文件；手册页面未标明开源许可，保留署名不代表其内容已获 MIT 授权。
