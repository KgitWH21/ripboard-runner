      /* =======================================================================
         V4. FAIR HITBOXES, CELL POWER LEVELS, CONTINUOUS CLOCK, SPEEDRUN
         ======================================================================= */
      // ---- Hitboxes: match the visible sprite, a little forgiving ----
      // x0/x1 are the sprite's horizontal extents (relative to ob.x) shrunk a few px;
      // h is how high (px) the board must rise to clear it: visible top minus ~10px grace.
      const PLAYER_HALF_W = 12;
      const HITBOX = {
        hole:    (w) => ({ l: -w * 0.5 + 12, r: w * 0.5 - 12, h: 22, top: 0 }),
        walkers: ()  => ({ l: -19, r: 19, h: 39, top: 53 }),
        cyclist: ()  => ({ l: -24, r: 24, h: 43, top: 57 }),
        truck:   (w) => ({ l: -w * 0.48 - 20, r: w * 0.18 - 4, h: 42, top: 56 })
      };
      function obstacleHitbox(ob) {
        const b = (HITBOX[ob.type] || HITBOX.walkers)(ob.w);
        return { x0: ob.x + b.l, x1: ob.x + b.r, h: b.h };
      }
      // Programmatic clearance check: can a plain jump (no boost) clear every obstacle type?
      function jumpClearanceReport(speeds) {
        const v = -CONFIG.jumpVelocity, g = CONFIG.gravity;
        const apex = (v * v) / (2 * g), air = (2 * v) / g;
        const rows = [];
        const types = { hole: 88, walkers: 66, cyclist: 66, truck: 112 };
        Object.keys(types).forEach((type) => {
          const w = types[type];
          const b = HITBOX[type](w);
          const disc = v * v - 2 * g * b.h;
          const tUp = (v - Math.sqrt(disc)) / g, tDown = (v + Math.sqrt(disc)) / g;
          const window = tDown - tUp; // seconds the board is above the clearance height
          const span = (b.r - b.l) + PLAYER_HALF_W * 2; // px of overlap to fly over
          speeds.forEach((sp) => {
            const rel = type === "truck" ? sp * 1.12 : sp;
            const need = span / rel;
            rows.push({ type, speed: Math.round(sp), clearH: b.h, visibleTop: b.top, apex: +apex.toFixed(1), heightMargin: +(apex - b.h).toFixed(1),
              airWindow: +window.toFixed(3), overlapTime: +need.toFixed(3), timingSlack: +(window - need).toFixed(3), ok: window - need > 0.05 && apex - b.h > 40 });
          });
        });
        return { apex: +apex.toFixed(1), airtime: +air.toFixed(3), rows, allOk: rows.every((r) => r.ok) };
      }

      // ---- Cell power levels (Gradius-style) ----
      // Every cell fills the meter. Level L -> L+1 needs 4 + 2(L-1) cells: 4, 6, 8, 10, 12 ... (no cap).
      // Each level: +70 px/s to the stage's max speed, +40 px/s surge, +30 px/s boost, faster ramp.
      const POWER = { base: 4, step: 2, vmaxPer: 70, surge: 40, boostPer: 30, rampPer: 0.35 };
      function cellsToNext(lv) { return POWER.base + POWER.step * (lv - 1); }
      function powerOn() { return STATE.gameType === "campaign"; }
      function curLv() { return powerOn() && STATE.power ? STATE.power.lv : 1; }
      function speedCap(st) { return st.vmax + POWER.vmaxPer * (curLv() - 1); }
      function rampNow(st) { return st.ramp * (1 + POWER.rampPer * (curLv() - 1)); }
      function boostBonus() { return CONFIG.boostSpeedBonus + POWER.boostPer * (curLv() - 1); }
      function powerCell() {
        const pw = STATE.power;
        pw.cells += 1;
        if (pw.cells >= cellsToNext(pw.lv)) {
          pw.cells = 0;
          pw.lv += 1;
          pw.peak = Math.max(pw.peak, pw.lv);
          STATE.speed += POWER.surge;
          sfxLevelUp();
          const lvEl = $("hud-level");
          lvEl.classList.remove("flash"); void lvEl.offsetWidth; lvEl.classList.add("flash");
          $("lv-flash").classList.remove("go"); void $("lv-flash").offsetWidth; $("lv-flash").classList.add("go");
          const y = getRoadMetrics().laneCenterY(STATE.player.lanePos) - 62;
          spawnPopup(getPlayerX() + 24, y, `LEVEL ${pw.lv}! MAX SPEED UP`, "#e3bd62");
          spawnBurst(getPlayerX(), y + 20, "#e3bd62", 20);
        }
      }
      function sfxLevelUp() {
        [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => audio.playTone(f, f * 1.25, 0.12, "square", 0.06), i * 50));
        setTimeout(() => audio.playTone(1568, 2093, 0.25, "triangle", 0.08), 260);
      }
      function updatePowerHUD() {
        const el = $("hud-level");
        if (!powerOn() || !STATE.power) { el.style.display = "none"; return; }
        el.style.display = "";
        const pw = STATE.power;
        $("lv-num").textContent = `LV ${pw.lv}`;
        $("lv-fill").style.width = `${Math.round((pw.cells / cellsToNext(pw.lv)) * 100)}%`;
        $("lv-cells").textContent = `${pw.cells}/${cellsToNext(pw.lv)}`;
        const sp = STATE.down > 0 ? 0 : STATE.speed + (STATE.boostTime > 0 ? boostBonus() : 0);
        $("lv-spd").textContent = `${Math.round(sp / 20 * 3.6)} km/h`;
        STATE.topSpeed = Math.max(STATE.topSpeed || 0, sp);
      }

      // ---- Death rule: the clock never stops ----
      // A wipeout costs: 1.2s down (board stopped, clock running), speed back to the stage start,
      // boost charge emptied, and one power level lost (Gradius-style). Then 1.6s of blink invulnerability.
      // Any wipeout in a stage rules out gold for that stage.
      const WIPE = { down: 1.2, invuln: 1.6 };
      function campaignWipe() {
        const p = STATE.player;
        const st = STAGES[STATE.stageIdx];
        STATE.deaths += 1;
        STATE.srDeaths = (STATE.srDeaths || 0) + (STATE.speedrun ? 1 : 0);
        STATE.down = WIPE.down;
        const pw = STATE.power;
        const lost = pw.lv > 1;
        pw.lv = Math.max(1, pw.lv - 1);
        pw.cells = 0;
        STATE.boostCharge = 0;
        STATE.boostTime = 0;
        STATE.speed = st.v0;
        p.jumpY = 0; p.jumpVy = 0; p.grounded = true;
        const px = getPlayerX();
        STATE.obstacles = STATE.obstacles.filter((o) => o.x < px - 70 || o.x > px + 760);
        canvas.classList.remove("boosting");
        boostVignetteEl.classList.remove("active");
        const y = getRoadMetrics().laneCenterY(p.lanePos) - 56;
        spawnPopup(px + 24, y, lost ? `WIPEOUT • DOWN TO LV ${pw.lv}` : "WIPEOUT", CONFIG.colors.neonPink);
        STATE.harpreet.taunt = "Wow, crazy wipeout. You okay?";
        STATE.harpreet.tauntTimer = 2.2;
      }
      function wipeTick(dt) {
        if (STATE.down > 0) {
          STATE.down = Math.max(0, STATE.down - dt);
          STATE.nextObstacleIn = Math.max(STATE.nextObstacleIn, 0.9);
          STATE.nextCellIn = Math.max(STATE.nextCellIn, 0.6);
          if (STATE.down === 0) STATE.invuln = WIPE.invuln;
        } else if (STATE.invuln > 0) {
          STATE.invuln = Math.max(0, STATE.invuln - dt);
        }
      }
      function obstacleGapScale(activeSpeed) {
        // Keep reaction time readable at "crazy" speeds: above 900 px/s the time between waves grows,
        // so pixel spacing grows faster than speed.
        return 1 + Math.max(0, activeSpeed - 900) / 2000;
      }

      // ---- Speedrun mode: all five stages, one clock, no story ----
      const SR_KEY = "ripboard_runner_v4_speedrun";
      let SR = Object.assign({ best: null, bestSplits: [], lb: [] }, loadJSON(SR_KEY, {}));
      function persistSR() { saveJSON(SR_KEY, SR); }
      function startSpeedrun() {
        audio.init();
        STATE.speedrun = true;
        STATE.srTime = 0;
        STATE.srSplits = [];
        STATE.srDeaths = 0;
        document.body.classList.add("speedrun");
        startStage(0, { sr: true });
        STATE.zoneBanner = { text: "SPEEDRUN • Stage 1 • " + STAGES[0].name, timer: 2.4 };
        renderSplits();
      }
      function srSplit() {
        const t = Math.round(STATE.stageTime * 100) / 100;
        STATE.srSplits.push(t);
        audio.pass();
        const i = STATE.stageIdx;
        if (i + 1 >= STAGES.length) { srFinish(); return; }
        // Seamless hand-off to the next stage: keep power level, speed and boost.
        const keepSpeed = STATE.speed;
        STATE.stageIdx = i + 1;
        const st = STAGES[i + 1];
        STATE.speed = Math.max(st.v0, keepSpeed);
        STATE.dist = 0; STATE.stageTime = 0; STATE.harpDist = 0; STATE.harpFinishedAt = -1;
        STATE.scrap = null; STATE.scrapSpawned = false; STATE.scrapGot = false;
        STATE.prevRel = 1; STATE.passCooldown = 0; STATE.deaths = 0;
        STATE.obstacles = []; STATE.nextObstacleIn = 0.9;
        const d = SR.bestSplits.length > i ? cum(STATE.srSplits) - cum(SR.bestSplits.slice(0, i + 1)) : null;
        STATE.zoneBanner = { text: `Stage ${i + 2} • ${st.name}${d === null ? "" : `  (${fmtDelta(d)})`}`, timer: 2.4 };
        STATE.harpreet.taunt = st.taunt; STATE.harpreet.tauntTimer = 2.4;
        if (trackIndex !== st.track) setTrack(st.track); else syncMusicPlayback();
        renderSplits();
      }
      function cum(a) { return a.reduce((x, y) => x + y, 0); }
      function fmtDelta(d) { return `${d <= 0 ? "-" : "+"}${Math.abs(d).toFixed(1)}`; }
      function renderSplits() {
        const box = $("sr-splits");
        if (!STATE.speedrun) { box.innerHTML = ""; return; }
        let acc = 0;
        box.innerHTML = STAGES.map((st, i) => {
          const done = i < STATE.srSplits.length;
          const cur = i === STATE.srSplits.length;
          if (done) acc += STATE.srSplits[i];
          let delta = "";
          if (done && SR.bestSplits.length === STAGES.length) {
            const d = acc - cum(SR.bestSplits.slice(0, i + 1));
            delta = `<b class="${d <= 0 ? "ahead" : "behind"}">${fmtDelta(d)}</b>`;
          }
          return `<div class="sp ${done ? "done" : ""} ${cur ? "cur" : ""}"><span>${i + 1}. ${st.name}</span><span>${done ? fmtClock(acc) : cur ? '<i id="sp-live">--</i>' : "--"}</span>${delta}</div>`;
        }).join("");
      }
      function srFinish() {
        STATE.mode = "stageclear";
        if (STATE.sim) return;
        canvas.classList.remove("boosting");
        boostVignetteEl.classList.remove("active");
        const total = Math.round(cum(STATE.srSplits) * 100) / 100;
        const prev = SR.best;
        const isPB = !prev || total < prev.t;
        const prevSplits = SR.bestSplits.slice();
        if (isPB) { SR.best = { t: total, splits: STATE.srSplits.slice(), d: new Date().toISOString().slice(0, 10) }; SR.bestSplits = STATE.srSplits.slice(); }
        const entry = { n: SAVE.name || "Jinhua", t: total, w: STATE.srDeaths || 0, lv: STATE.power.peak, d: new Date().toISOString().slice(0, 10) };
        SR.lb.push(entry); SR.lb.sort((a, b) => a.t - b.t); SR.lb = SR.lb.slice(0, 10);
        STATE.lastSrEntry = SR.lb.includes(entry) ? entry : null;
        persistSR();
        $("sr-total").textContent = fmtClock(total);
        $("sr-pb").textContent = isPB ? (prev ? `New personal best! (${fmtDelta(total - prev.t)})` : "First finish-- personal best set.") : `Best ${fmtClock(prev.t)} (${fmtDelta(total - prev.t)})`;
        let acc = 0, pacc = 0;
        $("sr-table").innerHTML = `<tr><th>Stage</th><th>Split</th><th>Total</th><th>vs PB</th></tr>` + STATE.srSplits.map((s, i) => {
          acc += s; pacc += prevSplits[i] || 0;
          const d = prevSplits.length === STAGES.length ? fmtDelta(acc - pacc) : "--";
          return `<tr><td>${i + 1}. ${STAGES[i].name}</td><td>${s.toFixed(2)}</td><td>${fmtClock(acc)}</td><td class="${d.startsWith("-") ? "ahead" : d === "--" ? "" : "behind"}">${d}</td></tr>`;
        }).join("");
        $("sr-facts").textContent = `Wipeouts ${STATE.srDeaths || 0} • Peak level ${STATE.power.peak} • Top speed ${Math.round((STATE.topSpeed || 0) / 20 * 3.6)} km/h • Cells ${STATE.cellsCollected}`;
        $("sr-name").value = SAVE.name || "Jinhua";
        renderSplits();
        showScreen("sr-screen");
        syncMusicPlayback();
      }
      $("sr-name").addEventListener("input", (e) => {
        const v = e.target.value.trim().slice(0, 12) || "Jinhua";
        SAVE.name = v; if (STATE.lastSrEntry) STATE.lastSrEntry.n = v;
        persist(); persistSR();
      });
      $("sr-name").addEventListener("keydown", (e) => e.stopPropagation());
      $("sr-again").addEventListener("click", startSpeedrun);
      $("sr-lb").addEventListener("click", () => { endSpeedrunUI(); openMenu("lb-screen"); });
      $("sr-title").addEventListener("click", () => { endSpeedrunUI(); goTitle(); });
      $("btn-speedrun").addEventListener("click", startSpeedrun);
      function endSpeedrunUI() { STATE.speedrun = false; document.body.classList.remove("speedrun"); }
      function speedrunLBHTML() {
        let html = `<div class="lb-stage">Speedrun: full campaign, one clock</div>`;
        if (!SR.lb.length) return html + `<div class="k-hint">No runs yet. Try Speedrun from the title screen.</div>`;
        html += `<table class="lb-table"><tr><th>#</th><th>Name</th><th>Time</th><th>Wipeouts</th><th>Peak LV</th></tr>` +
          SR.lb.map((e, r) => `<tr><td>${r + 1}</td><td>${esc(e.n)}</td><td>${fmtClock(e.t)}</td><td>${e.w}</td><td>${e.lv}</td></tr>`).join("") + `</table>`;
        if (SR.bestSplits.length === STAGES.length) {
          html += `<div class="k-hint">PB splits: ${SR.bestSplits.map((s, i) => `${i + 1}: ${s.toFixed(1)}`).join(" • ")}</div>`;
        }
        return html;
      }

      // ---- Debug-only autopilot, used to tune medal times (never runs in normal play) ----
      function aiTick(skill) {
        const p = STATE.player, px = getPlayerX();
        const sp = STATE.speed + (STATE.boostTime > 0 ? boostBonus() : 0);
        const threat = [9, 9, 9];
        let jumpThreat = null;
        for (const ob of STATE.obstacles) {
          const hb = obstacleHitbox(ob);
          if (hb.x1 < px - PLAYER_HALF_W) continue;
          const rel = ob.type === "truck" ? sp * 1.12 : sp;
          const tau = Math.max(0, hb.x0 - (px + PLAYER_HALF_W)) / Math.max(1, rel);
          if (tau < threat[ob.lane]) threat[ob.lane] = tau;
          if (ob.lane === p.lane && (!jumpThreat || tau < jumpThreat.tau)) jumpThreat = { tau, h: hb.h };
        }
        const cellsIn = [0, 0, 0];
        if (skill.cells) for (const c of STATE.cells) if (c.x > px - 10 && c.x < px + 420) cellsIn[c.lane] += 1;
        const score = (l) => Math.min(threat[l], 2.5) + (skill.cells ? cellsIn[l] * 0.35 : 0) - Math.abs(l - p.lane) * 0.05;
        let best = p.lane;
        [p.lane - 1, p.lane + 1].forEach((l) => { if (l >= 0 && l <= 2 && score(l) > score(best) + 0.15 && threat[l] > 0.28) best = l; });
        if (threat[p.lane] < 0.6) {
          [p.lane - 1, p.lane + 1].forEach((l) => { if (l >= 0 && l <= 2 && threat[l] > Math.max(threat[best], 0.7)) best = l; });
        }
        if (best !== p.lane && Math.abs(p.lanePos - p.lane) < 0.3) switchLane(best > p.lane ? 1 : -1);
        if (jumpThreat && best === p.lane && p.grounded && STATE.down <= 0) {
          const v = -CONFIG.jumpVelocity, g = CONFIG.gravity;
          const tUp = (v - Math.sqrt(v * v - 2 * g * jumpThreat.h)) / g;
          if (jumpThreat.tau <= tUp + 0.03) jump();
        }
        if (STATE.boostCharge >= CONFIG.boostCellsRequired && STATE.boostTime <= 0 && skill.boost) activateBoost();
      }
      function simStage(i, skill, sr) {
        const wasMuted = audio.muted; audio.muted = true;
        if (sr) { startSpeedrun(); } else startStage(i);
        STATE.sim = true;
        let guard = 0;
        const out = [];
        while (guard++ < 60 * 900) {
          aiTick(skill);
          const before = STATE.stageIdx;
          update(1 / 60);
          if (!sr && STATE.simDone) break;
          if (sr && (STATE.mode !== "playing")) break;
        }
        const res = sr ? { t: cum(STATE.srSplits), splits: STATE.srSplits.slice(), wipes: STATE.srDeaths, peak: STATE.power.peak, top: Math.round(STATE.topSpeed) }
                       : { t: +STATE.stageTime.toFixed(2), wipes: STATE.deaths, lv: STATE.power.lv, peak: STATE.power.peak, top: Math.round(STATE.topSpeed), cells: STATE.cellsCollected };
        STATE.sim = false; STATE.simDone = false; audio.muted = wasMuted;
        if (sr) endSpeedrunUI();
        goTitle();
        return res;
      }
