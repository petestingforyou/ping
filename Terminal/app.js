import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const postsContainer = document.getElementById("posts");
const postCount = document.getElementById("post-count");
function formatDate(value) {
  if (!value || typeof value.toDate !== "function") return "FECHA PENDIENTE";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate());
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function setStatus(target, message, error = false) {
  target.textContent = message;
  target.style.color = error ? "#94111a" : "#238343";
}
function createCommentForm(postId, list) {
  const form = el("form", "comment-form");
  const row = el("div", "form-row");
  const alias = document.createElement("input");
  alias.name = "alias"; alias.maxLength = 32; alias.required = true;
  alias.placeholder = "Tu alias o seudónimo"; alias.autocomplete = "nickname";
  const text = document.createElement("textarea");
  text.name = "texto"; text.maxLength = 2000; text.required = true;
  text.placeholder = "Escribe tu opinión (máximo 2000 caracteres)...";
  const submit = el("button", "", "PUBLICAR COMENTARIO"); submit.type = "submit";
  const status = el("p", "form-message", "");
  row.append(alias, text); form.append(row, submit, status);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const aliasValue = alias.value.trim(); const textValue = text.value.trim();
    if (!aliasValue || !textValue) return setStatus(status, "Completa el alias y el comentario.", true);
    submit.disabled = true; setStatus(status, "Enviando comentario...");
    try {
      await addDoc(collection(db, "comentarios"), {
        publicacionId: postId, alias: aliasValue, texto: textValue,
        fecha: serverTimestamp(), respuesta: "", respuestaFecha: null
      });
      form.reset(); setStatus(status, "Comentario publicado. Gracias por participar.");
      await renderComments(postId, list);
    } catch (error) {
      console.error("No se pudo publicar el comentario:", error);
      setStatus(status, "No se pudo publicar. Revisa la configuración y las reglas de Firestore.", true);
    } finally { submit.disabled = false; }
  });
  return form;
}
async function renderComments(postId, list) {
  list.replaceChildren();
  try {
    const snap = await getDocs(query(collection(db, "comentarios"), where("publicacionId", "==", postId)));
    const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    comments.sort((a, b) => (a.fecha?.toMillis?.() ?? 0) - (b.fecha?.toMillis?.() ?? 0));
    if (!comments.length) { list.append(el("p", "muted", "Aún no hay comentarios. Sé la primera persona en opinar.")); return; }
    for (const item of comments) {
      const card = el("article", "comment");
      card.append(el("div", "comment-meta", `${item.alias || "Visitante"} · ${formatDate(item.fecha)}`));
      card.append(el("p", "comment-text", item.texto || ""));
      if (item.respuesta && item.respuesta.trim()) {
        const reply = el("div", "author-reply");
        reply.append(el("strong", "", "> RESPUESTA DEL AUTOR")); reply.append(el("p", "", item.respuesta)); card.append(reply);
      }
      list.append(card);
    }
  } catch (error) {
    console.error("No se pudieron cargar comentarios:", error);
    list.append(el("p", "form-message", "No fue posible cargar los comentarios."));
  }
}
function createPostCard(post, index) {
  const card = el("article", "post-card");
  const head = el("div", "post-head");
  head.append(el("div", "post-index", `TEMA_${String(index + 1).padStart(3, "0")} // PUBLICACIÓN`));
  head.append(el("h3", "post-title", post.titulo || "Sin título"));
  head.append(el("div", "post-date", `PUBLICADO: ${formatDate(post.fecha)}`));
  const body = el("div", "post-body", post.contenido || "");
  const comments = el("section", "comments-area"); comments.append(el("h4", "comments-title", "> COMENTARIOS"));
  const list = el("div", "comments-list"); comments.append(list); comments.append(createCommentForm(post.id, list));
  card.append(head, body, comments); renderComments(post.id, list); return card;
}
async function loadPosts() {
  postsContainer.replaceChildren(el("p", "empty-state", "[ SISTEMA ] Consultando publicaciones..."));
  try {
    const snap = await getDocs(query(collection(db, "publicaciones"), orderBy("fecha", "desc")));
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    postCount.textContent = `${posts.length} ${posts.length === 1 ? "tema disponible" : "temas disponibles"}`;
    postsContainer.replaceChildren();
    if (!posts.length) { postsContainer.append(el("p", "empty-state", "[ SISTEMA ] Todavía no hay temas publicados. Vuelve pronto.")); return; }
    posts.forEach((post, index) => postsContainer.append(createPostCard(post, index)));
  } catch (error) {
    console.error("No se pudieron cargar publicaciones:", error);
    postCount.textContent = "Error de conexión";
    postsContainer.replaceChildren(el("p", "empty-state", "[ ERROR ] No se pudieron cargar temas. Revisa firebase-config.js y las reglas de Firestore."));
  }
}
loadPosts();
