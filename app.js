import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
<<<<<<< HEAD
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
=======
>>>>>>> origin/main

const authPanel = document.getElementById("authPanel");
const chatApp = document.getElementById("chatApp");
const authForm = document.getElementById("authForm");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const authStatus = document.getElementById("authStatus");
const appStatus = document.getElementById("appStatus");
const userSummary = document.getElementById("userSummary");
const chatList = document.getElementById("chatList");
const conversationHeader = document.getElementById("conversationHeader");
const messagesContainer = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const directChatForm = document.getElementById("directChatForm");
const groupChatForm = document.getElementById("groupChatForm");

const displayNameInput = document.getElementById("displayName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const directEmailInput = document.getElementById("directEmail");
const groupNameInput = document.getElementById("groupName");
const groupEmailsInput = document.getElementById("groupEmails");

let currentUser = null;
let activeChat = null;
let chatUnsubscribe = null;
let messageUnsubscribe = null;
<<<<<<< HEAD
=======
let auth = null;
let db = null;
>>>>>>> origin/main

function setStatus(target, message, isError = false) {
  target.textContent = message;
  target.style.color = isError ? "#9f2e2e" : "#715849";
}

<<<<<<< HEAD
=======
async function loadFirebaseConfig() {
  try {
    const localConfigModule = await import("./firebase-config.local.js");
    return localConfigModule.firebaseConfig;
  } catch (localError) {
    const response = await fetch("/api/firebase-config");
    if (!response.ok) {
      throw new Error("Firebase config could not be loaded. Add firebase-config.local.js for local use or set Vercel env vars.");
    }
    return response.json();
  }
}

>>>>>>> origin/main
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTimestamp(timestamp) {
  if (!timestamp?.toDate) {
    return "Sending...";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(timestamp.toDate());
}

function showChatApp(isAuthenticated) {
  authPanel.classList.toggle("hidden", isAuthenticated);
  chatApp.classList.toggle("hidden", !isAuthenticated);
}

async function saveUserProfile(user, displayName) {
  const profile = {
    uid: user.uid,
    displayName,
    email: normalizeEmail(user.email || ""),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", user.uid), profile, { merge: true });
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const usersRef = collection(db, "users");
  const userQuery = query(usersRef, where("email", "==", normalizedEmail));
  const snapshot = await getDocs(userQuery);
  return snapshot.docs[0] || null;
}

function buildDirectChatId(uidA, uidB) {
  return [uidA, uidB].sort().join("__");
}

async function createOrOpenDirectChat(targetEmail) {
  const targetUserDoc = await findUserByEmail(targetEmail);

  if (!targetUserDoc) {
    throw new Error("That user does not exist yet. Ask them to create an account first.");
  }

  if (targetUserDoc.id === currentUser.uid) {
    throw new Error("You are already signed in as that user.");
  }

  const targetUser = targetUserDoc.data();
  const chatId = buildDirectChatId(currentUser.uid, targetUser.uid);
  const chatRef = doc(db, "chats", chatId);
  const chatSnapshot = await getDoc(chatRef);

  if (!chatSnapshot.exists()) {
    await setDoc(chatRef, {
      type: "direct",
      title: `${currentUser.displayName} & ${targetUser.displayName}`,
      members: [currentUser.uid, targetUser.uid],
      memberProfiles: {
        [currentUser.uid]: {
          displayName: currentUser.displayName,
          email: currentUser.email
        },
        [targetUser.uid]: {
          displayName: targetUser.displayName,
          email: targetUser.email
        }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "Chat created"
    });
  }

  activeChat = { id: chatId };
  bindMessages(chatId);
}

async function createGroupChat(groupName, emailsRaw) {
  const emails = [...new Set(
    emailsRaw
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean)
  )];

  const otherUserDocs = await Promise.all(emails.map(findUserByEmail));
  const missingEmail = emails.find((email, index) => !otherUserDocs[index]);

  if (missingEmail) {
    throw new Error(`No user found for ${missingEmail}.`);
  }

  const memberProfiles = {
    [currentUser.uid]: {
      displayName: currentUser.displayName,
      email: currentUser.email
    }
  };

  const memberIds = [currentUser.uid];

  otherUserDocs.forEach((userDoc) => {
    const profile = userDoc.data();
    if (!memberProfiles[userDoc.id]) {
      memberProfiles[userDoc.id] = {
        displayName: profile.displayName,
        email: profile.email
      };
      memberIds.push(userDoc.id);
    }
  });

  const groupDoc = await addDoc(collection(db, "chats"), {
    type: "group",
    title: groupName.trim(),
    members: memberIds,
    memberProfiles,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: "Group created"
  });

  activeChat = { id: groupDoc.id };
  bindMessages(groupDoc.id);
}

function renderChatList(chatDocs) {
  if (!chatDocs.length) {
    chatList.innerHTML = '<div class="empty-state">No chats yet. Start a direct message or create a group.</div>';
    return;
  }

  const sortedChats = [...chatDocs].sort((left, right) => {
    const leftTime = left.data().updatedAt?.seconds || 0;
    const rightTime = right.data().updatedAt?.seconds || 0;
    return rightTime - leftTime;
  });

  chatList.innerHTML = sortedChats.map((chatDoc) => {
    const chat = chatDoc.data();
    const activeClass = activeChat?.id === chatDoc.id ? "active" : "";
    const title = chat.type === "direct"
      ? Object.entries(chat.memberProfiles || {})
          .filter(([uid]) => uid !== currentUser.uid)
          .map(([, profile]) => profile.displayName)
          .join(", ")
      : chat.title;

    return `
      <button class="chat-item ${activeClass}" data-chat-id="${chatDoc.id}">
        <strong>${escapeHtml(title || chat.title || "Untitled chat")}</strong>
        <span>${escapeHtml(chat.lastMessage || "No messages yet")}</span>
        <span class="meta">${chat.type === "group" ? "Group chat" : "Direct message"}</span>
      </button>
    `;
  }).join("");

  chatList.querySelectorAll("[data-chat-id]").forEach((button) => {
    button.addEventListener("click", () => {
      activeChat = { id: button.dataset.chatId };
      bindMessages(button.dataset.chatId);
      renderChatList(sortedChats);
    });
  });
}

<<<<<<< HEAD
function renderMessages(chatData, messageDocs) {
=======
function renderMessages(chatId, chatData, messageDocs) {
>>>>>>> origin/main
  const title = chatData.type === "direct"
    ? Object.entries(chatData.memberProfiles || {})
        .filter(([uid]) => uid !== currentUser.uid)
        .map(([, profile]) => profile.displayName)
        .join(", ")
    : chatData.title;

  conversationHeader.innerHTML = `
    <div>
      <div class="eyebrow">${chatData.type === "group" ? "Group conversation" : "Direct conversation"}</div>
      <h2>${escapeHtml(title || "Conversation")}</h2>
    </div>
    <p class="subtle">${Object.keys(chatData.memberProfiles || {}).length} member(s)</p>
  `;

  if (!messageDocs.length) {
    messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Send the first one.</div>';
    return;
  }

  messagesContainer.innerHTML = messageDocs.map((messageDoc) => {
    const message = messageDoc.data();
    const isMine = message.senderId === currentUser.uid;
    return `
      <div class="message-row ${isMine ? "me" : ""}">
        <article class="message-bubble">
          <strong>${escapeHtml(message.senderName || "Unknown user")}</strong>
          <div>${escapeHtml(message.text || "")}</div>
          <span class="meta">${formatTimestamp(message.createdAt)}</span>
        </article>
      </div>
    `;
  }).join("");

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function clearConversation() {
  conversationHeader.innerHTML = `
    <div>
      <div class="eyebrow">Choose a chat</div>
      <h2>No conversation selected</h2>
    </div>
    <p class="subtle">Messages appear instantly for every member.</p>
  `;
  messagesContainer.innerHTML = '<div class="empty-state">Pick a direct chat or create a group to start sending live messages.</div>';
  messageInput.disabled = true;
  sendButton.disabled = true;
}

function bindChats(uid) {
  if (chatUnsubscribe) {
    chatUnsubscribe();
  }

  const chatsQuery = query(collection(db, "chats"), where("members", "array-contains", uid));
  chatUnsubscribe = onSnapshot(chatsQuery, (snapshot) => {
    renderChatList(snapshot.docs);
  }, (error) => {
    setStatus(appStatus, error.message, true);
  });
}

function bindMessages(chatId) {
  if (messageUnsubscribe) {
    messageUnsubscribe();
  }

  messageInput.disabled = false;
  sendButton.disabled = false;

  const chatRef = doc(db, "chats", chatId);
  const messagesRef = collection(db, "chats", chatId, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

  messageUnsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
    const chatSnapshot = await getDoc(chatRef);
    if (!chatSnapshot.exists()) {
      clearConversation();
      return;
    }
<<<<<<< HEAD
    renderMessages(chatSnapshot.data(), snapshot.docs);
=======
    renderMessages(chatId, chatSnapshot.data(), snapshot.docs);
>>>>>>> origin/main
  }, (error) => {
    setStatus(appStatus, error.message, true);
  });
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
<<<<<<< HEAD

=======
>>>>>>> origin/main
  const displayName = displayNameInput.value.trim();
  const email = normalizeEmail(emailInput.value);
  const password = passwordInput.value;

<<<<<<< HEAD
  if (!displayName || !email || !password) {
    setStatus(authStatus, "Please fill in all fields.", true);
    return;
  }

=======
>>>>>>> origin/main
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await saveUserProfile(user, displayName);
    authForm.reset();
    setStatus(authStatus, "Account created. You are signed in.");
  } catch (error) {
    setStatus(authStatus, error.message, true);
  }
});

loginButton.addEventListener("click", async () => {
  const email = normalizeEmail(emailInput.value);
  const password = passwordInput.value;

<<<<<<< HEAD
  if (!email || !password) {
    setStatus(authStatus, "Enter email and password to log in.", true);
    return;
  }

=======
>>>>>>> origin/main
  try {
    await signInWithEmailAndPassword(auth, email, password);
    authForm.reset();
    setStatus(authStatus, "Welcome back.");
  } catch (error) {
    setStatus(authStatus, error.message, true);
  }
});

logoutButton.addEventListener("click", async () => {
  await signOut(auth);
});

directChatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await createOrOpenDirectChat(directEmailInput.value);
    directChatForm.reset();
    setStatus(appStatus, "Direct chat is ready.");
  } catch (error) {
    setStatus(appStatus, error.message, true);
  }
});

groupChatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await createGroupChat(groupNameInput.value, groupEmailsInput.value);
    groupChatForm.reset();
    setStatus(appStatus, "Group chat created.");
  } catch (error) {
    setStatus(appStatus, error.message, true);
  }
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();

  if (!text || !activeChat?.id) {
    return;
  }

  const chatRef = doc(db, "chats", activeChat.id);

  try {
    await addDoc(collection(db, "chats", activeChat.id, "messages"), {
      text,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      createdAt: serverTimestamp()
    });

    await updateDoc(chatRef, {
      updatedAt: serverTimestamp(),
      lastMessage: text
    });

    messageInput.value = "";
    setStatus(appStatus, "Message delivered live.");
  } catch (error) {
    setStatus(appStatus, error.message, true);
  }
});

<<<<<<< HEAD
onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    showChatApp(false);
    activeChat = null;
    if (chatUnsubscribe) {
      chatUnsubscribe();
      chatUnsubscribe = null;
    }
    if (messageUnsubscribe) {
      messageUnsubscribe();
      messageUnsubscribe = null;
    }
    clearConversation();
    chatList.innerHTML = "";
    return;
  }

  const userProfileRef = doc(db, "users", user.uid);
  const profileSnapshot = await getDoc(userProfileRef);
  const profile = profileSnapshot.data() || {};

  currentUser = {
    uid: user.uid,
    email: user.email || profile.email || "",
    displayName: profile.displayName || user.email?.split("@")[0] || "User"
  };

  await saveUserProfile(user, currentUser.displayName);
  showChatApp(true);
  userSummary.innerHTML = `
    <strong>${escapeHtml(currentUser.displayName)}</strong><br>
    <span class="meta">${escapeHtml(currentUser.email)}</span>
  `;
  clearConversation();
  bindChats(user.uid);
  setStatus(appStatus, "Realtime sync connected.");
});
=======
async function startApp() {
  try {
    const firebaseConfig = await loadFirebaseConfig();
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
      currentUser = user;

      if (!user) {
        showChatApp(false);
        activeChat = null;
        if (chatUnsubscribe) {
          chatUnsubscribe();
          chatUnsubscribe = null;
        }
        if (messageUnsubscribe) {
          messageUnsubscribe();
          messageUnsubscribe = null;
        }
        clearConversation();
        chatList.innerHTML = "";
        return;
      }

      const userProfileRef = doc(db, "users", user.uid);
      const profileSnapshot = await getDoc(userProfileRef);
      const profile = profileSnapshot.data() || {};

      currentUser = {
        uid: user.uid,
        email: user.email || profile.email || "",
        displayName: profile.displayName || user.email?.split("@")[0] || "User"
      };

      await saveUserProfile(user, currentUser.displayName);
      showChatApp(true);
      userSummary.innerHTML = `
        <strong>${escapeHtml(currentUser.displayName)}</strong><br>
        <span class="meta">${escapeHtml(currentUser.email)}</span>
      `;
      clearConversation();
      bindChats(user.uid);
      setStatus(appStatus, "Realtime sync connected.");
    });
  } catch (error) {
    setStatus(authStatus, error.message, true);
  }
}

startApp();
>>>>>>> origin/main
