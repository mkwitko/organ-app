import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { ChevronDown, Copy, Eye, EyeOff, Link2, Lock, LockOpen, LogOut, Pencil, Plus, Printer, Trash2, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ItemIcon, Progress, Shell, field, primary } from './App.jsx'
import { ICONS, iconSrc } from './icons.js'
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { addChoice, adminAuth as auth, adminDb as db, removeChoice, useSnap, useUser } from './firebase.js'
import { fmtDate, freeSlot, itemStatus, listText, suggestIcon, today } from './lib.js'

export default function Admin() {
  const user = useUser(auth)
  const email = user?.email ?? null
  const [check, setCheck] = useState({ email: undefined, ok: false })

  useEffect(() => {
    if (!email) return
    const has = (id) => getDoc(doc(db, 'admins', id)).then((d) => d.exists(), () => false)
    Promise.all([has(email), has(user.uid)]).then(([a, b]) => setCheck({ email, ok: a || b }))
  }, [email, user?.uid])

  const isAdmin = !email ? false : check.email === email ? check.ok : null

  if (user === undefined || isAdmin === null) return <Shell><p className="text-xl">Carregando…</p></Shell>
  if (!isAdmin) return <Shell><Login email={email} /></Shell>
  return (
    <Shell>
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 print:hidden">
        <p className="text-base font-bold uppercase tracking-wider text-tinta-suave">App da Organ · Organização</p>
        <p className="flex items-center gap-3 text-base">
          <span className="truncate">{email}</span>
          <button onClick={() => signOut(auth)} className="flex min-h-11 items-center gap-1.5 font-bold text-tinta underline-offset-4 hover:underline">
            <LogOut aria-hidden size={18} /> Sair
          </button>
        </p>
      </header>
      <Panel />
    </Shell>
  )
}

// Admin accounts live in Firebase Authentication; access also needs a doc /admins/{email} (both set in the console).
const loginError = (code) =>
  code === 'auth/too-many-requests' ? 'Muitas tentativas. Espere alguns minutos e tente de novo.'
  : code === 'auth/network-request-failed' ? 'Sem internet. Confira a conexão e tente de novo.'
  : 'Email ou senha incorretos.'

function Login({ email }) {
  const [form, setForm] = useState({ email: email ?? '', password: '' })
  const [msg, setMsg] = useState({ text: '', ok: false })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  async function login(e) {
    e.preventDefault()
    setMsg({ text: '', ok: false })
    setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password)
    } catch (err) {
      setMsg({ text: loginError(err.code), ok: false })
    }
    setBusy(false)
  }

  async function reset() {
    if (!form.email.trim()) return setMsg({ text: 'Escreva seu email acima para receber o link.', ok: false })
    await sendPasswordResetEmail(auth, form.email.trim()).catch(() => {})
    setMsg({ text: 'Se esse email tiver conta, chegará um link para criar nova senha.', ok: true })
  }

  return (
    <div className="mx-auto max-w-md pt-4 sm:pt-10">
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="" className="size-14 rounded-2xl shadow-faixa" />
        <div>
          <h1 className="text-3xl font-bold leading-tight text-tinta">Organização</h1>
          <p className="text-lg text-tinta-suave">App da Organ</p>
        </div>
      </div>

      {email ? (
        <div className="mt-8 rounded-3xl bg-papel p-6 shadow-faixa ring-1 ring-linha">
          <p className="flex items-center gap-2 text-xl font-bold text-tinta"><Lock aria-hidden size={22} /> Sem acesso</p>
          <p className="mt-3 text-lg">
            Você entrou como <b className="break-all text-tinta">{email}</b>, mas esse email não está na lista da organização.
          </p>
          <p className="mt-2 text-lg">Peça a quem cuida do app para incluir você.</p>
          <button onClick={() => signOut(auth)} className={`${ghost} mt-6 w-full`}><LogOut aria-hidden size={20} /> Entrar com outro email</button>
        </div>
      ) : (
        <form onSubmit={login} className="mt-8 rounded-3xl bg-papel p-6 shadow-faixa ring-1 ring-linha">
          <p className="text-lg">Entre para montar a lista de cada sessão e ver quem leva o quê.</p>
          <label className="mt-6 block text-lg font-bold text-tinta">
            Email
            <input type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${field} mt-2 block w-full font-normal`} autoFocus />
          </label>
          <label className="mt-4 block text-lg font-bold text-tinta">
            Senha
            <span className="relative mt-2 block">
              <input type={show ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${field} block w-full pr-14 font-normal`} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Esconder senha' : 'Mostrar senha'} aria-pressed={show} className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-tinta-suave hover:text-tinta">
                {show ? <EyeOff aria-hidden size={22} /> : <Eye aria-hidden size={22} />}
              </button>
            </span>
          </label>
          <p aria-live="polite" className={`mt-3 min-h-7 text-lg font-bold ${msg.ok ? 'text-tinta' : 'text-alerta'}`}>{msg.text}</p>
          <button disabled={busy} className={`${primary} mt-2 w-full`}>{busy ? 'Entrando…' : 'Entrar'}</button>
          <button type="button" onClick={reset} className="mt-4 min-h-11 w-full text-lg text-tinta underline underline-offset-4">Esqueci a senha</button>
        </form>
      )}

      <a href="/" className="mt-6 block text-center text-lg text-tinta-suave underline underline-offset-4">Voltar para a lista do lanche</a>
    </div>
  )
}

