const APP_PAGE_ROUTES = {
  fiados: "Fiados.html",
  clientes: "Clientes.html",
  productos: "Productos.html",
  reportes: "Reportes.html",
  dashboard: "Dashboard.html",
  config: "Config.html"
};
const requestedAppRoute = APP_PAGE_ROUTES[document.body.dataset.page];
if (requestedAppRoute) {
  let destination = `Login.html?next=${encodeURIComponent(requestedAppRoute)}`;
  const redirect = () => location.replace(destination);
  if (window.FIAO_FIREBASE_CONFIGURED) {
    window.FIAO_FIREBASE_READY.then(async firebase => {
      if (!firebase) {
        destination += "&authError=1";
        redirect();
        return;
      }
      const user = await firebase.currentUser();
      if (user) destination = requestedAppRoute;
      redirect();
    }).catch(error => {
      console.error("No se pudo comprobar la sesión de Firebase.", error);
      destination += "&authError=1";
      redirect();
    });
  } else {
    try {
      const session = JSON.parse(localStorage.getItem("fiao-session"));
      const accounts = JSON.parse(localStorage.getItem("fiao-accounts") || "[]");
      if (session?.email && accounts.some(account => account.email === session.email)) {
        destination = requestedAppRoute;
      }
    } catch (e) {
      console.error("No se pudo comprobar la sesión local.", e);
    }
    redirect();
  }
} else {

/* ===== NOMBRES DE LAS PÁGINAS DEL SITIO PÚBLICO ===== */
const SITE_PAGES = {
  "Inicio":    "index.html",
  "Fiados":    "Fiados.html",
  "Clientes":  "Clientes.html",
  "Productos": "Productos.html",
  "Reportes":  "Reportes.html",
  "Contacto":  "Contacto.html"
};

/* ========== UTILIDADES ========== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const money = n => "B/. " + Number(n).toFixed(2);
const round2 = n => Math.round(n * 100) / 100;

// Crea un elemento con texto seguro (evita inyectar HTML)
function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Anima un número de un valor a otro
function animateNumber(el, from, to, duration = 600) {
  const start = performance.now();
  (function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = (from + (to - from) * (1 - Math.pow(1 - t, 3))).toFixed(2);
    if (t < 1) requestAnimationFrame(frame);
  })(start);
}

/* ========== ENLACES DEL SITIO (usa el bloque SITE_PAGES de arriba) ========== */
$$(".nav > a").forEach(a => {
  const file = SITE_PAGES[a.textContent.trim()];
  if (file) a.href = file;
});
const logoLink = $(".header .logo");
if (logoLink) logoLink.href = SITE_PAGES["Inicio"];
$$("a.card").forEach(a => {
  const title = $("h3", a);
  const file = title && SITE_PAGES[title.textContent.trim()];
  if (file) a.href = file;
});

/* ========== ENCABEZADO ========== */
const header = $("#header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Barra de progreso de lectura
const progress = h("div", "progress");
header.append(progress);
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
}, { passive: true });

// Si ya iniciaste sesión, el menú te lleva a tu panel
function showPanelLink() {
  const actions = $(".nav__actions");
  if (!actions) return;
  const go = h("a", "btn btn--primary", tr("Ir a mi panel"));
  go.href = "Dashboard.html";
  actions.replaceChildren(go);
}

if (window.FIAO_FIREBASE_CONFIGURED) {
  window.FIAO_FIREBASE_READY.then(async firebase => {
    if (firebase && await firebase.currentUser()) showPanelLink();
  }).catch(error => console.error("No se pudo comprobar la sesión de Firebase.", error));
} else {
  try {
    const session = JSON.parse(localStorage.getItem("fiao-session") || "null");
    const accounts = JSON.parse(localStorage.getItem("fiao-accounts") || "[]");
    if (session?.email && Array.isArray(accounts) && accounts.some(account => account.email === session.email)) {
      showPanelLink();
    }
  } catch (e) {
    console.error("No se pudo comprobar la sesión local.", e);
  }
}

