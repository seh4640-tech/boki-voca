/* 출석 정원 — 공부한 날마다 꽃이 하나씩 심어지고 자라는 도트 그래픽 정원 */
(() => {
  const W = 144, H = 116;            // 도트 해상도
  const COLS = 6, ROWS = 4, PER = COLS * ROWS;
  const GROUND_Y = 44;

  // 팔레트
  const C = {
    G: '#4caf50', g: '#7bd15a', L: '#3e9b45', B: '#8b5a2b', b: '#a8743f', D: '#6b4423',
    T: '#3f9e4d', t: '#6fcf6a', k: '#2e7d3b', R: '#ff5a6e', W: '#ffffff', Y: '#ffd23f', O: '#ff9f43',
    K: '#3b3456', w: '#fff5d6', s: '#7a4a2a', y: '#f6c768', e: '#e0a93f', p: '#fbe3ad', o: '#e07a2f',
  };
  const PETALS = ['#ff6b8b', '#ff9fc4', '#ffd23f', '#b38bff', '#ff8a5b', '#7cc4ff', '#ffffff', '#ff5a6e'];

  // 스프라이트 (P=꽃잎, C=꽃술)
  const S = {
    sprout: ['L...L', '.L.L.', '..G..', '..G..'],
    bud: ['..P..', '.PPP.', '..G..', 'L.G..', '.LG.L', '..GL.', '..G..'],
    tulip: ['.P.P.P.', '.PPPPP.', '.PPPPP.', '..PPP..', '...G...', '.L.G.L.', '..LGL..', '...G...', '...G...'],
    daisy: ['..PPP..', '.PPCPP.', 'PPCCCPP', '.PPCPP.', '..PPP..', '...G...', '.L.G...', '..LG.L.', '...GL..', '...G...'],
    sunflower: ['..P.P.P..', '.PPPPPPP.', 'PPCCCCCPP', '.PCCCCCP.', 'PPCCCCCPP', '.PPPPPPP.', '..P.P.P..', '....G....', '..L.G....', '.LL.G.LL.', '....GLL..', '....G....', '....G....'],
    bell: ['...G...', '..GGG..', '.PPPPP.', 'PPPPPPP', 'P.P.P.P', '...G...', '.L.G.L.', '..LGL..', '...G...'],
    sapling: ['..TTT..', '.TTtTT.', '.TtTTT.', '..TTT..', '...B...', '...B...', '..LB...', '...B...'],
    tree: ['....TTTTT....', '..TTTTTtTTT..', '.TTtTTTTTTTT.', 'TTTTTTRTTtTTT', 'TTRTTTTTTTTTT', 'TTTTtTTTTTRTT', '.TTTTTTtTTTT.', '..kTTTTTTTk..', '....kTTTk....', '......B......', '......B......', '......B......', '.....BBB.....'],
    owl: ['e......e', 'ey....ye', 'yyyyyyyy', 'yWWyyWWy', 'yWKyyKWy', 'yyyooyyy', '.yppppy.', '.yppppy.', '..yyyy..', '..o..o..'],
    house: ['......RR......', '....RRRRRR....', '..RRRRRRRRRR..', 'RRRRRRRRRRRRRR', '.wwwwwwwwwwww.', '.wwbbwwwwKKww.', '.wwbbwwwwKKww.', '.wwwwwbbwwwww.', '.wwwwwbbwwwww.', '.wwwwwbbwwwww.'],
  };
  const FLOWERS = ['tulip', 'daisy', 'bell', 'sunflower'];

  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; }

  function sprite(ctx, rows, x, y, pal) {
    for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
      const ch = rows[r][c]; if (ch === '.') continue;
      ctx.fillStyle = (pal && pal[ch]) || C[ch] || '#000'; ctx.fillRect(x + c, y + r, 1, 1);
    }
  }
  const px = (ctx, x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, w, h); };

  function skyColors(hour) {
    if (hour >= 6 && hour < 17) return { top: '#8fd3ff', bot: '#d9f3ff', night: false, sun: '#ffe066' };
    if (hour >= 17 && hour < 20) return { top: '#ff9eb5', bot: '#ffd6a5', night: false, sun: '#ff8c42' };
    return { top: '#1b1f4b', bot: '#3a3f7a', night: true };
  }

  function plotPos(i) {
    const row = Math.floor(i / COLS), col = i % COLS;
    const rowY = GROUND_Y + 20 + row * 15;            // 뒤 → 앞
    const spread = 19 + row * 0.5;
    const x0 = W / 2 + 11 - (COLS - 1) * spread / 2;
    return { x: Math.round(x0 + col * spread + (row % 2 ? 3 : -3)), y: rowY };
  }

  function plantFor(dayNum, idx, age) {
    const h = hash(dayNum * 7 + 3);
    const isTree = (idx + 1) % 7 === 0;
    if (isTree) return { rows: age >= 3 ? S.tree : age >= 1 ? S.sapling : S.sprout, pal: {}, w: age >= 3 ? 13 : age >= 1 ? 7 : 5 };
    if (age <= 0) return { rows: S.sprout, pal: {}, w: 5, fresh: true };
    const petal = PETALS[h % PETALS.length];
    if (age === 1) return { rows: S.bud, pal: { P: petal }, w: 5 };
    const kind = FLOWERS[(h >>> 4) % FLOWERS.length];
    const center = kind === 'sunflower' ? '#7a4a2a' : '#ffd23f';
    return { rows: S[kind], pal: { P: kind === 'sunflower' ? '#ffd23f' : petal, C: center }, w: S[kind][0].length };
  }

  function draw(ctx, days, today, t) {
    const hour = new Date().getHours();
    const sky = skyColors(hour);
    // 하늘 (도트 디더링 그라데이션)
    for (let y = 0; y < GROUND_Y; y++) {
      const k = y / GROUND_Y;
      for (let x = 0; x < W; x += 1) {
        const dither = ((x + y) % 2) * 0.06;
        ctx.fillStyle = k + dither > 0.55 ? sky.bot : sky.top; ctx.fillRect(x, y, 1, 1);
      }
    }
    if (sky.night) {
      for (let s = 0; s < 30; s++) { const h = hash(s * 13 + 5); const x = h % W, y = (h >>> 8) % (GROUND_Y - 8); const tw = ((t / 400 + s) | 0) % 5 === 0; px(ctx, x, y, 1, 1, tw ? '#fff8c4' : '#cfd3ff'); }
      // 달
      const mx = W - 28, my = 6; for (let yy = 0; yy < 11; yy++) for (let xx = 0; xx < 11; xx++) { const d1 = (xx - 5) ** 2 + (yy - 5) ** 2, d2 = (xx - 8) ** 2 + (yy - 3) ** 2; if (d1 <= 26 && d2 > 22) px(ctx, mx + xx, my + yy, 1, 1, '#fff3b0'); }
    } else {
      // 해
      const sx = W - 30; px(ctx, sx, 6, 12, 12, sky.sun); px(ctx, sx - 2, 8, 16, 8, sky.sun); px(ctx, sx + 2, 4, 8, 16, sky.sun);
      // 구름
      const cx = ((t / 120) % (W + 40)) - 30;
      [[cx, 12], [cx + 90, 24]].forEach(([x, y]) => { const xx = ((x % (W + 40)) + W + 40) % (W + 40) - 30; px(ctx, xx, y, 22, 5, '#fff'); px(ctx, xx + 4, y - 3, 12, 4, '#fff'); px(ctx, xx + 2, y + 5, 18, 1, '#e6f2ff'); });
    }
    // 먼 언덕
    for (let x = 0; x < W; x++) { const hh = 6 + Math.round(4 * Math.sin(x / 18) + 3 * Math.sin(x / 7)); px(ctx, x, GROUND_Y - hh, 1, hh, sky.night ? '#2d5a3a' : '#9bd77a'); }
    // 잔디
    px(ctx, 0, GROUND_Y, W, H - GROUND_Y, sky.night ? '#2f6b3a' : '#7ccf5f');
    for (let i = 0; i < 170; i++) { const h = hash(i * 31 + 7); const x = h % W, y = GROUND_Y + 2 + ((h >>> 9) % (H - GROUND_Y - 3)); px(ctx, x, y, 1, 2, sky.night ? '#285c33' : (h & 1 ? '#69bd4f' : '#93dd72')); }
    // 오솔길
    for (let y = GROUND_Y; y < H; y++) { const w = 6 + (y - GROUND_Y) * 0.18; px(ctx, 18 - w / 2 + (y - GROUND_Y) * 0.05, y, w, 1, sky.night ? '#6b5a3c' : '#e9cf98'); }
    // 집 + 울타리
    sprite(ctx, S.house, 6, GROUND_Y - 6, sky.night ? { w: '#d8cfb5', K: '#ffe08a' } : {});
    for (let x = 26; x < W; x += 6) { px(ctx, x, GROUND_Y + 2, 2, 8, '#fff8ea'); px(ctx, x, GROUND_Y + 1, 2, 1, '#f1e4c6'); }
    px(ctx, 24, GROUND_Y + 4, W - 24, 1, '#f1e4c6'); px(ctx, 24, GROUND_Y + 7, W - 24, 1, '#f1e4c6');
    // 보키 (울타리 위)
    const bob = Math.round(Math.sin(t / 500));
    sprite(ctx, S.owl, W - 18, GROUND_Y - 8 + bob);

    // 화단
    const sorted = [...new Set(days)].sort((a, b) => a - b);
    const page = Math.max(0, Math.floor((sorted.length - 1) / PER));
    const shown = sorted.slice(page * PER, page * PER + PER);
    const items = shown.map((d, k) => ({ d, k, idx: page * PER + k, ...plotPos(k) }));
    // 빈 화단 자리 표시 (흙)
    for (let k = 0; k < PER; k++) { const p = plotPos(k); px(ctx, p.x - 4, p.y, 9, 2, sky.night ? '#4a3420' : '#9a6a3a'); px(ctx, p.x - 3, p.y + 2, 7, 1, sky.night ? '#3a2818' : '#7d5530'); }
    for (const it of items) {
      const age = today - it.d;
      const pl = plantFor(it.d, it.idx, age);
      const sway = pl.rows.length > 6 && !sky.night ? Math.round(Math.sin(t / 600 + it.k) * 0.6) : 0;
      sprite(ctx, pl.rows, it.x - Math.floor(pl.w / 2) + sway, it.y - pl.rows.length + 1, pl.pal);
      if (it.d === today) { // 오늘 심은 새싹 반짝
        const f = ((t / 250) | 0) % 4;
        [[-5, -6], [5, -8], [0, -10]].forEach(([dx, dy], j) => { if ((f + j) % 2) px(ctx, it.x + dx, it.y + dy, 1, 1, '#fff7a8'); });
      }
    }
    // 나비(낮) / 반딧불(밤)
    const n = Math.min(6, 1 + Math.floor(sorted.length / 5));
    for (let i = 0; i < n; i++) {
      const ph = t / (1400 + i * 300) + i * 2;
      const x = W / 2 + 8 + Math.sin(ph) * (46 + i * 4) + Math.sin(ph * 2.3) * 6, y = GROUND_Y + 28 + Math.cos(ph * 1.3) * 18 - i * 3;
      if (sky.night) { if (((t / 300 + i) | 0) % 3) { px(ctx, x, y, 1, 1, '#fff9a8'); px(ctx, x - 1, y, 1, 1, 'rgba(255,249,168,.4)'); px(ctx, x + 1, y, 1, 1, 'rgba(255,249,168,.4)'); } }
      else { const flap = ((t / 150) | 0) % 2; const col = PETALS[(i * 3) % PETALS.length]; px(ctx, x - 1, y, 1, flap ? 2 : 1, col); px(ctx, x + 1, y, 1, flap ? 2 : 1, col); px(ctx, x, y, 1, 2, '#3b3456'); }
    }
    return { page, count: sorted.length, onPage: shown.length };
  }

  // 공개 함수: canvas에 정원을 그리고 애니메이션
  window.drawGarden = function (canvas, days, today) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    let info = draw(ctx, days, today, performance.now());
    let last = 0;
    const loop = now => {
      if (!canvas.isConnected) return;
      if (now - last > 110) { last = now; draw(ctx, days, today, now); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return info;
  };
  window.GARDEN_PER = PER;
})();
