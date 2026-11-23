# ---- V5 patches on top of v4: SF bonus stage + one more soundtrack song ----
import json, os
# soundtrack: 8th track, streamed exactly like the other seven
rep('''        { title: "The Story So Far", src: MEDIA + "soundtest-cereus-limnic-the-story-so-far.mp3" }''','''        { title: "The Story So Far", src: MEDIA + "soundtest-cereus-limnic-the-story-so-far.mp3" },
        { title: "Quantum Locomotion", src: MEDIA + "soundtest-cereus-limnic-quantum-locomotion.mp3" }''')
rep('''      const T_YUBA = 0, T_WINTER = 1, T_BATTLE = 2, T_CREW = 3, T_DESTINY = 4, T_BRAVELY = 5, T_STORY = 6;''','''      const T_YUBA = 0, T_WINTER = 1, T_BATTLE = 2, T_CREW = 3, T_DESTINY = 4, T_BRAVELY = 5, T_STORY = 6, T_LOCO = 7;
      const MAIN_N = 5, BONUS_IDX = 5; // five story stages, then the bonus''')
# bonus stage definition (appended after stage 5)
i=s.index('          name: "The Last Block"'); j=s.index('        }\n      ];\n      const LORE = [', i)
s=s[:j]+'''        },
        {
          name: "San Francisco Streets", place: "Bonus run • San Francisco at twilight", bg: "bg6", track: T_LOCO, bonus: true,
          v0: 500, ramp: 8.5, vmax: 960, length: 27000, gapMul: 0.9, harpEdge: 2.0,
          mix: { hole: 0.3, ped: 0.34, walkerShare: 0.45, trench: 0.3, car: 0.75, rail: 0.65 },
          hills: [[0.06, 0.18], [0.28, 0.40], [0.62, 0.74], [0.84, 0.95]], switchback: [0.46, 0.56],
          taunt: "You ready to lose?", scrapAt: 9, lore: null
'''+s[j:]
# every "main run" length check means the five story stages
s=s.replace('STAGES.length','MAIN_N')
rep('''        const allBest = STAGES.every((_, i) => SAVE.best[String(i + 1)]);''','''        const allBest = STAGES.slice(0, MAIN_N).every((_, i) => SAVE.best[String(i + 1)]);''')
rep('''          const total = STAGES.reduce((a, _, i) => a + SAVE.best[String(i + 1)], 0);''','''          const total = STAGES.slice(0, MAIN_N).reduce((a, _, i) => a + SAVE.best[String(i + 1)], 0);''')
rep('''        box.innerHTML = STAGES.map((st, i) => {''','''        box.innerHTML = STAGES.slice(0, MAIN_N).map((st, i) => {''')
# medals: v4 five + bonus
bm=json.load(open('/workspace/ripboard-runner/v5-bonus-medals.json')) if os.path.exists('/workspace/ripboard-runner/v5-bonus-medals.json') else {"gold":31,"silver":37,"bronze":44,"harp":34}
i=s.index('      const MEDALS_V4 = ['); j=s.index(';\n',i)
s=s[:j]+'.concat(['+json.dumps(bm)+'])'+s[j:]
# screens
rep('''"credits", "endcard", "sr-screen"];''','''"credits", "endcard", "sr-screen", "bonus-screen"];''')
if True:
    rep('''      if (IMG.ending) $("credits").style.backgroundImage = `url(${IMG.ending})`;''','''      if (IMG.ending) $("credits").style.backgroundImage = `url(${IMG.ending})`;
      if (IMG.bg6) $("bonus-art").style.backgroundImage = `url(${IMG.bg6})`;''')
# new obstacle types in the spawner
rep('''        if (roll < holeT) {''','''        if (bonusSwitchback(xStart)) return;
        if (roll < holeT) {
          STATE.waveRail = isBonus() && Math.random() < STAGES[BONUS_IDX].mix.rail;''')
