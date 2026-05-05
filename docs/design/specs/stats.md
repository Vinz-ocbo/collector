# Specs — Stats

Écrans 41 à 46. Wireframes : [`../wireframes/stats.md`](../wireframes/stats.md).

---

## #41 — Stats — vue d'ensemble (`/stats`)

**Wireframe** : stats.md #41

**Objectif** : présenter les KPIs principaux et les portes d'entrée vers les déclinaisons.

**Données calculées (côté client, depuis IndexedDB)**
- Nombre total de cartes (somme des quantités).
- Nombre de cartes uniques.
- Nombre de doublons (total - uniques).
- Valeur estimée totale (somme `price × quantity`).
- Variation de valeur 30j (depuis snapshots backend).
- Cartes ajoutées ce mois.
- Top 5 par valeur unitaire.

**Composants** : header, cartes-KPI, grille de tuiles, top 5.

**Interactions**
- Tap "Voir l'évolution" → `/stats/value-history`.
- Tap tuile → écran de déclinaison (#42 à #45).
- Tap "Voir tout" du top 5 → `/collection?sort=value-desc`.

**États**
- `default` : KPIs chargés.
- `loading` : skeletons sur chaque KPI.
- `empty` : si collection vide → redirection auto vers `/collection` (état #7).
- `error` : "Statistiques indisponibles" + retry.
- `partial` : KPIs locaux affichés, variation 30j marquée "indisponible hors-ligne".

**Edge cases**
- Collection très grande (10 000+) : calculer dans un Web Worker.
- Snapshots de valeur indisponibles (premier mois) : masquer la variation 30j ou afficher "—".

**A11y**
- Chaque carte-KPI : `<section aria-labelledby>` avec un titre.
- Tuiles cliquables : `<a>` ou `<button>` avec `aria-label` complet.
- Top 5 : liste sémantique.
- Variations chiffrées lues correctement ("plus 245 euros sur 30 jours").

**Performance**
- Calcul KPI en Web Worker si collection > 1 000 items.
- Memoize résultats.
- Pas de chart sur cette vue (allégé).

**Critères d'acceptation**
- [ ] KPIs exacts.
- [ ] Tuiles cliquables.
- [ ] Top 5 visible.
- [ ] Calcul performant (≤ 100 ms p95 pour 1 000 items).

---

## #42 — Stats par couleur (`/stats/by-color`)

**Wireframe** : stats.md #42

**Données** : agrégation par couleur (extraite de `card.meta.colors` pour Magic).

**Composants** : donut chart, légende, top 3 par couleur.

**Catégories Magic**
- Blanc (W), Bleu (U), Noir (B), Rouge (R), Vert (G), Multicolore (≥ 2 couleurs), Incolore.

**Interactions**
- Tap segment du donut → filtre `/collection?color=W`.
- Tap entrée légende → idem.
- Tap top → fiche carte.

**A11y**
- Le donut chart a un fallback texte (table accessible) avec les mêmes données.
- Couleurs **+ symboles** dans la légende (jamais que la couleur).
- Chaque entrée a un label complet ("Bleu, 58 cartes, 23 pourcent").

**Performance**
- Chart léger (Recharts ou chart.js, < 50 KB).
- Animation d'entrée 300 ms, respect `prefers-reduced-motion`.

**Pokémon (futur)** : remplacé par "type" (Eau, Feu, Plante…). Le composant reste le même, le module TCG fournit les catégories et la palette.

**Critères d'acceptation**
- [ ] Donut chart fonctionnel.
- [ ] Légende exacte.
- [ ] Tap → filtre collection.
- [ ] Fallback table accessible.

---

## #43 — Stats par type (`/stats/by-type`)

**Wireframe** : stats.md #43

**Données** : agrégation par `card.meta.type` (Créature, Sort, Terrain, etc.).

**Composants** : barres horizontales triées par fréquence.

**Interactions**
- Tap barre → `/collection?type=creature`.

**Critères d'acceptation**
- [ ] Barres affichées par fréquence ↓.
- [ ] Tap → filtre collection.

---

## #44 — Stats par rareté (`/stats/by-rarity`)

**Wireframe** : stats.md #44

**Données**
- Répartition par rareté (donut).
- Valeur cumulée par rareté (barres horizontales secondaires).

**Insight** : déséquilibre entre nombre et valeur souvent intéressant pour le collectionneur.

**Critères d'acceptation**
- [ ] Donut + valeur par rareté.
- [ ] Tap → filtre collection.

---

## #45 — Complétion par set (`/stats/by-set`)

**Wireframe** : stats.md #45

**Données**
- Pour chaque set : nombre de cartes possédées / total dans le set, par rareté.
- Total Scryfall obtenu via backend.

**Composants** : liste de sets avec barre de progression et détail par rareté.

**Interactions**
- Tap set → `/collection?set=M10`.
- Tri : % complétion ↓ (défaut), nom, date de sortie, possédées ↓.
- Filtres : "Sets entamés" / "Tous" / "Complétés".

**Edge cases**
- Sets exclusifs (Secret Lair, etc.) : afficher avec un badge spécial.
- Sets très anciens (Alpha, Beta) : symbole étoile pour leur valeur historique.

**Performance**
- Listes longues (200+ sets) → virtualisation.
- Calcul de complétion mis en cache.

**Critères d'acceptation**
- [ ] Tous les sets accessibles.
- [ ] % de complétion exact.
- [ ] Détail par rareté.
- [ ] Tap → filtre collection.

---

## #46 — Évolution de la valeur (`/stats/value-history`) — P2

**Wireframe** : stats.md #46

**Statut** : post-MVP. Mais snapshots à mettre en place dès le MVP.

**Données**
- Snapshots quotidiens de la valeur totale (backend, calculés à 04:00 UTC).
- Achats sur la période (filtrés `pricePaid IS NOT NULL`).

**Composants** : line chart, sélecteur de plage, top mouvements, achats du mois.

**Interactions**
- Sélecteur de plage : 7j, 30j, 90j, 1an, Tout. Tap → recalcule la courbe.
- Tap sur un point du chart → tooltip détail (valeur ce jour-là, événements).

**Critères d'acceptation** (P2)
- [ ] Snapshots collectés dès le MVP.
- [ ] Courbe rendue post-MVP.
