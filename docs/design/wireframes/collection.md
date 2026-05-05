# Wireframes — Collection

Écrans 7 à 20 de l'inventaire. Onglet par défaut au lancement.

---

## #7 — Collection vide (`/collection` état empty, premier lancement)

```
┌────────────────────────────────────┐
│ Ma collection            🔍   ⋮    │
├────────────────────────────────────┤
│                                    │
│                                    │
│           [illustration            │
│            classeur vide]          │
│                                    │
│                                    │
│       Pas encore de cartes         │
│                                    │
│   Ajoutez votre première carte     │
│   pour démarrer votre collection.  │
│                                    │
│   [   ⊕ Ajouter une carte    ]     │   (1)
│                                    │
│   ou scannez un lot directement    │
│                                    │
│   [   📷 Scanner un lot      ]     │
│                                    │
│                                    │
├────────────────────────────────────┤
│  📚    🔍   [⊕]   📊    👤        │
│ Coll.  Rech. Scan  Stats Profil    │
└────────────────────────────────────┘
```

**Notes**
1. Deux CTAs explicites pour lever le doute du premier lancement (saisie ou scan). Pas de FAB ici puisque le contenu est l'appel à l'action.
- Tab bar visible normalement.
- a11y : titre H1 "Pas encore de cartes", CTAs en `<button>` ou `<a>` selon comportement.

---

## #9 — Collection — mode grille (default mobile)

```
┌────────────────────────────────────┐
│ Ma collection (247)      🔍   ⋮    │   (1)
├────────────────────────────────────┤
│ [▼ Trié par : ajout récent]  [⊟⊞⊟] │   (2)(3)
│ [Filtres ▼]  set: 3  ✕             │   (4)
├────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │      │ │      │ │      │         │
│  │ img  │ │ img  │ │ img  │         │
│  │      │ │      │ │      │         │
│  │  ×3  │ │  ×1  │ │  ×2  │         │   (5)
│  └──────┘ └──────┘ └──────┘         │
│  Lightning  Counter  Ponder         │   (6)
│  Bolt       spell                   │
│  M10 · 1.50 LEA · 80€  EVE · 0.60   │
│                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │      │ │      │ │      │         │
│  │ img  │ │ img  │ │ img  │         │
│  │  F   │ │      │ │      │         │   (7)
│  │  ×1  │ │  ×4  │ │  ×2  │         │
│  └──────┘ └──────┘ └──────┘         │
│  Brainstm.  Forest   Island         │
│  ICE · 25€  M10 · 0   M10 · 0       │
│  ╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴   │
├────────────────────────────────────┤
│  📚    🔍   [⊕]   📊    👤        │
│ Coll.  Rech. Scan  Stats Profil    │
└────────────────────────────────────┘
```