s=s.replace('''                type: "hole",''','''                type: STATE.waveRail ? "rail" : "hole",''',1)
s=s.replace('''              type: "hole",''','''              type: STATE.waveRail ? "rail" : "hole",''',1)
rep('''          // 3. Trucks crossing at intersections (SWITCH LANES)''','''          // 3. Trucks crossing at intersections (SWITCH LANES) -- cable cars on the bonus stage
          STATE.waveCar = isBonus() && Math.random() < STAGES[BONUS_IDX].mix.car;''')
rep('''              type: "truck",''','''              type: STATE.waveCar ? "cablecar" : "truck",''')
rep('''          const obSpeed = ob.type === "truck" ? activeSpeed * 1.12 : activeSpeed;''','''          const obSpeed = (ob.type === "truck" || ob.type === "cablecar") ? activeSpeed * 1.12 : activeSpeed;''')
rep('''            const rel = type === "truck" ? sp * 1.12 : sp;''','''            const rel = (type === "truck" || type === "cablecar") ? sp * 1.12 : sp;''')
rep('''          const rel = ob.type === "truck" ? sp * 1.12 : sp;''','''          const rel = (ob.type === "truck" || ob.type === "cablecar") ? sp * 1.12 : sp;''')
rep('''        const types = { hole: 88, walkers: 66, cyclist: 66, truck: 112 };''','''        const types = { hole: 88, walkers: 66, cyclist: 66, truck: 112, cablecar: 112, rail: 88 };''')
# speed: hills add a downhill push
rep('''        const activeSpeed = STATE.down > 0 ? 0 : STATE.speed + (STATE.boostTime > 0 ? boostBonus() : 0);''','''        const activeSpeed = STATE.down > 0 ? 0 : STATE.speed + (STATE.boostTime > 0 ? boostBonus() : 0) + hillBonus();''')
rep('''        const renderSpeed = STATE.down > 0 ? 0 : STATE.speed + (STATE.boostTime > 0 ? boostBonus() : 0);''','''        const renderSpeed = STATE.down > 0 ? 0 : STATE.speed + (STATE.boostTime > 0 ? boostBonus() : 0) + hillBonus();''')
rep('''        STATE.stageTime += dt;''','''        STATE.stageTime += dt;
        if (st.bonus) bonusTick(dt, st);''')
# drawing
rep('''        const metrics = getRoadMetrics();
''','''        const metrics = getRoadMetrics();
        applyHillTilt(metrics);
''')
rep('''          drawPaintedBackdrop(metrics, paintIm);''','''          drawPaintedBackdrop(metrics, paintIm);
          if (isBonus()) drawBonusSky(metrics);''')
rep('''        // 5. Obstacles
        for (const ob of STATE.obstacles) {''','''        // 5. Obstacles
        if (isBonus()) drawBonusRoad(metrics);
        for (const ob of STATE.obstacles) {''')
rep('''            drawTruck(ob.x, cy, ob.w);
          }''','''            drawTruck(ob.x, cy, ob.w);
          } else if (ob.type === "cablecar") {
            drawCableCar(ob.x, cy, ob.w);
          } else if (ob.type === "rail") {
            drawRailSlot(ob.x, cy, ob.w);
          }''')
rep('''      function drawCampaignWorld(metrics) {
        const st = STAGES[STATE.stageIdx];''','''      function drawCampaignWorld(metrics) {
        ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
        const st = STAGES[STATE.stageIdx];''')
# labels
rep('''        $("si-eyebrow").textContent = `Stage ${i + 1} of ${MAIN_N}`;
        renderKufic($("si-kufic"), `STAGE ${i + 1}`);''','''        $("si-eyebrow").textContent = st.bonus ? "Bonus Stage • Unlocked" : `Stage ${i + 1} of ${MAIN_N}`;
        renderKufic($("si-kufic"), st.bonus ? "BONUS" : `STAGE ${i + 1}`);''')
rep('''        STATE.zoneBanner = { text: `Stage ${i + 1} • ${st.name}`, timer: 2.6 };''','''        STATE.zoneBanner = { text: `${st.bonus ? "Bonus" : `Stage ${i + 1}`} • ${st.name}`, timer: 2.6 };
        STATE.hill = 0; STATE.wasHill = false; STATE.wasSB = false; STATE.sbStep = 0;''')
