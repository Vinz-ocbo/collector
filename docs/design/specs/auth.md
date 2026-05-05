# Specs — Auth & Onboarding

Écrans 1 à 6. Wireframes : [`../wireframes/auth.md`](../wireframes/auth.md).

---

## #1 — Splash / chargement

**Wireframe** : auth.md #1

**Objectif** : combler la latence d'hydratation initiale sans laisser un écran blanc.

**Données** : aucune.

**Composants** : logo, indicateur de chargement (spinner ou skeleton selon préférence).

**Interactions** : aucune (passive).

**États**
- `default` : visible si l'app met > 200 ms à hydrater.
- `error` : si l'hydratation échoue à plus de 5 s, basculer sur l'écran #58 (erreur globale).

**Edge cases**
- Service Worker en cours d'install au premier lancement → splash visible plus longtemps. Acceptable car one-shot.
- Bundle non chargé (panne CDN) : timeout 8 s → écran d'erreur avec retry.

**A11y**
- `<main role="status" aria-live="polite">` avec texte "Chargement de l'application…".
- `prefers-reduced-motion` : indicateur statique.

**Perf**
- Inline dans `index.html` (pas de JS requis pour l'afficher).
- Logo en SVG inlined, < 5 KB.

**Critères d'acceptation**
- [ ] Visible si hydratation > 200 ms.
- [ ] Disparaît dès que la première route est rendue.
- [ ] Aucun saut de layout au remplacement (CLS = 0).

---

## #2 — Connexion (`/auth/login`)

**Wireframe** : auth.md #2

**Objectif** : authentifier un utilisateur existant via OAuth ou email/mot de passe.

**Données affichées**
- Liste des providers OAuth disponibles (depuis config).
- Aucun pré-remplissage email (sécurité — pas de cookie tiers).

**Composants**
- Logo + titre.
- Boutons OAuth (1 par provider).
- Séparateur "ou".
- Form : Input email + Input password (avec toggle visibilité), Lien "Mot de passe oublié", CTA "Se connecter", lien "Inscription".

**Interactions**
- **Tap provider OAuth** → redirection vers le provider (Auth0/Clerk/Supabase). Au retour : `/auth/callback`.
- **Frappe email/mdp** → validation Zod en blur (pas en frappe pour ne pas spammer).
- **Toggle 👁 visibilité mdp** → bascule type input password ↔ text. `aria-pressed` reflété.
- **Tap "Mot de passe oublié"** → navigation `/auth/forgot`.
- **Tap "Se connecter"** → soumet, désactive le bouton, affiche "Connexion…", appel API.
- **Succès** → redirection vers `?redirect=` ou `/collection` par défaut.
- **Échec (mauvais identifiants)** → bandeau d'erreur au-dessus du formulaire, focus sur email, message générique ("Email ou mot de passe incorrect" — ne pas révéler lequel).
- **Échec (rate limit)** → message "Trop de tentatives, réessayez dans X minutes".
- **Échec (réseau)** → toast erreur + bouton enabled de nouveau.

**Validations**
- Email : `z.string().email()`.
- Mot de passe : `z.string().min(8)` (validation côté client minimale, le serveur a la règle d'autorité).

**États**
- `default`, `submitting`, `error`, `offline` (formulaire désactivé + message).

**Edge cases**
- Compte verrouillé (trop d'échecs) → message dédié + lien support.
- Compte non vérifié → redirection vers écran "Vérifiez votre email" avec bouton "Renvoyer".
- Token déjà valide en local → redirection automatique vers `/collection` (court-circuite l'écran).
- 2FA activée → après mdp valide, écran intermédiaire `/auth/2fa` (à designer en P1).

**A11y**
- Form `<form>` avec submit listener.
- Labels visibles ou `aria-label` explicites.
- Erreur globale : `role="alert"` `aria-live="assertive"`.
- Erreurs par champ : `aria-describedby` reliant l'input au message.
- Bouton 👁 : `aria-pressed`.
- Ordre de tabulation : email → mdp → toggle visibilité → "Mot de passe oublié" → CTA → "Inscription".

**Sécurité**
- HTTPS only.
- Mdp jamais loggué (front + back).
- Cookie de session : HttpOnly + Secure + SameSite=Lax.
- CSRF token sur la soumission email/mdp si form HTML classique. Si SPA fetch : header anti-CSRF.
- Pas d'email dans `localStorage` ni dans l'URL après échec.

**Critères d'acceptation**
- [ ] Connexion OAuth Google fonctionnelle (parcours complet).
- [ ] Connexion email/mdp fonctionnelle.
- [ ] Erreurs affichées et accessibles (axe + lecteur d'écran).
- [ ] Pas de fuite d'info (existence compte, type d'erreur précis) — message générique uniquement.
- [ ] Lighthouse a11y ≥ 95 sur cet écran.

---

## #3 — Inscription (`/auth/signup`)

**Wireframe** : auth.md #3

**Objectif** : créer un nouveau compte.

**Données / composants** : équivalent à #2 + checkbox CGU + indicateur force mdp.

**Interactions spécifiques**
- **Indicateur force** : recalculé à chaque frappe (zxcvbn ou équivalent léger). Critères listés en dessous, cochés en vert au fur et à mesure.
- **Liens CGU / confidentialité** : ouvrent en bottom sheet (lecture sans quitter le flux).
- **CTA "Créer mon compte"** désactivé tant que :
  - Email valide.
  - Mdp ≥ 8 caractères, au moins 1 chiffre, 1 majuscule.
  - Checkbox CGU cochée.
- **Succès** → écran "Vérifiez votre email" + bouton "Renvoyer" (cooldown 60 s) + lien "Retour à la connexion".

**Validations**
```ts
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[0-9]/).regex(/[A-Z]/),
  acceptedTerms: z.literal(true),
});
```

**Edge cases**
- Email déjà utilisé → message "Si un compte existe avec cet email, un message a été envoyé" (neutre — ne pas révéler).
- Email invalide → message inline.
- Provider OAuth → idem #2 mais l'inscription crée le compte au premier callback.

**A11y / Sécurité** : idem #2.

**Critères d'acceptation**
- [ ] Création de compte fonctionnelle.
- [ ] Email de vérification envoyé.
- [ ] Bouton désactivé tant que conditions non remplies.
- [ ] CGU obligatoirement acceptées (UE).

---

## #4 — Mot de passe oublié (`/auth/forgot`)

**Wireframe** : auth.md #4

**Objectif** : demander un lien de réinitialisation.

**Interactions**
- Saisie email + tap "Envoyer".
- **Toujours afficher l'état "succès"** (message neutre) que le compte existe ou non.
- Cooldown 60 s avant possibilité de renvoyer.

**Validations** : `z.string().email()`.

**Sécurité**
- Endpoint backend rate-limité (5 demandes/h/IP, 3/h/email).
- Token de reset à usage unique, expiration 1 h.
- Lien contient un signed token (HMAC), pas un ID prédictible.

**Critères d'acceptation**
- [ ] Lien envoyé si compte existe (vérifié manuellement).
- [ ] Réponse identique si compte inexistant.
- [ ] Rate limit fonctionnel.

---

## #5 — Onboarding (`/onboarding`)

**Wireframe** : auth.md #5

**Objectif** : présenter les 3 promesses clés au premier lancement.

**Données** : aucune (illustrations + textes statiques).

**Interactions**
- **Swipe horizontal** entre écrans.
- **Tap "Continuer"** → écran suivant.
- **Tap "Commencer"** (3e écran) → écrit `onboardingCompleted: true` en IndexedDB → redirige `/auth/login` (ou `/collection` si déjà connecté).
- **Tap "Passer →"** (visible sur 1 et 2) → idem.

**États** : default uniquement (statique).

**Edge cases**
- Si l'utilisateur ferme l'app au milieu, l'onboarding réapparaît au prochain lancement (flag IndexedDB pas encore écrit).
- Nouvelle version majeure de l'app : possibilité de re-déclencher un mini-onboarding "Nouveautés" (post-MVP).

**A11y**
- Indicateurs de progression avec `aria-current="page"` sur le dot actif.
- Boutons swipe accessibles au clavier (← →).
- Annonce du nouveau titre via `aria-live` au changement d'écran.
- Illustrations décoratives → `alt=""` (sinon `alt` descriptif).

**Critères d'acceptation**
- [ ] Affiché uniquement au premier lancement.
- [ ] Flag persisté entre sessions.
- [ ] Skip et finish fonctionnels.
- [ ] Pas de re-déclenchement à la déconnexion.

---

## #6 — Permission caméra (modale)

**Wireframe** : auth.md #6

**Objectif** : éduquer l'utilisateur **avant** le prompt système, pour maximiser le taux d'acceptation et préserver la possibilité de re-demander.

**Interactions**
- **Tap "OK"** → déclenche `navigator.mediaDevices.getUserMedia({ video: true })`. Le prompt système natif apparaît.
  - Acceptation système → ferme la modale, démarre le viseur.
  - Refus système → ferme la modale, redirige vers `/scan/single/error`.
- **Tap "Pas maintenant"** → ferme la modale, redirige vers `/add/manual` (chemin de secours).
- **Échap** → équivalent "Pas maintenant".

**États** : default, focus piégé (modal).

**Edge cases**
- Permission **déjà accordée** : la modale ne s'affiche pas, on entre directement dans le viseur.
- Permission **déjà refusée durablement** (par le système, sans pouvoir re-demander) : modale ne s'affiche pas, on va directement à #31 avec instructions.
- Pas de caméra (desktop sans webcam) : on va directement à #31 avec message adapté.

**A11y**
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.
- Focus initial sur "OK" (action principale), focus piégé.
- Restauration focus sur le bouton "Scan" en sortie.

**Sécurité**
- Aucun accès à la caméra avant tap utilisateur explicite.
- `getUserMedia` doit être appelé en réponse à un événement utilisateur (tap), sinon certains navigateurs bloquent.
- Stream caméra n'est jamais transmis tel quel ; seules les images capturées sont uploadées (post-validation utilisateur).

**Critères d'acceptation**
- [ ] Modale visible uniquement si permission ni accordée ni refusée durablement.
- [ ] "OK" déclenche le prompt natif et seulement ensuite.
- [ ] "Pas maintenant" et Échap équivalents.
- [ ] Focus piégé et restauré.
