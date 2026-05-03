import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

export async function signUp(email, password, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    name,
    email,
    university: '',
    city: '',
    state: '',
    department: '',
    year: '',
    bio: '',
    skills: [],
    interests: [],
    photoURL: '',
    connectionCount: 0,
    createdAt: serverTimestamp(),
  })
  return cred.user
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function logOut() {
  await signOut(auth)
}
