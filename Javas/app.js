/* ========== PANEL FIA'O ========== */

/* ===== NOMBRES DE LAS PÁGINAS DEL PANEL =====
   Si cambias el nombre de un archivo, cámbialo SOLO aquí (campo "file").
   Escríbelo exactamente igual que en tu carpeta, con mayúsculas y guiones. */
/* Páginas del sitio público a las que vuelve el panel (los espacios se escriben %20) */
const HOME_PAGE = "index.html";
const LOGIN_PAGE = "Login.html";

const PANEL = {
  dashboard: { file: "Dashboard.html", label: "Resumen", icon: "bi bi-grid-1x2" },
  fiados: { file: "Fiados.html", label: "Fiados", icon: "bi bi-journal-text" },
  clientes: { file: "Clientes.html", label: "Clientes", icon: "bi bi-people" },
  productos: { file: "Productos.html", label: "Inventario", icon: "bi bi-basket2" },
  ventas: { file: "Ventas.html", label: "Ventas", icon: "bi bi-cart-check" },
  reportes: { file: "Reportes.html", label: "Reportes", icon: "bi bi-bar-chart" },
  config: { file: "Config.html", label: "Mi perfil", icon: "bi bi-person-circle" }
};
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const money = n => "B/. " + Number(n).toFixed(2);
const round2 = n => Math.round(n * 100) / 100;

function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function clientPhotoFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      reject(new Error(tr("Elige una imagen JPG, PNG, WEBP o GIF.")));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error(tr("La imagen debe pesar menos de 5 MB.")));
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("load", () => {
        const scale = Math.min(1, 320 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error(tr("No se pudo procesar la imagen. Prueba con otra.")));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      });
      image.addEventListener("error", () => reject(new Error(tr("No se pudo leer la imagen. Prueba con otra."))));
      image.src = reader.result;
    });
    reader.addEventListener("error", () => reject(new Error(tr("No se pudo leer la imagen. Prueba con otra."))));
    reader.readAsDataURL(file);
  });
}

function animateNumber(el, from, to, duration = 700) {
  const start = performance.now();
  (function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = (from + (to - from) * (1 - Math.pow(1 - t, 3))).toFixed(2);
    if (t < 1) requestAnimationFrame(frame);
  })(start);
}

/* ---------- Sesión ---------- */
const SKEY = "fiao-session", ACCOUNTS_KEY = "fiao-accounts";
let session = null;
try { session = JSON.parse(localStorage.getItem(SKEY)); } catch (e) {}
let accountEmail = session && typeof session.email === "string" ? session.email.toLowerCase() : "";
let KEY = accountEmail ? `fiao-data:${encodeURIComponent(accountEmail)}` : "fiao-data";
let registered = false;
try {
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  registered = Array.isArray(accounts) && accounts.some(account => account.email === accountEmail);
} catch (e) {}

/* ---------- Datos (se guardan en tu navegador) ---------- */
const DEFAULT_DATA = {
  business: "Mi negocio",
  clients: [],
  products: [],
  movements: []
};

function loadData() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!d || !d.clients) d = JSON.parse(JSON.stringify(DEFAULT_DATA));
  d.business = d.business || "Mi negocio";
  d.clients = Array.isArray(d.clients) ? d.clients : [];
  d.products = Array.isArray(d.products) ? d.products : [];
  d.movements = Array.isArray(d.movements) ? d.movements : [];
  d.products.forEach((p, i) => {
    if (!p.id) p.id = "p" + i + "-" + Date.now();
    if (!Number.isInteger(p.stock) || p.stock < 0) p.stock = 0;
  });
  return d;
}
let data = loadData();
function saveData() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------- Cálculos ---------- */
const totalDebt = () => data.clients.reduce((s, c) => s + c.debt, 0);
function monthSum(type) {
  const now = new Date();
  return data.movements
    .filter(m => m.type === type && new Date(m.ts).getMonth() === now.getMonth() && new Date(m.ts).getFullYear() === now.getFullYear())
    .reduce((s, m) => s + m.amount, 0);
}

/* ---------- Piezas reutilizables ---------- */
let refresh = () => {};

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = h("div", "toast"); t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("is-show"), 2600);
}

function movRow(m) {
  const li = h("li", "row");
  const left = h("div");
  const items = Array.isArray(m.items) && m.items.length
    ? m.items.map(item => `${item.quantity} × ${tr(item.name)}`).join(", ")
    : tr(m.text);
  const date = m.ts ? fmtDate(m.ts) : m.date;
  left.append(h("strong", "", m.client), h("small", "", `${date} · ${items}`));
  const pago = m.type === "pago";
  li.append(left, h("strong", pago ? "pos" : "neg", `${pago ? "−" : "+"} ${money(m.amount)}`));
  return li;
}

function bars(box, items) {
  box.replaceChildren();
  if (!items.length) { box.append(h("p", "empty", tr("Nada que mostrar todavía."))); return; }
  const max = Math.max(...items.map(i => i.value)) || 1;
  items.forEach(i => {
    const row = h("div", "bar-row"), bar = h("div", "bar"), fill = h("span");
    bar.append(fill);
    row.append(h("span", "", i.label), bar, h("strong", "", money(i.value)));
    box.append(row);
    requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = (i.value / max * 100) + "%")));
  });
}

function makeDialog(id, title, body) {
  const d = document.createElement("dialog");
  d.id = id;
  d.className = "app-dialog";
  d.innerHTML = `<div class="app-dialog__box">
    <div class="app-dialog__head"><h2 class="h3">${title}</h2><button class="icon-btn" data-close aria-label="Cerrar">×</button></div>${body}</div>`;
  document.body.append(d);
  d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  return d;
}

