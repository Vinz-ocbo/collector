# Wireframes — Search / catalogue

Écrans 21 à 27 de l'inventaire. Catalogue Scryfall + fiche carte.

---

## #21 — Catalogue (`/search`) — état par défaut (vide ou suggestions)

```
┌────────────────────────────────────┐
│ Recherche                  ⋮       │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 🔍 Nom, texte, set, n°…        │ │   (1)
│ └────────────────────────────────┘ │
│ [Filtres ▼]                        │
├────────────────────────────────────┤
│                                    │
│ Recherches récentes                │
│  • lightning bolt                  │
│  • bolas                           │
│  • forest m10                      │
│       [ Effacer l'historique ]     │
│                                    │
│ ─────────────                      │
│                                    │
│ Suggestions                        │   (2)
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ img  │ │ img  │ │ img  │         │
│  └──────┘ └──────┘ └──────┘         │
│  Sets récents : OTJ · MKM · LCI    │
│                                    │
│  Cartes populaires cette semaine   │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ img  │ │ img  │ │ img  │         │
│  └──────┘ └──────┘ └──────┘         │
│                                    │
├────────────────────────────────────┤
│  📚    🔍   [⊕]   📊    👤        │
└────────────────────────────────────┘
```

**Notes**
1. Champ recherche persistant. Focus auto si l'écran est appelé via le tab Recherche après tap explicite — sinon focus uniquement au tap utilisateur (évite le clavier intempestif).
2. Suggestions = prefetch. Sur mobile, garder léger (3 sets, 3 cartes) pour la perf.
- a11y : `role="search"` sur le formulaire, label invisible mais présent sur l'input.
- Hors-ligne : recherche limitée au cache local (cartes déjà vues récemment) + bandeau "Mode hors-ligne — recherche limitée à votre cache".

---

## Catalogue — résultats (en frappant)

```
┌────────────────────────────────────┐
│ Recherche                  ⋮       │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 🔍 lightning              ✕    │ │
│ └────────────────────────────────┘ │
│ [Filtres ▼]    [Trier : pertinence]│
│ 142 résultats                      │   (1)
├────────────────────────────────────┤
│ [img] Lightning Bolt               │   (2)
│       Magic 2010 · Common · 1.50€  │
│       Possédée ×3 ✓                 │   (3)
├────────────────────────────────────┤
│ [img] Lightning Strike              │
│       Theros Beyond Death · Com.   │
│       0.30€                        │
├────────────────────────────────────┤
│ [img] Chain Lightning               │
│       Legends · Uncommon · 8.00€   │
│       Possédée ×1 ✓                 │
├────────────────────────────────────┤
│ [img] Lightning Greaves             │
│       Mirrodin · Uncommon · 4.50€  │
├────────────────────────────────────┤
│ [img] Lightning Helix                │
│       Ravnica Allegiance · Uncomm. │
│       1.80€                        │
└────────────────────────────────────┘
```

**Notes**
1. Compteur live des résultats.
2. Vignette miniature (40×56). Affichage liste compact par défaut. Toggle grille possible.
3. **Indicateur "déjà possédée"** ✓ avec quantité — feature clé pour ne pas re-acheter en double. Toujours visible dans les résultats catalogue.
- Tap → `/search/cards/:cardId`.
- Long press → menu rapide : Ajouter à ma collection, Voir autres impressions.

---

## #23 — Catalogue — empty (pas de résultat)

```
┌────────────────────────────────────┐
│ Recherche                  ⋮       │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 🔍 lighting                ✕   │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│                                    │
│              🔍                    │
│                                    │
│        Aucun résultat              │
│                                    │
│   Aucune carte ne correspond à     │
│   « lighting ».                    │
│                                    │
│   Suggestions :                    │   (1)
│    • Vérifiez l'orthographe        │
│    • Essayez « lightning »         │
│    • Retirez certains filtres      │
│      (3 filtres actifs)            │
│                                    │
│   [    Effacer la recherche    ]   │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Suggestions intelligentes : correction orthographique (Levenshtein), proposition de retirer des filtres si actifs.

---

## #22 — Filtres catalogue (bottom sheet)

Identique structurellement à `/collection/filters` (#11), avec quelques différences :

```
                ╴╴╴ drag handle ╴╴╴
