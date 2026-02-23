import { authService } from "./services/authService.js";

const authView = document.getElementById("auth-view");
const chatView = document.getElementById("chat-view");
const usersList = document.getElementById("users-list");
const logoutBtn = document.getElementById("logout-btn");

if (!authView || !chatView || !usersList || !logoutBtn) {
  console.error("Missing DOM elements – check ids: auth-view, chat-view, users-list, logout-btn");
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

authService.setSessionPersistence().then(() => {
  authService.onAuthStateChanged((user) => {
    console.log("[Auth] onAuthStateChanged fired, user:", user ? user.email : null);
    try {
      if (user) {
        showChatView();
        if (unsubscribeUsers) unsubscribeUsers();
        const currentUid = user.uid;
        unsubscribeUsers = authService.subscribeToUsers((users) => {
          if (!usersList) return;
          usersList.innerHTML = "";
          const others = users.filter((u) => u.uid !== currentUid);
          others.forEach((u) => {
            const li = document.createElement("li");
            li.textContent = (u.displayName || "—") + " (" + (u.email || "") + ")";
            usersList.appendChild(li);
          });
        });
      } else {
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
  console.log("[Auth] Listener registered once (expected). You’ll see 'onAuthStateChanged fired' on load and on every login/logout.");
});