/* ---------- Validación ---------- */
const rules = {
  name: v => v.trim().length >= 2 || tr("Escribe un nombre válido."),
  biz: v => v.trim().length >= 2 || tr("Escribe el nombre de tu negocio."),
  phone: v => v.trim() === "" || /^[\d\s+-]{7,}$/.test(v) || tr("Escribe un teléfono válido."),
  amount: v => Number(v) > 0 || tr("Escribe un monto mayor a 0."),
  price: v => Number(v) > 0 || tr("Escribe un precio mayor a 0."),
  client: v => v !== "" || tr("Elige un cliente."),
  product: v => v !== "" || tr("Elige un producto."),
  quantity: v => v.trim() !== "" && Number.isInteger(Number(v)) && Number(v) > 0 || tr("Escribe una cantidad entera mayor a 0."),
  stock: v => v.trim() !== "" && Number.isInteger(Number(v)) && Number(v) >= 0 || tr("Escribe una cantidad entera de 0 o más."),
  date: v => v !== "" && Number.isFinite(new Date(`${v}T00:00:00`).getTime()) || tr("Elige una fecha válida.")
};
function validate(field) {
  const rule = rules[field.name];
  const res = rule ? rule(field.value) : true;
  const err = $(`.error[data-for="${field.name}"]`, field.form);
  if (err) err.textContent = res === true ? "" : res;
  field.setAttribute("aria-invalid", res !== true);
  return res === true;
}
function handleForm(form, onValid) {
  const fields = $$("input, select", form);
  fields.forEach(f => f.addEventListener("blur", () => validate(f)));
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (fields.map(f => validate(f)).every(Boolean)) onValid(Object.fromEntries(new FormData(form)));
  });
}

/* ---------- Ventana: nuevo movimiento ---------- */
function movementDialog() {
  makeDialog("movDialog", "Registrar pago", `
    <form class="form form--light" id="movForm" novalidate>
      <label for="mv-client">Cliente</label>
      <select id="mv-client" name="client"></select><small class="error" data-for="client"></small>
      <label for="mv-amount">Monto (B/.)</label>
      <input id="mv-amount" name="amount" type="number" step="0.01" min="0" inputmode="decimal"><small class="error" data-for="amount"></small>
      <label for="mv-note">Nota (opcional)</label>
      <input id="mv-note" name="note" type="text" maxlength="60">
      <p class="form__error" id="movFormError" role="alert" hidden></p>
      <div class="app-dialog__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit">Guardar pago</button></div>
    </form>`);

  handleForm($("#movForm"), v => {
    const c = data.clients.find(x => x.id === v.client);
    let amount = round2(Number(v.amount));
    if (!c) {
      $('#movForm .error[data-for="client"]').textContent = tr("Elige un cliente.");
      return;
    }
    if (c.debt <= 0) {
      $('#movForm .error[data-for="amount"]').textContent = tr("Este cliente no tiene saldo pendiente.");
      return;
    }
    amount = Math.min(amount, c.debt);
    const previousDebt = c.debt;
    c.debt = round2(c.debt - amount);
    const now = Date.now();
    const movement = {
      client: c.name, type: "pago", amount, ts: now,
      text: v.note.trim() || "Pago",
      date: new Date(now).toLocaleDateString(LOCALE)
    };
    data.movements.unshift(movement);
    if (!saveData()) {
      c.debt = previousDebt;
      data.movements.shift();
      $("#movFormError").textContent = tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez.");
      $("#movFormError").hidden = false;
      return;
    }
    $("#movDialog").close();
    toast(tr("Pago de {amount} registrado", { amount: money(amount) }));
    refresh();
  });
}

function openMovement(clientId = "") {
  const sel = $("#mv-client");
  sel.replaceChildren(new Option(tr("Elige un cliente"), ""));
  data.clients.forEach(c => sel.add(new Option(c.name, c.id)));
  $("#movForm").reset();
  $("#movFormError").hidden = true;
  $$("#movForm .error").forEach(e => (e.textContent = ""));
  sel.value = clientId;
  $("#movDialog").showModal();
}

/* ---------- Estructura común ---------- */
function buildNav() {
  $(".sidebar .logo").href = HOME_PAGE;
  const nav = $("#sideNav");
  Object.entries(PANEL).forEach(([key, p]) => {
    const a = document.createElement("a");
    a.href = p.file;
    const icon = h("i", p.icon);
    icon.setAttribute("aria-hidden", "true");
    a.append(icon);
    a.append(tr(p.label));
    if (key === document.body.dataset.page) a.setAttribute("aria-current", "page");
    nav.append(a);
  });
  $$("[data-go]").forEach(a => (a.href = PANEL[a.dataset.go].file));
}

function shell() {
  buildNav();
  $("#userName").textContent = session.name;
  $("#bizName").textContent = tr(data.business);

  const side = $("#sidebar"), scrim = $("#scrim"), btn = $("#menuBtn");
  const setMenu = open => {
    side.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open);
  };
  btn.addEventListener("click", () => setMenu(!side.classList.contains("is-open")));
  scrim.addEventListener("click", () => setMenu(false));

  $("#logout").addEventListener("click", () => {
    void (async () => {
      try {
        if (window.FIAO_FIREBASE_CONFIGURED) {
          const firebase = await window.FIAO_FIREBASE_READY;
          if (!firebase) throw new Error("No se pudo conectar con Firebase.");
          await firebase.signOutAccount();
        }
        localStorage.removeItem(SKEY);
        location.href = HOME_PAGE;
      } catch (error) {
        console.error("No se pudo cerrar la sesión.", error);
        toast("No se pudo cerrar la sesión. Inténtalo otra vez.");
      }
    })();
  });

  movementDialog();
  const newMovementButton = $("#newMov");
  if (newMovementButton) {
    newMovementButton.addEventListener("click", () => {
      if (document.body.dataset.page === "dashboard") location.href = PANEL.ventas.file;
      else openMovement();
    });
  }
}

