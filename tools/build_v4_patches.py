# ---- V4 patches applied on top of the v3 build (s is the whole HTML) ----
# 1. Stage speeds: faster base and cap, stage over stage
for old,new in [
 ('v0: 230, ramp: 4.0, vmax: 520, length: 13000, gapMul: 1.3, harpEdge: 0.9,', 'v0: 260, ramp: 5.0, vmax: 560, length: 14000, gapMul: 1.3, harpEdge: 0.9,'),
 ('v0: 255, ramp: 5.0, vmax: 600, length: 16000, gapMul: 1.15, harpEdge: 1.2,', 'v0: 330, ramp: 6.0, vmax: 670, length: 17500, gapMul: 1.15, harpEdge: 1.2,'),
 ('v0: 275, ramp: 5.5, vmax: 660, length: 19000, gapMul: 1.05, harpEdge: 1.5,', 'v0: 400, ramp: 7.0, vmax: 780, length: 21000, gapMul: 1.05, harpEdge: 1.5,'),
 ('v0: 295, ramp: 6.0, vmax: 730, length: 22000, gapMul: 0.95, harpEdge: 1.8,', 'v0: 470, ramp: 8.0, vmax: 890, length: 25000, gapMul: 0.95, harpEdge: 1.8,'),
 ('v0: 320, ramp: 7.0, vmax: 820, length: 26000, gapMul: 0.85, harpEdge: 2.2,', 'v0: 550, ramp: 9.0, vmax: 1010, length: 30000, gapMul: 0.88, harpEdge: 2.2,'),
]: rep(old,new)

# 2. Medals: tuned from the autopilot (clean expert run = gold line); rival pace from the medal band
rep('''      STAGES.forEach((st) => {
        st.T0 = baseTime(st);
        const boostSave = (CONFIG.boostSpeedBonus * CONFIG.boostDuration) / speedAt(st, st.T0 * 0.5);
        st.gold = Math.floor((st.T0 - boostSave * 1.8) * 10) / 10;
        st.silver = Math.floor((st.T0 - boostSave * 0.8) * 10) / 10;
        st.bronze = Math.ceil((st.T0 + 0.4) * 10) / 10;
        st.harpTime = st.T0 - st.harpEdge;
      });
      function medalFor(st, t) { return t <= st.gold ? "gold" : t <= st.silver ? "silver" : t <= st.bronze ? "bronze" : "none"; }''',
'''      // V4 medal lines (seconds). Gold = a clean, boosted, cell-hungry run. The clock never stops.
      const MEDALS_V4 = __MEDALS__;
      STAGES.forEach((st, i) => {
        st.T0 = baseTime(st);
        const m = MEDALS_V4[i];
        st.gold = m.gold; st.silver = m.silver; st.bronze = m.bronze;
        st.harpTime = m.harp;
      });
      // Any wipeout in the stage caps the medal at silver.
      function medalFor(st, t, wipes) {
        const m = t <= st.gold ? "gold" : t <= st.silver ? "silver" : t <= st.bronze ? "bronze" : "none";
        return m === "gold" && wipes > 0 ? "silver" : m;
      }''')

# 3. New save keys (v3 golds were too easy); carry over unlocks, lore, intro and name from v3.
rep('''      const SAVE_KEY = "ripboard_runner_v3_save";
      const LB_KEY = "ripboard_runner_v3_leaderboard";''','''      const SAVE_KEY = "ripboard_runner_v4_save";
      const LB_KEY = "ripboard_runner_v4_leaderboard";''')
rep('''      let SAVE = Object.assign(defaultSave(), loadJSON(SAVE_KEY, {}));''','''      let SAVE = Object.assign(defaultSave(), loadJSON(SAVE_KEY, {}));
      (() => {
        if (localStorage.getItem(SAVE_KEY)) return;
        const v3 = loadJSON("ripboard_runner_v3_save", null);
        if (v3) Object.assign(SAVE, { unlocked: v3.unlocked || 1, lore: v3.lore || {}, introSeen: !!v3.introSeen, finished: !!v3.finished, name: v3.name || "Jinhua" });
      })();''')

