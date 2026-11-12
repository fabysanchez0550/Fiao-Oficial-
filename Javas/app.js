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
  productos: { file: "Productos.html", label: "Productos", icon: "bi bi-basket2" },
  reportes: { file: "Reportes.html", label: "Reportes", icon: "bi bi-bar-chart" },
  config: { file: "Config.html", label: "Configuración", icon: "bi bi-gear" }
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
  d.products.forEach((p, i) => { if (!p.id) p.id = "p" + i + "-" + Date.now(); });
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
  left.append(h("strong", "", m.client), h("small", "", `${tr(m.text)} · ${m.ts ? fmtDate(m.ts) : m.date}`));
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
  client: v => v !== "" || tr("Elige un cliente.")
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
  makeDialog("movDialog", "Nuevo movimiento", `
    <form class="form form--light" id="movForm" novalidate>
      <label for="mv-client">Cliente</label>
      <select id="mv-client" name="client"></select><small class="error" data-for="client"></small>
      <label for="mv-type">Tipo</label>
      <select id="mv-type" name="type"><option value="fiado">Fiado (se lleva algo)</option><option value="pago">Pago (abona)</option></select>
      <label for="mv-amount">Monto (B/.)</label>
      <input id="mv-amount" name="amount" type="number" step="0.01" min="0" inputmode="decimal"><small class="error" data-for="amount"></small>
      <label for="mv-note">Nota (opcional)</label>
      <input id="mv-note" name="note" type="text" maxlength="60">
      <div class="app-dialog__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit">Guardar</button></div>
    </form>`);

  handleForm($("#movForm"), v => {
    const c = data.clients.find(x => x.id === v.client);
    let amount = round2(Number(v.amount));
    if (v.type === "pago") {
      if (c.debt <= 0) { $('#movForm .error[data-for="amount"]').textContent = tr("Este cliente no tiene saldo pendiente."); return; }
      amount = Math.min(amount, c.debt);
      c.debt = round2(c.debt - amount);
    } else {
      c.debt = round2(c.debt + amount);
    }
    const now = Date.now();
    data.movements.unshift({
      client: c.name, type: v.type, amount, ts: now,
      text: v.note.trim() || (v.type === "pago" ? "Pago" : "Fiado"),
      date: new Date(now).toLocaleDateString(LOCALE)
    });
    saveData();
    $("#movDialog").close();
    toast(v.type === "pago" ? tr("Pago de {amount} registrado", { amount: money(amount) }) : tr("Fiado de {amount} registrado", { amount: money(amount) }));
    refresh();
  });
}

function openMovement(clientId = "", type = "fiado") {
  const sel = $("#mv-client");
  sel.replaceChildren(new Option(tr("Elige un cliente"), ""));
  data.clients.forEach(c => sel.add(new Option(c.name, c.id)));
  $("#movForm").reset();
  $$("#movForm .error").forEach(e => (e.textContent = ""));
  sel.value = clientId;
  $("#mv-type").value = type;
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
  $("#newMov").addEventListener("click", () => openMovement());
}

