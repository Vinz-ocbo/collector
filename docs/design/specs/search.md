# Specs — Search / catalogue

Écrans 21 à 27. Wireframes : [`../wireframes/search.md`](../wireframes/search.md).

---

## #21 — Catalogue (`/search`)

**Wireframe** : search.md #21 + résultats

**Objectif** : rechercher dans le catalogue Magic complet (Scryfall) et identifier les cartes que l'utilisateur possède déjà.

**Données**
- Catalogue Scryfall via backend proxy.
- Indicateur "possédée ×N" depuis IndexedDB (jointure locale sur `cardId`).
- Suggestions : sets récents (Scryfall), top cartes populaires (proxy backend).
- Recherches récentes : IndexedDB local.

**Composants**
- Header avec titre, ⋮.
- Champ recherche (Input avec icône + ✕).
- Filtres + tri.
- Liste de résultats (mode liste compact par défaut, toggle vers grille).
- Empty state (#23).
- Tab bar.

**Interactions**
- **Frappe dans le champ** : debounce 250 ms → requête backend.
- **Tap suggestion / récent** → préremplit le champ et lance la requête.
- **Tap résultat** → `/search/cards/:cardId`.
- **Long press résultat** → menu rapide (Ajouter, Voir impressions).
- **Tap "Filtres"** → bottom sheet #22.
- **Pull-to-refresh** → invalide les requêtes catalogue (rare, normalement le cache suffit).
- **Tap ✕ dans le champ** → vide la recherche + revient à l'état "vide".

**Validations** : aucune sur la requête (côté serveur Scryfall plus permissif).

**États**
- `idle` (champ vide) : recherches récentes + suggestions.
- `loading` (frappe en cours) : skeletons.
- `default` : résultats.
- `empty` : voir #23.
- `error` : "Recherche indisponible" + retry.
- `offline` : recherche limitée au cache local + bandeau d'info.

**Edge cases**
- Requête très large (`*`) ou trop courte (1 caractère) : ne pas envoyer (debounce + min 2 caractères).
- Scryfall down (5xx) : utiliser le cache si possible, sinon erreur.
- Résultat > 1000 : pagination cursor-based, "Charger plus" en bas.
- Cartes promotionnelles ou tokens : présentes dans le catalogue, marquées en sous-titre.

**A11y**
- Input avec `role="search"` ou `<input type="search">`.
- Résultats : liste sémantique.
- Compteur "X résultats" annoncé via `aria-live="polite"`.
- Indicateur "déjà possédée" lu par l'AT (icône avec `aria-label`).

**Performance**
- Requêtes mises en cache TanStack Query (5 min).
- Images vignettes en `small` Scryfall (≤ 100 KB), lazy.
- Pagination virtualisée si > 100 résultats.
- Throttle scroll au prefetch de la page suivante.

**Sécurité**
- Toutes les requêtes Scryfall passent par le backend (jamais en direct depuis le client).
- Backend : User-Agent identifiable + rate limit (≤ 10 req/s global).

**Analytics**
- `search.queried` (length, has_filters).
- `search.result_clicked` (position, is_owned).

**Critères d'acceptation**
- [ ] Recherche en temps réel fonctionnelle.
- [ ] Indicateur "possédée" exact.
- [ ] Suggestions prefetched.
- [ ] Hors-ligne : cache utilisable.
- [ ] Pas de fuite directe vers Scryfall depuis le client.

---

## #22 — Filtres catalogue (bottom sheet)

**Wireframe** : search.md #22

**Champs supplémentaires vs collection** : année, format légal, "masquer cartes possédées".

**Interactions** : identiques à #11.

**Critères d'acceptation**
- [ ] Tous les filtres combinables.
- [ ] Filtre "masquer possédées" fonctionnel et exact.

---

## #23 — Catalogue empty (état)

**Wireframe** : search.md #23

**Objectif** : guider vers une recherche fructueuse quand 0 résultat.

**Logique**
- Si query > 0 + filtres > 0 → suggérer de retirer des filtres.
- Si query a une distance Levenshtein ≤ 2 d'un nom de carte fréquent → proposer la correction.
- Toujours offrir "Effacer la recherche".

**Critères d'acceptation**
- [ ] Suggestions intelligentes affichées.
- [ ] Compteur de filtres actifs exact.

---

## #24 — Fiche carte catalogue (`/search/cards/:cardId`)

**Wireframe** : search.md #24

**Objectif** : consulter toutes les infos d'une carte du catalogue + ajouter à la collection.

**Données**
- `Card` complète (Scryfall via backend cache).
- `CollectionItem`s correspondants si possédée (jointure locale).
- Tendance prix (calculée backend, snapshot 30j).

**Sections**
1. Image carte.
2. "État de ma collection" (si possédée).
3. CTA principal (Ajouter / Voir mes exemplaires).
4. Caractéristiques.
5. Texte oracle + ambiance.
6. Prix + tendance.
7. Accordéons : autres impressions, légalité, rulings, prix par marketplace (P1).

**Interactions**
- Idem #18 mais avec CTA "Ajouter à ma collection" → `/add/manual/details?cardId=:id`.
- Si possédée : "Voir mes exemplaires" → `/collection?cardId=:id` (filtré).
- Tags cliquables → catalogue filtré.

**États** : default, loading (skeleton), error.

**Edge cases**
- Carte interdite/bannie dans tous les formats : section légalité visible, sinon section masquée.
- Plusieurs faces (DFC) : bouton flip.
- Pas de prix (carte récente non encore cotée) : afficher "—" sans masquer la section.

**A11y / Perf** : idem #18.

**Critères d'acceptation**
- [ ] Toutes les données rendues.
- [ ] Indicateur "possédée" en haut.
- [ ] CTA Ajouter fonctionne.
- [ ] Tags cliquables.

---

## #25 — Image plein écran (overlay)

**Wireframe** : search.md #25

**Interactions**
- Pinch zoom (jusqu'à 4×).
- Double-tap = zoom centré sur le tap (ou dézoom si déjà zoomé).
- Swipe vertical (down) pour fermer.
- Swipe horizontal entre impressions (si applicable).
- Tap ✕ pour fermer.
- Échap pour fermer.

**Données** : image en `png` Scryfall (full quality), prefetch quand l'utilisateur reste 500 ms sur la fiche détail.

**A11y**
- `role="dialog"` `aria-modal`.
- Focus piégé.
- `aria-label` sur l'image avec description complète.
- Boutons (✕, ⋮) accessibles au clavier (Tab).

**Performance**
- Image full quality chargée à l'ouverture (déjà prefetchée idéalement).
- Skeleton pendant chargement.
- Une seule image en mémoire (libérer les autres impressions si pas affichées).

**Sécurité / Conformité Scryfall**
- Pas d'altération de l'image (filtre, watermark, désaturation).
- Mention artiste accessible (au tap d'un bouton ⋮ → info).
- Téléchargement : à valider conformité (Scryfall autorise dans certains contextes).

**Critères d'acceptation**
- [ ] Zoom pinch et double-tap fluides.
- [ ] Swipe down ferme.
- [ ] Échap ferme.
- [ ] Pas d'altération de l'image.

---

## #26 — Autres impressions (`/search/cards/:cardId/printings`) — P1

**Wireframe** : search.md #26

**Objectif** : voir toutes les impressions d'un nom de carte.

**Données** : backend → Scryfall `prints_search_uri` + jointure locale "possédée".

**Interactions**
- Tap impression → fiche détail de cette impression.
- Tri : prix ↓, date ↓, rareté.

**Critères d'acceptation**
- [ ] Toutes les impressions listées.
- [ ] Possédées indiquées.
- [ ] Tri fonctionnel.

---

## #27 — Rulings (`/search/cards/:cardId/rulings`) — P1

**Wireframe** : search.md #27

**Objectif** : consulter les rulings officiels (clarifications de règles).

**Données** : Scryfall rulings via backend.

**Interactions** : tri par date, lecture seule.

**A11y** : article sémantique, dates au format lisible.

**Critères d'acceptation**
- [ ] Rulings affichés.
- [ ] Source mentionnée.
