# Wireframes — Scan

Écrans 28 à 35 de l'inventaire. Parcours critique P2 (carte unique) et P3 (lot).

---

## #28 — Choix mode scan (`/scan`)

```
┌────────────────────────────────────┐
│ Scanner                     ⋮      │
├────────────────────────────────────┤
│                                    │
│   ┌──────────────────────────┐     │
│   │                          │     │
│   │         📷               │     │
│   │                          │     │
│   │   Scanner une carte      │     │   (1)
│   │                          │     │
│   │   Idéal pour ajouter     │     │
│   │   une carte précise      │     │
│   │                          │     │
│   └──────────────────────────┘     │
│                                    │
│   ┌──────────────────────────┐     │
│   │                          │     │
│   │         📚               │     │
│   │                          │     │
│   │   Scanner un lot         │     │
│   │                          │     │
│   │   Pour ajouter plusieurs │     │
│   │   cartes à la suite      │     │
│   │                          │     │
│   └──────────────────────────┘     │
│                                    │
│   ─────────────                     │
│                                    │
│   💡 Reprendre votre lot en cours  │   (2)
│      (12 cartes scannées)           │
│      [    Continuer    ]            │
│                                    │
├────────────────────────────────────┤
│  📚    🔍   [⊕]   📊    👤        │
└────────────────────────────────────┘
```

