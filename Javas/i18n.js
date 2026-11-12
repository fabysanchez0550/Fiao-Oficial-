/* ========== IDIOMAS: ESPAÑOL / ENGLISH ==========
   El sitio está escrito en español. Para el inglés, este archivo tiene una lista
   "texto en español" : "texto en inglés". Si agregas un texto nuevo al sitio,
   agrégalo aquí y se traducirá solo. Para otro idioma, copia la lista y cámbiala. */

const LANG_KEY = "fiao-lang";
let LANG = "es";
try { if (localStorage.getItem(LANG_KEY) === "en") LANG = "en"; } catch (e) {}
const LOCALE = LANG === "en" ? "en-US" : "es-PA";

const EN = {
  /* --- Menú y estructura --- */
  "Inicio": "Home", "Fiados": "Credit", "Clientes": "Clients", "Productos": "Products",
  "Reportes": "Reports", "Contacto": "Contact", "Resumen": "Overview", "Configuración": "Settings",
  "Iniciar sesión": "Log in", "Inicia sesión": "Log in", "Crear cuenta": "Create account",
  "Cerrar sesión": "Log out", "Abrir menú": "Open menu", "Cerrar menú": "Close menu", "Cerrar": "Close",
  "Ir a mi panel": "Go to my dashboard", "Principal": "Main", "Panel": "Dashboard", "Legal": "Legal",
  "Privacidad": "Privacy", "Términos": "Terms", "Accesibilidad": "Accessibility",
  "Panel FIA'O": "FIA'O Dashboard",
  "© 2026 FIA'O. Hecho para los negocios de Panamá.": "© 2026 FIA'O. Made for businesses in Panama.",

  /* --- Inicio --- */
  "Tu libreta de crédito,": "Your credit notebook,", "ahora digital.": "now digital.",
  "Tu libreta de crédito, ahora digital": "Your credit notebook, now digital",
  "FIA'O digitaliza la gestión de clientes, deudas y pagos para tiendas de barrio y pequeños negocios de Panamá, reemplazando el cuaderno de papel por un sistema moderno.": "FIA'O digitizes client, debt and payment management for neighborhood shops and small businesses in Panama, replacing the paper notebook with a modern system.",
  "FIA'O digitaliza clientes, deudas y pagos para tiendas y negocios pequeños de Panamá.": "FIA'O digitizes clients, debts and payments for small shops and businesses in Panama.",
  "App FIA'O en un celular mostrando la libreta de clientes": "FIA'O app on a phone showing the client ledger",
  "Demostración de la libreta": "Ledger demo", "Cliente desde marzo": "Client since March",
  "Con saldo": "Balance due", "Al día": "Up to date", "Debe": "Owes", "Debe {amount}": "Owes {amount}",
  "Registrar pago B/. 10": "Record payment B/. 10", "Fiar B/. 5": "Give credit B/. 5",
  "Pago registrado": "Payment recorded", "Producto fiado": "Item on credit",
  "Pan y leche": "Bread and milk", "Pago en efectivo": "Cash payment",
  "El cuaderno de papel te hace perder tiempo y dinero": "The paper notebook costs you time and money",
  "Páginas que se pierden": "Pages that get lost",
  "Un cuaderno mojado o extraviado puede borrar meses de cuentas.": "A soaked or lost notebook can erase months of accounts.",
  "Sumas hechas a mano": "Hand-made sums",
  "Un error pequeño termina en discusiones con tus clientes.": "A small mistake ends in arguments with your clients.",
  "No sabes quién debe más": "You don't know who owes the most",
  "Sin un resumen claro es difícil decidir a quién cobrar primero.": "Without a clear summary it's hard to decide who to collect from first.",
  "Todo lo que tu libreta hacía, pero ordenado": "Everything your notebook did, but organized",
  "Registra lo que cada cliente se lleva y lo que paga.": "Record what each client takes and what they pay.",
  "Cada cliente con su teléfono y su saldo.": "Each client with their phone number and balance.",
  "Tu lista de productos con precios a la mano.": "Your product list with prices at hand.",
  "Sabe cuánto te deben y quién debe más.": "Know how much you are owed and who owes the most.",
  "Ver fiados": "View credit", "Ver clientes": "View clients", "Ver productos": "View products", "Ver reportes": "View reports", "Ver todos": "View all",
  "Empieza en tres pasos": "Get started in three steps",
  "Crea tu cuenta": "Create your account", "Solo necesitas tu correo.": "You only need your email.",
  "Agrega a tus clientes": "Add your clients", "Pasa los nombres de tu cuaderno a FIA'O.": "Move the names from your notebook into FIA'O.",
  "Registra fiados y pagos": "Record credit and payments", "El saldo se calcula solo.": "The balance is calculated automatically.",
  "Preguntas frecuentes": "Frequently asked questions",
  "¿Necesito saber de tecnología?": "Do I need to know about technology?",
  "No. Si sabes anotar en un cuaderno, sabes usar FIA'O.": "No. If you can write in a notebook, you can use FIA'O.",
  "¿Sirve para cualquier negocio pequeño?": "Does it work for any small business?",
  "Fue pensada para tiendas y negocios de barrio que fían a sus clientes.": "It was designed for neighborhood shops and businesses that give credit to their customers.",
  "¿Dónde puedo usarla?": "Where can I use it?",
  "Desde la app y desde el navegador de tu celular o computadora.": "From the app and from your phone or computer browser.",
  "Deja el cuaderno de papel": "Ditch the paper notebook",
  "Crea tu cuenta y registra tu primer fiado hoy.": "Create your account and record your first credit sale today.",
  "Crear cuenta gratis": "Create free account", "Descargar la app": "Download the app",

  /* --- Contacto, login y registro --- */
  "Hablemos de tu negocio": "Let's talk about your business",
  "Cuéntanos cómo llevas hoy tus cuentas y te ayudamos a empezar.": "Tell us how you keep your accounts today and we'll help you get started.",
  "Escríbenos para empezar con FIA'O.": "Write to us to get started with FIA'O.",
  "Nombre": "Name", "Correo": "Email", "Mensaje": "Message", "Contraseña": "Password",
  "Repite la contraseña": "Repeat the password", "Enviar mensaje": "Send message",
  "Mensaje enviado. Te responderemos pronto.": "Message sent. We'll get back to you soon.",
  "Entrar": "Log in", "¿No tienes cuenta?": "Don't have an account?", "Crea una": "Create one",
  "¿Ya tienes cuenta?": "Already have an account?",
  "Listo. Entrando a tu panel...": "Done. Taking you to your dashboard...",
  "Cuenta creada. Entrando a tu panel...": "Account created. Taking you to your dashboard...",
  "Entra a tu cuenta de FIA'O.": "Log in to your FIA'O account.", "Crea tu cuenta de FIA'O.": "Create your FIA'O account.",

  /* --- Páginas del sitio y del panel --- */
  "Anota lo que se lleva cada cliente y los pagos que hace. El saldo se actualiza solo.": "Record what each client takes and the payments they make. The balance updates itself.",
  "Registra fiados y pagos de tus clientes.": "Record your clients' credit and payments.",
  "Nuevo movimiento": "New transaction", "+ Nuevo movimiento": "+ New transaction",
  "Cliente": "Client", "Tipo": "Type", "Monto (B/.)": "Amount (B/.)", "Nota (opcional)": "Note (optional)",
  "Fiado (el cliente se lleva algo)": "Credit (the client takes something)",
  "Pago (el cliente abona)": "Payment (the client pays)",
  "Fiado (se lleva algo)": "Credit (takes something)", "Pago (abona)": "Payment (pays)",
  "Guardar movimiento": "Save transaction", "Movimiento guardado.": "Transaction saved.",
  "Ej. Pan y leche": "E.g. Bread and milk", "Ej. leche": "E.g. milk",
  "Total pendiente de cobro": "Total outstanding to collect", "Total pendiente": "Total outstanding",
  "Todos tus clientes con su teléfono y lo que deben. Busca por nombre o agrega uno nuevo.": "All your clients with their phone and what they owe. Search by name or add a new one.",
  "Lista y busca a los clientes de tu negocio.": "List and search your business clients.",
  "Agregar cliente": "Add client", "+ Agregar cliente": "+ Add client", "Buscar cliente": "Search client",
  "Tu gente de confianza": "Your trusted customers", "{n} cliente": "{n} client", "{n} clientes": "{n} clients",
  "Clientes anteriores": "Previous clients", "Siguientes clientes": "Next clients", "Desliza para ver las fichas": "Swipe to browse client cards",
  "Buscar por nombre o teléfono": "Search by name or phone", "Todos": "All",
  "Agrega una foto": "Add a photo", "Así será más fácil reconocer a la persona. Opcional.": "This makes the person easier to recognize. Optional.",
  "Vista previa de la foto del cliente": "Client photo preview", "Elige una imagen JPG, PNG, WEBP o GIF.": "Choose a JPG, PNG, WEBP, or GIF image.",
  "La imagen debe pesar menos de 5 MB.": "The image must be smaller than 5 MB.", "No se pudo leer la imagen. Prueba con otra.": "Couldn't read the image. Try another one.",
  "No se pudo procesar la imagen. Prueba con otra.": "Couldn't process the image. Try another one.",
  "Cambiar foto": "Change photo", "Foto del cliente actualizada": "Client photo updated",
  "No se pudo guardar. Libera espacio en el navegador e inténtalo otra vez.": "Couldn't save. Free up browser storage and try again.",
  "No encontramos clientes con esa búsqueda.": "No clients match that search.", "Prueba con otro nombre o teléfono.": "Try another name or phone number.",
  "No hay clientes para este filtro.": "No clients match this filter.", "Prueba cambiando el filtro.": "Try changing the filter.",
  "Todavía no tienes clientes.": "You don't have any clients yet.", "Agrega a tu primer cliente para empezar a registrar sus fiados.": "Add your first client to start recording credit.",
  "Saldo pendiente": "Outstanding balance", "Cuenta al día": "Up to date", "Foto de {name}": "Photo of {name}",
  "Buscar por cliente": "Search by client", "Cliente agregado.": "Client added.", "Cliente agregado": "Client added",
  "Teléfono (opcional)": "Phone (optional)", "Escribe un nombre": "Enter a name",
  "Tu lista de productos con precios. Estos son ejemplos; luego puedes cambiarlos por los tuyos.": "Your product list with prices. These are examples; you can replace them with your own later.",
  "Lista de productos y precios.": "Product and price list.", "Buscar producto": "Search product",
  "+ Agregar producto": "+ Add product", "Agregar producto": "Add product", "Agregar": "Add",
  "Precio (B/.)": "Price (B/.)", "Producto agregado": "Product added", "Producto eliminado": "Product deleted",
  "Mira cuánto te deben en total y quién tiene más saldo, para cobrar con orden.": "See how much you are owed in total and who has the largest balance, so you can collect in an orderly way.",
  "Resumen de lo que te deben tus clientes.": "Summary of what your clients owe you.",
  "Quien debe más": "Who owes the most", "Quién debe más": "Who owes the most",
  "Saldo por cliente": "Balance by client", "Fiado y pagos de este mes": "Credit and payments this month",
  "Restablecer datos de ejemplo": "Reset sample data", "Descargar lista de clientes (CSV)": "Download client list (CSV)",
  "Reporte descargado": "Report downloaded",
  "Hola": "Hello", "Hola, {name}": "Hello, {name}", "Así va tu negocio hoy.": "Here's how your business is doing today.",
  "Fiar": "Give credit", "Registrar pago": "Record payment", "Cobrar": "Collect", "Eliminar": "Delete",
  "Clientes con saldo": "Clients with a balance", "Cobrado este mes": "Collected this month",
  "Fiado este mes": "Credit given this month", "Movimientos recientes": "Recent transactions",
  "Todos": "All", "Pagos": "Payments", "Pago": "Payment", "Fiado": "Credit", "Filtrar movimientos": "Filter transactions",
  "{n} movimiento": "{n} transaction", "{n} movimientos": "{n} transactions",
  "Tu negocio": "Your business", "Nombre del negocio": "Business name", "Tu nombre": "Your name",
  "Guardar cambios": "Save changes", "Cambios guardados": "Changes saved", "Guardar": "Save", "Cancelar": "Cancel",
  "Datos": "Data", "Borrar mis datos": "Delete my data", "Mi negocio": "My business",
  "Tus datos se guardan solo en este navegador. Si los borras, vuelves a los datos de ejemplo.": "Your data is saved only in this browser. If you delete it, you go back to the sample data.",
  "¿Borrar todos tus datos y volver a los de ejemplo?": "Delete all your data and go back to the sample data?",
  "¿Eliminar a {name}? Su historial de movimientos se conserva.": "Delete {name}? Their transaction history is kept.",
  "Cliente eliminado": "Client deleted",
  "Pago de {amount} registrado": "Payment of {amount} recorded", "Fiado de {amount} registrado": "Credit of {amount} recorded",

  /* --- Mensajes y avisos --- */
  "Escribe un nombre válido.": "Enter a valid name.",
  "Escribe un correo válido, por ejemplo nombre@correo.com.": "Enter a valid email, for example name@email.com.",
  "Cuéntanos un poco más (mínimo 10 caracteres).": "Tell us a bit more (at least 10 characters).",
  "La contraseña debe tener al menos 6 caracteres.": "The password must be at least 6 characters.",
  "Las contraseñas no coinciden.": "The passwords don't match.",
  "Escribe un monto mayor a 0.": "Enter an amount greater than 0.", "Escribe un precio mayor a 0.": "Enter a price greater than 0.",
  "Escribe un teléfono válido.": "Enter a valid phone number.", "Escribe el nombre de tu negocio.": "Enter your business name.",
  "Elige un cliente.": "Choose a client.", "Elige un cliente": "Choose a client",
  "Este cliente no tiene saldo pendiente.": "This client has no outstanding balance.",
  "Aún no hay movimientos. Registra el primero.": "No transactions yet. Record the first one.",
  "No hay movimientos con ese filtro.": "No transactions match this filter.",
  "No encontramos clientes con ese nombre.": "We couldn't find clients with that name.",
  "No encontramos ese producto.": "We couldn't find that product.",
  "Nadie": "Nobody", "Nadie tiene saldo pendiente.": "Nobody has an outstanding balance.",
  "Nada que mostrar todavía.": "Nothing to show yet.", "Sin teléfono": "No phone", "Teléfono": "Phone", "Saldo (B/.)": "Balance (B/.)",

  /* --- Datos de ejemplo --- */
  "Víveres": "Groceries", "Compra de la semana": "Weekly shopping",
  "Pan": "Bread", "Leche": "Milk", "Arroz (1 lb)": "Rice (1 lb)", "Aceite": "Oil",
  "Huevos (docena)": "Eggs (dozen)", "Refresco": "Soda", "Café": "Coffee", "Azúcar (1 lb)": "Sugar (1 lb)"
};

