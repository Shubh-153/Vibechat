# Realtime Chat App

A lightweight cloud chat app with:

- 1-to-1 messaging
- Group chats
- Instant message updates with Firestore realtime listeners
- Serverless backend using Firebase Authentication + Cloud Firestore

## Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Auth: Firebase Email/Password Authentication
- Realtime database: Cloud Firestore
- Live sync mechanism: Firestore `onSnapshot()` listeners

## Project structure

- `index.html` - UI shell
- `styles.css` - responsive chat UI styling
- `app.js` - Firebase auth, chat creation, live messages
- `firebase-config.local.example.js` - copy this into `firebase-config.local.js` for local use
- `api/firebase-config.js` - Vercel serverless config endpoint using environment variables
- `firestore.rules` - recommended Firestore security rules

## Firebase setup

1. Create a Firebase project in the Firebase Console.
2. Enable **Authentication > Email/Password**.
3. Create a **Cloud Firestore** database in production or test mode.
4. Copy `firebase-config.local.example.js` to `firebase-config.local.js`.
5. Replace the placeholder keys in `firebase-config.local.js` with your real Firebase project config.
6. In Firestore, publish the rules from `firestore.rules`.

## Run locally

Because this app uses ES modules in the browser, serve it with a local static server.

If you have Node.js:

```powershell
npx serve .
```

Then open the local URL shown in your terminal.

## Deploy on Vercel without committing Firebase config

Set these Environment Variables in Vercel for your project:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

The app will load Firebase config from `api/firebase-config.js` on Vercel, so your repo can stay free of real project values.

## Firestore data model

### `users/{uid}`

```json
{
  "uid": "firebase-user-id",
  "displayName": "Ava",
  "email": "ava@example.com",
  "updatedAt": "server timestamp"
}
```

### `chats/{chatId}`

```json
{
  "type": "direct | group",
  "title": "Project Launch",
  "members": ["uid1", "uid2"],
  "memberProfiles": {
    "uid1": { "displayName": "Ava", "email": "ava@example.com" }
  },
  "createdAt": "server timestamp",
  "updatedAt": "server timestamp",
  "lastMessage": "Hello"
}
```

### `chats/{chatId}/messages/{messageId}`

```json
{
  "text": "Hello team",
  "senderId": "uid1",
  "senderName": "Ava",
  "createdAt": "server timestamp"
}
```

## Why this is realtime

The app subscribes to:

- chat list updates for the signed-in user
- message updates for the selected chat

Whenever Firestore changes, every connected client receives the update automatically, so new messages appear instantly without page refreshes.

## Optional upgrade ideas

- Presence status with Realtime Database
- File uploads with Firebase Storage
- Push notifications with Firebase Cloud Messaging
- Cloud Functions for message moderation or fan-out logic
- Socket.IO backend if you want custom event routing beyond Firebase
