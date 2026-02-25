# JS + Firebase Chat App (WIP)

Simple real-time chat application built with:

- JavaScript
- Firebase Authentication (Email/Password)
- Firebase Realtime Database (RTDB)
- Webpack

---

## ✅ Current Features

### 🔐 Authentication
- User registration (email & password)
- User login
- Logout functionality
- Auth State persistence

### 👥 Users
- Users are stored in Realtime Database after registration
- Real-time users list
- Only authenticated users can read users list
- Users can modify only their own profile (via RTDB rules)
- 💬 Messages icon per user to directly open private conversation

### 💬 Private 1-to-1 Conversations
- Users can select another registered user to start a private chat
- Deterministic chat ID generation (same two users always share the same chat)
- Chat is automatically created if it does not exist

### ⚡ Real-Time Messaging
- Messages are sent and received instantly (no page reload)
- Real-time updates using Firebase RTDB listeners
- Message history persists in database
- Messages use server timestamps
- UI message alignment: 
    Right side → your messages
    Left side → messages from the other user

### 📊 Messages Activity Chart
- Chart displayed above the chat window
- Shows number of messages per hour
- Displays activity for the last 24 hours
- X-axis now displays the last 24 hours in real chronological order (hour-by-hour backwards from current time)
- Chart updates in real time

---

### 🔜 Planned Improvements

- Date separators between messages

- Typing indicator

- Online/offline presence

- UI/UX improvements

- Firebase Hosting deployment

## Project Structure

```bash

├── public/
│ └── styles.css 
├── src/
│ ├── core/
│ ├── services/
│ └── app.js 
├── index.html 

```

## 📦 Setup

```bash
npm install
npm run dev
```

---

## 📌 Status

- 🟢 Core real-time chat functionality implemented
- 🟢 Message icon navigation added
- 🟢 Chart real-time implemented
- 🔜 Planned feature extensions and refinements