/* ========== RESUMEN ========== */
function pageDashboard() {
  $("#greet").textContent = tr("Hola, {name}", { name: session.name });
  $("#quickFiar").addEventListener("click", () => { location.href = PANEL.ventas.file; });
  $("#quickPago").addEventListener("click", () => openMovement());

  refresh = () => {
    const set = (id, val) => animateNumber($(id), parseFloat($(id).textContent) || 0, val);
    set("#sTotal", totalDebt());
    set("#sPaid", monthSum("pago"));
    set("#sCredit", monthSum("fiado"));
    $("#sCount").textContent = data.clients.filter(c => c.debt > 0).length;

    const recent = $("#recent");
    recent.replaceChildren();
    if (!data.movements.length) recent.append(h("li", "empty", tr("Aún no hay movimientos. Registra el primero.")));
    data.movements.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 5).forEach(m => recent.append(movRow(m)));

    bars($("#top"), data.clients.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 4).map(c => ({ label: c.name, value: c.debt })));
  };
  refresh();
}

/* ========== FIADOS ========== */
function pageFiados() {
  let filter = "todos", q = "";
  refresh = () => {
    const list = $("#movList");
    const items = data.movements.filter(m =>
      (filter === "todos" || m.type === filter) && m.client.toLowerCase().includes(q))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    list.replaceChildren();
    if (!items.length) list.append(h("li", "empty", tr("No hay movimientos con ese filtro.")));
    items.forEach(m => list.append(movRow(m)));
    $("#movCount").textContent = tr(items.length === 1 ? "{n} movimiento" : "{n} movimientos", { n: items.length });
  };
  $$("[data-filter]").forEach(b => b.addEventListener("click", () => {
    filter = b.dataset.filter;
    $$("[data-filter]").forEach(x => {
      x.classList.toggle("is-active", x === b);
      x.setAttribute("aria-selected", x === b);
    });
    refresh();
  }));
  $("#movSearch").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); refresh(); });
  refresh();
}

