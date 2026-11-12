window.FIAO_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAkEviovAckYzqBd1pYDiIBHllOxWuG0CE",
  authDomain: "fia-o-b0036.firebaseapp.com",
  projectId: "fia-o-b0036",
  appId: "1:709509668865:web:a6b04620e694ce82902000"
};

window.FIAO_FIREBASE_CONFIGURED = Object.values(window.FIAO_FIREBASE_CONFIG)
  .every(value => value && !value.startsWith("PEGA_AQUI_"));

if (location.protocol === "file:") {
  const showLocalServerNotice = () => {
    const notice = document.createElement("div");
    notice.setAttribute("role", "alert");
    notice.textContent = "Estás abriendo FIA'O como archivo. Para compartir tus datos entre páginas y usar Firebase, abre Abrir-FIAO.bat desde la carpeta del proyecto.";
    notice.style.cssText = "padding:.75rem 1rem;background:#FEF3C7;border-bottom:2px solid #FFBF32;color:#482D1F;text-align:center;font:500 14px/1.5 'DM Sans',sans-serif";
    document.body.insertBefore(notice, document.body.firstChild);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showLocalServerNotice, { once: true });
  } else {
    showLocalServerNotice();
  }
}
