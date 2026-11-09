import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { connectAuthEmulator, getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import {
  collection, connectFirestoreEmulator, doc, initializeFirestore, onSnapshot, persistentLocalCache, persistentMultipleTabManager,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { slotId } from './lib.js'

const env = import.meta.env
const config = {
  apiKey: env.VITE_FB_API_KEY,
  authDomain: env.VITE_FB_AUTH_DOMAIN,
  projectId: env.VITE_FB_PROJECT_ID,
  appId: env.VITE_FB_APP_ID,
}

// Two app instances keep two separate logins in the same browser: the member's anonymous account
// and the organizer's email account. Signing in at /admin then never replaces the member's
// account, so their own choices keep the "Cancelar" button.
const app = initializeApp(config)
const adminApp = initializeApp(config, 'admin')

// App Check: only this site (verified by reCAPTCHA Enterprise) can use the database.
// Off when VITE_RECAPTCHA_KEY is empty (local emulators).
if (env.VITE_RECAPTCHA_KEY && !env.VITE_EMULATOR)
  for (const a of [app, adminApp])
    initializeAppCheck(a, { provider: new ReCaptchaEnterpriseProvider(env.VITE_RECAPTCHA_KEY), isTokenAutoRefreshEnabled: true })

// Local cache: the list opens from the phone's copy when the signal is weak, then updates.
const cache = () => ({ localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
export const db = initializeFirestore(app, cache())
export const auth = getAuth(app)
export const adminDb = initializeFirestore(adminApp, cache())
export const adminAuth = getAuth(adminApp)

if (env.VITE_EMULATOR) {
  for (const d of [db, adminDb]) connectFirestoreEmulator(d, 'localhost', 8080)
  for (const a of [auth, adminAuth]) connectAuthEmulator(a, 'http://localhost:9099', { disableWarnings: true })
}

// Every visitor gets an anonymous account (kept by the browser) so they can undo their own choices.
// Admins sign in with email/password instead (accounts created in the Firebase console).
// Returns undefined while loading, null when signed out (only on adminAuth).
export function useUser(a = auth) {
  const [user, setUser] = useState(undefined)
  useEffect(
    () =>
      onAuthStateChanged(a, (u) => {
        setUser(u)
        if (!u && a === auth) signInAnonymously(auth).catch(console.error)
      }),
    [a],
  )
  return user
}

export const useUid = () => useUser()?.uid ?? null

// Live query. Returns null while loading. `q` may be falsy to skip.
export function useSnap(q, deps) {
  const [data, setData] = useState(null)
  useEffect(() => {
    setData(null)
    if (!q) return
    return onSnapshot(
      q,
      (s) => setData(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => {
        console.error(e)
        setData([])
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return data
}

export function useOnline() {
  const [on, setOn] = useState(navigator.onLine)
  useEffect(() => {
    const up = () => setOn(true)
    const down = () => setOn(false)
    addEventListener('online', up)
    addEventListener('offline', down)
    return () => {
      removeEventListener('online', up)
      removeEventListener('offline', down)
    }
  }, [])
  return on
}

// A choice is a private signup (with the name) plus, for list items, a public "taken" slot with
// the same id and no name. The rules require both to be written and deleted together.
export function addChoice(b, d, evId, data) {
  const signups = collection(d, 'events', evId, 'signups')
  if (data.itemId == null) return b.set(doc(signups), data)
  const id = slotId(data.itemId, data.slot)
  b.set(doc(signups, id), data)
  b.set(doc(d, 'events', evId, 'taken', id), { itemId: data.itemId, uid: data.uid, slot: data.slot })
}

export function removeChoice(b, d, evId, s) {
  b.delete(doc(d, 'events', evId, 'signups', s.id))
  if (s.itemId) b.delete(doc(d, 'events', evId, 'taken', s.id))
}
