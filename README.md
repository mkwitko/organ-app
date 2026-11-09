# App da Organ — Lanche da sessão

Um link para combinar **quem leva o quê** no lanche de cada sessão, no lugar da conversa longa no WhatsApp.

**No ar:** https://app-da-organ.web.app · **Organização:** https://app-da-organ.web.app/admin

Este guia tem três partes:

1. [Para os sócios](#para-os-sócios): como escolher o que levar.
2. [Para a organização](#para-a-organização): como montar a lista e acompanhar.
3. [Para técnicos](#para-técnicos): como o app funciona, como rodar e como publicar.

---

## Para os sócios

Você só precisa do link que chega pelo grupo do WhatsApp. Não precisa criar conta nem senha.

1. **Abra o link.** Aparecem o nome e a data da próxima sessão.
2. **Escreva seu nome** no campo "1. Seu nome". O celular guarda o nome para a próxima vez.
3. **Toque nos itens** que você vai levar. O item escolhido ganha uma borda escura e um ✓.
4. Para levar algo que não está na lista, escreva em **"Quer levar outra coisa?"** e toque em **Adicionar**.
5. Toque em **Confirmar**, no rodapé da tela. Confira o resumo e toque em **Sim, confirmar**.

Pronto. No alto da página aparece **"Você vai levar: …"**, e o card do item fica verde.

**Dúvidas comuns**

- **Mudei de ideia.** Toque em **Cancelar** no card do item. O app pergunta antes de cancelar, e o item volta para a lista.
- **Quero escolher para outra pessoa no meu celular.** Toque em **Escolher para outra pessoa**, escreva o nome dela e escolha normalmente.
- **O item está cinza e escrito "Completo".** Esse item já tem gente suficiente. Escolha outro.
- **Apareceu "As escolhas foram encerradas".** A organização fechou a lista. Se precisar mudar algo, fale com ela.
- **Meu nome aparece para todo mundo?** Não. Os outros sócios veem só quantas pessoas já escolheram cada item. Os nomes aparecem apenas para a organização.
- **Quero o app na tela inicial.** No Android, toque em **Colocar o app na tela inicial do celular**, no fim da página. No iPhone, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.

---

## Para a organização

Entre em **`/admin`** com seu email e senha. Quem cuida do app cria esse acesso (veja [Gerenciar quem é da organização](#gerenciar-quem-é-da-organização)).

### Montar uma sessão

1. Toque em **Nova sessão**. Escreva o nome (por exemplo "Sessão de Escala") e a data.
2. Para não digitar tudo de novo, escolha em **Copiar os itens de** uma sessão anterior.
3. Para adicionar itens, escreva o nome (por exemplo "Melancia") e quantas pessoas devem levar. Se quiser, escreva uma instrução (por exemplo "Trazer fatiada"). Toque em **Adicionar**. O ícone é escolhido pelo nome. Para trocar, toque no ícone e busque pelo nome ("manga", "café"…). Para ficar sem ícone, escolha **Sem ícone**.
4. Toque em **Copiar link** e mande o link no grupo.

A página dos sócios sempre mostra a **próxima** sessão, ou seja, a de data mais próxima, a partir de hoje.

### Acompanhar

- O cartão do alto mostra quantos lugares já foram preenchidos e quantas pessoas escolheram.
- Cada item mostra **quem vai levar**. Para tirar uma pessoa, toque no **×** ao lado do nome.
- **Adicionar pessoa:** use para quem pediu por telefone ou pessoalmente.
- O **lápis** edita o nome, a quantidade e o ícone do item. A **lixeira** remove o item.
- **Outras contribuições** lista o que os sócios escreveram fora da lista.

### Fechar e compartilhar

- **Copiar lista p/ WhatsApp:** copia a lista com os nomes, pronta para colar no grupo.
- **Imprimir:** gera uma folha com uma caixinha para marcar na cozinha o que chegou.
- **Encerrar escolhas:** a partir daí os sócios só veem a lista. A organização ainda pode mudar tudo. **Reabrir escolhas** desfaz.
- **Apagar esta sessão**, no fim da página, apaga a sessão com todos os itens e nomes. Não dá para desfazer.

---

## Para técnicos

### Visão geral

| Parte | O que usa |
|---|---|
| Página | React 19 + Vite + Tailwind CSS 4, fonte Atkinson Hyperlegible Next |
| Dados | Cloud Firestore, com cache local (abre com sinal fraco) |
| Login | Firebase Auth: anônimo para sócios, email e senha para a organização |
| Proteção | Regras do Firestore (`firestore.rules`) + App Check com reCAPTCHA Enterprise |
| Hospedagem | Firebase Hosting (projeto `organ-app-6e194`) |
| Ícones | Fluent Emoji Flat (MIT, Microsoft) em `public/icons/` |

Não há servidor próprio. A página fala direto com o Firestore, e as regras do banco garantem tudo o que importa: limite de vagas, privacidade dos nomes, sessão encerrada e acesso de admin.

### Estrutura

```
src/
  App.jsx        página do sócio (e roteia /admin)
  Admin.jsx      login e painel da organização
  firebase.js    configuração do Firebase, App Check, cache, hooks useSnap/useUser
  lib.js         funções puras: datas, contagem de vagas, texto do WhatsApp, sugestão de ícone
  icons.js       lista de ícones disponíveis
  lib.test.js    testes das funções puras
tests/
  rules.test.js  testes das regras do Firestore (rodam no emulador)
firestore.rules  regras de segurança do banco
firebase.json    Hosting (cabeçalhos de segurança e cache) e emuladores
DESIGN.md        sistema visual (cores, tipografia, componentes)
PRODUCT.md       público, objetivo e princípios do produto
```

### Rodar no computador (sem conta no Firebase)

Precisa de Node 20 ou mais novo e Java (para o emulador do Firestore).

```bash
npm install
npm run emu        # terminal 1: emuladores do Firestore e do Auth
npm run dev:emu    # terminal 2: app em http://localhost:5199
```

O emulador começa vazio. Para usar o `/admin` localmente, crie uma conta de teste (`admin@teste.com` / `teste123`):

```bash
node -e "fetch('http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@teste.com',password:'teste123'})}).then(()=>fetch('http://localhost:8080/v1/projects/demo-lanche/databases/(default)/documents/admins/admin@teste.com',{method:'PATCH',headers:{Authorization:'Bearer owner'},body:'{\"fields\":{}}'})).then(r=>console.log(r.status))"
```

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev:emu` | App local ligado aos emuladores |
| `npm test` | Testes das funções puras |
| `npm run test:rules` | Testes das regras do Firestore. Sobe um emulador próprio na porta 8080, então pare o `npm run emu` antes |
| `npm run lint` | Lint (oxlint) |
| `npm run build` | Gera `dist/` |
| `npm run deploy` | Roda os dois testes, gera o build e publica o site **e** as regras juntos |

### Publicar

Configuração feita uma vez:

1. No Firebase, ative o **Firestore** e, em **Authentication → Sign-in method**, ative **Anônimo** e **Email/senha**.
2. Em **Authentication → Settings → User actions**, desligue **Enable create (sign-up)**. Assim, só o console cria contas.
3. Copie `.env.example` para `.env` e preencha com a configuração do app web, que fica no console em *Configurações do projeto*.
4. Faça login uma vez: `npx firebase login`.

Depois, toda publicação é um comando só:

```bash
npm run deploy
```

O `index.html` vai sem cache (`no-cache`), então quem abrir o link recebe a versão nova na hora. Os arquivos em `/assets` têm nome com hash e ficam em cache por um ano.

### Variáveis de ambiente (`.env`)

| Variável | Para quê |
|---|---|
| `VITE_FB_API_KEY`, `VITE_FB_AUTH_DOMAIN`, `VITE_FB_PROJECT_ID`, `VITE_FB_APP_ID` | Configuração do app web no Firebase. Não são segredos: a proteção vem das regras e do App Check |
| `VITE_SITE_URL` | Endereço público, sem `/` no fim. Usado na prévia do link no WhatsApp |
| `VITE_RECAPTCHA_KEY` | Chave do reCAPTCHA Enterprise para o App Check. Vazia = App Check desligado |

O `.env` não vai para o Git.

### Gerenciar quem é da organização

Tudo pelo console do Firebase:

- **Adicionar:** em *Authentication → Users*, clique em *Add user* (email e senha). Depois, no Firestore, crie na coleção `admins` um documento cujo **ID é o email** ou o **UID** da pessoa. O documento não precisa de campos. Cuidado com espaços antes ou depois do ID.
- **Remover:** apague o documento em `admins`. Se quiser, desative também o usuário em Authentication.
- **Esqueceu a senha:** a pessoa toca em **Esqueci a senha** no `/admin` e recebe um email.

### App Check

O App Check bloqueia programas que tentam usar o banco fora do site.

1. No [Google Cloud → reCAPTCHA](https://console.cloud.google.com/security/recaptcha?project=organ-app-6e194), crie uma chave do tipo **Site** para os domínios `app-da-organ.web.app`, `organ-app-6e194.web.app` e `organ-app-6e194.firebaseapp.com`, **sem** o desafio de caixa de seleção.
2. No [Firebase → App Check](https://console.firebase.google.com/project/organ-app-6e194/appcheck), registre o app web com essa chave.
3. Coloque a chave em `VITE_RECAPTCHA_KEY` e rode `npm run deploy`.
4. Depois de 1 ou 2 dias, veja se quase 100% das requisições aparecem como verificadas. Só então ative **Aplicar** (Enforce) no Firestore e no Authentication.

> Aplicar antes de publicar a chave derruba o app para todo mundo. Para voltar, desligue o Enforce.

### Modelo de dados

```
admins/{email ou uid}                     vazio; existir = ser admin
events/{id}                               name, date (YYYY-MM-DD), closed?, createdAt
events/{id}/items/{itemId}                name, slots, icon ('' = sem ícone), note?, createdAt
events/{id}/taken/{itemId}_{slot}         itemId, uid, slot           ← público, sem nome
events/{id}/signups/{itemId}_{slot}       itemId, itemName, slot, person, uid, createdAt   ← privado
events/{id}/signups/{auto}                itemId = null, itemName, person, uid  ← "outra coisa"
```

Cada escolha de item grava **dois documentos com o mesmo ID**, na mesma operação: `taken`, que é público e sem nome, e `signups`, que é privado e tem o nome. A página do sócio conta vagas pelo `taken` e lê do `signups` só as próprias escolhas.

### Como as regras protegem

- **Sem passar do limite:** o ID da vaga é `{itemId}_{slot}`, com `slot < item.slots`. Criar um documento que já existe conta como atualização, que é proibida. Assim, duas pessoas confirmando no mesmo segundo nunca pegam a mesma vaga.
- **Nomes privados:** `signups` só pode ser lido pelo próprio autor (mesma conta anônima) e por admins.
- **Cada um mexe no que é seu:** cancelar exige o mesmo `uid`. Em um celular compartilhado, a página também compara o nome, e **Escolher para outra pessoa** limpa o nome.
- **Sessão encerrada:** com `closed: true`, só admins criam ou apagam escolhas.
- **Admin:** precisa ter entrado com email e senha **e** ter documento em `admins/{email}` ou `admins/{uid}`.
- **Dois logins no mesmo navegador:** o `/admin` usa uma segunda instância do Firebase. Assim, o login da organização nunca substitui a conta anônima de sócio.

Os casos acima estão cobertos em `tests/rules.test.js`. Rode `npm run test:rules` depois de mudar as regras.

### Design

As decisões visuais estão em `DESIGN.md`, e o público e os princípios em `PRODUCT.md`. Em resumo: o público é de pessoas mais velhas, no celular. Por isso o app usa texto grande, áreas de toque de pelo menos 44px, contraste alto e nada que dependa só de cor. Também não traduz a página automaticamente (`translate="no"`), porque a tradução do Chrome quebra a interface.
