import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  getDoc,
  increment,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

export function subscribeFeed(callback) {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function createPost(uid, content, imageFile = null) {
  let imageURL = null
  if (imageFile) {
    const storageRef = ref(storage, `posts/${uid}/${Date.now()}`)
    await uploadBytes(storageRef, imageFile)
    imageURL = await getDownloadURL(storageRef)
  }
  await addDoc(collection(db, 'posts'), {
    uid,
    content,
    imageURL,
    likes: [],
    commentCount: 0,
    createdAt: serverTimestamp(),
  })
}

export async function toggleLike(postId, uid) {
  const postRef = doc(db, 'posts', postId)
  const snap = await getDoc(postRef)
  const likes = snap.data()?.likes || []
  if (likes.includes(uid)) {
    await updateDoc(postRef, { likes: arrayRemove(uid) })
  } else {
    await updateDoc(postRef, { likes: arrayUnion(uid) })
  }
}

export async function addComment(postId, uid, text, authorName, authorPhoto) {
  await addDoc(collection(db, 'posts', postId, 'comments'), {
    uid,
    text,
    authorName,
    authorPhoto: authorPhoto || '',
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'posts', postId), {
    commentCount: increment(1),
  })
}

export function subscribeComments(postId, callback) {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, 'posts', postId))
}
