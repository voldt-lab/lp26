import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7l1D_6-bupEzU20uJRE2OOREqs0UBHf0",
  authDomain: "voldt-fb.firebaseapp.com",
  projectId: "voldt-fb",
  storageBucket: "voldt-fb.firebasestorage.app",
  messagingSenderId: "903604332756",
  appId: "1:903604332756:web:4659bee01e72e7e41f3341",
  measurementId: "G-RXJGX0M7CT"
};

const app = initializeApp(firebaseConfig);
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Lc6Pz4rAAAAADVQu-X0eNcV8ioy1o1olVuU-3hi'),
  isTokenAutoRefreshEnabled: true
});
const db = getDatabase(app);

// Same-origin navigation sends the full previous URL, query string included.
// review.html carries the Stripe payment reference as ?payment=pi_... — strip
// the query and hash so order identifiers never reach the visit log.
function getCleanReferrer() {
  if (!document.referrer) return null;
  try {
    const u = new URL(document.referrer);
    return u.origin + u.pathname;
  } catch {
    return null;
  }
}

function getOrCreateSessionId() {
  let id = sessionStorage.getItem('voldtSessionId');
  if (!id) {
    const buf = new Uint8Array(8);
    crypto.getRandomValues(buf);
    id = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('voldtSessionId', id);
    sessionStorage.setItem('voldtSessionStart', String(Date.now()));
  }
  return id;
}

(async () => {
  try {
    const sessionId = getOrCreateSessionId();
    const lastLog = Number(sessionStorage.getItem('voldtPvLast') || 0);
    if (Date.now() - lastLog < 60_000) return;

    const visitData = {
      sessionId,
      sessionStart: Number(sessionStorage.getItem('voldtSessionStart')) || Date.now(),
      page: window.location.pathname || '/',
      referrer: getCleanReferrer(),
      userAgent: navigator.userAgent,
      timeStamp: Date.now(),
      lang: navigator.language || null,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || null
    };
    await push(ref(db, 'visits'), visitData);
    sessionStorage.setItem('voldtPvLast', String(Date.now()));
  } catch (err) {
    console.warn('Visit logging failed:', err);
  }
})();
