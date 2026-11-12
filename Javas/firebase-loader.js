if (window.FIAO_FIREBASE_CONFIGURED) {
  window.FIAO_FIREBASE_READY = import("./firebase.js")
    .then(async firebase => {
      await firebase.initialize();
      window.FIAO_FIREBASE = firebase;
      return firebase;
    })
    .catch(error => {
      console.error("No se pudo iniciar Firebase.", error);
      window.FIAO_FIREBASE_ERROR = error;
      return null;
    });
} else {
  window.FIAO_FIREBASE_READY = Promise.resolve(null);
}
