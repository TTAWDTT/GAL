# GAL

GAL（Girl and Love）是一个以 Markdown 为内容源的个人博客，提供文章目录、Markdown 渲染、KaTeX 和静态导出能力，页面采用安静、偏忧郁的深夜编辑部氛围。

## 本地开发

```bash
bun install
bun run dev
```

启动后访问 <http://127.0.0.1:3001>。

生产构建使用：

```bash
bun run build
```

静态文件会生成到 `out/`，GitHub Actions 会将它部署到 GitHub Pages。

## 添加文章

将 Markdown 文件放在 `content/` 下的任意文件夹中。文件夹会自动出现在左侧文章目录，文件中的第一个一级标题会作为文章标题，二级和三级标题会生成文章目录。

可在文章开头添加日期字段来控制文章顺序：

```md
---
date: 2026-09-04
---
# 一篇文章
```

支持标题、段落、列表、引用、代码块、行内代码、链接、图片、标准 Markdown 表格和多行 KaTeX 数学公式。图片放在 `public/` 下，然后在 Markdown 中使用相对路径引用。

## 在线地址

- 仓库：<https://github.com/TTAWDTT/GAL>
- GitHub Pages：<https://ttawdtt.github.io/GAL/>

推送到 `main` 分支，或在 Actions 中手动运行 `Deploy GAL to GitHub Pages`，即可触发部署。
