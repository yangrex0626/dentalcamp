/* ============================================================
   臨床資料重建行動 — 應用邏輯
   ============================================================ */

const STORAGE_KEY = "a19_case_state_v1";

const els = {
  screenBrief: document.getElementById("screen-brief"),
  screenGame: document.getElementById("screen-game"),
  screenEnd: document.getElementById("screen-end"),
  briefingText: document.getElementById("briefing-text"),
  conventionsText: document.getElementById("conventions-text"),
  teamNameInput: document.getElementById("team-name-input"),
  startBtn: document.getElementById("start-btn"),
  teamFormErr: document.getElementById("team-form-err"),
  topbarTeam: document.getElementById("topbar-team"),
  timerDisplay: document.getElementById("timer-display"),
  sosBtn: document.getElementById("sos-btn"),
  sosCount: document.getElementById("sos-count"),
  progressTrack: document.getElementById("progress-track"),
  stagePanel: document.getElementById("stage-panel"),
  storyOverlay: document.getElementById("story-overlay"),
  storyTitle: document.getElementById("story-title"),
  storyText: document.getElementById("story-text"),
  storyNextBtn: document.getElementById("story-next-btn"),
  endPanel: document.getElementById("end-panel"),
  endSessionBtn: document.getElementById("end-session-btn"),
};

let state = {
  teamName: "",
  started: false,
  currentStage: 0,
  solved: STAGES.map(() => false),
  hintsUsed: STAGES.map(() => 0),
  sosUsedTotal: 0,
  finished: false,
  finishTimestamp: null,
  startTimestamp: null,
  decisionState: {},
  feedbackReported: false,
};

let timerInterval = null;

/* ---------- 狀態存取 ---------- */
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.started) return false;
    state = Object.assign(state, parsed);
    return true;
  } catch (e) { return false; }
}
function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

/* ---------- 初始化 ---------- */
function init() {
  initEmailJS();
  els.briefingText.innerHTML = BRIEFING_TEXT;
  els.conventionsText.innerHTML = CONVENTIONS_TEXT;

  const restored = loadState();
  if (restored && !state.finished) {
    enterGameScreen();
    return;
  }
  if (restored && state.finished) {
    enterEndScreen();
    return;
  }

  els.startBtn.addEventListener("click", handleStart);
  els.teamNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleStart();
  });
}

function handleStart() {
  const name = els.teamNameInput.value.trim();
  if (!name) {
    els.teamFormErr.textContent = "請先輸入隊名，才能啟動任務計時。";
    return;
  }
  state.teamName = name;
  state.started = true;
  state.startTimestamp = Date.now();
  saveState();
  enterGameScreen();
}

/* ---------- 畫面切換 ---------- */
function enterGameScreen() {
  els.screenBrief.classList.add("hidden");
  els.screenEnd.classList.add("hidden");
  els.screenGame.classList.remove("hidden");
  els.topbarTeam.textContent = `隊伍：${state.teamName}`;
  renderProgress();
  renderStage();
  updateSosUI();
  startTimer();
}

function enterEndScreen() {
  stopTimer();
  els.screenBrief.classList.add("hidden");
  els.screenGame.classList.add("hidden");
  els.screenEnd.classList.remove("hidden");
  renderEnd();
}

/* ---------- 計時器 ---------- */
function startTimer() {
  stopTimer();
  tickTimer();
  timerInterval = setInterval(tickTimer, 250);
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}
function tickTimer() {
  const elapsedSec = Math.max(0, Math.floor((Date.now() - state.startTimestamp) / 1000));
  renderTimer(elapsedSec);
}
function renderTimer(sec) {
  els.timerDisplay.textContent = formatDuration(sec);
}
function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ---------- 進度列 ---------- */
function renderProgress() {
  els.progressTrack.innerHTML = "";
  STAGES.forEach((stage, idx) => {
    const dot = document.createElement("div");
    dot.className = "progress-dot";
    if (state.solved[idx]) dot.className += " done";
    else if (idx === state.currentStage) dot.className += " current";
    dot.title = `${stage.code} ${stage.title}`;
    els.progressTrack.appendChild(dot);
  });
}