/* ========== CLIENTES ========== */
function pageClientes() {
  const dialog = makeDialog("clientDialog", "Agregar cliente", `
    <form class="form form--light" id="clientForm" novalidate>
      <label class="photo-upload" for="cl-photo">
        <span class="photo-preview" id="photoPreview"><i class="bi bi-person" aria-hidden="true"></i></span>
        <span><strong>Agrega una foto</strong><small>Así será más fácil reconocer a la persona. Opcional.</small></span>
      </label>
      <input id="cl-photo" class="visually-hidden" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif">
      <small class="error" data-for="photo"></small>
      <label for="cl-name">Nombre</label>
      <input id="cl-name" name="name" type="text" autocomplete="off"><small class="error" data-for="name"></small>
      <label for="cl-phone">Teléfono (opcional)</label>
      <input id="cl-phone" name="phone" type="tel" placeholder="6000-0000"><small class="error" data-for="phone"></small>
      <p class="form__error" id="clientFormError" role="alert" hidden></p>
      <div class="app-dialog__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit"><i class="bi bi-person-plus" aria-hidden="true"></i> Agregar cliente</button></div>
    </form>`);
  const form = $("#clientForm");
  let photoData = "";
  const photoInput = $("#cl-photo", form);
  const photoPreview = $("#photoPreview", form);

  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    const error = $('.error[data-for="photo"]', form);
    error.textContent = "";
    if (!file) return;
    const submitButton = $('button[type="submit"]', form);
    submitButton.disabled = true;
    clientPhotoFromFile(file).then(imageData => {
      photoData = imageData;
      const preview = new Image();
      preview.alt = tr("Vista previa de la foto del cliente");
      preview.src = photoData;
      photoPreview.replaceChildren(preview);
    }).catch(photoError => {
      error.textContent = photoError.message;
      photoInput.value = "";
    }).finally(() => {
      photoInput.value = "";
      submitButton.disabled = false;
    });
  });

  handleForm(form, v => {
    if ($('button[type="submit"]', form).disabled) return;
    const client = {
      id: "c" + Date.now(),
      name: v.name.trim(),
      phone: v.phone.trim(),
      debt: 0,
      photo: photoData
    };
    data.clients.push(client);
    if (!saveData()) {
      data.clients.pop();
      $("#clientFormError").textContent = tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez.");
      $("#clientFormError").hidden = false;
      return;
    }
    $("#clientForm").reset();
    photoData = "";
    photoPreview.innerHTML = '<i class="bi bi-person" aria-hidden="true"></i>';
    $("#clientFormError").hidden = true;
    dialog.close();
    toast(tr("Cliente agregado"));
    refresh();
  });
  $("#addClient").addEventListener("click", () => {
    form.reset();
    photoData = "";
    photoPreview.innerHTML = '<i class="bi bi-person" aria-hidden="true"></i>';
    $("#clientFormError").hidden = true;
    $$(".error", form).forEach(error => { error.textContent = ""; });
    dialog.showModal();
  });

  const search = $("#clientSearch");
  const carousel = $("#clientList");
  const indicators = $("#clientIndicators");
  const carouselElement = $("#clientsCarousel");
  let currentIndex = 0;
  let swipeStartX = null;
  let filter = "todos";
  const updateCarousel = nextIndex => {
    const cards = $$(".client-card", carousel);
    if (!cards.length) return;
    currentIndex = (nextIndex + cards.length) % cards.length;
    const cardWidth = cards[0].offsetWidth;
    const step = cardWidth * .72;
    cards.forEach((card, index) => {
      let offset = (index - currentIndex + cards.length) % cards.length;
      if (offset > cards.length / 2) offset -= cards.length;
      const distance = Math.abs(offset);
      card.style.setProperty("--client-offset", `${offset * step}px`);
      card.style.setProperty("--client-scale", distance === 0 ? "1" : distance === 1 ? ".84" : ".68");
      card.style.zIndex = String(20 - distance);
      card.style.opacity = distance <= 1 ? (distance === 0 ? "1" : ".9") : "0";
      card.classList.toggle("is-active", distance === 0);
      card.setAttribute("aria-hidden", String(distance !== 0));
      card.inert = distance !== 0;
    });
    $$(".client-carousel__indicator", indicators).forEach((button, index) => {
      button.setAttribute("aria-current", String(index === currentIndex));
    });
  };
  carouselElement.querySelector(".client-carousel__control--prev").addEventListener("click", () => updateCarousel(currentIndex - 1));
  carouselElement.querySelector(".client-carousel__control--next").addEventListener("click", () => updateCarousel(currentIndex + 1));
  carouselElement.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target.matches("input, textarea, select")) return;
    event.preventDefault();
    updateCarousel(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
  });
  carouselElement.addEventListener("pointerdown", event => {
    if (event.target.closest("button, input, label")) return;
    swipeStartX = event.clientX;
  });
  carouselElement.addEventListener("pointerup", event => {
    if (swipeStartX === null) return;
    const distance = event.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(distance) > 45) updateCarousel(currentIndex + (distance < 0 ? 1 : -1));
  });
  carouselElement.addEventListener("pointercancel", () => { swipeStartX = null; });
  window.addEventListener("resize", () => updateCarousel(currentIndex), { passive: true });
  $$("[data-client-filter]").forEach(button => button.addEventListener("click", () => {
    filter = button.dataset.clientFilter;
    $$("[data-client-filter]").forEach(item => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", selected);
    });
    refresh();
  }));

  refresh = () => {
    const q = search.value.trim().toLowerCase();
    carousel.replaceChildren();
    indicators.replaceChildren();
    currentIndex = 0;
    const items = data.clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q);
      const matchesFilter = filter === "todos" || (filter === "pendientes" ? c.debt > 0 : c.debt <= 0);
      return matchesSearch && matchesFilter;
    });
    $("#clientCount").textContent = tr(items.length === 1 ? "{n} cliente" : "{n} clientes", { n: items.length });
    if (!items.length) {
      const empty = h("div", "client-empty");
      const message = q
        ? tr("No encontramos clientes con esa búsqueda.")
        : data.clients.length
          ? tr("No hay clientes para este filtro.")
          : tr("Todavía no tienes clientes.");
      empty.append(h("i", "bi bi-person-lines-fill"), h("strong", "", message));
      const hint = q
        ? tr("Prueba con otro nombre o teléfono.")
        : data.clients.length
          ? tr("Prueba cambiando el filtro.")
          : tr("Agrega a tu primer cliente para empezar a registrar sus fiados.");
      empty.append(h("p", "", hint));
      carousel.append(empty);
    }
    items.forEach((client, index) => {
      const indicator = h("button");
      indicator.className = "client-carousel__indicator";
      indicator.type = "button";
      indicator.setAttribute("aria-label", tr("Ir al grupo {n}", { n: index + 1 }));
      if (index === 0) {
        indicator.setAttribute("aria-current", "true");
      } else {
        indicator.setAttribute("aria-current", "false");
      }
      indicator.addEventListener("click", () => updateCarousel(index));
      indicators.append(indicator);
    });
    items.forEach(c => {
      const card = h("article", "client-card");
      card.setAttribute("aria-label", tr("Ficha de {name}", { name: c.name }));
      const visual = h("div", "client-card__visual");
      const avatar = h("div", "client-avatar");
      avatar.setAttribute("aria-hidden", c.photo ? "true" : "false");
      if (c.photo) {
        const image = new Image();
        image.src = c.photo;
        image.alt = tr("Foto de {name}", { name: c.name });
        avatar.append(image);
      } else {
        avatar.textContent = c.name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
      }
      visual.append(avatar);

      const details = h("div", "client-card__details");
      details.append(h("h3", "client-card__name", c.name));
      const meta = h("div", "client-card__meta");
      const phone = h("span", "client-card__tag");
      phone.append(h("i", "bi bi-telephone", ""), document.createTextNode(` ${c.phone || tr("Sin teléfono")}`));
      const status = h("span", c.debt > 0 ? "client-card__tag is-pending" : "client-card__tag is-clear", c.debt > 0 ? tr("Pendiente") : tr("Al día"));
      meta.append(phone, status);
      details.append(meta);
      const balance = h("div", c.debt > 0 ? "client-balance is-pending" : "client-balance is-clear");
      balance.append(h("small", "", c.debt > 0 ? tr("Saldo pendiente") : tr("Cuenta al día")));
      balance.append(h("strong", "", money(c.debt)));
      const footer = h("div", "client-card__footer");
      footer.append(balance);
      const actions = h("div", "client-card__actions");
      const del = h("button", "btn btn--danger btn--sm");
      del.type = "button";
      del.setAttribute("aria-label", tr("Eliminar a {name}", { name: c.name }));
      del.append(h("i", "bi bi-trash3", ""), document.createTextNode(` ${tr("Eliminar")}`));
      del.addEventListener("click", () => {
        if (!confirm(tr("¿Eliminar a {name}? Su historial de movimientos se conserva.", { name: c.name }))) return;
        const previousClients = data.clients;
        data.clients = data.clients.filter(x => x.id !== c.id);
        if (!saveData()) {
          data.clients = previousClients;
          toast(tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez."));
          return;
        }
        toast(tr("Cliente eliminado"));
        refresh();
      });
      actions.append(del);
      card.append(visual, details, footer, actions);
      carousel.append(card);
    });
    carouselElement.classList.toggle("client-carousel--single", items.length <= 1);
    updateCarousel(0);
  };
  search.addEventListener("input", () => {
    refresh();
  });
  refresh();
}

