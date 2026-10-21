# 整合版实现记录

## 已确认

- 工作目录 downloads/voice.starbow.top/source；根启动练习器.cmd → scripts/start.ps1。用户授权直接修改已有文件，downloads.zip 不改；未创建 worktree、提交或推送。
- 页面主色保持原 MTF 风格；用户“蓝色太多”只指图标。Logo/favicon 同步为两端对称的粉蓝对角渐变，白色波形。Nav 内外同为 --radius-sm=10px。字号 --font-scale=1.25，图表 CHART_FONT_SCALE=1.25。
- AnalysisWorkspace 只渲染 FormantChart。LearningStrip + useWindowSummary 汇总保留窗口内有限正频率的中位数，100ms 节流。显示当前Hz/目标Hz；实时反馈读取最新帧，和曲线可见性分离。
- targetBandRules 固定半宽40/100/150Hz；setBandCenter 和 usePresetBands 共享桌面/手机控制。旧自定义范围按中心迁移，voicebuilder-presets-before-center-targets-v2 留原数据。桌面 TargetPresetBar details 默认关闭。
- appConfig 规范化平滑1–30帧和保留5–120s，默认5/20。RingBuffer.resize 保留最新音频，扩容不填充假数据；appStore 同步帧容量。useAnalysis、usePlayback、WAV导出与chartTimeline共享保留上限。
- frequencyChart 统一配色与轴；chartFormatting 仅预览取整；目标线用 getBandCenter 算术中心，log映射不改变目标Hz。独立F0Chart保留组件回归，但主页面不再渲染。
- manualLessons 和 helpContent 为15章内置正文，HelpDrawer 桌面目录/手机select。26原图，16道逐题details默认关闭答案；AnatomyExplorer、SourceFilterLab、VowelMap、ChartReadingExample 分别支持部位、声源滤波、元音空间、三频读图。后两频谱手机内部横滚，实际图文字13.75px。
- 原下载HTML和public/manual保留；关于只列两网站，原个人联系项移除。原文许可事实见source/README。

## 验证

- 最新完整 86 文件 698 项全通过，tsc与生产构建通过。构建仍有ECharts集中打包体积提示，约1.46MB JS /502KB gzip。
- Chromium实际a.wav导入：窗口F0/F1/F2中位数203/709/1255Hz。末帧静音时最新帧显示--，窗口中位数仍有值。
- 13.163秒重复元音测试样本导入并完整导出；缩至5s后导出PCM16 WAV准确5s。配置输入120不会在中途12时提交，Enter提交、刷新保存10/120成功，随后还原默认5/20。
- 主页面1440、1024、390、360px无横向溢出；两个固定NavLink内外10px；手机Tip从右侧对齐，在视口内。图表实测悬停532Hz/1s整数。浏览器无pageerror。
- 视觉子代理独立Chromium验证图拖拽、方向键与预设联动；检查手机横滚两端和标签13.75px。主代理复查结构、元音桌面、手机频谱与读图示例。
- 前轮已验证一键脚本冷启动/已有服务识别、模拟麦克风录音/停止/继续和拒绝权限。未验物理设备。
- Vite动态import必须使用真实资源URL查询串，否则可能创建重复store/ECharts模块；运行QA优先UI。Locator含章节序号时accessible name带空格，使用不带序号的名称匹配。

## 维护入口

README、source/README、source/docs/integration-notes、coordinate-system 已同步；smoothing-comparison记录5/10帧对照。当前截图与验证摘要在root docs；source/.validation 保留专项验证截图；test-results.json/test-run.log 保留最后一次原始测试输出。


## 2026-10-21 独立仓库和 Pages

- 个人主页、旅行饼狗、emoji_wallpaper 和 voice_tuning 分为独立仓库。
- 每目录 origin 指向本人同名仓库，显式使用 Git Credential Manager；令牌不写文件。
- 仅新增同级项目目录 emmm1e3m.github.io 和 emoji_wallpaper。
- 源码仍位于 downloads/voice.starbow.top/source；原有 .git 和 .github 元数据迁移到根，upstream 禁止推送。HashRouter 加 /voice_tuning/ base 支持 Pages；原上游 release workflow 停用。
- 已确认：首次云端构建和 Pages 部署成功；公网声音分析及 #/practice 可访问，手册链接保留 /voice_tuning/ 前缀。
- 云端重复构建时 wavExport 单测曾在 5 秒默认限时超时（699/700 通过）；Pages workflow 为完整测试统一设置 15 秒限时，保留原断言。