/* ---------- 關卡渲染 ---------- */
function renderStage() {
  const idx = state.currentStage;
  if (idx >= STAGES.length) {
    state.finished = true;
    state.finishTimestamp = Date.now();
    saveState();
    enterEndScreen();
    return;
  }
  const stage = STAGES[idx];

  let inputsHtml = "";
  if (stage.format === "pair") {
    inputsHtml = `
      <div class="input-row">
        <div class="input-group">
          <label>${stage.inputLabels[0]}</label>
          <input type="text" inputmode="numeric" id="ans-0" autocomplete="off">
        </div>
        <div class="input-group">
          <label>${stage.inputLabels[1]}</label>
          <input type="text" inputmode="numeric" id="ans-1" autocomplete="off">
        </div>
      </div>
    `;
  } else {
    const readonlyAttr = stage.decisionNodes ? "readonly" : "";
    const placeholderAttr = stage.decisionNodes ? `placeholder="完成右方決策樹後自動帶入"` : "";
    inputsHtml = `
      <div class="input-row">
        <div class="input-group single">
          <label>${stage.inputLabels[0]}</label>
          <input type="text" inputmode="numeric" id="ans-0" autocomplete="off" ${readonlyAttr} ${placeholderAttr}>
        </div>
      </div>
    `;
  }

  const hintsUsed = state.hintsUsed[idx];
  const hintHtml = hintsUsed > 0 ? `
    <div class="hint-panel">
      <h4>SOS 提示（本關已使用 ${hintsUsed} / ${stage.hints.length}）</h4>
      ${stage.hints.slice(0, hintsUsed).map((h, i) => `<div class="hint-item">提示 ${i + 1}：${h}</div>`).join("")}
    </div>
  ` : "";

  els.stagePanel.innerHTML = `
    <div class="case-tag">證物 ${stage.code} / ${STAGES.length}</div>
    <h2 class="title-serif">${stage.code} ${stage.title}</h2>
    <div class="subject-line">${stage.subject}</div>
    <div class="stage-intro">${stage.intro}</div>
    <details class="knowledge">
      <summary>展開背景知識</summary>
      <div class="kbody">${stage.background}</div>
    </details>
    <div class="task-body">${stage.task}</div>
    <div class="answer-zone">
      <div class="answer-zone-title">輸入驗證代碼</div>
      ${inputsHtml}
      <button class="submit-btn" id="submit-btn">送出驗證</button>
      <div class="feedback" id="feedback"></div>
    </div>
    ${hintHtml}
  `;

  if (stage.id === 5) {
    const chartHost = document.getElementById("stephan-chart-container");
    if (chartHost) chartHost.innerHTML = buildStephanSVG();
  }

  if (stage.decisionNodes) {
    renderDecisionTree(stage);
  }

  els.stagePanel.querySelectorAll(".data-table").forEach((table) => {
    const wrap = document.createElement("div");
    wrap.className = "table-scroll";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  document.getElementById("submit-btn").addEventListener("click", () => handleSubmit(stage));
  const inputs = els.stagePanel.querySelectorAll(".input-group input");
  inputs.forEach((inp) => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSubmit(stage);
    });
  });
}

function handleSubmit(stage) {
  const idx = state.currentStage;
  const fb = document.getElementById("feedback");
  let userAnswers = [];
  if (stage.format === "pair") {
    userAnswers = [
      document.getElementById("ans-0").value.trim(),
      document.getElementById("ans-1").value.trim(),
    ];
  } else {
    userAnswers = [document.getElementById("ans-0").value.trim()];
  }

  if (userAnswers.some((v) => v === "")) {
    fb.className = "feedback wrong";
    fb.textContent = "請完整填寫所有欄位後再送出。";
    return;
  }

  const correct = stage.answer.every((a, i) => normalizeAns(a) === normalizeAns(userAnswers[i]));

  if (correct) {
    state.solved[idx] = true;
    saveState();
    fb.className = "feedback correct";
    fb.textContent = "驗證成功！";
    showStoryOverlay(stage);
  } else {
    fb.className = "feedback wrong";
    fb.textContent = "驗證失敗，代碼不吻合，請再檢查一次計算過程。";
  }
}

function normalizeAns(v) {
  return String(v).trim().replace(/^0+(?=\d)/, "");
}

