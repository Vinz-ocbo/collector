# Wireframes — Auth & Onboarding

Écrans 1 à 6 de l'inventaire. Tous en mode plein écran, sans tab bar.

---

## #1 — Splash / chargement

État transitoire (≤ 1 s visible idéalement, sinon skeleton). Pas un écran "vrai" mais un fallback de chargement initial.

```
┌────────────────────────────────────┐
│                                    │
│                                    │
│                                    │
│                                    │
│            [logo TCG]              │
│         tcg-collector              │
│                                    │
│                                    │
│           ⏳ chargement…            │
│                                    │
│                                    │
│                                    │
└────────────────────────────────────┘
```

**Notes**
- Affiché uniquement si l'app met > 200 ms à hydrater (sinon, on rentre direct sur la route cible).
- Logo + nom centrés, indicateur de chargement minimaliste.
- `prefers-reduced-motion` : pas d'animation du logo.

---

## #5 — Onboarding (1er lancement)

3 écrans max, swipeables horizontalement. Bouton "Passer" visible dès le premier.

### Écran 1/3 — Promesse principale

```
┌────────────────────────────────────┐
│                          Passer →  │   (1)
├────────────────────────────────────┤
│                                    │
│           [illustration]           │
│                                    │
│                                    │
│      Votre collection,             │
│      partout avec vous             │
│                                    │
│      Inventoriez, organisez et     │
│      retrouvez vos cartes en       │
│      quelques secondes.            │
│                                    │
│                                    │
│        ●  ○  ○                     │   (2)
│                                    │
│       [    Continuer       ]       │   (3)
└────────────────────────────────────┘
```

### Écran 2/3 — Scan

```
┌────────────────────────────────────┐
│  ← retour              Passer →    │
├────────────────────────────────────┤
│                                    │
│           [illustration            │
│            caméra + carte]         │
│                                    │
│                                    │
│      Photographiez,                │
│      on s'occupe du reste          │
│                                    │
│      Scannez une carte ou un       │
│      lot entier. Validez en un     │
│      tap.                          │
│                                    │
│        ○  ●  ○                     │
│                                    │
│       [    Continuer       ]       │
└────────────────────────────────────┘
```

### Écran 3/3 — Hors-ligne

```
┌────────────────────────────────────┐
│  ← retour                          │
├────────────────────────────────────┤
│                                    │
│           [illustration            │
│            cloud + check]          │
│                                    │
│                                    │
│      Sans connexion,               │
│      ça marche aussi               │
│                                    │
│      Consultez et ajoutez vos      │
│      cartes hors-ligne. La sync    │
│      se fait quand vous revenez.   │
│                                    │
│        ○  ○  ●                     │
│                                    │
│       [   Commencer        ]       │   (4)
└────────────────────────────────────┘
```

**Notes**
1. **Passer →** : visible sur les 2 premiers écrans, mène à `/auth/login`.
2. **Indicateur de progression** : 3 dots, le rempli = page courante.
3. **Continuer** : passe au prochain écran. Swipe horizontal aussi accepté.
4. **Commencer** : marque l'onboarding comme vu (flag IndexedDB) et redirige vers `/auth/login` (ou `/collection` si déjà connecté — cas rare).
- Pas de demande de permission ici. Les permissions (caméra) sont demandées **contextuellement** au premier scan.
- a11y : focus order = bouton retour → contenu → indicateur → CTA. `aria-live` sur le titre quand on swipe.

---

## #2 — Connexion (`/auth/login`)

```
┌────────────────────────────────────┐
│                                    │
│            [logo]                  │
│         tcg-collector              │
│                                    │
│         Bon retour 👋              │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ✉  Continuer avec Google     │  │   (1)
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Continuer avec Apple        │  │
│  └──────────────────────────────┘  │
│                                    │
│  ──────────  ou  ──────────        │
│                                    │
│   Email                            │
│   ┌────────────────────────────┐   │
│   │ vous@exemple.fr            │   │
│   └────────────────────────────┘   │
│   Mot de passe                     │
│   ┌────────────────────────────┐   │
│   │ ••••••••••           👁    │   │   (2)
│   └────────────────────────────┘   │
│                                    │
│             Mot de passe oublié ?  │   (3)
│                                    │
│   [        Se connecter        ]   │   (4)
│                                    │
│   Pas de compte ? Inscription      │   (5)
└────────────────────────────────────┘
```

**Notes**
1. Providers OAuth listés en premier (chemin recommandé). Apple obligatoire si publication App Store, sinon optionnel.
2. Bouton œil pour afficher/masquer le mot de passe. État par défaut : masqué.
3. Lien vers `/auth/forgot`.
4. CTA principal en bas (zone de pouce). Disabled tant que les champs ne sont pas valides (Zod).
5. Lien vers `/auth/signup`.
- Erreurs : message inline sous le champ + `aria-describedby`. Erreur globale (mauvais identifiants) en bandeau au-dessus du formulaire, `aria-live="assertive"`.
- Loading : CTA passe à "Connexion…" + spinner intégré, désactivé.

