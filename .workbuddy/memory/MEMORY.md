# 项目管理系统 - 长期记忆

## 项目概述
项目管理系统，用于公司项目全生命周期数字化管理。核心链路：飞书立项/结项 → 数据同步 → 待合并清单清洗合并 → 项目清单管理 → 状态审批 → 输出至费控/禅道。

## 关键概念
- 待合并项目清单：飞书同步项目的暂存区，仅系统管理员可见可操作
- 合并项目信息：待合并项目与现有项目字段比对、冲突处理后并入项目清单
- 用户角色四级：用户、项目负责人、PMO、系统管理员

## 飞书多维表格
- 需求条目表 app_token: GFYcbY21aa1VPrsKOZmcXnJXnZf, table_id: tblUzorTLTunFlEO
- 读取方式：lark-cli base +record-list --base-token ... --table-id ... --view-id ... --format json
