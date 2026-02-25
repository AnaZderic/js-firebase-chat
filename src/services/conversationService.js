import { db } from "../core/firebase.js";
import { ref, set, push, onValue, query, orderByChild, startAt, get } from "firebase/database";

export function getConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

export const conversationService = {
  async ensureConversation(conversationId, uid1, uid2) {
    const participantsRef = ref(db, `conversations/${conversationId}/participants`);
    await set(participantsRef, { [uid1]: true, [uid2]: true });
  },

  subscribeToMessages(conversationId, callback) {
    const messagesRef = ref(db, `conversations/${conversationId}/messages`);
    return onValue(
      messagesRef,
      (snapshot) => {
        const data = snapshot.val();
        const list = data
          ? Object.entries(data).map(([id, m]) => ({ id, ...m }))
          : [];
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        callback(list);
      },
      (error) => {
        console.error("Error loading messages:", error.message);
        callback([]);
      }
    );
  },

  async sendMessage(conversationId, text, senderId) {
    if (!text.trim()) return;
    const messagesRef = ref(db, `conversations/${conversationId}/messages`);
    const newRef = push(messagesRef);
    await set(newRef, {
      senderId,
      text: text.trim(),
      createdAt: Date.now(),
    });
  },

  async getMessageCountsLast24Hours(conversationId) {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const messagesRef = ref(db, `conversations/${conversationId}/messages`);
    const q = query(
      messagesRef,
      orderByChild("createdAt"),
      startAt(cutoff)
    );
    const snapshot = await get(q);
    const buckets = new Array(24).fill(0);
    const hourMs = 60 * 60 * 1000;
    snapshot.forEach((child) => {
      const t = child.val().createdAt;
      if (t == null) return;
      const elapsed = t - cutoff;
      const hourIndex = Math.min(23, Math.floor(elapsed / hourMs));
      if (hourIndex >= 0) buckets[hourIndex]++;
    });
    return buckets;
  },
};