function Panel() {
  const events = useSnap(query(collection(db, 'events'), orderBy('date', 'desc')), [])
  const [sel, setSel] = useState('')
  const [form, setForm] = useState({ name: '', date: '', copyFrom: '' })
  const [creating, setCreating] = useState(false)
  const showForm = creating || events?.length === 0

  if (!events) return <p className="mt-6 text-xl">Carregando…</p>
  // Default: next upcoming event, else most recent.
  const ev = events.find((e) => e.id === sel) ?? [...events].reverse().find((e) => e.date >= today()) ?? events[0]

  async function createEvent(e) {
    e.preventDefault()
    const ref = await addDoc(collection(db, 'events'), { name: form.name.trim(), date: form.date, createdAt: serverTimestamp() })
    if (form.copyFrom) {
      const src = await getDocs(query(collection(db, 'events', form.copyFrom, 'items'), orderBy('createdAt')))
      const b = writeBatch(db)
      src.forEach((d) => {
        const { name, slots, icon } = d.data()
        b.set(doc(collection(db, 'events', ref.id, 'items')), { name, slots, icon: icon ?? suggestIcon(name) ?? 'outro', createdAt: serverTimestamp() })
      })
      await b.commit()
    }
    setSel(ref.id)
    setForm({ name: '', date: '', copyFrom: '' })
    setCreating(false)
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-end gap-3 print:hidden">
        {events.length > 0 && (
          <label className="min-w-0 basis-full text-base font-bold text-tinta-suave sm:max-w-xl sm:flex-1 sm:basis-auto">
            Sessão
            <select value={ev.id} onChange={(e) => setSel(e.target.value)} className={`${field} mt-1.5 block w-full font-bold`}>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name} — {fmtDate(e.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}</option>
              ))}
            </select>
          </label>
        )}
        <button onClick={() => setCreating(!creating)} aria-expanded={creating} className={`${ghost} w-full sm:w-auto`}>
          <Plus aria-hidden size={20} /> Nova sessão
        </button>
      </div>

      {showForm && (
        <form onSubmit={createEvent} className="mt-4 grid max-w-3xl gap-3 rounded-3xl bg-papel p-5 shadow-faixa ring-1 ring-linha sm:grid-cols-2 print:hidden">
          <h2 className="text-xl font-bold text-tinta sm:col-span-2">Nova sessão</h2>
          <input required maxLength={80} placeholder="Nome (ex.: Sessão de Natal)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${field} block w-full`} />
          <input required type="date" aria-label="Data" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`${field} block w-full`} />
          {events.length > 0 && (
            <label className="block text-base font-bold text-tinta-suave sm:col-span-2">
              Copiar os itens de
              <select value={form.copyFrom} onChange={(e) => setForm({ ...form, copyFrom: e.target.value })} className={`${field} mt-1.5 block w-full`}>
                <option value="">Nenhuma (começar vazia)</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} — {fmtDate(e.date, { day: '2-digit', month: '2-digit' })}</option>
                ))}
              </select>
            </label>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button className={primary}><Plus aria-hidden size={22} /> Criar sessão</button>
            {events.length > 0 && <button type="button" onClick={() => setCreating(false)} className={ghost}>Cancelar</button>}
          </div>
        </form>
      )}

      {ev && <EventPanel key={ev.id} ev={ev} />}
    </>
  )
}

