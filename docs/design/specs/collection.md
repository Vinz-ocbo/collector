# Specs — Collection

Écrans 7 à 20. Wireframes : [`../wireframes/collection.md`](../wireframes/collection.md).

---

## #7 — Collection vide (`/collection` état empty)

**Wireframe** : collection.md #7

**Objectif** : guider l'utilisateur vers son premier ajout.

**Données** : aucune (état déclenché si `count(items) === 0`).

**Composants** : empty state (illustration + titre + texte + 2 CTAs).

**Interactions**
- Tap "Ajouter une carte" → bottom sheet `/add/choose` (#36).
- Tap "Scanner un lot" → `/scan/batch` direct.

**Critères d'acceptation**
- [ ] Affiché si aucun item dans la collection.
- [ ] Disparaît dès le premier ajout.
- [ ] Les 2 CTAs sont fonctionnels.

---

## #8, #9, #10 — Collection (3 modes de vue)

**Wireframes** : collection.md #8 #9 #10

**Objectif** : consulter, parcourir et organiser sa collection avec différentes densités d'information.

**Données affichées**
- Tous les `CollectionItem` (filtrés par filtres actifs).
- Pour chaque item : `Card` jointe (image, nom, set), métadonnées exemplaire (qté, état, foil, langue).
- Compteur total dans le header.
- Mode pile : agrégation par `cardId` (sommer quantités, compter versions distinctes).

**Source des données**
- IndexedDB (Dexie) : source primaire.
- TanStack Query pour la sync avec backend (refresh au pull-to-refresh).

**Composants**
- Header avec compteur, recherche, menu ⋮.
- Barre de tri / filtres / mode de vue (sticky sous le header).
- Chips de filtres actifs.
- Liste virtualisée (TanStack Virtual ou react-window) dès 100+ items.
- Card item (3 variantes : compact, grid, stack).
- FAB ⊕ flottant (bas droit).
- Tab bar.

**Interactions**
- **Tap item** → `/collection/items/:itemId`.
- **Long press item** → menu contextuel (Modifier, Dupliquer, Déplacer, Supprimer).
- **Tap "Trié par : X"** → bottom sheet #12.
- **Tap chip filtre actif ✕** → retire ce filtre (avec animation reflow).
- **Tap "Filtres ▼"** → bottom sheet #11.
- **Tap toggle mode de vue** → bottom sheet #13 OU bascule directe entre modes.
- **Pull-to-refresh** → invalide la query catalogue (rafraîchit prix), pas la collection (déjà locale).
- **Scroll** : header se réduit légèrement (titre passe en `H1` plus petit), barre de tri reste sticky.
- **Tap recherche 🔍** → ouvre une barre de recherche inline dans la collection.

**Validations** : aucune (écran de consultation).

**États**
- `default` : items chargés.
- `loading` : skeletons grid/list (4–6 items).
- `empty` : voir #7.
- `empty filtré` : "Aucune carte ne correspond aux filtres" + "Réinitialiser les filtres".
- `error` : "Impossible de charger la collection" + retry.
- `offline` : bandeau + données du cache.

**Edge cases**
- 0 cartes mais filtres actifs → empty filtré (différent de #7).
- Image carte introuvable → placeholder neutre (ratio 5:7) avec icône et nom alt.
- Sync en cours après ajout offline → badge "à synchroniser" sur les items concernés.
- Doublons stricts (même cardId + même état/foil/langue/binder) → fusion automatique (incrément de quantité), avec toast "+1 exemplaire fusionné".
- Très grosse collection (10 000+) : pagination cursor-based + virtualisation indispensable.

**A11y**
- Liste : `role="list"`, items `role="listitem"`.
- Grille : `role="grid"` ou simple liste avec `aria-label` "X cartes".
- Quantité dans `aria-label` complet ("Lightning Bolt, 3 exemplaires en Near Mint").
- Mode de vue : `aria-pressed` sur les boutons toggle.
- Long press accessible via menu icône ⋮ (alternative clavier).

**Performance**
- Virtualisation dès 100 items.
- Images lazy-loadées (`loading="lazy"`), srcset adaptatif.
- Vignettes en `small` Scryfall (≤ 100 KB).
- React.memo sur le composant Card item.
- Recompute filtres dans un Web Worker si > 5 000 items.
- Maintenir 60 fps au scroll.

**Sécurité**
- Données strictement scopées à l'utilisateur (vérif backend obligatoire à chaque requête).

**Analytics**
- `collection.viewed` (mode, count).
- `collection.filter_applied`.
- `collection.sort_changed`.

**Critères d'acceptation**
- [ ] 3 modes de vue fonctionnels et persistés (mémoire user).
- [ ] Filtres et tri persistés.
- [ ] Virtualisation active à 100+.
- [ ] Pull-to-refresh fonctionnel.
- [ ] Lighthouse Perf ≥ 90 sur cet écran avec 500 cartes.
- [ ] Lighthouse a11y ≥ 95.
- [ ] Pas de CLS au chargement des images.

---

## #11 — Filtres collection (bottom sheet)

**Wireframe** : collection.md #11

**Objectif** : restreindre la collection selon plusieurs critères combinables.

**Champs**
- Couleur (multi, mode "exactement / au moins / au plus").
- Type (combobox avec recherche, multi).
- Rareté (chips multi).
- Set (combobox avec recherche, multi).
- Langue (chips multi avec ajout custom).
- État (chips multi).
- Foil (radio : tous / foil / non-foil).
- Classeur (combobox unique).
- Prix estimé (range slider + saisie min/max).

**Interactions**
- **Édition live** : compteur "X cartes correspondent" mis à jour en temps réel sous les filtres (pré-validation).
- **Tap "Appliquer"** → ferme la sheet, applique les filtres à la collection.
- **Tap "Réinitialiser"** → remet tous les filtres à leur valeur neutre (tout sélectionné). Confirmation inline si > 5 filtres actifs.
- **Drag down / tap scrim** → ferme sans appliquer (annulation).

**Validations**
- Range prix : `min ≤ max`, `min ≥ 0`. Erreur inline si invalide.

**États** : default uniquement (pas de loading — calcul local).

**Edge cases**
- Si un set inclus dans le filtre n'a plus aucune carte (toutes supprimées) : laisser le filtre actif mais afficher 0.
- Si l'utilisateur change de mode de vue alors que la sheet est ouverte : sheet reste ouverte et les filtres restent en mémoire.

**A11y**
- `role="dialog"` + `aria-modal`.
- Focus piégé.
- Boutons d'action en bas, accessibles toujours visibles (sticky).
- Compteur live en `aria-live="polite"`.

**Performance**
- Tous les filtres calculés côté client (pas d'aller-retour serveur).
- Throttle 100 ms sur le compteur live si > 10 000 items.

**Critères d'acceptation**
- [ ] Tous les filtres combinables.
- [ ] Compteur live exact.
- [ ] Réinitialisation efficace.
- [ ] État persisté après fermeture (réouverture = même config).

---

## #12 — Tri (bottom sheet)

**Wireframe** : collection.md #12

**Critères** : date d'ajout, nom, set, valeur, rareté, couleur. Toggle inversion.

**Interactions** : sélection radio = application immédiate + fermeture auto. Mémorisation pour les sessions suivantes.

**A11y** : `role="radiogroup"`, `aria-checked`.

**Critères d'acceptation**
- [ ] 6 critères fonctionnels.
- [ ] Toggle inverse fonctionnel.
- [ ] Persistance entre sessions.

---

## #13 — Mode de vue (bottom sheet)

**Wireframe** : collection.md #13

**3 modes** : liste compacte, grille, pile.

**Interactions** : sélection = application immédiate + fermeture. Persistance par utilisateur.

**Critères d'acceptation**
- [ ] 3 modes fonctionnels.
- [ ] Mémorisation du dernier choix.

---

## #14 — Liste des classeurs (`/collection/binders`)

**Wireframe** : collection.md #14

**Objectif** : organiser sa collection en regroupements thématiques (decks, binders physiques, à vendre, etc.).

**Données** : tous les `Binder` triés par `position`, + compteur cartes et valeur calculés.

**Composants** : header avec ⊕, liste de classeurs (cards).

**Interactions**
- Tap classeur → `/collection/binders/:id`.
- Long press → menu (Renommer, Supprimer, Réordonner). Pas de menu sur "Toutes mes cartes" (virtuel).
- Tap ⊕ → `/collection/binders/new`.
- Drag-to-reorder (en mode édition activé via menu).

**États** : default, loading (skeletons), error.

**Edge cases**
- 0 classeur (sauf le virtuel) : afficher seulement "Toutes mes cartes" + CTA "Créer un classeur".
- Suppression d'un classeur contenant des cartes → confirmation, cartes restent dans "Toutes mes cartes".

**A11y** : liste sémantique, actions secondaires accessibles via menu.

**Critères d'acceptation**
- [ ] Liste fonctionnelle.
- [ ] CRUD via interactions natives.
- [ ] Réordonnancement drag-and-drop accessible (alternative clavier).

---

## #15 — Créer un classeur (`/collection/binders/new`)

**Wireframe** : collection.md #15

**Champs** : nom (obligatoire), description (facultative), icône (8 choix).

**Validations**
- `name` : `binderNameSchema` + unicité (case-insensitive).
- `description` : ≤ 500 caractères.
- `icon` : enum des 8 valeurs autorisées.

**Interactions**
- Tap "Créer" → mutation backend + IndexedDB → toast → retour `/collection/binders` avec le nouveau en tête.
- Tap ✕ → confirmation si modifs en cours.

**Edge cases**
- Nom déjà utilisé → erreur inline "Ce nom existe déjà".
- Hors-ligne → création locale + sync différée.

**Critères d'acceptation**
- [ ] Création persistée localement et en backend.
- [ ] Validation d'unicité.
- [ ] Mode hors-ligne supporté.

---

## #16 — Vue d'un classeur (`/collection/binders/:id`)

**Wireframe** : collection.md #16

**Idem #8/9/10 mais filtré sur `binderId`.**

**Spécificités**
- Header dédié (icône + nom + compteur + valeur).
- FAB ⊕ ajoute directement dans ce classeur.
- Menu ⋮ : Renommer, Réordonner, Vider, Supprimer, Exporter.

**Critères d'acceptation**
- [ ] Filtrage sur binderId fonctionnel.
- [ ] FAB préremplit le classeur.
- [ ] Actions du menu fonctionnelles.

---

## #17 — Éditer un classeur (`/collection/binders/:id/edit`)

**Wireframe** : collection.md #17

**Champs** : idem #15.

**Actions destructives**
- "Vider" : modale de confirmation → cartes restent dans "Toutes mes cartes".
- "Supprimer" : modale + saisie du nom pour confirmer → cartes orphelines retournent dans "Toutes mes cartes".

**Critères d'acceptation**
- [ ] Modification persistée.
- [ ] Vider non destructif.
- [ ] Suppression bloque clic accidentel (saisie nom).

---

## #18 — Détail exemplaire (`/collection/items/:itemId`)

**Wireframe** : collection.md #18

**Objectif** : consulter toutes les infos d'un exemplaire possédé + accès édition.

**Données**
- `CollectionItem` joint à sa `Card`.
- Prix actuel (Scryfall, refresh à l'ouverture).
- Autres impressions, légalité, rulings (lazy au scroll des accordéons).

**Sections**
1. Image carte (zoomable).
2. "Mon exemplaire" : qté, état, foil, langue, classeur, date d'ajout, prix payé, notes.
3. Caractéristiques : coût, type, set/n°, rareté, artiste, oracle text, ambiance, prix.
4. Accordéons : autres impressions, légalité, rulings.

**Interactions**
- Tap image → `/search/cards/:cardId` plein écran (#25).
- Tap "Modifier" → `/collection/items/:itemId/edit`.
- Tap "Ajouter un exemplaire" → `/add/manual/details?cardId=:id&prefill=current`.
- ♡ → toggle favori.
- Menu ⋮ → Voir fiche catalogue, Partager, Supprimer.
- Tags cliquables (couleur, type, artiste, set) → navigation vers `/search?filter=...`.
- Tap accordéon → ouverture, fetch lazy si pas encore chargé.
- Carte recto-verso : 🔄 → flip animation.

**États** : default, loading (skeleton de la carte + métadonnées), error.

**Edge cases**
- Card supprimée du catalogue Scryfall (rare) → afficher données en cache + bandeau "Données potentiellement obsolètes".
- Hors-ligne : tout visible, prix peut être périmé (badge "il y a Xj").
- Quantité = 0 (suite à édition) → suppression effective avec toast et redirect.

**A11y**
- Image alt descriptif : "Lightning Bolt, instant rouge, coût 1 mana rouge, possédée 3 fois en Near Mint, langue anglaise".
- Tags cliquables = `<a>` ou `<button>` selon comportement.
- Accordéons : `<details>`/`<summary>` natifs ou ARIA équivalent.
- Section "Mon exemplaire" : `<section aria-labelledby>`.

**Performance**
- Image affichée en `large` Scryfall, prefetch `png` au cas où l'utilisateur zoom.
- Sections lourdes (impressions, rulings) lazy.
- Pas de re-render au scroll (memoize les sections).

**Sécurité**
- Vérif côté backend que l'item appartient à l'utilisateur (sinon 403).
- Pas d'ID exposant l'utilisateur dans l'URL (UUID v4).

**Critères d'acceptation**
- [ ] Toutes les données rendues.
- [ ] Tags cliquables fonctionnels.
- [ ] Édition accessible en 1 tap.
- [ ] DFC flip fonctionnel.
- [ ] Lazy sections fonctionnent.

---

## #19 — Édition exemplaire (`/collection/items/:itemId/edit`)

**Wireframe** : collection.md #19

**Champs**
- Quantité (stepper, défaut 1, min 0 = suppression).
- État (chips, défaut depuis prefs ou item).
- Foil (toggle).
- Langue (combobox).
- Classeur (combobox).
- Prix payé (number, EUR, optionnel).
- Notes (textarea, ≤ 500 caractères).

**Validations**
- `quantity` : `quantitySchema`. Si 0 → modale de confirmation suppression.
- `pricePaid` : `priceSchema.optional()`.

**Interactions**
- Sauvegarde au tap du CTA "Enregistrer" (sticky bas).
- Optimiste : mutation appliquée localement, rollback si échec serveur.
- "Supprimer cet exemplaire" → modale #20.
- ✕ avec modifs non sauvegardées → confirmation "Abandonner les modifications ?".

**Edge cases**
- Conflit (item modifié sur un autre device) → résolution last-write-wins par défaut, plus tard prompt.
- Hors-ligne : changement local + queue de sync.

**A11y**
- Stepper : `aria-label="Quantité"` sur le bloc, valeur dans un `aria-live` lors du changement.
- Chips état : `role="radiogroup"`.
- Toggle foil : `role="switch"` + `aria-checked`.
- Erreurs reliées via `aria-describedby`.

**Critères d'acceptation**
- [ ] Tous les champs éditables.
- [ ] Optimistic update fonctionnel.
- [ ] Mode hors-ligne supporté.
- [ ] Suppression via quantité = 0 fonctionne.

---

## #20 — Confirmation suppression (modale)

**Wireframe** : collection.md #20

**Variantes**
1. **Suppression d'un exemplaire** : message simple + boutons.
2. **Vider un classeur** : message dédié.
3. **Supprimer un classeur** : champ "tapez le nom" pour valider.

**Interactions**
- Tap "Supprimer" / "Vider" → mutation, toast confirmation avec "Annuler" 5 s.
- Tap "Annuler" / Échap / scrim → ferme.

**A11y**
- `role="alertdialog"`.
- Focus initial sur "Annuler" (action sûre).
- Focus piégé.
- Bouton destructif clairement labellisé ("Supprimer Lightning Bolt").

**Critères d'acceptation**
- [ ] Modale apparaît pour chaque variante.
- [ ] Annulation possible pendant 5 s post-action.
- [ ] Suppression de classeur protégée par saisie nom.