/* ========== MENÚ MÓVIL ========== */
const burger = $("#burger");
const nav = $("#nav");
function setMenu(open) {
  nav.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? tr("Cerrar menú") : tr("Abrir menú"));
}
burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
$$("#nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));

/* ========== ANIMACIÓN AL HACER SCROLL ========== */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); }
  });
}, { threshold: 0.15 });
$$(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 90}ms`;
  observer.observe(el);
});

/* ========== FORMULARIOS (validación general) ========== */
const rules = {
  name: v => v.trim().length >= 2 || tr("Escribe un nombre válido."),
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || tr("Escribe un correo válido, por ejemplo nombre@correo.com."),
  message: v => v.trim().length >= 10 || tr("Cuéntanos un poco más (mínimo 10 caracteres)."),
  password: v => v.length >= 6 || tr("La contraseña debe tener al menos 6 caracteres."),
  confirm: (v, f) => v === f.elements.password.value || tr("Las contraseñas no coinciden."),
  amount: v => Number(v) > 0 || tr("Escribe un monto mayor a 0."),
  phone: v => v.trim() === "" || /^[\d\s+-]{7,}$/.test(v) || tr("Escribe un teléfono válido."),
  client: v => v !== "" || tr("Elige un cliente.")
};

function validate(field) {
  const rule = rules[field.name];
  const res = rule ? rule(field.value, field.form) : true;
  const err = $(`.error[data-for="${field.name}"]`, field.form);
  if (err) err.textContent = res === true ? "" : res;
  field.setAttribute("aria-invalid", res !== true);
  return res === true;
}

function handleForm(form, onValid) {
  if (!form) return;
  const fields = $$("input, textarea, select", form);
  fields.forEach(f => f.addEventListener("blur", () => validate(f)));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const ok = fields.map(f => validate(f)).every(Boolean);
    if (ok) onValid(Object.fromEntries(new FormData(form)));
  });
}

function showOk(form) {
  const ok = $(".form__ok", form);
  if (ok) { ok.hidden = false; setTimeout(() => (ok.hidden = true), 4000); }
}

function fillClients(select) {
  select.replaceChildren(new Option(tr("Elige un cliente"), ""));
  data.clients.forEach(c => select.add(new Option(c.name, c.id)));
}

/* ========== FIADOS ========== */
function initFiados() {
  const form = $("#movForm");
  fillClients($("#client"));
  const list = $("#movList"), total = $("#totalDebt");

  function render() {
    total.textContent = money(data.clients.reduce((s, c) => s + c.debt, 0));
    list.replaceChildren();
    if (!data.movements.length) { list.append(h("li", "empty", tr("Aún no hay movimientos. Registra el primero."))); return; }
    data.movements.slice(0, 8).forEach(m => {
      const li = h("li", "row");
      const left = h("div");
      left.append(h("strong", "", m.client), h("small", "", `${tr(m.text)} · ${m.ts ? fmtDate(m.ts) : m.date}`));
      li.append(left, h("strong", m.type === "pago" ? "pos" : "neg", `${m.type === "pago" ? "−" : "+"} ${money(m.amount)}`));
      list.append(li);
    });
  }

  handleForm(form, v => {
    const c = data.clients.find(x => x.id === v.client);
    let amount = round2(Number(v.amount));
    if (v.type === "pago") {
      if (c.debt <= 0) { $('.error[data-for="amount"]', form).textContent = tr("Este cliente no tiene saldo pendiente."); return; }
      amount = Math.min(amount, c.debt);
      c.debt = round2(c.debt - amount);
    } else {
      c.debt = round2(c.debt + amount);
    }
    data.movements.unshift({
      client: c.name, type: v.type, amount,
      text: v.note.trim() || (v.type === "pago" ? "Pago" : "Fiado"),
      ts: Date.now(), date: new Date().toLocaleDateString(LOCALE)
    });
    saveData();
    form.reset();
    render();
    showOk(form);
  });
  render();
}

/* ========== CLIENTES ========== */
function initClientes() {
  const list = $("#clientList"), search = $("#clientSearch");

  function render() {
    const q = search.value.trim().toLowerCase();
    const items = data.clients.filter(c => c.name.toLowerCase().includes(q));
    list.replaceChildren();
    if (!items.length) { list.append(h("li", "empty", tr("No encontramos clientes con ese nombre."))); return; }
    items.forEach(c => {
      const li = h("li", "row");
      const left = h("div");
      left.append(h("strong", "", c.name), h("small", "", c.phone || tr("Sin teléfono")));
      const badge = h("span", c.debt > 0 ? "badge" : "badge is-paid", c.debt > 0 ? tr("Debe {amount}", { amount: money(c.debt) }) : tr("Al día"));
      li.append(left, badge);
      list.append(li);
    });
  }
  search.addEventListener("input", render);
  handleForm($("#clientForm"), v => {
    data.clients.push({ id: "c" + Date.now(), name: v.name.trim(), phone: v.phone.trim(), debt: 0 });
    saveData();
    $("#clientForm").reset();
    render();
    showOk($("#clientForm"));
  });
  render();
}

/* ========== PRODUCTOS ========== */
function initProductos() {
  const grid = $("#productGrid"), search = $("#productSearch");
  function render() {
    const q = search.value.trim().toLowerCase();
    const items = data.products.filter(p => tr(p.name).toLowerCase().includes(q));
    grid.replaceChildren();
    if (!items.length) { grid.append(h("p", "empty", tr("No encontramos ese producto."))); return; }
    items.forEach(p => {
      const card = h("div", "card");
      card.append(h("strong", "", tr(p.name)), h("p", "price", money(p.price)));
      grid.append(card);
    });
  }
  search.addEventListener("input", render);
  render();
}

/* ========== REPORTES ========== */
function initReportes() {
  const withDebt = data.clients.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt);
  const total = data.clients.reduce((s, c) => s + c.debt, 0);
  animateNumber($("#repTotal"), 0, total, 900);
  $("#repCount").textContent = withDebt.length;
  $("#repTop").textContent = withDebt.length ? withDebt[0].name : tr("Nadie");

  const bars = $("#bars");
  bars.replaceChildren();
  if (!withDebt.length) bars.append(h("p", "empty", tr("Nadie tiene saldo pendiente.")));
  const max = withDebt.length ? withDebt[0].debt : 1;
  withDebt.forEach(c => {
    const row = h("div", "bar-row");
    const bar = h("div", "bar"), fill = h("span");
    bar.append(fill);
    row.append(h("span", "", c.name), bar, h("strong", "", money(c.debt)));
    bars.append(row);
    requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = (c.debt / max * 100) + "%")));
  });

  $("#resetBtn").addEventListener("click", () => {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  });
}

/* ========== CONTACTO, LOGIN Y REGISTRO ========== */
function initSimpleForm() {
  const form = $("#form");
  const status = $(".form__error", form);
  const accountNotice = $(".auth__notice");
  if (window.FIAO_FIREBASE_CONFIGURED) {
    window.FIAO_FIREBASE_READY.then(firebase => {
      if (!firebase && status) {
        status.hidden = false;
        status.textContent = "No se pudo conectar Firebase. Revisa la configuración y abre el sitio desde localhost o HTTPS.";
      } else if (firebase && accountNotice) {
        accountNotice.textContent = "Tu cuenta se guarda en Firebase. Los datos del negocio se guardan en este navegador.";
      }
    });
    if (new URLSearchParams(location.search).has("authError") && status) {
      status.hidden = false;
      status.textContent = "No se pudo verificar tu sesión con Firebase. Inténtalo otra vez.";
    }
  }
  $$("[data-reveal-field]", form).forEach(button => {
    button.addEventListener("click", () => {
      const field = $(`#${button.dataset.revealField}`, form);
      const visible = field.type === "password";
      field.type = visible ? "text" : "password";
      button.setAttribute("aria-label", visible ? tr("Ocultar contraseña") : tr("Mostrar contraseña"));
      $("i", button).className = visible ? "bi bi-eye-slash" : "bi bi-eye";
    });
  });

  const next = new URLSearchParams(location.search).get("next");
  const safeNext = Object.values(APP_PAGE_ROUTES).includes(next) ? next : "Dashboard.html";
  $$('a[href="Registro.html"]').forEach(link => {
    link.href = `Registro.html?next=${encodeURIComponent(safeNext)}`;
  });
  $$('a[href="Login.html"]').forEach(link => {
    link.href = `Login.html?next=${encodeURIComponent(safeNext)}`;
  });

  handleForm(form, v => {
    if (form.dataset.auth) {
      void authenticate(form, v, safeNext);
      return;
    }
    form.reset();
    showOk(form);
  });
}

