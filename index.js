// Claude Code : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoBase sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoBase.
// Elle demande l'accès complet pour utiliser les outils d'interface de NeoBase. NeoBase ne l'ouvre que si elle est signée.
const HTML = "<div class=\"ccWrap\">\n      <aside class=\"ccSide\"><button class=\"btn main px\" id=\"ccNew\">+ NOUVELLE CONVERSATION</button><input class=\"f\" id=\"ccSearch\" placeholder=\"Chercher…\"><div id=\"ccList\" class=\"ccList\"></div><div class=\"hint\" id=\"ccStatus\"></div></aside>\n      <section class=\"ccMain\">\n        <div class=\"ccHead\"><b id=\"ccTitle\"></b><button class=\"ccChip\" id=\"ccDir\" title=\"Dossier du projet\"></button><select class=\"f gSel\" id=\"ccModel\" title=\"Modèle\"></select><select class=\"f gSel\" id=\"ccMode\" title=\"Ce que Claude peut faire sans demander\"></select></div>\n        <div id=\"ccMsgs\" class=\"ccMsgs\"></div>\n        <div class=\"ccCompose px\"><textarea id=\"ccIn\" rows=\"3\" placeholder=\"Écris à Claude…  (Entrée : envoyer · Maj+Entrée : nouvelle ligne)\"></textarea><button class=\"btn main px\" id=\"ccSend\">ENVOYER</button></div>\n      </section>\n    </div>";
/*CSS-MOVED*/ const CSS = `.ccWrap{display:grid;grid-template-columns:270px 1fr;height:100%;min-height:0}
.ccSide{display:flex;flex-direction:column;gap:8px;padding:14px 10px;border-right:3px solid var(--line);min-height:0}
.ccList{flex:1;overflow:auto;display:flex;flex-direction:column;gap:2px}
.ccItem{border:0;background:none;text-align:left;padding:8px 10px;color:var(--lilac);cursor:var(--cp,pointer);display:flex;flex-direction:column;font:14px var(--text)}
.ccItem b{color:#fff;font-weight:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ccItem small{color:var(--muted);font-size:11px}
.ccItem:hover{background:rgba(var(--pkr),.12)}
.ccItem.on{background:rgba(var(--pkr),.25)}
.ccItem.run b::before{content:"● ";color:#ffd07a}
.ccMain{display:flex;flex-direction:column;min-height:0;min-width:0}
.ccHead{display:flex;gap:8px;align-items:center;padding:10px 16px;border-bottom:3px solid var(--line)}
.ccHead b{flex:1;font:13px var(--title);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ccHead select{width:auto;flex:none;max-width:210px}
.ccChip{border:0;background:rgba(var(--pkr),.15);color:var(--lilac);padding:6px 10px;font:13px var(--text);max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:var(--cp,pointer)}
.ccMsgs{flex:1;overflow:auto;padding:18px max(16px,calc((100% - 820px) / 2));display:flex;flex-direction:column;gap:12px}
.ccMsg.user{align-self:flex-end;max-width:75%}
.ccBubble{background:rgba(var(--pkr),.28);color:#fff;padding:10px 14px;white-space:pre-wrap;user-select:text}
.ccMsg.claude{color:#ece4ff;user-select:text}
.ccMd{font:16px/1.55 var(--text)}
.ccMd :is(h1,h2,h3){font:14px var(--title);color:#fff;margin:14px 0 6px}
.ccMd p{margin:0 0 8px}
.ccMd a{color:#7fe0ee}
.ccMd pre{position:relative;background:#05010b;padding:12px;overflow:auto;box-shadow:0 0 0 2px var(--line2)}
.ccMd code{font:13px Consolas,monospace;color:#ffd0f4}
.ccMd :not(pre)>code{background:#05010b;padding:1px 5px}
.ccCopy{position:absolute;top:4px;right:4px;border:0;background:var(--line2);color:#fff;font:9px var(--title);padding:4px 6px;cursor:var(--cp,pointer);opacity:.6}
.ccCopy:hover{opacity:1}
.ccMeta{color:var(--muted);font-size:11px}
.ccTool{background:rgba(var(--d8),.6);box-shadow:inset 3px 0 0 var(--line2);padding:6px 10px;font-size:13px;color:var(--lilac)}
.ccTool summary{cursor:var(--cp,pointer);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ccTool summary b{color:#7fe0ee;font-weight:normal}
.ccTool i{color:#8ee8a0;font-style:normal}
.ccTool.err i{color:#ff7a8a}
.ccTool pre{max-height:260px;overflow:auto;font:12px Consolas,monospace;color:#d9ccf6;white-space:pre-wrap;user-select:text}
.ccDots{color:var(--magenta)}
.ccEmpty{margin:auto;max-width:520px;text-align:center;color:var(--lilac);line-height:1.6}
.ccEmpty b{font:14px var(--title);color:#fff}
.ccCompose{display:flex;gap:10px;align-items:flex-end;margin:0 max(16px,calc((100% - 820px) / 2)) 16px;padding:10px;--fill:var(--win)}
.ccCompose textarea{flex:1;background:transparent;border:0;color:#fff;font:15px var(--text);resize:none;outline:none}
#ccSend.stop{background:#c42a3c}
.gSel{width:auto;font-size:14px;padding:6px 10px;margin-right:8px}
`;  // le style de ce plugin (il utilise les variables du thème de NeoBase)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoBase pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = host;
  const nbConfirm = host.confirm;  // la boîte de confirmation de NeoBase, à la place de celle de Windows
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "claudeApp" ? view : (view.querySelector('#' + id) || document.getElementById(id));  // les identifiants de ta vue d'abord, puis ceux de la page (fenêtres, menus)
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const __icon = () => ctx.icon;  // l'icône de ce plugin
  const __picks = {  };
  const __storeGet = async n => {
    let d = await doc(n);
    if (d == null) { try { d = await neo.storeGet(n); } catch { d = null; } if (d && __picks[n]) d = __picks[n](d); if (d != null) await folder.write(n, d); }  // première ouverture : tu retrouves ce que tu avais
    return d;
  };
  const __storeSet = async (n, d) => { await folder.write(n, d); return true; };
  // ---- ton code d'origine ----
