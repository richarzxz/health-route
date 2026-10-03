# 健康航线 · 学习航线

两个个人 app，放在同一个仓库里：

| app | 网址 | 文件位置 |
|---|---|---|
| 健康航线：围绕一个每周主目标，记录睡眠、运动和体重 | `https://你的用户名.github.io/health-route/` | 仓库最外层 |
| 学习航线：每周弄懂一个概念、练一个技能，一步一步带着学 | `https://你的用户名.github.io/health-route/study/` | `study/` 文件夹 |

两个 app 的共同点：

- 可安装的网页应用：在 iPhone 的 Safari 里打开网址，用“添加到主屏幕”装到桌面。两个要分别打开、分别添加。
- 内容只保存在安装它的那台设备上，不上传到任何服务器。备份用 app 里的“导出备份”。
- 没网也能打开；有网时每次打开都会取最新版本。
- 运行不依赖任何 AI 服务。只要这些文件还在这个网址上，app 就能用。

## 文件

每个 app 都是同样的 6 个文件，没有更深的子文件夹。

| 文件 | 作用 |
|---|---|
| `index.html` | 整个 app：界面、样式和逻辑。以后改功能基本只改它 |
| `sw.js` | 离线缓存和更新策略 |
| `manifest.webmanifest` | app 的名字、图标、启动方式 |
| `icon-180.png` `icon-192.png` `icon-512.png` | 桌面图标 |

## 第一次上线（自己动手的做法）

GitHub 网页上的按钮名称可能会变，意思对得上即可。

1. 登录 GitHub，新建一个仓库（New repository），名字填 `health-route`，选 Public。
2. 进入仓库，点 Add file → Upload files，把最外层的 6 个文件一起选中上传，点 Commit changes。
3. 再点 Add file → Upload files，把整个 `study` 文件夹拖进去上传。在手机上拖不了文件夹时，改用 Add file → Create new file，文件名填 `study/index.html` 这样带斜杠的名字，GitHub 会自动建文件夹。
4. 进入仓库的 Settings → Pages，Source 选 Deploy from a branch，Branch 选 `main` 和 `/ (root)`，保存。
5. 等一两分钟，在 iPhone 的 Safari 里打开上面表格里的网址，点分享按钮，选“添加到主屏幕”。

## 以后更新（不需要 Claude）

更新就是把仓库里的旧文件换成新文件，手机上的 app 不用删、不用重装，内容也不受影响。

1. 拿到改好的 `index.html`（自己改，或者让任何会写代码的人或 AI 工具改）。改的时候把文件里的 `APP_VERSION` 加一，比如 `1.0.0` 改成 `1.0.1`。
2. 在 GitHub 仓库页面进入对应的位置：健康航线在最外层，学习航线要先点进 `study` 文件夹。
3. 点 Add file → Upload files，上传新的 `index.html`，同名文件会被替换，点 Commit changes。
4. 等一两分钟，联网状态下重新打开手机上的 app。页面最底部的版本号变了，就说明更新到了。

让别人或别的 AI 工具帮忙改时，把对应的 `index.html` 整个文件交给对方，并说明：这是一个单文件网页应用，内容存在浏览器的 localStorage 里，改动不能破坏已有内容的格式。健康航线的键名是 `health-route.v1`，学习航线的键名是 `study-route.v1`。

不要把导出的备份文件传到这个仓库里。仓库是公开的，备份里有你的全部内容。

## 健康航线的记录格式

```json
{
  "app": "health-route",
  "format": 1,
  "goal": { "type": "sleep", "bedTarget": "23:30", "nights": 5 },
  "days": {
    "2026-10-03": { "date": "2026-10-03", "bed": "23:20", "wake": "07:00", "exMin": 30, "exType": "跑步", "weight": 67.4 }
  }
}
```

每天一条，`bed` 和 `wake` 是入睡和起床时间，`exMin` 是运动分钟，`weight` 的单位是 kg。睡眠按起床那天记。

## 学习航线的方法和记录格式

app 不讲内容，它带着走流程：

1. 先回想：不看资料，先写下记得什么或猜它是什么。
2. 带着问题学：定一个问题，限时学 10 到 12 分钟。
3. 自己讲一遍：合上资料，用自己的话写它是什么、为什么需要、一个例子。
4. 找缺口：写下它不是什么，把说不清的地方写成一个问题。
5. 隔天再讲：过一天以后不看笔记再讲一次，之后按 1、3、7、14、30、60 天复习。

一个概念算学完，要过四关：说清、举例、划界、隔天还讲得出。一个技能算练完，要有 3 次带目标、带反馈的练习。

```json
{
  "app": "study-route",
  "format": 1,
  "units": [
    {
      "id": "x1", "start": "2026-10-04", "closed": false,
      "concept": { "name": "机会成本", "what": "…", "why": "…", "example": "…", "notThis": "…", "gap": "…",
                   "firstSaid": "2026-10-04", "recalledOn": "2026-10-05", "box": 1, "due": "2026-10-08" },
      "skill": { "name": "…", "reps": [ { "date": "2026-10-04", "goal": "…", "did": "…", "miss": "…", "fb": "对照范例", "next": "…" } ] }
    }
  ],
  "log": [ { "id": "x2", "date": "2026-10-04", "kind": "concept", "title": "机会成本", "min": 22 } ],
  "books": [ { "id": "x3", "title": "…", "status": "reading" } ],
  "goals": [ { "id": "x4", "text": "…", "done": false } ]
}
```

`units` 里一项是一轮学习（一个概念加一个技能）。`box` 是复习到第几档，`due` 是下次复习的日期。示例里的内容都是编的。