/* ---------- 過關劇情 ---------- */
function showStoryOverlay(stage) {
  const isLastStage = state.currentStage === STAGES.length - 1;
  els.storyTitle.textContent = `證物 ${stage.code} 驗證通過`;
  els.storyText.innerHTML = stage.story;
  els.storyNextBtn.textContent = isLastStage ? "完成調查" : "繼續調查";
  els.storyOverlay.classList.remove("hidden");

  const onNext = () => {
    els.storyOverlay.classList.add("hidden");
    els.storyNextBtn.removeEventListener("click", onNext);
    state.currentStage += 1;
    saveState();
    renderProgress();
    renderStage();
  };
  els.storyNextBtn.addEventListener("click", onNext);
}

/* ---------- SOS（次數不限） ---------- */
function updateSosUI() {
  els.sosCount.textContent = state.sosUsedTotal;
}
els.sosBtn.addEventListener("click", () => {
  const idx = state.currentStage;
  const stage = STAGES[idx];
  if (!stage) return;
  if (state.hintsUsed[idx] >= stage.hints.length) {
    const fb = document.getElementById("feedback");
    if (fb) {
      fb.className = "feedback wrong";
      fb.textContent = "這一關的提示已經全部用完了。";
    }
    return;
  }
  state.sosUsedTotal += 1;
  state.hintsUsed[idx] += 1;
  saveState();
  updateSosUI();
  renderStage();
});

/* ---------- 工作人員：密碼保護的共用操作（僅供檢查用，密碼非真正安全機制） ---------- */
const STAFF_PASSWORD = "940626";

const requireStaffPassword = (function setupStaffPasswordPrompt() {
  const panel = document.getElementById("staff-password-panel");
  const titleEl = document.getElementById("staff-password-title");
  const passwordInput = document.getElementById("staff-password-input");
  const errEl = document.getElementById("staff-password-err");
  const confirmBtn = document.getElementById("staff-password-confirm-btn");
  const cancelBtn = document.getElementById("staff-password-cancel-btn");
  if (!panel || !confirmBtn) return () => {};

  let pendingAction = null;

  const closePanel = () => { panel.classList.add("hidden"); pendingAction = null; };
  const doConfirm = () => {
    if (passwordInput.value !== STAFF_PASSWORD) {
      errEl.textContent = "密碼錯誤。";
      return;
    }
    const action = pendingAction;
    closePanel();
    if (action) action();
  };

  confirmBtn.addEventListener("click", doConfirm);
  cancelBtn.addEventListener("click", closePanel);
  passwordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doConfirm(); });
  panel.addEventListener("click", (e) => { if (e.target === panel) closePanel(); });

  return function requireStaffPassword(title, onConfirm) {
    pendingAction = onConfirm;
    titleEl.textContent = title;
    errEl.textContent = "";
    passwordInput.value = "";
    panel.classList.remove("hidden");
    passwordInput.focus();
  };
})();

/* ---------- 工作人員：提前結束任務 ---------- */
if (els.endSessionBtn) {
  els.endSessionBtn.addEventListener("click", () => {
    requireStaffPassword("工作人員專用：提前結束本隊任務", () => {
      state.finished = true;
      state.finishTimestamp = Date.now();
      saveState();
      enterEndScreen();
    });
  });
}

/* ---------- 重置任務（topbar，遊戲中隨時可用，連按兩次確認，不需密碼） ---------- */
const topbarResetBtn = document.getElementById("topbar-reset-btn");
if (topbarResetBtn) {
  topbarResetBtn.addEventListener("click", () => {
    if (topbarResetBtn.dataset.armed === "1") {
      clearState();
      window.location.reload();
      return;
    }
    topbarResetBtn.dataset.armed = "1";
    topbarResetBtn.textContent = "再按一次確認重置";
    setTimeout(() => {
      topbarResetBtn.dataset.armed = "0";
      topbarResetBtn.textContent = "重置任務";
    }, 4000);
  });
}