/* Devuelve el texto en el idioma elegido. {x} se reemplaza con los valores de "vars". */
function tr(text, vars) {
  let s = (LANG === "en" && EN[text] !== undefined) ? EN[text] : text;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}
const fmtDate = ts => new Date(ts).toLocaleDateString(LOCALE);

/* Traduce los textos que ya están en la página */
function translateTree(root) {
  if (LANG !== "en") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const p = walker.currentNode.parentElement;
    if (p && !/^(SCRIPT|STYLE)$/.test(p.tagName)) nodes.push(walker.currentNode);
  }
  nodes.forEach(n => {
    const clean = n.nodeValue.replace(/\s+/g, " ").trim();
    if (clean && EN[clean] !== undefined) n.nodeValue = n.nodeValue.replace(/\S[\s\S]*\S|\S/, EN[clean]);
  });
  root.querySelectorAll("[placeholder],[aria-label],[alt],[title]").forEach(el => {
    ["placeholder", "aria-label", "alt", "title"].forEach(a => {
      const v = el.getAttribute(a);
      if (v && EN[v] !== undefined) el.setAttribute(a, EN[v]);
    });
  });
}

/* Botón para cambiar de idioma */
function langButton() {
  const next = LANG === "en" ? "es" : "en";
  const b = document.createElement("button");
  b.type = "button";
  b.className = "lang-btn";
  b.setAttribute("aria-label", LANG === "en" ? "Cambiar a español" : "Switch to English");
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>';
  b.append(LANG.toUpperCase());
  b.addEventListener("click", () => {
    try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
    location.reload();
  });
  return b;
}

/* Se llama una vez, al final de script.js y de app.js */
function applyLang() {
  document.documentElement.lang = LANG;
  if (LANG === "en") {
    document.title = document.title.split(" | ").map(p => tr(p)).join(" | ");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = tr(meta.content);
    translateTree(document.body);
  }
  const topbar = document.querySelector(".topbar");
  if (topbar) topbar.insertBefore(langButton(), document.getElementById("newMov"));
  else { const nav = document.getElementById("nav"); if (nav) nav.append(langButton()); }
}