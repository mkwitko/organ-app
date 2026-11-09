import assert from 'node:assert/strict'
import { test } from 'node:test'
import { itemStatus, listText } from './lib.js'

const items = [
  { id: 'a', name: 'Bolo', slots: 3 },
  { id: 'b', name: 'Suco', slots: 1, note: 'gelado' },
]
const signups = [
  { itemId: 'a', itemName: 'Bolo', person: 'Ana' },
  { itemId: 'b', itemName: 'Suco', person: 'João' },
  { itemId: 'b', itemName: 'Suco', person: 'Extra' },
  { itemId: null, itemName: 'Pão de queijo', person: 'Maria' },
]

test('itemStatus counts slots and never goes negative', () => {
  assert.equal(itemStatus(items[0], signups).left, 2)
  assert.equal(itemStatus(items[1], signups).left, 0)
})

test('listText', () => {
  const txt = listText({ name: 'Natal', date: '2026-12-20' }, items, signups)
  assert.match(txt, /\*Lanche — Natal \(20\/12\)\*/)
  assert.match(txt, /• Bolo \(1 de 3\): Ana ⚠️/)
  assert.match(txt, /• Suco — _gelado_ \(2 de 1\): João, Extra ✅$/m)
  assert.match(txt, /• Pão de queijo: Maria/)
})

test('suggestIcon', async () => {
  const { suggestIcon } = await import('./lib.js')
  assert.equal(suggestIcon('Bolo de cenoura'), 'bolo')
  assert.equal(suggestIcon('Salada de frutas'), 'frutas')
  assert.equal(suggestIcon('Pão de queijo'), 'paodequeijo')
  assert.equal(suggestIcon('Pão francês'), 'pao')
  assert.equal(suggestIcon('Refrigerante 2L'), 'refrigerante')
  assert.equal(suggestIcon('Copos e guardanapos'), null)
  assert.equal(suggestIcon('Pudim de leite'), 'sobremesa')
  assert.equal(suggestIcon('Suco de laranja'), 'suco')
  assert.equal(suggestIcon('Coxinha'), 'salgado')
  assert.equal(suggestIcon('Maçã'), 'maca')
  assert.equal(suggestIcon('Macarrão'), null)
  assert.equal(suggestIcon('Abacaxi picado'), 'abacaxi')
  assert.equal(suggestIcon('Bolo de morango'), 'bolo')
})

test('freeSlot', async () => {
  const { freeSlot } = await import('./lib.js')
  const it = { id: 'a', slots: 3 }
  assert.equal(freeSlot(it, []), 0)
  assert.equal(freeSlot(it, [{ id: 'a_0', itemId: 'a' }, { id: 'a_2', itemId: 'a' }]), 1)
  assert.equal(freeSlot(it, [0, 1, 2].map((n) => ({ id: 'a_' + n, itemId: 'a' }))), -1)
})
