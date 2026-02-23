# JS + Firebase Chat App (WIP)

Simple real-time chat application built with:

- JavaScript
- Firebase Authentication (Email/Password)
- Firebase Realtime Database (RTDB)
- Webpack

---

## ✅ Current Features

### Authentication
- User registration (email & password)
- User login
- Logout functionality
- Auth State persistence

### Users
- Users are stored in Realtime Database after registration
- Real-time users list
- Only authenticated users can read users list
- Users can modify only their own profile (via RTDB rules)

## Planned Features
- Private 1-to-1 conversations
- Real-time messaging
- Message history with server timestamps
- UI improvements

## Project Structure

src/ → app logic
public/ → assets

---

## 📦 Setup

```bash
npm install
npm run dev
```

---

## Status
🟡 Early development — foundational layers being implemented.