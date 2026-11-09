# Lanche da sessão

Members open the link, type their name once, and tap what they will bring. Organizers use `/admin`.

## Local (no Firebase account needed)

```bash
npm install
npm run emu        # terminal 1: Firestore + Auth emulators
npm run dev:emu    # terminal 2: app at http://localhost:5173
```

The emulator starts empty. To use `/admin` locally, create an admin account (`admin@teste.com` / `teste123`):

```bash
node -e "fetch('http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@teste.com',password:'teste123'})}).then(()=>fetch('http://localhost:8080/v1/projects/demo-lanche/databases/(default)/documents/admins/admin@teste.com',{method:'PATCH',headers:{Authorization:'Bearer owner'},body:'{\"fields\":{}}'})).then(r=>console.log(r.status))"
```

## Production

1. Create a Firebase project. Enable **Firestore** and, in **Authentication > Sign-in method**, enable **Anonymous** and **Email/Password**.
2. In **Authentication > Settings > User actions**, turn off **Enable create (sign-up)**. Only the console can create accounts then.
3. Copy `.env.example` to `.env` and fill it with the web app config from the Firebase console. Set `VITE_SITE_URL` to the public address (for example `https://your-project.web.app`) so the WhatsApp link preview shows the image.
4. Set your project in `.firebaserc` (or run `firebase use <project-id>`). Log in once with `npx firebase login`.
5. `npm run deploy`. It builds and publishes the site to Firebase Hosting together with the Firestore rules, so the rules never fall behind.

### Managing admins (all in the Firebase console)

- **Add:** in Authentication > Users, click *Add user* (email + password). Then in Firestore, create a document in collection `admins` whose **ID is that email** (no fields needed).
- **Remove:** delete the `admins/{email}` document. Access ends on the next write. Optionally also disable or delete the user in Authentication.
- **Forgot password:** the admin taps *Esqueci a senha* on `/admin` and receives a reset email.

## How it works

- `events/{id}`: name, date (`YYYY-MM-DD`). The home page shows the next event with date ≥ today.
- `events/{id}/items/{id}`: name, slots.
- `events/{id}/signups/{id}`: person, itemId (null for a free-form item), itemName, uid. Item signups use the id `{itemId}_{slot}`; the rules only allow `slot < item.slots` and never overwrite, so an item cannot be overbooked even when two people confirm at the same moment.
- Every visitor signs in anonymously, so each phone can undo its own choices. On a shared phone, "mine" also needs the same name, and *Escolher para outra pessoa* clears the name for the next person.
- `/admin` uses a second Firebase app instance, so the organizer's login never replaces the member's anonymous account in the same browser.
- `events/{id}.closed`: when true ("Encerrar escolhas"), the rules block member signups and cancels; admins can still edit.
- Admin access: `firestore.rules` allows writes to events and items only for users who signed in with email/password **and** have a doc `admins/{email}`.

Organizers can edit items (name, number of people, icon), add a person to an item for members who call instead of using the app, and start a new session by copying the items of an earlier one.

`npm test` checks the slot count and the WhatsApp list text.
