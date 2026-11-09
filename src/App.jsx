import { collection, limit, orderBy, query, serverTimestamp, where, writeBatch } from 'firebase/firestore'
import { CalendarDays, Check, Lock, Plus, Smartphone, UserRound, WifiOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Admin from './Admin.jsx'
import { addChoice, db, removeChoice, useOnline, useSnap, useUid } from './firebase.js'
import { iconSrc } from './icons.js'
import { fmtDate, freeSlot, itemStatus, suggestIcon, today } from './lib.js'

export default function App() {
  return location.pathname.startsWith('/admin') ? <Admin /> : <Home />
}

const storage = {
  get: (k) => { try { return localStorage.getItem(k) || '' } catch { return '' } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
}

export function Shell({ children }) {
  // Bottom padding keeps the fixed confirm bar from ever covering content.
  return <main className="mx-auto min-h-dvh max-w-7xl px-4 pb-40 pt-10 sm:px-8 sm:pt-14">{children}</main>
}

export const field = 'rounded-xl bg-papel px-4 py-3.5 text-xl text-tinta ring-1 ring-tinta/20 transition-shadow placeholder:text-tinta-suave/70 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-tinta/70'
export const primary = 'flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-tinta px-6 text-lg font-bold text-papel shadow-faixa transition-transform active:scale-[0.98] disabled:bg-musgo disabled:text-tinta-suave disabled:shadow-none'

function Home() {
  const uid = useUid()
  const day = today()
  const events = useSnap(query(collection(db, 'events'), where('date', '>=', day), orderBy('date'), limit(1)), [day])
  const ev = events?.[0]
  const items = useSnap(ev && query(collection(db, 'events', ev.id, 'items'), orderBy('createdAt')), [ev?.id])
  // Public slots (no names) for the counts; the member's own choices (with names) to show and cancel.
  const taken = useSnap(ev && collection(db, 'events', ev.id, 'taken'), [ev?.id])
  const mine = useSnap(ev && uid && query(collection(db, 'events', ev.id, 'signups'), where('uid', '==', uid)), [ev?.id, uid])
  const online = useOnline()

  const [name, setName] = useState(() => storage.get('nome'))
  const [picked, setPicked] = useState(() => new Set()) // item ids chosen but not confirmed yet
  const [extra, setExtra] = useState('') // text being typed in "outra coisa"
  const [extras, setExtras] = useState([]) // "outra coisa" entries added, not confirmed yet
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const nameRef = useRef(null)
  const dialogRef = useRef(null)
  const install = useInstallPrompt()

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 4000)
    return () => clearTimeout(t)
  }, [done])

  if (!events) return <Shell><Offline online={online} /><p className="text-xl">Carregando…</p></Shell>
  if (!ev)
    return (
      <Shell>
        <h1 className="text-3xl font-bold text-tinta">Nenhuma sessão marcada</h1>
        <p className="mt-3 text-lg">Quando a próxima for marcada, ela aparece aqui.</p>
      </Shell>
    )

  const toggle = (id) =>
    setPicked((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const addExtra = () => {
    if (extra.trim()) setExtras((x) => [...x, extra.trim()])
    setExtra('')
  }
  // Everything that "Confirmar" will save, in display order. Typed-but-not-added text counts too.
  const chosen = [
    ...(items ?? []).filter((it) => picked.has(it.id)).map((it) => ({ key: it.id, name: it.name, icon: it.icon ?? suggestIcon(it.name) })),
    ...[...extras, ...(extra.trim() ? [extra.trim()] : [])].map((t, i) => ({ key: 'x' + i, name: t, icon: suggestIcon(t) })),
  ]
  const pending = chosen.length

  // Step 1 of confirming: check the name, then show the review dialog.
  function review() {
    if (!online) {
      setMsg('Sem internet agora. Quando voltar, toque em Confirmar de novo.')
      return
    }
    if (!name.trim()) {
      setMsg('Primeiro escreva seu nome aqui.')
      nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      nameRef.current?.focus()
      return
    }
    setMsg('')
    dialogRef.current?.showModal()
  }

  async function confirm() {
    const person = name.trim()
    if (!uid || !items || !taken) return
    setSaving(true)
    const b = writeBatch(db)
    for (const it of items) {
      const slot = picked.has(it.id) ? freeSlot(it, taken) : -1
      if (slot >= 0) addChoice(b, db, ev.id, { itemId: it.id, itemName: it.name, slot, person, uid, createdAt: serverTimestamp() })
    }
    for (const t of [...extras, extra.trim()]) if (t) addChoice(b, db, ev.id, { itemId: null, itemName: t, person, uid, createdAt: serverTimestamp() })
    try {
      await b.commit()
      setPicked(new Set())
      setExtras([])
      setExtra('')
      setDone(true)
    } catch (e) {
      console.error(e)
      setMsg(
        e.code === 'permission-denied'
          ? 'Alguém escolheu o mesmo item agora mesmo. Confira a lista e confirme de novo.'
          : 'Não foi possível confirmar. Verifique a internet e tente de novo.',
      )
    } finally {
      dialogRef.current?.close()
      setSaving(false)
    }
  }

  // A shared phone has one anonymous account, so "mine" also needs the same name.
  // When someone else types their name, the previous person's choices stop showing as theirs.
  const isMine = (s) => s.uid === uid && s.person.trim().toLowerCase() === name.trim().toLowerCase()
  const otherPerson = () => {
    setName('')
    storage.set('nome', '')
    setPicked(new Set())
    setExtras([])
    setExtra('')
    nameRef.current?.focus()
  }
  const closed = !!ev.closed

  function cancel(s) {
    if (!window.confirm(`Cancelar "${s.itemName}"? Ele volta para a lista e outra pessoa pode escolher.`)) return
    const b = writeBatch(db)
    removeChoice(b, db, ev.id, s)
    b.commit().catch(() => setMsg('Não foi possível cancelar. Verifique a internet e tente de novo.'))
  }

  const mineExtras = mine?.filter((s) => isMine(s) && !s.itemId) ?? []
  const mineAll = mine?.filter(isMine) ?? []

  return (
    <Shell>
      <Offline online={online} />
      <header className="max-w-3xl">
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-tinta sm:text-5xl">{ev.name}</h1>
        <p className="mt-3 flex items-center gap-2 text-xl text-tinta-suave">
          <CalendarDays aria-hidden size={22} /> <span className="first-letter:uppercase">{fmtDate(ev.date)}</span>
        </p>
      </header>

      <section className="mt-10 max-w-xl">
        <label htmlFor="nome" className="text-xl font-bold text-tinta">1. Seu nome</label>
        <input
          id="nome"
          ref={nameRef}
          value={name}
          onChange={(e) => { setName(e.target.value); storage.set('nome', e.target.value); if (e.target.value.trim()) setMsg('') }}
          autoComplete="name"
          autoCapitalize="words"
          maxLength={60}
          placeholder="Seu nome"
          className={`${field} mt-3 block w-full`}
        />
        <p role="alert" className="mt-2 min-h-7 text-lg font-bold text-alerta">{msg}</p>
        {mineAll.length > 0 && (
          <p className="mb-3 flex items-start gap-3 rounded-2xl bg-folha/60 px-5 py-3 text-lg text-tinta ring-1 ring-tinta/15">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-tinta text-papel"><Check aria-hidden size={15} strokeWidth={3.5} /></span>
            <span>Você vai levar: <b>{mineAll.map((s) => s.itemName).join(', ')}</b></span>
          </p>
        )}
        {name.trim() && !closed && (
          <button onClick={otherPerson} className="flex min-h-11 items-center gap-2 text-lg text-tinta-suave underline underline-offset-4">
            <UserRound aria-hidden size={20} /> Escolher para outra pessoa
          </button>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold text-tinta">2. Escolha o que você vai levar</h2>
        {closed ? (
          <p className="mt-3 flex max-w-xl items-center gap-3 rounded-2xl bg-mata-alta px-5 py-4 text-lg font-bold text-tinta">
            <Lock aria-hidden size={22} className="shrink-0" /> As escolhas para esta sessão foram encerradas. Obrigado!
          </p>
        ) : (
          <p className="mt-1 text-lg text-tinta-suave">Toque nos itens e depois em <b className="text-tinta">Confirmar</b>, lá embaixo.</p>
        )}

        {!items || !taken ? (
          <p className="mt-6 text-lg">Carregando…</p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {items.length === 0 && <li className="col-span-full text-lg">A lista ainda não foi montada.</li>}
            {items.map((it) => {
              const have = itemStatus(it, taken).taken.length
              const own = mine?.find((s) => s.itemId === it.id && isMine(s))
              return (
                <li key={it.id} className="h-full">
                  <ItemCard item={it} have={have} mine={own} closed={closed} picked={picked.has(it.id)} onToggle={() => toggle(it.id)} onCancel={() => cancel(own)} />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="mt-14 max-w-xl">
        {!closed && <>
        <label htmlFor="extra" className="text-xl font-bold text-tinta">Quer levar outra coisa?</label>
        <div className="mt-3 flex gap-2">
          <input
            id="extra"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && pending) { e.preventDefault(); review() } }}
            maxLength={80}
            placeholder="Escreva aqui"
            className={`${field} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={addExtra}
            disabled={!extra.trim()}
            className="flex min-h-14 shrink-0 items-center gap-1.5 rounded-2xl bg-mata-alta px-4 text-lg font-bold text-tinta ring-1 ring-tinta/20 hover:bg-folha disabled:opacity-50"
          >
            <Plus aria-hidden size={20} strokeWidth={2.5} /> Adicionar
          </button>
        </div>

        {extras.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {extras.map((t, i) => (
              <li key={i} className="flex items-center gap-1 rounded-full bg-papel py-1 pl-4 pr-1 text-lg text-tinta ring-2 ring-tinta">
                {t}
                <button onClick={() => setExtras((x) => x.filter((_, j) => j !== i))} aria-label={`Tirar ${t}`} className="grid size-10 place-items-center rounded-full">
                  <X size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        </>}

        {mineExtras.length > 0 && (
          <ul className="mt-4 space-y-2">
            {mineExtras.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-folha/60 px-5 py-2 text-lg text-tinta ring-1 ring-tinta/15">
                <span className="flex items-center gap-2 font-bold"><Check aria-hidden size={20} strokeWidth={3} /> {s.itemName}</span>
                {!closed && (
                  <button onClick={() => cancel(s)} className="flex min-h-11 items-center gap-1 rounded-xl px-2 font-bold text-alerta">
                    <X aria-hidden size={18} /> Cancelar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {install && (
        <button onClick={install} className="mt-14 flex min-h-11 items-center gap-2 text-lg text-tinta-suave underline underline-offset-4">
          <Smartphone aria-hidden size={20} /> Colocar o app na tela inicial do celular
        </button>
      )}

      {/* Fixed bar: appears over the page, so nothing above it moves. */}
      {(pending > 0 || done) && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-linha bg-papel shadow-ergue">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-8">
            {pending > 0 ? (
              <>
                <p className="flex-1 text-lg">
                  <b>{pending}</b> {pending > 1 ? 'itens escolhidos' : 'item escolhido'}
                </p>
                <button onClick={review} className={`${primary} min-w-44`}>
                  <Check aria-hidden size={22} strokeWidth={3} /> Confirmar
                </button>
              </>
            ) : (
              <p role="status" className="flex min-h-14 flex-1 items-center gap-3 text-lg font-bold text-tinta">
                <span className="grid size-8 place-items-center rounded-full bg-tinta text-papel"><Check aria-hidden size={18} strokeWidth={3} /></span>
                Confirmado! Obrigado.
              </p>
            )}
          </div>
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="revisao"
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-3xl bg-papel p-6 text-tinta shadow-ergue backdrop:bg-tinta/40 sm:p-8"
      >
        <h2 id="revisao" className="text-2xl font-bold">Está certo?</h2>
        <p className="mt-2 text-lg text-tinta-suave">
          <b className="text-tinta">{name.trim()}</b>, você vai levar:
        </p>
        <ul className="mt-4 space-y-2">
          {chosen.map((c) => (
            <li key={c.key} className="flex items-center gap-3 text-xl font-bold">
              <ItemIcon icon={c.icon} className="bg-mata-alta" /> {c.name}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={() => dialogRef.current?.close()} className="min-h-14 rounded-2xl px-6 text-lg font-bold ring-1 ring-tinta/25">
            Voltar e mudar
          </button>
          <button onClick={confirm} disabled={saving} autoFocus className={primary}>
            <Check aria-hidden size={22} strokeWidth={3} /> {saving ? 'Salvando…' : 'Sim, confirmar'}
          </button>
        </div>
      </dialog>
    </Shell>
  )
}

// Filled pills, one per needed person. The text carries the same info for screen readers and color-blind users.
export function Progress({ have, need }) {
  return (
    <span className="block">
      <span aria-hidden className="flex flex-wrap gap-1">
        {Array.from({ length: need }, (_, i) => (
          <span key={i} className={`h-2 w-5 rounded-full ${i < have ? 'bg-tinta' : 'bg-tinta/15'}`} />
        ))}
      </span>
      <span className="mt-1.5 block text-base">
        {have ? <>Já tem <b>{Math.min(have, need)}</b> de {need}</> : <>Precisa de <b>{need}</b></>}
      </span>
    </span>
  )
}

export function ItemIcon({ icon, className = '' }) {
  return (
    <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${className}`}>
      <img src={iconSrc(icon)} alt="" className="size-9" />
    </span>
  )
}

function ItemCard({ item, have, mine, closed, picked, onToggle, onCancel }) {
  const full = have >= item.slots
  const base = 'relative flex h-full min-h-48 w-full flex-col gap-3 rounded-3xl p-5 text-left transition-[background-color,box-shadow,transform] duration-200 ease-out'
  const title = <span className="block min-w-0 hyphens-auto text-lg font-bold leading-snug sm:text-xl">{item.name}</span>

  if (mine)
    return (
      <div className={`${base} bg-folha/60 text-tinta ring-1 ring-tinta/15`}>
        <ItemIcon icon={item.icon ?? suggestIcon(item.name)} className="bg-papel" />
        {title}
        <span className="mt-auto">
          <span className="flex items-center gap-2 text-base font-bold">
            <span className="grid size-6 place-items-center rounded-full bg-tinta text-papel"><Check aria-hidden size={15} strokeWidth={3.5} /></span>
            Você vai levar
          </span>
          {!closed && (
            <button onClick={onCancel} className="mt-3 min-h-11 w-full rounded-xl bg-papel text-base font-bold text-alerta ring-1 ring-tinta/15 hover:ring-alerta/40">
              Cancelar
            </button>
          )}
        </span>
      </div>
    )

  if (closed && !full)
    return (
      <div className={`${base} bg-papel text-tinta ring-1 ring-linha`}>
        <ItemIcon icon={item.icon ?? suggestIcon(item.name)} className="bg-mata-alta" />
        {title}
        <span className="mt-auto"><Progress have={have} need={item.slots} /></span>
      </div>
    )

  if (full)
    return (
      <div className={`${base} bg-musgo text-tinta-suave`}>
        <ItemIcon icon={item.icon ?? suggestIcon(item.name)} className="bg-papel/60 [&>img]:opacity-60 [&>img]:grayscale" />
        {title}
        <span className="mt-auto text-base font-bold">Completo</span>
      </div>
    )

  return (
    <button
      onClick={onToggle}
      aria-pressed={picked}
      className={`${base} bg-papel text-tinta shadow-faixa active:scale-[0.98] ${picked ? 'ring-[3px] ring-tinta' : 'ring-1 ring-linha hover:shadow-ergue'}`}
    >
      <span
        aria-hidden
        className={`absolute right-4 top-4 grid size-8 place-items-center rounded-full transition-colors ${picked ? 'bg-tinta text-papel' : 'ring-2 ring-tinta/25'}`}
      >
        {picked && <Check size={18} strokeWidth={3.5} />}
      </span>
      <ItemIcon icon={item.icon ?? suggestIcon(item.name)} className="bg-mata-alta" />
      {title}
      <span className="mt-auto"><Progress have={have} need={item.slots} /></span>
    </button>
  )
}

// Android/Chrome offers "install" through this event; iPhone has no API (Compartilhar > Tela de Início).
function useInstallPrompt() {
  const [ev, setEv] = useState(null)
  useEffect(() => {
    const on = (e) => {
      e.preventDefault()
      setEv(e)
    }
    window.addEventListener('beforeinstallprompt', on)
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])
  return ev && (() => ev.prompt().finally(() => setEv(null)))
}

function Offline({ online }) {
  if (online) return null
  return (
    <p role="status" className="mb-6 flex items-center gap-3 rounded-2xl bg-sol/40 px-5 py-3 text-lg font-bold text-tinta">
      <WifiOff aria-hidden size={22} className="shrink-0" /> Sem internet. A lista pode estar desatualizada.
    </p>
  )
}
