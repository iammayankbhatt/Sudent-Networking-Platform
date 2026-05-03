import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })
}

export async function uploadProfilePhoto(uid, file) {
  const storageRef = ref(storage, `avatars/${uid}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  await updateDoc(doc(db, 'users', uid), { photoURL: url })
  return url
}

export async function searchUsers(filters = {}) {
  let q = collection(db, 'users')
  const constraints = []

  if (filters.university) constraints.push(where('university', '==', filters.university))
  if (filters.city) constraints.push(where('city', '==', filters.city))
  if (filters.state) constraints.push(where('state', '==', filters.state))
  if (filters.department) constraints.push(where('department', '==', filters.department))

  constraints.push(limit(50))

  const snap = await getDocs(query(q, ...constraints))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getAllUsers(limitCount = 30) {
  const snap = await getDocs(query(collection(db, 'users'), limit(limitCount)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
