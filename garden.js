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
    rose: ['..PPP..', '.PCPPP.', '.PPCCP.', '..PPP..', '...G...', '.LLG...', '...GLL.', '..LG...', '...G...'],
    lavender: ['...P...', '.P.CP.P', '.CP.P.C', '..PCPP.', '.P.C.P.', '..PGP..', '...G...', '.L.G.L.', '..LGL..', '...G...'],
    bell: ['...G...', '..GGG..', '.PPPPP.', 'PPPPPPP', 'P.P.P.P', '...G...', '.L.G.L.', '..LGL..', '...G...'],
    sapling: ['..TTT..', '.TTtTT.', '.TtTTT.', '..TTT..', '...B...', '...B...', '..LB...', '...B...'],
    tree: ['....TTTTT....', '..TTTTTtTTT..', '.TTtTTTTTTTT.', 'TTTTTTRTTtTTT', 'TTRTTTTTTTTTT', 'TTTTtTTTTTRTT', '.TTTTTTtTTTT.', '..kTTTTTTTk..', '....kTTTk....', '......B......', '......B......', '......B......', '.....BBB.....'],
    owl: ['e......e', 'ey....ye', 'yyyyyyyy', 'yWWyyWWy', 'yWKyyKWy', 'yyyooyyy', '.yppppy.', '.yppppy.', '..yyyy..', '..o..o..'],
    house: ['......RR......', '....RRRRRR....', '..RRRRRRRRRR..', 'RRRRRRRRRRRRRR', '.wwwwwwwwwwww.', '.wwbbwwwwKKww.', '.wwbbwwwwKKww.', '.wwwwwbbwwwww.', '.wwwwwbbwwwww.', '.wwwwwbbwwwww.'],
  };
  const FLOWERS = ['tulip', 'daisy', 'bell', 'sunflower', 'rose', 'lavender', 'rose', 'lavender'];
  const ROSES = [['#e63950', '#a8203a'], ['#ff7aa2', '#d94b78'], ['#fff1f4', '#f2b8c6'], ['#ffb347', '#e0812b']];


  // ── 깜짝 손님 동물들 (오른쪽을 보는 모습, 다리는 2프레임)
  const ANIMALS = {
    cat: { name: '고양이', emoji: '🐱', w: 22, big: false, pal: { A: '#f4a259', a: '#d9822b', K: '#3b3456', P: '#ff9fb2' },
      body: ['........A.A.', '........AAA.', 'A.......AKAP', '.A..AAAAAAA.', '..AAAAAAAAA.', '..AaAAAAaA..'],
      legs: [['..A.A..A.A..'], ['...A.A..A.A.']] },
    dog: { name: '강아지', emoji: '🐶', w: 22, big: false, pal: { A: '#c98b55', a: '#8a5a32', K: '#3b3456' },
      body: ['........AAA..', '.......aAKAAK', 'A......aAAAA.', '.A.AAAAAAAA..', '..AAAAAAAAA..', '..AAAAAAAAA..'],
      legs: [['..A.A...A.A..'], ['...A.A...A.A.']] },
    pig: { name: '돼지', emoji: '🐷', w: 14, big: false, pal: { A: '#ffb3c6', a: '#e88aa6', P: '#e8789b', K: '#3b3456' },
      body: ['...........A..', '..AAAAAAAAAAA.', 'aAAAAAAAAAAKAP', '.AAAAAAAAAAAAP', '.AAAAAAAAAAAA.', '..AAAAAAAAAA..'],
      legs: [['..a.a....a.a..'], ['...a.a....a.a.']] },
    cow: { name: '소', emoji: '🐮', w: 12, big: false, pal: { W: '#ffffff', K: '#3b3456', P: '#ffb3c6', y: '#e8d6a0' },
      body: ['............y..y', '............WWWW', 'K...........WKWW', '.KWWKKWWWWWWWWPP', '..WWKKWWWKKWWWPP', '..WWWWWWWKKWWW..', '..WWWWWWWWWWWW..'],
      legs: [['..K.K......K.K..'], ['...K.K......K.K.']] },
    horse: { name: '말', emoji: '🐴', w: 10, big: false, pal: { A: '#a0683c', a: '#5a3a22', K: '#2b2238' },
      body: ['............aA..', '...........aAAA.', '..........aAAKAA', 'a.........aAA...', '.a.AAAAAAAAAA...', '..AAAAAAAAAAA...', '..AAAAAAAAAA....'],
      legs: [['..A.A....A.A....', '..A.A....A.A....'], ['...A.A..A.A.....', '...A.A..A.A.....']] },
    bear: { name: '곰', emoji: '🐻', w: 8, big: false, pal: { A: '#8b5a2b', a: '#d9b38c', K: '#2b2238' },
      body: ['..........A.A..', '.........AAAAA.', '..AAAAAAAAAKAa.', '.AAAAAAAAAAAAaK', '.AAAAAAAAAAAA..', '.AAAAAAAAAAAA..'],
      legs: [['.AA.AA...AA.AA.'], ['..AA.AA.AA.AA..']] },
    giraffe: { name: '기린', emoji: '🦒', w: 5, big: true, pal: { A: '#f6c768', a: '#b0702c', K: '#3b3456' },
      body: ['...........a.a.', '...........AAA.', '..........AAKAA', '..........AA...', '..........aA...', '..........AA...', '..........Aa...', '..........AA...', '..........aA...', '..AAaAAaAAAA...', '.AAAAAaAAaAA...', 'a.AaAAAAAAaA...', '..AAAaAAaAA....'],
      legs: [['..A.A....A.A...', '..A.A....A.A...', '..a.a....a.a...'], ['...A.A..A.A....', '...A.A..A.A....', '...a.a..a.a....']] },
    elephant: { name: '코끼리', emoji: '🐘', w: 5, big: true, pal: { A: '#9aa3b5', a: '#7d8698', K: '#3b3456', W: '#fffbea' },
      body: ['...........AAAA...', '..AAAAAAAAAAaaAA..', '.AAAAAAAAAAAaaKAA.', 'aAAAAAAAAAAAaaAAA.', '.AAAAAAAAAAAAAAAW.', '.AAAAAAAAAAAAA.A..', '.AAAAAAAAAAAAA.A..'],
      legs: [['.AA.AA....AA.AA...', '.AA.AA....AA.AA...'], ['..AA.AA..AA.AA....', '..AA.AA..AA.AA....']] },
  };
  const HEART = ['.R.R.', 'RRRRR', 'RRRRR', '.RRR.', '..R..'];
  function animalRows(an, frame, flip) {
    const rows = [...an.body, ...an.legs[frame]];
    const wd = Math.max(...rows.map(r => r.length));
    const pad = rows.map(r => r.padEnd(wd, '.'));
    return flip ? pad.map(r => [...r].reverse().join('')) : pad;
  }
  function pickAnimal() {
    const ks = Object.keys(ANIMALS), tot = ks.reduce((s, k) => s + ANIMALS[k].w, 0);
    let r = Math.random() * tot; for (const k of ks) { r -= ANIMALS[k].w; if (r <= 0) return k; } return 'cat';
  }
  function spawn(state, atRandomX) {
    const kind = pickAnimal(), an = ANIMALS[kind], dir = Math.random() < .5 ? 1 : -1;
    const lanes = an.big ? [GROUND_Y + 1] : [GROUND_Y + 13, GROUND_Y + 28, GROUND_Y + 43, H - 3];
    state.v = { kind, dir, x: atRandomX ? 30 + Math.random() * (W - 60) : (dir > 0 ? -22 : W + 4), y: lanes[(Math.random() * lanes.length) | 0], speed: an.big ? .5 : .8 + Math.random() * .5, step: 0, jump: 0, heart: 0, pause: 0 };
  }
  window.GARDEN_ANIMALS = Object.fromEntries(Object.entries(ANIMALS).map(([k, a]) => [k, { name: a.name, emoji: a.emoji }]));

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
    if (age === 1) return { rows: S.bud, pal: { P: ['rose', 'lavender'].includes(FLOWERS[(h >>> 4) % FLOWERS.length]) ? (FLOWERS[(h >>> 4) % FLOWERS.length] === 'rose' ? ROSES[(h >>> 9) % ROSES.length][0] : '#9b7bd8') : petal }, w: 5 };
    const kind = FLOWERS[(h >>> 4) % FLOWERS.length];
    if (kind === 'rose') { const [p, c] = ROSES[(h >>> 9) % ROSES.length]; return { rows: S.rose, pal: { P: p, C: c }, w: 7 }; }
    if (kind === 'lavender') return { rows: S.lavender, pal: { P: '#9b7bd8', C: '#c3a6f5' }, w: 7 };
    const center = kind === 'sunflower' ? '#7a4a2a' : '#ffd23f';
    return { rows: S[kind], pal: { P: kind === 'sunflower' ? '#ffd23f' : petal, C: center }, w: S[kind][0].length };
  }

  function drawVisitor(ctx, v) {
    const an = ANIMALS[v.kind]; const rows = animalRows(an, ((v.step / 3) | 0) % 2, v.dir < 0);
    const jy = v.jump > 0 ? -Math.round(Math.sin((v.jump / 10) * Math.PI) * 5) : 0;
    v.box = { x: v.x, y: v.y - rows.length + 1 + jy, w: rows[0].length, h: rows.length };
    sprite(ctx, rows, Math.round(v.x), v.box.y, an.pal);
    if (v.heart > 0) sprite(ctx, HEART, Math.round(v.x + rows[0].length / 2 - 2), v.box.y - 7 - ((20 - v.heart) / 4 | 0), { R: '#ff5a6e' });
  }

  function draw(ctx, days, today, t, state) {
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
    // 큰 동물은 울타리 뒤 언덕길로
    if (state && state.v && ANIMALS[state.v.kind].big) drawVisitor(ctx, state.v);
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
    const vis = state && state.v && !ANIMALS[state.v.kind].big ? state.v : null; let visDrawn = false;
    for (const it of items) {
      if (vis && !visDrawn && it.y > vis.y) { drawVisitor(ctx, vis); visDrawn = true; }
      const age = today - it.d;
      const pl = plantFor(it.d, it.idx, age);
      const sway = pl.rows.length > 6 && !sky.night ? Math.round(Math.sin(t / 600 + it.k) * 0.6) : 0;
      sprite(ctx, pl.rows, it.x - Math.floor(pl.w / 2) + sway, it.y - pl.rows.length + 1, pl.pal);
      if (it.d === today) { // 오늘 심은 새싹 반짝
        const f = ((t / 250) | 0) % 4;
        [[-5, -6], [5, -8], [0, -10]].forEach(([dx, dy], j) => { if ((f + j) % 2) px(ctx, it.x + dx, it.y + dy, 1, 1, '#fff7a8'); });
      }
    }
    if (vis && !visDrawn) drawVisitor(ctx, vis);
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
  window.drawGarden = function (canvas, days, today, opts = {}) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const state = { v: null };
    if (Math.random() < (opts.firstChance ?? .2)) spawn(state, true);
    let info = draw(ctx, days, today, performance.now(), state);
    let last = 0;
    const tick = () => {
      const v = state.v;
      if (!v) { if (Math.random() < (opts.chance ?? 1 / 260)) spawn(state); return; }
      if (v.heart > 0) v.heart--;
      if (v.jump > 0) v.jump--;
      if (v.pause > 0) { v.pause--; return; }
      v.x += v.dir * v.speed; v.step++;
      if (!ANIMALS[v.kind].big && Math.random() < .006) v.pause = 18;          // 가끔 멈춰서 두리번
      if (v.x < -30 || v.x > W + 30) state.v = null;
    };
    const loop = now => {
      if (!canvas.isConnected) return;
      if (now - last > 110) { last = now; tick(); draw(ctx, days, today, now, state); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    canvas.addEventListener('click', e => {
      const v = state.v; if (!v || !v.box) return;
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
      const b = v.box, m = 5;
      if (x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m) {
        v.jump = 10; v.heart = 20; v.pause = 14;
        opts.onTap && opts.onTap(v.kind, ANIMALS[v.kind]);
      }
    });
    return info;
  };
  window.gardenSummon = null;
  window.GARDEN_PER = PER;
})();
