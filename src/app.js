import Chart from "chart.js/auto";
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
const conversationChartContainer = document.getElementById("conversation-chart-container");

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
  if (conversationChartContainer) {
    if (conversationChartContainer._chart) {
      conversationChartContainer._chart.destroy();
      conversationChartContainer._chart = null;
    }
    conversationChartContainer.innerHTML = "";
    conversationChartContainer.className = "conversation-chart-container conversation-chart-loading";
  }

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
    fetchAndRenderMessageChart(cid, conversationChartContainer);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderMessageChart(containerEl, counts) {
  if (!containerEl || !Array.isArray(counts)) return;
  if (containerEl._chart) {
    containerEl._chart.destroy();
    containerEl._chart = null;
  }
  containerEl.innerHTML = "";
  containerEl.classList.remove("conversation-chart-loading", "message-chart-error");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Messages per hour (24h)");
  containerEl.appendChild(canvas);
  const labels = counts.map((_, i) => `${i}h`);
  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Messages",
        data: counts,
        backgroundColor: "rgba(125, 207, 255, 0.5)",
        borderColor: "rgba(125, 207, 255, 0.8)",
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} message(s)`,
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: { display: true, text: "Hour (last 24h)", font: { size: 11 } },
          ticks: { maxRotation: 0, maxTicksLimit: 12, font: { size: 10 } },
        },
        y: {
          display: true,
          beginAtZero: true,
          title: { display: true, text: "Messages", font: { size: 11 } },
          ticks: { stepSize: 1, font: { size: 10 } },
        },
      },
    },
  });
  containerEl._chart = chart;
}

function fetchAndRenderMessageChart(conversationId, containerEl) {
  if (!containerEl) return;
  if (containerEl._chart) {
    containerEl._chart.destroy();
    containerEl._chart = null;
  }
  containerEl.innerHTML = "";
  containerEl.className = "conversation-chart-container conversation-chart-loading";
  conversationService.getMessageCountsLast24Hours(conversationId).then((counts) => {
    if (!containerEl.isConnected) return;
    renderMessageChart(containerEl, counts);
  }).catch(() => {
    if (!containerEl.isConnected) return;
    containerEl.className = "conversation-chart-container conversation-chart-error";
    containerEl.textContent = "Unable to load chart";
  });
}

if (usersList) {
  usersList.addEventListener("click", (e) => {
    const btn = e.target.closest(".open-chat-btn");
    if (!btn || !currentUser) return;
    const uid = btn.dataset.uid;
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
      alert("Error sending message: " + (err.message || err.toString()));
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
            li.className = "user-list-item";
            const nameSpan = document.createElement("span");
            nameSpan.className = "user-list-name";
            nameSpan.textContent = (u.displayName || "—") + " (" + (u.email || "") + ")";
            const chatBtn = document.createElement("button");
            chatBtn.type = "button";
            chatBtn.className = "open-chat-btn";
            chatBtn.dataset.uid = u.uid;
            chatBtn.setAttribute("aria-label", "Open chat");
            chatBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
            li.appendChild(nameSpan);
            li.appendChild(chatBtn);
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