**Notes**
1. **Compteur** total à côté du titre (cartes possédées toutes quantités confondues, ou nombre d'exemplaires uniques — choix produit, à valider). Mémoriser le dernier filtre actif modifie ce compteur.
2. **Tri** : tap → bottom sheet `/collection/sort`. Affiche le critère courant.
3. **Mode de vue** : 3 icônes : liste compacte ⊟ / grille ⊞ / pile ▤ (active mise en évidence). Tap → bottom sheet `/collection/view-mode`.
4. **Filtres** : chip global "Filtres" + chips actifs. Le ✕ retire le filtre. Tap "Filtres" → bottom sheet `/collection/filters`.
5. **Quantité possédée** en bas à droite de la vignette (badge).
6. Sous chaque vignette : nom (1 ligne, ellipsis), set + prix unitaire estimé.
7. Indicateur `F` en haut à gauche pour les foils.
- Virtualisation au-delà de 100 items (TanStack Virtual).
- Tap vignette → `/collection/items/:itemId`. Long press → menu d'actions rapides (modifier, dupliquer, supprimer, déplacer dans un classeur).
- Pull-to-refresh : recharge les cotes Scryfall.

---

## #8 — Collection — mode liste compacte

```
┌────────────────────────────────────┐
│ Ma collection (247)      🔍   ⋮    │
├────────────────────────────────────┤
│ [▼ Trié par : nom A→Z]    [⊟⊞⊟]    │
│ [Filtres ▼]                        │
├────────────────────────────────────┤
│ [img] Black Lotus              ×1  │   (1)
│       LEA · NM · EN · F            │
│       12 500€                      │
├────────────────────────────────────┤
│ [img] Brainstorm               ×4  │
│       ICE · NM · EN                │
│       25€                          │
├────────────────────────────────────┤
│ [img] Counterspell             ×8  │
│       LEA · LP · EN · 2 versions   │   (2)
│       80€                          │
├────────────────────────────────────┤
│ [img] Forest                  ×24  │
│       M10 · NM · FR · multi-impr.  │
│       0.10€                        │
├────────────────────────────────────┤
│ [img] Lightning Bolt           ×3  │
│       M10 · NM · EN                │
│       4.50€                        │
│  ╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴   │
├────────────────────────────────────┤
│  📚    🔍   [⊕]   📊    👤        │
└────────────────────────────────────┘
```

**Notes**
1. Vignette miniature à gauche (40×56 px), ratio 5:7 préservé.
2. Si plusieurs versions du même nom dans la collection : "X versions" sous-titre cliquable → ouvre le mode pile filtré sur ce nom.
- Densité maxi : ~5 cartes visibles sur 360×640 mobile.
- Hauteur minimale d'item ≥ 64 px pour la cible tactile.

---

## #10 — Collection — mode pile (regroupé par nom)

```
┌────────────────────────────────────┐
│ Ma collection (247)      🔍   ⋮    │
├────────────────────────────────────┤
│ [▼ Trié par : quantité ↓]   [⊟⊞▤]  │
│ [Filtres ▼]                        │
├────────────────────────────────────┤
│  ┌──────┐  Forest             ×24  │   (1)
│  │ img  │  4 versions                │
│  │      │  M10, ZEN, INV, BFZ      │
│  └──────┘  Total estimé : 2.40€    │
├────────────────────────────────────┤
│  ┌──────┐  Counterspell        ×8  │
│  │ img  │  3 versions                │
│  │      │  LEA, ICE, MMQ          │
│  └──────┘  Total estimé : 240€     │
├────────────────────────────────────┤
│  ┌──────┐  Lightning Bolt      ×3  │
│  │ img  │  1 version                 │
│  │      │  M10                      │
│  └──────┘  4.50€                   │
├────────────────────────────────────┤
│  ┌──────┐  Black Lotus         ×1  │
│  │ img  │  1 version                 │
│  │      │  LEA                      │
│  └──────┘  12 500€                 │
└────────────────────────────────────┘
```

**Notes**
1. Une ligne = un nom de carte. La vignette utilise l'impression "préférée" (réglage utilisateur : la plus récente / la plus chère / la plus possédée). Tap → vue éclatée des exemplaires (modale ou route dédiée).
- Mode utile pour avoir une vue "deck-builder oriented".

---

## #11 — Filtres collection (bottom sheet)

```
                ╴╴╴ drag handle ╴╴╴
┌────────────────────────────────────┐
│ Filtres                       ✕    │
├────────────────────────────────────┤
│                                    │
│ Couleur                            │
│  [W] [U] [B] [R] [G] [colorless]   │   (1)
│                                    │
│ Type                               │
│  [▼ Tous les types]                │   (2)
│                                    │
│ Rareté                             │
│  [Common] [Uncommon] [Rare] [Myth] │
│                                    │
│ Set                                │
│  [▼ Tous les sets]                 │
│                                    │
│ Langue                             │
│  [FR] [EN] [JP] [DE] [ES] [+]      │
│                                    │
│ État                               │
│  [NM] [LP] [MP] [HP] [DMG]         │
│                                    │
│ Foil                               │
│  ( ) Tous  (•) Foil  ( ) Non-foil  │
│                                    │
│ Classeur                           │
│  [▼ Tous les classeurs]            │
│                                    │
│ Prix estimé                        │
│  De [    0 €] à [   ∞ €]           │
│                                    │
│ ╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴   │
├────────────────────────────────────┤
│  [Réinitialiser]    [Appliquer]    │   (3)
└────────────────────────────────────┘
```

**Notes**
1. Couleurs : symboles Magic en SVG. Multi-sélection (chips toggle). Modes "exactement", "au moins", "au plus" en menu secondaire (icône ⋮ à côté du label "Couleur") — voir spec.
2. Combobox avec recherche pour les listes longues (sets, types).
3. **Réinitialiser** efface tous les filtres (confirmation inline si > 5 actifs). **Appliquer** ferme la sheet et applique. Compteur live "X cartes" peut être affiché au-dessus du bouton Appliquer pendant l'édition.
- Sheet glissable pour fermer (= Appliquer dans certains designs ; ici on choisit "= Annuler" pour cohérence avec dismissal). À trancher en spec.
- Sur desktop ≥ 768 px : panneau latéral droit, persistant.

---

## #12 — Tri (bottom sheet)

```
                ╴╴╴ drag handle ╴╴╴
┌────────────────────────────────────┐
│ Trier par                     ✕    │
├────────────────────────────────────┤
│  (•) Date d'ajout (récent → ancien)│
│  ( ) Nom (A → Z)                   │
│  ( ) Set (récent → ancien)         │
│  ( ) Valeur (élevée → basse)       │
│  ( ) Rareté (mythique → common)    │
│  ( ) Couleur (WUBRG)               │
│                                    │
│  ─────────────                     │
│  ( ) Inverser l'ordre              │
└────────────────────────────────────┘
```

**Notes**
- Sélection radio. Choix appliqué immédiatement, sheet se ferme automatiquement. Mémoriser pour la prochaine session.

---

## #13 — Mode de vue (bottom sheet)

```
                ╴╴╴ drag handle ╴╴╴
┌────────────────────────────────────┐
│ Affichage                     ✕    │
├────────────────────────────────────┤
│                                    │
│  ┌──────┐                          │
│  │ ⊟    │  Liste compacte    (•)   │
│  └──────┘  Densité maxi             │
│                                    │
│  ┌──────┐                          │
│  │ ⊞    │  Grille            ( )   │
│  └──────┘  Image dominante          │
│                                    │
│  ┌──────┐                          │
│  │ ▤    │  Pile              ( )   │
│  └──────┘  Regroupée par nom        │
│                                    │
└────────────────────────────────────┘
```

---

## #14 — Liste des classeurs (`/collection/binders`)

```
┌────────────────────────────────────┐
│ ← Classeurs                  ⊕     │   (1)
├────────────────────────────────────┤
│                                    │
│ ┌──────────────────────────────┐   │
│ │  📔  Toutes mes cartes       │   │   (2)
│ │      247 cartes · 18 230 €   │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │  📕  Deck Commander Yuriko   │   │
│ │      99 cartes · 1 240 €     │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │  📗  À vendre                │   │
│ │      34 cartes · 980 €       │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │  📘  Vintage rares            │   │
│ │      12 cartes · 14 500 €    │   │
│ └──────────────────────────────┘   │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. ⊕ en header : nouveau classeur.
2. "Toutes mes cartes" = classeur virtuel par défaut, non supprimable, contient toute la collection. Différencié visuellement.
- Long press sur un classeur (sauf le virtuel) : menu actions (Renommer, Supprimer, Réordonner). Drag-to-reorder activable depuis le menu ou via mode édition.

---

## #15 — Créer un classeur (`/collection/binders/new`)

Bottom sheet plein écran (ou route dédiée selon plateforme).

```
┌────────────────────────────────────┐
│ ✕ Nouveau classeur                 │
├────────────────────────────────────┤
│                                    │
│  Nom *                             │
│  ┌────────────────────────────┐    │
│  │ Mon nouveau classeur       │    │
│  └────────────────────────────┘    │
│                                    │
│  Description (facultatif)          │
│  ┌────────────────────────────┐    │
│  │                            │    │
│  │                            │    │
│  └────────────────────────────┘    │
│                                    │
│  Icône                             │
│  [📔] [📕] [📗] [📘] [📙] [⭐] [📊] │
│                                    │
│                                    │
│ ╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴   │
├────────────────────────────────────┤
│  [        Créer le classeur     ]  │
└────────────────────────────────────┘
```

**Notes**
- Validation : nom obligatoire, unique (case-insensitive). Erreur inline.
- Au tap "Créer" → toast "Classeur créé" + retour à `/collection/binders` avec le nouveau en tête de liste.

---

## #16 — Vue d'un classeur (`/collection/binders/:id`)

Identique à `/collection` mais filtré, avec header dédié.

```
┌────────────────────────────────────┐
│ ← 📕 Deck Commander Yuriko    ⋮   │   (1)
├────────────────────────────────────┤
│  99 cartes · 1 240 €               │
│ [▼ Trié par : couleur]    [⊟⊞▤]    │
│ [Filtres ▼]                        │
├────────────────────────────────────┤
│  [grille ou liste de cartes,       │
│   identique à #9 / #8]             │
│                                    │
├────────────────────────────────────┤
│  📚    🔍   [⊕]   📊    👤        │
└────────────────────────────────────┘
```

**Notes**
1. Menu ⋮ : Renommer · Réordonner · Vider · Supprimer le classeur · Exporter ce classeur (CSV/JSON).
- Le FAB ⊕ en bas (si présent) ajoute directement dans ce classeur (préremplit le champ classeur sur l'écran d'ajout).

---

## #17 — Éditer un classeur (`/collection/binders/:id/edit`)

```
┌────────────────────────────────────┐
│ ✕ Modifier le classeur             │
├────────────────────────────────────┤
│                                    │
│  Nom                               │
│  ┌────────────────────────────┐    │
│  │ Deck Commander Yuriko      │    │
│  └────────────────────────────┘    │
│                                    │
│  Description                       │
│  ┌────────────────────────────┐    │
│  │ Yuriko, the Tiger's Shadow │    │
│  │ ninja deck                 │    │
│  └────────────────────────────┘    │
│                                    │
│  Icône                             │
│  [📔] [📕] [📗] [📘] [📙] [⭐] [📊] │
│                                    │
│  ─────────────                     │
│                                    │
│  [ Vider le classeur          ]    │   (1)
│      99 cartes seront retirées     │
│                                    │
│  [ Supprimer le classeur     🗑   ]│   (2)
│      Action irréversible            │
│                                    │
├────────────────────────────────────┤
│  [        Enregistrer           ]  │
└────────────────────────────────────┘
```

**Notes**
1. **Vider** : retire le tag "classeur" des cartes mais ne les supprime pas de la collection. Confirmation modale.
2. **Supprimer** : modale avec "tape le nom pour confirmer" (anti-clic accidentel). Cartes orphelines retournent dans "Toutes mes cartes" (jamais perdues).

---

## #18 — Détail exemplaire possédé (`/collection/items/:itemId`)

Gabarit fiche carte étendu avec un bloc "Mon exemplaire". Zone supérieure réservée à la carte, zone inférieure scrollable.

```
┌────────────────────────────────────┐
│ ← Lightning Bolt          ♡  ⋮     │   (1)
├────────────────────────────────────┤
│                                    │
│         ┌────────────┐              │
│         │            │              │
│         │            │              │
│         │   image    │              │   (2)
│         │   carte    │              │
│         │   5:7      │              │
│         │            │              │
│         │            │              │
│         └────────────┘              │
│             tap = zoom              │
│                                    │
│   ─── Mon exemplaire ───           │
│   Quantité      ×3                  │
│   État          NM (Near Mint)      │
│   Foil          Non                 │
│   Langue        EN                  │
│   Classeur      Toutes mes cartes   │
│   Ajoutée le    12/05/2026          │
│   Prix payé     1.20 € (note)       │
│                                    │
│   [   ✎ Modifier l'exemplaire ]    │   (3)
│   [   ⊕ Ajouter un exemplaire ]    │   (4)
│                                    │
│   ─── Caractéristiques ───         │
│   Coût           {R}                │
│   Type           Instant            │
│   Set            Magic 2010 (M10)   │
│   N°             133                │
│   Rareté         Common ●           │
│   Artiste        Christopher Moeller│
│                                    │
│   Texte oracle                     │
│   Lightning Bolt deals 3 damage    │
│   to any target.                   │
│                                    │
│   Prix estimé   1.50 € (Scryfall)  │
│   ✎ mis à jour il y a 2h            │
│                                    │
│   ▶ Autres impressions (8)         │   (5)
│   ▶ Légalité par format             │
│   ▶ Rulings (3)                     │
│   ╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴   │
└────────────────────────────────────┘
```

**Notes**
1. ♡ : favori (toggle). ⋮ : menu (Voir fiche catalogue, Partager, Supprimer cet exemplaire).
2. Image au ratio 5:7 strict, centrée. Tap = ouverture plein écran (#25).
3. **Modifier l'exemplaire** → `/collection/items/:itemId/edit`.
4. **Ajouter un exemplaire** : raccourci pour ajouter une 2e copie (même état/foil/langue par défaut). Évite de re-saisir.
5. Sections en accordéon (fermées par défaut sauf si profondeur faible).
- Scroll : sur mobile, l'image carte rétrécit / sticky en haut au-delà d'un seuil pour garder le contexte.
- Cartes recto-verso : bouton 🔄 sur l'image pour flip.

---

## #19 — Édition exemplaire (`/collection/items/:itemId/edit`)

```
┌────────────────────────────────────┐
│ ✕ Modifier                  Save   │
├────────────────────────────────────┤
│                                    │
│  ┌──────┐  Lightning Bolt          │
│  │ img  │  Magic 2010 · #133       │
│  │      │  Common                   │
│  └──────┘                          │
│                                    │
│  Quantité                          │
│  ┌──┐  ┌──────┐  ┌──┐              │
│  │ -│  │   3  │  │ +│              │   (1)
│  └──┘  └──────┘  └──┘              │
│                                    │
│  État                              │
│  [NM] [LP] [MP] [HP] [DMG]         │   (2)
│                                    │
│  Foil                              │
│  ⃝──● (toggle)                       │
│                                    │
│  Langue                            │
│  [▼ EN — English]                  │
│                                    │
│  Classeur                          │
│  [▼ Toutes mes cartes]             │
│                                    │
│  Prix payé (facultatif)            │
│  ┌────────────────┐                │
│  │  1.20      €   │                │
│  └────────────────┘                │
│                                    │
│  Notes (facultatif)                │
│  ┌────────────────────────────┐    │
│  │ Trouvée à la boutique XYZ  │    │
│  │                            │    │
│  └────────────────────────────┘    │
│                                    │
│  ─────────────                     │
│  [ 🗑 Supprimer cet exemplaire ]   │   (3)
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Stepper +/-, valeur tappable pour saisie clavier. Borne basse 1 (en dessous → suppression confirmée).
2. Chip toggle. Sélection unique. Tooltip au tap long pour rappeler la signification (NM = Near Mint…).
3. Suppression → modale de confirmation (#20).
- Sauvegarde : "Save" en haut à droite (Apple style) ou bouton ancré en bas (Android style). Choix : ancré bas pour cohérence cross-plateforme PWA.
- État optimiste : changement appliqué localement avant la confirmation serveur. Annulation possible via toast en cas d'échec.

---

## #20 — Confirmation de suppression (modale)

```
┌────────────────────────────────────┐
│ (écran d'origine en arrière-plan)  │
│                                    │
│   ╔════════════════════════════╗   │
│   ║                            ║   │
│   ║   Supprimer cet exemplaire ║   │
│   ║                            ║   │
│   ║   Lightning Bolt ×3        ║   │
│   ║   sera retiré de votre     ║   │
│   ║   collection.              ║   │
│   ║                            ║   │
│   ║   Cette action est         ║   │
│   ║   irréversible.            ║   │
│   ║                            ║   │
│   ║  [ Annuler ]   [ Supprimer]║   │   (1)
│   ╚════════════════════════════╝   │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Bouton "Supprimer" en couleur erreur (rouge). Bouton secondaire à gauche, destructif à droite (convention iOS/Material).
- Échap = Annuler. Focus piégé. Focus restauré sur le déclencheur après fermeture.
- Pas de "ne plus me demander" — c'est irréversible, on confirme à chaque fois.
- a11y : `role="alertdialog"`, `aria-labelledby` sur le titre, `aria-describedby` sur le message.

**Variante "vider un classeur"** : même structure, message "X cartes seront retirées du classeur Y mais resteront dans votre collection." Bouton "Vider".

**Variante "supprimer un classeur"** : champ texte "Tapez le nom du classeur pour confirmer" pour bloquer le clic accidentel quand le classeur contient des données.
