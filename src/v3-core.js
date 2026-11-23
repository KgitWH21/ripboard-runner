      /* =======================================================================
         V3. FULL GAME: CAMPAIGN, CUTSCENES, MEDALS, LORE, SAVE, LEADERBOARD
         Story text is drawn only from Cereus & Limnic: Definitive Edition, Ch 1-4.
         ======================================================================= */
      const DEBUG = { on: /[?&]debug=1/.test(location.search), god: false };
      const IMG = window.RR_IMAGES || {};
      const imgCache = {};
      function getImg(key) {
        if (!IMG[key]) return null;
        if (!imgCache[key]) {
          const im = new Image();
          im.src = IMG[key];
          imgCache[key] = im;
        }
        const im = imgCache[key];
        return im.complete && im.naturalWidth ? im : null;
      }
      Object.keys(IMG).forEach(getImg); // warm the decoder

      // ---- Kufic-inspired square-grid Latin lettering (geometric, not Arabic) ----
      const KUFIC = {
        A: ["#####", "#...#", "#####", "#...#", "#...#"],
        B: ["####.", "#..#.", "#####", "#...#", "#####"],
        C: ["#####", "#....", "#....", "#....", "#####"],
        D: ["####.", "#...#", "#...#", "#...#", "####."],
        E: ["#####", "#....", "####.", "#....", "#####"],
        F: ["#####", "#....", "####.", "#....", "#...."],
        G: ["#####", "#....", "#.###", "#...#", "#####"],
        H: ["#...#", "#...#", "#####", "#...#", "#...#"],
        I: ["###", ".#.", ".#.", ".#.", "###"],
        J: ["#####", "...#.", "...#.", "#..#.", "####."],
        K: ["#...#", "#..#.", "###..", "#..#.", "#...#"],
        L: ["#....", "#....", "#....", "#....", "#####"],
        M: ["#####", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
        N: ["#...#", "##..#", "#.#.#", "#..##", "#...#"],
        O: ["#####", "#...#", "#...#", "#...#", "#####"],
        P: ["#####", "#...#", "#####", "#....", "#...."],
        Q: ["#####", "#...#", "#...#", "#####", "....#"],
        R: ["#####", "#...#", "#####", "#..#.", "#...#"],
        S: ["#####", "#....", "#####", "....#", "#####"],
        T: ["#####", "..#..", "..#..", "..#..", "..#.."],
        U: ["#...#", "#...#", "#...#", "#...#", "#####"],
        V: ["#...#", "#...#", "#...#", ".#.#.", "..#.."],
        W: ["#.#.#", "#.#.#", "#.#.#", "#.#.#", "#####"],
        X: ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
        Y: ["#...#", "#...#", "#####", "..#..", "..#.."],
        Z: ["#####", "...#.", "..#..", ".#...", "#####"],
        "0": ["#####", "#..##", "#.#.#", "##..#", "#####"],
        "1": ["##.", ".#.", ".#.", ".#.", "###"],
        "2": ["#####", "....#", "#####", "#....", "#####"],
        "3": ["#####", "....#", ".####", "....#", "#####"],
        "4": ["#...#", "#...#", "#####", "....#", "....#"],
        "5": ["#####", "#....", "#####", "....#", "#####"],
        "6": ["#####", "#....", "#####", "#...#", "#####"],
        "7": ["#####", "....#", "...#.", "..#..", "..#.."],
        "8": ["#####", "#...#", "#####", "#...#", "#####"],
        "9": ["#####", "#...#", "#####", "....#", "#####"],
        "-": ["...", "...", "###", "...", "..."],
        ":": [".", "#", ".", "#", "."],
        ".": [".", ".", ".", ".", "#"],
        "!": ["#", "#", "#", ".", "#"],
        "'": ["#", "#", ".", ".", "."],
        "&": ["####.", "#..#.", "#####", "#..#.", "#####"],
        "?": ["####", "...#", ".##.", "....", ".#.."]
      };
      let kuficUid = 0;
      function kuficLineSVG(text) {
        const cell = 10;
        const rects = [];
        const ornaments = [];
        let x = 2; // leave room for the start ornament (in cells)
        const chars = text.toUpperCase().split("");
        chars.forEach((ch, idx) => {
          if (ch === " ") { x += 3; return; }
          const g = KUFIC[ch];
          if (!g) { x += 3; return; }
          const w = g[0].length;
          g.forEach((row, r) => {
            for (let c = 0; c < w; c++) if (row[c] === "#") rects.push([x + c, r + 2]);
          });
          // Kufic-style tall risers on stemmed letters
          const riser = { B: 0, D: 0, H: 0, K: 0, L: 0, I: 1, T: 2 }[ch];
          if (riser !== undefined) { rects.push([x + riser, 0]); rects.push([x + riser, 1]); }
          x += w;
          const next = chars[idx + 1];
          if (next && next !== " " && KUFIC[next.toUpperCase()]) {
            rects.push([x, 6]); // Kufic baseline ligature joining the letters
          }
          x += 1;
        });
        const totalW = x + 1;
        const id = "kg" + (++kuficUid);
        // eight-point star ornaments at both ends of the baseline
        const star = (cx, cy, s) => {
          const pts = [];
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
            const rr = i % 2 === 0 ? s : s * 0.55;
            pts.push((cx + Math.cos(a) * rr).toFixed(1) + "," + (cy + Math.sin(a) * rr).toFixed(1));
          }
          return `<polygon points="${pts.join(" ")}" fill="url(#${id})" stroke="#12302e" stroke-width="1.2"/>`;
        };
        ornaments.push(star(0.9 * cell, 6.5 * cell, 7));
        ornaments.push(star((totalW - 0.2) * cell, 6.5 * cell, 7));
        ornaments.push(`<rect x="${1.6 * cell}" y="${7 * cell + 3}" width="${(totalW - 2.4) * cell}" height="2.2" fill="url(#${id})" opacity="0.8"/>`);
        const g = 0;
        const body = rects.map(([cx, cy]) => `<rect x="${cx * cell + g}" y="${cy * cell + g}" width="${cell - g * 2 + 0.01}" height="${cell - g * 2 + 0.01}"/>`).join("");
        const shadow = rects.map(([cx, cy]) => `<rect x="${cx * cell + 2.2}" y="${cy * cell + 2.6}" width="${cell - 1}" height="${cell - 1}"/>`).join("");
        const vbW = (totalW + 1) * cell;
        const vbH = 7 * cell + 10;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${vbW} ${vbH}" role="img" aria-label="${text}">
          <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c0"/><stop offset="0.45" stop-color="#e3bd62"/><stop offset="1" stop-color="#9c7220"/></linearGradient></defs>
          <g fill="#0b1a1c" opacity="0.55" shape-rendering="crispEdges">${shadow}</g>
          <g fill="url(#${id})" shape-rendering="crispEdges">${body}</g>${ornaments.join("")}</svg>`;
      }
      function renderKufic(el, text) {
        const lines = text.split("|");
        el.innerHTML = lines.map((l) => kuficLineSVG(l)).join("");
        el.setAttribute("aria-label", lines.join(" "));
        el.querySelectorAll("svg").forEach((s, i) => { if (i > 0) s.style.marginTop = "6px"; });
      }
      // Geometric border (eight-point stars on a square grid) used by every k-frame
      (function buildBorder() {
        let cells = "";
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue;
          const cx = c * 24 + 12, cy = r * 24 + 12;
          cells += `<rect x="${cx - 7}" y="${cy - 7}" width="14" height="14" fill="#e3bd62"/>` +
            `<rect x="${cx - 7}" y="${cy - 7}" width="14" height="14" fill="#e3bd62" transform="rotate(45 ${cx} ${cy})"/>` +
            `<rect x="${cx - 3}" y="${cy - 3}" width="6" height="6" fill="#2f7f74"/>`;
        }
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
          <path d="M0 0H72V72H0Z M24 24V48H48V24Z" fill="#12302e" fill-rule="evenodd"/>
          <path d="M1.5 1.5H70.5V70.5H1.5Z M22.5 22.5V49.5H49.5V22.5Z" fill="none" stroke="#b98a2e" stroke-width="1.5"/>${cells}</svg>`;
        document.documentElement.style.setProperty("--k-border", `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
      })();
      document.querySelectorAll("[data-kufic]").forEach((el) => renderKufic(el, el.getAttribute("data-kufic")));

      // ---- Story data (Definitive Edition, Ch 1-4 only) ----
      const T_YUBA = 0, T_WINTER = 1, T_BATTLE = 2, T_CREW = 3, T_DESTINY = 4, T_BRAVELY = 5, T_STORY = 6;
      const STAGES = [
        {
          name: "Under the Big Tree", place: "The park", bg: "bg1", track: T_WINTER,
          v0: 230, ramp: 4.0, vmax: 520, length: 13000, gapMul: 1.3, harpEdge: 0.9,
          mix: { hole: 0.34, ped: 0.6, walkerShare: 0.8, trench: 0.15 },
          taunt: "You ready to lose?", scrapAt: 0.55, lore: 0
        },
        {
          name: "Old Town Blur", place: "Old Town sidewalks", bg: "bg2", track: T_CREW,
          v0: 255, ramp: 5.0, vmax: 600, length: 16000, gapMul: 1.15, harpEdge: 1.2,
          mix: { hole: 0.34, ped: 0.5, walkerShare: 0.55, trench: 0.3 },
          taunt: "A little bit of rippin'! You always feel better after that!", scrapAt: 0.62, lore: 1,
          beat: "Legs pumping. Cracked sidewalk. Harpreet's back, inches ahead.\nAround us, the rundown buildings of Old Town flash by in a gray blur."
        },
        {
          name: "The Walkers", place: "Old Town, slow lane", bg: "bg3", track: T_DESTINY,
          v0: 275, ramp: 5.5, vmax: 660, length: 19000, gapMul: 1.05, harpEdge: 1.5,
          mix: { hole: 0.2, ped: 0.72, walkerShare: 0.85, trench: 0.2 },
          taunt: "Going left!", scrapAt: 0.48, lore: 2,
          beat: "I can't let her beat me again.\nThighs burning. Wind whipping my hair across my face.\nUp ahead she swerves-- straight through a cluster of elderly walkers. They grumble as we cut past."
        },
        {
          name: "Going Left", place: "The flood-scarred blocks", bg: "bg4", track: T_BRAVELY,
          v0: 295, ramp: 6.0, vmax: 730, length: 22000, gapMul: 0.95, harpEdge: 1.8,
          mix: { hole: 0.6, ped: 0.3, walkerShare: 0.5, trench: 0.55 },
          taunt: "No kidding. If it were you, you would've probably shattered a hip.", scrapAt: 0.7, lore: 3,
          beat: "\"Going left!\"\nLeft? The meeting is to the right. Two minutes until start. No choice. I follow.\nThe sidewalk here is pockmarked with patched-over holes-- grim reminders of the flood that drowned the city decades ago."
        },
        {
          name: "The Last Block", place: "Across the street, toward committee", bg: "bg5", track: T_BATTLE,
          v0: 320, ramp: 7.0, vmax: 820, length: 26000, gapMul: 0.85, harpEdge: 2.2,
          mix: { hole: 0.2, ped: 0.42, walkerShare: 0.3, trench: 0.3 },
          taunt: "Got you, loser!", scrapAt: 0.4, lore: 4,
          beat: "She makes a reckless U-turn across the street. Idiot! She's going to get herself killed.\nA truck horn blares. Tires screech. I shoot across the last few feet.\n\"Got you, loser!\"\nAnger flares in my gut. I don't think so."
        }
      ];
      const LORE = [
        { title: "The Pole", text: "Ocean-blue. A smooth, two-and-a-half-foot bar. Retractable wings. I bought it for my birthday three years ago, then spent hours learning deployment, composites, and-- the hard way-- the importance of levcer placement.", cite: "Chapter 3: Frivals" },
        { title: "Frivals", text: "Twelve years ago. The Basics of Language committee. Two five-year-olds with perfect grades raced to see who could test out the fastest. I won by a single day. We've traded the lead in every challenge since.", cite: "Chapter 3: Frivals" },
        { title: "The Card", text: "Tomato-red, winking in the sunlight. My entire life compressed into one slim rectangle of plastic and microscopic circuits. It never fails to unnerve me.", cite: "Chapter 3: Frivals" },
        { title: "The Flood", text: "Sidewalks pockmarked with patched-over holes. Grim reminders of the flood that drowned the city decades ago.", cite: "Chapter 4: Rippin' Race" },
        { title: "Junior Space Cadets", text: "Dinner at seven, Dad says. \"It's not every day they let teenagers into the Junior Space Cadets. It's a big deal.\"", cite: "Chapter 2: Father and Daughter" }
      ];
      const INTRO = [
        { img: "panel1", lines: [
          ["Jinhua", "Heat. It slams into me like a wall. Doesn't matter. Today I race Harpreet."],
          ["Jinhua", "My frival. She beat me last time. Not again."],
          ["Jinhua", "Tomato-red card. My whole life on this thing. Swipe. The gate groans open."]
        ] },
        { img: "panel2", lines: [
          ["Jinhua", "Ten minutes later. The park. Harpreet under a big tree, face tilted to the sun."],
          ["Jinhua", "\"Practicing your mountain pose?\""],
          ["Harpreet", "\"More like trying not to sweat and failing.\""]
        ] },
        { img: "panel3", lines: [
          ["Harpreet", "\"You know what would help you right now? A little bit of rippin'! You always feel better after that!\""],
          ["Jinhua", "\"You're on.\""],
          ["Jinhua", "She tosses her orange pole, hits her levcer... and lands on her backside. Crows scatter."],
          ["Harpreet", "\"One day I swear I'm gonna get that thing that you do down!\""]
        ] },
        { img: "panel4", lines: [
          ["Harpreet", "\"You ready to lose?\""],
          ["Jinhua", "\"Funny, I was about to ask you the same thing.\""],
          ["Harpreet", "\"Committee time got moved up. Some new student from Sac.\""],
          ["Jinhua", "\"How long do we have?\""],
          ["Harpreet", "\"Five minutes.\""],
          ["Jinhua", "\"Then we'd better rip it.\""],
          ["", "3... 2... 1... GO!"]
        ] }
      ];
      const OUTRO = [
        { img: "ending", lines: [
          ["Jinhua", "Kick. Harder. Faster. Flying over the uneven pavement."],
          ["Jinhua", "Hunched forward. Arms tucked. Pushing my ripboard to its limits."],
          ["", "That's how the race goes here."],
          ["", "In the novel, it ends another way. Chapter 4 tells it."]
        ] }
      ];

      // ---- Save & leaderboard (localStorage) ----
      const SAVE_KEY = "ripboard_runner_v3_save";
      const LB_KEY = "ripboard_runner_v3_leaderboard";
      function loadJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v || d; } catch (_) { return d; } }
      function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
      const defaultSave = () => ({ v: 1, unlocked: 1, medals: {}, best: {}, lore: {}, introSeen: false, finished: false, name: "Jinhua" });
      let SAVE = Object.assign(defaultSave(), loadJSON(SAVE_KEY, {}));
      let LB = Object.assign({ stages: {} }, loadJSON(LB_KEY, {}));
      function persist() { saveJSON(SAVE_KEY, SAVE); saveJSON(LB_KEY, LB); }
      const MEDAL_RANK = { none: 0, bronze: 1, silver: 2, gold: 3 };

      // ---- Stage timing model: deterministic no-boost time, medals, rival pace ----
      function distAt(st, t) {
        const tCap = (st.vmax - st.v0) / st.ramp;
        if (t <= tCap) return st.v0 * t + 0.5 * st.ramp * t * t;
        return st.v0 * tCap + 0.5 * st.ramp * tCap * tCap + st.vmax * (t - tCap);
      }
      function speedAt(st, t) { return Math.min(st.vmax, st.v0 + st.ramp * t); }
      function baseTime(st) {
        let lo = 0, hi = 600;
        for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (distAt(st, m) < st.length) lo = m; else hi = m; }
        return hi;
      }
      STAGES.forEach((st) => {
        st.T0 = baseTime(st);
        const boostSave = (CONFIG.boostSpeedBonus * CONFIG.boostDuration) / speedAt(st, st.T0 * 0.5);
        st.gold = Math.floor((st.T0 - boostSave * 1.8) * 10) / 10;
        st.silver = Math.floor((st.T0 - boostSave * 0.8) * 10) / 10;
        st.bronze = Math.ceil((st.T0 + 0.4) * 10) / 10;
        st.harpTime = st.T0 - st.harpEdge;
      });
      function medalFor(st, t) { return t <= st.gold ? "gold" : t <= st.silver ? "silver" : t <= st.bronze ? "bronze" : "none"; }
      function fmtClock(sec) {
        const m = Math.floor(sec / 60);
        const s = sec - m * 60;
        return `${m}:${s < 10 ? "0" : ""}${s.toFixed(1)}`;
      }

      // ---- Screens ----
      const $ = (id) => document.getElementById(id);
      const SCREENS = ["title-screen", "end-screen", "cutscene", "stage-intro", "stage-clear", "fail-screen", "pause-screen",
        "stages-screen", "gallery-screen", "lb-screen", "settings-screen", "credits", "endcard"];
      let menuReturn = "title-screen";
      function showScreen(id) {
        SCREENS.forEach((s) => { const el = $(s); if (el) el.classList.toggle("hidden", s !== id); });
        document.body.classList.toggle("in-menu", id !== null);
        if (id) {
          const el = $(id);
          const btn = el && (el.querySelector(".k-btn:not(.ghost)") || el.querySelector(".k-btn"));
          if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
          if (btn && id !== "cutscene" && id !== "credits" && !document.body.classList.contains("is-touch")) setTimeout(() => { try { btn.focus({ preventScroll: true }); } catch (_) {} }, 30);
        }
      }
      if (IMG.title) $("title-screen").style.backgroundImage = `url(${IMG.title})`;
      if (IMG.ending) $("credits").style.backgroundImage = `url(${IMG.ending})`;

      const MUSIC_MODES = new Set(["title", "menu", "cutscene", "stageintro", "playing", "stageclear", "ending", "credits"]);
      function wantTrack(i) {
        if (trackIndex !== i || !bgMusic.getAttribute("src")) setTrack(i);
        else syncMusicPlayback();
      }

      function goTitle() {
        STATE.mode = "title";
        STATE.gameType = "none";
        hudEl.classList.add("hidden");
        bgMusic.pause();
        refreshTitle();
        showScreen("title-screen");
        wantTrack(T_YUBA);
      }
      function refreshTitle() {
        $("btn-continue").textContent = SAVE.introSeen ? (SAVE.finished ? "Ride the Story Again" : `Continue • Stage ${Math.min(SAVE.unlocked, STAGES.length)}`) : "New Story";
      }
      function openMenu(id) {
        STATE.mode = "menu";
        menuReturn = "title-screen";
        if (id === "stages-screen") buildStageList();
        if (id === "gallery-screen") buildLore();
        if (id === "lb-screen") buildLeaderboard();
        showScreen(id);
        syncMusicPlayback();
      }
      function back() {
        if (menuReturn === "endcard") { STATE.mode = "credits"; showScreen("endcard"); return; }
        goTitle();
      }

      // ---- Cutscenes (typewriter) ----
      const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const CS = { script: null, p: 0, l: 0, shown: 0, full: "", timer: null, done: null };
      function playCutscene(script, track, done) {
        STATE.mode = "cutscene";
        hudEl.classList.add("hidden");
        CS.script = script; CS.p = 0; CS.l = -1; CS.done = done;
        showScreen("cutscene");
        wantTrack(track);
        csAdvance();
      }
      function csRenderPanel() {
        const panel = CS.script[CS.p];
        const src = IMG[panel.img];
        const img = $("cs-img");
        if (src && img.getAttribute("src") !== src) img.src = src;
      }
      function csAdvance() {
        if (!CS.script || CS.p >= CS.script.length) return;
        if (CS.timer && CS.shown < CS.full.length) { // finish the line first
          CS.shown = CS.full.length; $("cs-text").textContent = CS.full; return;
        }
        CS.l++;
        if (CS.l >= CS.script[CS.p].lines.length) { CS.p++; CS.l = 0; }
        if (CS.p >= CS.script.length) { csFinish(); return; }
        csRenderPanel();
        const [who, line] = CS.script[CS.p].lines[CS.l];
        $("cs-speaker").textContent = who;
        CS.full = line; CS.shown = 0;
        clearInterval(CS.timer);
        if (reduceMotion) { CS.shown = line.length; $("cs-text").textContent = line; return; }
        $("cs-text").textContent = "";
        CS.timer = setInterval(() => {
          CS.shown = Math.min(CS.full.length, CS.shown + 1);
          $("cs-text").textContent = CS.full.slice(0, CS.shown);
          if (CS.shown >= CS.full.length) { clearInterval(CS.timer); CS.timer = null; }
        }, 28);
      }
      function csFinish() {
        clearInterval(CS.timer); CS.timer = null;
        CS.script = null;
        const d = CS.done; CS.done = null;
        if (d) d();
      }
      $("cs-box").addEventListener("click", () => { audio.init(); csAdvance(); });
      $("cs-skip").addEventListener("click", () => { audio.init(); csFinish(); });

      // ---- Campaign flow ----
      function newOrContinue() {
        audio.init();
        if (!SAVE.introSeen) {
          playCutscene(INTRO, T_YUBA, () => { SAVE.introSeen = true; persist(); showStageIntro(0); });
        } else if (SAVE.finished) {
          showStageIntro(0);
        } else {
          showStageIntro(Math.min(SAVE.unlocked, STAGES.length) - 1);
        }
      }
      function medalHTML(st) {
        return `<span><i class="medal gold"></i>${fmtClock(st.gold)}</span><span><i class="medal silver"></i>${fmtClock(st.silver)}</span><span><i class="medal bronze"></i>${fmtClock(st.bronze)}</span>`;
      }
      function showStageIntro(i) {
        const st = STAGES[i];
        STATE.stageIdx = i;
        STATE.mode = "stageintro";
        hudEl.classList.add("hidden");
        $("si-eyebrow").textContent = `Stage ${i + 1} of ${STAGES.length}`;
        renderKufic($("si-kufic"), `STAGE ${i + 1}`);
        $("si-name").textContent = st.name;
        $("si-place").textContent = st.place;
        $("si-art").style.backgroundImage = IMG[st.bg] ? `url(${IMG[st.bg]})` : "none";
        $("si-medals").innerHTML = medalHTML(st);
        $("si-taunt").textContent = `Harpreet: "${st.taunt}"`;
        showScreen("stage-intro");
        wantTrack(st.track);
      }
      function startStage(i) {
        audio.init();
        STATE.gameType = "campaign";
        STATE.stageIdx = i;
        showScreen(null);
        hudEl.classList.remove("hidden");
        resetGame();
        const st = STAGES[i];
        STATE.speed = st.v0;
        STATE.dist = 0;
        STATE.stageTime = 0;
        STATE.harpDist = 0;
        STATE.harpFinishedAt = -1;
        STATE.scrap = null;
        STATE.scrapSpawned = false;
        STATE.scrapGot = false;
        STATE.prevRel = 1;
        STATE.passCooldown = 0;
        STATE.zoneBanner = { text: `Stage ${i + 1} • ${st.name}`, timer: 2.6 };
        STATE.harpreet.taunt = st.taunt;
        STATE.harpreet.tauntTimer = 2.8;
        if (trackIndex !== st.track) setTrack(st.track); else syncMusicPlayback();
      }

      // Called from update() each frame in campaign mode. Returns true if the stage ended.
      function campaignTick(dt, activeSpeed) {
        const st = STAGES[STATE.stageIdx];
        STATE.stageTime += dt;
        STATE.dist += activeSpeed * dt;
        paintOffset += activeSpeed * 0.12 * dt;
        if (STATE.zoneBanner.timer > 0) STATE.zoneBanner.timer = Math.max(0, STATE.zoneBanner.timer - dt);
        // Rival pace: Harpreet runs a clean line that finishes harpEdge seconds faster than no-boost,
        // with a breathing wobble so the lead swaps back and forth.
        const t = STATE.stageTime;
        const base = distAt(st, t * st.T0 / st.harpTime);
        const prog = Math.min(1, base / st.length);
        const wob = Math.sin(t * 0.7 + STATE.stageIdx) * 190 * Math.min(1, t / 3) * (prog > 0.88 ? Math.max(0, (1 - prog) / 0.12) : 1);
        STATE.harpDist = Math.min(st.length + 400, base + wob);
        if (STATE.harpFinishedAt < 0 && STATE.harpDist >= st.length) STATE.harpFinishedAt = t;
        const rel = STATE.harpDist - STATE.dist;
        const h = STATE.harpreet;
        h.xRatio = (getPlayerX() + rel) / viewW;
        STATE.passCooldown = Math.max(0, STATE.passCooldown - dt);
        if (STATE.prevRel > 0 && rel <= 0 && STATE.passCooldown <= 0) {
          STATE.harpreetPasses += 1;
          STATE.harpreetScore += CONFIG.harpreetPassPoints;
          audio.pass();
          spawnPopup(getPlayerX() + 20, getRoadMetrics().laneCenterY(STATE.player.lanePos) - 48, "PASSED HARPREET!", CONFIG.colors.neonAmber);
          STATE.passCooldown = 2.5;
        } else if (STATE.prevRel <= 0 && rel > 0 && STATE.passCooldown <= 0) {
          h.taunt = st.taunt; h.tauntTimer = 2.2; STATE.passCooldown = 2.5;
        }
        STATE.prevRel = rel;
        if (Math.random() < 0.006) {
          const nl = Math.floor(Math.random() * 3);
          if (nl !== h.lane) h.lane = nl;
        }
        h.lanePos += (h.lane - h.lanePos) * Math.min(1, 6 * dt);
        if (h.tauntTimer > 0) h.tauntTimer -= dt;

        // Hidden lore star: floats above one lane, needs a jump to grab.
        if (!STATE.scrapSpawned && STATE.dist >= st.length * st.scrapAt) {
          STATE.scrapSpawned = true;
          STATE.scrap = { lane: Math.floor(Math.random() * 3), x: viewW + 120, spin: 0 };
          STATE.obstacles = STATE.obstacles.filter((o) => o.x < viewW - 40 || o.x > viewW + 260);
        }
        if (STATE.scrap) {
          const s = STATE.scrap;
          s.x -= activeSpeed * dt; s.spin += dt * 3;
          const p = STATE.player;
          if (Math.abs(p.lanePos - s.lane) < 0.45 && Math.abs(s.x - getPlayerX()) < 34 && p.jumpY < -26) {
            STATE.scrap = null;
            STATE.scrapGot = true;
            audio.cell(); setTimeout(() => audio.pass(), 90);
            const y = getRoadMetrics().laneCenterY(p.lanePos) - 70;
            spawnBurst(getPlayerX(), y, "#e3bd62", 18);
            spawnPopup(getPlayerX() + 30, y - 10, `LORE FOUND: ${LORE[st.lore].title.toUpperCase()}`, "#e3bd62");
          } else if (s.x < -60) {
            STATE.scrap = null;
          }
        }
        if (STATE.dist >= st.length) { stageClear(); return true; }
        return false;
      }

      function stageClear() {
        const i = STATE.stageIdx;
        const st = STAGES[i];
        const t = Math.round(STATE.stageTime * 10) / 10;
        STATE.mode = "stageclear";
        canvas.classList.remove("boosting");
        boostVignetteEl.classList.remove("active");
        const medal = medalFor(st, t);
        const beatHarp = STATE.harpFinishedAt < 0;
        const key = String(i + 1);
        const prevMedal = SAVE.medals[key] || "none";
        if (MEDAL_RANK[medal] > MEDAL_RANK[prevMedal]) SAVE.medals[key] = medal;
        const newBest = !SAVE.best[key] || t < SAVE.best[key];
        if (newBest) SAVE.best[key] = t;
        if (STATE.scrapGot) SAVE.lore[key] = true;
        SAVE.unlocked = Math.max(SAVE.unlocked, Math.min(STAGES.length, i + 2));
        if (i === STAGES.length - 1) SAVE.finished = true;
        const entry = { n: SAVE.name || "Jinhua", t, m: medal, h: beatHarp ? 1 : 0, d: new Date().toISOString().slice(0, 10) };
        const list = (LB.stages[key] = LB.stages[key] || []);
        list.push(entry);
        list.sort((a, b) => a.t - b.t);
        LB.stages[key] = list.slice(0, 5);
        STATE.lastEntry = LB.stages[key].includes(entry) ? entry : null;
        persist();
        audio.pass();

        $("sc-medal").className = `medal big ${medal}`;
        $("sc-medal-name").textContent = medal === "none" ? "Finished-- no medal" : `${medal} medal`;
        $("sc-time").textContent = fmtClock(t);
        $("sc-thresholds").innerHTML = medalHTML(st);
        $("sc-facts").innerHTML = [
          beatHarp ? "Beat Harpreet to the line." : `Harpreet got there first (${fmtClock(STATE.harpFinishedAt)}).`,
          `Cells ${STATE.cellsCollected} • Passes ${STATE.harpreetPasses}`,
          STATE.scrapGot ? `Hidden star found: "${LORE[st.lore].title}" unlocked in Lore.` : (SAVE.lore[key] ? "Hidden star already found." : "Hidden star missed. Jump for the gold star."),
          newBest ? "New personal best!" : `Best ${fmtClock(SAVE.best[key])}`
        ].join("<br />");
        $("sc-name").value = SAVE.name || "Jinhua";
        const next = STAGES[i + 1];
        $("sc-beat").textContent = next ? next.beat : "Halfway down the block. One cyclist between me and the finish.";
        $("sc-next").textContent = next ? "Next Stage" : "Finish the Race";
        showScreen("stage-clear");
        syncMusicPlayback();
      }
      $("sc-name").addEventListener("input", (e) => {
        const v = e.target.value.trim().slice(0, 12) || "Jinhua";
        SAVE.name = v;
        if (STATE.lastEntry) STATE.lastEntry.n = v;
        persist();
      });
      $("sc-name").addEventListener("keydown", (e) => e.stopPropagation());
      function scNext() {
        const i = STATE.stageIdx;
        if (i + 1 < STAGES.length) showStageIntro(i + 1);
        else playEnding();
      }
      function campaignFail() {
        STATE.mode = "gameover";
        bgMusic.pause();
        clearTimeout(npDelayTimer); clearTimeout(npHideTimer);
        nowPlayingEl.classList.remove("show");
        canvas.classList.remove("boosting");
        boostVignetteEl.classList.remove("active");
        const st = STAGES[STATE.stageIdx];
        const pct = Math.min(99, Math.floor((STATE.dist / st.length) * 100));
        $("fail-facts").textContent = `Stage ${STATE.stageIdx + 1} • ${st.name} • ${pct}% of the way • ${fmtClock(STATE.stageTime)}`;
        showScreen("fail-screen");
      }
      function playEnding() {
        playCutscene(OUTRO, T_STORY, () => rollCredits());
        STATE.mode = "ending";
      }
      let creditsTimer = null;
      function rollCredits() {
        STATE.mode = "credits";
        showScreen("credits");
        wantTrack(T_STORY);
        const roll = $("cr-roll");
        roll.style.animation = "none"; void roll.offsetWidth; roll.style.animation = "";
        clearTimeout(creditsTimer);
        creditsTimer = setTimeout(showEndCard, reduceMotion ? 9000 : 38500);
      }
      function showEndCard() {
        clearTimeout(creditsTimer);
        STATE.mode = "credits";
        showScreen("endcard");
      }
      $("cr-skip").addEventListener("click", showEndCard);
      $("endcard-title").addEventListener("click", goTitle);
      $("endcard-lb").addEventListener("click", () => { buildLeaderboard(); menuReturn = "endcard"; showScreen("lb-screen"); });

      // ---- Pause ----
      function pauseGame() {
        if (STATE.mode !== "playing") return;
        STATE.mode = "paused";
        bgMusic.pause();
        canvas.classList.remove("boosting");
        $("pause-where").textContent = STATE.gameType === "campaign" ? `Stage ${STATE.stageIdx + 1} • ${STAGES[STATE.stageIdx].name} • ${fmtClock(STATE.stageTime)}` : "Free Ride";
        showScreen("pause-screen");
      }
      function resumeGame() {
        if (STATE.mode !== "paused") return;
        showScreen(null);
        STATE.mode = "playing";
        lastTime = performance.now();
        syncMusicPlayback();
      }
      function restartCurrent() {
        if (STATE.gameType === "campaign") startStage(STATE.stageIdx);
        else startGame();
      }
      document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); });
      $("pause-btn").addEventListener("click", () => { audio.init(); pauseGame(); });
      $("pause-resume").addEventListener("click", resumeGame);
      $("pause-restart").addEventListener("click", restartCurrent);
      $("pause-quit").addEventListener("click", goTitle);

      // ---- Menus ----
      function buildStageList() {
        const box = $("stage-list");
        box.innerHTML = "";
        STAGES.forEach((st, i) => {
          const k = String(i + 1);
          const locked = i + 1 > SAVE.unlocked;
          const b = document.createElement("button");
          b.type = "button"; b.className = "k-item"; b.disabled = locked;
          const m = SAVE.medals[k] || "none";
          b.innerHTML = `<span class="thumb" style="background-image:url(${IMG[st.bg] || ""})"></span>
            <span><span class="nm">${i + 1}. ${locked ? "Locked" : st.name}</span><br /><span class="meta">${locked ? "Clear the stage before it" : `${st.place} • Best ${SAVE.best[k] ? fmtClock(SAVE.best[k]) : "--"}${SAVE.lore[k] ? " • ★ lore" : ""}`}</span></span>
            <i class="medal ${m}"></i>`;
          b.addEventListener("click", () => showStageIntro(i));
          box.appendChild(b);
        });
      }
      function buildLore() {
        const box = $("lore-list");
        box.innerHTML = "";
        LORE.forEach((l, i) => {
          const got = SAVE.lore[String(i + 1)];
          const d = document.createElement("div");
          d.className = "lore-tile" + (got ? "" : " locked");
          d.innerHTML = got
            ? `<h3><i class="medal gold"></i>${l.title}</h3><p>${l.text}</p><div class="cite">${l.cite} • Cereus &amp; Limnic: Definitive Edition</div>`
            : `<h3><i class="medal none"></i>Scrap ${i + 1}: ???</h3><p>Hidden in Stage ${i + 1}: ${STAGES[i].name}. Find the floating gold star and jump.</p>`;
          box.appendChild(d);
        });
      }
      function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
      function buildLeaderboard() {
        let html = "";
        STAGES.forEach((st, i) => {
          const list = LB.stages[String(i + 1)] || [];
          html += `<div class="lb-stage">${i + 1}. ${st.name}</div>`;
          if (!list.length) { html += `<div class="k-hint">No times yet.</div>`; return; }
          html += `<table class="lb-table"><tr><th>#</th><th>Name</th><th>Time</th><th>Medal</th><th>Rival</th></tr>` +
            list.map((e, r) => `<tr><td>${r + 1}</td><td>${esc(e.n)}</td><td>${fmtClock(e.t)}</td><td><i class="medal ${e.m}"></i></td><td>${e.h ? "Beat" : "--"}</td></tr>`).join("") + `</table>`;
        });
        const allBest = STAGES.every((_, i) => SAVE.best[String(i + 1)]);
        if (allBest) {
          const total = STAGES.reduce((a, _, i) => a + SAVE.best[String(i + 1)], 0);
          html = `<div class="clear-facts">Story best (sum of your best stage times): <strong>${fmtClock(total)}</strong></div>` + html;
        }
        html += `<div class="k-hint">Saved on this device only.</div>`;
        $("lb-body").innerHTML = html;
      }
      $("btn-continue").addEventListener("click", newOrContinue);
      $("btn-stages").addEventListener("click", () => { audio.init(); openMenu("stages-screen"); });
      $("btn-gallery").addEventListener("click", () => { audio.init(); openMenu("gallery-screen"); });
      $("btn-leaderboard").addEventListener("click", () => { audio.init(); openMenu("lb-screen"); });
      $("btn-settings").addEventListener("click", () => { audio.init(); openMenu("settings-screen"); });
      document.querySelectorAll(".js-back").forEach((b) => b.addEventListener("click", back));
      $("btn-reset-save").addEventListener("click", () => {
        if (!confirm("Reset story progress, medals, lore and leaderboard on this device?")) return;
        SAVE = defaultSave(); LB = { stages: {} }; persist(); refreshTitle();
      });
      $("si-go").addEventListener("click", () => startStage(STATE.stageIdx));
      $("sc-next").addEventListener("click", scNext);
      $("sc-retry").addEventListener("click", () => startStage(STATE.stageIdx));
      $("sc-title").addEventListener("click", goTitle);
      $("fail-retry").addEventListener("click", () => startStage(STATE.stageIdx));
      $("fail-stages").addEventListener("click", () => openMenu("stages-screen"));
      $("fail-title").addEventListener("click", goTitle);
      $("end-title-btn").addEventListener("click", goTitle);

      // Keyboard routing for non-gameplay screens
      function handleMenuKey(e) {
        const k = e.key;
        const go = k === "Enter" || k === " ";
        switch (STATE.mode) {
          case "title":
            if (go && document.activeElement === document.body) { e.preventDefault(); newOrContinue(); }
            break;
          case "cutscene": case "ending":
            if (go) { e.preventDefault(); audio.init(); csAdvance(); }
            else if (k === "Escape") { e.preventDefault(); csFinish(); }
            break;
          case "stageintro":
            if (go && document.activeElement === document.body) { e.preventDefault(); startStage(STATE.stageIdx); }
            break;
          case "paused":
            if (k === "p" || k === "P" || k === "Escape") { e.preventDefault(); resumeGame(); }
            break;
          case "gameover":
            if (STATE.gameType === "campaign" && go && document.activeElement === document.body) { e.preventDefault(); startStage(STATE.stageIdx); }
            else if (STATE.gameType === "classic" && go && document.activeElement === document.body) { e.preventDefault(); startGame(); }
            break;
          case "credits":
            if (k === "Escape" && !$("credits").classList.contains("hidden")) showEndCard();
            break;
          case "menu":
            if (k === "Escape") back();
            break;
        }
      }

      // ---- Canvas: painted backdrop, finish line, lore star, route bar ----
      let paintOffset = 0;
      function drawPaintedBackdrop(metrics, im) {
        const h = metrics.roadTop + 4;
        const w = im.naturalWidth * (h / im.naturalHeight);
        const o = paintOffset % (w * 2);
        // Mirror every other tile so the watercolor loops seamlessly
        for (let k = 0; k * w - o < viewW && k < 16; k++) {
          const x = k * w - o;
          if (k % 2 === 1) {
            ctx.save(); ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, w, h); ctx.restore();
          } else {
            ctx.drawImage(im, x, 0, w, h);
          }
        }
        // soft haze at the horizon to sit the road into the painting
        const g = ctx.createLinearGradient(0, metrics.roadTop - 40, 0, metrics.roadTop + 4);
        g.addColorStop(0, "rgba(246, 238, 219, 0)");
        g.addColorStop(1, "rgba(246, 238, 219, 0.28)");
        ctx.fillStyle = g;
        ctx.fillRect(0, metrics.roadTop - 40, viewW, 44);
      }
      function drawStar8(x, y, r, fill) {
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
          const rr = i % 2 === 0 ? r : r * 0.56;
          const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      }
      function drawCampaignWorld(metrics) {
        const st = STAGES[STATE.stageIdx];
        // Finish line (Kufic-style square checker in gold & teal)
        const fx = getPlayerX() + (st.length - STATE.dist);
        if (fx < viewW + 40 && fx > -40) {
          const sq = 10;
          for (let y = metrics.roadTop, r = 0; y < metrics.roadBottom; y += sq, r++) {
            for (let c = 0; c < 3; c++) {
              ctx.fillStyle = (r + c) % 2 === 0 ? "#e3bd62" : "#12302e";
              ctx.fillRect(fx + c * sq - 15, y, sq, sq);
            }
          }
          drawStar8(fx, metrics.roadTop - 18, 14, "#e3bd62");
        }
        if (STATE.scrap) {
          const s = STATE.scrap;
          const y = metrics.laneCenterY(s.lane) - 74 + Math.sin(s.spin * 1.6) * 5;
          ctx.save();
          ctx.globalAlpha = 0.35;
          drawStar8(s.x, y, 26, "#fff3c4");
          ctx.globalAlpha = 1;
          ctx.translate(s.x, y); ctx.rotate(s.spin * 0.6); ctx.translate(-s.x, -y);
          drawStar8(s.x, y, 15, "#e3bd62");
          ctx.fillStyle = "#2f7f74"; ctx.fillRect(s.x - 4, y - 4, 8, 8);
          ctx.restore();
        }
      }
      function drawCampaignHUD(metrics) {
        const st = STAGES[STATE.stageIdx];
        const w = Math.min(420, viewW * 0.62);
        const x0 = (viewW - w) / 2;
        const y = metrics.roadTop - 30;
        ctx.save();
        ctx.fillStyle = "rgba(18, 48, 46, 0.78)";
        ctx.fillRect(x0 - 6, y - 7, w + 12, 14);
        ctx.strokeStyle = "#b98a2e"; ctx.lineWidth = 1.5;
        ctx.strokeRect(x0 - 6, y - 7, w + 12, 14);
        const pj = Math.min(1, STATE.dist / st.length);
        const ph = Math.min(1, STATE.harpDist / st.length);
        ctx.fillStyle = "rgba(227, 189, 98, 0.55)";
        ctx.fillRect(x0, y - 2, w * pj, 4);
        drawStar8(x0 + w, y, 8, "#e3bd62");
        ctx.fillStyle = "#ff6aa8"; ctx.beginPath(); ctx.arc(x0 + w * ph, y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#38f2ff"; ctx.beginPath(); ctx.arc(x0 + w * pj, y, 6, 0, Math.PI * 2); ctx.fill();
        // Off-screen rival marker
        const hx = STATE.harpreet.xRatio * viewW;
        if (hx > viewW - 10) {
          const rel = Math.round((STATE.harpDist - STATE.dist) / 20);
          ctx.font = "800 12px system-ui, sans-serif"; ctx.textAlign = "right";
          ctx.fillStyle = "rgba(14, 11, 24, 0.82)";
          const ly = metrics.laneCenterY(STATE.harpreet.lanePos) - 30;
          ctx.fillRect(viewW - 128, ly - 14, 120, 22);
          ctx.fillStyle = "#ffd0e8";
          ctx.fillText(`HARPREET +${rel}m ▸`, viewW - 14, ly + 2);
        }
        ctx.restore();
      }

      // ---- Debug hooks (?debug=1 only) ----
      if (DEBUG.on) {
        window.RR = {
          STATE, STAGES, SAVE: () => SAVE, LB: () => LB,
          god(v) { DEBUG.god = v !== false; },
          finish() { if (STATE.gameType === "campaign" && STATE.mode === "playing") STATE.dist = STAGES[STATE.stageIdx].length - 5; },
          setTime(t) { STATE.stageTime = t; },
          grabStar() { STATE.scrapGot = true; },
          stage(i) { showStageIntro(i); },
          ending() { playEnding(); },
          skip() { if (STATE.mode === "cutscene" || STATE.mode === "ending") csFinish(); }
        };
      }