┌────────────────────────────────────┐
│ Filtres                       ✕    │
├────────────────────────────────────┤
│                                    │
│ Couleur                            │
│  [W] [U] [B] [R] [G] [colorless]   │
│  ⚙ Mode : Au moins                  │
│                                    │
│ Type                               │
│  [▼ Tous les types]                │
│                                    │
│ Rareté                             │
│  [Common] [Uncommon] [Rare] [Myth] │
│                                    │
│ Set / Extension                    │
│  [▼ Tous]   ✕  M10  ✕  ZEN          │   (1)
│                                    │
│ Année                              │
│  De [1993 ▼] à [2026 ▼]            │
│                                    │
│ Format légal                       │   (2)
│  [▼ Tous] (Standard, Modern, …)    │
│                                    │
│ Prix (Scryfall)                    │
│  De [    0 €] à [   ∞ €]           │
│                                    │
│ Langue de l'impression             │
│  [▼ Toutes]                        │
│                                    │
│ ─────────────                       │
│ [x] Masquer les cartes que je       │   (3)
│     possède déjà                    │
│                                    │
├────────────────────────────────────┤
│  [Réinitialiser]    [Appliquer]    │
└────────────────────────────────────┘
```

**Notes**
1. Sets sélectionnés en chips dans le champ.
2. Filtres spécifiques au catalogue (vs collection).
3. Switch utile pour la chasse aux cartes manquantes — feature clé collectionneur.

---

## #24 — Fiche carte catalogue (`/search/cards/:cardId`)

```
┌────────────────────────────────────┐
│ ← Lightning Bolt          ♡  ⋮     │
├────────────────────────────────────┤
│                                    │
│         ┌────────────┐              │
│         │            │              │
│         │            │              │
│         │  image      │              │
│         │  carte      │              │
│         │  5:7 zoom   │              │
│         │            │              │
│         │            │              │
│         └────────────┘              │
│        🔄 (flip si DFC)              │   (1)
│                                    │
│   ─── État de ma collection ───    │
│   Possédée ×3 (NM, EN, M10)        │   (2)
│   [   Voir mes exemplaires  →  ]   │
│                                    │
│   [  ⊕  Ajouter à ma collection ]  │   (3)
│                                    │
│   ─── Caractéristiques ───         │
│   Coût          {R}                │
│   Type          Instant            │
│   Set           Magic 2010 · #133  │
│   Rareté        Common ●           │
│   Artiste       Christopher Moeller│
│                                    │
│   Texte oracle                     │
│   Lightning Bolt deals 3 damage    │
│   to any target.                   │
│                                    │
│   Texte d'ambiance                  │
│   « The sparkmage shrieked, calling│
│   on the elements... »              │
│                                    │
│   Prix estimé   1.50 € (Scryfall)  │
│   Tendance     ↗ +12% sur 30j      │   (4)
│                                    │
│   ▶ Autres impressions (8)         │
│   ▶ Légalité par format             │
│   ▶ Rulings (3)                     │
│   ▶ Prix par marketplace (TCGPlayer,│
│      CardMarket…)                   │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Bouton flip pour cartes recto-verso (transform, modal-DFC). Animation ≤ 300 ms.
2. **Bloc "État de ma collection"** : si l'utilisateur possède déjà cette carte, affichage en haut. Sinon, le bloc est masqué et seul le bouton ⊕ est présent.
3. CTA principal sticky en bas si la fiche est longue (sur scroll, le bouton reste visible). En desktop, peut être à droite dans une sidebar.
4. Tendance prix : indicateur visuel (flèche + pourcentage 30j). Permet décision d'achat.
- Toutes les métadonnées tappables sont des **tags cliquables** qui filtrent le catalogue (per specs : "Chaque date est un tag cliquable") : artiste → catalogue filtré par artiste, set → catalogue filtré par set, type → idem.
- Symboles de mana en SVG natif, pas en bitmap.

---

## #25 — Image plein écran (overlay)

```
┌────────────────────────────────────┐
│  ✕                          ⋮      │   (1)
│                                    │
│                                    │
│        ┌──────────────┐             │
│        │              │             │
│        │              │             │
│        │              │             │
│        │   image      │             │
│        │   pleine     │             │
│        │   qualité    │             │
│        │              │             │
│        │              │             │
│        │              │             │
│        └──────────────┘             │
│                                    │
│         pinch / double-tap          │
│         pour zoomer                 │
│                                    │
│        ◀ 1 / 8 ▶                   │   (2)
│        Magic 2010                  │
└────────────────────────────────────┘
```

**Notes**
1. ✕ ferme. ⋮ : Partager, Télécharger (réservé : à valider conformité Scryfall).
2. Si la carte a plusieurs impressions et qu'on est arrivé depuis une vue groupée, navigation entre les impressions au swipe horizontal.
- Fond noir 90% opacité.
- Swipe vers le bas pour fermer (pattern iOS standard).
- a11y : `role="dialog"`, focus piégé, Échap pour fermer.

---

## #26 — Autres impressions (`/search/cards/:cardId/printings`) — P1

```
┌────────────────────────────────────┐
│ ← Lightning Bolt — impressions     │
├────────────────────────────────────┤
│ 8 impressions trouvées             │
│ [▼ Trier : prix ↓]                 │
├────────────────────────────────────┤
│ [img] Magic 2010 (M10) #133        │
│       Common · 2009 · 1.50€        │
│       ✓ Possédée ×3                 │
├────────────────────────────────────┤
│ [img] Beta (LEB) #161               │
│       Common · 1993 · 320€          │
├────────────────────────────────────┤
│ [img] Alpha (LEA) #161              │
│       Common · 1993 · 480€          │
├────────────────────────────────────┤
│ [img] Revised (3ED) #161            │
│       Common · 1994 · 18€           │
├────────────────────────────────────┤
│ [img] 4th Edition (4ED) #213        │
│       Common · 1995 · 4€            │
├────────────────────────────────────┤
│ [img] Masters 25 (A25) #141         │
│       Uncommon · 2018 · 1.80€       │
├────────────────────────────────────┤
│ [img] Strixhaven Mystical (STA)     │
│       Mythic · 2021 · 14€  ✨ Foil  │
└────────────────────────────────────┘
```

**Notes**
- Tap → fiche détail de cette impression spécifique.
- Indicateur "possédée" intégré.

---

## #27 — Rulings (`/search/cards/:cardId/rulings`) — P1

```
┌────────────────────────────────────┐
│ ← Lightning Bolt — rulings         │
├────────────────────────────────────┤
│                                    │
│ 📅 2004-10-04                      │
│ Lightning Bolt can target a player │
│ even if no creature is in play.    │
│                                    │
│ ─────────────                       │
│                                    │
│ 📅 2009-10-01                      │
│ "Any target" means any single      │
│ creature, planeswalker, or player. │
│                                    │
│ ─────────────                       │
│                                    │
│ 📅 2018-04-27                      │
│ With recent changes, "any target"  │
│ now also includes battles.         │
│                                    │
│                                    │
│ Source : Wizards of the Coast      │
│ via Scryfall                       │
└────────────────────────────────────┘
```

**Notes**
- Rulings triées du plus récent au plus ancien par défaut (toggle inverse possible).
- Mention de la source obligatoire.