/* ---------- 工作人員：跳至指定關卡 ---------- */
(function setupStageJump() {
  const panel = document.getElementById("stage-jump-panel");
  const passwordInput = document.getElementById("jump-password");
  const stageInput = document.getElementById("jump-stage");
  const errEl = document.getElementById("jump-err");
  const confirmBtn = document.getElementById("jump-confirm-btn");
  const cancelBtn = document.getElementById("jump-cancel-btn");
  const openBriefBtn = document.getElementById("stage-jump-open-brief");
  const openGameBtn = document.getElementById("stage-jump-open-game");
  if (!panel || !confirmBtn) return;

  const openPanel = () => {
    errEl.textContent = "";
    passwordInput.value = "";
    stageInput.value = "";
    panel.classList.remove("hidden");
    passwordInput.focus();
  };
  const closePanel = () => panel.classList.add("hidden");

  if (openBriefBtn) openBriefBtn.addEventListener("click", openPanel);
  if (openGameBtn) openGameBtn.addEventListener("click", openPanel);
  cancelBtn.addEventListener("click", closePanel);
  panel.addEventListener("click", (e) => { if (e.target === panel) closePanel(); });

  const doJump = () => {
    if (passwordInput.value !== STAFF_PASSWORD) {
      errEl.textContent = "密碼錯誤。";
      return;
    }
    const n = parseInt(stageInput.value, 10);
    if (!n || n < 1 || n > STAGES.length) {
      errEl.textContent = `請輸入 1-${STAGES.length} 之間的關卡數。`;
      return;
    }
    const targetIdx = n - 1;
    if (!state.teamName) state.teamName = "工作人員測試";
    state.started = true;
    if (!state.startTimestamp) state.startTimestamp = Date.now();
    state.finished = false;
    state.finishTimestamp = null;
    state.solved = STAGES.map((_, i) => i < targetIdx);
    state.currentStage = targetIdx;
    saveState();
    closePanel();
    enterGameScreen();
  };
  confirmBtn.addEventListener("click", doJump);
  stageInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doJump(); });
  passwordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doJump(); });
})();

/* ---------- 互動決策樹（證物⑨等） ---------- */
function renderDecisionTree(stage) {
  const mount = document.getElementById("decision-tree-mount");
  if (!mount) return;

  if (!state.decisionState[stage.id]) {
    state.decisionState[stage.id] = { nodeIndex: 0, digits: [] };
  }
  const prog = state.decisionState[stage.id];

  let html = `<div class="decision-tree-ui">`;
  stage.decisionNodes.forEach((node, i) => {
    if (i < prog.nodeIndex) {
      html += `<div class="dnode dnode-done"><span class="dnode-check">✓</span> ${node.prompt} <span class="dnode-digit">${prog.digits[i]}</span></div>`;
    } else if (i === prog.nodeIndex) {
      html += `
        <div class="dnode dnode-active">
          <div class="dnode-prompt">${node.prompt}</div>
          <div class="dnode-options">
            ${node.options.map((opt, oi) => `<button type="button" class="dnode-opt-btn" data-node="${i}" data-opt="${oi}">${opt.label}</button>`).join("")}
          </div>
          <div class="dnode-feedback" id="dnode-feedback"></div>
        </div>
      `;
    } else {
      html += `<div class="dnode dnode-locked">${node.prompt}</div>`;
    }
  });
  html += `</div>`;
  mount.innerHTML = html;

  if (prog.nodeIndex >= stage.decisionNodes.length) {
    const ansInput = document.getElementById("ans-0");
    if (ansInput) ansInput.value = prog.digits.join("");
  }

  mount.querySelectorAll(".dnode-opt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ni = Number(btn.dataset.node);
      const oi = Number(btn.dataset.opt);
      const opt = stage.decisionNodes[ni].options[oi];
      if (opt.correct) {
        prog.digits[ni] = opt.digit;
        prog.nodeIndex = ni + 1;
        saveState();
        renderDecisionTree(stage);
      } else {
        const fb = document.getElementById("dnode-feedback");
        if (fb) {
          fb.textContent = opt.feedback;
          fb.classList.add("show");
        }
      }
    });
  });
}