const ghost = 'flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-papel px-5 text-lg font-bold text-tinta ring-1 ring-tinta/20 hover:bg-mata-alta'

function EventPanel({ ev }) {
  const items = useSnap(query(collection(db, 'events', ev.id, 'items'), orderBy('createdAt')), [ev.id])
  const signups = useSnap(query(collection(db, 'events', ev.id, 'signups'), orderBy('createdAt')), [ev.id])
  const [item, setItem] = useState({ name: '', slots: 1, icon: null })
  const [editing, setEditing] = useState(null) // item id being edited
  const [adding, setAdding] = useState(null) // item id getting a person added by the organizer
  const [picking, setPicking] = useState(false) // icon grid open in the add-item form
  // Until the admin picks an icon by hand, it follows the item name.
  const icon = item.icon ?? suggestIcon(item.name) ?? 'outro'
  const [copied, setCopied] = useState('')
  const uid = auth.currentUser?.uid

  if (!items || !signups) return <p className="mt-6 text-lg">Carregando…</p>

  const filled = items.reduce((n, it) => n + Math.min(it.slots, itemStatus(it, signups).taken.length), 0)
  const total = items.reduce((n, it) => n + it.slots, 0)
  const extras = signups.filter((s) => !s.itemId)
  const people = new Set(signups.map((s) => s.uid)).size

  async function addItem(e) {
    e.preventDefault()
    await addDoc(collection(db, 'events', ev.id, 'items'), { name: item.name.trim(), slots: Number(item.slots), icon, createdAt: serverTimestamp() })
    setItem({ name: '', slots: 1, icon: null })
  }

  async function removeItem(it) {
    const { taken } = itemStatus(it, signups)
    if (taken.length && !confirm(`${taken.length} pessoa(s) já escolheram "${it.name}". Remover mesmo assim?`)) return
    const b = writeBatch(db)
    taken.forEach((s) => removeChoice(b, db, ev.id, s))
    b.delete(doc(db, 'events', ev.id, 'items', it.id))
    await b.commit()
  }

  async function removeEvent() {
    if (!confirm(`Apagar "${ev.name}" com todos os itens e nomes? Não dá para desfazer.`)) return
    const b = writeBatch(db)
    for (const sub of ['items', 'signups', 'taken']) (await getDocs(collection(db, 'events', ev.id, sub))).forEach((d) => b.delete(d.ref))
    b.delete(doc(db, 'events', ev.id))
    await b.commit()
  }

  // For members who call the organizer instead of using the app. Same slot rule as the member page.
  async function addPerson(it, person) {
    const slot = freeSlot(it, signups)
    if (slot < 0) return alert('Este item já está completo.')
    const b = writeBatch(db)
    addChoice(b, db, ev.id, { itemId: it.id, itemName: it.name, slot, person, uid, createdAt: serverTimestamp() })
    await b.commit()
  }

  function removeSignup(s) {
    if (!confirm(`Tirar ${s.person} de "${s.itemName}"?`)) return
    const b = writeBatch(db)
    removeChoice(b, db, ev.id, s)
    return b.commit()
  }

  async function copy(what, text) {
    const ok = await navigator.clipboard.writeText(text).then(() => true, () => false)
    setCopied(ok ? what : 'erro')
    setTimeout(() => setCopied(''), ok ? 2000 : 5000)
  }

  const toggleClosed = () => updateDoc(doc(db, 'events', ev.id), { closed: !ev.closed })
  const past = ev.date < today()

  return (
    <>
    <PrintList ev={ev} items={items} signups={signups} />
    <div className="print:hidden">
      <section className="mt-6 rounded-3xl bg-papel p-6 shadow-faixa ring-1 ring-linha sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-balance text-3xl font-bold leading-tight text-tinta sm:text-4xl">{ev.name}</h1>
            <p className="mt-1 text-lg first-letter:uppercase">{fmtDate(ev.date)}{past && ' · já aconteceu'}</p>
          </div>
          <span className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-base font-bold ${ev.closed ? 'bg-alerta/10 text-alerta' : 'bg-folha/60 text-tinta'}`}>
            {ev.closed ? <Lock aria-hidden size={16} /> : <span className="size-2 rounded-full bg-tinta" />}
            {ev.closed ? 'Escolhas encerradas' : 'Escolhas abertas'}
          </span>
        </div>

        <div className="mt-6">
          <p className="text-lg"><b className="text-2xl text-tinta">{filled} de {total}</b> lugares preenchidos · {people} {people === 1 ? 'pessoa' : 'pessoas'}</p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-tinta/10">
            <div className="h-full rounded-full bg-tinta transition-[width] duration-500" style={{ width: `${total ? (filled / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button onClick={() => copy('lista', listText(ev, items, signups))} className={`${primary} col-span-2`}><Copy aria-hidden size={20} /> {copied === 'lista' ? 'Lista copiada!' : 'Copiar lista p/ WhatsApp'}</button>
          <button onClick={() => window.print()} className={`${ghost} whitespace-nowrap !px-3 sm:!px-5`}><Printer aria-hidden size={20} /> Imprimir</button>
          <button onClick={() => copy('link', location.origin)} className={`${ghost} whitespace-nowrap !px-3 sm:!px-5`}><Link2 aria-hidden size={20} /> {copied === 'link' ? 'Link copiado!' : 'Copiar link'}</button>
          <button onClick={toggleClosed} className={`${ghost} col-span-2`}>
            {ev.closed ? <><LockOpen aria-hidden size={20} /> Reabrir escolhas</> : <><Lock aria-hidden size={20} /> Encerrar escolhas</>}
          </button>
        </div>
        {copied === 'erro' && <p role="alert" className="mt-3 text-base font-bold text-alerta">Não deu para copiar. Tente de novo ou use Imprimir.</p>}
        {ev.closed && <p className="mt-3 text-base text-tinta-suave">Os sócios só veem a lista. Você ainda pode adicionar ou tirar pessoas.</p>}
      </section>

      <div className="mt-12 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-bold text-tinta">Itens <span className="font-normal text-tinta-suave">({items.length})</span></h2>
      </div>

      <form onSubmit={addItem} className="mt-4 rounded-3xl bg-papel p-4 shadow-faixa ring-1 ring-linha sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPicking(!picking)} aria-expanded={picking} aria-label={`Ícone: ${ICONS[icon]}. Trocar`} className="flex items-center gap-1 rounded-2xl bg-mata-alta p-1.5 pr-2 ring-1 ring-tinta/10 hover:bg-folha">
            <img src={iconSrc(icon)} alt="" className="size-10" />
            <ChevronDown aria-hidden size={18} className={`transition-transform ${picking ? 'rotate-180' : ''}`} />
          </button>
          <input required maxLength={80} placeholder="Novo item (ex.: bolo)" aria-label="Nome do item" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} className={`${field} min-w-40 flex-1`} />
          <label className="flex items-center gap-2 text-base text-tinta-suave">
            <input required type="number" min={1} max={50} value={item.slots} onChange={(e) => setItem({ ...item, slots: e.target.value })} className={`${field} w-20 text-center`} />
            pessoas
          </label>
          <button className={`${primary} flex-1 sm:flex-none`}><Plus aria-hidden size={22} /> Adicionar</button>
        </div>
        {picking && <IconPicker value={icon} onChange={(k) => { setItem({ ...item, icon: k }); setPicking(false) }} />}
        {!picking && <p className="mt-2 text-base text-tinta-suave">O ícone é escolhido pelo nome. Toque nele para trocar.</p>}
      </form>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.length === 0 && <li className="text-lg">Nenhum item ainda.</li>}
        {items.map((it) => {
          const { taken } = itemStatus(it, signups)
          return (
            <li key={it.id} className="flex flex-col rounded-3xl bg-papel p-5 text-tinta shadow-faixa ring-1 ring-linha">
              {editing === it.id ? (
                <ItemEditor item={it} min={taken.length} onDone={() => setEditing(null)} save={(data) => updateDoc(doc(db, 'events', ev.id, 'items', it.id), data)} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <ItemIcon icon={it.icon ?? suggestIcon(it.name)} className="bg-mata-alta" />
                    <div className="-mr-2 -mt-1 flex">
                      <button onClick={() => setEditing(it.id)} aria-label={`Editar ${it.name}`} className="grid size-11 place-items-center rounded-xl text-tinta-suave hover:bg-mata-alta hover:text-tinta"><Pencil size={20} /></button>
                      <button onClick={() => removeItem(it)} aria-label={`Remover ${it.name}`} className="grid size-11 place-items-center rounded-xl text-tinta-suave hover:bg-alerta/10 hover:text-alerta"><Trash2 size={20} /></button>
                    </div>
                  </div>
                  <span className="mt-3 text-xl font-bold leading-snug">{it.name}</span>
                  <div className="mt-3"><Progress have={taken.length} need={it.slots} /></div>
                  <People list={taken} onRemove={removeSignup} />
                  <div className="mt-auto">
                    {adding === it.id ? (
                      <AddPerson onCancel={() => setAdding(null)} onAdd={(person) => addPerson(it, person).then(() => setAdding(null))} />
                    ) : (
                      taken.length < it.slots && (
                        <button onClick={() => setAdding(it.id)} className="mt-4 flex min-h-11 items-center gap-2 rounded-xl px-1 text-base font-bold text-tinta-suave underline-offset-4 hover:text-tinta hover:underline">
                          <UserPlus aria-hidden size={18} /> Adicionar pessoa
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>

      {extras.length > 0 && (
        <>
          <h2 className="mt-12 text-2xl font-bold text-tinta">Outras contribuições <span className="font-normal text-tinta-suave">({extras.length})</span></h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {extras.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-papel py-3 pl-4 pr-2 text-lg text-tinta shadow-faixa ring-1 ring-linha">
                <ItemIcon icon={suggestIcon(s.itemName)} className="!size-11 bg-mata-alta [&>img]:!size-7" />
                <span className="min-w-0 flex-1"><b className="block truncate">{s.itemName}</b><span className="text-base text-tinta-suave">{s.person}</span></span>
                <button onClick={() => removeSignup(s)} aria-label={`Tirar ${s.person}`} className="grid size-10 place-items-center rounded-xl text-tinta-suave hover:bg-alerta/10 hover:text-alerta"><X size={18} /></button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-16 border-t border-linha pt-6">
        <button onClick={removeEvent} className="flex min-h-11 items-center gap-2 text-base font-bold text-alerta underline-offset-4 hover:underline">
          <Trash2 aria-hidden size={18} /> Apagar esta sessão
        </button>
      </div>
    </div>
    </>
  )
}

// Only shown when printing: one row per person, with a box to tick in the kitchen.
function PrintList({ ev, items, signups }) {
  const rows = [
    ...items.flatMap((it) => {
      const { taken, left } = itemStatus(it, signups)
      return [...taken.map((s) => [it.name, s.person]), ...Array.from({ length: left }, () => [it.name, ''])]
    }),
    ...signups.filter((s) => !s.itemId).map((s) => [s.itemName, s.person]),
  ]
  return (
    <div className="hidden text-black print:block">
      <h1 className="text-2xl font-bold">Lanche — {ev.name}</h1>
      <p className="mt-1 first-letter:uppercase">{fmtDate(ev.date)}</p>
      <table className="mt-6 w-full border-collapse text-lg">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="w-10 py-2" aria-label="Chegou" />
            <th className="py-2">Item</th>
            <th className="py-2">Quem leva</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([item, person], i) => (
            <tr key={i} className="break-inside-avoid border-b border-black/30">
              <td className="py-2"><span className="block size-5 border-2 border-black" /></td>
              <td className="py-2 pr-4">{item}</td>
              <td className="py-2">{person || <span className="text-black/50">(sem ninguém)</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function People({ list, onRemove }) {
  if (!list.length) return null
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {list.map((s) => (
        <li key={s.id} className="flex items-center gap-1 rounded-full bg-mata-alta py-0.5 pl-3.5 pr-0.5 text-base">
          {s.person}
          <button onClick={() => onRemove(s)} aria-label={`Tirar ${s.person}`} className="grid size-9 place-items-center rounded-full text-tinta-suave hover:bg-alerta/10 hover:text-alerta"><X size={18} /></button>
        </li>
      ))}
    </ul>
  )
}

function IconPicker({ value, onChange, compact }) {
  return (
    <div role="radiogroup" aria-label="Ícone" className={`mt-3 grid gap-1.5 ${compact ? 'grid-cols-6' : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'}`}>
      {Object.entries(ICONS).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={label}
          title={label}
          onClick={() => onChange(key)}
          className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs text-tinta ${value === key ? 'bg-folha ring-2 ring-tinta' : 'hover:bg-mata-alta'}`}
        >
          <img src={iconSrc(key)} alt="" className={compact ? 'size-7' : 'size-9'} />
          {!compact && <span className="w-full truncate text-center">{label}</span>}
        </button>
      ))}
    </div>
  )
}

function ItemEditor({ item, min, save, onDone }) {
  const [v, setV] = useState({ name: item.name, slots: item.slots, icon: item.icon ?? suggestIcon(item.name) ?? 'outro' })
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        await save({ name: v.name.trim(), slots: Number(v.slots), icon: v.icon })
        onDone()
      }}
    >
      <div className="flex gap-2">
        <input required maxLength={80} aria-label="Nome do item" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={`${field} min-w-0 flex-1 !px-4 !py-3 !text-lg`} />
        <input required type="number" min={Math.max(1, min)} max={50} aria-label="Quantas pessoas" value={v.slots} onChange={(e) => setV({ ...v, slots: e.target.value })} className={`${field} w-20 !px-2 !py-3 text-center !text-lg`} />
      </div>
      {min > 0 && <p className="mt-1 text-sm text-tinta-suave">Mínimo {min}: já tem {min} {min > 1 ? 'pessoas' : 'pessoa'}.</p>}
      <IconPicker value={v.icon} onChange={(k) => setV({ ...v, icon: k })} compact />
      <div className="mt-4 flex gap-2">
        <button className={`${primary} !min-h-11 !px-4 !text-base`}>Salvar</button>
        <button type="button" onClick={onDone} className="min-h-11 rounded-2xl px-4 text-base font-bold ring-1 ring-tinta/25">Cancelar</button>
      </div>
    </form>
  )
}

function AddPerson({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) onAdd(name.trim())
      }}
    >
      <input autoFocus maxLength={60} placeholder="Nome da pessoa" aria-label="Nome da pessoa" value={name} onChange={(e) => setName(e.target.value)} className={`${field} min-w-0 flex-1 !px-4 !py-2 !text-base`} />
      <button className={`${primary} !min-h-11 !px-4 !text-base`} disabled={!name.trim()}>Ok</button>
      <button type="button" onClick={onCancel} aria-label="Cancelar" className="grid size-11 place-items-center rounded-2xl ring-1 ring-tinta/25"><X size={18} /></button>
    </form>
  )
}
