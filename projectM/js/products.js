/* ═══════════════════════════════════════════════════════════════
   PRODUCTS — 产品管理
   依赖: core.js (全局状态)
   ═══════════════════════════════════════════════════════════════ */

// 产品选项 HTML 缓存（PRODUCTS 变化时清空）
let _productOptionsCache = '';

function invalidateProductCache() {
  _productOptionsCache = '';
}

function getProductOptions(selected) {
  if (_productOptionsCache && !selected) {
    return _productOptionsCache;
  }

  const s = selected || '';
  const topLevel = PRODUCTS.filter(function (p) { return !p.parent; });
  const subs = PRODUCTS.filter(function (p) { return p.parent; });

  function renderOpts(parentName, depth) {
    const d = depth || 0;
    const children = subs.filter(function (p) { return p.parent === parentName; });
    let html = '';
    children.forEach(function (prod) {
      const prefix = d > 0 ? '└' + '—'.repeat(d) + ' ' : '';
      html += '<option value="' + prod.name + '" ' + (s === prod.name ? 'selected' : '') + '>' + prefix + prod.name + '</option>';
      html += renderOpts(prod.name, d + 1);
    });
    return html;
  }

  let html = '';
  topLevel.forEach(function (p) {
    html += '<option value="' + p.name + '" ' + (s === p.name ? 'selected' : '') + '>' + p.name + '</option>';
    html += renderOpts(p.name, 1);
  });

  const allParentNames = [...new Set(subs.map(function (p) { return p.parent; }).filter(Boolean))];
  allParentNames.forEach(function (n) {
    if (!topLevel.some(function (p) { return p.name === n; })) {
      html += '<option value="' + n + '" ' + (s === n ? 'selected' : '') + '>' + n + '</option>';
    }
  });

  const seenNames = new Set();
  PRODUCTS.forEach(function (p) { seenNames.add(p.name); });
  allParentNames.forEach(function (n) { seenNames.add(n); });
  PROJ.forEach(function (p) {
    if (p.product && !seenNames.has(p.product)) {
      seenNames.add(p.product);
      html += '<option value="' + p.product + '" ' + (s === p.product ? 'selected' : '') + '>' + p.product + '</option>';
    }
  });

  if (!selected) _productOptionsCache = html;
  return html;
}

function renderProducts() {
  document.getElementById('content').innerHTML =
    '<div class="ph"><div><h1>产品管理</h1><p class="subt">维护产品及子产品层级关系，修改将同步至飞书多维表格。</p></div></div>' +
    '<div class="tbl-wrap">' +
      '<div class="tbl-bar">' +
        '<div style="display:flex;align-items:center;gap:8px;flex:1;flex-wrap:wrap;">' +
          '<select id="newProdParent" style="padding:7px 12px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:13px;font-family:var(--font);background:var(--surf);">' +
            '<option value="">作为主产品</option>' + getProductOptions() +
          '</select>' +
          '<input type="text" id="newProdInput" placeholder="输入产品名称..." style="padding:7px 12px;border-radius:var(--r);border:1.5px solid var(--bd);font-size:13px;font-family:var(--font);width:180px;" onkeydown="if(event.key===\'Enter\')addProduct()">' +
          '<button class="btn btn-p btn-sm" onclick="addProduct()">+ 添加</button>' +
          '<span style="color:var(--bd);margin:0 4px;">|</span>' +
          '<button class="btn btn-gh btn-sm" onclick="expandAll()">全部展开</button>' +
          '<button class="btn btn-gh btn-sm" onclick="collapseAll()">全部收起</button>' +
        '</div>' +
        '<span style="font-size:12px;color:var(--tx3);">共 ' + PRODUCTS.length + ' 个产品</span>' +
      '</div>' +
      '<div id="prodTbBody">' + renderProductTable() + '</div>' +
    '</div>';
  page = 'products';
}

function expandAll() {
  PRODUCTS.forEach(function (p) { expandedProducts[p.id] = true; });
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
}

function collapseAll() {
  PRODUCTS.forEach(function (p) { expandedProducts[p.id] = false; });
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
}

function toggleProduct(prodId) {
  expandedProducts[prodId] = !expandedProducts[prodId];
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
}

