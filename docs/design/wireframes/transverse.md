# Wireframes — Composants & états transverses

Écrans 56 à 58 + composants utilisés sur l'ensemble de l'app.

---

## #56 — Bandeau hors-ligne (composant global)

Composant non bloquant, affiché en haut de tout écran dès que `navigator.onLine === false` ou qu'une requête réseau échoue avec un pattern de perte de connexion.

```
┌────────────────────────────────────┐
│ ┌────────────────────────────────┐ │
│ │ ⚡ Hors-ligne — vos modifications│ │   (1)
│ │   seront synchronisées au retour │ │
│ │   de la connexion.               │ │
│ └────────────────────────────────┘ │
│                                    │
│  Header de l'écran               ⋮ │
├────────────────────────────────────┤
│                                    │
│  Contenu (consultable, depuis      │
│  cache local)                       │
│                                    │
└────────────────────────────────────┘
```

**Variante "sync en cours" (retour réseau)** :

```
┌────────────────────────────────────┐
│ ┌────────────────────────────────┐ │
│ │ ⏳ Synchronisation… 8 / 12       │ │   (2)
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Variante "sync échouée"** :

```
┌────────────────────────────────────┐
│ ┌────────────────────────────────┐ │
│ │ ⚠ 3 modifications n'ont pas pu  │ │
│ │   être synchronisées.            │ │
│ │   [ Réessayer ] [ Voir détails ] │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Notes**
1. Persistant tant que hors-ligne. Couleur neutre (info), pas alarmiste.
2. Auto-disparaît à la fin de la sync (toast bilan en remplacement).
- Hauteur ≈ 48 px, push le contenu vers le bas (pas overlay).
- a11y : `role="status"` + `aria-live="polite"` pour les changements d'état.
- Sur les écrans immersifs (scan), le bandeau s'affiche en overlay semi-transparent au-dessus de la caméra.

---

## #57 — Erreur 404 (`/*` catch-all)

```
┌────────────────────────────────────┐
│ ←                                  │
├────────────────────────────────────┤
│                                    │
│                                    │
│              🃏                    │
│                                    │
│        Page introuvable             │
│                                    │
│   Cette carte n'est plus dans       │
│   le paquet.                        │
│                                    │
│   [   ← Retour                ]    │
│   [   📚 Ma collection         ]    │
│                                    │
└────────────────────────────────────┘
```

**Notes**
- Ton léger (référence carte/jeu) sans tomber dans la blague lourde.
- Pas de tab bar (l'utilisateur est en dehors d'un onglet).

---

## #58 — Erreur 500 / inattendue (boundary global)

```
┌────────────────────────────────────┐
│                                    │
├────────────────────────────────────┤
│                                    │
│              ⚠                    │
│                                    │
│      Une erreur est survenue        │
│                                    │
│   Nous sommes désolés. L'app a      │
│   rencontré un problème.            │
│                                    │
│   Vos données restent sauvegardées. │
│                                    │
│   [   Réessayer              ]     │
│   [   Retour à l'accueil      ]     │
│                                    │
│   ─────────────                     │
│   Détails techniques                │   (1)
│   ▶ ID de l'erreur : 8a3f-2e1b      │
│      [ Copier ]                     │
│                                    │
│   [   Signaler ce problème    ]     │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. ID d'erreur cliquable pour copier (utilité support). Pas de stack trace exposée à l'utilisateur en prod, mais ID corrélé côté Sentry.
- Boundary React qui catch les erreurs non gérées dans le rendu.
- Bouton "Signaler" ouvre mailto avec ID pré-rempli ou formulaire intégré (selon stack support).

---

## Composants transverses (non-écrans)

### Header standard

```
┌────────────────────────────────────┐
│ ←  Titre de l'écran     [ic1] [ic2]│
└────────────────────────────────────┘
```
- Hauteur 56 px.
- Bouton retour à gauche (sauf onglets racines de la tab bar).
- Titre H1, 1 ligne max, ellipsis.
- Max 2 actions à droite (sinon menu ⋮).
- Sticky en haut au scroll.

### Tab bar mobile

```
┌────────────────────────────────────┐
│  📚    🔍    [⊕]   📊    👤        │
│ Coll.  Rech.  Scan  Stats Profil   │
└────────────────────────────────────┘
```
- Hauteur 64 px (sécurise les zones safe-area iOS).
- Onglet actif : icône pleine + couleur accent + label en gras.
- Badge sur Scan si lot en cours (pastille).
- Badge sur Profil si sync échouée ou notification importante.

### FAB (Floating Action Button)

Présent sur certains écrans (Collection, Stats…) en complément de la tab bar Scan. Permet l'ajout manuel rapide.

```
                              ┌───┐
                              │ ⊕ │
                              └───┘
                          (au-dessus
                            tab bar)
