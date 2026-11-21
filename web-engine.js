// Browser renderer for the ASCII wallpaper scenes from 0toshigami/claude-desktop-themes (MIT).
// Adapted from that project's extension/src/engine.js: same drawing rules, minus the Claude Desktop specifics
// (sidebar/composer measuring, theme.json polling). It runs after the scene kit and all scenes (see tools/build.mjs).
const THEME_LIST = [
  { id: 'honu-lagoon', name: 'Honu Lagoon', tagline: 'A sea turtle swimming across a lagoon, light rays and bubbles', bg: '#0f3a44', text: '#e3f6f2', accent: '#5fd0b8', sky: bands(.14, 'linear-gradient(#35a6f0, #1d7ad8 45%, #1650b2)'), greet: 'swim along, slow and steady' },
  { id: 'cloud-drift', name: 'Cloud Drift', tagline: 'White clouds over a bright sky, birds gliding by', bg: '#d8ecfa', text: '#1d3447', accent: '#2f78bd', sky: bands(.22, 'linear-gradient(#4fa3e8, #86c3f0 55%, #b6dbf6)'), greet: 'blue skies ahead' },
  { id: 'moonlit', name: 'Moonlit', tagline: 'A crescent moon, drifting clouds, twinkling stars', bg: '#0d1530', text: '#dbe2f5', accent: '#d9c98f', sky: 'radial-gradient(120% 90% at 75% 10%, #1a2a5e, #0d1530 60%, #090f24)', greet: 'a quiet night to build ☾' },
  { id: 'clawd', name: 'Clawd', tagline: 'A turning orange spark, drifting embers, Clawd on patrol', bg: '#1f1714', text: '#f2e6df', accent: '#d97757', sky: bands(.04, 'radial-gradient(90% 80% at 70% 30%, #3a2219, #1f1714 55%, #150f0d)'), greet: 'what shall we spark today?' },
  { id: 'koi-pond', name: 'Koi Pond', tagline: 'Koi circling a pond between lily pads, rings on the water', bg: '#11332d', text: '#e4f2ea', accent: '#ef8a4a', sky: bands(.12, 'linear-gradient(175deg, #4aa08c, #2f8070 50%, #1f6156)'), greet: 'still water, clear mind' },
  { id: 'jellyfish', name: 'Jellyfish', tagline: 'Jellyfish rising through deep water, bells pulsing', bg: '#0a1830', text: '#dfe7fb', accent: '#a58cf0', sky: bands(.07, 'linear-gradient(#174784, #0c2b58 50%, #071a3a)'), greet: 'drifting into deep work' },
  { id: 'lantern-night', name: 'Lantern Night', tagline: 'Paper lanterns drifting down a river at night', bg: '#0b1424', text: '#efe6d2', accent: '#f2a541', sky: 'linear-gradient(#070c1c, #24305e 29%, #0e1a30 30%, #08111f 60%, #050a14)', greet: 'let your ideas drift' },
  { id: 'fireflies', name: 'Fireflies', tagline: 'Fireflies wandering and blinking over tall grass', bg: '#0b130e', text: '#e3eedc', accent: '#d8e86a', sky: bands(.03, 'radial-gradient(120% 80% at 50% 110%, #1b3522, #0c1710 60%, #070c09)'), greet: 'a warm glow for late work' },
  { id: 'neon-rain', name: 'Neon Rain', tagline: 'Rain over a city at night, neon signs buzzing, umbrellas passing by', bg: '#0c1020', text: '#e3e8f6', accent: '#ff5fa2', sky: 'linear-gradient(#05070f, #0b1024 40%, #1e1838 75%, #34203f)', greet: 'rain outside, code inside' },
  { id: 'sakura-dusk', name: 'Sakura Dusk', tagline: 'Cherry branches at the corners, petals drifting through a violet evening', bg: '#231a2e', text: '#f6e9f0', accent: '#f29bb8', sky: 'linear-gradient(#17112b, #2a1c44 40%, #523058 72%, #8c4a5e)', greet: 'petals at dusk' },
  { id: 'snow-cabin', name: 'Snow Cabin', tagline: 'A log cabin under snowy peaks, a warm window, smoke curling into falling snow', bg: '#0e1628', text: '#e6edf8', accent: '#ffb85c', sky: 'linear-gradient(#060b18, #101c38 55%, #1c2a4a)', greet: 'warm inside, snow outside' },
  { id: 'star-voyage', name: 'Star Voyage', tagline: 'A little rocket passing a ringed planet, shooting stars overhead', bg: '#0d0a1f', text: '#e6ecff', accent: '#ff6fb5', sky: 'radial-gradient(110% 90% at 85% 20%, #2a1a52, #120d2e 50%, #08061a)', greet: 'ready for liftoff?' },
];

