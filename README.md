# 健康航线

围绕一个每周主目标，记录睡眠、运动和体重的个人 app。

- 可安装的网页应用：在 iPhone 的 Safari 里打开网址，用“添加到主屏幕”装到桌面。
- 记录只保存在安装它的那台设备上，不上传到任何服务器。备份用 app 里的“导出备份”。
- 没网也能打开；有网时每次打开都会取最新版本。
- 运行不依赖任何 AI 服务。只要这几个文件还在一个网址上，app 就能用。

## 文件

全部放在同一层，没有子文件夹。

| 文件 | 作用 |
|---|---|
| `index.html` | 整个 app：界面、样式和逻辑。以后改功能基本只改它 |
| `sw.js` | 离线缓存和更新策略 |
| `manifest.webmanifest` | app 的名字、图标、启动方式 |
| `icon-180.png` `icon-192.png` `icon-512.png` | 桌面图标 |

## 第一次上线（自己动手的做法）

GitHub 网页上的按钮名称可能会变，意思对得上即可。

1. 登录 GitHub，新建一个仓库（New repository），名字填 `health-route`，选 Public。
2. 进入仓库，点 Add file → Upload files，把上面 6 个文件一起选中上传，点 Commit changes。
3. 进入仓库的 Settings → Pages，Source 选 Deploy from a branch，Branch 选 `main` 和 `/ (root)`，保存。
4. 等一两分钟，app 的网址是 `https://你的用户名.github.io/health-route/`。
5. 在 iPhone 的 Safari 里打开这个网址，点分享按钮，选“添加到主屏幕”。

## 以后更新（不需要 Claude）

更新就是把仓库里的旧文件换成新文件，手机上的 app 不用删、不用重装，记录也不受影响。

1. 拿到改好的 `index.html`（自己改，或者让任何会写代码的人或 AI 工具改）。改的时候把文件里的 `APP_VERSION` 加一，比如 `1.0.0` 改成 `1.0.1`。
2. 在 GitHub 仓库页面点 Add file → Upload files，上传新的 `index.html`，同名文件会被替换，点 Commit changes。
3. 等一两分钟，联网状态下重新打开手机上的 app。页面最底部的版本号变了，就说明更新到了。

让别人或别的 AI 工具帮忙改时，把 `index.html` 整个文件交给对方，并说明：这是一个单文件网页应用，记录存在浏览器的 localStorage 里，键名是 `health-route.v1`，改动不能破坏已有记录的格式。

## 记录的格式

导出的备份是一个 JSON 文件：

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
