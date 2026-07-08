/* ═══════════════════════════════════════════════════════════════
   SYNC — 数据同步
   ═══════════════════════════════════════════════════════════════ */

async function doSyncProjects() {
  toast('正在同步...', 'inf');
  try {
    const data = await API.getMergeList();
    const m = transformMerge(data);
    MERGE = m.merge;
    MERGED = m.merged;
    addLogEntry('飞书同步', '数据清洗表', '同步' + m.merge.length + '条待合并+' + m.merged.length + '条已合并');
    toast('已同步 ' + m.merge.length + ' 条待合并 + ' + m.merged.length + ' 条已合并', 'ok');
    updateBadges();
    renderMerge();
  } catch (e) {
    toast('同步失败: ' + e.message, 'err');
    console.warn('[sync] doSyncProjects failed', e);
  }
}

async function doSyncPeople() {
  toast('正在同步人员...', 'inf');
  try {
    const data = await API.getUsers();
    const u = transformUsers(data);
    PPL = u.people;
    USER_DATA = u.userData;
    PPL_BY_ID = new Map(PPL.map(function (p) { return [p.id, p]; }));
    USER_BY_ID = new Map(USER_DATA.map(function (u) { return [u.id, u]; }));
    addLogEntry('人员同步', '全公司', '从人员表同步' + u.people.length + '人');
    toast('已同步 ' + u.people.length + ' 人', 'ok');
  } catch (e) {
    toast('同步失败: ' + e.message, 'err');
    console.warn('[sync] doSyncPeople failed', e);
  }
}

function doPushOutput() {
  addLogEntry('推送输出', '费控/禅道', '推送至费控系统、禅道（REQ-DS-003）');
  toast('已推送至费控系统、禅道（模拟）', 'ok');
}
