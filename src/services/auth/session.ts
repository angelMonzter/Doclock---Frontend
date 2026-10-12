//code mode usuarios: persiste solo el token por pestaña; elimina la sesión dummy.
const key = 'archivo.api.session.v1';
let memoryToken: string | null = null;

export function getToken() {
  try {
    return memoryToken ?? sessionStorage.getItem(key);
  } catch {
    return memoryToken;
  }
}

export function setToken(token: string | null) {
  memoryToken = token;
  try {
    sessionStorage.removeItem('archivo.demo.session.v1');
    if (token) sessionStorage.setItem(key, token);
    else sessionStorage.removeItem(key);
  } catch {
    //code mode usuarios: permite sesión en memoria si el navegador bloquea almacenamiento.
  }
}

export const sessionExpiredEvent = 'archivo:session-expired';
