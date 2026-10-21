# 当前实现记录

更新：2026-10-22。

## 已确认的实现与边界

- 独立仓库 origin=https://github.com/emmm1e3m/voice_tuning.git；main；upstream 只读。源码 downloads/voice.starbow.top/source；HashRouter；生产命令 npm run build -- --base=/voice_tuning/。Git认证由仓库显式配置的 Windows Git Credential Manager 提供。
- AnatomyExplorer 在同一面板联动六个普通话元音的解剖基准、六个部位动作、F0/F1/F2 数字和 AnatomySpectrum 强度—频率图。部位选择按钮配一个滑块，反馈紧邻控件，避免滚动导致无法对照。
- anatomyAcoustics 的参考数值取 VOWEL_PRESETS 中心；每个元音的结构位置单独定义。频率位移是相对所选元音的教学指数模型，不是生理预测；F0只随声源控制变化，F1/F2取决于声道控制。e按普通话后部不圆唇，ü按前高圆唇。
- AnatomySpectrum 用两个钟形峰演示 F1/F2 包络；F0用于当前泛音间距，并分别标出参考和当前F0。纵轴为相对强度，非实测声压级。
- FormantChart 为主页面唯一时间—频率图。registerSegments 按时间中点合并同声区帧；静音、无效F0、未知值和长缺口留白。__register 背景独立于三条曲线显隐，低透明着色。showRegister 与 frequencyScale 在 chartDisplayStore 持久化。
- 移除 FeedbackCard/FeedbackHero 独立声区行；RegisterLegend 与 FrequencyScaleControl 的说明承接含义。移动端只隐藏轴描述文本，不隐藏新增 Tip。
- TargetPresetBar 默认展开；TargetRecommendationControl 在桌面/手机共享。推荐模式用元音独立参考，不由F0反推F1/F2。手改F1/F2转manual；切元音保留F0；manual改F0不覆盖共振峰。
- appStore 保存 targetMode/activePreset/bands 及逐元音覆盖，merge校验并迁移旧自定义为manual；真实persist.rehydrate回归覆盖推荐与手动。targetBandRules固定半宽40/100/150Hz及有序中心约束保持。
- helpContent增加foreword为16章中第一章；manual 3/4从quick-start移入。AppShell普通帮助默认foreword，明确的上手入口仍打开quick-start。AboutModal对齐根README四个来源链接；LearningStrip添加主要结构；ConfigDrawer介绍混合算法与生效时机。

## 验证方法与维护入口

- 必须运行完整 npm test -- --testTimeout=15000、npx tsc --noEmit、npm run build -- --base=/voice_tuning/。最新结果摘要在docs/validation-results.json，原始本机输出为source/test-results.json与test-run.log（均不提交）。
- 生产本地预览也必须指定 --base=/voice_tuning/，与构建一致；否则默认预览配置会使前缀资源返回404，不能据此判断Pages发布错误。
- 本机Playwright通过bundled playwright的CommonJS入口加载；直接import其ESM入口在本环境出现default export错误。浏览器定位器默认4秒超时，避免长等待重置REPL。
- Vite读取ECharts实例时复用performance资源列表中的实际echarts.js查询URL，避免重复模块。UI签核通过实际点击/键盘/文件选择；evaluate仅作状态读取。
- 忠实保留UTF-8与原行尾；部分Windows写入会把LF改CRLF，最终对照HEAD恢复，git diff --check应干净。
- 平滑默认5帧、保留20s；appConfig限制1–30帧/5–120s，RingBuffer.resize保留最新数据。旧轮已验证13.163s样本和缩至5s的WAV导出，本次只对改动相关流程重新签核。

## 科学资料

- USC：https://sail.usc.edu/~lgoldste/General_Phonetics/Source_Filter/SFc.html
- UNSW：https://www.phys.unsw.edu.au/jw/voice.html
- Oxford：https://www.phon.ox.ac.uk/jcoleman/AcousticPhonetics2.pdf
- Lammert与Narayanan：https://pmc.ncbi.nlm.nih.gov/articles/PMC4503663/

声带振动与声道共振分开解释；舌高与F1通常反向，舌前移通常提高F2，圆唇/延长声道通常降低共振。保留典型方向和教学参数的边界。
