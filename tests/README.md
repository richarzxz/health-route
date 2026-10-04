# 回归检查

维护者在有 Node.js 的电脑上运行：

```sh
node tests/regression.cjs
```

不需要 npm 安装依赖，也不是网页运行所需步骤。

测试直接读取三个 HTML 的脚本和三个 Service Worker，以 Node VM 模拟页面元素、localStorage、FileReader 和网络。全部使用虚构数据。

这些检查可以验证保存失败的状态恢复、备份兼容、分类关联与离线回退等逻辑；不能替代浏览器视觉检查、Safari/iPhone 实测或真实系统分享测试。不得把该结果写成“已验证 iPhone”。

学习 1.1.0 共 82 项检查，增加工作台迁移、输入重开与失败重试、完成快照、掌握自评隔离、格式 1/2 备份、停车场、接手内容和输入转义。日期固定为本地 2026-10-04 中午，不依赖机器所在时区。最新报告为 `verification-study-1.1.0.json`。