```
- 56×56 px circle.
- Ombre niveau "raised".
- Couleur accent.
- Tap → bottom sheet `/add/choose` (#36).
- À 16 px du bord droit, à 16 px au-dessus de la tab bar.

### Bottom sheet (générique)

```
                    ╴╴╴ drag handle ╴╴╴
┌────────────────────────────────────┐
│ Titre                          ✕   │
├────────────────────────────────────┤
│                                    │
│  Contenu de la sheet                │
│                                    │
│  (scrollable si dépasse)            │
│                                    │
├────────────────────────────────────┤
│  [ Action secondaire ] [ Primaire ]│
└────────────────────────────────────┘
```
- 3 hauteurs : compact (~30%), médium (~60%), full (~95%).
- Drag handle visible en haut (poignée).
- Drag-to-resize entre hauteurs.
- Drag down pour fermer.
- Tap sur le scrim (fond semi-transparent) = fermeture.
- a11y : `role="dialog"`, focus piégé, Échap = fermer.

### Modale d'alerte

```
┌────────────────────────────────────┐
│ (scrim 50%)                        │
│                                    │
│   ╔════════════════════════════╗   │
│   ║         Titre              ║   │
│   ║                            ║   │
│   ║   Message court              ║   │
│   ║   et explicite                 ║   │
│   ║                            ║   │
│   ║  [ Annuler ]  [ Confirmer ]║   │
│   ╚════════════════════════════╝   │
│                                    │
└────────────────────────────────────┘
```
- Largeur 320 px, centrée, padding 24 px.
- 2 boutons : annuler (secondaire, gauche) + action (primaire, droite).
- Variante destructive : action en rouge.
- `role="alertdialog"`, focus piégé, Échap = annuler.
- **Réservée aux actions irréversibles uniquement.**

### Toast / Snackbar

Voir wireframe complet dans `add.md` #40.

```
   ┌────────────────────────────┐
   │ ✓ Action réussie     [Cta] │
   └────────────────────────────┘
```

### Skeleton loaders

Skeleton respecte la forme du contenu attendu. Trois primitives :

```
Texte simple :   ████████████░░░░
                 ██████░░░░░░░░░░

Vignette carte : ┌──────┐
                 │      │
                 │      │
                 └──────┘
                 ████████░░

Liste item :     ┌──────┐ ████████████
                 │      │ ██████░░░░░░
                 └──────┘ ███░░░░░░░░░
```
- Animation pulse douce (1.4 s, ease-in-out, infinite).
- `prefers-reduced-motion` : statique.
- Couleur : 8% sur le fond ambiant.

### Empty states

Pattern réutilisé partout (collection vide, recherche sans résultat, classeur vide…).

```
┌────────────────────────────────────┐
│                                    │
│              [icône / illustr]      │
│                                    │
│         Titre court                 │
│                                    │
│       Phrase d'explication          │
│       qui guide vers l'action.      │
│                                    │
│       [   CTA principal      ]      │
│       [   Action secondaire  ]      │
└────────────────────────────────────┘
```

### Chips (filtres, tags)

```
[ Tous ]  [● Filtre actif ✕ ]  [ Filtre ]
```
- Hauteur 32 px, padding horizontal 12 px.
- Toggle ou bouton selon usage.
- Croix ✕ visible si supprimable.
- État actif : couleur de fond accent, texte contrasté.

### Symboles de mana Magic

```
{W} {U} {B} {R} {G} {C}
{2} {3} {X}
{2/W} {U/B}
{T} {Q}
```

Rendus en SVG natifs (pas en bitmap). Une seule librairie d'icônes pour tout le mana, importée dynamiquement (pas dans le bundle initial). Toujours accompagnés d'un `aria-label` textuel ("Mana blanc", "Mana bleu"…).

---

## Notes finales sur les composants

- Tous les composants sont **headless** (logique) + **stylés** (Tailwind), pas de CSS-in-JS runtime.
- États systématiques : default · hover · active · focus-visible · disabled · loading.
- Tous les composants interactifs ont un focus visible distinct du hover.
- Animations : 120–250 ms standard, 350 ms max, easing standard. Respect `prefers-reduced-motion`.
- Tailwind config : tokens importés depuis Style Dictionary / Tokens Studio (Figma).
