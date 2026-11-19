"use strict";
const $ = (s, p = document) => p.querySelector(s);

/* ---------- DADOS: palavras, posições no tabuleiro e pistas ---------- */
// r/c = linha/coluna da primeira letra; d = H (horizontal) ou V (vertical)
const WORDS = [
  { a: "MICROCONTROLADOR", n: "Microcontrolador", r: 0, c: 0, d: "H", q: "Chip único com processador, memória e pinos de entrada e saída, comum em Arduino." },
  { a: "ADDRESSBUS", n: "Address bus (barramento de endereço)", r: 0, c: 12, d: "V", q: "Via de sentido único em que a CPU indica qual posição quer acessar." },
  { a: "REGISTRADORES", n: "Registradores", r: 9, c: 0, d: "H", q: "Pequenas memórias ultrarrápidas dentro da CPU que guardam valores em uso imediato." },
  { a: "MEMORIADEMASSA", n: "Memória de massa (armazenamento)", r: 6, c: 1, d: "H", q: "Guarda arquivos e programas por longo prazo, como HDs e SSDs; lenta, mas enorme." },
  { a: "DUALCORE", n: "Dual core", r: 4, c: 5, d: "H", q: "Processador com dois núcleos de execução trabalhando em paralelo." },
  { a: "QUADCORE", n: "Quad core", r: 2, c: 9, d: "H", q: "Processador com quatro núcleos de execução trabalhando em paralelo." },
  { a: "EEPROM", n: "EEPROM", r: 2, c: 16, d: "V", q: "Memória não volátil que pode ser apagada e regravada eletricamente, byte a byte." },
  { a: "DATABUS", n: "Data bus (barramento de dados)", r: 5, c: 14, d: "V", q: "Via de mão dupla que transporta os valores lidos ou escritos entre CPU e memória." },
  { a: "ULA", n: "ULA", r: 8, c: 12, d: "H", q: "Circuito que soma, subtrai e compara valores dentro do processador." },
  { a: "CACHE", n: "Cache", r: 0, c: 2, d: "V", q: "Memória pequena e veloz entre CPU e RAM que guarda dados acessados com frequência." },
  { a: "UC", n: "UC (Unidade de Controle)", r: 2, c: 1, d: "H", q: "Dirige o fluxo: interpreta cada instrução e comanda os demais componentes da CPU." },
  { a: "FLASH", n: "Flash", r: 11, c: 11, d: "H", q: "Memória não volátil regravável por blocos, usada em pen drives e cartões SD." },
  { a: "RAM", n: "RAM", r: 8, c: 7, d: "V", q: "Memória principal volátil onde ficam programas e valores em execução." },
  { a: "ROM", n: "ROM", r: 5, c: 4, d: "V", q: "Memória não volátil gravada na fabricação, cujo conteúdo normalmente não muda." },
  { a: "DMA", n: "DMA", r: 2, c: 7, d: "V", q: "Permite que periféricos movam informações para a RAM sem sobrecarregar a CPU." },
  { a: "CPU", n: "CPU", r: 0, c: 5, d: "V", q: "Cérebro do computador: busca, decodifica e executa as instruções dos programas." }
];
/*FIM_PALAVRAS*/

/* ---------- ABAS ---------- */
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-selected", b === t));
  document.querySelectorAll("main > section").forEach(s => s.hidden = s.id !== t.dataset.tab);
}));

/* ---------- JOGO 1: CRUZADINHA ---------- */
const ROWS = 12, COLS = 17;
const cells = {}, inputs = {};
WORDS.forEach(w => {
  w.cells = [];
  for (let k = 0; k < w.a.length; k++) {
    const r = w.r + (w.d === "V" ? k : 0), c = w.c + (w.d === "H" ? k : 0), key = r + "," + c;
    (cells[key] = cells[key] || { ch: w.a[k], r, c, ws: [] }).ws.push(w);
    w.cells.push(key);
  }
});
let counter = 0;
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const starts = WORDS.filter(w => w.r === r && w.c === c);
  if (starts.length) { counter++; starts.forEach(w => w.num = counter); cells[r + "," + c].num = counter; }
}

const board = $("#board");
board.style.setProperty("--cols", COLS);
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const key = r + "," + c, cell = cells[key], sq = document.createElement("div");
  sq.className = "sq" + (cell ? "" : " off");
  if (cell) {
    if (cell.num) sq.insertAdjacentHTML("beforeend", `<span class="num">${cell.num}</span>`);
    const inp = document.createElement("input");
    inp.maxLength = 2; inp.autocomplete = "off"; inp.spellcheck = false; inp.dataset.key = key;
    inp.setAttribute("aria-label", `linha ${r + 1}, coluna ${c + 1}`);
    sq.appendChild(inp); inputs[key] = inp;
  }
  board.appendChild(sq);
}