**Notes**
1. Deux grosses cartes-CTAs explicites. Le tap sur une carte démarre le flux correspondant après vérification permission caméra.
2. **Reprise de lot** : bandeau visible uniquement si une session de scan lot est en attente (persistée en IndexedDB).
- Premier accès : tap → modale permission caméra (#6) → après accord, viseur.
- a11y : chaque carte est un `<button>` avec `aria-label` explicite ("Scanner une carte unique").

---

## #29 — Viseur scan unique (`/scan/single`) — immersif

Tab bar masquée pendant le scan (mode immersif).

```
┌────────────────────────────────────┐
│ ← retour          💡 flash    ⚙   │   (1)
├────────────────────────────────────┤
│                                    │
│  ┌────────────────────────┐        │
│  │░░░░░░░░░░░░░░░░░░░░░░░│        │
│  │░ ┌──────────────────┐ ░│        │
│  │░ │                  │ ░│        │
│  │░ │                  │ ░│        │
│  │░ │   cadre cible    │ ░│        │   (2)
│  │░ │   ratio 5:7      │ ░│        │
│  │░ │                  │ ░│        │
│  │░ │  flux caméra     │ ░│        │
│  │░ │                  │ ░│        │
│  │░ │                  │ ░│        │
│  │░ └──────────────────┘ ░│        │
│  │░░░░░░░░░░░░░░░░░░░░░░░│        │
│  └────────────────────────┘        │
│                                    │
│   Placez la carte dans le cadre    │   (3)
│   La capture se fait automatiq…    │
│                                    │
│              ⏺                      │   (4)
│         capture manuelle            │
│                                    │
│   [ Saisir manuellement ]           │   (5)
└────────────────────────────────────┘
```

**Notes**
1. Bouton retour, flash (toggle), réglages rapides (⚙ : qualité photo, mode auto/manuel).
2. Cadre de visée au ratio 5:7 (carte Magic). Overlay sombre autour pour guider l'œil. Couleur du cadre : vert quand carte détectée et stable, blanc sinon. Animation pulse douce.
3. Texte d'aide léger en bas du cadre. Disparaît une fois la première capture réussie (mémoire utilisateur).
4. Bouton de capture manuelle, gros, central, en zone de pouce. Capture auto reste l'option par défaut.
5. **Échappatoire toujours visible** : passer en saisie manuelle si le scan échoue ou n'est pas pratique.
- Vibration tactile courte à la capture (désactivable dans préférences).
- Format de la photo capturée : JPEG, qualité 0.85, max 2048 px sur le grand côté (rééchantillonnée côté client avant upload pour la perf).
- Permission caméra refusée → écran #31.

---

## #30 — Validation post-capture (`/scan/single/review`)

### Cas A — confiance haute (≥ 90 %)

```
┌────────────────────────────────────┐
│ ← retour                           │
├────────────────────────────────────┤
│                                    │
│  ┌────────────┐    ┌────────────┐  │
│  │            │    │            │  │
│  │  capture   │ →  │  candidat  │  │   (1)
│  │  utilisat. │    │  Scryfall  │  │
│  │            │    │            │  │
│  └────────────┘    └────────────┘  │
│                                    │
│        ✓  Lightning Bolt           │   (2)
│           Magic 2010 · #133         │
│           Common · {R} · Instant   │
│                                    │
│        Confiance : 98 %             │
│                                    │
│   ─── Détails de l'exemplaire ─── │   (3)
│   Quantité   ×1                     │
│   État       NM                     │
│   Foil       Non                    │
│   Langue     EN                     │
│   Classeur   Toutes mes cartes      │
│              [ Modifier les détails]│
│                                    │
│   [   ✓  Confirmer et ajouter   ]  │   (4)
│                                    │
│   [   Choisir une autre carte   ]  │   (5)
│   [   Reprendre la photo        ]  │
└────────────────────────────────────┘
```

**Notes**
1. Comparaison visuelle côte-à-côte : capture utilisateur vs candidat. Aide à la confirmation visuelle.
2. Carte reconnue + score de confiance affiché explicitement (transparence). **Jamais d'auto-validation sans tap utilisateur**.
3. Métadonnées de l'exemplaire pré-remplies depuis le dernier ajout (état, foil, langue, classeur). Modifiable via "Modifier les détails" → ouvre `/add/manual/details` avec les champs pré-remplis.
4. CTA principal en bas, zone de pouce.
5. Échappatoires : si la carte reconnue est fausse, accès à la liste de candidats ou re-photo.

### Cas B — confiance moyenne (50–90 %)

```
┌────────────────────────────────────┐
│ ← retour                           │
├────────────────────────────────────┤
│                                    │
│       ┌────────────┐                │
│       │            │                │
│       │  capture   │                │
│       │  utilisat. │                │
│       │            │                │
│       └────────────┘                │
│                                    │
│   Plusieurs cartes possibles —     │
│   choisissez la bonne :             │
│                                    │
│  ┌─────────────────────────────┐   │
│  │ [img] Lightning Bolt        │   │
│  │       M10 · Common · 78%    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ [img] Lightning Strike      │   │
│  │       M21 · Common · 64%    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ [img] Chain Lightning       │   │
│  │       LEG · Uncommon · 52%  │   │
│  └─────────────────────────────┘   │
│                                    │
│   Aucune ne correspond ?            │
│   [ Saisir manuellement   ]         │
│   [ Reprendre la photo    ]         │
└────────────────────────────────────┘
```

**Notes**
- 3 à 5 candidats max. Tap sur un candidat → cas A avec ce candidat sélectionné.
- Confiance visible sur chaque candidat.

### Cas C — échec (< 50 %)

```
┌────────────────────────────────────┐
│ ← retour                           │
├────────────────────────────────────┤
│                                    │
│       ┌────────────┐                │
│       │            │                │
│       │  capture   │                │
│       │  utilisat. │                │
│       │            │                │
│       └────────────┘                │
│                                    │
│              ⚠                      │
│                                    │
│   Carte non reconnue                │
│                                    │
│   Astuces :                         │
│    • Plus de lumière, moins de     │
│      reflets                        │
│    • Carte bien à plat              │
│    • Cadre rempli au max            │
│                                    │
│   [    Reprendre la photo     ]    │
│   [    Saisir manuellement    ]    │
└────────────────────────────────────┘
```

---

## #31 — Erreur scan (`/scan/single/error`)

Affiché si permission caméra refusée durablement ou pas de caméra disponible.

```
┌────────────────────────────────────┐
│ ← retour                           │
├────────────────────────────────────┤
│                                    │
│              📷                    │
│                                    │
│   Caméra inaccessible              │
│                                    │
│   L'accès à la caméra est          │
│   désactivé. Pour scanner vos      │
│   cartes, autorisez l'accès        │
│   dans les paramètres de votre     │
│   appareil.                        │
│                                    │
│   [   Comment activer la caméra ]  │   (1)
│                                    │
│   ─────────────                     │
│                                    │
│   En attendant, vous pouvez :      │
│   [   ⊕ Saisir manuellement   ]    │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Tap → bottom sheet avec instructions par OS (iOS Safari, Android Chrome, desktop). Lien deep-link vers les paramètres si possible (rare en PWA, fallback sur explication texte).

---

## #32 — Viseur scan lot (`/scan/batch`) — immersif

```
┌────────────────────────────────────┐
│ ← retour     LOT      💡   ⚙       │
├────────────────────────────────────┤
│                                    │
│  ┌────────────────────────┐        │
│  │░░░░░░░░░░░░░░░░░░░░░░░│        │
│  │░ ┌──────────────────┐ ░│        │
│  │░ │                  │ ░│        │
│  │░ │   cadre cible    │ ░│        │
│  │░ │                  │ ░│        │
│  │░ │  flux caméra     │ ░│        │
│  │░ │                  │ ░│        │
│  │░ └──────────────────┘ ░│        │
│  │░░░░░░░░░░░░░░░░░░░░░░░│        │
│  └────────────────────────┘        │
│                                    │
│   ✓ Counterspell ajoutée           │   (1)
│   12 cartes en file                 │
│                                    │
│      ⏺              [📚 Voir ▶ ]   │   (2)
│   capture manuelle    file         │
│                                    │
│   [ Terminer le lot ]               │   (3)
└────────────────────────────────────┘
```

**Notes**
1. Feedback de la dernière carte ajoutée (toast intégré). Disparaît à la prochaine capture. `aria-live="polite"`.
2. Bouton "Voir" affiche la file (#33). Compteur dans le bouton.
3. **Terminer** → écran de revue (#34). Confirmation modale si > 0 cartes en file et pause prolongée.
- Différence vs scan unique : pas de validation entre chaque carte. La carte est ajoutée à la file SI confiance haute, sinon mise en file avec marqueur "à valider".
- Vibration tactile + son léger (toggle dans préférences) à chaque carte reconnue.
- Pas de tab bar pendant le scan immersif.

---

## #33 — File d'attente lot (`/scan/batch/queue`) — bottom sheet

```
                ╴╴╴ drag handle ╴╴╴
┌────────────────────────────────────┐
│ File d'attente (12)            ✕   │
│                                    │
│ 10 reconnues · 2 à valider         │
├────────────────────────────────────┤
│ [img] Counterspell    ✓  ⋮         │   (1)
│       LEA · 95%                     │
├────────────────────────────────────┤
│ [img] Lightning Bolt  ✓  ⋮         │
│       M10 · 98%                     │
├────────────────────────────────────┤
│ [img] Forest          ✓  ⋮         │
│       M10 · 99%                     │
├────────────────────────────────────┤
│ [img] ?               ⚠  ⋮         │   (2)
│       À choisir parmi 4 candidats   │
├────────────────────────────────────┤
│ [img] Brainstorm      ✓  ⋮         │
│       ICE · 91%                     │
├────────────────────────────────────┤
│ [img] ?               ⚠  ⋮         │
│       Non reconnue                  │
├────────────────────────────────────┤
│ ... (scroll)                       │
├────────────────────────────────────┤
│  [ Continuer le scan ]              │
│  [ Terminer le lot   ]              │
└────────────────────────────────────┘
```

**Notes**
1. Vignette miniature de la capture (pas de l'image Scryfall — c'est ce que l'utilisateur a vu). À droite : statut (✓ reconnue / ⚠ à valider) + menu ⋮ (Modifier, Supprimer de la file).
2. Items "à valider" mis en évidence (icône ⚠, fond légèrement teinté). Tap → vue de candidats inline ou navigation vers une mini-fiche.
- Sheet glissable jusqu'en plein écran pour parcourir confortablement.

---

## #34 — Revue de lot (`/scan/batch/review`)

```
┌────────────────────────────────────┐
│ ← Revue du lot                     │
├────────────────────────────────────┤
│  12 cartes scannées                │
│  10 prêtes · 2 à valider            │
├────────────────────────────────────┤
│                                    │
│  ⚠ À valider en premier (2)         │   (1)
│                                    │
│  ┌──────────────────────────────┐  │
│  │ [capture] ?                  │  │
│  │ Choisir : 4 candidats        │  │
│  │ [ Voir et choisir ▶ ]        │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [capture] ?                  │  │
│  │ Non reconnue                 │  │
│  │ [ Saisir manuellement  ]    │  │
│  │ [ Supprimer            ]    │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─── Prêtes (10) ───               │
│                                    │
│  [img] Counterspell  ×1   ⋮        │   (2)
│        LEA · NM · EN                │
│  [img] Lightning Bolt ×1  ⋮        │
│        M10 · NM · EN                │
│  ... (scroll)                       │
│                                    │
├────────────────────────────────────┤
│ [ Tout supprimer ]  [ Tout ajouter ]│   (3)
└────────────────────────────────────┘
```

**Notes**
1. Section "À valider" en haut : bloque la validation globale tant qu'il en reste (ou propose "Ajouter seulement les prêtes" + report des autres dans une nouvelle file).
2. Items prêts : éditables individuellement (qté, état, foil, langue, classeur via menu ⋮ ou tap → édition rapide en bottom sheet).
3. Actions globales : appliquer un état/foil/langue à tout le lot via menu (utile : "tout en NM, EN, foil = non" en un tap).
- Au tap "Tout ajouter" : confirmation modale avec récap ("12 cartes seront ajoutées à votre collection. Continuer ?").
- Après ajout : toast bilan ("12 cartes ajoutées · valeur estimée +85€") + lien "Voir dans ma collection".
- Si certaines cartes échouent (réseau, etc.) : retry inline, jamais de perte silencieuse.

---

## #35 — Reprise de lot interrompu (`/scan/batch/resume`)

Pas une route plein écran : bandeau persistant sur `/scan` et premier accès à `/collection`.

```
┌────────────────────────────────────┐
│ ┌──────────────────────────────┐   │
│ │ 💡 Reprendre votre lot ?      │   │
│ │    12 cartes en attente,      │   │
│ │    scannées il y a 2 jours    │   │
│ │  [ Reprendre ]  [ Abandonner ]│   │
│ └──────────────────────────────┘   │
│                                    │
│ ... reste de l'écran                │
└────────────────────────────────────┘
```

**Notes**
- "Reprendre" → ouvre directement `/scan/batch/review` avec la file restaurée.
- "Abandonner" → modale de confirmation ("Les 12 cartes scannées seront perdues. Continuer ?").
- Le bandeau réapparaît à chaque ouverture tant que la file existe. Configurable : "Ne plus me proposer pour ce lot".
