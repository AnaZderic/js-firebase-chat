import { authService } from "./services/authService.js";
import {
  conversationService,
  getConversationId,
} from "./services/conversationService.js";

const authView = document.getElementById("auth-view");
const chatView = document.getElementById("chat-view");
const usersList = document.getElementById("users-list");
const logoutBtn = document.getElementById("logout-btn");
const conversationPlaceholder = document.getElementById("conversation-placeholder");
const conversationPanel = document.getElementById("conversation-panel");
const conversationTitle = document.getElementById("conversation-title");
const messagesList = document.getElementById("messages-list");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");

if (!authView || !chatView || !usersList || !logoutBtn) {
  console.error("Missing DOM elements – check ids.");
}

function showAuthView() {
  if (authView) authView.classList.remove("hidden");
  if (chatView) chatView.classList.add("hidden");
}
function showChatView() {
  if (authView) authView.classList.add("hidden");
  if (chatView) chatView.classList.remove("hidden");
}
showAuthView();

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const isLogin = tab.dataset.tab === "login";
    document.querySelector(".auth-tab.active").classList.remove("active");
    tab.classList.add("active");
    if (isLogin) {
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    } else {
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
    }
  });
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const displayName = document.getElementById("register-displayName").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  try {
    await authService.signUp(email, password, displayName);
    alert("Registration successful!");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    await authService.signIn(email, password);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

logoutBtn.addEventListener("click", () => {
  authService.signOut();
});

let unsubscribeUsers = null;
let unsubscribeMessages = null;
let currentUser = null;
let selectedUser = null;
let currentOthers = [];

function openConversation(otherUser) {
  selectedUser = otherUser;
  if (!currentUser) return;
  const cid = getConversationId(currentUser.uid, otherUser.uid);
  if (conversationPlaceholder) conversationPlaceholder.classList.add("hidden");
  if (conversationPanel) conversationPanel.classList.remove("hidden");
  if (conversationTitle) conversationTitle.textContent = otherUser.displayName || otherUser.email || "User";

  if (unsubscribeMessages) unsubscribeMessages();
  conversationService.ensureConversation(cid, currentUser.uid, otherUser.uid).then(() => {
    unsubscribeMessages = conversationService.subscribeToMessages(cid, (messages) => {
      if (!messagesList) return;
      messagesList.innerHTML = "";
      messages.forEach((msg) => {
        const li = document.createElement("li");
        const isMe = msg.senderId === currentUser.uid;
        li.className = "message-item " + (isMe ? "message-mine" : "message-theirs");
        const name = isMe ? "You" : (selectedUser.displayName || selectedUser.email || "—");
        const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
        li.innerHTML = `<span class="message-sender">${escapeHtml(name)}</span> <span class="message-time">${escapeHtml(time)}</span><br/><span class="message-text">${escapeHtml(msg.text || "")}</span>`;
        messagesList.appendChild(li);
      });
      messagesList.scrollTop = messagesList.scrollHeight;
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

if (usersList) {
  usersList.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-uid]");
    if (!li || !currentUser) return;
    const uid = li.dataset.uid;
    const other = currentOthers.find((u) => u.uid === uid);
    if (other) openConversation(other);
  });
}

if (messageForm && messageInput) {
  messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !currentUser || !selectedUser) return;
    const cid = getConversationId(currentUser.uid, selectedUser.uid);
    try {
      await conversationService.sendMessage(cid, text, currentUser.uid);
      messageInput.value = "";
    } catch (err) {
      console.error(err);
      alert("Error sending message: " + (err.message || err));
    }
  });
}

authService.setSessionPersistence().then(() => {
  authService.onAuthStateChanged((user) => {
    try {
      if (user) {
        currentUser = {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
        };
        showChatView();
        if (unsubscribeMessages) {
          unsubscribeMessages();
          unsubscribeMessages = null;
        }
        selectedUser = null;
        if (conversationPanel) conversationPanel.classList.add("hidden");
        if (conversationPlaceholder) conversationPlaceholder.classList.remove("hidden");

        if (unsubscribeUsers) unsubscribeUsers();
        unsubscribeUsers = authService.subscribeToUsers((users) => {
          if (!usersList) return;
          const others = users.filter((u) => u.uid !== currentUser.uid);
          currentOthers = others;
          usersList.innerHTML = "";
          others.forEach((u) => {
            const li = document.createElement("li");
            li.dataset.uid = u.uid;
            li.textContent = (u.displayName || "—") + " (" + (u.email || "") + ")";
            usersList.appendChild(li);
          });
        });
      } else {
        currentUser = null;
        selectedUser = null;
        currentOthers = [];
        if (unsubscribeMessages) {
          unsubscribeMessages();
          unsubscribeMessages = null;
        }
        if (unsubscribeUsers) {
          unsubscribeUsers();
          unsubscribeUsers = null;
        }
        showAuthView();
      }
    } catch (err) {
      console.error("[Auth] Error in onAuthStateChanged:", err);
    }
  });
});