rep('''            : `STAGE ${STATE.stageIdx + 1} • ${fmtClock(STATE.stageTime)}''','''            : `${isBonus() ? "BONUS" : `STAGE ${STATE.stageIdx + 1}`} • ${fmtClock(STATE.stageTime)}''')
rep('''          STATE.scrapGot ? `Hidden star found''','''          st.bonus ? "Bonus stage: no hidden star, just hills." : STATE.scrapGot ? `Hidden star found''')
rep('''        if (i === MAIN_N - 1) SAVE.finished = true;''','''        if (i === MAIN_N - 1) { SAVE.finished = true; STATE.bonusNew = unlockBonus(); }''')
rep('''          newBest ? "New personal best!" : `Best ${fmtClock(SAVE.best[key])}`
        ].join("<br />");''','''          newBest ? "New personal best!" : `Best ${fmtClock(SAVE.best[key])}`,
          ...(i === MAIN_N - 1 && STATE.bonusNew ? ["★ Bonus stage unlocked: San Francisco Streets."] : [])
        ].join("<br />");''')
rep('''        const next = STAGES[i + 1];''','''        const next = i + 1 < MAIN_N ? STAGES[i + 1] : null;''')
rep('''        $("sc-next").textContent = next ? "Next Stage" : "Finish the Race";''','''        $("sc-next").textContent = next ? "Next Stage" : "Finish the Race";
        if (st.bonus) { $("sc-beat").textContent = "Bonus run complete."; $("sc-next").textContent = "Ride It Again"; }''')
rep('''        if (i + 1 < MAIN_N) showStageIntro(i + 1);''','''        if (STAGES[i].bonus) { startStage(i); return; }
        if (i + 1 < MAIN_N) showStageIntro(i + 1);''')
rep('''          html += `<div class="lb-stage">${i + 1}. ${st.name}</div>`;''','''          html += `<div class="lb-stage">${st.bonus ? "★ Bonus" : i + 1}. ${st.name}</div>`;''')
rep('''          const locked = i + 1 > SAVE.unlocked;''','''          const locked = st.bonus ? !SAVE.bonus : i + 1 > SAVE.unlocked;''')
rep('''            <span><span class="nm">${i + 1}. ${locked ? "Locked" : st.name}</span><br /><span class="meta">${locked ? "Clear the stage before it" :''','''            <span><span class="nm">${st.bonus ? "★ Bonus" : i + 1}. ${locked ? "Locked" : st.name}</span><br /><span class="meta">${locked ? (st.bonus ? "Finish the main run to unlock" : "Clear the stage before it") :''')
# unlock moments + title button
rep('''      function refreshTitle() {''','''      function refreshTitle() {
        $("btn-bonus").classList.toggle("hidden", !SAVE.bonus);''')
rep('''      function showEndCard() {
        clearTimeout(creditsTimer);''','''      function showEndCard() {
        clearTimeout(creditsTimer);
        if (SAVE.bonus && !SAVE.bonusSeen) { showBonusUnlock(() => { STATE.mode = "credits"; showScreen("endcard"); }); return; }''')
rep('''        showScreen("sr-screen");''','''        showScreen("sr-screen");
        if (unlockBonus()) showBonusUnlock(() => { STATE.mode = "stageclear"; showScreen("sr-screen"); });''')
rep('''        refreshTitle();
        showScreen("title-screen");''','''        refreshTitle();
        showScreen("title-screen");
        if (SAVE.bonus && !SAVE.bonusSeen && !STATE.sim) setTimeout(() => { if (STATE.mode === "title") showBonusUnlock(goTitle); }, 400);''')
rep('''          speedrun() { startSpeedrun(); },''','''          speedrun() { startSpeedrun(); },
          bonus() { showStageIntro(BONUS_IDX); },
          music() { return { src: bgMusic.currentSrc || bgMusic.src, paused: bgMusic.paused, t: bgMusic.currentTime, title: PLAYLIST[trackIndex].title, idx: trackIndex, n: PLAYLIST.length }; },''')