async function authenticate(form, values, next) {
  const status = $(".form__error", form);
  const submitButton = $('button[type="submit"]', form);
  const email = values.email.trim().toLowerCase();
  const password = values.password;
  const encode = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const deriveHash = async (secret, salt) => {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveBits"]);
    return crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, key, 256);
  };
  const setError = message => {
    status.hidden = false;
    status.textContent = message;
  };
  status.hidden = true;
  status.textContent = "";
  submitButton.disabled = true;

  try {
    if (window.FIAO_FIREBASE_CONFIGURED) {
      const firebase = await window.FIAO_FIREBASE_READY;
      if (!firebase) throw new Error("No se pudo iniciar Firebase. Revisa su configuración y abre el sitio desde localhost o HTTPS.");
      const user = form.dataset.auth === "registro"
        ? await firebase.registerAccount({ name: values.name.trim(), email, password })
        : await firebase.signInAccount(email, password);
      const name = user.displayName || values.name?.trim() || email.split("@")[0];
      localStorage.setItem("fiao-session", JSON.stringify({ uid: user.uid, name, email }));
      showOk(form);
      setTimeout(() => (location.href = next), 500);
      return;
    }

    if (!crypto.subtle) throw new Error("Abre el sitio en HTTPS o desde localhost para crear una cuenta.");
    const accounts = JSON.parse(localStorage.getItem("fiao-accounts") || "[]");
    const existing = accounts.find(account => account.email === email);

    if (form.dataset.auth === "registro") {
      if (existing) {
        setError("Ya existe una cuenta con ese correo. Inicia sesión.");
        return;
      }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const hash = await deriveHash(password, salt);
      accounts.push({ email, name: values.name.trim(), salt: encode(salt), hash: encode(hash) });
      localStorage.setItem("fiao-accounts", JSON.stringify(accounts));
      localStorage.setItem("fiao-session", JSON.stringify({ name: values.name.trim(), email }));
    } else {
      if (!existing) {
        setError("No encontramos una cuenta con ese correo. Crea una cuenta primero.");
        return;
      }
      const salt = Uint8Array.from(atob(existing.salt), char => char.charCodeAt(0));
      const actual = encode(await deriveHash(password, salt));
      if (actual !== existing.hash) {
        setError("El correo o la contraseña no coinciden.");
        return;
      }
      localStorage.setItem("fiao-session", JSON.stringify({ name: existing.name, email }));
    }

    showOk(form);
    setTimeout(() => (location.href = next), 500);
  } catch (error) {
    const firebase = window.FIAO_FIREBASE;
    setError(firebase && error.code ? firebase.errorMessage(error) : error instanceof Error ? error.message : "No se pudo completar el acceso. Inténtalo otra vez.");
  } finally {
    submitButton.disabled = false;
  }
}

/* ========== INICIAR LA PÁGINA CORRECTA ========== */
const pages = { fiados: initFiados, clientes: initClientes, productos: initProductos, reportes: initReportes, simple: initSimpleForm };
const init = pages[document.body.dataset.page];
if (init) init();

/* Idioma: traduce lo que ya está en la página y agrega el botón ES/EN */
applyLang();
}