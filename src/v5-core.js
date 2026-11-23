      /* =======================================================================
         V5. BONUS STAGE: SAN FRANCISCO STREETS AT TWILIGHT
         Same mechanics, hitbox rules and speed ramp as v4. Not part of the novel's story.
         ======================================================================= */
      function isBonus() { return STATE.gameType === "campaign" && STATE.stageIdx === BONUS_IDX; }
      function unlockBonus() {
        if (SAVE.bonus) return false;
        SAVE.bonus = true; SAVE.bonusSeen = false; persist();
        return true;
      }
      if (SAVE.finished && !SAVE.bonus) { SAVE.bonus = true; SAVE.bonusSeen = false; persist(); }
      HITBOX.cablecar = (w) => ({ l: -w * 0.5 + 3, r: w * 0.5 - 3, h: 46, top: 60 });
      HITBOX.rail = HITBOX.hole;

      // Hills to bomb: inside a hill zone the street tips downhill and gravity adds speed.
      const HILL = { bonus: 110, tilt: 0.05 };
      function hillBonus() { return isBonus() ? HILL.bonus * (STATE.hill || 0) : 0; }
      function zoneAt(list, prog) { return (list || []).some(([a, b]) => prog >= a && prog < b); }
      function bonusTick(dt, st) {
        const prog = STATE.dist / st.length;
        const inHill = zoneAt(st.hills, prog);
        const inSB = zoneAt([st.switchback], prog);
        STATE.hill = (STATE.hill || 0) + ((inHill ? 1 : 0) - (STATE.hill || 0)) * Math.min(1, dt * 2.5);
        if (inHill && !STATE.wasHill) STATE.zoneBanner = { text: "BOMB THE HILL!", timer: 1.6 };
        if (inSB && !STATE.wasSB) { STATE.zoneBanner = { text: "LOMBARD SWITCHBACK • weave!", timer: 2.0 }; STATE.sbStep = 0; }
        STATE.wasHill = inHill; STATE.wasSB = inSB;
      }
      function applyHillTilt(metrics) {
        if (!isBonus() || reduceMotion || !(STATE.hill > 0.01)) return;
        const h = STATE.hill;
        ctx.fillStyle = "#2a1f3d";
        ctx.fillRect(0, 0, viewW, viewH);
        ctx.translate(viewW / 2, viewH / 2);
        ctx.rotate(HILL.tilt * h);
        ctx.scale(1 + 0.075 * h, 1 + 0.075 * h);
        ctx.translate(-viewW / 2, -viewH / 2);
      }
      // Lombard-style switchback: one open lane that zig-zags 0-1-2-1, the other two blocked.
      function bonusSwitchback(xStart) {
        if (!isBonus() || !STATE.wasSB) return false;
        const open = [0, 1, 2, 1][(STATE.sbStep = (STATE.sbStep || 0) + 1) % 4];
        for (let l = 0; l < 3; l++) {
          if (l === open) continue;
          STATE.obstacles.push({ type: Math.random() < 0.5 ? "walkers" : "cyclist", lane: l, x: xStart, w: 66, jumpable: true });
        }
        return true;
      }

      // ---- Twilight drawing: fog, streetlights, cable car tracks, readable obstacles ----
      function drawBonusSky(metrics) {
        const top = metrics.roadTop;
        // drifting fog
        const t = STATE.elapsed || performance.now() / 1000;
        for (let k = 0; k < 3; k++) {
          const fx = ((t * (14 + k * 6) + k * 420) % (viewW + 600)) - 300;
          const g = ctx.createRadialGradient(fx, top - 40 - k * 26, 10, fx, top - 40 - k * 26, 320);
          g.addColorStop(0, "rgba(232, 222, 245, 0.30)");
          g.addColorStop(1, "rgba(232, 222, 245, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(fx - 320, top - 200, 640, 200);
        }
        // streetlights along the curb (scroll at curb speed)
        const gap = 300, off = (STATE.dist || 0) * 0.7 % gap;
        for (let x = -off; x < viewW + 40; x += gap) {
          ctx.strokeStyle = "#1d1a26"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(x, top + 2); ctx.lineTo(x, top - 78); ctx.lineTo(x + 12, top - 84); ctx.stroke();
          const lg = ctx.createRadialGradient(x + 14, top - 82, 2, x + 14, top - 82, 46);
          lg.addColorStop(0, "rgba(255, 226, 150, 0.95)");
          lg.addColorStop(0.25, "rgba(255, 196, 110, 0.45)");
          lg.addColorStop(1, "rgba(255, 180, 90, 0)");
          ctx.fillStyle = lg; ctx.fillRect(x - 34, top - 130, 96, 96);
          ctx.fillStyle = "#fff1c8"; ctx.beginPath(); ctx.arc(x + 14, top - 82, 4, 0, Math.PI * 2); ctx.fill();
        }
      }
      function drawBonusRoad(metrics) {
        // cable car tracks down the middle lane: two steel rails + the cable slot
        const y = metrics.laneCenterY(1);
        ctx.save();
        ctx.strokeStyle = "rgba(196, 200, 218, 0.55)"; ctx.lineWidth = 2;
        [-12, 12].forEach((d) => { ctx.beginPath(); ctx.moveTo(0, y + d + 6); ctx.lineTo(viewW, y + d + 6); ctx.stroke(); });
        ctx.strokeStyle = "rgba(20, 18, 28, 0.8)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, y + 6); ctx.lineTo(viewW, y + 6); ctx.stroke();
        const off = (STATE.dist || 0) % 90;
        ctx.fillStyle = "rgba(196, 200, 218, 0.35)";
        for (let x = -off; x < viewW; x += 90) ctx.fillRect(x, y - 7, 3, 26);
        // warm streetlight pools on the road + a light pool under every obstacle so they read in the dusk
        const gap = 300, loff = (STATE.dist || 0) * 0.7 % gap;
        for (let x = -loff; x < viewW + 40; x += gap) {
          const g = ctx.createRadialGradient(x + 14, metrics.roadTop + 10, 4, x + 14, metrics.roadTop + 10, 120);
          g.addColorStop(0, "rgba(255, 210, 140, 0.20)"); g.addColorStop(1, "rgba(255, 210, 140, 0)");
          ctx.fillStyle = g; ctx.fillRect(x - 110, metrics.roadTop, 250, 130);
        }
        for (const ob of STATE.obstacles) {
          const cy = metrics.laneCenterY(ob.lane) + 6;
          const g = ctx.createRadialGradient(ob.x, cy, 4, ob.x, cy, 72);
          g.addColorStop(0, "rgba(255, 230, 180, 0.30)"); g.addColorStop(1, "rgba(255, 230, 180, 0)");
          ctx.fillStyle = g; ctx.fillRect(ob.x - 80, cy - 50, 160, 100);
        }
        ctx.restore();
        // obstacles get a soft pale rim so they never vanish into the darker palette
        ctx.shadowColor = "rgba(255, 240, 210, 0.9)";
        ctx.shadowBlur = 9;
      }
      function drawCableCar(x, y, w) {
        ctx.save();
        ctx.translate(x, y);
        const hw = w * 0.5;
        // headlamp beam (toward the player)
        ctx.fillStyle = "rgba(255, 226, 150, 0.16)";
        ctx.beginPath(); ctx.moveTo(-hw, -12); ctx.lineTo(-hw - 80, -26); ctx.lineTo(-hw - 80, 12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(-hw, 8, w, 9);
        // running gear
        ctx.fillStyle = "#15131c";
        ctx.fillRect(-hw + 8, 4, w - 16, 6);
        ctx.beginPath(); ctx.arc(-hw + 20, 10, 5, 0, Math.PI * 2); ctx.arc(hw - 20, 10, 5, 0, Math.PI * 2); ctx.fill();
        // lower body (maroon) + cream upper + roof
        ctx.fillStyle = "#a8262f"; ctx.beginPath(); ctx.roundRect(-hw, -16, w, 22, 3); ctx.fill();
        ctx.fillStyle = "#efe0bd"; ctx.fillRect(-hw + 2, -38, w - 4, 22);
        ctx.fillStyle = "#3b2b2f"; ctx.beginPath(); ctx.roundRect(-hw - 3, -46, w + 6, 9, 4); ctx.fill();
        // warm lit windows
        ctx.fillStyle = "#ffd27a";
        for (let k = 0; k < 5; k++) ctx.fillRect(-hw + 9 + k * ((w - 18) / 5), -34, (w - 18) / 5 - 5, 13);
        ctx.fillStyle = "#e3bd62"; ctx.fillRect(-hw + 4, -9, w - 8, 2);
        // headlamp
        ctx.fillStyle = "#fff4c2"; ctx.beginPath(); ctx.arc(-hw + 1, -6, 4, 0, Math.PI * 2); ctx.fill();
        // pale outline for readability
        ctx.strokeStyle = "rgba(255, 236, 200, 0.8)"; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
        ctx.strokeRect(-hw - 3, -46, w + 6, 52);
        ctx.restore();
      }
      function drawRailSlot(x, y, w) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#15131c";
        ctx.beginPath(); ctx.roundRect(-w * 0.5, -6, w, 20, 5); ctx.fill();
        ctx.strokeStyle = "#c4c8da"; ctx.lineWidth = 2.5;
        [-1, 8].forEach((d) => { ctx.beginPath(); ctx.moveTo(-w * 0.5 + 4, d); ctx.lineTo(-6, d + 2); ctx.moveTo(8, d + 3); ctx.lineTo(w * 0.5 - 4, d); ctx.stroke(); });
        const blink = Math.floor((STATE.elapsed || 0) * 4) % 2 === 0;
        ctx.fillStyle = blink ? "#ffb347" : "#7a4a1a";
        ctx.beginPath(); ctx.arc(-w * 0.5 - 4, -2, 4, 0, Math.PI * 2); ctx.arc(w * 0.5 + 4, -2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255, 179, 71, 0.7)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-w * 0.5, -6, w, 20, 5); ctx.stroke();
        ctx.restore();
      }

      // ---- Unlock screen ----
      let bonusReturn = null;
      function showBonusUnlock(after) {
        bonusReturn = after || null;
        SAVE.bonusSeen = true; persist();
        STATE.mode = "menu";
        hudEl.classList.add("hidden");
        showScreen("bonus-screen");
        audio.pass(); setTimeout(() => sfxLevelUp(), 160);
      }
      $("bonus-go").addEventListener("click", () => { bonusReturn = null; endSpeedrunUI(); showStageIntro(BONUS_IDX); });
      $("bonus-later").addEventListener("click", () => { const f = bonusReturn; bonusReturn = null; if (f) f(); else goTitle(); });
      $("btn-bonus").addEventListener("click", () => { audio.init(); if (SAVE.bonus) showStageIntro(BONUS_IDX); });
