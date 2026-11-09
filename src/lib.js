export const today = () => new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD, local time

export const fmtDate = (iso, opts = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  new Date(iso + 'T12:00').toLocaleDateString('pt-BR', opts)

// Signups for one item, plus how many slots are still open.
export function itemStatus(item, signups) {
  const taken = signups.filter((s) => s.itemId === item.id)
  return { taken, left: Math.max(0, item.slots - taken.length) }
}

// Text the organizer pastes in WhatsApp.
export function listText(ev, items, signups) {
  const lines = [`*Lanche — ${ev.name} (${fmtDate(ev.date, { day: '2-digit', month: '2-digit' })})*`, '']
  for (const it of items) {
    const { taken, left } = itemStatus(it, signups)
    const names = taken.map((s) => s.person).join(', ')
    lines.push(`• ${it.name} (${taken.length} de ${it.slots})${names ? ': ' + names : ''}${left ? ' ⚠️' : ' ✅'}`)
  }
  const extra = signups.filter((s) => !s.itemId)
  if (extra.length) {
    lines.push('', '*Outras contribuições*')
    for (const s of extra) lines.push(`• ${s.itemName}: ${s.person}`)
  }
  return lines.join('\n')
}

// Icon keys the admin can pick; the first keyword found in the item name suggests one.
// Order matters: more specific words first ("salada de fruta" is fruit, "pão de queijo" is bread).
export const ICON_KEYWORDS = [
  ['frutas', ['fruta', 'maca', 'mamao', 'abacaxi', 'morango']],
  ['uva', ['uva']],
  ['banana', ['banana']],
  ['melancia', ['melancia', 'melao']],
  ['paodequeijo', ['pao de queijo', 'queijo']],
  ['pao', ['pao', 'croissant', 'rosca', 'broa']],
  ['sanduiche', ['sanduiche', 'misto', 'lanche natural', 'bauru']],
  ['cachorroquente', ['cachorro', 'hot dog']],
  ['hamburguer', ['hamburguer']],
  ['bolo', ['bolo', 'cuca']],
  ['torta', ['torta', 'quiche']],
  ['sobremesa', ['pudim', 'sobremesa', 'mousse', 'gelatina', 'doce de']],
  ['rosquinha', ['rosquinha', 'sonho', 'donut']],
  ['biscoito', ['biscoito', 'bolacha', 'cookie', 'sequilho']],
  ['chocolate', ['chocolate', 'bombom']],
  ['doce', ['doce', 'brigadeiro', 'bala', 'beijinho', 'cajuzinho']],
  ['sorvete', ['sorvete', 'picole', 'acai']],
  ['coxinha', ['coxinha', 'frango']],
  ['salgado', ['salgad', 'esfirra', 'empada', 'pastel', 'quibe', 'enroladinho']],
  ['pizza', ['pizza']],
  ['tapioca', ['tapioca', 'cuscuz', 'beiju']],
  ['milho', ['milho', 'pamonha', 'curau', 'canjica']],
  ['pipoca', ['pipoca']],
  ['salada', ['salada', 'legume', 'verdura']],
  ['sopa', ['sopa', 'caldo']],
  ['ovo', ['ovo']],
  ['refrigerante', ['refri', 'guarana', 'soda', 'coca']],
  ['suco', ['suco', 'limonada']],
  ['laranja', ['laranja', 'tangerina', 'mexerica', 'bergamota']],
  ['agua', ['agua']],
  ['cafe', ['cafe', 'cappuccino']],
  ['cha', ['cha ', 'mate', 'chimarrao']],
  ['leite', ['leite', 'achocolatado', 'iogurte']],
  ['gelo', ['gelo']],
  ['descartaveis', ['copo', 'prato', 'descartave', 'talher', 'garfo', 'colher']],
  ['guardanapo', ['guardanapo', 'papel']],
]

export function suggestIcon(name) {
  const n = ' ' + name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase() + ' '
  for (const [key, words] of ICON_KEYWORDS) if (words.some((w) => n.includes(' ' + w))) return key
  return null
}

// Signups for an item use ids `${itemId}_${slot}`. Firestore rules only allow creating a new doc
// with slot < item.slots, so two people racing for the last slot cannot both win.
export const slotId = (itemId, slot) => `${itemId}_${slot}`
export function freeSlot(item, signups) {
  const used = new Set(signups.filter((s) => s.itemId === item.id).map((s) => s.id))
  for (let n = 0; n < item.slots; n++) if (!used.has(slotId(item.id, n))) return n
  return -1
}
