# Wireframes — Stats

Écrans 41 à 46 de l'inventaire. Vue d'ensemble + déclinaisons.

---

## #41 — Stats — vue d'ensemble (`/stats`)

```
┌────────────────────────────────────┐
│ Statistiques                ⋮      │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 📚 247                       │  │   (1)
│  │ cartes au total               │  │
│  │ 89 uniques · 158 doublons    │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 💰 18 230 €                  │  │
│  │ valeur estimée totale         │  │
│  │ ↗ +245 € sur 30 jours         │  │   (2)
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 📅 +12 cartes ce mois         │  │
│  │  Voir l'évolution ▶           │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─── Voir par ─── (cliquables)    │   (3)
│                                    │
│  ┌────────┐  ┌────────┐  ┌────────┐│
│  │  🎨    │  │  🃏    │  │  ⭐    ││
│  │Couleur │  │  Type  │  │Rareté │ │
│  └────────┘  └────────┘  └────────┘│
│  ┌────────┐  ┌────────┐            │
│  │  📦    │  │  📈    │            │
│  │  Set   │  │ Valeur │            │
│  └────────┘  └────────┘            │
│                                    │
│  ─── Top de ma collection ───      │
│  ┌──────────────────────────────┐  │   (4)
│  │ 1. Black Lotus       12 500€ │  │
│  │ 2. Time Walk          5 800€ │  │
│  │ 3. Mox Sapphire       4 200€ │  │
│  │ 4. Ancestral Recall   3 900€ │  │
│  │ 5. Mox Ruby           2 400€ │  │
│  │              [ Voir tout ▶ ] │  │
│  └──────────────────────────────┘  │
│                                    │
├────────────────────────────────────┤
│  📚    🔍   [⊕]   📊    👤        │
└────────────────────────────────────┘
```