# 4. Screens list
rep('''"stages-screen", "gallery-screen", "lb-screen", "settings-screen", "credits", "endcard"];''','''"stages-screen", "gallery-screen", "lb-screen", "settings-screen", "credits", "endcard", "sr-screen"];''')

# 5. HUD: level pill + speedrun splits + level flash layer
rep('''        <div id="hud-cells" class="hud-pill cells">CELLS 0</div>''','''        <div id="hud-cells" class="hud-pill cells">CELLS 0</div>
        <div id="hud-level" class="hud-pill lvl" style="display:none"><span id="lv-num">LV 1</span><span class="lvbar"><i id="lv-fill"></i></span><span id="lv-cells">0/4</span><span id="lv-spd"></span></div>''')
rep('''    <div id="boost-vignette"></div>''','''    <div id="boost-vignette"></div>
    <div id="lv-flash"></div>
    <div id="sr-splits"></div>''')

# 6. Collision: sprite-matched hitboxes, everything jumpable, respawn instead of game over in campaign
rep('''          const halfW = ob.w * 0.42;
          const hitX = Math.abs(ob.x - playerX) < halfW + 14;
          const clearedByJump = ob.jumpable && p.jumpY < -34;''','''          const hb = obstacleHitbox(ob);
          const hitX = playerX + PLAYER_HALF_W > hb.x0 && playerX - PLAYER_HALF_W < hb.x1;
          const clearedByJump = -p.jumpY >= hb.h; // V4: every obstacle can be jumped''')
rep('''          if (laneDist < 0.42 && hitX && !clearedByJump && !DEBUG.god) {''','''          if (laneDist < 0.42 && hitX && !clearedByJump && !DEBUG.god && !(STATE.invuln > 0) && !(STATE.down > 0)) {''')
rep('''            endGame("wipeout");
            return;''','''            if (STATE.gameType === "campaign") { campaignWipe(); return; }
            endGame("wipeout");
            return;''')

# 7. Speed: per-stage ramp to a level-raised cap; boost scales with level; wipeout freezes the board
rep('''        STATE.speed = stg ? Math.min(stg.vmax, STATE.speed + stg.ramp * dt) : Math.min(CONFIG.maxSpeed, STATE.speed + CONFIG.speedRampPerSec * dt);''',
'''        if (stg) wipeTick(dt);
        STATE.speed = stg ? Math.min(speedCap(stg), STATE.speed + rampNow(stg) * dt) : Math.min(CONFIG.maxSpeed, STATE.speed + CONFIG.speedRampPerSec * dt);''')
rep('''        const activeSpeed = STATE.speed + (STATE.boostTime > 0 ? CONFIG.boostSpeedBonus : 0);
        if (stg && campaignTick(dt, activeSpeed)) return;''','''        const activeSpeed = STATE.down > 0 ? 0 : STATE.speed + (STATE.boostTime > 0 ? boostBonus() : 0);
        if (stg && campaignTick(dt, activeSpeed)) return;''')
rep('''        const renderSpeed = STATE.speed + (STATE.boostTime > 0 ? CONFIG.boostSpeedBonus : 0);''','''        const renderSpeed = STATE.down > 0 ? 0 : STATE.speed + (STATE.boostTime > 0 ? boostBonus() : 0);''')
# spawn spacing scales with speed; speedFactor clamped so gaps never collapse at high level
rep('''          const speedFactor = (STATE.speed - CONFIG.baseSpeed) / (CONFIG.maxSpeed - CONFIG.baseSpeed);''','''          const speedFactor = Math.max(0, Math.min(1, (STATE.speed - CONFIG.baseSpeed) / (CONFIG.maxSpeed - CONFIG.baseSpeed)));''')
rep('''          STATE.nextObstacleIn = (minGap + Math.random() * Math.max(0.2, maxGap - minGap)) * (stg ? stg.gapMul : 1);''','''          STATE.nextObstacleIn = (minGap + Math.random() * Math.max(0.2, maxGap - minGap)) * (stg ? stg.gapMul * obstacleGapScale(activeSpeed) : 1);''')
# cells feed the power meter
rep('''            STATE.boostCharge = Math.min(CONFIG.boostCellsRequired, STATE.boostCharge + 1);
            audio.cell();''','''            STATE.boostCharge = Math.min(CONFIG.boostCellsRequired, STATE.boostCharge + 1);
            if (powerOn()) powerCell();
            audio.cell();''')
