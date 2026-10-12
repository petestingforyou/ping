/* ARCHIVO: admin.js
 * Acceso visual mediante hash consultado en Firestore.
 * ADVERTENCIA: esto NO crea una autorización segura en las reglas de Firestore.
 */
import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, query, orderBy, where,
  doc, getDoc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const loginPanel = document.getElementById("login-panel");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const adminContent = document.getElementById("admin-content");
const postsContainer = document.getElementById("admin-posts");
const postForm = document.getElementById("post-form");
const postMessage = document.getElementById("post-message");
let authorizedInThisTab = false;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function status(target, message, error = false) {
  target.textContent = message;
  target.style.color = error ? "#94111a" : "#238343";
}
function formatDate(value) {
  if (!value) return "FECHA PENDIENTE";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "FECHA PENDIENTE";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
async function hashPassword(password, saltHex, iterations) {
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(x => parseInt(x, 16)));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, material, 256);
  return bytesToHex(derived);
}
function requireAccess() {
  if (!authorizedInThisTab) throw new Error("La sesión local está cerrada. Introduce la contraseña.");
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.getElementById("login-button");
  const password = document.getElementById("password").value;
  button.disabled = true;
  status(loginMessage, "Consultando la clave guardada en Firestore...");
  try {
    const snap = await getDoc(doc(db, "configuracion", "admin"));
    if (!snap.exists()) throw new Error("No existe configuracion/admin. Sigue los pasos de LEEME.txt para generar y guardar el hash.");
    const data = snap.data();
    if (!data.sal || !data.hash || !Number.isInteger(data.iteraciones)) throw new Error("El documento configuracion/admin no tiene los campos sal, hash e iteraciones correctamente configurados.");
    const enteredHash = await hashPassword(password, data.sal, data.iteraciones);
    if (enteredHash !== data.hash) throw new Error("Contraseña incorrecta.");
    authorizedInThisTab = true;
    document.getElementById("password").value = "";
    loginPanel.classList.add("hidden");
    adminContent.classList.remove("hidden");
    status(loginMessage, "Acceso concedido.");
    await loadAdminPosts();
  } catch (error) {
    console.error("Error de acceso:", error);
    status(loginMessage, error.message || "No se pudo verificar la contraseña.", true);
  } finally { button.disabled = false; }
});

document.getElementById("logout-button").addEventListener("click", () => {
  authorizedInThisTab = false;
  adminContent.classList.add("hidden");
  loginPanel.classList.remove("hidden");
  status(loginMessage, "Sesión local cerrada.");
});

postForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.getElementById("publish-button");
  const titulo = document.getElementById("post-title").value.trim();
  const contenido = document.getElementById("post-body").value.trim();
  if (!titulo || !contenido) { status(postMessage, "Escribe un título y el contenido.", true); return; }
  button.disabled = true; status(postMessage, "Publicando tema...");
  try {
    requireAccess();
    await addDoc(collection(db, "publicaciones"), { titulo, contenido, fecha: serverTimestamp() });
    postForm.reset(); status(postMessage, "Tema publicado correctamente."); await loadAdminPosts();
  } catch (error) { console.error(error); status(postMessage, error.message || "No se pudo publicar el tema.", true); }
  finally { button.disabled = false; }
});

async function loadAdminPosts() {
  requireAccess();
  postsContainer.replaceChildren(el("p", "muted", "Consultando publicaciones y comentarios..."));
  try {
    const [postSnap, commentSnap] = await Promise.all([
      getDocs(query(collection(db, "publicaciones"), orderBy("fecha", "desc"))),
      getDocs(collection(db, "comentarios"))
    ]);
    const posts = postSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const comments = commentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    postsContainer.replaceChildren();
    if (!posts.length) { postsContainer.append(el("p", "muted", "Todavía no has publicado temas.")); return; }
    for (const post of posts) {
      const block = el("article", "admin-post");
      block.append(el("h3", "", post.titulo || "Sin título"), el("div", "muted", `Publicado: ${formatDate(post.fecha)}`), el("p", "", post.contenido || ""));
      const del = el("button", "button-secondary", "ELIMINAR TEMA"); del.type = "button";
      del.addEventListener("click", async () => {
        if (!confirm("¿Eliminar este tema y todos sus comentarios? Esta acción no se puede deshacer.")) return;
        del.disabled = true;
        try {
          requireAccess();
          const relatedSnap = await getDocs(query(collection(db, "comentarios"), where("publicacionId", "==", post.id)));
          for (const commentDoc of relatedSnap.docs) await deleteDoc(commentDoc.ref);
          await deleteDoc(doc(db, "publicaciones", post.id));
          await loadAdminPosts();
        } catch (error) { console.error(error); status(postMessage, error.message || "No se pudo eliminar el tema.", true); del.disabled = false; }
      });
      block.append(del);
      const related = comments.filter(c => c.publicacionId === post.id).sort((a, b) => {
        const av = a.fecha?.toMillis?.() ?? 0; const bv = b.fecha?.toMillis?.() ?? 0; return av - bv;
      });
      block.append(el("h4", "comments-title", `> OPINIONES (${related.length})`));
      if (!related.length) block.append(el("p", "muted", "Este tema aún no tiene comentarios."));
      for (const comment of related) {
        const c = el("div", "admin-comment");
        c.append(el("div", "comment-meta", `${comment.alias || "Visitante"} · ${formatDate(comment.fecha)}`), el("p", "comment-text", comment.texto || ""));
        const form = el("form", "stack-form"), label = el("label", "", "Respuesta del autor"), reply = document.createElement("textarea");
        reply.maxLength = 2000; reply.required = true; reply.placeholder = "Escribe tu respuesta..."; reply.value = comment.respuesta || ""; label.append(reply);
        const save = el("button", "", comment.respuesta ? "ACTUALIZAR RESPUESTA" : "RESPONDER"); save.type = "submit"; form.append(label, save);
        form.addEventListener("submit", async event => {
          event.preventDefault(); const respuesta = reply.value.trim(); if (!respuesta) return;
          save.disabled = true;
          try {
            requireAccess();
            await updateDoc(doc(db, "comentarios", comment.id), { respuesta, respuestaFecha: serverTimestamp() });
            await loadAdminPosts();
          } catch (error) { console.error(error); status(postMessage, error.message || "No se pudo guardar la respuesta.", true); save.disabled = false; }
        });
        c.append(form); block.append(c);
      }
      postsContainer.append(block);
    }
  } catch (error) {
    console.error("Error cargando panel:", error);
    postsContainer.replaceChildren(el("p", "form-message", error.message || "No se pudo cargar el panel."));
  }
}