/* ---------- Stephan 曲線 SVG ---------- */
function buildStephanSVG() {
  const W = 900, H = 460;
  const padL = 60, padR = 20, padT = 50, padB = 50;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const xMin = 0, xMax = STEPHAN_DOMAIN_END;
  const yMin = 4.85, yMax = 7.15;

  const xToPx = (x) => padL + (x - xMin) / (xMax - xMin) * plotW;
  const yToPx = (y) => padT + (yMax - y) / (yMax - yMin) * plotH;

  const samples = [];
  const step = 0.25;
  for (let t = xMin; t <= xMax + 1e-9; t += step) {
    samples.push([t, stephanEnvelopeAt(t)]);
  }

  const linePoints = samples.map(([t, y]) => `${xToPx(t).toFixed(1)},${yToPx(y).toFixed(1)}`).join(" ");

  // 危險區間（低於 5.5）分段多邊形
  const dangerPolys = [];
  let seg = [];
  samples.forEach(([t, y], i) => {
    if (y < 5.5) {
      seg.push([t, y]);
    } else if (seg.length) {
      dangerPolys.push(seg);
      seg = [];
    }
  });
  if (seg.length) dangerPolys.push(seg);

  const dangerPolyStr = dangerPolys.map((s) => {
    const top = s.map(([t, y]) => `${xToPx(t).toFixed(1)},${yToPx(y).toFixed(1)}`);
    const bottomStart = xToPx(s[s.length - 1][0]).toFixed(1) + "," + yToPx(5.5).toFixed(1);
    const bottomEnd = xToPx(s[0][0]).toFixed(1) + "," + yToPx(5.5).toFixed(1);
    return `<polygon points="${top.join(" ")} ${bottomStart} ${bottomEnd}" fill="var(--accent-red, #c23b2b)" fill-opacity="0.16" stroke="none"/>`;
  }).join("");

  // 格線
  let gridLines = "";
  for (let x = 0; x <= xMax; x += 5) {
    gridLines += `<line x1="${xToPx(x)}" y1="${padT}" x2="${xToPx(x)}" y2="${H - padB}" stroke="#243039" stroke-width="1"/>`;
    if (x % 10 === 0 || x === 0) {
      gridLines += `<text x="${xToPx(x)}" y="${H - padB + 20}" fill="#8ea0ab" font-size="12" text-anchor="middle" font-family="Consolas,monospace">${x}</text>`;
    }
  }
  for (let y = 5.0; y <= 7.0; y += 0.5) {
    gridLines += `<line x1="${padL}" y1="${yToPx(y)}" x2="${W - padR}" y2="${yToPx(y)}" stroke="#243039" stroke-width="1"/>`;
    gridLines += `<text x="${padL - 10}" y="${yToPx(y) + 4}" fill="#8ea0ab" font-size="12" text-anchor="end" font-family="Consolas,monospace">${y.toFixed(1)}</text>`;
  }

  // 進食標記線
  const feedMarks = STEPHAN_FEED_STARTS.map((s, i) => `
    <line x1="${xToPx(s)}" y1="${padT}" x2="${xToPx(s)}" y2="${H - padB}" stroke="#5c6b74" stroke-width="1" stroke-dasharray="3,3"/>
    <text x="${xToPx(s) + 4}" y="${padT + 14}" fill="#8ea0ab" font-size="12" font-family="'Noto Sans TC',sans-serif">第${i + 1}次進食</text>
  `).join("");

  const criticalY = yToPx(5.5);

  return `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${W}" height="${H}" fill="#0e1318"/>
      <text x="${W/2}" y="26" fill="#dfe6ea" font-size="16" text-anchor="middle" font-family="'Noto Serif TC',serif" font-weight="700">Stephan 曲線：三次點心攝取後的牙菌斑 pH 變化</text>
      ${gridLines}
      ${dangerPolyStr}
      <line x1="${padL}" y1="${criticalY}" x2="${W - padR}" y2="${criticalY}" stroke="#e8503c" stroke-width="2" stroke-dasharray="8,5"/>
      <text x="${W - padR}" y="${criticalY - 8}" fill="#e8503c" font-size="12" text-anchor="end" font-family="Consolas,monospace">臨界 pH = 5.5</text>
      ${feedMarks}
      <polyline points="${linePoints}" fill="none" stroke="#4dbfa8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      <text x="${padL}" y="${H - 12}" fill="#5c6b74" font-size="12" font-family="'Noto Sans TC',sans-serif">時間（分鐘）</text>
      <text x="${padL - 45}" y="${padT - 20}" fill="#5c6b74" font-size="12" font-family="'Noto Sans TC',sans-serif">pH 值</text>
    </svg>
  `;
}