/* ---------- Claude Code, in a window like Claude Desktop: conversations on the left, the chat on the right. Each message runs the
   Claude Code installed on this PC (claude-main.js) in the project folder of the conversation, with your account; replies stream in,
   the tools it uses (commands, files read or changed) show as cards. Conversations are kept in the "claude" store, synced:
   on your other PC a conversation goes on with its last messages as context (Claude Code's own session stays on the PC it ran on). ---------- */
const CC = {modes: {plan: 'Lecture seule (plan)', edits: 'Modifier les fichiers', all: 'Tout autoriser'}, models: {'': 'Modèle par défaut', opus: 'Opus', sonnet: 'Sonnet', haiku: 'Haiku'}, max: 300};
let ccStore = null, ccInfo = null, ccCur = null, ccFilter = '';
const ccRunning = new Map();  // conversation id -> {live: the reply being written, msgIds}
const ccData = async () => ccStore ??= (await __storeGet('claude')) || {convs: []};
const ccSave = () => { clearTimeout(ccSave.t); ccSave.t = setTimeout(() => __storeSet('claude', ccStore), 500); };
const ccConv = () => ccStore.convs.find(c => c.id === ccCur);
const ccEsc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
// markdown from Claude: no raw HTML, only http(s) links, images shown as links (nothing loads by itself)
marked.use({renderer: {
  html: h => ccEsc(typeof h === 'object' ? h.text : h),
  link: (href, title, text) => /^https?:\/\//.test(href) ? `<a href="${ccEsc(href)}" title="${ccEsc(title || href)}">${text}</a>` : text,
  image: (href, title, text) => /^https?:\/\//.test(href) ? `<a href="${ccEsc(href)}">🖼 ${ccEsc(text || href)}</a>` : ccEsc(text),
}});
const ccMd = t => marked.parse(t || '', {gfm: true, breaks: true});
// a tool card: its name and what it works on
function ccToolSum(name, input = {}) {
  const v = input.command || input.file_path || input.path || input.pattern || input.url || input.query || input.description || input.prompt || '';
  return String(v || JSON.stringify(input)).replace(/\s+/g, ' ').slice(0, 160);
}
async function ccOpen() {
  await ccData();
  ccInfo ??= await neo.ccInfo();
  $('ccStatus').textContent = ccInfo.found ? 'Claude Code ' + ccInfo.version.replace(/\s*\(Claude Code\)/, '') + ' · ton compte Claude de ce PC' : 'Claude Code n\'est pas installé sur ce PC';
  if (!ccCur && ccStore.convs[0]) ccCur = ccStore.convs[0].id;
  ccRenderList(); ccRender();
  setTimeout(() => $('ccIn').focus());
}
function ccNew() {
  const last = ccConv();
  const c = {id: crypto.randomUUID(), title: 'Nouvelle conversation', cwd: last?.cwd || ccInfo?.home || '', model: last?.model || '', mode: last?.mode || 'edits', session: '', host: '', at: Date.now(), msgs: []};
  ccStore.convs.unshift(c); ccCur = c.id; ccSave(); ccRenderList(); ccRender(); $('ccIn').focus();
  return c;
}
function ccRenderList() {
  const q = ccFilter.toLowerCase();
  $('ccList').replaceChildren(...ccStore.convs.filter(c => (c.title + ' ' + c.cwd).toLowerCase().includes(q)).map(c => {
    const b = el('button', 'ccItem' + (c.id === ccCur ? ' on' : '') + (ccRunning.has(c.id) ? ' run' : ''));
    b.append(el('b', '', c.title), el('small', '', (c.cwd.split(/[\\/]/).pop() || c.cwd) + ' · ' + new Date(c.at).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})));
    b.onclick = () => { ccCur = c.id; ccRenderList(); ccRender(); };
    b.oncontextmenu = async e => { e.preventDefault(); const t = await ask('Renommer la conversation', c.title, 'vide : la supprimer'); if (t == null) return; if (t.trim()) c.title = t.trim(); else if (await nbConfirm('Supprimer « ' + c.title + ' » ?')) { ccStore.convs.splice(ccStore.convs.indexOf(c), 1); if (ccCur === c.id) ccCur = ccStore.convs[0]?.id || null; } ccSave(); ccRenderList(); ccRender(); };
    return b;
  }));
}
function ccMsgEl(m) {
  if (m.r === 'user') { const e = el('div', 'ccMsg user'); e.append(el('div', 'ccBubble', m.t)); return e; }
  if (m.r === 'tool') {
    const d = el('details', 'ccTool' + (m.err ? ' err' : '')), s = el('summary');
    s.append(el('b', '', m.name), el('span', '', ' ' + m.sum), el('i', '', m.out == null ? ' …' : m.err ? ' ✕' : ' ✓'));
    d.append(s); if (m.out) d.append(el('pre', '', m.out)); return d;
  }
  if (m.r === 'info') {
    const e = el('div', 'ccInfo' + (m.err ? ' err' : ''), m.t);
    if (m.login) { const b = el('button', 'btn main px', 'SE CONNECTER À CLAUDE'); b.onclick = () => neo.ccLogin(); e.append(el('br'), b, el('small', '', ' Une fenêtre Claude Code s\'ouvre : tape /login, connecte-toi, puis ferme-la.')); }
    return e;
  }
  const e = el('div', 'ccMsg claude'), body = el('div', 'ccMd'); body.innerHTML = ccMd(m.t);
  for (const pre of body.querySelectorAll('pre')) { const b = el('button', 'ccCopy', 'COPIER'); b.onclick = () => { navigator.clipboard.writeText(pre.textContent); toast('Copié'); }; pre.append(b); }
  e.append(body); if (m.meta) e.append(el('small', 'ccMeta', m.meta)); return e;
}
function ccRender() {
  const c = ccConv(), box = $('ccMsgs');
  $('ccTitle').textContent = c ? c.title : 'Claude Code';
  $('ccDir').textContent = c ? '📁 ' + (c.cwd || 'choisir un dossier') : '';
  $('ccDir').title = c?.cwd || ''; $('ccModel').value = c?.model || ''; $('ccMode').value = c?.mode || 'edits';
  for (const id of ['ccDir', 'ccModel', 'ccMode']) $(id).style.visibility = c ? '' : 'hidden';
  const running = c && ccRunning.has(c.id);
  $('ccSend').textContent = running ? 'ARRÊTER' : 'ENVOYER'; $('ccSend').classList.toggle('stop', !!running);
  if (!c || !c.msgs.length) {
    box.replaceChildren(el('div', 'ccEmpty', ''));
    box.firstChild.innerHTML = '<b>Que veux-tu faire ?</b><br>Claude Code travaille dans le dossier du projet choisi en haut : il peut lire tes fichiers, les modifier et lancer des commandes, selon le mode choisi.<br><small>Glisse des fichiers ici pour les citer · clic droit sur une conversation : la renommer ou la supprimer</small>';
    return;
  }
  box.replaceChildren(...c.msgs.map(ccMsgEl));
  if (running && c.msgs.at(-1)?.r !== 'claude') box.append(el('div', 'ccDots', '● ● ●'));  // the reply being written is already in the list
  box.scrollTop = box.scrollHeight;
}
// the conversation's text, given as context when its Claude Code session is on another PC
const ccContext = c => c.msgs.filter(m => m.r === 'user' || m.r === 'claude').slice(-12).map(m => (m.r === 'user' ? 'Moi : ' : 'Claude : ') + m.t.slice(0, 1500)).join('\n\n');
async function ccSend() {
  let c = ccConv() || ccNew();
  if (ccRunning.has(c.id)) { ccRunning.get(c.id).stopped = true; neo.ccStop(c.id); return; }
  const text = $('ccIn').value.trim(); if (!text) return;
  if (!ccInfo?.found) return toast('Claude Code n\'est pas installé sur ce PC', true);
  if (!c.cwd) { const d = await neo.ccPickDir(); if (!d) return; c.cwd = d; }
  let prompt = text, session = c.session;
  if (session && c.host && c.host !== ccInfo.host) session = '';  // that session is on the other PC
  if (!session && c.msgs.length) prompt = 'Voici notre conversation jusqu\'ici (reprise sur un autre PC) :\n\n' + ccContext(c) + '\n\n---\n\n' + text;
  c.msgs.push({r: 'user', t: text, at: Date.now()}); if (c.title === 'Nouvelle conversation') c.title = text.replace(/\s+/g, ' ').slice(0, 48);
  c.at = Date.now(); ccStore.convs.sort((a, b) => b.at - a.at);
  $('ccIn').value = ''; ccRunning.set(c.id, {tools: new Map(), msgs: new Map(), live: null, t0: Date.now()});
  ccSave(); ccRenderList(); ccRender();
  try { await neo.ccRun({id: c.id, prompt, cwd: c.cwd, session, model: c.model, mode: c.mode}); }
  catch (e) { ccRunning.delete(c.id); c.msgs.push({r: 'info', err: true, t: e.message.replace(/^.*Error: /, '')}); ccSave(); ccRenderList(); ccRender(); }
}
// the live output of Claude Code
neo.onCcEvent(({id, ev}) => {
  const c = ccStore?.convs.find(x => x.id === id), run = ccRunning.get(id); if (!c || !run) return;
  const shown = id === ccCur && view.classList.contains('on');
  const push = m => { c.msgs.push(m); if (c.msgs.length > CC.max) c.msgs.splice(0, c.msgs.length - CC.max); };
  if (ev.type === 'system' && ev.subtype === 'init') { c.session = ev.session_id; c.host = ccInfo.host; }
  else if (ev.type === 'stream_event') {
    const e = ev.event;
    if (e.type === 'message_start') run.cur = e.message?.id;
    if (e.type === 'content_block_delta' && e.delta?.type === 'text_delta') {
      if (!run.live) { run.live = {m: {r: 'claude', t: '', at: Date.now()}, id: run.cur}; run.msgs.set(run.cur, run.live.m); push(run.live.m); }
      run.live.m.t += e.delta.text;
      if (shown) { clearTimeout(run.paint); const lm = run.live.m; run.paint = setTimeout(() => { if (ccRunning.get(id) !== run || ccCur !== id) return; const box = $('ccMsgs'); const n = ccMsgEl(lm); const old = box.querySelector('.ccMsg.claude.live'); n.classList.add('live'); old ? old.replaceWith(n) : (box.querySelector('.ccDots')?.remove(), box.append(n)); box.scrollTop = box.scrollHeight; }, 40); }
    }
    if (e.type === 'message_stop') run.live = null;
  }
  else if (ev.type === 'assistant') {
    for (const b of ev.message?.content || []) {
      if (b.type === 'text' && !run.msgs.has(ev.message.id)) { const m = {r: 'claude', t: b.text, at: Date.now()}; run.msgs.set(ev.message.id, m); push(m); }  // no live text came (older Claude Code)
      if (b.type === 'tool_use' && !run.tools.has(b.id)) { const m = {r: 'tool', name: b.name, sum: ccToolSum(b.name, b.input), out: null, at: Date.now()}; run.tools.set(b.id, m); push(m); run.live = null; }
    }
    if (shown) ccRender();
  }
  else if (ev.type === 'user') {
    for (const b of ev.message?.content || []) if (b.type === 'tool_result') {
      const m = run.tools.get(b.tool_use_id); if (!m) continue;
      const out = typeof b.content === 'string' ? b.content : (b.content || []).map(x => x.text || '').join('\n');
      m.out = out.slice(0, 1500) + (out.length > 1500 ? '\n…' : ''); m.err = !!b.is_error;
    }
    if (shown) ccRender();
  }
  else if (ev.type === 'result') {
    const txt = String(ev.result || '');
    if (/not logged in|please run \/login|invalid api key/i.test(txt)) push({r: 'info', err: true, login: true, t: 'Claude Code n\'est pas connecté à ton compte sur ce PC.'});
    else if (ev.is_error && /no conversation found/i.test(txt)) { c.session = ''; push({r: 'info', t: 'La session de Claude Code a disparu : renvoie ton message, il repartira avec le contexte de la conversation.'}); }
    else if (ev.is_error && txt) push({r: 'info', err: true, t: txt.slice(0, 800)});
    const last = [...c.msgs].reverse().find(m => m.r === 'claude');
    if (last && !ev.is_error) last.meta = Math.round((ev.duration_ms || Date.now() - run.t0) / 1000) + ' s' + (ev.num_turns > 1 ? ' · ' + ev.num_turns + ' étapes' : '') + (ev.total_cost_usd ? ' · ' + ev.total_cost_usd.toFixed(3).replace('.', ',') + ' $' : '');
  }
  else if (ev.type === 'neo') {
    if (ev.error) push({r: 'info', err: true, t: ev.error});
    if (ev.done) {
      ccRunning.delete(id);
      if (ev.code && ev.err && !c.msgs.slice(-1)[0]?.login) push({r: 'info', err: true, t: 'Claude Code s\'est arrêté (' + ev.code + ') : ' + ev.err});
      else if (run.stopped) push({r: 'info', t: 'Arrêté.'});
      for (const m of c.msgs) if (m.r === 'tool' && m.out == null) m.out = '';
      c.at = Date.now(); ccSave(); ccRenderList(); if (shown) ccRender(); else if (!ev.code) toast('Claude a répondu dans « ' + c.title + ' »');
    }
  }
});
$('ccNew').onclick = () => ccNew();
$('ccSend').onclick = () => ccSend();
$('ccIn').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ccSend(); } };
$('ccSearch').oninput = e => { ccFilter = e.target.value; ccRenderList(); };
$('ccDir').onclick = async () => { const c = ccConv(); if (!c) return; const d = await neo.ccPickDir(c.cwd); if (d) { c.cwd = d; c.session = ''; ccSave(); ccRender(); ccRenderList(); } };
$('ccModel').onchange = e => { const c = ccConv(); if (c) { c.model = e.target.value; ccSave(); } };
$('ccMode').onchange = async e => {
  const c = ccConv(); if (!c) return;
  if (e.target.value === 'all' && !await nbConfirm('« Tout autoriser » : Claude Code lance les commandes et modifie les fichiers du dossier sans rien demander. Continuer ?')) { e.target.value = c.mode; return; }
  c.mode = e.target.value; ccSave();
};
$('ccMsgs').onclick = e => { const a = e.target.closest('a[href]'); if (a) { e.preventDefault(); newTab(a.href); } };
$('claudeApp').ondragover = e => e.preventDefault();
$('claudeApp').ondrop = e => { e.preventDefault(); const paths = [...e.dataTransfer.files].map(f => neo.pathOf(f)).filter(Boolean); if (paths.length) { const i = $('ccIn'); i.value += (i.value && !i.value.endsWith(' ') ? ' ' : '') + paths.map(p => '@"' + p + '"').join(' ') + ' '; i.focus(); } };
$('ccModel').replaceChildren(...Object.entries(CC.models).map(([v, n]) => Object.assign(el('option', '', n), {value: v})));
$('ccMode').replaceChildren(...Object.entries(CC.modes).map(([v, n]) => Object.assign(el('option', '', n), {value: v})));
console.assert(ccToolSum('Bash', {command: 'npm   test'}) === 'npm test' && !/<script/.test(ccMd('<script>alert(1)</script> [x](javascript:alert(1))')) && ccMd('[a](https://claude.ai)').includes('href="https://claude.ai"'), 'claude: markdown is safe');  // (non indenté : les textes sur plusieurs lignes restent exactement les tiens)
  // ---- fin ----
  ctx.onOpen(() => { ccOpen(); });
}
