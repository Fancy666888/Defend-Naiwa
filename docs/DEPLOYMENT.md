# 发布到 GitHub Pages

游戏是静态网页，已准备好 GitHub Actions 工作流、运行素材及子目录资源路径。本文件是部署指南；截至编写时未创建远程仓库、未上传、未发布。

## 第一次发布

1. 登录 GitHub，创建空仓库，建议命名 `Defend-Naiwa`。使用免费个人账户时选择 Public；不要预先勾选 README、License 或 .gitignore，以免首次推送产生分叉历史。
2. 仓库进入 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。本项目已经提供 `.github/workflows/deploy.yml`，不必另建模板。
3. 在本地项目目录打开终端，执行下面命令，把 `你的用户名` 替换为自己的 GitHub 用户名：

```sh
cd '/Users/fancy/Documents/保卫奶蛙'
git init -b main
git add .github .gitignore src public scripts tests docs index.html package.json package-lock.json tsconfig.json vite.config.ts README.md
git commit -m "Publish Naiwa game"
git remote add origin https://github.com/你的用户名/Defend-Naiwa.git
git push -u origin main
```

以上命令有意仅上传代码、文档、测试和运行用素材；根目录大尺寸原始PNG仍保留在电脑上。工作流只使用现有 `public/` 素材，不依赖重新生成PNG或音频。

推送时需完成GitHub身份验证；若已安装GitHub Desktop，可使用它添加本地仓库并登录后推送。不要在聊天里发送密码或访问令牌。若首次提交提示作者身份未设置，按Git提示配置自己的Git用户名和邮箱。

4. 打开仓库的 **Actions**，查看 **Deploy Naiwa to GitHub Pages**。它会安装依赖、运行测试、打包、核对图片音频，再发布 `dist/`。若最初Pages尚未启用导致失败，启用后在Actions选择 **Re-run all jobs**，或使用 **Run workflow** 手动触发。
5. 部署成功后，从Actions部署结果或Settings → Pages取得实际网址。普通项目仓库预期为 `https://你的用户名.github.io/Defend-Naiwa/`。只有仓库名是 `你的用户名.github.io` 时才使用根地址 `https://你的用户名.github.io/`。

## 日后更新

```sh
cd '/Users/fancy/Documents/保卫奶蛙'
git add src public scripts tests docs .github index.html package.json package-lock.json tsconfig.json vite.config.ts README.md .gitignore
git commit -m "Update Naiwa game"
git push
```

推送到main会重新自动测试、构建并发布。无需手工上传dist，也不要把TypeScript源码入口当成最终静态页面发布。

## 当前配置

- `vite.config.ts` 使用相对 `base: './'`；本游戏只有一个入口页、不使用前端路由，因此可在根目录或仓库子目录部署。
- 代码中的图片与音频均经过 `src/urls.ts` 加入部署基路径，避免进入域名根目录找错资源。
- GitHub工作流使用Node 24、npm ci和已锁定的依赖；部署Actions按官方Vite指南的版本摘要固定。
- `node_modules/`、`dist/`、临时输出由.gitignore排除。发布产物在工作流中生成并上传。
- 最佳成绩保存在各访问者当前浏览器，不会跨设备同步；音频仍需要点击开始后播放。

## 发布后检查

点开始，确认角色、背景音乐、攻击音效正常；测试一处建塔和升级。若代码更新后仍看到旧版，先确认Actions已经成功，再刷新页面。

如果网页只显示源码或空白，核对Pages的Source确为GitHub Actions；如果工作流失败，查看失败步骤日志。GitHubPages在线部署与线上浏览器访问仍需实际推送后验证。

参考：
- [GitHub Pages 发布源设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Vite 静态部署指南](https://vite.dev/guide/static-deploy)
