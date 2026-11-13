import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

let auth;
let persistenceReady;

export async function initialize() {
  if (auth) return persistenceReady;
  const app = initializeApp(window.FIAO_FIREBASE_CONFIG);
  auth = getAuth(app);
  persistenceReady = setPersistence(auth, browserLocalPersistence);
  await persistenceReady;
}

export async function registerAccount({ name, email, password }) {
  await persistenceReady;
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  return credential.user;
}

export async function signInAccount(email, password) {
  await persistenceReady;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function updateAccountProfile(name) {
  await persistenceReady;
  if (!auth.currentUser) throw new Error("No hay una cuenta activa para actualizar.");
  await updateProfile(auth.currentUser, { displayName: name });
  return auth.currentUser;
}

export async function currentUser() {
  await persistenceReady;
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    }, error => {
      unsubscribe();
      reject(error);
    });
  });
}

export async function signOutAccount() {
  await persistenceReady;
  await signOut(auth);
}

export function errorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Inicia sesión.",
    "auth/invalid-email": "Escribe un correo válido.",
    "auth/invalid-credential": "El correo o la contraseña no coinciden.",
    "auth/user-disabled": "Esta cuenta está desactivada. Contacta al administrador.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Hubo demasiados intentos. Espera un momento e inténtalo otra vez.",
    "auth/network-request-failed": "No se pudo conectar. Revisa tu conexión a internet.",
    "auth/operation-not-allowed": "Activa el acceso con correo y contraseña en Firebase Authentication.",
    "auth/unauthorized-domain": "Agrega este dominio a los dominios autorizados de Firebase Authentication."
  };
  return messages[error.code] || "No se pudo completar el acceso con Firebase. Revisa la configuración e inténtalo otra vez.";
}
