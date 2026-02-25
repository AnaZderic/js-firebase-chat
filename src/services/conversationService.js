import { db } from "../core/firebase.js";
import { ref, set, push, onValue, serverTimestamp } from "firebase/database";

export function getConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

const HOUR_MS = 60 * 60 * 1000;

export function getMessageCountsFromMessages(messages) {
  const now = Date.now();
  const base = new Date(now);
  base.setMinutes(0, 0, 0);
  base.setSeconds(0, 0);
  base.setMilliseconds(0);
  const baseMs = base.getTime();
  const windowEnd = baseMs + HOUR_MS;
  const windowStart = windowEnd - 24 * HOUR_MS;

  const bucketStarts = Array.from({ length: 24 }, (_, i) => windowStart + i * HOUR_MS);
  const bucketEnds = bucketStarts.map((start) => start + HOUR_MS);

  const counts = new Array(24).fill(0);
  (messages || []).forEach((msg) => {
    const t = msg.createdAt;
    if (t == null || t < windowStart || t >= windowEnd) return;
    for (let i = 0; i < 24; i++) {
      if (t >= bucketStarts[i] && t < bucketEnds[i]) {
        counts[i]++;
        break;
      }
    }
  });

  const labels = bucketStarts.map((ms) => String(new Date(ms).getHours()));
  return { counts, labels };
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
      createdAt: serverTimestamp(),
    });
  },

};