# blink while down / invulnerable
rep('''        drawJinhua(px, py, STATE.player);''','''        const blink = (STATE.down > 0 || STATE.invuln > 0) && Math.floor(STATE.elapsed * 16) % 2 === 0;
        if (!blink || STATE.mode !== "playing") drawJinhua(px, py, STATE.player);''')

# 8. HUD text
rep('''          hudTimerEl.textContent = `STAGE ${STATE.stageIdx + 1} • ${fmtClock(STATE.stageTime)}`;''','''          hudTimerEl.textContent = STATE.speedrun
            ? `RUN ${fmtClock(STATE.srTime)} • S${STATE.stageIdx + 1}`
            : `STAGE ${STATE.stageIdx + 1} • ${fmtClock(STATE.stageTime)}${STATE.deaths ? ` • ✖${STATE.deaths}` : ""}`;
          if (STATE.speedrun) { const lv = document.getElementById("sp-live"); if (lv) lv.textContent = fmtClock(STATE.srTime); }''')
rep('''        hudCellsEl.textContent = `CELLS ${STATE.cellsCollected}`;''','''        hudCellsEl.textContent = `CELLS ${STATE.cellsCollected}`;
        updatePowerHUD();''')

# 9. Campaign flow: startStage resets, campaignTick clocks + speedrun hand-off, stage clear medal rule
rep('''      function startStage(i) {
        audio.init();
        STATE.gameType = "campaign";''','''      function startStage(i, opts) {
        audio.init();
        STATE.gameType = "campaign";
        if (!(opts && opts.sr)) { STATE.speedrun = false; document.body.classList.remove("speedrun"); }
        STATE.power = { lv: 1, cells: 0, peak: 1 };
        STATE.deaths = 0; STATE.down = 0; STATE.invuln = 0; STATE.topSpeed = 0;''')
rep('''        STATE.stageTime += dt;
        STATE.dist += activeSpeed * dt;''','''        STATE.stageTime += dt;
        if (STATE.speedrun) STATE.srTime += dt;
        STATE.dist += activeSpeed * dt;''')
rep('''        if (STATE.dist >= st.length) { stageClear(); return true; }
        return false;''','''        if (STATE.dist >= st.length) {
          if (STATE.speedrun) { srSplit(); return true; }
          if (STATE.sim) { STATE.simDone = true; STATE.mode = "stageclear"; return true; }
          stageClear(); return true;
        }
        return false;''')
rep('''        const medal = medalFor(st, t);''','''        const medal = medalFor(st, t, STATE.deaths);''')
rep('''        const entry = { n: SAVE.name || "Jinhua", t, m: medal, h: beatHarp ? 1 : 0, d: new Date().toISOString().slice(0, 10) };''','''        const entry = { n: SAVE.name || "Jinhua", t, m: medal, h: beatHarp ? 1 : 0, w: STATE.deaths, d: new Date().toISOString().slice(0, 10) };''')
rep('''          `Cells ${STATE.cellsCollected} • Passes ${STATE.harpreetPasses}`,''','''          `Cells ${STATE.cellsCollected} • Peak level ${STATE.power.peak} • Passes ${STATE.harpreetPasses}`,
          STATE.deaths ? `Wipeouts ${STATE.deaths}. The clock kept running. Gold needs a clean run.` : "Clean run. No wipeouts.",''')