function renderProductTable() {
  if (!PRODUCTS.length) return '<div class="empty">暂无产品，请添加</div>';

  function countTreeRefs(prod) {
    let cnt = PROJ.filter(function (p) { return p.product === prod.name; }).length +
              MERGE.filter(function (m) { return (m.f && m.f.product) === prod.name; }).length +
              MERGED.filter(function (m) { return (m.f && m.f.product) === prod.name; }).length;
    const children = PRODUCTS.filter(function (p) { return p.parent === prod.name; });
    children.forEach(function (c) { cnt += countTreeRefs(c); });
    return cnt;
  }

  function renderRow(prod, depth, ancestors) {
    const d = depth || 0;
    const anc = ancestors || [];
    const children = PRODUCTS.filter(function (p) { return p.parent === prod.name; });
    const hasChildren = children.length > 0;
    const expanded = expandedProducts[prod.id] !== false;
    const projCount = PROJ.filter(function (p) { return p.product === prod.name; }).length;
    const mergeCount = MERGE.filter(function (m) { return (m.f && m.f.product) === prod.name; }).length;
    const directRef = projCount + mergeCount;
    const allRef = countTreeRefs(prod);

    let prefix = '';
    for (let i = 0; i < anc.length; i++) {
      prefix += '<span style="color:var(--tx3);">' + (anc[i].isLast ? '&emsp;&ensp;' : '│&emsp;&ensp;') + '</span>';
    }
    const isLast = anc.length > 0 ? anc[anc.length - 1].isLast : true;
    const connector = d > 0 ? '<span style="color:var(--tx3);">' + (isLast ? '└── ' : '├── ') + '</span>' : '';

    const levelTag = d === 0 ? '<span class="tag b">主产品</span>' : '<span class="tag gr">' + d + ' 级子产品</span>';

    let toggleBtn = '';
    if (hasChildren) {
      toggleBtn = '<span class="tree-toggle" onclick="toggleProduct(\'' + prod.id + '\')">' + (expanded ? '▼' : '▶') + '</span>';
    } else {
      toggleBtn = '<span style="display:inline-block;width:20px;margin-right:4px;flex-shrink:0;"></span>';
    }

    let refHtml = directRef > 0
      ? '<span style="font-weight:600;color:var(--tx);">' + directRef + '</span><span style="color:var(--tx3);"> 个直接关联</span>'
      : '<span style="color:var(--tx3);">—</span>';
    if (hasChildren && allRef > directRef) {
      refHtml += ' <span style="font-size:11px;color:var(--tx3);">（含子产品共 ' + allRef + '）</span>';
    }

    const rowStyle = d === 0 ? 'background:var(--mu);' : '';
    let html = '<tr id="prod-row-' + prod.id + '" style="' + rowStyle + '">' +
      '<td>' + prefix + connector + toggleBtn + '<span class="ct" id="prod-name-' + prod.id + '">' + prod.name + '</span>' +
        '<input type="text" class="role-edit-inline" id="prod-edit-' + prod.id + '" value="' + prod.name + '" style="display:none;" onkeydown="if(event.key===\'Enter\')saveProductEdit(\'' + prod.id + '\')">' +
      '</td>' +
      '<td>' + levelTag + '</td>' +
      '<td style="font-size:12px;">' + refHtml + '</td>' +
      '<td class="ca">' +
        '<button class="btn btn-o btn-sm" id="prod-btn-edit-' + prod.id + '" onclick="startProdEdit(\'' + prod.id + '\')">✎ 编辑</button>' +
        '<button class="btn btn-p btn-sm" id="prod-btn-save-' + prod.id + '" style="display:none;" onclick="saveProductEdit(\'' + prod.id + '\')">保存</button>' +
        '<button class="btn btn-gh btn-sm" style="color:var(--red);" onclick="delProduct(\'' + prod.id + '\')">删除</button>' +
      '</td></tr>';

    if (hasChildren && expanded) {
      children.forEach(function (child, ci) {
        const childAnc = anc.concat([{ id: prod.id, isLast: ci === children.length - 1 }]);
        html += renderRow(child, d + 1, childAnc);
      });
    }
    return html;
  }

  const topLevel = PRODUCTS.filter(function (p) { return !p.parent; });
  if (!topLevel.length) return '<div class="empty">暂无主产品，请添加</div>';

  return '<table><thead><tr><th>产品名称</th><th>层级</th><th>关联项目</th><th style="width:180px;">操作</th></tr></thead><tbody>' +
    topLevel.map(function (prod) { return renderRow(prod, 0, []); }).join('') +
    '</tbody></table>';
}

async function addProduct() {
  const inp = document.getElementById('newProdInput');
  const parentSel = document.getElementById('newProdParent');
  const v = inp.value.trim();
  if (!v) { toast('请输入产品名称', 'err'); return; }
  const parentName = parentSel.value || '';

  if (PRODUCTS.some(function (p) { return p.name === v && p.parent === (parentName || null); })) {
    toast('同层级下已存在同名产品', 'err'); return;
  }

  const newId = 'prod' + Date.now();
  const isSub = !!parentName;
  PRODUCTS.push({
    id: newId, name: v,
    parent: parentName || null,
    fullName: parentName ? parentName + ' - ' + v : v,
    isSub: isSub
  });
  invalidateProductCache();

  inp.value = '';
  parentSel.value = '';
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
  addLogEntry('产品管理', '产品表', '添加产品「' + v + '」');

  try {
    await API.createProduct({ '所属产品大类': parentName, '子产品名称': isSub ? v : '' });
  } catch (e) { console.warn('[products] addProduct sync failed', e); }

  toast('已添加产品「' + v + '」', 'ok');
}

