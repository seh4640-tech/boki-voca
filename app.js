/* 수능 영단어 30일 — 정적 웹앱 (진도는 이 기기 브라우저에 저장) */
(() => {
  const DAYS = 30;
  const POS = { n: '명', v: '동', a: '형', ad: '부', conj: '접' };
  const SPLIT = WORDS.findIndex(w => w[0] === 'abolish'); // 이 앞: 기본·실력 / 이 뒤: 고난도

  // 결정적 셔플(매번 같은 순서) — Day마다 알파벳이 섞이도록
  function seeded(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function shuffleWith(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const ordered = [
    ...shuffleWith(WORDS.slice(0, SPLIT), seeded(7)),
    ...shuffleWith(WORDS.slice(SPLIT), seeded(11)),
  ].map(([w, p, m]) => ({ w, p, m }));
  const byWord = Object.fromEntries(ordered.map(o => [o.w, o]));
  const dayList = [];
  for (let d = 0; d < DAYS; d++) {
    const s = Math.round(ordered.length * d / DAYS), e = Math.round(ordered.length * (d + 1) / DAYS);
    dayList.push(ordered.slice(s, e));
  }
  const level = d => d < 10 ? '기본' : d < 20 ? '실력' : '고난도';

  // 저장소
  const KEY = 'suneung-voca-v1';
  const blank = { known: {}, wrong: {}, days: [], hide: false };
  let S;
  try { S = Object.assign({}, blank, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = { ...blank }; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const today = () => { const t = new Date(); return `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`; };
  function studied() { const t = today(); if (!S.days.includes(t)) { S.days.push(t); } save(); }
  function markKnown(w) { S.known[w] = 1; studied(); }
  function markWrong(w) { S.wrong[w] = Math.min((S.wrong[w] || 0) + 2, 4); delete S.known[w]; studied(); }
  function streak() {
    let n = 0; const d = new Date();
    if (!S.days.includes(today())) d.setDate(d.getDate() - 1);
    while (S.days.includes(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // 발음
  let voice = null;
  function pickVoice() { const vs = speechSynthesis.getVoices(); voice = vs.find(v => /en-US/i.test(v.lang) && /Samantha|Google|Microsoft/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null; }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(w) {
    if (!('speechSynthesis' in window)) return toast('이 브라우저는 발음 듣기를 지원하지 않아요');
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(w); u.lang = 'en-US'; u.rate = .9; if (voice) u.voice = voice; speechSynthesis.speak(u);
  }

  // UI 유틸
  const $ = s => document.querySelector(s);
  const app = $('#app');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1600); }
  const shuffle = a => shuffleWith(a, Math.random);
  const knownIn = list => list.filter(o => S.known[o.w]).length;
  const posLabel = p => POS[p] || p;

  const stack = [];
  function go(view, ...args) { stack.push([view, args]); render(); }
  function back() { if (stack.length > 1) { stack.pop(); render(); } }
  function root(view) { stack.length = 0; go(view); }
  function render() {
    const [view, args] = stack[stack.length - 1];
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    $('#backBtn').hidden = stack.length <= 1;
    document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === stack[0][0].tab));
    window.scrollTo(0, 0);
    view(...args);
  }
  const setTitle = t => { $('#title').textContent = t; };

  // ── 홈
  function Home() {
    setTitle('수능 영단어 30일');
    const total = ordered.length, k = Object.keys(S.known).filter(w => byWord[w]).length;
    let next = dayList.findIndex(l => knownIn(l) < l.length); if (next < 0) next = 0;
    const st = streak();
    app.innerHTML = `
      <section class="card hero">
        <div class="row between"><span class="sub">외운 단어</span><span class="sub">${st ? `🔥 ${st}일 연속` : '오늘 첫 학습을 시작해요'}</span></div>
        <div class="big">${k} <span style="font-size:18px;opacity:.8">/ ${total}</span></div>
        <div class="bar" style="margin:10px 0 14px"><i style="width:${(k / total * 100).toFixed(1)}%"></i></div>
        <button class="btn ghost" id="cont">Day ${next + 1} 이어서 공부하기 ›</button>
      </section>
      <h2>Day 선택</h2>
      <div class="days">${dayList.map((l, i) => { const kn = knownIn(l); return `
        <button class="day ${kn === l.length ? 'done' : ''}" data-d="${i}">
          <b>Day ${i + 1}</b><small>${l.length}개 · ${level(i)}</small>
          <div class="bar"><i style="width:${kn / l.length * 100}%"></i></div>
        </button>`; }).join('')}</div>`;
    $('#cont').onclick = () => go(Day, next);
    app.querySelectorAll('.day').forEach(b => b.onclick = () => go(Day, +b.dataset.d));
  }
  Home.tab = 'home';

  // ── Day 상세
  function Day(d) {
    setTitle(`Day ${d + 1}`);
    const list = dayList[d];
    const draw = () => {
      const kn = knownIn(list);
      app.innerHTML = `
        <section class="card">
          <div class="row between"><span class="lvl">${level(d)}</span><span class="muted">${kn} / ${list.length} 외움</span></div>
          <div class="bar" style="margin:10px 0 14px"><i style="width:${kn / list.length * 100}%"></i></div>
          <div class="btns"><button class="btn" id="fc">🃏 카드로 외우기</button><button class="btn light" id="qz">✓ 퀴즈 풀기</button></div>
        </section>
        <section class="card">
          <div class="row between" style="margin-bottom:4px"><b>단어 목록</b><button class="toggle" id="hide">${S.hide ? '뜻 보이기' : '뜻 가리기'}</button></div>
          <ul class="wlist">${list.map(o => `
            <li><button class="say" data-w="${esc(o.w)}">🔊</button>
              <span class="w">${esc(o.w)}<span class="p">${posLabel(o.p)}</span></span>
              ${S.known[o.w] ? '<span class="k">✓</span>' : ''}
              <span class="m ${S.hide ? 'hide' : ''}">${esc(o.m)}</span></li>`).join('')}</ul>
        </section>`;
      $('#fc').onclick = () => go(Flash, list, `Day ${d + 1} 카드`);
      $('#qz').onclick = () => go(QuizMode, list, `Day ${d + 1} 퀴즈`);
      $('#hide').onclick = () => { S.hide = !S.hide; save(); draw(); };
      app.querySelectorAll('.say').forEach(b => b.onclick = () => speak(b.dataset.w));
      app.querySelectorAll('.m.hide').forEach(m => m.onclick = () => m.classList.remove('hide'));
    };
    draw();
  }

  // ── 플래시카드
  function Flash(list, title) {
    setTitle(title);
    let deck = shuffle(list), i = 0, ok = 0; const missed = [];
    const draw = () => {
      if (i >= deck.length) {
        app.innerHTML = `<section class="card center">
          <p class="muted">카드 한 바퀴 끝!</p><div class="score">${ok}<span style="font-size:22px;color:var(--sub)"> / ${deck.length}</span></div>
          <p class="muted">알아요 ${ok}개 · 모르겠어요 ${missed.length}개</p>
          ${missed.length ? `<button class="btn" id="again" style="margin-bottom:10px">모르는 ${missed.length}개만 다시</button>` : ''}
          <button class="btn light" id="qz" style="margin-bottom:10px">퀴즈로 확인하기</button>
          <button class="btn light" id="done">끝내기</button></section>`;
        if (missed.length) $('#again').onclick = () => { deck = shuffle(missed.splice(0)); i = 0; ok = 0; draw(); };
        $('#qz').onclick = () => { stack.pop(); go(QuizMode, list, title.replace('카드', '퀴즈')); };
        $('#done').onclick = back;
        return;
      }
      const o = deck[i];
      app.innerHTML = `
        <div class="progress-top"><span>${i + 1} / ${deck.length}</span><span>알아요 ${ok}</span></div>
        <div class="bar" style="margin-bottom:12px"><i style="width:${i / deck.length * 100}%"></i></div>
        <div class="flash" id="card"><div class="inner">
          <div class="face"><button class="say" id="say">🔊</button><div class="word">${esc(o.w)}</div><div class="pos">${posLabel(o.p)}</div><div class="hint">탭해서 뜻 보기</div></div>
          <div class="face back"><div class="word" style="font-size:22px;color:var(--sub);margin-bottom:12px">${esc(o.w)}</div><div class="mean">${esc(o.m)}</div></div>
        </div></div>
        <div class="judge"><button class="no" id="no">모르겠어요</button><button class="yes" id="yes">알아요</button></div>`;
      const card = $('#card');
      card.onclick = e => { if (e.target.id !== 'say') card.classList.toggle('flip'); };
      $('#say').onclick = () => speak(o.w);
      $('#yes').onclick = () => { markKnown(o.w); ok++; i++; draw(); };
      $('#no').onclick = () => { if (!card.classList.contains('flip')) { card.classList.add('flip'); return; } markWrong(o.w); missed.push(o); i++; draw(); };
      speak(o.w);
    };
    draw();
  }

  // ── 퀴즈 방식 선택
  function QuizMode(list, title, isWrongNote) {
    setTitle(title);
    app.innerHTML = `<section class="card">
      <p style="margin-top:0"><b>${list.length}문제</b> · 어떤 방식으로 풀까요?</p>
      <button class="btn" id="m1" style="margin-bottom:10px">영어 보고 뜻 고르기</button>
      <button class="btn light" id="m2" style="margin-bottom:10px">뜻 보고 영어 고르기</button>
      <button class="btn light" id="m3">섞어서</button></section>`;
    const start = mode => { stack.pop(); go(Quiz, list, title, mode, isWrongNote); };
    $('#m1').onclick = () => start('en'); $('#m2').onclick = () => start('ko'); $('#m3').onclick = () => start('mix');
  }

  function choicesFor(o, field) {
    const same = ordered.filter(x => x.w !== o.w && x.p === o.p && x.m !== o.m);
    const pool = shuffle(same.length >= 3 ? same : ordered.filter(x => x.w !== o.w));
    const picks = []; for (const x of pool) { if (picks.length === 3) break; if (!picks.some(p => p[field] === x[field])) picks.push(x); }
    return shuffle([o, ...picks]);
  }

  // ── 퀴즈
  function Quiz(list, title, mode, isWrongNote) {
    setTitle(title);
    const qs = shuffle(list); let i = 0, score = 0; const missed = [];
    const draw = () => {
      if (i >= qs.length) return result();
      const o = qs[i], dir = mode === 'mix' ? (Math.random() < .5 ? 'en' : 'ko') : mode;
      const opts = choicesFor(o, dir === 'en' ? 'm' : 'w');
      app.innerHTML = `
        <div class="progress-top"><span>${i + 1} / ${qs.length}</span><span>정답 ${score}</span></div>
        <div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>
        ${dir === 'en'
          ? `<div class="q-word">${esc(o.w)}</div><div class="q-pos">${posLabel(o.p)} · <button class="toggle" id="say">🔊 듣기</button></div>`
          : `<div class="q-word ko">${esc(o.m)}</div><div class="q-pos">${posLabel(o.p)}</div>`}
        <div class="opts">${opts.map((x, n) => `<button class="opt" data-w="${esc(x.w)}"><span class="n">${n + 1}</span>${esc(dir === 'en' ? x.m : x.w)}</button>`).join('')}</div>
        <div id="nx"></div>`;
      if (dir === 'en') { $('#say').onclick = () => speak(o.w); speak(o.w); }
      app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const right = b.dataset.w === o.w;
        app.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.dataset.w === o.w) x.classList.add('correct'); });
        if (right) {
          score++; markKnown(o.w);
          if (S.wrong[o.w]) { S.wrong[o.w]--; if (S.wrong[o.w] <= 0) delete S.wrong[o.w]; save(); }
          if (dir === 'ko') speak(o.w);
          setTimeout(() => { i++; draw(); }, 650);
        } else {
          b.classList.add('wrong'); markWrong(o.w); missed.push(o);
          $('#nx').innerHTML = `<p class="muted center" style="margin:14px 0 4px">${esc(o.w)} = ${esc(o.m)} · 오답노트에 넣었어요</p><button class="btn next" id="go">다음 ›</button>`;
          $('#go').onclick = () => { i++; draw(); };
        }
      });
    };
    const result = () => {
      const pct = Math.round(score / qs.length * 100);
      app.innerHTML = `<section class="card center">
        <p class="muted">${pct === 100 ? '완벽해요! 🎉' : pct >= 80 ? '잘했어요! 👍' : pct >= 50 ? '조금만 더! 💪' : '오답노트로 복습해요 📖'}</p>
        <div class="score">${pct}점</div><p class="muted">${qs.length}문제 중 ${score}개 정답</p>
        ${missed.length ? `<button class="btn" id="re" style="margin:6px 0 10px">틀린 ${missed.length}개 다시 풀기</button>` : ''}
        <button class="btn light" id="done">끝내기</button></section>
        ${missed.length ? `<section class="card"><b>틀린 단어</b><ul class="wlist">${missed.map(o => `<li><span class="w">${esc(o.w)}</span><span class="m">${esc(o.m)}</span></li>`).join('')}</ul></section>` : ''}`;
      if (missed.length) $('#re').onclick = () => { stack.pop(); go(Quiz, missed.slice(), title, mode, isWrongNote); };
      $('#done').onclick = back;
    };
    draw();
  }

  // ── 오답노트
  function Wrong() {
    setTitle('오답노트');
    const list = Object.keys(S.wrong).map(w => byWord[w]).filter(Boolean).sort((a, b) => S.wrong[b.w] - S.wrong[a.w]);
    if (!list.length) { app.innerHTML = `<div class="empty"><div style="font-size:44px">📭</div><p>틀린 단어가 없어요.<br>퀴즈에서 틀리거나 카드에서 '모르겠어요'를 누르면 여기 모여요.</p></div>`; return; }
    app.innerHTML = `
      <section class="card"><p style="margin-top:0"><b>${list.length}개</b> 복습할 단어가 있어요</p>
        <p class="muted" style="margin-top:-6px">퀴즈에서 두 번 맞히면 오답노트에서 빠져요.</p>
        <div class="btns"><button class="btn" id="qz">오답 퀴즈</button><button class="btn light" id="fc">오답 카드</button></div></section>
      <section class="card"><ul class="wlist">${list.map(o => `
        <li><button class="say" data-w="${esc(o.w)}">🔊</button><span class="w">${esc(o.w)}<span class="p">${posLabel(o.p)}</span></span>
        <span class="m">${esc(o.m)}</span></li>`).join('')}</ul></section>`;
    const sample = list.slice(0, 30);
    $('#qz').onclick = () => go(QuizMode, sample, '오답 퀴즈', true);
    $('#fc').onclick = () => go(Flash, sample, '오답 카드');
    app.querySelectorAll('.say').forEach(b => b.onclick = () => speak(b.dataset.w));
  }
  Wrong.tab = 'wrong';

  // ── 기록
  function Stats() {
    setTitle('학습 기록');
    const k = Object.keys(S.known).filter(w => byWord[w]).length;
    const doneDays = dayList.filter(l => knownIn(l) === l.length).length;
    const cells = []; const d = new Date(); d.setDate(d.getDate() - 27);
    for (let n = 0; n < 28; n++) { const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; cells.push(`<i class="${S.days.includes(key) ? 'on' : ''}" title="${key}"></i>`); d.setDate(d.getDate() + 1); }
    app.innerHTML = `
      <div class="stat-grid">
        <div class="stat"><b>${k}</b><span>외운 단어</span></div>
        <div class="stat"><b>${doneDays}<small style="font-size:15px"> / 30</small></b><span>완료한 Day</span></div>
        <div class="stat"><b>${streak()}일</b><span>연속 학습</span></div>
        <div class="stat"><b>${Object.keys(S.wrong).length}</b><span>오답노트</span></div>
      </div>
      <section class="card" style="margin-top:14px"><b>최근 4주</b><div class="cal">${cells.join('')}</div></section>
      <section class="card"><b>홈 화면에 추가하기</b>
        <p class="muted">앱처럼 쓰려면 브라우저 메뉴에서 <b>'홈 화면에 추가'</b>를 누르세요. (아이폰: 사파리 공유 버튼 → 홈 화면에 추가)</p>
        <p class="muted" style="margin-bottom:0">학습 기록은 이 휴대폰 브라우저에 저장돼요.</p></section>
      <button class="danger" id="reset">학습 기록 모두 지우기</button>`;
    $('#reset').onclick = () => { if (confirm('외운 단어·오답노트·기록을 모두 지울까요?')) { S = { ...blank, known: {}, wrong: {}, days: [] }; save(); toast('초기화했어요'); Stats(); } };
  }
  Stats.tab = 'stats';

  // ── 검색
  function Search() {
    setTitle('단어 검색');
    app.innerHTML = `<input class="search" id="q" placeholder="영어 또는 한글 뜻으로 검색" autocomplete="off" autocapitalize="off"><ul class="wlist card" id="res" style="padding:4px 12px"></ul>`;
    const q = $('#q'), res = $('#res');
    const run = () => {
      const t = q.value.trim().toLowerCase();
      if (!t) { res.innerHTML = `<li class="muted">${ordered.length}개 단어에서 찾아요</li>`; return; }
      const hits = ordered.filter(o => o.w.startsWith(t) || o.m.includes(t)).concat(ordered.filter(o => !o.w.startsWith(t) && o.w.includes(t))).slice(0, 50);
      res.innerHTML = hits.length ? hits.map(o => { const d = dayList.findIndex(l => l.includes(o)); return `
        <li><button class="say" data-w="${esc(o.w)}">🔊</button><span class="w">${esc(o.w)}<span class="p">Day ${d + 1}</span></span><span class="m">${esc(o.m)}</span></li>`; }).join('') : '<li class="muted">검색 결과가 없어요</li>';
      res.querySelectorAll('.say').forEach(b => b.onclick = () => speak(b.dataset.w));
    };
    q.oninput = run; run(); setTimeout(() => q.focus(), 50);
  }

  $('#backBtn').onclick = back;
  $('#searchBtn').onclick = () => go(Search);
  document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => root({ home: Home, wrong: Wrong, stats: Stats }[b.dataset.tab]));
  root(Home);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
