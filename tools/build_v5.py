import base64, re, os
SRC='/workspace/ripboard-runner/2026-11-22-ripboard-runner-v2.html'
DST='/workspace/ripboard-runner/2026-11-22-ripboard-runner-v5.html'
D='/workspace/ripboard-runner/v5-src/'
A='/workspace/ripboard-runner/v5-assets/'
s=open(SRC,encoding='utf-8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old); assert n==count,(n,old[:90]); s=s.replace(old,new)
def wrap_between(start, end, before, after):
    global s
    i=s.index(start); j=s.index(end,i)
    s=s[:i]+before+s[i:j]+after+s[j:]

rep('<title>Ripboard Runner — Yuba City, 2062</title>','<title>Ripboard Runner: Yuba City, 2062 (Full Game Prototype v5)</title>')
# CSS
rep('  </style>', open(D+'v3.css').read()+'\n    #hud.hidden { display: none; }\n  </style>')
# HUD pause button
rep('''        <button id="music-btn"''','''        <button id="pause-btn" type="button" aria-label="Pause (P)" title="Pause (P / Esc)">II</button>
        <button id="music-btn"''')
# Replace title screen
i=s.index('    <!-- TITLE SCREEN -->'); j=s.index('    <!-- WIPEOUT / END SCREEN -->')
s=s[:i]+open(D+'v3-title.html').read()+s[j:]
# classic end screen: title button
rep('''        <button id="restart-btn" class="btn-primary" type="button">Ride Again</button>''','''        <button id="restart-btn" class="btn-primary" type="button">Ride Again</button>
        <button id="end-title-btn" class="btn-link" type="button" style="margin-top:10px;cursor:pointer">Back to Title</button>''')
# images
imgs={}
for k in ['panel1','panel2','panel3','panel4','ending','bg1','bg2','bg3','bg4','bg5','bg6','title']:
    imgs[k]='data:image/webp;base64,'+base64.b64encode(open(A+k+'.webp','rb').read()).decode()
js='window.RR_IMAGES = {\n'+',\n'.join(f'  "{k}": "{v}"' for k,v in imgs.items())+'\n};'
rep('  <script>\n    (() => {','  <script>\n'+js+'\n  </script>\n  <script>\n    (() => {')

# ---- music behavior ----
rep('''      bgMusic.addEventListener("ended", () => setTrack(trackIndex + 1));''','''      bgMusic.addEventListener("ended", () => {
        // V3: stage music loops during a stage; menus keep cycling the playlist.
        if (["playing", "paused", "stageintro", "stageclear"].includes(STATE.mode)) {
          try { bgMusic.currentTime = 0; } catch (_) {}
          syncMusicPlayback();
        } else {
          setTrack(trackIndex + 1);
        }
      });''')
rep('''        if (musicEnabled && STATE.mode === "playing") {
          if (!bgMusic.getAttribute("src")) {''','''        if (musicEnabled && MUSIC_MODES.has(STATE.mode)) {
          if (!bgMusic.getAttribute("src")) {''')
rep('''          if (musicEnabled && STATE.mode === "playing" && bgMusic.paused) syncMusicPlayback();''','''          if (musicEnabled && MUSIC_MODES.has(STATE.mode) && bgMusic.paused) syncMusicPlayback();''')

# ---- keyboard ----
rep('''        if (STATE.mode !== "playing") {
          if (e.key === "Enter" || e.key === " ") {
            if (STATE.mode === "title") startGame();
            else if (STATE.mode === "gameover") startGame();
          }
          return;
        }
''','''        if (e.target && e.target.tagName === "INPUT") return;
        if (STATE.mode !== "playing") {
          handleMenuKey(e);
          return;
        }
        if (e.key === "p" || e.key === "P" || e.key === "Escape") {
          e.preventDefault();
          pauseGame();
          return;
        }
        if (DEBUG.on && (e.key === "k" || e.key === "K")) { window.RR && window.RR.finish(); return; }
''')

# ---- update(): campaign hooks ----
wrap_between('        // Countdown timer ("Committee starts in 5:00"', '        // Boost visual blur + vignette toggle',
             '        if (STATE.gameType !== "campaign") {\n', '        }\n\n')
rep('''        STATE.speed = Math.min(CONFIG.maxSpeed, STATE.speed + CONFIG.speedRampPerSec * dt);''','''        const stg = STATE.gameType === "campaign" ? STAGES[STATE.stageIdx] : null;
        STATE.speed = stg ? Math.min(stg.vmax, STATE.speed + stg.ramp * dt) : Math.min(CONFIG.maxSpeed, STATE.speed + CONFIG.speedRampPerSec * dt);''')
rep('''        const activeSpeed = STATE.speed + (STATE.boostTime > 0 ? CONFIG.boostSpeedBonus : 0);
''','''        const activeSpeed = STATE.speed + (STATE.boostTime > 0 ? CONFIG.boostSpeedBonus : 0);
        if (stg && campaignTick(dt, activeSpeed)) return;
''')
wrap_between("        // Update Harpreet's ghost cycle", "        // Harpreet's ripboard smoke",
             '        if (STATE.gameType !== "campaign") {\n', '        }\n\n')
rep('''          STATE.nextObstacleIn = minGap + Math.random() * Math.max(0.2, maxGap - minGap);''','''          STATE.nextObstacleIn = (minGap + Math.random() * Math.max(0.2, maxGap - minGap)) * (stg ? stg.gapMul : 1);''')
rep('''          if (laneDist < 0.42 && hitX && !clearedByJump) {''','''          if (laneDist < 0.42 && hitX && !clearedByJump && !DEBUG.god) {''')
# obstacle mix
rep('''        const roll = Math.random();
        const xStart = viewW + 90;

        if (roll < 0.36) {''','''        const roll = Math.random();
        const xStart = viewW + 90;
        const mx = STATE.gameType === "campaign" ? STAGES[STATE.stageIdx].mix : null;
        const holeT = mx ? mx.hole : 0.36;
        const pedT = mx ? mx.hole + mx.ped : 0.70;

        if (roll < holeT) {''')
rep('''          const fullTrench = Math.random() < 0.32;''','''          const fullTrench = Math.random() < (mx ? mx.trench : 0.32);''')
rep('''        } else if (roll < 0.70) {''','''        } else if (roll < pedT) {''')
rep('''              type: Math.random() < 0.55 ? "walkers" : "cyclist",''','''              type: Math.random() < (mx ? mx.walkerShare : 0.55) ? "walkers" : "cyclist",''')

rep('''        const hx = h.xRatio * viewW;
        if (hx > -30 && hx < viewW + 30 && Math.random() < 0.72) {
          const hy = getRoadMetrics().laneCenterY(h.lanePos) + 12;''','''        const hx = STATE.harpreet.xRatio * viewW;
        if (hx > -30 && hx < viewW + 30 && Math.random() < 0.72) {
          const hy = getRoadMetrics().laneCenterY(STATE.harpreet.lanePos) + 12;''')
# HUD
rep('''        hudTimerEl.textContent = `Committee starts in ${formatTime(STATE.timeLeft)}`;
        hudTimerEl.classList.toggle("urgent", STATE.timeLeft <= 30);
        hudScoreEl.textContent = `SCORE ${getTotalScore().toLocaleString()}`;''','''        if (STATE.gameType === "campaign") {
          const st = STAGES[STATE.stageIdx];
          hudTimerEl.textContent = `STAGE ${STATE.stageIdx + 1} • ${fmtClock(STATE.stageTime)}`;
          hudTimerEl.classList.remove("urgent");
          hudScoreEl.textContent = `${Math.max(0, Math.ceil((st.length - STATE.dist) / 20))}m TO GO`;
        } else {
          hudTimerEl.textContent = `Committee starts in ${formatTime(STATE.timeLeft)}`;
          hudTimerEl.classList.toggle("urgent", STATE.timeLeft <= 30);
          hudScoreEl.textContent = `SCORE ${getTotalScore().toLocaleString()}`;
        }''')
# startGame classic / endGame campaign
rep('''      function startGame() {
        audio.init();''','''      function startGame() {
        audio.init();
        STATE.gameType = "classic";
        showScreen(null);''')
rep('''      function endGame(reason) {
        STATE.mode = "gameover";''','''      function endGame(reason) {
        if (STATE.gameType === "campaign") { campaignFail(); return; }
        STATE.mode = "gameover";''')

# draw()
rep('''        // 1. Daytime-to-sunset Yuba City sky gradient (shifts every minute)''','''        const paintIm = STATE.gameType === "campaign" ? getImg(STAGES[STATE.stageIdx].bg) : null;
        if (paintIm) {
          drawPaintedBackdrop(metrics, paintIm);
          ctx.fillStyle = "#7d8462";
          ctx.fillRect(0, metrics.roadTop - 5, viewW, 7);
        } else {
        // 1. Daytime-to-sunset Yuba City sky gradient (shifts every minute)''')
rep('''        // 3. 3-Lane Roadway
        ctx.fillStyle = CONFIG.colors.roadBase;''','''        } // end classic procedural scenery

        // 3. 3-Lane Roadway
        ctx.fillStyle = paintIm ? "#3d3f47" : CONFIG.colors.roadBase;''')
rep('''        ctx.fillStyle = CONFIG.colors.roadPatch;
        for (const patch of STATE.roadPatches) {''','''        ctx.fillStyle = paintIm ? "#484a53" : CONFIG.colors.roadPatch;
        for (const patch of STATE.roadPatches) {''')
rep('''        ctx.fillStyle = "#292636";
        ctx.fillRect(0, metrics.roadBottom, viewW, viewH - metrics.roadBottom);''','''        ctx.fillStyle = paintIm ? "#6b6457" : "#292636";
        ctx.fillRect(0, metrics.roadBottom, viewW, viewH - metrics.roadBottom);''')
rep('''        // 6. Harpreet's Ghost (ahead on the road)''','''        if (STATE.gameType === "campaign" && STATE.mode !== "title") drawCampaignWorld(metrics);

        // 6. Harpreet's Ghost (ahead on the road)''')
rep('''          ctx.fillText(STATE.zoneBanner.text, viewW / 2, by + 21);
          ctx.restore();
        }
''','''          ctx.fillText(STATE.zoneBanner.text, viewW / 2, by + 21);
          ctx.restore();
        }
        if (STATE.gameType === "campaign" && (STATE.mode === "playing" || STATE.mode === "paused")) drawCampaignHUD(metrics);
''')
# core block before main loop
rep('''      /* =======================================================================
         12. MAIN LOOP''', open(D+'v3-core.js').read()+open(D+'v4-core.js').read()+open(D+'v5-core.js').read()+'''
      /* =======================================================================
         12. MAIN LOOP''')
rep('''        draw();
        requestAnimationFrame(loop);
      };''','''        draw();
        requestAnimationFrame(loop);
        goTitle();
      };''')
exec(open('/workspace/ripboard-runner/build_v4_patches.py').read())
exec(open('/workspace/ripboard-runner/build_v5_patches.py').read())
open(DST,'w',encoding='utf-8').write(s)
print('ok', os.path.getsize(DST))