function startProdEdit(prodId) {
  document.getElementById('prod-name-' + prodId).style.display = 'none';
  document.getElementById('prod-edit-' + prodId).style.display = '';
  document.getElementById('prod-edit-' + prodId).focus();
  document.getElementById('prod-btn-edit-' + prodId).style.display = 'none';
  document.getElementById('prod-btn-save-' + prodId).style.display = '';
}

async function saveProductEdit(prodId) {
  const v = document.getElementById('prod-edit-' + prodId).value.trim();
  if (!v) { toast('产品名称不能为空', 'err'); return; }
  const prod = PRODUCTS.find(function (p) { return p.id === prodId; });
  if (!prod) return;
  const old = prod.name;
  if (v !== old && PRODUCTS.some(function (p) { return p.name === v && p.parent === prod.parent && p.id !== prodId; })) {
    toast('同层级下已存在同名产品', 'err'); return;
  }
  if (v !== old) {
    PROJ.forEach(function (p) { if (p.product === old) p.product = v; });
    MERGE.forEach(function (m) { if (m.f && m.f.product === old) m.f.product = v; });
    MERGED.forEach(function (m) { if (m.f && m.f.product === old) m.f.product = v; });
    PRODUCTS.forEach(function (p) { if (p.parent === old) p.parent = v; });
  }
  prod.name = v;
  if (prod.parent && prod.isSub) {
    prod.fullName = prod.parent + ' - ' + v;
  }
  invalidateProductCache();
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
  addLogEntry('产品管理', '产品表', v !== old ? '重命名「' + old + '」→「' + v + '」（已同步更新所有关联项目）' : '保存「' + v + '」');

  try {
    const allProds = await API.getProducts();
    if (allProds && allProds.data) {
      const fields = allProds.fields || [];
      const fiSub = fields.indexOf('子产品名称');
      const fiParent = fields.indexOf('所属产品大类');
      const ids = allProds.record_id_list || [];
      if (fiSub >= 0 && fiParent >= 0) {
        for (let j = 0; j < (allProds.data || []).length; j++) {
          const row = allProds.data[j];
          if (prod.isSub && row[fiSub] === old && row[fiParent] === (prod.parent || '')) {
            if (ids[j]) await API.updateProduct(ids[j], { '子产品名称': v });
            break;
          } else if (!prod.isSub && row[fiParent] === old && !row[fiSub]) {
            if (ids[j]) await API.updateProduct(ids[j], { '所属产品大类': v });
            break;
          }
        }
      }
    }
  } catch (e) { console.warn('[products] saveProductEdit sync failed', e); }

  toast(v !== old ? '已重命名，关联项目已同步更新' : '保存成功', 'ok');
}

async function delProduct(prodId) {
  const prod = PRODUCTS.find(function (p) { return p.id === prodId; });
  if (!prod) return;
  const children = PRODUCTS.filter(function (p) { return p.parent === prod.name; });
  if (children.length) {
    toast('请先删除子产品：' + children.map(function (c) { return c.name; }).join('、'), 'err');
    return;
  }
  const projCount = PROJ.filter(function (p) { return p.product === prod.name; }).length;
  const mergeCount = MERGE.filter(function (m) { return (m.f && m.f.product) === prod.name; }).length;
  if (!confirm((projCount > 0 || mergeCount > 0
    ? '产品「' + prod.name + '」关联了 ' + projCount + ' 个项目、' + mergeCount + ' 条待合并记录。删除后这些关联将变为空，确定继续？'
    : '确定删除产品「' + prod.name + '」？'))) return;

  PRODUCTS.splice(PRODUCTS.indexOf(prod), 1);
  invalidateProductCache();
  PROJ.forEach(function (p) { if (p.product === prod.name) p.product = ''; });
  MERGE.forEach(function (m) { if (m.f && m.f.product === prod.name) m.f.product = ''; });
  MERGED.forEach(function (m) { if (m.f && m.f.product === prod.name) m.f.product = ''; });
  document.getElementById('prodTbBody').innerHTML = renderProductTable();
  addLogEntry('产品管理', '产品表', '删除产品「' + prod.name + '」');

  try {
    const allProds = await API.getProducts();
    if (allProds && allProds.data) {
      const fields = allProds.fields || [];
      const fiSub = fields.indexOf('子产品名称');
      const fiParent = fields.indexOf('所属产品大类');
      const ids = allProds.record_id_list || [];
      if (fiSub >= 0 && fiParent >= 0) {
        for (let j = 0; j < (allProds.data || []).length; j++) {
          const row = allProds.data[j];
          if (prod.isSub && row[fiSub] === prod.name && row[fiParent] === (prod.parent || '')) {
            if (ids[j]) await API.deleteProduct(ids[j]);
            break;
          } else if (!prod.isSub && row[fiParent] === prod.name && !row[fiSub]) {
            if (ids[j]) await API.deleteProduct(ids[j]);
            break;
          }
        }
      }
    }
  } catch (e) { console.warn('[products] delProduct sync failed', e); }

  toast('已删除产品「' + prod.name + '」', 'ok');
}