const liOf = new Map();
[["H", "#clues-h"], ["V", "#clues-v"]].forEach(([d, sel]) => {
  WORDS.filter(w => w.d === d).sort((x, y) => x.num - y.num).forEach(w => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${w.num}.</b>${w.q}`;
    li.addEventListener("click", () => { dir = w.d; focusKey(w.cells[0]); });
    $(sel).appendChild(li); liOf.set(w, li);
  });
});

let dir = "H", cur = null;
const wordAt = (key, d) => cells[key].ws.find(w => w.d === d);
function paint() {
  document.querySelectorAll(".sq.hl").forEach(e => e.classList.remove("hl"));
  liOf.forEach(li => li.classList.remove("on"));
  if (!cur) return;
  const w = wordAt(cur, dir);
  if (!w) return;
  w.cells.forEach(k => inputs[k].parentElement.classList.add("hl"));
  liOf.get(w).classList.add("on");
  $("#dica").textContent = `${w.num} ${w.d === "H" ? "horizontal" : "vertical"}: ${w.q}`;
}
function focusKey(key) { inputs[key].focus(); inputs[key].select(); }
function step(key, d, n) {
  const [r, c] = key.split(",").map(Number);
  const k = d === "H" ? r + "," + (c + n) : (r + n) + "," + c;
  return cells[k] ? k : null;
}
Object.entries(inputs).forEach(([key, inp]) => {
  inp.addEventListener("focus", () => {
    if (!wordAt(key, dir)) dir = dir === "H" ? "V" : "H";
    cur = key; paint();
  });
  inp.addEventListener("click", () => {
    const other = dir === "H" ? "V" : "H";
    if (cur === key && inp.dataset.clicked === "1" && wordAt(key, other)) { dir = other; paint(); }
    document.querySelectorAll("input[data-clicked]").forEach(i => delete i.dataset.clicked);
    inp.dataset.clicked = "1";
  });
  inp.addEventListener("input", () => {
    const v = inp.value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    inp.value = v;
    inp.parentElement.classList.remove("ok", "bad");
    if (v) { const nx = step(key, dir, 1); if (nx) focusKey(nx); }
  });
  inp.addEventListener("keydown", e => {
    const mv = { ArrowRight: ["H", 1], ArrowLeft: ["H", -1], ArrowDown: ["V", 1], ArrowUp: ["V", -1] }[e.key];
    if (mv) { e.preventDefault(); dir = mv[0]; const nx = step(key, mv[0], mv[1]); if (nx) focusKey(nx); else paint(); }
    else if (e.key === "Backspace" && !inp.value) {
      const pv = step(key, dir, -1);
      if (pv) { e.preventDefault(); inputs[pv].value = ""; focusKey(pv); }
    }
  });
});

$("#conferir").addEventListener("click", () => {
  let ok = 0; const good = new Set();
  WORDS.forEach(w => {
    const typed = w.cells.map(k => inputs[k].value).join("");
    const certo = typed === w.a;
    if (certo) { ok++; w.cells.forEach(k => good.add(k)); }
    liOf.get(w).classList.remove("ok", "bad");
    liOf.get(w).classList.add(certo ? "ok" : "bad");
  });
  Object.keys(inputs).forEach(k => {
    const sq = inputs[k].parentElement;
    sq.classList.remove("ok", "bad");
    if (good.has(k)) sq.classList.add("ok"); else if (inputs[k].value) sq.classList.add("bad");
  });
  $("#contador").textContent = `${ok} de ${WORDS.length} palavras`;
  $("#msg").textContent = ok === WORDS.length ? "✧ SYSTEM CLEAR! Você montou a arquitetura inteira! ✧" : "Casas rosa estão erradas; palavras incompletas contam como erradas.";
});
$("#reiniciar").addEventListener("click", () => {
  Object.values(inputs).forEach(i => { i.value = ""; i.parentElement.classList.remove("ok", "bad"); });
  liOf.forEach(li => li.classList.remove("ok", "bad"));
  $("#contador").textContent = `0 de ${WORDS.length} palavras`;
  $("#msg").textContent = ""; $("#dica").textContent = "Escolha uma casa para ver a pista.";
});

/* ---------- PORTAS LÓGICAS (usadas no quiz e no lab) ---------- */
const GATES = {
  AND: (a, b) => a & b, OR: (a, b) => a | b, NOT: a => a ^ 1,
  XOR: (a, b) => a ^ b, NAND: (a, b) => (a & b) ^ 1, NOR: (a, b) => (a | b) ^ 1
};
const DESC = {
  AND: "Saída 1 só quando todas as entradas são 1.",
  OR: "Saída 1 quando pelo menos uma entrada é 1.",
  NOT: "Inverte a entrada: 0 vira 1 e 1 vira 0.",
  XOR: "Saída 1 quando as entradas são diferentes.",
  NAND: "É o AND invertido: só dá 0 quando as duas entradas são 1.",
  NOR: "É o OR invertido: só dá 1 quando as duas entradas são 0."
};
const GN = Object.keys(GATES);
const INPUTS2 = [[0, 0], [0, 1], [1, 0], [1, 1]];
const outs = g => g === "NOT" ? [GATES.NOT(0), GATES.NOT(1)] : INPUTS2.map(([a, b]) => GATES[g](a, b));

/* ---------- JOGO 2: QUIZ NEON ---------- */
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];

function makeRound() {
  const q = [];
  shuffle(WORDS).slice(0, 4).forEach(w => {
    const opts = shuffle([w, ...shuffle(WORDS.filter(x => x !== w)).slice(0, 3)]).map(o => o.n);
    q.push({ t: "Qual termo combina com a pista?", p: w.q, opts, ok: w.n, ex: `Era ${w.n}.` });
  });
  for (let i = 0; i < 3; i++) {
    const g = pick(GN), a = Math.random() < .5 ? 0 : 1, b = Math.random() < .5 ? 0 : 1;
    const out = g === "NOT" ? GATES.NOT(a) : GATES[g](a, b);
    q.push({ t: `Qual a saída da porta ${g}?`, p: g === "NOT" ? `Entrada A = ${a}` : `Entradas A = ${a} e B = ${b}`, opts: ["0", "1"], ok: String(out), ex: `${g}: ${DESC[g]}` });
  }
  for (let i = 0; i < 3; i++) {
    const g = pick(GN), o = outs(g);
    const p = g === "NOT" ? `Entrada 0 → saída ${o[0]}; entrada 1 → saída ${o[1]}.` : `Entradas 00, 01, 10 e 11 → saídas ${o.join(", ")}.`;
    const opts = shuffle([g, ...shuffle(GN.filter(x => x !== g)).slice(0, 3)]);
    q.push({ t: "Que porta tem esta tabela-verdade?", p, opts, ok: g, ex: `${g}: ${DESC[g]}` });
  }
  return shuffle(q);
}

let Q = [], qi = 0, score = 0, hits = 0, combo = 0, locked = false;
function startQuiz() { Q = makeRound(); qi = 0; score = 0; hits = 0; combo = 0; renderQ(); }
function renderQ() {
  const box = $("#quiz-box");
  if (qi >= Q.length) {
    const rank = hits >= 9 ? "Rank S · lenda do silício ✧" : hits >= 7 ? "Rank A · hacker de bits" : hits >= 5 ? "Rank B · calouro do chip" : "Rank C · reinicie e tente de novo";
    box.innerHTML = `<h2>Fim de jogo</h2><div class="q-card"><p class="clue">${hits} de ${Q.length} acertos · ${score} pontos</p><p class="clue">${rank}</p></div><button class="btn go" id="again">Jogar de novo</button>`;
    $("#again").onclick = startQuiz; return;
  }
  const q = Q[qi]; locked = false;
  box.innerHTML = `<div class="q-top"><span>Pergunta ${qi + 1}/${Q.length}</span><span>Pontos: ${score}</span><span>Combo: ${combo}x</span></div>
    <div class="q-card"><h2>${q.t}</h2><p class="clue">${q.p}</p></div>
    <div class="opts">${q.opts.map(o => `<button class="opt">${o}</button>`).join("")}</div>
    <p class="fb" id="fb" aria-live="polite"></p><button class="btn go" id="next" hidden>Próxima</button>`;
  box.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
    if (locked) return; locked = true;
    const right = b.textContent === q.ok;
    box.querySelectorAll(".opt").forEach(o => { o.disabled = true; if (o.textContent === q.ok) o.classList.add("right"); });
    if (right) { hits++; combo++; score += 10 + (combo >= 3 ? 5 : 0); } else { combo = 0; b.classList.add("wrong"); }
    $("#fb").textContent = (right ? "✔ Acertou! " : "✖ Errou. ") + q.ex;
    const nx = $("#next"); nx.hidden = false; nx.textContent = qi === Q.length - 1 ? "Ver resultado" : "Próxima";
    nx.onclick = () => { qi++; renderQ(); }; nx.focus();
  }));
}
startQuiz();

/* ---------- JOGO 3: LAB DE PORTAS ---------- */
const lab = { A: 0, B: 0 };
function renderLab() {
  $("#swA").textContent = `A = ${lab.A}`; $("#swA").setAttribute("aria-pressed", !!lab.A);
  $("#swB").textContent = `B = ${lab.B}`; $("#swB").setAttribute("aria-pressed", !!lab.B);
  $("#gates").innerHTML = GN.map(g => {
    const one = g === "NOT", out = one ? GATES.NOT(lab.A) : GATES[g](lab.A, lab.B), o = outs(g), now = one ? lab.A : lab.A * 2 + lab.B;
    const rows = o.map((s, i) => `<tr class="${i === now ? "cur" : ""}">${one ? `<td>${i}</td>` : `<td>${i >> 1}</td><td>${i & 1}</td>`}<td>${s}</td></tr>`).join("");
    return `<article class="gate ${out ? "on" : ""}"><h3>${g}<span class="led">saída ${out}</span></h3><p>${DESC[g]}</p>
      <table><tr>${one ? "<th>A</th>" : "<th>A</th><th>B</th>"}<th>S</th></tr>${rows}</table></article>`;
  }).join("");
}
$("#swA").onclick = () => { lab.A ^= 1; renderLab(); };
$("#swB").onclick = () => { lab.B ^= 1; renderLab(); };
renderLab();