function bands(a, sky) {
  const w = k => `rgba(255, 255, 255, ${+(a * k).toFixed(3)})`;
  return `linear-gradient(90deg, ${w(0)} 16%, ${w(1)} 25%, ${w(0)} 35%, ${w(0)} 66%, ${w(.7)} 77%, ${w(0)} 88%), ${sky}`;
}

const DIM_SPRITE_PAD = 4;
const roundRectPath = (ctx, x, y, w, h, r) => {
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
};

const put = (w, px, py, c, sx, sy) => {
  const { ctx } = w;
  ctx.globalAlpha = Math.max(0, Math.min(1, c.a));
  if (ctx.globalAlpha < .01) return;
  if (c.bg) {
    ctx.fillStyle = c.bg;
    ctx.beginPath();
    roundRectPath(ctx, px + 2, py + 2, CELL - 4, CELL - 4, 3);
    ctx.fill();
  }
  ctx.fillStyle = c.fg;
  ctx.fillText(c.ch ?? glyph(c.bg ? GLYPHS : LOOSE, sx, sy, w.time), px + CELL / 2, py + CELL / 2 + 1);
};

const drawFrame = w => {
  const { ctx, scene, time: t } = w, W = innerWidth, H = innerHeight, cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(160, 180, 255, .05)';
  ctx.beginPath();
  for (let x = 0; x <= cols; x++) { ctx.moveTo(x * CELL + .5, 0); ctx.lineTo(x * CELL + .5, H); }
  for (let y = 0; y <= rows; y++) { ctx.moveTo(0, y * CELL + .5); ctx.lineTo(W, y * CELL + .5); }
  ctx.stroke();
  if (scene.cell)
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const c = scene.cell(x, y, cols, rows, t);
        if (c) put(w, x * CELL, y * CELL, c, x, y);
      }
  for (const s of scene.sprites?.(cols, rows, t) ?? []) {
    const ox = (w.grid ? Math.round(s.x) : s.x) * CELL, oy = (w.grid ? Math.round(s.y) : s.y) * CELL;
    const m = s.a ?? 1, k = s.key * 997;
    const bw = s.art ? s.art[0].length : s.w, bh = s.art ? s.art.length : s.h;
    if (ox > W + CELL * DIM_SPRITE_PAD || oy > H + CELL * DIM_SPRITE_PAD || ox + (bw + DIM_SPRITE_PAD) * CELL < 0 || oy + (bh + DIM_SPRITE_PAD) * CELL < 0) continue;
    if (s.glow) {
      const g = s.glow, cx = ox + bw / 2 * CELL, cy = oy + bh / 2 * CELL, r = g.r * CELL;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, g.color);
      grad.addColorStop(1, `${g.color}00`);
      ctx.globalAlpha = Math.min(1, g.a);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = grad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    const cells = [];
    if (s.art) s.art.forEach((row, gy) => { for (let gx = 0; gx < row.length; gx++) if (s.pal[row[gx]]) cells.push([gx, gy, s.pal[row[gx]], gx + k, gy]); });
    else
      for (let gy = 0; gy < s.h; gy++)
        for (let gx = 0; gx < s.w; gx++) {
          const f = s.field(gx, gy);
          if (f) cells.push([gx, gy, f.c, (f.sx ?? gx) + k, f.sy ?? gy]);
        }
    if (s.shadow)
      for (const [gx, gy, c] of cells)
        if (c.bg) put(w, ox + (gx + .8) * CELL, oy + (gy + .8) * CELL, { bg: s.shadow, fg: s.shadow, ch: '', a: .4 * m }, 0, 0);
    if (s.halo && s.art)
      for (const [gx, gy] of haloOf(s.art))
        put(w, ox + gx * CELL, oy + gy * CELL, { fg: s.halo, a: .3 * m }, gx + k, gy);
    for (const [gx, gy, c, sx, sy] of cells) put(w, ox + gx * CELL, oy + gy * CELL, m === 1 ? c : { ...c, a: c.a * m }, sx, sy);
  }
};

