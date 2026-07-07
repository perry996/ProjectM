# 项目管理系统

基于飞书多维表格的项目管理工具，数据实时双向同步。

## 启动 / 停止

```bash
cd projectM
python3 serverctl.py start      # 启动服务 → http://localhost:3457
python3 serverctl.py stop       # 停止服务
python3 serverctl.py restart    # 重启
python3 serverctl.py status     # 查看状态
python3 serverctl.py open       # 启动并打开浏览器
```

直接启动（不用 Python）：
```bash
node server.js              # 默认端口 3456
node server.js 3457         # 指定端口
```

## 数据同步机制

| 时机 | 行为 |
|------|------|
| 页面加载 | 从飞书多维表格拉取全部 8 张表 |
| 增/删/改操作 | 实时写回飞书 |
| 侧边栏「同步」按钮 | 重新全量拉取对应表 |

## 多维表格映射

| API 路径 | 飞书表 | Base |
|---------|--------|------|
| `/api/projects` | 项目清单 | PSL1bgzF... |
| `/api/roles` | 角色表 | PSL1bgzF... |
| `/api/products` | 产品表 | PSL1bgzF... |
| `/api/approvals` | 审批表 | PSL1bgzF... |
| `/api/logs` | 操作日志表 | PSL1bgzF... |
| `/api/users` | 人员表 | PSL1bgzF... |
| `/api/members` | 成员工时表 | PSL1bgzF... |
| `/api/merge` | 数据清洗 | QeItbOOG... |

## 文件结构

```
projectM/
├── server.js         # Node.js API 代理（lark-cli → HTTP）
├── serverctl.py      # 服务启动/停止工具
├── index.html        # 前端入口
├── css/
│   └── style.css     # 样式
└── js/
    ├── utils.js      # 工具函数（toast、月份生成等）
    ├── api.js        # 数据访问层
    └── main.js       # 核心逻辑（数据转换、UI渲染、筛选、写回）
```
