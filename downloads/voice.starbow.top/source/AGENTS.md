# 声音练习室源码工作说明

本源码已整合到用户的 voice_tuning 独立仓库。仓库根目录是 ../../..，请先阅读根 AGENTS.md。

- origin 必须为 https://github.com/emmm1e3m/voice_tuning.git，主分支 main。
- GitHub 凭据由根仓库配置的 Windows Git Credential Manager 提供，禁止把令牌写入源码。
- 原上游保留为 upstream，只读且禁止推送；原 master 自动版本发布流程已停用。
- 用户要求不新建其它目录，不沿用原项目强制创建 worktree 的约定。
- Pages 使用 HashRouter，生产构建必须 npm run build -- --base=/voice_tuning/。
- 修改应用后验证 npm test、npx tsc --noEmit 和生产构建；根 .github/workflows/pages.yml 自动部署。
- 使用 UTF-8 和中文代码注释。