**Variante desktop (≥ 768 px)** : carte centrée 480 px, fond légèrement teinté, formulaire identique.

---

## #3 — Inscription (`/auth/signup`)

```
┌────────────────────────────────────┐
│  ← retour                          │
├────────────────────────────────────┤
│                                    │
│         Créer un compte            │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ✉  Continuer avec Google     │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Continuer avec Apple        │  │
│  └──────────────────────────────┘  │
│                                    │
│  ──────────  ou  ──────────        │
│                                    │
│   Email                            │
│   ┌────────────────────────────┐   │
│   │                            │   │
│   └────────────────────────────┘   │
│   Mot de passe                     │
│   ┌────────────────────────────┐   │
│   │                       👁   │   │
│   └────────────────────────────┘   │
│   ▓▓▓▓▓░░░ Force : moyen           │   (1)
│   • 8 caractères minimum           │
│   • 1 chiffre, 1 majuscule         │
│                                    │
│   [x] J'accepte les CGU et la      │   (2)
│       politique de confidentialité │
│                                    │
│   [        Créer mon compte    ]   │
│                                    │
│   Déjà inscrit ? Se connecter      │
└────────────────────────────────────┘
```

**Notes**
1. Indicateur de force du mot de passe + checklist live des règles. Critères validés cochent en vert.
2. Acceptation CGU obligatoire (UE). Liens vers `/profile/legal/cgu` et `/profile/legal/confidentialite` (ouvre en bottom sheet, pas de navigation hors flux).
- Email confirmation envoyée après création. Écran post-inscription : "Vérifiez votre boîte mail" avec bouton "Renvoyer l'email" (cooldown 60 s).

---

## #4 — Mot de passe oublié (`/auth/forgot`)

```
┌────────────────────────────────────┐
│  ← retour                          │
├────────────────────────────────────┤
│                                    │
│      Mot de passe oublié ?         │
│                                    │
│   Entrez votre email, nous vous    │
│   envoyons un lien pour le         │
│   réinitialiser.                   │
│                                    │
│   Email                            │
│   ┌────────────────────────────┐   │
│   │                            │   │
│   └────────────────────────────┘   │
│                                    │
│   [   Envoyer le lien        ]     │
│                                    │
└────────────────────────────────────┘
```

**État succès** (in-place, remplace le formulaire) :

```
┌────────────────────────────────────┐
│  ← retour                          │
├────────────────────────────────────┤
│                                    │
│            ✉                       │
│       Email envoyé                 │
│                                    │
│   Si un compte existe avec         │   (1)
│   vous@exemple.fr, vous            │
│   recevrez un lien dans            │
│   quelques minutes.                │
│                                    │
│   Vérifiez vos spams au besoin.    │
│                                    │
│   [    Renvoyer (45 s)       ]     │   (2)
│                                    │
│   Retour à la connexion            │
└────────────────────────────────────┘
```

**Notes**
1. **Message neutre** (pas "compte introuvable" ni "email envoyé") — bonne pratique sécurité, ne pas révéler l'existence d'un compte.
2. Cooldown 60 s avant possibilité de renvoyer.

---

## #6 — Permission caméra (modale)

Affichée **contextuellement** au premier accès à `/scan`. Pas une route — overlay modal.

```
┌────────────────────────────────────┐
│ (écran /scan en arrière-plan)      │
│                                    │
│   ╔════════════════════════════╗   │
│   ║          📷                ║   │
│   ║                            ║   │
│   ║   Activer la caméra        ║   │
│   ║                            ║   │
│   ║   Pour scanner vos cartes, ║   │
│   ║   nous avons besoin        ║   │
│   ║   d'accéder à la caméra    ║   │
│   ║   de votre appareil.       ║   │
│   ║                            ║   │
│   ║   Aucune image n'est       ║   │
│   ║   transmise à des tiers.   ║   │   (1)
│   ║                            ║   │
│   ║  [ Pas maintenant ] [ OK ] ║   │
│   ╚════════════════════════════╝   │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. **Explication avant la demande système.** Notre dialog précède le prompt natif (qui apparaît seulement après tap "OK"). C'est une bonne pratique : si l'utilisateur refuse notre dialog, on ne brûle pas l'opportunité du prompt natif.
- "Pas maintenant" : ferme la modale et redirige vers `/add/manual` (chemin de secours).
- Permission refusée durablement → écran `/scan/single/error` avec instructions pour réactiver dans les paramètres système.
- a11y : focus piégé dans la modale, fermable Échap (= "Pas maintenant"), focus restauré au CTA Scan à la fermeture.