/* ========== PRODUCTOS ========== */
function pageProductos() {
  const dialog = makeDialog("productDialog", "Agregar producto", `
    <form class="form form--light" id="productForm" novalidate>
      <label class="photo-upload" for="pr-photo">
        <span class="photo-preview" id="productPhotoPreview"><i class="bi bi-image" aria-hidden="true"></i></span>
        <span><strong>Agrega una imagen</strong><small>Identifica el producto de un vistazo. Opcional.</small></span>
      </label>
      <input id="pr-photo" class="visually-hidden" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif">
      <small class="error" data-for="photo"></small>
      <label for="pr-name">Nombre</label>
      <input id="pr-name" name="name" type="text" autocomplete="off"><small class="error" data-for="name"></small>
      <label for="pr-price">Precio (B/.)</label>
      <input id="pr-price" name="price" type="number" step="0.01" min="0" inputmode="decimal"><small class="error" data-for="price"></small>
      <label for="pr-stock">Existencias iniciales</label>
      <input id="pr-stock" name="stock" type="number" step="1" min="0" value="0" inputmode="numeric"><small class="error" data-for="stock"></small>
      <p class="form__error" id="productFormError" role="alert" hidden></p>
      <div class="app-dialog__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit">Agregar</button></div>
    </form>`);
  const stockDialog = makeDialog("stockDialog", "Actualizar existencias", `
    <form class="form form--light" id="stockForm" novalidate>
      <p class="muted" id="stockProductName"></p>
      <label for="stock-value">Unidades disponibles</label>
      <input id="stock-value" name="stock" type="number" step="1" min="0" inputmode="numeric"><small class="error" data-for="stock"></small>
      <p class="form__error" id="stockFormError" role="alert" hidden></p>
      <div class="app-dialog__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit">Guardar existencias</button></div>
    </form>`);
  const form = $("#productForm");
  const photoInput = $("#pr-photo", form);
  const photoPreview = $("#productPhotoPreview", form);
  let photoData = "";
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    const error = $('.error[data-for="photo"]', form);
    error.textContent = "";
    if (!file) return;
    const submitButton = $('button[type="submit"]', form);
    submitButton.disabled = true;
    clientPhotoFromFile(file).then(imageData => {
      photoData = imageData;
      const preview = new Image();
      preview.alt = tr("Vista previa de la imagen del producto");
      preview.src = photoData;
      photoPreview.replaceChildren(preview);
    }).catch(photoError => {
      error.textContent = photoError.message;
      photoInput.value = "";
    }).finally(() => {
      photoInput.value = "";
      submitButton.disabled = false;
    });
  });
  handleForm($("#productForm"), v => {
    if ($('button[type="submit"]', form).disabled) return;
    const product = {
      id: "p" + Date.now(),
      name: v.name.trim(),
      price: round2(Number(v.price)),
      stock: Number(v.stock),
      photo: photoData
    };
    data.products.push(product);
    if (!saveData()) {
      data.products.pop();
      $("#productFormError").textContent = tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez.");
      $("#productFormError").hidden = false;
      return;
    }
    form.reset();
    photoData = "";
    photoPreview.innerHTML = '<i class="bi bi-image" aria-hidden="true"></i>';
    $("#productFormError").hidden = true;
    dialog.close();
    toast(tr("Producto agregado"));
    refresh();
  });
  const stockForm = $("#stockForm");
  let stockProductId = "";
  handleForm(stockForm, v => {
    const product = data.products.find(item => item.id === stockProductId);
    if (!product) {
      $("#stockFormError").textContent = tr("No se encontró el producto. Actualiza la página e inténtalo otra vez.");
      $("#stockFormError").hidden = false;
      return;
    }
    const previousStock = product.stock;
    product.stock = Number(v.stock);
    if (!saveData()) {
      product.stock = previousStock;
      $("#stockFormError").textContent = tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez.");
      $("#stockFormError").hidden = false;
      return;
    }
    stockDialog.close();
    toast(tr("Existencias actualizadas"));
    refresh();
  });
  const openStockDialog = product => {
    stockProductId = product.id;
    stockForm.reset();
    $("#stock-value").value = String(product.stock);
    $("#stockProductName").textContent = product.name;
    $("#stockFormError").hidden = true;
    $$(".error", stockForm).forEach(error => { error.textContent = ""; });
    stockDialog.showModal();
  };
  $("#addProduct").addEventListener("click", () => {
    form.reset();
    photoData = "";
    photoPreview.innerHTML = '<i class="bi bi-image" aria-hidden="true"></i>';
    $("#productFormError").hidden = true;
    $$(".error", form).forEach(error => { error.textContent = ""; });
    dialog.showModal();
  });

  const search = $("#productSearch");
  refresh = () => {
    const q = search.value.trim().toLowerCase();
    const grid = $("#productGrid");
    grid.classList.remove("product-grid--enter");
    void grid.offsetWidth;
    grid.replaceChildren();
    const items = data.products.filter(p => tr(p.name).toLowerCase().includes(q));
    if (!items.length) grid.append(h("p", "empty", tr("No encontramos ese producto.")));
    items.forEach((p, index) => {
      const card = h("article", "product-card");
      card.dataset.palette = String(index % 4);
      const body = h("div", "product-card__body");
      const photoPicker = h("input", "visually-hidden");
      photoPicker.id = `product-photo-${p.id}`;
      photoPicker.type = "file";
      photoPicker.accept = "image/jpeg,image/png,image/webp,image/gif";
      photoPicker.tabIndex = -1;
      photoPicker.setAttribute("aria-hidden", "true");
      photoPicker.addEventListener("change", async () => {
        const file = photoPicker.files[0];
        if (!file) return;
        try {
          const previousPhoto = p.photo;
          p.photo = await clientPhotoFromFile(file);
          if (!saveData()) {
            p.photo = previousPhoto;
            toast(tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez."));
            return;
          }
          toast(tr("Imagen del producto actualizada"));
          refresh();
        } catch (photoError) {
          toast(photoError.message);
        } finally {
          photoPicker.value = "";
        }
      });
      const photoButton = h("button", "product-card__photo");
      photoButton.type = "button";
      photoButton.setAttribute("aria-label", tr(p.photo ? "Cambiar imagen de {name}" : "Agregar imagen a {name}", { name: p.name }));
      photoButton.addEventListener("click", () => photoPicker.click());
      if (p.photo) {
        const image = new Image();
        image.src = p.photo;
        image.alt = "";
        photoButton.append(image);
      } else {
        photoButton.append(h("i", "bi bi-basket2 product-card__placeholder", ""));
      }
      const photoAction = h("span", "product-card__photo-action");
      photoAction.append(h("i", "bi bi-camera"));
      photoButton.append(photoAction);
      const del = h("button", "btn btn--danger btn--sm", tr("Eliminar"));
      del.addEventListener("click", () => {
        const previousProducts = data.products;
        data.products = data.products.filter(x => x.id !== p.id);
        if (!saveData()) {
          data.products = previousProducts;
          toast(tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez."));
          return;
        }
        toast(tr("Producto eliminado"));
        refresh();
      });
      const stockButton = h("button", "btn btn--ghost btn--sm", tr("Actualizar stock"));
      stockButton.type = "button";
      stockButton.addEventListener("click", () => openStockDialog(p));
      const actions = h("div", "product-card__actions");
      actions.append(stockButton, del);
      body.append(
        photoPicker,
        photoButton,
        h("h2", "product-card__name", tr(p.name)),
        h("p", "price product-card__price", money(p.price)),
        h("p", "product-card__stock", tr(p.stock === 1 ? "{n} unidad disponible" : "{n} unidades disponibles", { n: p.stock })),
        actions
      );
      card.append(body);
      grid.append(card);
    });
    const totalStock = data.products.reduce((total, product) => total + product.stock, 0);
    const productCount = data.products.length;
    const productLabel = tr(productCount === 1 ? "{n} producto" : "{n} productos", { n: productCount });
    const stockLabel = tr(totalStock === 1 ? "{n} unidad disponible" : "{n} unidades disponibles", { n: totalStock });
    $("#inventorySummary").textContent = `${productLabel} · ${stockLabel}`;
    grid.classList.add("product-grid--enter");
  };
  search.addEventListener("input", refresh);
  refresh();
}

/* ========== VENTAS ========== */
function pageVentas() {
  const quickClientDialog = makeDialog("quickClientDialog", "Agregar cliente", `
    <form class="form form--light" id="quickClientForm" novalidate>
      <label for="quick-client-name">Nombre</label>
      <input id="quick-client-name" name="name" type="text" autocomplete="off"><small class="error" data-for="name"></small>
      <label for="quick-client-phone">Teléfono (opcional)</label>
      <input id="quick-client-phone" name="phone" type="tel" placeholder="6000-0000"><small class="error" data-for="phone"></small>
      <p class="form__error" id="quickClientFormError" role="alert" hidden></p>
      <div class="app-dialog__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit">Agregar cliente</button></div>
    </form>`);
  const form = $("#saleForm");
  const clientSelect = $("#saleClient");
  const productSelect = $("#saleProduct");
  const quantityInput = $("#saleQuantity");
  const dateInput = $("#saleDate");
  const total = $("#saleTotal");
  const stockNotice = $("#saleStockNotice");
  const quickClientForm = $("#quickClientForm");

  const localDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const selectedProduct = () => data.products.find(product => product.id === productSelect.value);
  const updateTotal = () => {
    const product = selectedProduct();
    const quantity = Number(quantityInput.value);
    total.textContent = product && Number.isFinite(quantity) && quantity > 0
      ? money(round2(quantity * product.price))
      : money(0);
    quantityInput.max = product ? String(product.stock) : "";
    if (product && Number.isInteger(quantity) && quantity > product.stock) {
      $('.error[data-for="quantity"]', form).textContent = tr("Solo hay {n} unidades disponibles.", { n: product.stock });
      quantityInput.setAttribute("aria-invalid", "true");
    } else if (quantityInput.getAttribute("aria-invalid") === "true") validate(quantityInput);
  };
  const updateClientOptions = selectedId => {
    clientSelect.replaceChildren(new Option(tr("Elige un cliente"), ""));
    data.clients.forEach(client => clientSelect.add(new Option(client.name, client.id)));
    if (selectedId) clientSelect.value = selectedId;
  };
  const updateProductOptions = selectedId => {
    const available = data.products.filter(product => product.stock > 0);
    productSelect.replaceChildren(new Option(
      available.length ? tr("Elige un producto") : tr("No hay productos con existencias"),
      ""
    ));
    available.forEach(product => {
      productSelect.add(new Option(
        `${tr(product.name)} · ${money(product.price)} · ${tr("{n} disponibles", { n: product.stock })}`,
        product.id
      ));
    });
    if (selectedId && available.some(product => product.id === selectedId)) productSelect.value = selectedId;
    stockNotice.textContent = available.length
      ? tr("Las existencias se descuentan al registrar el fiado.")
      : tr("Agrega productos y unidades desde Inventario para empezar.");
  };
  const refresh = (selectedClientId = clientSelect.value, selectedProductId = productSelect.value) => {
    updateClientOptions(selectedClientId);
    updateProductOptions(selectedProductId);
    updateTotal();
  };

  updateClientOptions();
  updateProductOptions();
  dateInput.value = localDate(new Date());
  quantityInput.value = "1";
  updateTotal();
  clientSelect.addEventListener("change", () => validate(clientSelect));
  productSelect.addEventListener("change", () => {
    validate(productSelect);
    updateTotal();
  });
  quantityInput.addEventListener("input", updateTotal);
  quantityInput.addEventListener("blur", updateTotal);

  $("#addSaleClient").addEventListener("click", () => {
    quickClientForm.reset();
    $("#quickClientFormError").hidden = true;
    $$(".error", quickClientForm).forEach(error => { error.textContent = ""; });
    quickClientDialog.showModal();
  });
  handleForm(quickClientForm, values => {
    const client = {
      id: "c" + Date.now(),
      name: values.name.trim(),
      phone: values.phone.trim(),
      debt: 0,
      photo: ""
    };
    data.clients.push(client);
    if (!saveData()) {
      data.clients.pop();
      $("#quickClientFormError").textContent = tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez.");
      $("#quickClientFormError").hidden = false;
      return;
    }
    quickClientDialog.close();
    refresh(client.id, productSelect.value);
    validate(clientSelect);
    toast(tr("Cliente agregado"));
  });

  handleForm(form, values => {
    const client = data.clients.find(item => item.id === values.client);
    const product = data.products.find(item => item.id === values.product);
    const quantity = Number(values.quantity);
    if (!client || !product) {
      $("#saleFormError").textContent = tr("El cliente o el producto ya no está disponible. Actualiza la página e inténtalo otra vez.");
      $("#saleFormError").hidden = false;
      refresh();
      return;
    }
    if (quantity > product.stock) {
      $('.error[data-for="quantity"]', form).textContent = tr("Solo hay {n} unidades disponibles.", { n: product.stock });
      quantityInput.setAttribute("aria-invalid", "true");
      return;
    }

    const amount = round2(quantity * product.price);
    const timestamp = new Date(`${values.date}T12:00:00`).getTime();
    const previousDebt = client.debt;
    const previousStock = product.stock;
    const movement = {
      client: client.name,
      clientId: client.id,
      type: "fiado",
      amount,
      ts: timestamp,
      date: new Date(timestamp).toLocaleDateString(LOCALE),
      text: "Fiado",
      items: [{ productId: product.id, name: product.name, quantity, unitPrice: product.price }]
    };
    client.debt = round2(client.debt + amount);
    product.stock -= quantity;
    data.movements.unshift(movement);
    if (!saveData()) {
      client.debt = previousDebt;
      product.stock = previousStock;
      data.movements.shift();
      $("#saleFormError").textContent = tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez.");
      $("#saleFormError").hidden = false;
      return;
    }

    form.reset();
    dateInput.value = localDate(new Date());
    quantityInput.value = "1";
    $("#saleFormError").hidden = true;
    $('.error[data-for="quantity"]', form).textContent = "";
    quantityInput.removeAttribute("aria-invalid");
    refresh("", "");
    toast(tr("Fiado de {amount} registrado", { amount: money(amount) }));
  });
  $("#saleDate").addEventListener("change", () => validate(dateInput));
}

/* ========== REPORTES ========== */
function pageReportes() {
  refresh = () => {
    const set = (id, val) => animateNumber($(id), parseFloat($(id).textContent) || 0, val, 900);
    set("#rTotal", totalDebt());
    set("#rPaid", monthSum("pago"));
    set("#rCredit", monthSum("fiado"));
    $("#rCount").textContent = data.clients.filter(c => c.debt > 0).length;
    bars($("#rBars"), data.clients.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt).map(c => ({ label: c.name, value: c.debt })));
    bars($("#rMonth"), [{ label: tr("Fiado"), value: monthSum("fiado") }, { label: tr("Pagos"), value: monthSum("pago") }]);
  };
  refresh();

  $("#exportBtn").addEventListener("click", () => {
    const esc = s => { s = String(s); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const rows = [[tr("Cliente"), tr("Teléfono"), tr("Saldo (B/.)")], ...data.clients.map(c => [c.name, c.phone, c.debt.toFixed(2)])];
    const csv = "\ufeff" + rows.map(r => r.map(esc).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "clientes-fiao.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast(tr("Reporte descargado"));
  });
}

/* ========== CONFIGURACIÓN ========== */
function pageConfig() {
  const form = $("#settingsForm");
  const photoInput = $("#profilePhotoInput");
  const photoKey = `fiao-profile-photo:${encodeURIComponent(accountEmail)}`;
  const avatar = $("#profileAvatar");
  const setAvatar = photo => {
    avatar.replaceChildren();
    if (photo) {
      const image = new Image();
      image.src = photo;
      image.alt = tr("Foto de perfil de {name}", { name: session.name });
      avatar.append(image);
    } else {
      avatar.textContent = session.name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
    }
  };
  const updateSummary = () => {
    $("#profileName").textContent = session.name;
    $("#profileEmail").textContent = session.email;
    $("#profileBusiness").textContent = tr(data.business);
    $("#profileClientCount").textContent = data.clients.length;
    $("#profileCreditTotal").textContent = money(totalDebt());
    $("#profileMovementCount").textContent = data.movements.length;
    const activity = $("#profileActivity");
    const recent = data.movements.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 4);
    activity.replaceChildren();
    if (!recent.length) activity.append(h("li", "empty", tr("Aún no hay movimientos. Registra el primero.")));
    recent.forEach(movement => activity.append(movRow(movement)));
    $("#profileActivityCount").textContent = tr(recent.length === 1 ? "{n} movimiento reciente" : "{n} movimientos recientes", { n: recent.length });
    let photo = "";
    try {
      photo = localStorage.getItem(photoKey) || "";
    } catch (error) {
      console.error("No se pudo leer la foto de perfil guardada.", error);
      $("#profilePhotoError").textContent = tr("No se pudo cargar la foto de perfil desde este navegador.");
    }
    setAvatar(photo);
  };
  $("#biz").value = tr(data.business);
  $("#uname").value = session.name;
  $("#profileEmailInput").value = session.email;
  updateSummary();
  photoInput.addEventListener("change", async () => {
    const file = photoInput.files[0];
    if (!file) return;
    $("#profilePhotoError").textContent = "";
    try {
      const imageData = await clientPhotoFromFile(file);
      localStorage.setItem(photoKey, imageData);
      setAvatar(imageData);
      $("#profilePhotoError").textContent = "";
      toast(tr("Foto de perfil actualizada"));
    } catch (error) {
      $("#profilePhotoError").textContent = error.message;
    } finally {
      photoInput.value = "";
    }
  });
  $("#editProfile").addEventListener("click", () => {
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    $("#uname").focus({ preventScroll: true });
  });
  handleForm(form, values => {
    void saveProfile(values);
  });
  const saveProfile = async values => {
    const previousBusiness = data.business;
    const previousName = session.name;
    data.business = values.biz.trim();
    session.name = values.name.trim();
    if (!saveData()) {
      data.business = previousBusiness;
      session.name = previousName;
      $("#profileFormError").textContent = tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez.");
      $("#profileFormError").hidden = false;
      return;
    }
    try {
      localStorage.setItem(SKEY, JSON.stringify(session));
      if (window.FIAO_FIREBASE_CONFIGURED) {
        const firebase = await window.FIAO_FIREBASE_READY;
        if (!firebase) throw new Error("Firebase no está disponible.");
        await firebase.updateAccountProfile(session.name);
      }
    } catch (error) {
      data.business = previousBusiness;
      session.name = previousName;
      if (!saveData()) console.error("No se pudieron restaurar los datos del perfil.");
      try { localStorage.setItem(SKEY, JSON.stringify(session)); } catch (storageError) {
        console.error("No se pudo restaurar el perfil guardado.", storageError);
      }
      console.error("No se pudo actualizar el perfil.", error);
      $("#profileFormError").textContent = tr("No se pudo guardar el perfil. Inténtalo otra vez.");
      $("#profileFormError").hidden = false;
      return;
    }
    $("#profileFormError").hidden = true;
    $("#bizName").textContent = tr(data.business);
    $("#userName").textContent = session.name;
    updateSummary();
    toast(tr("Cambios guardados"));
  };
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm(tr("¿Borrar todos tus datos y volver a los de ejemplo?"))) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  });
}

