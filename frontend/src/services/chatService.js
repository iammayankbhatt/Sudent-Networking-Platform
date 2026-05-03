import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  where,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_')
}

export async function getOrCreateChat(uid1, uid2) {
  const chatId = getChatId(uid1, uid2)
  const chatRef = doc(db, 'chats', chatId)
  const snap = await getDoc(chatRef)
  if (!snap.exists()) {
    await setDoc(chatRef, {
      participants: [uid1, uid2],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
    })
  }
  return chatId
}

export function subscribeMessages(chatId, callback) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function sendMessage(chatId, uid, text) {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    uid,
    text,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  })
}

export async function getUserChats(uid) {
  const snap = await getDocs(
    query(collection(db, 'chats'), where('participants', 'array-contains', uid))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