// ---- page ----
const els = {
  canvas: document.getElementById('wall'), picker: document.getElementById('picker'),
  name: document.getElementById('name'), greet: document.getElementById('greet'), tagline: document.getElementById('tagline'),
  speed: document.getElementById('speed'), cell: document.getElementById('cell'),
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage can be blocked */ } },
};
const wall = { ctx: els.canvas.getContext('2d'), canvas: els.canvas, time: 0, last: 0, raf: 0, grid: false, speed: 1, scene: undefined, theme: undefined };

const sizeCanvas = () => {
  const dpr = devicePixelRatio || 1, { canvas, ctx } = wall;
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `bold ${Math.round(CELL * 13 / 22)}px ui-monospace, Menlo, Consolas, 'Cascadia Code', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawFrame(wall);
};

const pickCell = () => {
  const want = Number(els.cell.value) || (innerWidth < 700 ? 14 : 18);
  const most = wall.scene?.size ?? 22;
  const next = Math.min([14, 18, 22].includes(want) ? want : 18, most);
  if (next !== CELL) CELL = next;
};

const tick = now => {
  wall.raf = requestAnimationFrame(tick);
  if (now - wall.last < 33) return; // ~30 fps keeps phones cool
  wall.time += (wall.last ? Math.min(now - wall.last, 250) / 1000 : 0) * wall.speed;
  wall.last = now;
  drawFrame(wall);
};

const play = () => {
  cancelAnimationFrame(wall.raf);
  wall.last = 0;
  if (!reduceMotion && !document.hidden) wall.raf = requestAnimationFrame(tick);
};

const select = id => {
  const t = THEME_LIST.find(x => x.id === id) ?? THEME_LIST[0];
  wall.theme = t;
  wall.scene = Object.hasOwn(SCENES, t.id) ? SCENES[t.id] : undefined;
  const style = document.documentElement.style;
  style.setProperty('--bg', t.bg); style.setProperty('--text', t.text); style.setProperty('--accent', t.accent);
  style.setProperty('--sky', t.sky);
  document.querySelector('meta[name="theme-color"]').content = t.bg;
  els.name.textContent = t.name; els.greet.textContent = t.greet; els.tagline.textContent = t.tagline;
  els.picker.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === t.id)));
  store.set('lostalien-wallpaper', t.id);
  history.replaceState(null, '', '#' + t.id);
  pickCell();
  sizeCanvas();
  play();
};

THEME_LIST.forEach(t => {
  const b = document.createElement('button');
  b.type = 'button'; b.dataset.id = t.id; b.textContent = t.name;
  b.style.setProperty('--chip', t.accent);
  b.addEventListener('click', () => select(t.id));
  els.picker.appendChild(b);
});

els.speed.addEventListener('input', () => { wall.speed = Number(els.speed.value); store.set('lostalien-speed', els.speed.value); });
els.cell.addEventListener('change', () => { store.set('lostalien-cell', els.cell.value); pickCell(); sizeCanvas(); });
addEventListener('resize', () => { pickCell(); sizeCanvas(); });
document.addEventListener('visibilitychange', play);

const savedSpeed = store.get('lostalien-speed'); if (savedSpeed) els.speed.value = savedSpeed;
wall.speed = Number(els.speed.value);
const savedCell = store.get('lostalien-cell'); if (savedCell) els.cell.value = savedCell;
select(location.hash.slice(1) || store.get('lostalien-wallpaper') || THEME_LIST[0].id);
