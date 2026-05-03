import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '../firebase'

export async function sendConnectionRequest(fromUid, toUid) {
  const existing = await getDocs(
    query(
      collection(db, 'connections'),
      where('from', '==', fromUid),
      where('to', '==', toUid)
    )
  )
  if (!existing.empty) throw new Error('Request already sent')
  await addDoc(collection(db, 'connections'), {
    from: fromUid,
    to: toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function getConnectionStatus(fromUid, toUid) {
  const q1 = query(
    collection(db, 'connections'),
    where('from', '==', fromUid),
    where('to', '==', toUid)
  )
  const q2 = query(
    collection(db, 'connections'),
    where('from', '==', toUid),
    where('to', '==', fromUid)
  )
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])
  if (!snap1.empty) return { id: snap1.docs[0].id, ...snap1.docs[0].data() }
  if (!snap2.empty) return { id: snap2.docs[0].id, ...snap2.docs[0].data() }
  return null
}

export async function acceptConnection(connectionId, fromUid, toUid) {
  await updateDoc(doc(db, 'connections', connectionId), { status: 'connected' })
  await updateDoc(doc(db, 'users', fromUid), { connectionCount: increment(1) })
  await updateDoc(doc(db, 'users', toUid), { connectionCount: increment(1) })
}

export async function rejectConnection(connectionId) {
  await deleteDoc(doc(db, 'connections', connectionId))
}

export async function getPendingRequests(uid) {
  const snap = await getDocs(
    query(collection(db, 'connections'), where('to', '==', uid), where('status', '==', 'pending'))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getMyConnections(uid) {
  const [s1, s2] = await Promise.all([
    getDocs(query(collection(db, 'connections'), where('from', '==', uid), where('status', '==', 'connected'))),
    getDocs(query(collection(db, 'connections'), where('to', '==', uid), where('status', '==', 'connected'))),
  ])
  const ids = new Set()
  ;[...s1.docs, ...s2.docs].forEach((d) => {
    const data = d.data()
    ids.add(data.from === uid ? data.to : data.from)
  })
  return [...ids]
}
