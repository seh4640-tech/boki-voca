/* 보키랑 영단어 — 간격 반복 암기 웹앱 (기록은 이 기기 브라우저에 저장) */
(() => {
  const POS = { n: '명', v: '동', a: '형', ad: '부', conj: '접' };
  const SET_SIZE = 40;
  // 상자(box)별 다음 복습까지 걸리는 날 수
  const INTERVAL = [0, 1, 3, 7, 15, 30, 60, 120, 240];
  const MAXBOX = INTERVAL.length - 1;
  const LEVEL = ['1단계', '2단계', '3단계', '4단계'];

  function shuffleWith(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const shuffle = a => shuffleWith(a, Math.random);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // words.js는 쉬운 단어부터 정렬되어 있어요
  const ordered = WORDS.map(([w, p, m, lv], i) => ({ w, p, m, lv, i }));
  const byWord = Object.fromEntries(ordered.map(o => [o.w, o]));
  const sets = []; for (let i = 0; i < ordered.length; i += SET_SIZE) sets.push(ordered.slice(i, i + SET_SIZE));
  const setLevel = k => { const c = [0, 0, 0, 0]; sets[k].forEach(o => c[o.lv]++); return LEVEL[c.indexOf(Math.max(...c))]; };

  // 마스코트 '보키' (부엉이)
  const BOKI = `<svg viewBox="0 0 100 100" class="boki-svg" aria-hidden="true"><path d="M22 34 L30 14 L42 30 Z M78 34 L70 14 L58 30 Z" fill="#e0a93f"/><ellipse cx="50" cy="58" rx="34" ry="36" fill="#f6c768"/><ellipse cx="50" cy="70" rx="20" ry="18" fill="#fbe3ad"/><circle cx="37" cy="48" r="12" fill="#fff"/><circle cx="63" cy="48" r="12" fill="#fff"/><circle cx="39" cy="50" r="6" fill="#1d2433"/><circle cx="61" cy="50" r="6" fill="#1d2433"/><circle cx="41" cy="48" r="2" fill="#fff"/><circle cx="63" cy="48" r="2" fill="#fff"/><path d="M45 58 L50 65 L55 58 Z" fill="#e07a2f"/><circle cx="27" cy="62" r="4" fill="#f4a39a" opacity=".7"/><circle cx="73" cy="62" r="4" fill="#f4a39a" opacity=".7"/></svg>`;
  const boki = (msg, small) => `<div class="boki ${small ? 'small' : ''}">${BOKI}<div class="bubble">${msg}</div></div>`;
  const CHEER_OK = ['정답! 👏', '오 잘한다!', '완벽해요 ✨', '바로 그거야!', '기억력 최고!', '좋아요 👍'];
  const CHEER_NG = ['괜찮아요, 다시 나올 거예요', '틀려도 돼요! 이렇게 외우는 거예요', '한 번 더 보면 기억나요', '아깝다! 다음엔 맞힐 수 있어요'];

  // ── 저장 (사람마다 따로)
  const PKEY = 'voca-profiles-v1';
  let P; try { P = JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch { P = null; }
  if (!P) P = { list: [], cur: null };
  if (!P.list.length) P.list = [
    { id: 'seola', name: '홍설아', emoji: '🐰', course: '고등학생', start: 0 },
    { id: 'yeona', name: '홍연아', emoji: '🐣', course: '중학생', start: 0 },
  ];
  const saveP = () => { try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch {} };
  const KEY = () => 'voca-data-' + P.cur;
  const fresh = () => ({ cards: {}, daily: 10, start: 0, days: [], newToday: { d: 0, n: 0 }, log: {}, xp: 0, badges: {}, st: { spell: 0, perfect: 0, match60: 0, sessions: 0, practice: 0, combo: 0 } });
  let S = fresh();
  function loadProfile() { const raw = localStorage.getItem(KEY()); try { S = Object.assign(fresh(), JSON.parse(raw || '{}')); } catch { S = fresh(); } if (!(S.daily >= 10)) S.daily = 10; }
  const me = () => P.list.find(p => p.id === P.cur);
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
  if (P.cur && me()) loadProfile(); else P.cur = null;
  const save = () => { if (!P.cur) return; try { localStorage.setItem(KEY(), JSON.stringify(S)); } catch {} };
  const dayNum = (t = new Date()) => Math.floor((t.getTime() - t.getTimezoneOffset() * 60000) / 86400000);
  const TODAY = () => dayNum();
  function touch(kind) {
    const t = TODAY();
    if (!S.days.includes(t)) { S.days.push(t); setTimeout(() => celebrate('출석 완료! 🌱', '오늘의 새싹을 정원에 심었어요.<br>내일 오면 꽃봉오리가 되고, 그다음엔 꽃이 펴요!', '🌱'), 900); }
    S.log[t] = S.log[t] || { n: 0, r: 0, ok: 0, ng: 0 };
    if (kind) S.log[t][kind]++;
  }
  const card = w => S.cards[w];
  const stage = w => { const c = card(w); if (!c) return 0; return c.b <= 2 ? 1 : c.b <= 4 ? 2 : 3; };
  const STAGE = ['🌰 씨앗', '🌱 새싹', '🌿 무럭무럭', '🌳 내 거!'];
  const STAGE_C = ['#e3d7c6', '#a8e06a', '#4cc38a', '#2a9d6a'];

  // 오늘의 학습에서 처음 답한 결과로 일정 갱신
  function gradeReview(w, ok) {
    const c = S.cards[w] || (S.cards[w] = { b: 0, d: TODAY(), l: 0 });
    if (ok) { c.b = Math.min(c.b + 1, MAXBOX); c.d = TODAY() + INTERVAL[c.b]; touch('ok'); addXP(10); }
    else { c.b = 1; c.d = TODAY() + 1; c.l = (c.l || 0) + 1; touch('ng'); }
    save();
  }
  function learnNew(w) {
    S.cards[w] = { b: 1, d: TODAY() + 1, l: 0 };
    if (S.newToday.d !== TODAY()) S.newToday = { d: TODAY(), n: 0 };
    S.newToday.n++; touch('n'); addXP(15); save();
  }
  // 자유 연습: 틀리면 하루 뒤 다시 나오게, 맞히면 일정 유지
  function practiceResult(w, ok) {
    touch(ok ? 'ok' : 'ng'); if (ok) addXP(3);
    const c = card(w);
    if (!ok && c) { c.b = Math.max(1, c.b - 1); c.d = Math.min(c.d, TODAY() + 1); c.l = (c.l || 0) + 1; }
    save();
  }
  const dueList = () => ordered.filter(o => { const c = card(o.w); return c && c.d <= TODAY(); }).sort((a, b) => card(a.w).d - card(b.w).d);
  const newLeft = () => Math.max(0, S.daily - (S.newToday.d === TODAY() ? S.newToday.n : 0));
  const unseen = () => ordered.filter(o => !card(o.w));
  const learned = () => ordered.filter(o => card(o.w));
  function streak() {
    let n = 0, d = TODAY();
    if (!S.days.includes(d)) d--;
    while (S.days.includes(d)) { n++; d--; }
    return n;
  }



  // ── 효과음(직접 합성) + 진동
  let actx = null;
  const sfxOn = () => !S || S.sfx !== false, hapOn = () => !S || S.hap !== false;
  function ac() { if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; actx = new C(); } if (actx.state === 'suspended') actx.resume(); return actx; }
  function tone(freq, start, dur, type = 'sine', vol = .18, slide) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + start, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .02);
  }
  // 효과음 파일: uisfx (CC0) rubber·arcade 팩. 못 불러오면 합성음으로 대신
  const SYN = {
    tap: () => tone(660, 0, .07, 'sine', .07, 880),
    ok: () => { tone(784, 0, .12, 'triangle', .16); tone(1175, .09, .2, 'triangle', .16); },
    ng: () => { tone(330, 0, .16, 'sine', .14, 220); tone(262, .13, .22, 'sine', .12, 196); },
    pair: () => tone(988, 0, .1, 'triangle', .13, 1319),
    flip: () => tone(520, 0, .08, 'sine', .08, 760),
    combo: () => [784, 988, 1175, 1568].forEach((f, k) => tone(f, k * .06, .12, 'triangle', .11)),
    fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, k) => tone(f, k * .1, k === 5 ? .45 : .14, 'triangle', .15)),
  };
  SYN.levelup = SYN.badge = SYN.complete = SYN.fanfare;
  const SFX_VOL = { tap: .35, flip: .4, ok: .3, ng: .35, pair: .4, combo: .4, levelup: .55, badge: .55, complete: .55 };
  const PACKS = [['soft', '☁️ 부드러운'], ['rubber', '🎈 말랑'], ['organic', '🌿 자연'], ['glass', '✨ 반짝'], ['dreamy', '🫧 몽글'], ['arcade', '👾 게임']];
  const packOf = () => (S && PACKS.some(p => p[0] === S.pack)) ? S.pack : 'soft';
  const buffers = {}; const loaded = {};
  function loadSfx(pack = packOf()) {
    if (loaded[pack]) return; const c = ac(); if (!c) return; loaded[pack] = true;
    Object.keys(SFX_VOL).forEach(k => fetch(`sfx/${pack}/${k}.mp3`).then(r => r.arrayBuffer())
      .then(b => new Promise((ok, ng) => c.decodeAudioData(b, ok, ng))).then(buf => { buffers[pack + '/' + k] = buf; }).catch(() => {}));
  }
  function playSfx(k, pack = packOf()) {
    const c = ac(); if (!c) return;
    const buf = buffers[pack + '/' + k];
    if (!buf) { loadSfx(pack); return SYN[k] && SYN[k](); }
    const s = c.createBufferSource(), g = c.createGain(); g.gain.value = SFX_VOL[k] || .8;
    s.buffer = buf; s.connect(g); g.connect(c.destination); s.start();
  }
  // 아이폰(iOS 18+)은 스위치 체크박스를 누를 때 진동이 나는 걸 이용
  const hapLabel = (() => { const l = document.createElement('label'); l.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9px'; l.innerHTML = '<input type="checkbox" switch>'; document.body.appendChild(l); return l; })();
  const VIB = { tap: 8, ok: 25, ng: [40, 60, 40], pair: 15, flip: 8, combo: [20, 40, 20], levelup: [30, 60, 30, 60, 60], badge: [30, 60, 30, 60, 60], complete: [30, 60, 30, 60, 60] };
  function buzz(kind) {
    if (!hapOn()) return;
    if (navigator.vibrate) { navigator.vibrate(VIB[kind] || 10); return; }
    hapLabel.click(); if (kind === 'ng' || kind === 'combo' || kind === 'levelup' || kind === 'badge' || kind === 'complete') setTimeout(() => hapLabel.click(), 120);
  }
  function fx(kind) { if (sfxOn()) try { playSfx(kind); } catch {} buzz(kind); }
  document.addEventListener('pointerdown', e => {
    loadSfx();
    const b = e.target.closest('button, a.btn, .tile, .opt');
    if (!b || b.disabled || b.closest('.opt') || b.classList.contains('tile')) return;
    fx('tap');
  }, { passive: true });

  // ── 게임 요소: 경험치·레벨·배지
  const TITLES = ['알', '아기 부엉이', '꼬마 탐험가', '단어 수집가', '단어 탐정', '단어 기사', '단어 마법사', '단어 박사', '단어 마스터', '전설의 부엉이'];
  const xpFor = n => 30 * n * (n - 1); // 레벨 n이 되는 데 필요한 누적 경험치
  const levelOf = xp => { let n = 1; while (xp >= xpFor(n + 1)) n++; return n; };
  const titleOf = n => n <= TITLES.length ? TITLES[n - 1] : `${TITLES[TITLES.length - 1]} ${'★'.repeat(Math.min(5, n - TITLES.length))}`;
  function addXP(n) {
    const before = levelOf(S.xp || 0); S.xp = (S.xp || 0) + n; const after = levelOf(S.xp);
    if (after > before) celebrate(`레벨 업! Lv.${after}`, `이제 '${titleOf(after)}'이에요!`, '⬆️', 'levelup');
  }
  const longCnt = () => ordered.filter(o => stage(o.w) === 3).length;
  const BADGES = [
    { id: 'first', icon: '🌱', name: '첫걸음', desc: '첫 단어 심기', ok: () => learned().length >= 1 },
    { id: 'w50', icon: '📗', name: '단어 50', desc: '단어 50개 심기', ok: () => learned().length >= 50 },
    { id: 'w100', icon: '📘', name: '단어 100', desc: '단어 100개 배우기', ok: () => learned().length >= 100 },
    { id: 'w300', icon: '📙', name: '단어 300', desc: '단어 300개 배우기', ok: () => learned().length >= 300 },
    { id: 'w700', icon: '🎓', name: '1단계 정복', desc: '1단계 단어 모두 심기', ok: () => ordered.filter(o => o.lv === 0).every(o => card(o.w)) },
    { id: 'w1000', icon: '📚', name: '단어 1000', desc: '단어 1000개 배우기', ok: () => learned().length >= 1000 },
    { id: 'all', icon: '👑', name: '전설의 단어장', desc: '모든 단어 배우기', ok: () => learned().length >= ordered.length },
    { id: 'd3', icon: '🔥', name: '3일 연속', desc: '3일 연속 출석', ok: () => streak() >= 3 },
    { id: 'd7', icon: '🔥', name: '일주일 연속', desc: '7일 연속 출석', ok: () => streak() >= 7 },
    { id: 'd14', icon: '💪', name: '2주 연속', desc: '14일 연속 출석', ok: () => streak() >= 14 },
    { id: 'd30', icon: '🏆', name: '한 달 연속', desc: '30일 연속 출석', ok: () => streak() >= 30 },
    { id: 'l1', icon: '🌳', name: '첫 나무', desc: '🌳 내 거! 단어 1개', ok: () => longCnt() >= 1 },
    { id: 'l50', icon: '🌲', name: '작은 숲', desc: '🌳 내 거! 단어 50개', ok: () => longCnt() >= 50 },
    { id: 'l200', icon: '🏞️', name: '큰 숲', desc: '🌳 내 거! 단어 200개', ok: () => longCnt() >= 200 },
    { id: 'c10', icon: '⚡', name: '10연속!', desc: '10문제 연속으로 맞히기', ok: () => S.st.combo >= 10 },
    { id: 'c25', icon: '🌟', name: '25연속!', desc: '25문제 연속으로 맞히기', ok: () => S.st.combo >= 25 },
    { id: 'perfect', icon: '💯', name: '퍼펙트', desc: '미션을 하나도 안 틀리고 끝내기', ok: () => S.st.perfect >= 1 },
    { id: 'spell', icon: '✍️', name: '철자 장인', desc: '철자 쓰기 30번 맞히기', ok: () => S.st.spell >= 30 },
    { id: 'match', icon: '🧩', name: '번개 손', desc: '짝 맞추기 12쌍 이상을 60초 안에', ok: () => S.st.match60 >= 1 },
    { id: 'prac', icon: '🎯', name: '연습벌레', desc: '자유 연습 10번 끝내기', ok: () => S.st.practice >= 10 },
    { id: 'lv5', icon: '🦉', name: '단어 탐정', desc: '레벨 5 달성', ok: () => levelOf(S.xp || 0) >= 5 },
    { id: 'lv10', icon: '🦅', name: '전설의 부엉이', desc: '레벨 10 달성', ok: () => levelOf(S.xp || 0) >= 10 },
  ];
  function checkBadges() {
    S.st = Object.assign({ spell: 0, perfect: 0, match60: 0, sessions: 0, practice: 0, combo: 0 }, S.st || {});
    S.badges = S.badges || {};
    for (const b of BADGES) if (!S.badges[b.id] && b.ok()) { S.badges[b.id] = TODAY(); addXP(20); celebrate(`스티커 획득! ${b.icon}`, `${b.name} — ${b.desc}`, b.icon); }
    save();
  }
  // 축하 팝업 (여러 개면 차례로)
  const popQ = []; let popOn = false;
  function celebrate(title, body, icon, kind = 'badge') { popQ.push({ title, body, icon, kind }); if (!popOn) nextPop(); }
  function nextPop() {
    const p = popQ.shift(); if (!p) { popOn = false; return; }
    popOn = true; confetti(); fx(p.kind);
    const el = document.createElement('div'); el.className = 'pop';
    el.innerHTML = `<div class="pop-card"><div class="pop-icon">${p.icon}</div><b>${p.title}</b><p>${p.body}</p><button class="btn accent">좋아요!</button></div>`;
    document.body.appendChild(el);
    el.querySelector('button').onclick = () => { el.remove(); nextPop(); };
  }
  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti';
    const colors = ['#e8a33d', '#2d7fd0', '#1f8a5b', '#e0566b', '#f6c768', '#8b5cf6'];
    for (let k = 0; k < 60; k++) {
      const i = document.createElement('i');
      i.style.cssText = `left:${Math.random() * 100}%;background:${pick(colors)};animation-delay:${Math.random() * .4}s;animation-duration:${1.4 + Math.random()}s;transform:rotate(${Math.random() * 360}deg)`;
      box.appendChild(i);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 2800);
  }
  let combo = 0;
  function onAnswer(ok, mode) {
    if (ok) { combo++; if (combo > (S.st.combo || 0)) S.st.combo = combo; if (mode === 'spell') S.st.spell++; }
    else combo = 0;
  }
  const comboHTML = () => combo >= 3 ? `<span class="combo">🔥 ${combo}연속!</span>` : '';
  


  // ── 공부 알림: 휴대폰 캘린더에 매일 23:00, 23:30 알림 추가
  function icsFile() {
    const url = location.origin + location.pathname;
    const now = new Date(), y = now.getFullYear(), mo = String(now.getMonth() + 1).padStart(2, '0'), d = String(now.getDate()).padStart(2, '0');
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ev = (uid, hm, title, msg) => [
      'BEGIN:VEVENT', `UID:${uid}-${P.cur}@boki-voca`, `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Seoul:${y}${mo}${d}T${hm}00`, `DURATION:PT10M`, 'RRULE:FREQ=DAILY',
      `SUMMARY:${title}`, `DESCRIPTION:${msg}\\n${url}`, `URL:${url}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'];
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//boki-voca//KO', 'CALSCALE:GREGORIAN',
      'BEGIN:VTIMEZONE', 'TZID:Asia/Seoul', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:+0900', 'TZOFFSETTO:+0900', 'TZNAME:KST', 'END:STANDARD', 'END:VTIMEZONE',
      ...ev('boki-2300', '2300', '🦉 보키랑 영단어 할 시간!', '오늘의 미션 5분만 하자'),
      ...ev('boki-2330', '2330', '🦉 오늘 미션 했어요?', '아직이면 지금 딱 5분만!'),
      'END:VCALENDAR'].join('\r\n');
  }
  function addAlarm() {
    const blob = new Blob([icsFile()], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'boki-alarm.ics';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    S.alarm = true; save(); toast('캘린더에 추가하면 매일 밤 알려 줄게요!');
  }
  const googleCal = (hm, title) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(location.origin + location.pathname)}&dates=${(() => { const n = new Date(), s = `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, '0')}${String(n.getDate()).padStart(2, '0')}`; return `${s}T${hm}00/${s}T${hm.slice(0, 2)}${String(+hm.slice(2) + 10).padStart(2, '0')}00`; })()}&ctz=Asia/Seoul&recur=${encodeURIComponent('RRULE:FREQ=DAILY')}`;
  const alarmCard = () => `<section class="card alarm"><b>⏰ 공부 알림</b>
      <p class="muted" style="margin:6px 0 12px">매일 밤 <b>11시</b>, <b>11시 30분</b>에 휴대폰으로 알려 줄게요. 알림을 누르면 바로 앱이 열려요.</p>
      <button class="btn accent" id="alarm">${S.alarm ? '알림 다시 추가하기' : '📅 휴대폰에 알림 추가하기'}</button>
      <details style="margin-top:10px"><summary class="muted">안드로이드에서 잘 안 되면?</summary>
        <p class="muted">구글 캘린더로 하나씩 추가해 주세요. 저장할 때 알림을 '일정 시작 시간'으로 바꾸면 정확한 시간에 울려요.</p>
        <div class="btns"><a class="btn light" target="_blank" rel="noopener" href="${googleCal('2300', '🦉 보키랑 영단어 할 시간!')}">밤 11시</a><a class="btn light" target="_blank" rel="noopener" href="${googleCal('2330', '🦉 오늘 미션 했어요?')}">밤 11시 30분</a></div></details>
      <p class="muted" style="margin:10px 0 0;font-size:12.5px">아이폰: 파일이 열리면 '모두 추가' → 캘린더에 저장돼요.</p></section>`;

  // ── 발음
  // 1순위: 원어민 녹음(audio.js), 2순위: 기기의 가장 자연스러운 영어 음성
  const CM = 'https://upload.wikimedia.org/wikipedia/commons/transcoded';
  const AUD = typeof AUDIO === 'object' ? AUDIO : {};
  const audioUrl = w => {
    const v = AUD[w]; if (!v) return null;
    if (v[0] === '#') { const f = `En-us-${w}.ogg`; return `${CM}/${v[1]}/${v.slice(1)}/${f}/${f}.mp3`; }
    if (v[0] === '/') return CM + v;
    return v;
  };
  const canTTS = 'speechSynthesis' in window;
  const canSpeak = true;
  let voice = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang));
    const score = v => {
      let s = 0; const n = v.name;
      if (/natural|neural|premium|enhanced|online/i.test(n)) s += 50;
      if (/Google US English|Samantha|Ava|Allison|Aria|Jenny|Guy|Zoe|Nicky|Evan/i.test(n)) s += 30;
      if (/en[-_]US/i.test(v.lang)) s += 20; else if (/en[-_](GB|AU|CA)/i.test(v.lang)) s += 8;
      if (/compact|eloquence|novelty|whisper|bad news|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|wobble|zarvox|albert|fred|junior|ralph/i.test(n)) s -= 60;
      return s;
    };
    voice = vs.sort((a, b) => score(b) - score(a))[0] || null;
  }
  if (canTTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function tts(w) {
    if (!canTTS) return;
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(w); u.lang = 'en-US'; u.rate = .85; if (voice) u.voice = voice; speechSynthesis.speak(u);
  }
  const player = new Audio(); player.preload = 'auto';
  let speakId = 0;
  function speak(w) {
    const url = audioUrl(w), id = ++speakId;
    if (canTTS) speechSynthesis.cancel();
    if (!url) return tts(w);
    player.pause(); player.src = url; player.currentTime = 0;
    const fail = () => { if (id === speakId) tts(w); };
    player.onerror = fail;
    const p = player.play(); if (p && p.catch) p.catch(fail);
  }
  function stopSpeak() { speakId++; player.pause(); if (canTTS) speechSynthesis.cancel(); }

  // ── 화면 유틸
  const $ = s => document.querySelector(s);
  const app = $('#app');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1600); }
  const posLabel = p => POS[p] || p;
  const dot = w => `<i class="dot" style="background:${STAGE_C[stage(w)]}" title="${STAGE[stage(w)]}"></i>`;

  const stack = [];
  function go(view, ...args) { stack.push([view, args]); render(); }
  function back() { if (stack.length > 1) { stack.pop(); render(); } }
  function root(view) { stack.length = 0; go(view); }
  function render() {
    const [view, args] = stack[stack.length - 1];
    stopSpeak();
    $('#backBtn').hidden = stack.length <= 1;
    document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === stack[0][0].tab));
    window.scrollTo(0, 0);
    view(...args);
  }
  const setTitle = t => { $('#title').textContent = t; };

  // ── 문제 하나 그리기 (모드: intro / en / ko / listen / spell)
  function choicesFor(o, field) {
    let same = ordered.filter(x => x.w !== o.w && x.p === o.p && x.m !== o.m && x.lv === o.lv);
    if (same.length < 3) same = ordered.filter(x => x.w !== o.w && x.p === o.p && x.m !== o.m);
    const pool = shuffle(same.length >= 3 ? same : ordered.filter(x => x.w !== o.w));
    const picks = []; for (const x of pool) { if (picks.length === 3) break; if (x[field] !== o[field] && !picks.some(p => p[field] === x[field])) picks.push(x); }
    return shuffle([o, ...picks]);
  }
  const MODE_NAME = { intro: '✨ 새 단어', en: '🔤 뜻 고르기', ko: '🇰🇷 영어 고르기', listen: '🎧 듣고 고르기', spell: '✍️ 철자 쓰기' };

  function ask(host, o, mode, done) {
    if (mode === 'listen' && !audioUrl(o.w) && !canTTS) mode = 'en';
    const finish = (ok, extra = '') => {
      onAnswer(ok, mode);
      fx(ok ? (combo >= 3 && combo % 5 === 0 ? 'combo' : 'ok') : 'ng');
      if (ok) { const af = host.querySelector('.after'); if (af) af.innerHTML = `<p class="cheer">${pick(CHEER_OK)} ${comboHTML()}</p>`; setTimeout(() => done(true), mode === 'spell' ? 800 : 700); return; }
      host.querySelector('.after').innerHTML = `<p class="cheer ng">${pick(CHEER_NG)}</p><p class="answer">${esc(o.w)} = ${esc(o.m)}</p>${extra}<button class="btn next" id="nx">다음 ›</button>`;
      host.querySelector('#nx').onclick = () => done(false);
      host.querySelector('#nx').focus();
    };
    if (mode === 'intro') {
      host.innerHTML = `<div class="flash" id="card"><div class="inner">
          <div class="face"><span class="tag">✨ 새 단어</span><button class="say" id="say">🔊</button><div class="word">${esc(o.w)}</div><div class="hint">탭해서 뜻 보기</div></div>
          <div class="face back"><span class="tag">✨ 새 단어</span><div class="word sm">${esc(o.w)}</div><div class="mean">${esc(o.m)}</div><div class="hint">소리 내어 3번 읽어 보세요</div></div>
        </div></div><button class="btn" id="got">외웠어요 ›</button>`;
      const c = host.querySelector('#card');
      c.onclick = e => { if (e.target.id !== 'say') { c.classList.toggle('flip'); fx('flip'); } };
      host.querySelector('#say').onclick = () => speak(o.w);
      host.querySelector('#got').onclick = () => { if (!c.classList.contains('flip')) { c.classList.add('flip'); return; } done(true); };
      speak(o.w);
      return;
    }
    if (mode === 'spell') {
      host.innerHTML = `<span class="tag">${MODE_NAME.spell}</span>
        <div class="q-word ko">${esc(o.m)}</div>
        <div class="q-pos">${o.w.length}글자</div><div class="hintline" id="hl"></div>
        <input class="spell" id="sp" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="영어로 쓰세요">
        <div class="btns3" style="margin-top:10px"><button class="btn light" id="giveup">몰라요</button><button class="btn light" id="hint">💡 힌트</button><button class="btn" id="chk">확인</button></div>
        <div class="after"></div>`;
      const inp = host.querySelector('#sp'); setTimeout(() => inp.focus(), 50);
      let shown = 1; const hl = host.querySelector('#hl');
      const drawHint = () => { hl.textContent = o.w.split('').map((c, k) => k < shown ? c : '_').join(' '); };
      drawHint();
      host.querySelector('#hint').onclick = () => { if (shown < o.w.length - 1) shown++; drawHint(); speak(o.w); inp.focus(); };
      const check = giveup => {
        const v = inp.value.trim().toLowerCase(); if (!v && !giveup) return;
        inp.disabled = true; host.querySelector('.btns3').remove();
        const ok = !giveup && v === o.w.toLowerCase();
        inp.classList.add(ok ? 'ok' : 'ng'); speak(o.w);
        finish(ok, ok || !v ? '' : `<p class="muted center">내 답: ${esc(v)}</p>`);
      };
      host.querySelector('#chk').onclick = () => check(false);
      host.querySelector('#giveup').onclick = () => check(true);
      inp.onkeydown = e => { if (e.key === 'Enter') check(false); };
      return;
    }
    const showKo = mode === 'ko';
    const opts = choicesFor(o, showKo ? 'w' : 'm');
    const head = mode === 'listen'
      ? `<button class="bigsay" id="say">🔊</button><div class="q-pos">잘 듣고 뜻을 고르세요</div>`
      : showKo ? `<div class="q-word ko">${esc(o.m)}</div><div class="q-pos"></div>`
        : `<div class="q-word">${esc(o.w)}</div><div class="q-pos"><button class="toggle" id="say">🔊 듣기</button></div>`;
    host.innerHTML = `<span class="tag">${MODE_NAME[mode]}</span>${head}
      <div class="opts">${opts.map((x, n) => `<button class="opt" data-w="${esc(x.w)}"><span class="n">${n + 1}</span>${esc(showKo ? x.w : x.m)}</button>`).join('')}</div>
      <div class="after"></div>`;
    const say = host.querySelector('#say'); if (say) say.onclick = () => speak(o.w);
    if (mode !== 'ko') speak(o.w);
    host.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = b.dataset.w === o.w;
      host.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.dataset.w === o.w) x.classList.add('correct'); });
      if (!ok) b.classList.add('wrong');
      if (showKo) speak(o.w);
      finish(ok);
    });
  }


  // ── 출석 정원
  const gardenCard = (small) => {
    const n = new Set(S.days).size, page = Math.max(0, Math.floor((n - 1) / (window.GARDEN_PER || 32)));
    return `<section class="card garden"><div class="row between"><b>🌷 출석 정원</b><span class="muted">${n}일째 · 🔥 ${streak()}일 연속</span></div>
      <div class="gwrap"><canvas class="gcv" aria-label="출석 정원"></canvas></div>
      ${friendsRow()}
      <p class="muted" style="margin:8px 0 0;font-size:13px">${n ? `공부한 날마다 꽃이 하나씩 피어나요. 7번째마다 나무가 자라요!${page ? ` (정원 ${page + 1}번째)` : ''}` : '오늘 공부하면 첫 새싹이 심어져요 🌱'} 가끔 동물 친구가 놀러 와요. 보이면 눌러 봐요!</p></section>`;
  };
  const friendsRow = () => {
    const A = window.GARDEN_ANIMALS || {}, f = S.friends || {};
    const got = Object.keys(A).filter(k => f[k]).length;
    return `<div class="friends"><span class="muted">만난 친구 ${got}/${Object.keys(A).length}</span>${Object.entries(A).map(([k, a]) => `<span class="fr ${f[k] ? 'on' : ''}" title="${f[k] ? a.name : '???'}">${f[k] ? a.emoji : '❔'}</span>`).join('')}</div>`;
  };
  function meetFriend(kind, an) {
    S.friends = S.friends || {};
    const first = !S.friends[kind];
    S.friends[kind] = (S.friends[kind] || 0) + 1; save(); fx('pair');
    if (first) { addXP(10); celebrate(`새 친구 발견! ${an.emoji}`, `${an.name}(이)가 정원에 놀러 왔어요!<br>도감에 등록했어요. ⭐+10`, an.emoji); }
    else toast(`${an.emoji} ${an.name}: 안녕! (${S.friends[kind]}번째 만남)`);
    app.querySelectorAll('.friends').forEach(el => { el.outerHTML = friendsRow(); });
  }
  const mountGarden = () => app.querySelectorAll('.gcv').forEach(c => window.drawGarden && window.drawGarden(c, S.days, TODAY(), { onTap: meetFriend }));

  // ── 오늘: 게임처럼 따라가는 학습 길
  const LESSON = 10, PER_UNIT = 4;
  const UNIT_NAMES = ['첫 만남', '쑥쑥 새싹', '반짝반짝', '두근두근', '차곡차곡', '씩씩하게', '반딧불 밤', '무지개 다리', '별빛 산책', '숲속 탐험', '바다 건너', '구름 위로', '용감한 모험', '보물 찾기', '햇살 가득', '꽃길 따라'];
  const UNIT_COLORS = [['#8f7cff', '#6f5fe0'], ['#ffad3b', '#e08a14'], ['#3ec486', '#25a06a'], ['#ff7aa2', '#e0517f'], ['#4aa8ff', '#2c86d8'], ['#ff8a5b', '#e0663a']];
  const LESSON_ICONS = ['⭐', '🎧', '🔤', '✍️'];
  const FLAME = (size = 120, face = true) => `<svg class="flame" viewBox="0 0 100 120" width="${size}" height="${size * 1.2}" aria-hidden="true">
      <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd25e"/><stop offset=".55" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff5a6e"/></linearGradient></defs>
      <path d="M50 4 C58 22 80 34 84 62 C88 92 70 114 50 114 C30 114 12 98 14 70 C15 52 26 44 30 30 C36 42 40 46 44 46 C42 30 44 16 50 4 Z" fill="url(#fg)" stroke="#ff6b4a" stroke-width="3"/>
      <path d="M50 52 C56 62 66 70 64 86 C63 98 56 104 50 104 C42 104 36 97 37 86 C38 74 46 68 50 52 Z" fill="#fff3c4" opacity=".9"/>
      ${face ? `<circle cx="42" cy="84" r="3.6" fill="#3b3456"/><circle cx="58" cy="84" r="3.6" fill="#3b3456"/><circle cx="43.2" cy="82.8" r="1.2" fill="#fff"/><circle cx="59.2" cy="82.8" r="1.2" fill="#fff"/><path d="M45 91 Q50 96 55 91" stroke="#3b3456" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="36" cy="90" r="3" fill="#ff8fa3" opacity=".7"/><circle cx="64" cy="90" r="3" fill="#ff8fa3" opacity=".7"/>` : ''}
    </svg>`;

  function Today() {
    setTitle(`${me().emoji} ${me().name}의 영단어`);
    const due = dueList().length, nl = Math.min(newLeft(), unseen().length);
    if (S.sess && S.sess.d !== TODAY()) { delete S.sess; save(); }
    const resumable = !!(S.sess && S.sess.q && S.sess.q.length);
    const doneToday = !resumable && due === 0 && nl === 0;
    const lr = learned().length, totalLessons = Math.ceil(ordered.length / LESSON);
    const curL = Math.min(Math.floor(lr / LESSON), totalLessons - 1), curProg = (lr % LESSON) / LESSON;
    const curU = Math.floor(curL / PER_UNIT);
    const st = streak(), studiedToday = S.days.includes(TODAY());
    S.chests = S.chests || {};
    const bubble = resumable ? '이어하기!' : doneToday ? '+10개 더?' : '시작!';
    let html = `<div class="topstats">
        <button class="ts" id="tsStreak">${FLAME(22, false)}<b class="${studiedToday ? 'hot' : 'cold'}">${st}</b></button>
        <button class="ts" id="tsXp">⭐<b>${S.xp || 0}</b></button>
        <button class="ts" id="tsLv"><span class="lvpill">Lv.${levelOf(S.xp || 0)}</span></button>
        <button class="ts" id="tsSt">🎀<b>${Object.keys(S.badges || {}).length}</b></button>
      </div>`;
    html += `<div class="mission-tip">${doneToday ? `🎉 오늘 미션 완료! 내일 다시 볼 단어가 보키한테 맡겨져 있어요.` : resumable ? `⏸️ 하던 미션이 있어요 (${S.sess.doneN}/${S.sess.total}) — 반짝이는 버튼을 눌러 이어서!` : `오늘의 미션 · 🔁 다시 보기 <b>${due}</b> · ✨ 새 단어 <b>${nl}</b>`}</div>`;
    html += `<div class="path">`;
    const fromU = Math.max(0, curU - 1), toU = Math.min(Math.ceil(totalLessons / PER_UNIT) - 1, curU + 2);
    for (let u = fromU; u <= toU; u++) {
      const [c1, c2] = UNIT_COLORS[u % UNIT_COLORS.length];
      const firstW = ordered.slice(u * PER_UNIT * LESSON, u * PER_UNIT * LESSON + 3).map(o => o.w).join(' · ');
      html += `<div class="unit" style="--c1:${c1};--c2:${c2}"><div class="ubanner ${u > curU ? 'locked' : ''}"><div><small>유닛 ${u + 1}</small><b>${UNIT_NAMES[u % UNIT_NAMES.length]}</b><span>${esc(firstW)} …</span></div><button class="ubook" data-set="${Math.floor(u * PER_UNIT * LESSON / SET_SIZE)}" aria-label="단어 보기">📒</button></div>`;
      for (let k = 0; k <= PER_UNIT; k++) {
        const isChest = k === PER_UNIT, L = u * PER_UNIT + k;
        const n = u * (PER_UNIT + 1) + k;               // 지그재그 위치
        const off = Math.round(Math.sin(n * 0.95) * 72);
        let cls, icon, extra = '';
        if (isChest) {
          const ready = curL >= (u + 1) * PER_UNIT, opened = S.chests[u];
          cls = opened ? 'done chest' : ready ? 'cur chest' : 'lock chest'; icon = opened ? '📭' : '🎁';
          html += `<div class="nwrap" style="--off:${off}px"><button class="node ${cls}" data-chest="${u}" ${!ready || opened ? 'data-dis="1"' : ''}><span>${icon}</span></button>${ready && !opened ? '<div class="nbub">열어 봐!</div>' : ''}</div>`;
          continue;
        }
        if (L >= totalLessons) break;
        if (L < curL) { cls = 'done'; icon = LESSON_ICONS[L % 4]; }
        else if (L === curL) { cls = 'cur'; icon = LESSON_ICONS[L % 4]; extra = `<div class="nbub">${bubble}</div>`; }
        else { cls = 'lock'; icon = '🔒'; }
        const ring = L === curL ? `<i class="ring" style="--p:${Math.round(curProg * 100)}"></i>` : '';
        const side = Math.sin(n * 0.95) > 0 ? -1 : 1;
        const mascot = L === curL ? `<div class="mascot" style="--side:${side}">${BOKI}</div>` : '';
        html += `<div class="nwrap" style="--off:${off}px">${extra}${ring}<button class="node ${cls}" data-l="${L}"><span>${icon}</span>${cls === 'done' ? '<em>✓</em>' : ''}</button>${mascot}</div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
    if (!S.alarm) html += `<button class="alarm-tip" id="atip">⏰ 매일 밤 11시에 보키가 알려 줄까요? <b>알림 켜기 ›</b></button>`;
    app.innerHTML = html;

    // 동작
    const startMission = () => resumable ? go(Session, false, true) : doneToday ? go(Session, true) : go(Session, false);
    app.querySelectorAll('.node[data-l]').forEach(b => b.onclick = () => {
      const L = +b.dataset.l;
      if (L === curL) return startMission();
      if (L < curL) { const ws = ordered.slice(L * LESSON, L * LESSON + LESSON); return go(PracticeSource, pick(['en', 'ko', 'listen', 'match']), ws, `레슨 ${L + 1} 복습`); }
      fx('ng'); toast('🔒 앞 레슨을 끝내면 열려요!');
    });
    app.querySelectorAll('.node[data-chest]').forEach(b => b.onclick = () => {
      if (b.dataset.dis) { fx('ng'); return toast(S.chests[b.dataset.chest] ? '이미 연 상자예요' : '🎁 이 유닛 레슨을 다 끝내면 열 수 있어요!'); }
      const u = +b.dataset.chest, prize = 20 + Math.floor(Math.random() * 4) * 10;
      S.chests[u] = TODAY(); addXP(prize); save();
      celebrate(`보물 상자! 🎁`, `유닛 ${u + 1} 완주 선물로<br>⭐ ${prize}개를 받았어요!`, '🎁', 'complete');
      Today();
    });
    app.querySelectorAll('.ubook').forEach(b => b.onclick = () => go(SetView, +b.dataset.set));
    $('#tsStreak').onclick = () => go(StreakView, false);
    $('#tsXp').onclick = $('#tsLv').onclick = () => toast(`Lv.${levelOf(S.xp || 0)} ${titleOf(levelOf(S.xp || 0))} · 다음 레벨까지 ⭐ ${xpFor(levelOf(S.xp || 0) + 1) - (S.xp || 0)}`);
    $('#tsSt').onclick = () => root(Stats);
    const at = $('#atip'); if (at) at.onclick = () => root(Stats);
    // 현재 레슨이 화면 가운데 오도록
    const cur = app.querySelector('.node.cur[data-l]') || app.querySelector('.node.cur');
    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' }), 30);

    if (!S.alarm && !S.alarmAsked) {
      S.alarmAsked = true; save();
      setTimeout(() => {
        const el = document.createElement('div'); el.className = 'pop';
        el.innerHTML = `<div class="pop-card"><div class="pop-icon">⏰</div><b>매일 밤 알려 줄까?</b><p>밤 11시, 11시 30분에<br>보키가 휴대폰으로 알려 줄게!</p><button class="btn accent" id="ayes">좋아! 알림 켜기</button><button class="btn light" id="ano" style="margin-top:10px">나중에</button></div>`;
        document.body.appendChild(el);
        el.querySelector('#ayes').onclick = () => { el.remove(); addAlarm(); Today(); };
        el.querySelector('#ano').onclick = () => el.remove();
      }, 600);
    }
  }
  Today.tab = 'today';

  // ── 연속 학습 축하 화면 (미션 끝나면 마지막에)
  function StreakView(afterMission) {
    setTitle('연속 학습');
    $('#backBtn').hidden = !!afterMission;
    const st = streak(), T = TODAY();
    const now = new Date(); const dow = (now.getDay() + 6) % 7;   // 월=0
    const weekStart = T - dow, names = ['월', '화', '수', '목', '금', '토', '일'];
    const done = names.map((_, k) => S.days.includes(weekStart + k));
    const weekCnt = done.filter(Boolean).length;
    // 이어진 칸끼리 캡슐로 묶기
    let cells = '', k = 0;
    while (k < 7) {
      if (done[k] && weekStart + k <= T) { let j = k; while (j + 1 < 7 && done[j + 1] && weekStart + j + 1 <= T) j++; cells += `<div class="cap" style="grid-column:${k + 1}/${j + 2}">${'<i>✓</i>'.repeat(j - k + 1)}</div>`; k = j + 1; }
      else { cells += k === 6 ? `<div class="dayc gift ${weekCnt === 7 ? 'on' : ''}" style="grid-column:7">🎁</div>` : `<div class="dayc ${weekStart + k === T ? 'today' : ''}" style="grid-column:${k + 1}"></div>`; k++; }
    }
    const msgs = st >= 2
      ? [`${st}일 연속! 내일도 오면 <b>${st + 1}일</b>이 돼요 🔥`, `이번 주 <b>${weekCnt}/7일</b> 출석! ${7 - weekCnt > 0 ? `${7 - weekCnt}일만 더 하면 주간 선물 🎁` : '이번 주 완벽 출석! 🎁'}`]
      : [`첫 불꽃이 켜졌어요! 내일도 오면 <b>2일 연속</b>이 돼요 🔥`, '매일 조금씩이 제일 강해요. 정원에 꽃도 하나씩 피어요 🌷'];
    if (afterMission && weekCnt === 7 && !(S.weekGift && S.weekGift === weekStart)) { S.weekGift = weekStart; addXP(50); save(); setTimeout(() => celebrate('일주일 완벽 출석! 🎁', '주간 선물로 ⭐ 50개!', '🎁', 'complete'), 1600); }
    app.innerHTML = `<div class="streak-screen">
        <div class="sflame">${FLAME(150)}</div>
        <div class="snum" id="snum">${afterMission ? Math.max(0, st - 1) : st}</div>
        <div class="slabel">일 연속 학습!</div>
        <div class="week">${names.map((n, i) => `<span class="${weekStart + i === T ? 'on' : ''}">${n}</span>`).join('')}</div>
        <div class="weekrow">${cells}</div>
        <p class="smsg">${msgs[0]}</p>
        <p class="smsg small">${msgs[1]}</p>
        ${boki(pick([`${esc(me().name)}, 오늘도 해냈다! 내일 밤에 또 만나 🦉`, '불꽃 꺼지지 않게 내일도 딱 5분만!', '매일 오는 게 진짜 실력이야. 최고!']), true)}
        <button class="btn sbtn" id="sgo">${afterMission ? `좋아, 내일 또 올게!` : '확인'}</button>
      </div>`;
    if (afterMission) {
      setTimeout(() => { const el = $('#snum'); if (!el) return; el.textContent = st; el.classList.add('bump'); fx('combo'); confetti(); }, 900);
    }
    $('#sgo').onclick = () => root(Today);
  }

  // ── 오늘의 학습 세션
  function reviewMode(o) {
    const b = card(o.w).b;
    if (b <= 1) return pick(['en', 'en', 'listen']);
    if (b === 2) return pick(['en', 'ko', 'listen']);
    if (b === 3) return pick(['ko', 'listen', 'spell']);
    return pick(['spell', 'ko', 'listen']);
  }
  function Session(extra, resume) {
    setTitle('오늘의 미션');
    const R = resume && S.sess && S.sess.d === TODAY() ? S.sess : null;
    const due = R ? [] : dueList().slice(0, 150);
    const nCount = extra ? 10 : Math.min(newLeft(), 60);
    const news = R ? [] : unseen().slice(0, nCount);
    // 큐: {o, mode, kind: 'review'|'intro'|'check'|'retry'}
    let q = due.map(o => ({ o, mode: reviewMode(o), kind: 'review' }));
    // 새 단어는 소개 → 몇 문제 뒤 확인 문제
    const merged = []; let ri = 0;
    news.forEach((o, k) => {
      for (let t = 0; t < 2 && ri < q.length; t++) merged.push(q[ri++]);
      merged.push({ o, mode: 'intro', kind: 'intro' });
    });
    while (ri < q.length) merged.push(q[ri++]);
    q = merged;
    // 짝 맞추기 라운드: 중간에 한 번, 마지막에 한 번 (그때까지 나온 단어로)
    let seen = [];
    if (q.length >= 8) q.splice(Math.floor(q.length / 2), 0, { kind: 'match' });
    if (q.length >= 4) q.push({ kind: 'match' });
    let total = q.length + news.length;
    const matchWords = () => shuffle([...new Map(seen.map(o => [o.w, o])).values()].slice(-12)).slice(0, 6);
    let doneN = 0, okN = 0, ngN = 0; let wrongs = new Set(); combo = 0; let finished = false;
    if (R) {
      q = R.q.map(x => ({ o: x.w ? byWord[x.w] : undefined, mode: x.mode, kind: x.kind })).filter(x => x.kind === 'match' || x.o);
      total = R.total; doneN = R.doneN; okN = R.okN; ngN = R.ngN; wrongs = new Set(R.wrongs); seen = R.seen.map(w => byWord[w]).filter(Boolean);
    }
    // 매 문제마다 자동 저장 → 나갔다 와도 그 자리부터 이어서
    const persist = () => {
      S.sess = { d: TODAY(), q: q.map(x => ({ w: x.o && x.o.w, mode: x.mode, kind: x.kind })), total, doneN, okN, ngN, wrongs: [...wrongs], seen: seen.slice(-12).map(o => o.w) };
      save();
    };
    if (!q.length) { app.innerHTML = `<div class="empty"><div style="font-size:44px">🎉</div><p>지금은 할 학습이 없어요.</p></div>`; return; }

    const next = () => {
      checkBadges();
      if (!q.length) return summary();
      persist();
      const it = q.shift();
      if (it.kind === 'match') {
        const ws = matchWords();
        if (ws.length < 4) { doneN++; return next(); }
        return matchRound(ws, `<div class="progress-top"><span>${doneN} / ${total}</span><span>🧩 보너스 게임</span></div><div class="bar"><i style="width:${doneN / total * 100}%"></i></div>`, () => { doneN++; next(); });
      }
      if (it.o) seen.push(it.o);
      app.innerHTML = `<div class="progress-top"><span>${doneN} / ${total}</span><span><button class="toggle" id="quit">쉬었다 하기</button></span></div>
        <div class="bar"><i style="width:${doneN / total * 100}%"></i></div><div id="qhost" style="margin-top:12px"></div>`;
      $('#quit').onclick = summary;
      ask($('#qhost'), it.o, it.mode, ok => {
        if (it.kind === 'intro') {
          q.splice(Math.min(3, q.length), 0, { o: it.o, mode: 'en', kind: 'check' });
          doneN++; return next();
        }
        if (it.kind === 'check') {
          if (ok) { learnNew(it.o.w); doneN++; okN++; }
          else { ngN++; wrongs.add(it.o.w); q.splice(Math.min(4, q.length), 0, { o: it.o, mode: 'intro', kind: 'intro' }); doneN--; }
          return next();
        }
        if (it.kind === 'review') {
          gradeReview(it.o.w, ok); doneN++;
          if (ok) okN++; else { ngN++; wrongs.add(it.o.w); q.splice(Math.min(5, q.length), 0, { o: it.o, mode: 'en', kind: 'retry' }); }
          return next();
        }
        // retry: 틀린 단어 다시 한 번 (일정에는 영향 없음)
        if (!ok) q.push({ o: it.o, mode: 'en', kind: 'retry' });
        next();
      });
    };
    const summary = () => {
      const list = [...wrongs].map(w => byWord[w]);
      if (!q.length) { delete S.sess; save(); }
      if (!q.length && !finished) { finished = true; fx('complete'); S.st.sessions++; addXP(30); if (ngN === 0 && okN >= 10) S.st.perfect++; save(); confetti(); checkBadges(); }
      app.innerHTML = `${boki(q.length ? '자동으로 저장했어! 다음에 이 자리부터 이어서 하자 😊' : okN >= ngN * 3 ? '오늘 완전 잘했어! 내일 또 만나 🦉' : '수고했어! 틀린 단어는 내일 내가 다시 물어볼게')}<section class="card center">
        <p class="muted">${q.length ? '여기까지 저장했어요' : '오늘 미션 완료! 🎉'}</p>
        <div class="score">${okN}<span style="font-size:22px;color:var(--sub)"> 정답</span></div>
        <p class="muted">틀린 문제 ${ngN}개 · 틀린 단어는 내일 보키가 다시 물어봐요</p>${!q.length ? `<p class="bonus">🎁 완료 보너스 ⭐+30</p>` : ''}
        <button class="btn" id="home">${q.length ? '처음으로' : '계속 ›'}</button></section>
        ${list.length ? `<section class="card"><b>헷갈린 단어</b><ul class="wlist">${list.map(o => `<li><button class="say" data-w="${esc(o.w)}">🔊</button><span class="w">${esc(o.w)}</span><span class="m">${esc(o.m)}</span></li>`).join('')}</ul></section>` : ''}`;
      $('#home').onclick = () => q.length ? root(Today) : (stack.length = 0, go(StreakView, true));
      app.querySelectorAll('.say').forEach(b => b.onclick = () => speak(b.dataset.w));
    };
    next();
  }


  // 오늘의 미션 속 짝 맞추기 한 판
  function matchRound(ws, head, done) {
    const L = shuffle(ws), R = shuffle(ws); let sel = null, left = ws.length, miss = 0; const t0 = Date.now();
    app.innerHTML = `${head}${boki('보너스 게임! 영어랑 뜻을 짝지어 줘 🧩', true)}
      <div class="match"><div>${L.map(o => `<button class="tile en" data-w="${esc(o.w)}">${esc(o.w)}</button>`).join('')}</div>
      <div>${R.map(o => `<button class="tile ko" data-w="${esc(o.w)}">${esc(o.m)}</button>`).join('')}</div></div>`;
    app.querySelectorAll('.tile').forEach(t => t.onclick = () => {
      if (t.classList.contains('gone')) return;
      if (t.classList.contains('en')) speak(t.dataset.w);
      if (!sel || sel.classList.contains(t.classList.contains('en') ? 'en' : 'ko')) { if (sel) sel.classList.remove('sel'); sel = t; t.classList.add('sel'); return; }
      if (sel.dataset.w === t.dataset.w) {
        [sel, t].forEach(x => { x.classList.remove('sel'); x.classList.add('gone'); }); sel = null; left--; fx('pair');
        if (!left) {
          const sec = Math.round((Date.now() - t0) / 1000), bonus = miss ? 5 : 10;
          addXP(bonus); save();
          app.insertAdjacentHTML('beforeend', `<div class="card center" style="margin-top:14px"><p class="cheer">${miss ? '다 맞췄다! 👏' : '실수 없이 완벽! 🌟'} ${sec}초 · ⭐+${bonus}</p><button class="btn" id="mdone" style="margin-top:12px">계속하기 ›</button></div>`);
          $('#mdone').onclick = done;
        }
      } else {
        miss++; fx('ng'); const a = sel; sel = null;
        [a, t].forEach(x => { x.classList.remove('sel'); x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 400); });
      }
    });
  }

  // ── 자유 연습
  const PRACTICE_MODES = [
    { id: 'card', icon: '🃏', name: '카드 넘기기' },
    { id: 'en', icon: '🔤', name: '뜻 고르기' },
    { id: 'ko', icon: '🇰🇷', name: '영어 고르기' },
    { id: 'listen', icon: '🎧', name: '듣고 고르기' },
    { id: 'spell', icon: '✍️', name: '철자 쓰기' },
    { id: 'match', icon: '🧩', name: '짝 맞추기' },
  ];
  function sources() {
    const L = learned();
    return [
      { id: 'weak', name: '😵 자주 틀린 단어', list: L.filter(o => (card(o.w).l || 0) > 0).sort((a, b) => card(b.w).l - card(a.w).l).slice(0, 40) },
      { id: 'learning', name: '🌱 새싹 단어', list: L.filter(o => stage(o.w) === 1) },
      { id: 'recent', name: '🆕 최근 배운 단어', list: L.slice(-40) },
      { id: 'all', name: '📦 지금까지 배운 단어 전부', list: L },
    ];
  }
  function PracticeSource(mode, presetList, presetName) {
    if (presetList) { stack.pop(); return go(Practice, mode, presetList, presetName); }
    const m = PRACTICE_MODES.find(x => x.id === mode);
    setTitle(m.name);
    const srcs = sources();
    app.innerHTML = `<section class="card"><p style="margin-top:0"><b>어떤 단어로 연습할까요?</b></p>
      ${srcs.map((s, i) => `<button class="src" data-i="${i}" ${s.list.length < 4 ? 'disabled' : ''}><span>${s.name}</span><b>${s.list.length}개</b></button>`).join('')}
      <p class="muted" style="margin-bottom:0">단어장 탭에서 세트를 골라 연습할 수도 있어요.</p></section>
      ${learned().length < 4 ? `<p class="muted center">먼저 '오늘의 미션'에서 새 단어를 배워 보세요.</p>` : ''}`;
    app.querySelectorAll('.src').forEach(b => b.onclick = () => { const s = srcs[+b.dataset.i]; stack.pop(); go(Practice, mode, s.list, s.name); });
  }
  function Practice(mode, list, name) {
    const m = PRACTICE_MODES.find(x => x.id === mode);
    setTitle(`${m.name} · ${name}`);
    const deck = shuffle(list).slice(0, mode === 'match' ? 30 : 20);
    if (mode === 'card') return CardDeck(deck);
    if (mode === 'match') return Match(deck);
    let i = 0, ok = 0; const miss = [];
    const next = () => {
      if (i >= deck.length) {
        S.st.practice++; addXP(10); save(); checkBadges();
        app.innerHTML = `<section class="card center"><p class="muted">연습 끝! ⭐+10</p>
          <div class="score">${Math.round(ok / deck.length * 100)}점</div><p class="muted">${deck.length}문제 중 ${ok}개 정답</p>
          ${miss.length ? `<button class="btn" id="re" style="margin-bottom:10px">틀린 ${miss.length}개 다시</button>` : ''}
          <button class="btn light" id="dn">끝내기</button></section>`;
        if (miss.length) $('#re').onclick = () => { stack.pop(); go(Practice, mode, miss.slice(), '틀린 단어'); };
        $('#dn').onclick = back; return;
      }
      app.innerHTML = `<div class="progress-top"><span>${i + 1} / ${deck.length}</span><span>정답 ${ok}</span></div>
        <div class="bar"><i style="width:${i / deck.length * 100}%"></i></div><div id="qhost" style="margin-top:12px"></div>`;
      ask($('#qhost'), deck[i], mode, r => { practiceResult(deck[i].w, r); if (r) ok++; else miss.push(deck[i]); i++; next(); });
    };
    next();
  }
  function CardDeck(deck) {
    let i = 0, ok = 0; const miss = [];
    const draw = () => {
      if (i >= deck.length) {
        app.innerHTML = `<section class="card center"><p class="muted">카드 한 바퀴 끝!</p>
          <div class="score">${ok}<span style="font-size:22px;color:var(--sub)"> / ${deck.length}</span></div>
          ${miss.length ? `<button class="btn" id="re" style="margin-bottom:10px">모르는 ${miss.length}개만 다시</button>` : ''}
          <button class="btn light" id="dn">끝내기</button></section>`;
        if (miss.length) $('#re').onclick = () => { deck = shuffle(miss.splice(0)); i = 0; ok = 0; draw(); };
        $('#dn').onclick = back; return;
      }
      const o = deck[i];
      app.innerHTML = `<div class="progress-top"><span>${i + 1} / ${deck.length}</span><span>알아요 ${ok}</span></div>
        <div class="bar" style="margin-bottom:12px"><i style="width:${i / deck.length * 100}%"></i></div>
        <div class="flash" id="card"><div class="inner">
          <div class="face"><button class="say" id="say">🔊</button><div class="word">${esc(o.w)}</div><div class="hint">탭해서 뜻 보기</div></div>
          <div class="face back"><div class="word sm">${esc(o.w)}</div><div class="mean">${esc(o.m)}</div></div>
        </div></div>
        <div class="judge"><button class="no" id="no">모르겠어요</button><button class="yes" id="yes">알아요</button></div>`;
      const c = $('#card');
      c.onclick = e => { if (e.target.id !== 'say') { c.classList.toggle('flip'); fx('flip'); } };
      $('#say').onclick = () => speak(o.w);
      $('#yes').onclick = () => { ok++; i++; touch(); save(); draw(); };
      $('#no').onclick = () => { if (!c.classList.contains('flip')) { c.classList.add('flip'); return; } practiceResult(o.w, false); miss.push(o); i++; draw(); };
      speak(o.w);
    };
    draw();
  }
  function Match(deck) {
    let round = 0, mistakes = 0; const t0 = Date.now();
    const rounds = []; for (let k = 0; k < deck.length; k += 6) rounds.push(deck.slice(k, k + 6));
    if (rounds.length > 1 && rounds[rounds.length - 1].length < 3) rounds[rounds.length - 2].push(...rounds.pop());
    const draw = () => {
      if (round >= rounds.length) {
        const sec = Math.round((Date.now() - t0) / 1000);
        if (deck.length >= 12 && sec <= 60) S.st.match60++; S.st.practice++; addXP(10 + Math.max(0, 60 - sec) / 2 | 0); save(); checkBadges();
        app.innerHTML = `<section class="card center"><p class="muted">짝 맞추기 끝!</p><div class="score">${sec}초</div>
          <p class="muted">${deck.length}쌍 · 실수 ${mistakes}번</p><button class="btn" id="re" style="margin-bottom:10px">한 번 더</button><button class="btn light" id="dn">끝내기</button></section>`;
        $('#re').onclick = () => { stack.pop(); go(Practice, 'match', deck, '한 번 더'); };
        $('#dn').onclick = back; return;
      }
      const r = rounds[round];
      const L = shuffle(r), R = shuffle(r);
      app.innerHTML = `<div class="progress-top"><span>${round + 1} / ${rounds.length} 라운드</span><span>실수 ${mistakes}</span></div>
        <div class="match"><div>${L.map(o => `<button class="tile en" data-w="${esc(o.w)}">${esc(o.w)}</button>`).join('')}</div>
        <div>${R.map(o => `<button class="tile ko" data-w="${esc(o.w)}">${esc(o.m)}</button>`).join('')}</div></div>`;
      let sel = null, left = r.length;
      app.querySelectorAll('.tile').forEach(t => t.onclick = () => {
        if (t.classList.contains('gone')) return;
        if (t.classList.contains('en')) speak(t.dataset.w);
        if (!sel || sel.classList.contains(t.classList.contains('en') ? 'en' : 'ko')) { if (sel) sel.classList.remove('sel'); sel = t; t.classList.add('sel'); return; }
        if (sel.dataset.w === t.dataset.w) {
          [sel, t].forEach(x => { x.classList.remove('sel'); x.classList.add('gone'); }); sel = null; left--; fx('pair');
          if (!left) { round++; setTimeout(draw, 350); }
        } else {
          mistakes++; fx('ng'); practiceResult(sel.dataset.w, false); const a = sel; sel = null;
          [a, t].forEach(x => { x.classList.remove('sel'); x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 400); });
          app.querySelector('.progress-top span:last-child').textContent = `실수 ${mistakes}`;
        }
      });
    };
    draw();
  }

  // ── 단어장
  function Book() {
    setTitle('단어장');
    app.innerHTML = `<p class="muted" style="margin:0 2px 12px">${ordered.length}개 단어 · 세트 순서대로 '오늘의 미션'에 새 단어로 나와요. 미리 구경하거나 따로 연습해도 좋아요!</p>
      <div class="days">${sets.map((s, k) => {
        const c = [0, 1, 2, 3].map(st => s.filter(o => stage(o.w) === st).length);
        return `<button class="day" data-k="${k}"><b>세트 ${k + 1}</b><small>${s.length}개 · ${setLevel(k)}</small>
          <div class="stack-bar thin">${[3, 2, 1].map(st => c[st] ? `<i style="width:${c[st] / s.length * 100}%;background:${STAGE_C[st]}"></i>` : '').join('')}</div></button>`;
      }).join('')}</div>`;
    app.querySelectorAll('.day').forEach(b => b.onclick = () => go(SetView, +b.dataset.k));
  }
  Book.tab = 'book';
  let hideMean = false;
  function SetView(k) {
    setTitle(`세트 ${k + 1}`);
    const list = sets[k];
    const draw = () => {
      app.innerHTML = `<section class="card"><div class="row between"><span class="lvl">${setLevel(k)}</span><span class="muted">${list.filter(o => card(o.w)).length} / ${list.length}개 심음</span></div>
        <div class="modes" style="margin-top:12px">${PRACTICE_MODES.map(m => `<button class="mode" data-m="${m.id}"><span>${m.icon}</span>${m.name}</button>`).join('')}</div></section>
        <section class="card"><div class="row between" style="margin-bottom:4px"><b>단어 목록</b><button class="toggle" id="hide">${hideMean ? '뜻 보이기' : '뜻 가리기'}</button></div>
        <ul class="wlist">${list.map(o => `<li><button class="say" data-w="${esc(o.w)}">🔊</button>${dot(o.w)}
          <span class="w">${esc(o.w)}</span><span class="m ${hideMean ? 'hide' : ''}">${esc(o.m)}</span></li>`).join('')}</ul></section>`;
      app.querySelectorAll('.mode').forEach(b => b.onclick = () => go(PracticeSource, b.dataset.m, list, `세트 ${k + 1}`));
      $('#hide').onclick = () => { hideMean = !hideMean; draw(); };
      app.querySelectorAll('.say').forEach(b => b.onclick = () => speak(b.dataset.w));
      app.querySelectorAll('.m.hide').forEach(m => m.onclick = () => m.classList.remove('hide'));
    };
    draw();
  }

  // ── 기록
  function Stats() {
    setTitle('내 정원'); checkBadges();
    const cnt = [0, 1, 2, 3].map(s => ordered.filter(o => stage(o.w) === s).length);
    const T = TODAY();
    const fc = [1, 2, 3, 4, 5, 6, 7].map(k => learned().filter(o => card(o.w).d === T + k).length);
    const maxF = Math.max(1, ...fc);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const cells = []; for (let k = 27; k >= 0; k--) { const d = T - k, lg = S.log[d]; const n = lg ? lg.n + lg.ok + lg.ng : 0;
      cells.push(`<i class="${n ? (n >= 40 ? 'on3' : n >= 15 ? 'on2' : 'on') : ''}" title="${n}문제"></i>`); }
    const tl = S.log[T] || { n: 0, ok: 0, ng: 0 };
    const total = ordered.length;
    app.innerHTML = `${gardenCard()}
      <section class="card">
        <div class="row between"><b>🌼 내 단어 정원</b><span class="muted">${learned().length} / ${total}개 심음</span></div>
        <div class="stack-bar">${[3, 2, 1, 0].map(s => { const n = ordered.filter(o => stage(o.w) === s).length; return n ? `<i style="width:${n / total * 100}%;background:${STAGE_C[s]}"></i>` : ''; }).join('')}</div>
        <div class="legend">${[0, 1, 2, 3].map(s => `<span><i class="dot" style="background:${STAGE_C[s]}"></i>${STAGE[s]} ${ordered.filter(o => stage(o.w) === s).length}</span>`).join('')}</div>
      </section>
      <div class="stat-grid">
        <div class="stat"><b>Lv.${levelOf(S.xp || 0)}</b><span>${titleOf(levelOf(S.xp || 0))} · ⭐ ${S.xp || 0}</span></div>
        <div class="stat"><b>${streak()}일</b><span>🔥 연속 출석</span></div>
        <div class="stat"><b>${learned().length}</b><span>🌱 심은 단어</span></div>
        <div class="stat"><b>${cnt[3]}</b><span>🌳 내 거 된 단어</span></div>
        <div class="stat"><b>${tl.ok + tl.ng ? Math.round(tl.ok / (tl.ok + tl.ng) * 100) + '%' : '-'}</b><span>🎯 오늘 맞힌 비율</span></div>
        <div class="stat"><b>${S.st.combo || 0}</b><span>⚡ 최고 연속 정답</span></div>
      </div>
      <section class="card" style="margin-top:14px"><div class="row between"><b>🎀 스티커 모음</b><span class="muted">${Object.keys(S.badges).length} / ${BADGES.length}</span></div>
        <div class="badges">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? 'got' : ''}" title="${esc(b.desc)}"><span>${S.badges[b.id] ? b.icon : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div></section>
      <section class="card"><b>🌼 단어 정원</b>
        ${[3, 2, 1, 0].map(s => `<div class="lvrow"><span><i class="dot" style="background:${STAGE_C[s]}"></i>${STAGE[s]}</span><div class="bar"><i style="width:${cnt[s] / ordered.length * 100}%;background:${STAGE_C[s]}"></i></div><b>${cnt[s]}</b></div>`).join('')}
        <p class="muted" style="margin-bottom:0">🌱 새싹은 며칠 뒤, 🌿 무럭무럭은 1~2주 뒤, 🌳 내 거!는 한 달 뒤쯤 다시 물어봐요.</p></section>
      <section class="card"><b>📅 보키가 다시 물어볼 단어</b>
        <div class="fc">${fc.map((n, k) => { const d = new Date(); d.setDate(d.getDate() + k + 1); return `<div><i style="height:${n / maxF * 70 + 2}px"></i><b>${n}</b><span>${days[d.getDay()]}</span></div>`; }).join('')}</div></section>
      <section class="card"><div class="row between"><b>${esc(me().emoji)} ${esc(me().name)}</b><button class="toggle" id="who">사람 바꾸기</button></div>
</section>
      <section class="card"><b>✨ 하루에 배울 새 단어</b>
        <div class="chips" style="margin:10px 0 0">${[10, 15, 20, 30, 40].map(n => `<button class="chip ${S.daily === n ? 'on' : ''}" data-n="${n}">${n}개</button>`).join('')}</div>
        <p class="muted" style="margin-bottom:0">최소 10개씩! 다시 볼 단어도 같이 늘어나니까 처음엔 10개를 추천해요.</p></section>
      <section class="card"><b>🔔 소리와 진동</b>
        <p class="muted" style="margin:10px 0 6px">효과음 스타일 (누르면 미리 들어 볼 수 있어요)</p>
        <div class="chips" style="margin:0 0 10px">${PACKS.map(([k, n]) => `<button class="chip pk ${packOf() === k ? 'on' : ''}" data-p="${k}">${n}</button>`).join('')}</div>
        <div class="chips" style="margin:0"><button class="chip ${S.sfx !== false ? 'on' : ''}" id="tsfx">🎵 효과음 ${S.sfx !== false ? '켜짐' : '꺼짐'}</button><button class="chip ${S.hap !== false ? 'on' : ''}" id="thap">📳 진동 ${S.hap !== false ? '켜짐' : '꺼짐'}</button></div></section>
      ${alarmCard()}
      <section class="card"><b>📱 홈 화면에 추가하기</b>
        <p class="muted" style="margin-bottom:0">앱처럼 쓰려면 브라우저 메뉴에서 '홈 화면에 추가'를 누르세요. (아이폰: 사파리 공유 버튼 → 홈 화면에 추가) 기록은 이 휴대폰 브라우저에 저장돼요.</p></section>
      <p class="muted center" style="font-size:11.5px">발음 녹음: Wikimedia Commons (CC BY-SA) · 효과음: uisfx (CC0)</p>
      <button class="danger" id="reset">처음부터 다시 하기 (기록 지우기)</button>`;
    mountGarden();
    $('#who').onclick = () => root(Who);
    $('#alarm').onclick = addAlarm;
    app.querySelectorAll('.chip.pk').forEach(c => c.onclick = () => {
      S.pack = c.dataset.p; save(); loadSfx(S.pack);
      app.querySelectorAll('.chip.pk').forEach(x => x.classList.toggle('on', x === c));
      setTimeout(() => playSfx('ok', S.pack), 250); setTimeout(() => playSfx('pair', S.pack), 900);
    });
    $('#tsfx').onclick = () => { S.sfx = S.sfx === false; save(); Stats(); if (S.sfx) fx('ok'); };
    $('#thap').onclick = () => { S.hap = S.hap === false; save(); Stats(); if (S.hap) buzz('ok'); };
    app.querySelectorAll('.chip:not(.lv):not(.pk):not(#tsfx):not(#thap)').forEach(c => c.onclick = () => { S.daily = +c.dataset.n; save(); toast(`하루 새 단어 ${S.daily}개`); Stats(); });
    $('#reset').onclick = () => { if (confirm('모든 학습 기록을 지울까요? 되돌릴 수 없어요.')) { S = fresh(); save(); toast('초기화했어요'); Stats(); } };
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
      res.innerHTML = hits.length ? hits.map(o => `<li><button class="say" data-w="${esc(o.w)}">🔊</button>${dot(o.w)}<span class="w">${esc(o.w)}<span class="p">${STAGE[stage(o.w)]}</span></span><span class="m">${esc(o.m)}</span></li>`).join('') : '<li class="muted">검색 결과가 없어요</li>';
      res.querySelectorAll('.say').forEach(b => b.onclick = () => speak(b.dataset.w));
    };
    q.oninput = run; run(); setTimeout(() => q.focus(), 50);
  }


  // ── 누가 공부할까요?
  const lvOfProfile = id => { try { const d = JSON.parse(localStorage.getItem('voca-data-' + id) || 'null'); return d && d.xp ? ` · Lv.${levelOf(d.xp)}` : ''; } catch { return ''; } };
  const EMOJIS = ['🐣', '🐶', '🐱', '🐰', '🦊', '🐼', '🐯', '🐸'];
  function Who() {
    setTitle('누가 공부할까요?');
    $('#backBtn').hidden = true;
    app.innerHTML = `${boki('안녕! 나는 단어 친구 보키야 🦉<br>오늘은 누가 공부해? 이름을 눌러 줘!')}
      ${P.list.length ? `<div class="people">${P.list.map(p => `<button class="person" data-id="${p.id}"><span>${p.emoji}</span><b>${esc(p.name)}</b><small>${esc(p.course || '')}${lvOfProfile(p.id)}</small></button>`).join('')}</div>` : ''}
      <details class="card addp"><summary>+ 다른 사람 추가하기</summary>
        <input class="search" id="nm" maxlength="10" placeholder="이름 (예: 민준)" style="margin:12px 0">
        <div class="chips">${EMOJIS.map((e, k) => `<button class="chip em ${k === 0 ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}</div>

        <button class="btn accent" id="add">시작하기 ›</button></details>`;
    let emo = EMOJIS[0], st = 0;
    app.querySelectorAll('.chip.em').forEach(c => c.onclick = () => { app.querySelectorAll('.chip.em').forEach(x => x.classList.remove('on')); c.classList.add('on'); emo = c.dataset.e; });
    app.querySelectorAll('.person').forEach(b => b.onclick = () => { P.cur = b.dataset.id; saveP(); loadProfile(); root(Today); });
    $('#add').onclick = () => {
      const name = $('#nm').value.trim(); if (!name) { toast('이름을 써 주세요'); $('#nm').focus(); return; }
      const id = Date.now().toString(36);
      P.list.push({ id, name, emoji: emo, start: st, course: '' }); P.cur = id; saveP();
      S = fresh(); save(); root(Today);
    };
  }
  Who.tab = 'none';

  $('#backBtn').onclick = back;
  $('#searchBtn').onclick = () => P.cur && go(Search);
  document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => !P.cur ? null : root({ today: Today, book: Book, stats: Stats }[b.dataset.tab]));
  root(P.cur ? Today : Who);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