/* ---------- 結局頁 ---------- */
function renderEnd() {
  const solvedCount = state.solved.filter(Boolean).length;
  const success = solvedCount === STAGES.length;

  const elapsedSec = Math.max(0, Math.round((state.finishTimestamp - state.startTimestamp) / 1000));
  const elapsedStr = formatDuration(elapsedSec);

  const now = new Date();
  const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

  if (success) {
    els.endPanel.innerHTML = `
      <div class="end-badge success">CASE CLOSED</div>
      <h1 class="end-title-only">結案：A19 病歷重建完成</h1>
      <p class="end-summary-text" style="color:var(--text-muted); font-size:14px;">隊伍「${escapeHtml(state.teamName)}」已完整重建${STAGES.length}份證物。</p>
      <div class="end-stats">
        <div class="stat-box"><div class="num">${elapsedStr}</div><div class="lbl">完成用時</div></div>
        <div class="stat-box"><div class="num">${state.sosUsedTotal}</div><div class="lbl">SOS 使用次數</div></div>
        <div class="stat-box"><div class="num">${STAGES.length} / ${STAGES.length}</div><div class="lbl">證物完成度</div></div>
      </div>
      <div class="panel report-panel">${FINAL_REPORT_HTML}</div>
      <div class="cert-btn-row">
        <button class="start-btn" id="print-cert-btn">下載隊伍完成證書 PDF</button>
      </div>
      ${buildCertificateHtml(elapsedStr, dateStr, true)}
      <div class="cert-btn-row"><button class="sos-btn" id="reset-game-btn">重置任務（下一隊使用）</button></div>
    `;
  } else {
    els.endPanel.innerHTML = `
      <div class="end-badge timeout">SESSION ENDED</div>
      <h1 class="end-title-only">任務提前結束</h1>
      <p class="end-summary-text" style="color:var(--text-muted); font-size:14px;">隊伍「${escapeHtml(state.teamName)}」完成了 ${solvedCount} / ${STAGES.length} 份證物的重建（任務由工作人員手動結束）。</p>
      <div class="end-stats">
        <div class="stat-box"><div class="num">${solvedCount} / ${STAGES.length}</div><div class="lbl">證物完成度</div></div>
        <div class="stat-box"><div class="num">${state.sosUsedTotal}</div><div class="lbl">SOS 使用次數</div></div>
      </div>
      <p class="end-summary-text" style="color:var(--text-muted); font-size:14px; max-width:520px; margin:0 auto 20px;">
        院方感謝各位小組的努力，這段調查歷程已列入紀錄。A19 的完整病歷將交由下一組繼續調查。
      </p>
      <div class="cert-btn-row">
        <button class="start-btn" id="print-cert-btn">下載任務參與證明 PDF</button>
      </div>
      ${buildCertificateHtml(elapsedStr, dateStr, false)}
      <div class="cert-btn-row"><button class="sos-btn" id="reset-game-btn">重置任務（下一隊使用）</button></div>
    `;
  }

  const printBtn = document.getElementById("print-cert-btn");
  if (printBtn) printBtn.addEventListener("click", () => downloadCertificatePdf(printBtn));

  const resetBtn = document.getElementById("reset-game-btn");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    if (resetBtn.dataset.armed === "1") {
      clearState();
      window.location.reload();
      return;
    }
    resetBtn.dataset.armed = "1";
    resetBtn.textContent = "再按一次確認重置（將清除此隊進度）";
    setTimeout(() => {
      resetBtn.dataset.armed = "0";
      resetBtn.textContent = "重置任務（下一隊使用）";
    }, 4000);
  });

  autoReportIfNeeded();
}

/* ---------- 測試回饋 ---------- */
function isEmailJSConfigured() {
  return typeof emailjs !== "undefined"
    && !EMAILJS_PUBLIC_KEY.startsWith("YOUR_")
    && !EMAILJS_SERVICE_ID.startsWith("YOUR_")
    && !EMAILJS_TEMPLATE_ID.startsWith("YOUR_");
}

function initEmailJS() {
  if (isEmailJSConfigured()) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
}

function buildFeedbackSummaryText(notes) {
  const solvedCount = state.solved.filter(Boolean).length;
  const elapsedSec = Math.max(0, Math.round((state.finishTimestamp - state.startTimestamp) / 1000));
  const now = new Date().toLocaleString("zh-TW");
  const lines = [
    "【臨床資料重建行動 測試回饋】",
    `隊名／暱稱：${state.teamName}`,
    `完成度：${solvedCount} / ${STAGES.length}`,
    `完成用時：${formatDuration(elapsedSec)}`,
    `SOS 使用次數：${state.sosUsedTotal}`,
    `瀏覽器：${navigator.userAgent}`,
    `螢幕尺寸：${screen.width}x${screen.height}（可視區域 ${window.innerWidth}x${window.innerHeight}）`,
    `語言設定：${navigator.language}`,
    `送出時間：${now}`,
  ];
  if (notes && notes.trim()) {
    lines.push("", "問題／建議：", notes.trim());
  }
  return lines.join("\n");
}

