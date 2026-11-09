// Firestore security rules tests. Run with `npm run test:rules` (starts the emulator for you).
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { after, before, beforeEach, test } from 'node:test'

let env
const E = 'events/ev1'

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})
after(() => env.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore()
    await setDoc(doc(d, 'admins/org@x.com'), {})
    await setDoc(doc(d, E), { name: 'Sessão', date: '2099-01-01' })
    await setDoc(doc(d, `${E}/items/bolo`), { name: 'Bolo', slots: 2 })
  })
})

const member = (uid = 'ana') => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore()
const admin = () => env.authenticatedContext('org', { email: 'org@x.com', firebase: { sign_in_provider: 'password' } }).firestore()
const stranger = () => env.authenticatedContext('zed', { email: 'zed@x.com', firebase: { sign_in_provider: 'password' } }).firestore()

function choose(d, uid, slot, person = 'Ana') {
  const b = writeBatch(d)
  const id = `bolo_${slot}`
  b.set(doc(d, `${E}/signups/${id}`), { itemId: 'bolo', itemName: 'Bolo', slot, person, uid, createdAt: new Date() })
  b.set(doc(d, `${E}/taken/${id}`), { itemId: 'bolo', uid, slot })
  return b.commit()
}

test('member takes a free slot', () => assertSucceeds(choose(member(), 'ana', 0)))

test('same slot cannot be taken twice', async () => {
  await choose(member(), 'ana', 0)
  await assertFails(choose(member('bia'), 'bia', 0, 'Bia'))
})

test('slot beyond the item limit is denied', () => assertFails(choose(member(), 'ana', 2)))

test('taken slot without the private signup is denied', () =>
  assertFails(setDoc(doc(member(), `${E}/taken/bolo_0`), { itemId: 'bolo', uid: 'ana', slot: 0 })))

test('names are private: others cannot read signups, everyone can read taken', async () => {
  await choose(member(), 'ana', 0)
  const bia = member('bia')
  await assertFails(getDoc(doc(bia, `${E}/signups/bolo_0`)))
  await assertFails(getDocs(collection(bia, `${E}/signups`)))
  await assertSucceeds(getDocs(collection(bia, `${E}/taken`)))
  await assertSucceeds(getDocs(query(collection(member(), `${E}/signups`), where('uid', '==', 'ana'))))
  await assertSucceeds(getDocs(collection(admin(), `${E}/signups`)))
})

test('cancel must remove signup and slot together', async () => {
  await choose(member(), 'ana', 0)
  await assertFails(deleteDoc(doc(member(), `${E}/signups/bolo_0`)))
  const d = member()
  const b = writeBatch(d)
  b.delete(doc(d, `${E}/signups/bolo_0`))
  b.delete(doc(d, `${E}/taken/bolo_0`))
  await assertSucceeds(b.commit())
})

test('closed session blocks members, not admins', async () => {
  await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), E), { name: 'Sessão', date: '2099-01-01', closed: true }))
  await assertFails(choose(member(), 'ana', 0))
  await assertSucceeds(choose(admin(), 'org', 0, 'Dona Cida'))
})

test('only listed admins edit items', async () => {
  await assertFails(setDoc(doc(member(), `${E}/items/x`), { name: 'X', slots: 1 }))
  await assertFails(setDoc(doc(stranger(), `${E}/items/x`), { name: 'X', slots: 1 }))
  await assertSucceeds(setDoc(doc(admin(), `${E}/items/x`), { name: 'X', slots: 1 }))
})

test('admin listed by uid also works', async () => {
  await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'admins/zed'), {}))
  await assertSucceeds(setDoc(doc(stranger(), `${E}/items/x`), { name: 'X', slots: 1 }))
})