/* ========== RESUMEN ========== */
function pageDashboard() {
  $("#greet").textContent = tr("Hola, {name}", { name: session.name });
  $("#quickFiar").addEventListener("click", () => openMovement("", "fiado"));
  $("#quickPago").addEventListener("click", () => openMovement("", "pago"));

  refresh = () => {
    const set = (id, val) => animateNumber($(id), parseFloat($(id).textContent) || 0, val);
    set("#sTotal", totalDebt());
    set("#sPaid", monthSum("pago"));
    set("#sCredit", monthSum("fiado"));
    $("#sCount").textContent = data.clients.filter(c => c.debt > 0).length;

    const recent = $("#recent");
    recent.replaceChildren();
    if (!data.movements.length) recent.append(h("li", "empty", tr("Aún no hay movimientos. Registra el primero.")));
    data.movements.slice(0, 5).forEach(m => recent.append(movRow(m)));

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
      (filter === "todos" || m.type === filter) && m.client.toLowerCase().includes(q));
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
  let carouselInstance = null;
  let filter = "todos";
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
    const list = $("#clientList");
    if (carouselInstance) {
      carouselInstance.dispose();
      carouselInstance = null;
    }
    list.replaceChildren();
    indicators.replaceChildren();
    const items = data.clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q);
      const matchesFilter = filter === "todos" || (filter === "pendientes" ? c.debt > 0 : c.debt <= 0);
      return matchesSearch && matchesFilter;
    });
    $("#clientCount").textContent = tr(items.length === 1 ? "{n} cliente" : "{n} clientes", { n: items.length });
    if (!items.length) {
      const emptySlide = h("div", "carousel-item active");
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
      emptySlide.append(empty);
      list.append(emptySlide);
    }
    const cardsPerSlide = 1;
    const slides = [];
    for (let index = 0; index < items.length; index += cardsPerSlide) {
      const slide = h("div", `carousel-item${index === 0 ? " active" : ""}`);
      const group = h("div", "client-slide");
      slide.append(group);
      list.append(slide);
      slides.push(slide);
      const indicator = h("button");
      indicator.type = "button";
      indicator.setAttribute("data-bs-target", "#clientsCarousel");
      indicator.setAttribute("data-bs-slide-to", String(slides.length - 1));
      indicator.setAttribute("aria-label", tr("Ir al grupo {n}", { n: slides.length }));
      if (index === 0) {
        indicator.classList.add("active");
        indicator.setAttribute("aria-current", "true");
      }
      indicators.append(indicator);
    }
    const makeClientPreview = (client, position) => {
      const card = h("div", `client-card client-card--peek client-card--peek-${position}`);
      card.setAttribute("aria-hidden", "true");
      const visual = h("div", "client-card__visual");
      const avatar = h("div", "client-avatar");
      if (client.photo) {
        const image = new Image();
        image.src = client.photo;
        image.alt = "";
        avatar.append(image);
      } else {
        avatar.textContent = client.name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
      }
      visual.append(avatar);
      const details = h("div", "client-card__details");
      details.append(h("h3", "", client.name));
      const balance = h("div", client.debt > 0 ? "client-balance is-pending" : "client-balance is-clear");
      balance.append(h("small", "", client.debt > 0 ? tr("Saldo pendiente") : tr("Cuenta al día")));
      balance.append(h("strong", "", money(client.debt)));
      card.append(visual, details, balance);
      return card;
    };
    if (items.length > 1) {
      slides.forEach((slide, index) => {
        const group = $(".client-slide", slide);
        group.append(
          makeClientPreview(items[(index + items.length - 1) % items.length], "prev"),
          makeClientPreview(items[(index + 1) % items.length], "next")
        );
      });
    }
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
      const statusBadge = h("span", c.debt > 0 ? "client-card__status is-pending" : "client-card__status is-clear", c.debt > 0 ? tr("Pendiente") : tr("Al día"));
      visual.append(statusBadge);

      const details = h("div", "client-card__details");
      details.append(h("h3", "", c.name), h("p", "client-card__phone", c.phone || tr("Sin teléfono")));
      const balance = h("div", c.debt > 0 ? "client-balance is-pending" : "client-balance is-clear");
      balance.append(h("small", "", c.debt > 0 ? tr("Saldo pendiente") : tr("Cuenta al día")));
      balance.append(h("strong", "", money(c.debt)));
      const actions = h("div", "client-card__actions");
      const photoPicker = h("input", "visually-hidden");
      photoPicker.id = `client-photo-${c.id}`;
      photoPicker.type = "file";
      photoPicker.accept = "image/jpeg,image/png,image/webp,image/gif";
      photoPicker.addEventListener("change", async () => {
        const file = photoPicker.files[0];
        if (!file) return;
        try {
          const previousPhoto = c.photo;
          c.photo = await clientPhotoFromFile(file);
          if (!saveData()) {
            c.photo = previousPhoto;
            toast(tr("No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez."));
            return;
          }
          toast(tr("Foto del cliente actualizada"));
          refresh();
        } catch (photoError) {
          toast(photoError.message);
        } finally {
          photoPicker.value = "";
        }
      });
      const photoLabel = h("label", "btn btn--ghost btn--sm");
      photoLabel.htmlFor = photoPicker.id;
      photoLabel.append(h("i", "bi bi-camera", ""), document.createTextNode(` ${tr("Cambiar foto")}`));
      actions.append(photoPicker, photoLabel);
      const fiar = h("button", "btn btn--ghost btn--sm");
      fiar.type = "button";
      fiar.append(h("i", "bi bi-bag-plus", ""), document.createTextNode(` ${tr("Fiar")}`));
      fiar.addEventListener("click", () => openMovement(c.id, "fiado"));
      actions.append(fiar);
      if (c.debt > 0) {
        const pay = h("button", "btn btn--pay btn--sm");
        pay.type = "button";
        pay.append(h("i", "bi bi-cash-coin", ""), document.createTextNode(` ${tr("Cobrar")}`));
        pay.addEventListener("click", () => openMovement(c.id, "pago"));
        actions.append(pay);
      }
      const del = h("button", "btn btn--danger btn--sm");
      del.type = "button";
      del.setAttribute("aria-label", tr("Eliminar a {name}", { name: c.name }));
      del.append(h("i", "bi bi-trash3", ""), document.createTextNode(` ${tr("Eliminar")}`));
      del.addEventListener("click", () => {
        if (!confirm(tr("¿Eliminar a {name}? Su historial de movimientos se conserva.", { name: c.name }))) return;
        data.clients = data.clients.filter(x => x.id !== c.id);
        saveData();
        toast(tr("Cliente eliminado"));
        refresh();
      });
      actions.append(del);
      card.append(visual, details, balance, actions);
      const slideIndex = Math.floor(items.indexOf(c) / cardsPerSlide);
      $(".client-slide", slides[slideIndex]).append(card);
    });
    if (slides.length > 1) {
      carouselInstance = window.bootstrap?.Carousel.getOrCreateInstance($("#clientsCarousel"), { interval: false, touch: true, wrap: true });
    }
    $("#clientsCarousel").classList.toggle("client-carousel--single", slides.length <= 1);
  };
  search.addEventListener("input", () => {
    $("#clientList").scrollLeft = 0;
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
      <p class="form__error" id="productFormError" role="alert" hidden></p>
      <div class="app-dialog__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit">Agregar</button></div>
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
    data.products.push({ id: "p" + Date.now(), name: v.name.trim(), price: round2(Number(v.price)), photo: photoData });
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
        data.products = data.products.filter(x => x.id !== p.id);
        saveData();
        toast(tr("Producto eliminado"));
        refresh();
      });
      body.append(photoPicker, photoButton, h("h2", "product-card__name", tr(p.name)), h("p", "price product-card__price", money(p.price)), del);
      card.append(body);
      grid.append(card);
    });
    grid.classList.add("product-grid--enter");
  };
  search.addEventListener("input", refresh);
  refresh();
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
  $("#biz").value = tr(data.business);
  $("#uname").value = session.name;
  handleForm($("#settingsForm"), v => {
    data.business = v.biz.trim();
    session.name = v.name.trim();
    saveData();
    try { localStorage.setItem(SKEY, JSON.stringify(session)); } catch (e) {}
    $("#bizName").textContent = tr(data.business);
    $("#userName").textContent = session.name;
    toast(tr("Cambios guardados"));
  });
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm(tr("¿Borrar todos tus datos y volver a los de ejemplo?"))) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  });
}

/* ========== INICIO ========== */
const pages = { dashboard: pageDashboard, fiados: pageFiados, clientes: pageClientes, productos: pageProductos, reportes: pageReportes, config: pageConfig };
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