rep('''          html += `<table class="lb-table"><tr><th>#</th><th>Name</th><th>Time</th><th>Medal</th><th>Rival</th></tr>` +
            list.map((e, r) => `<tr><td>${r + 1}</td><td>${esc(e.n)}</td><td>${fmtClock(e.t)}</td><td><i class="medal ${e.m}"></i></td><td>${e.h ? "Beat" : "--"}</td></tr>`).join("") + `</table>`;''','''          html += `<table class="lb-table"><tr><th>#</th><th>Name</th><th>Time</th><th>Medal</th><th>Wipeouts</th><th>Rival</th></tr>` +
            list.map((e, r) => `<tr><td>${r + 1}</td><td>${esc(e.n)}</td><td>${fmtClock(e.t)}</td><td><i class="medal ${e.m}"></i></td><td>${e.w || 0}</td><td>${e.h ? "Beat" : "--"}</td></tr>`).join("") + `</table>`;''')
rep('''        html += `<div class="k-hint">Saved on this device only.</div>`;
        $("lb-body").innerHTML = html;''','''        html = speedrunLBHTML() + html;
        html += `<div class="k-hint">Saved on this device only.</div>`;
        $("lb-body").innerHTML = html;''')
rep('''        if (!confirm("Reset story progress, medals, lore and leaderboard on this device?")) return;
        SAVE = defaultSave(); LB = { stages: {} }; persist(); refreshTitle();''','''        if (!confirm("Reset story progress, medals, lore, speedrun and leaderboards on this device?")) return;
        SAVE = defaultSave(); LB = { stages: {} }; persist(); SR = { best: null, bestSplits: [], lb: [] }; persistSR(); refreshTitle();''')
# pause / restart / quit in speedrun
rep('''        $("pause-where").textContent = STATE.gameType === "campaign" ? `Stage ${STATE.stageIdx + 1} • ${STAGES[STATE.stageIdx].name} • ${fmtClock(STATE.stageTime)}` : "Free Ride";''','''        $("pause-where").textContent = STATE.speedrun ? `Speedrun • Stage ${STATE.stageIdx + 1} • ${fmtClock(STATE.srTime)}` : STATE.gameType === "campaign" ? `Stage ${STATE.stageIdx + 1} • ${STAGES[STATE.stageIdx].name} • ${fmtClock(STATE.stageTime)}` : "Free Ride";''')
rep('''        if (STATE.gameType === "campaign") startStage(STATE.stageIdx);
        else startGame();''','''        if (STATE.speedrun) startSpeedrun();
        else if (STATE.gameType === "campaign") startStage(STATE.stageIdx);
        else startGame();''')
rep('''      function goTitle() {
        STATE.mode = "title";''','''      function goTitle() {
        STATE.speedrun = false; document.body.classList.remove("speedrun");
        STATE.mode = "title";''')

# 10. Debug hooks
rep('''          skip() { if (STATE.mode === "cutscene" || STATE.mode === "ending") csFinish(); }''','''          skip() { if (STATE.mode === "cutscene" || STATE.mode === "ending") csFinish(); },
          speedrun() { startSpeedrun(); },
          clearance(speeds) { return jumpClearanceReport(speeds || [260, 560, 1010, 1700]); },
          sim(i, skill) { return simStage(i, skill || { cells: true, boost: true }); },
          simRun(skill) { return simStage(0, skill || { cells: true, boost: true }, true); },
          fastForward(sec, skill) { const sk = skill || { cells: true, boost: true }; for (let k = 0; k < sec * 60 && STATE.mode === "playing"; k++) { aiTick(sk); update(1 / 60); } return STATE.mode; },
          wipe() { if (STATE.gameType === "campaign" && STATE.mode === "playing") campaignWipe(); },
          addCells(n) { for (let k = 0; k < n; k++) { STATE.cellsCollected++; STATE.boostCharge = Math.min(CONFIG.boostCellsRequired, STATE.boostCharge + 1); powerCell(); } },
          POWER, cellsToNext'''.replace("          POWER, cellsToNext","          get power() { return { POWER, thresholds: Array.from({ length: 12 }, (_, k) => cellsToNext(k + 1)) }; }"))
import json, os
mp='/workspace/ripboard-runner/v4-medals.json'
med=json.load(open(mp)) if os.path.exists(mp) else [{"gold":40,"silver":45,"bronze":52,"harp":43}]*5
rep('__MEDALS__', json.dumps(med))
