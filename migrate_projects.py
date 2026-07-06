#!/usr/bin/env python3
"""Migrate records from source table to target project list table."""

import json
import subprocess
import sys

BASE_SRC = "QeItbOOG2aBu6ssIOuJcf6ywnUh"
TABLE_SRC = "tbl6MLJZCtrvyjz9"
BASE_DST = "PSL1bgzF4aPe3WsoMrGczRlxnGv"
TABLE_DST = "tblwNT1cZhZ40RyM"

# Source column index -> extractor
# Returns (value, should_include) - if should_include is False, skip
def extract_text(val):
    """Extract plain text from any value."""
    if val is None:
        return None
    if isinstance(val, list):
        return val[0] if val else None
    return str(val)

def extract_select(val):
    """Extract select value. Source select fields are arrays like ['value']."""
    if val is None:
        return None
    if isinstance(val, list):
        return val[0] if val else None
    return str(val)

def extract_user(val):
    """Extract user value. Must be [{'id': 'ou_xxx', ...}] format."""
    if val is None:
        return None
    if isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict) and 'id' in val[0]:
        return [{"id": val[0]["id"]}]
    return None  # Cannot convert name-only to user ID

def extract_datetime_str(val):
    """Extract datetime string. Source may be string 'YYYY-MM-DD HH:mm'."""
    if val is None:
        return None
    if isinstance(val, str) and val.strip():
        s = val.strip()
        # Ensure HH:mm:ss format
        if len(s) == 16:  # YYYY-MM-DD HH:mm
            return s + ":00"
        if len(s) == 10:  # YYYY-MM-DD
            return s + " 00:00:00"
        return s
    return None

def extract_datetime_ts(val):
    """Extract datetime from timestamp."""
    if val is None:
        return None
    if isinstance(val, (int, float)) and val > 0:
        from datetime import datetime, timezone
        dt = datetime.fromtimestamp(val / 1000, tz=timezone.utc)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return None

# Load source data
with open('/tmp/source_records.json') as f:
    src = json.load(f)

src_data = src['data']
fields = src_data['fields']
records = src_data['data']
record_ids = src_data['record_id_list']

print(f"Source: {len(records)} records, {len(fields)} fields")

# Build index map
field_index = {name: i for i, name in enumerate(fields)}

# Target field list (in order for batch create)
target_fields = [
    "项目名称",
    "用友项目编号",
    "飞书项目编号",
    "项目类型",
    "费用类型",
    "项目负责人",
    "项目状态",
    "项目立项时间",
    "项目完成时间",
]

# Transform records
rows = []
skipped_count = 0
for i, record in enumerate(records):
    row = []

    # 项目名称 [10] - select -> text
    val = extract_select(record[field_index["项目名称"]])
    row.append(val)

    # 用友项目编号 [7] - text -> text
    val = extract_text(record[field_index["用友项目编号"]])
    row.append(val)

    # 飞书项目编号 [1] - text -> text
    val = extract_text(record[field_index["飞书项目编号"]])
    row.append(val)

    # 项目类型 [13] - select -> select
    val = extract_select(record[field_index["项目类型"]])
    row.append(val)

    # 费用类型 [12] - select -> text
    val = extract_select(record[field_index["费用类型"]])
    row.append(val)

    # 项目负责人 [6] - user -> user
    val = extract_user(record[field_index["项目负责人"]])
    row.append(val)

    # 项目状态 [5] - select -> select
    val = extract_select(record[field_index["项目状态"]])
    row.append(val)

    # 项目立项时间 [8] - lookup string -> datetime
    val = extract_datetime_str(record[field_index["项目立项时间"]])
    row.append(val)

    # 项目完成时间 [4] - datetime/lookup -> datetime
    raw = record[field_index["项目完成时间"]]
    if raw is None:
        row.append(None)
    elif isinstance(raw, str) and raw.strip():
        row.append(extract_datetime_str(raw))
    elif isinstance(raw, (int, float)):
        row.append(extract_datetime_ts(raw))
    else:
        row.append(None)

    rows.append(row)

print(f"Transformed: {len(rows)} rows ready")

# Write batch create JSON
# Format: {"fields": [...], "rows": [[...], ...]}
batch_json = {
    "fields": target_fields,
    "rows": rows,
}

output_file = 'migrate_batch.json'
with open(output_file, 'w') as f:
    json.dump(batch_json, f, ensure_ascii=False)

print(f"Batch JSON written to {output_file}")
print(f"File size: {len(json.dumps(batch_json, ensure_ascii=False))} chars")
print(f"First row sample: {json.dumps(rows[0], ensure_ascii=False)[:200]}")

# Now batch create in target table
# Max 200 per batch, we have 57 so one batch is fine
result = subprocess.run([
    "lark-cli", "base", "+record-batch-create",
    "--base-token", BASE_DST,
    "--table-id", TABLE_DST,
    "--json", f"@{output_file}",
    "--as", "user",
], capture_output=True, text=True, env={"LARK_CLI_NO_PROXY": "1", "PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin", "HOME": subprocess.os.environ.get("HOME", "/Users/panyejun")})

print("\n--- lark-cli output ---")
print("stdout:", result.stdout[:500])
if result.stderr:
    print("stderr:", result.stderr[:500])
print("returncode:", result.returncode)