function autoReportIfNeeded() {
  if (!isEmailJSConfigured()) return;
  if (state.feedbackReported) return;
  const text = buildFeedbackSummaryText("");
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    team_name: state.teamName,
    message: text,
  }).then(() => {
    state.feedbackReported = true;
    saveState();
  }).catch(() => {
    // 靜默失敗，下次進到結局頁會再試一次（feedbackReported 沒被設為 true）
  });
}

function buildCertificateHtml(elapsedStr, dateStr, success) {
  return `
    <div class="certificate">
      <div class="cert-corner tl"></div><div class="cert-corner tr"></div>
      <div class="cert-corner bl"></div><div class="cert-corner br"></div>

      <div class="cert-content">
        ${CERT_SEAL_SVG}
        <div class="cert-course-badge">${COURSE_NAME}</div>
        <div class="cert-course-en">CRITICAL THINKING CHALLENGE</div>
        <div class="cert-activity-name">臨床資料重建行動</div>

        <div class="cert-title">${success ? "結案證明" : "任務參與證明"}</div>

        <div class="cert-team-label">茲證明</div>
        <div class="cert-team">${escapeHtml(state.teamName)}</div>
        <div class="cert-body">
          ${success
            ? `已完整重建病患 A19 的${STAGES.length}份臨床證物，成功產出診斷報告，展現嚴謹的臨床推理能力，特此證明。`
            : "已參與病患 A19 病歷重建任務，並完成部分證物重建，特此證明。"}
        </div>
        <div class="cert-meta">
          <div><strong>${elapsedStr}</strong>${success ? "完成用時" : "任務時長"}</div>
          <div><strong>${state.solved.filter(Boolean).length} / ${STAGES.length}</strong>證物完成度</div>
          <div><strong>${dateStr}</strong>日期</div>
        </div>

        <div class="cert-signoff">
          <div class="sig-block">
            <span class="sig-name">${SIGNATORY_NAME}</span>
            <span class="sig-line"></span>
            <span class="sig-caption">課程負責人簽章</span>
          </div>
          <div class="sig-block sig-date">
            <span class="sig-camp-name">${CAMP_NAME}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- 證書 PDF 下載（前端直接產生，避開各家瀏覽器「列印」的排版差異） ---------- */
async function downloadCertificatePdf(triggerBtn) {
  const liveCert = document.querySelector(".certificate");
  if (!liveCert || !window.html2canvas || !window.jspdf) return;

  const originalLabel = triggerBtn.textContent;
  triggerBtn.disabled = true;
  triggerBtn.textContent = "產生 PDF 中，請稍候…";

  // 不論裝置螢幕多窄，都用固定的寬版尺寸重新畫一份證書來截圖，
  // 這樣手機下載的 PDF 才會跟電腦上看到的比例一致，不會變成又窄又長的一條。
  const offscreen = document.createElement("div");
  offscreen.style.cssText = "position:fixed; left:-9999px; top:0; width:700px; pointer-events:none;";
  const clone = liveCert.cloneNode(true);
  clone.style.width = "700px";
  clone.style.maxWidth = "none";
  clone.style.margin = "0";
  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const canvas = await window.html2canvas(clone, {
      scale: 2,
      backgroundColor: "#f9f3e4",
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // PDF 頁面大小直接跟著證書本身的比例走（不用 A4），下載出來就是證書原本的樣子，沒有多餘留白。
    const margin = 8;
    const imgW = 190;
    const imgH = imgW * (canvas.height / canvas.width);
    const pageW = imgW + margin * 2;
    const pageH = imgH + margin * 2;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: pageH >= pageW ? "portrait" : "landscape",
      unit: "mm",
      format: [pageW, pageH],
    });
    doc.addImage(imgData, "JPEG", margin, margin, imgW, imgH);

    const safeTeamName = String(state.teamName).replace(/[\\/:*?"<>|]/g, "_") || "隊伍";
    doc.save(`臨床資料重建行動證書_${safeTeamName}.pdf`);
  } catch (err) {
    console.error(err);
    alert("PDF 產生失敗，請稍後再試一次。");
  } finally {
    document.body.removeChild(offscreen);
    triggerBtn.disabled = false;
    triggerBtn.textContent = originalLabel;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

init();