/* ========== INICIO ========== */
const pages = { dashboard: pageDashboard, fiados: pageFiados, clientes: pageClientes, productos: pageProductos, ventas: pageVentas, reportes: pageReportes, config: pageConfig };
async function startPanel() {
  const page = PANEL[document.body.dataset.page];
  const next = page ? `?next=${encodeURIComponent(page.file)}` : "";
  if (window.FIAO_FIREBASE_CONFIGURED) {
    try {
      const firebase = await window.FIAO_FIREBASE_READY;
      if (!firebase) throw new Error("Firebase no está disponible.");
      const user = await firebase.currentUser();
      if (!user) {
        location.replace(LOGIN_PAGE + next);
        return;
      }
      session = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split("@")[0]
      };
      accountEmail = user.email.toLowerCase();
      KEY = `fiao-data:${encodeURIComponent(accountEmail)}`;
      registered = true;
      localStorage.setItem(SKEY, JSON.stringify(session));
      data = loadData();
    } catch (error) {
      console.error("No se pudo verificar la sesión de Firebase.", error);
      location.replace(`${LOGIN_PAGE}${next ? `${next}&` : "?"}authError=1`);
      return;
    }
  } else if (!session || !registered) {
    location.replace(LOGIN_PAGE + next);
    return;
  }

  saveData();
  shell();
  const init = pages[document.body.dataset.page];
  if (init) init();
  applyLang();
}
void startPanel();