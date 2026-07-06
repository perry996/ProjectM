#!/usr/bin/env python3
"""
项目管理系统 - 数据清洗脚本
============================
功能：
  1. 从项目结项流程表和普通项目立项表读取数据
  2. 筛选申请状态=已通过的记录
  3. 同一项目多行合并（同值去重，异值多选拼接）
  4. 立项和结项分为独立行（流程类型标记为 立项/结项）
  5. 增量同步到目标表（新增/更新/删除，不变则跳过）

使用方法：
  python3 data_clean_workflow.py

前置条件：
  - lark-cli 已认证 (lark-cli auth status --verify)
  - Python 3.7+
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from collections import defaultdict

# ==================== 配置 ====================
BASE_TOKEN = "QeItbOOG2aBu6ssIOuJcf6ywnUh"
TABLE_JX = "tblnq82I1f7y6OKV"      # 项目结项流程
TABLE_LX = "tblGuSY4Z6neHFPf"       # 普通项目立项
TABLE_TARGET = "数据清洗"
LARK_CLI = "lark-cli"
ENV = {
    **os.environ,
    "LARKSUITE_CLI_NO_UPDATE_NOTIFIER": "1",
    "LARKSUITE_CLI_NO_SKILLS_NOTIFIER": "1"
}

# 目标表字段顺序（必须与数据清洗表字段一一对应）
TARGET_FIELDS = [
    "项目编号", "项目-产品子类", "是否完成合同付款", "项目总结经验教训",
    "项目名称", "合同额", "发起人部门", "项目目标", "项目实际完成时间",
    "完成时间", "结项原因", "发起时间", "采购总预算金额", "审批流程",
    "项目经理", "关联项目立项申请", "是否已上会", "立项类型", "所属产品大类",
    "项目大类", "项目计划完成时间", "项目交付物是否归档", "项目类型",
    "流程类型", "客户预算", "是否完成合同收款", "项目规模", "承接部门",
    "项目成员", "项目结项及验收材料", "申请编号", "需求部门", "申请状态",
    "自研工作量", "发起人", "项目编号（组合）"
]

# 结项表源字段名 -> 目标字段名映射（名称不同的需要映射）
# 目标字段名 -> 结项源字段名（名称不同的需要映射）
JX_FIELD_MAP = {
    '结项原因': '结项原因',
    '项目交付物是否归档': '项目交付物是否归档',
    '是否完成合同付款': '是否完成合同付款',
    '是否完成合同收款': '是否完成合同收款',
    '项目总结经验教训': '项目总结、经验教训及过程改进建议',  # 目标←源
    '项目结项及验收材料': '项目结项及验收材料',
    '关联项目立项申请': '关联项目立项申请',
    '项目实际完成时间': '项目实际完成时间',
    '申请编号': '申请编号',
    '申请状态': '申请状态',
    '审批流程': '审批流程',
    '发起人': '发起人',
    '发起人部门': '发起人部门',
    '发起时间': '发起时间',
    '完成时间': '完成时间',
    '需求部门': '需求部门_需求部门',
    '承接部门': '承接部门_承接部门',
    '是否已上会': '是否已上会',
}

# ==================== 工具函数 ====================

def run_lark(cmd_args, stdin_data=None):
    """运行 lark-cli 命令，返回解析后的 JSON"""
    cmd = [LARK_CLI] + cmd_args + ["--as", "user"]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=180,
            env=ENV,
            input=json.dumps(stdin_data) if stdin_data else None
        )
        output = result.stdout
        # 跳过 [lark-cli] WARN 行
        lines = output.split('\n')
        json_start = 0
        for i, l in enumerate(lines):
            if l.strip().startswith('{'):
                json_start = i
                break
        return json.loads('\n'.join(lines[json_start:]))
    except Exception as e:
        print(f"  [ERROR] lark-cli 调用失败: {e}", file=sys.stderr)
        if 'result' in locals():
            print(f"  stdout: {result.stdout[:500]}", file=sys.stderr)
        return None


def safe_idx(fields, name):
    """安全获取字段索引"""
    try:
        return fields.index(name)
    except ValueError:
        return None


def extract_link_text(val):
    """从 Markdown 链接中提取文本: [text](url) -> text"""
    if isinstance(val, str):
        m = re.match(r'\[(.*?)\]\(', val)
        if m:
            return m.group(1)
    return val


def merge_values(values):
    """
    合并同一项目的多个值：
    - 完全相同 → 保留一个
    - 不同值 → 合并为列表
    """
    cleaned = [v for v in values if v is not None and v != '' and v != []]
    if not cleaned:
        return None

    seen, unique = set(), []
    for v in cleaned:
        if isinstance(v, list):
            key = tuple(sorted([
                json.dumps(x, sort_keys=True, ensure_ascii=False)
                if isinstance(x, dict) else str(x) for x in v
            ]))
        elif isinstance(v, dict):
            key = json.dumps(v, sort_keys=True, ensure_ascii=False)
        else:
            key = str(v)
        if key not in seen:
            seen.add(key)
            unique.append(v)

    if len(unique) == 0:
        return None
    if len(unique) == 1:
        return unique[0]
    # 如果全是列表，扁平化去重
    if all(isinstance(x, list) for x in unique):
        flat, seen2 = [], set()
        for x in unique:
            for item in x:
                k = json.dumps(item, sort_keys=True, ensure_ascii=False) if isinstance(item, dict) else str(item)
                if k not in seen2:
                    seen2.add(k)
                    flat.append(item)
        return flat
    return unique


def extract_user_ids(val):
    """提取人员字段值"""
    if val is None:
        return None
    if isinstance(val, list):
        users = [{"id": v['id']} for v in val if isinstance(v, dict) and 'id' in v]
        return users if users else None
    if isinstance(val, dict) and 'id' in val:
        return [{"id": val['id']}]
    return None


def fmt_date(val, full=False):
    """格式化日期值"""
    if val is None:
        return None
    if isinstance(val, list):
        vals = [v for v in val if v is not None]
        return fmt_date(max(vals), full) if vals else None
    if isinstance(val, str):
        val = val.strip()
        if val and ' ' in val:
            return val if full else val[:10]
        return val[:10] if not full else (val + ' 00:00:00' if ' ' not in val else val)
    return str(val)


def fmt_select(val):
    """格式化选择字段"""
    if val is None:
        return None
    if isinstance(val, list):
        return str(val[0]) if len(val) == 1 else [str(v) for v in val]
    return str(val)


def fmt_text(val):
    """格式化文本字段"""
    if val is None:
        return None
    if isinstance(val, list):
        if len(val) == 0:
            return None
        if len(val) == 1:
            v = val[0]
            return str(v) if not isinstance(v, str) else v
        return '; '.join([str(v) if not isinstance(v, str) else v for v in val])
    return str(val) if not isinstance(val, str) else val


def fmt_apply_num(val):
    """格式化申请编号（提取链接文本）"""
    if val is None:
        return None
    if isinstance(val, list):
        texts = []
        for v in val:
            t = extract_link_text(v) if isinstance(v, str) else str(v)
            texts.append(t)
        seen, unique = set(), []
        for t in texts:
            if t not in seen:
                seen.add(t)
                unique.append(t)
        return '; '.join(unique) if len(unique) > 1 else (unique[0] if unique else None)
    if isinstance(val, str):
        return extract_link_text(val)
    return str(val)


def build_row(target_fields, proj_name, flow_type, data_dict, field_map=None, extra=None):
    """构建一行目标数据"""
    if field_map is None:
        field_map = {f: f for f in target_fields}
    if extra is None:
        extra = {}

    row = []
    for fname in target_fields:
        if fname == '流程类型':
            row.append(flow_type)
        elif fname == '项目名称':
            row.append(proj_name)
        elif fname in extra:
            row.append(extra[fname])
        else:
            src_fname = field_map.get(fname)
            if src_fname is None:
                row.append(None)
                continue
            val = data_dict.get(src_fname)

            # 按类型格式化
            if fname in ('发起人', '项目经理', '项目成员'):
                val = extract_user_ids(val)
            elif fname in ('发起时间', '完成时间'):
                val = fmt_date(val, full=True)
            elif fname in ('项目计划完成时间', '项目实际完成时间'):
                val = fmt_date(val, full=False)
            elif fname in ('合同额', '自研工作量', '采购总预算金额', '客户预算'):
                if isinstance(val, list):
                    nums = [v for v in val if isinstance(v, (int, float))]
                    val = nums[0] if nums else None
                val = val if isinstance(val, (int, float)) else None
            elif fname in ('项目类型',):
                val = fmt_select(val)
            elif fname == '申请编号':
                val = fmt_apply_num(val)
            else:
                val = fmt_text(val)
            row.append(val)
    return row


# ==================== 主流程 ====================

def main():
    print("=" * 60)
    print("  项目流程数据清洗")
    print("=" * 60)

    # ---- Step 1: 获取源数据 ----
    print("\n[Step 1] 读取源数据...")
    jx_resp = run_lark([
        "base", "+record-list",
        "--base-token", BASE_TOKEN, "--table-id", TABLE_JX,
        "--limit", "200", "--format", "json"
    ])
    lx_resp = run_lark([
        "base", "+record-list",
        "--base-token", BASE_TOKEN, "--table-id", TABLE_LX,
        "--limit", "200", "--format", "json"
    ])

    if not jx_resp or not jx_resp.get('ok'):
        print("ERROR: 无法获取结项流程表数据")
        sys.exit(1)
    if not lx_resp or not lx_resp.get('ok'):
        print("ERROR: 无法获取项目立项表数据")
        sys.exit(1)

    jx_fields = jx_resp['data']['fields']
    lx_fields = lx_resp['data']['fields']
    jx_data = jx_resp['data']['data']
    lx_data = lx_resp['data']['data']
    print(f"  结项原始: {len(jx_data)} 条 | 立项原始: {len(lx_data)} 条")

    # ---- Step 2: 筛选已通过 ----
    print("\n[Step 2] 筛选 申请状态=已通过...")
    jx_passed = [r for r in jx_data
                 if isinstance(r[safe_idx(jx_fields, '申请状态')], list)
                 and '已通过' in r[safe_idx(jx_fields, '申请状态')]]
    lx_passed = [r for r in lx_data
                 if isinstance(r[safe_idx(lx_fields, '申请状态')], list)
                 and '已通过' in r[safe_idx(lx_fields, '申请状态')]]
    print(f"  结项: {len(jx_passed)} 条 | 立项: {len(lx_passed)} 条")

    # ---- Step 3: 立项按项目名称合并 ----
    print("\n[Step 3] 合并立项同项目多行数据...")
    name_idx_lx = safe_idx(lx_fields, '项目名称')
    lx_by_name = defaultdict(list)
    for r in lx_passed:
        lx_by_name[r[name_idx_lx]].append(r)

    lx_merged = {}
    for name, records in lx_by_name.items():
        lx_merged[name] = {
            f: merge_values([r[i] for r in records])
            for i, f in enumerate(lx_fields)
        }
    print(f"  立项项目（去重后）: {len(lx_merged)}")

    # 提取项目编号（组合）供结项使用
    pnc_idx_lx = safe_idx(lx_fields, '项目编号（组合）')
    name_to_pnc = {}
    for name, data in lx_merged.items():
        if pnc_idx_lx is not None:
            name_to_pnc[name] = data.get('项目编号（组合）')

    # 构建申请编号 -> 项目名称 映射
    apply_idx_lx = safe_idx(lx_fields, '申请编号')
    apply_to_name = {}
    for r in lx_passed:
        apply_to_name[extract_link_text(r[apply_idx_lx])] = r[name_idx_lx]

    # ---- Step 4: 结项合并 ----
    print("\n[Step 4] 合并结项数据...")
    link_idx_jx = safe_idx(jx_fields, '关联项目立项申请')
    jx_by_link = defaultdict(list)
    for r in jx_passed:
        jx_by_link[r[link_idx_jx]].append(r)

    jx_merged = {}
    for link, records in jx_by_link.items():
        merged = {f: merge_values([r[i] for r in records]) for i, f in enumerate(jx_fields)}
        # 匹配立项项目名
        proj_name = None
        for at, nm in apply_to_name.items():
            if link and at and link.startswith(at):
                proj_name = nm
                break
        if proj_name is None:
            proj_name = f"结项_{link[:30]}" if link else "结项_未知项目"
        jx_merged[proj_name] = merged
    print(f"  结项项目: {len(jx_merged)}")

    # ---- Step 5: 构建输出行 ----
    print("\n[Step 5] 构建清洗后数据...")
    rows = []

    # 立项行
    for name in sorted(lx_merged.keys()):
        row = build_row(TARGET_FIELDS, name, '立项', lx_merged[name])
        rows.append(row)

    # 结项行
    for name in sorted(jx_merged.keys()):
        extra = {}
        if name in name_to_pnc:
            extra['项目编号（组合）'] = fmt_text(name_to_pnc[name])
        row = build_row(TARGET_FIELDS, name, '结项', jx_merged[name], JX_FIELD_MAP, extra)
        rows.append(row)

    lx_count = len(lx_merged)
    jx_count = len(jx_merged)
    total = len(rows)
    print(f"  总计: {total} 行（{lx_count} 立项 + {jx_count} 结项）")

    # ---- Step 6: 增量同步 ----
    print("\n[Step 6] 增量同步到目标表...")

    # 构建新数据索引
    pnc_i = TARGET_FIELDS.index('项目编号（组合）')
    flow_i = TARGET_FIELDS.index('流程类型')
    apply_i = TARGET_FIELDS.index('申请编号')

    lx_new_keys = set()   # 立项：项目编号（组合）
    jx_new_keys = set()   # 结项：申请编号
    new_rows_by_key = {}  # (流程类型, key) -> row

    for row in rows:
        ft = row[flow_i]
        if ft == '立项':
            key = row[pnc_i]
            if key:
                lx_new_keys.add(key)
                new_rows_by_key[('立项', key)] = row
        else:
            key = row[apply_i]
            if key:
                jx_new_keys.add(key)
                new_rows_by_key[('结项', key)] = row

    # 读取目标表现有数据，按唯一键建立索引
    old_resp = run_lark([
        "base", "+record-list",
        "--base-token", BASE_TOKEN, "--table-id", TABLE_TARGET,
        "--limit", "200", "--format", "json"
    ])
    lx_existing = {}  # 项目编号（组合） -> record_id (立项)
    jx_existing = {}  # 申请编号 -> record_id (结项)

    if old_resp and old_resp.get('ok'):
        old_fields = old_resp['data'].get('fields', [])
        old_ids = old_resp['data'].get('record_id_list', [])
        old_data = old_resp['data'].get('data', [])
        of_pnc = safe_idx(old_fields, '项目编号（组合）')
        of_flow = safe_idx(old_fields, '流程类型')
        of_apply = safe_idx(old_fields, '申请编号')
        for i, r in enumerate(old_data):
            rid = old_ids[i] if i < len(old_ids) else r[0]
            ft = r[of_flow] if of_flow is not None else None
            if isinstance(ft, list):
                ft = ft[0] if ft else None
            if ft == '立项':
                key = r[of_pnc] if of_pnc is not None else None
                if key:
                    lx_existing[key] = rid
            elif ft == '结项':
                key = r[of_apply] if of_apply is not None else None
                if key:
                    jx_existing[key] = rid

    print(f"  目标表: {len(lx_existing)} 立项 + {len(jx_existing)} 结项")
    print(f"  新数据: {len(lx_new_keys)} 立项 + {len(jx_new_keys)} 结项")

    # 分类
    to_create = []
    to_delete = []
    skipped = 0

    # 立项：按项目编号（组合）比对
    for key in lx_new_keys:
        if key in lx_existing:
            skipped += 1  # 已存在，跳过
        else:
            to_create.append(new_rows_by_key[('立项', key)])

    # 结项：按申请编号比对
    for key in jx_new_keys:
        if key in jx_existing:
            skipped += 1
        else:
            to_create.append(new_rows_by_key[('结项', key)])

    # 目标表中多余的数据 → 删除
    for key, rid in lx_existing.items():
        if key not in lx_new_keys:
            to_delete.append(rid)
    for key, rid in jx_existing.items():
        if key not in jx_new_keys:
            to_delete.append(rid)

    removed = len(to_delete)
    new_count = len(to_create)
    print(f"  新增: {new_count} | 删除: {removed} | 跳过: {skipped}")

    # 执行删除
    if to_delete:
        print(f"  删除多余记录 {len(to_delete)} 条...")
        deleted = 0
        for i, rid in enumerate(to_delete):
            result = run_lark([
                "base", "+record-delete",
                "--base-token", BASE_TOKEN, "--table-id", TABLE_TARGET,
                "--record-id", rid, "--yes"
            ])
            if result and result.get('ok'):
                deleted += 1
            if (i + 1) % 30 == 0:
                print(f"    已删除: {deleted}/{len(to_delete)}")
        print(f"  删除完成: {deleted} 条")

    # 执行写入
    if to_create:
        print(f"  写入新记录 {len(to_create)} 条...")
        batch = {"fields": TARGET_FIELDS, "rows": to_create}
        tmp_path = None
        try:
            fd, tmp_path = tempfile.mkstemp(suffix='.json', dir=os.getcwd())
            os.close(fd)
            rel_path = os.path.basename(tmp_path)
            with open(tmp_path, 'w') as f:
                json.dump(batch, f, ensure_ascii=False)

            result = run_lark([
                "base", "+record-batch-create",
                "--base-token", BASE_TOKEN, "--table-id", TABLE_TARGET,
                "--json", f"@./{rel_path}"
            ])
            if result and result.get('ok'):
                written = len(result['data'].get('record_id_list', []))
                print(f"  ✓ 成功写入 {written} 条")
            else:
                print(f"  ✗ 写入失败: {result}")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
    else:
        print("  无新记录，跳过写入")

    # ---- 汇总 ----
    print("\n" + "=" * 60)
    print("  清洗完成!")
    print(f"  立项项目: {lx_count}")
    print(f"  结项项目: {jx_count}")
    print(f"  总记录数: {total}")
    print("=" * 60)
    for i, row in enumerate(rows):
        ni = TARGET_FIELDS.index('项目名称')
        fi = TARGET_FIELDS.index('流程类型')
        nm = row[ni][:55] if row[ni] else 'N/A'
        print(f"  [{i+1:2d}] {row[fi]:4s} | {nm}")


if __name__ == '__main__':
    main()
