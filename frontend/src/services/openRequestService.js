import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export async function createOpenRequest(uid, data) {
  await addDoc(collection(db, 'open_requests'), {
    uid,
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function getOpenRequests(filters = {}) {
  const constraints = [orderBy('createdAt', 'desc'), limit(30)]
  if (filters.domain) constraints.unshift(where('domain', '==', filters.domain))
  const snap = await getDocs(query(collection(db, 'open_requests'), ...constraints))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteOpenRequest(id) {
  await deleteDoc(doc(db, 'open_requests', id))
}