**Notes**
1. Cartes-KPIs grandes, lisibles. Hiérarchie : nombre > valeur > activité.
2. Tendance 30 jours (variation valeur cumulative). Couleur selon signe.
3. Grille de tuiles cliquables vers les déclinaisons (#42–#45).
4. Top 5 valeur. Tap "Voir tout" → liste complète triée par valeur descendante (réutilise `/collection` avec tri imposé).
- Loading : skeletons pour chaque carte-KPI.
- Empty (collection vide) : redirige vers `/collection` (état #7).
- a11y : chaque KPI est un bloc avec `aria-label` agrégé ("247 cartes au total, dont 89 uniques et 158 doublons").

---

## #42 — Stats par couleur (`/stats/by-color`)

```
┌────────────────────────────────────┐
│ ← Par couleur                      │
├────────────────────────────────────┤
│                                    │
│       ┌────────────────┐           │
│       │                │           │
│       │   camembert     │           │   (1)
│       │   par couleur   │           │
│       │   (donut chart) │           │
│       │                 │           │
│       │   247 cartes    │           │
│       └────────────────┘           │
│                                    │
│  ─── Légende ───                   │
│                                    │
│  ⚪ Blanc (W)        42  (17%)     │   (2)
│  🔵 Bleu (U)         58  (23%)     │
│  ⚫ Noir (B)         51  (21%)     │
│  🔴 Rouge (R)        47  (19%)     │
│  🟢 Vert (G)         34  (14%)     │
│  🌈 Multicolore      10   (4%)     │
│  ⚪ Incolore           5   (2%)     │
│                                    │
│  ─── Top 3 par couleur ───         │   (3)
│                                    │
│  🔵 Bleu                            │
│  ┌────────────────────────────┐    │
│  │ [img] Counterspell ×8       │    │
│  │ [img] Brainstorm ×4         │    │
│  │ [img] Force of Will ×1      │    │
│  └────────────────────────────┘    │
│                                    │
│  🔴 Rouge                           │
│  ┌────────────────────────────┐    │
│  │ [img] Lightning Bolt ×3     │    │
│  │ ...                         │    │
│  └────────────────────────────┘    │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Donut chart. Tap sur un segment → filtre la collection sur cette couleur (`/collection?color=W`).
2. Couleur **+ symbole** + nom (jamais juste la couleur — accessibilité).
3. Top 3 par couleur permet d'identifier les pièces fortes par axe.
- Le composant chart reçoit ses labels et sa palette du module TCG actif (Magic ici → WUBRG). Pour Pokémon plus tard, les types remplaceront les couleurs sans changer le composant.

---

## #43 — Stats par type (`/stats/by-type`)

```
┌────────────────────────────────────┐
│ ← Par type                         │
├────────────────────────────────────┤
│                                    │
│  ┌────────────────────────────┐    │
│  │  graphique en barres        │    │   (1)
│  │  horizontales                │    │
│  └────────────────────────────┘    │
│                                    │
│  Créature       ▓▓▓▓▓▓▓▓░░  102    │
│  Sort           ▓▓▓▓▓░░░░░   58    │
│  Terrain        ▓▓▓▓░░░░░░   45    │
│  Enchantement   ▓▓░░░░░░░░   18    │
│  Artefact       ▓▓░░░░░░░░   15    │
│  Planeswalker   ▓░░░░░░░░░    7    │
│  Tribal         ░░░░░░░░░░    2    │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Barres horizontales triées par fréquence. Tap sur une barre → `/collection?type=creature`.

---

## #44 — Stats par rareté (`/stats/by-rarity`)

```
┌────────────────────────────────────┐
│ ← Par rareté                       │
├────────────────────────────────────┤
│                                    │
│       ┌────────────────┐           │
│       │  donut          │           │
│       │                 │           │
│       └────────────────┘           │
│                                    │
│  ⚪ Common         128  (52%)      │
│  🟤 Uncommon        78  (32%)      │
│  🥇 Rare            34  (14%)      │
│  🌟 Mythic Rare      7   (3%)      │
│                                    │
│  ─── Valeur par rareté ───         │   (1)
│                                    │
│  Mythic            12 800 €  (70%) │
│  Rare               4 200 €  (23%) │
│  Uncommon             980 €   (5%) │
│  Common               250 €   (1%) │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Mise en évidence du déséquilibre nombre/valeur (peu de mythiques mais grosse part de la valeur). Insight collectionneur.

---

## #45 — Complétion par set (`/stats/by-set`)

```
┌────────────────────────────────────┐
│ ← Par extension                    │
├────────────────────────────────────┤
│ [▼ Trier : % complétion ↓]         │
│ [Filtres ▼]                        │
├────────────────────────────────────┤
│                                    │
│ Magic 2010 (M10)         42 / 249  │
│ ▓▓░░░░░░░░░░░░░░░░░░░░░░░  17%   │   (1)
│ Common 35/101 · Uncommon 5/60      │
│ Rare 2/53 · Mythic 0/15            │
│                                    │
├────────────────────────────────────┤
│ Zendikar (ZEN)           24 / 269  │
│ ▓░░░░░░░░░░░░░░░░░░░░░░░░░  9%   │
│ Common 18/101 · Uncommon 4/60 · …  │
│                                    │
├────────────────────────────────────┤
│ Innistrad: Crimson Vow   12 / 277  │
│ ▓░░░░░░░░░░░░░░░░░░░░░░░░░  4%   │
│                                    │
├────────────────────────────────────┤
│ Beta (LEB) ⭐             3 / 302   │   (2)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░  1%   │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Barre de progression visible par set. Détail par rareté en sous-titre.
2. ⭐ = sets précieux/rares mis en évidence visuellement.
- Tri par défaut : % complétion descendant. Autres tris : nom, date de sortie, nombre de cartes possédées.
- Tap sur un set → `/collection?set=M10`.
- Filtre : afficher seulement les sets entamés / tous les sets / sets complétés.

---

## #46 — Évolution de la valeur (`/stats/value-history`) — P2

```
┌────────────────────────────────────┐
│ ← Évolution de la valeur           │
├────────────────────────────────────┤
│                                    │
│  Valeur actuelle  18 230 €          │
│  ↗ +245 € (+1.4%) sur 30 jours      │
│                                    │
│  ┌────────────────────────────┐    │
│  │                            │    │
│  │     graphique courbe       │    │   (1)
│  │     valeur dans le temps   │    │
│  │                            │    │
│  │                            │    │
│  └────────────────────────────┘    │
│                                    │
│  [7j] [30j] [90j] [1an] [Tout]      │   (2)
│                                    │
│  ─── Top mouvements (30j) ───      │
│                                    │
│  ↗ Black Lotus       +800 €         │   (3)
│  ↗ Force of Will     +120 €         │
│  ↘ Counterspell       -45 €         │
│  ↗ Sol Ring           +30 €         │
│                                    │
│  ─── Mes achats ce mois ───         │
│  • Lightning Bolt ×2  · 3 €         │
│  • Brainstorm ×1      · 25 €        │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Line chart de la valeur cumulative. Snapshots quotidiens stockés côté serveur.
2. Plages temporelles. Tap → recalcule la courbe (skeleton chart pendant le rechargement).
3. Top mouvements = cartes ayant le plus bougé (en valeur absolue) sur la période. Distinction acquisitions vs évolution de marché.
- Post-MVP. Demande un historique → nécessite snapshots dès le MVP même si la vue n'est pas livrée.
