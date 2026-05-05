# Specs — Ajout de carte

Écrans 36 à 40. Wireframes : [`../wireframes/add.md`](../wireframes/add.md).

---

## #36 — Choix méthode d'ajout (`/add/choose`)

**Wireframe** : add.md #36

**Objectif** : router vers le bon flux d'ajout.

**Composants** : bottom sheet avec 3 cartes-CTAs.

**Interactions**
- Tap "Saisir manuellement" → `/add/manual`.
- Tap "Photographier" → `/scan` (avec contexte d'origine).
- Tap "Depuis la galerie" → ouvre sélecteur de fichiers natif (`<input type="file" accept="image/*">`).
  - Fichier sélectionné → upload + reconnaissance → `/scan/single/review`.

**Edge cases**
- Si déclenché depuis un classeur (`/collection/binders/:id`), le contexte classeur est passé en paramètre et préremplit le champ classeur sur l'écran de saisie.
- Galerie : limite 1 image à la fois au MVP (multi-sélection en P1 pour batch).

**A11y**
- `role="dialog"`, focus piégé.
- Chaque carte = `<button>`.
- Échap = fermer.

**Critères d'acceptation**
- [ ] 3 chemins fonctionnels.
- [ ] Contexte propagé (classeur).
- [ ] Galerie ouvre le sélecteur natif.

---

## #37 — Recherche autocomplete (`/add/manual`)

**Wireframe** : add.md #37

**Objectif** : trouver rapidement une carte par nom et la sélectionner pour ajout.

**Données**
- Suggestions catalogue Scryfall via backend (typeahead).
- Recherches récentes : IndexedDB (max 10).
- Suggestions du moment : sets récents + cartes populaires (cache 1h).
- Indicateur "possédée" : jointure locale.

**Interactions**
- **Focus auto** sur le champ à l'arrivée. Clavier ouvert sur mobile.
- **Frappe** : debounce 250 ms → requête typeahead.
- **Tap suggestion** → `/add/manual/details?cardId=:id` (ou si plusieurs sets, écran de désambiguïsation).
- **Tap "Scanner à la place"** → `/scan/single`.
- **✕ dans le champ** → vide la frappe.
- **Échap (clavier)** → ferme l'écran.

**Validations** : query min 2 caractères pour déclencher requête.

**États**
- `idle` (champ vide) : recherches récentes + suggestions.
- `loading` : skeletons.
- `default` : résultats.
- `empty` : "Aucune carte trouvée pour 'xyz'" + "Effacer la recherche".
- `error` : "Recherche indisponible" + bouton retry.
- `offline` : recherche dans cache local seulement + bandeau d'info.

**Edge cases**
- Plusieurs impressions du même nom : afficher la plus récente, sous-titre "+ N autres impressions" cliquable → écran intermédiaire de choix.
- Recherche sur partie du nom (alias) : "fof" → "Force of Will" (configurable).
- Hors-ligne : limité au cache, message clair.

**A11y**
- `role="search"`.
- Liste de résultats : `role="listbox"`, items `role="option"`.
- Navigation clavier ↑↓ entre résultats, Entrée pour sélectionner.
- Compteur de résultats annoncé.

**Performance**
- Debounce 250 ms.
- Cache TanStack Query 5 min sur les requêtes typeahead.
- Suggestions prefetched au mount.

**Critères d'acceptation**
- [ ] Focus auto à l'arrivée.
- [ ] Typeahead fluide.
- [ ] Indicateur "possédée" exact.
- [ ] Navigation clavier fonctionne.
- [ ] Hors-ligne : cache utilisable.

---

## #38 — Détails de l'ajout (`/add/manual/details`)

**Wireframe** : add.md #38

**Objectif** : finaliser les métadonnées d'un exemplaire avant ajout en collection.

**Données**
- `Card` sélectionnée (depuis params).
- Préférences utilisateur (état/foil/langue/classeur par défaut).
- Dernier ajout (mémoire de session pour pré-remplir intelligemment).

**Champs**
- Quantité (stepper, défaut 1).
- État (chips, défaut depuis prefs ou dernier ajout).
- Foil (toggle, défaut depuis prefs).
- Langue (combobox, défaut depuis prefs).
- Classeur (combobox, défaut "Toutes mes cartes" ou contexte propagé).
- Prix payé (number, optionnel).
- Notes (textarea, optionnel).
- Mode série (checkbox, défaut décoché).

**Validations**
- `quantity` ≥ 1.
- `pricePaid` ≥ 0 si renseigné.
- `notes` ≤ 500 caractères.

**Interactions**
- Tap "Ajouter à ma collection" → mutation optimiste → toast → :
  - Si mode série coché : `/add/manual/series` (focus auto sur champ recherche).
  - Sinon : retour à l'écran d'origine (collection ou fiche carte).
- Tap "Voir la fiche" → `/search/cards/:cardId` dans une vue overlay (préserver le formulaire en mémoire).
- ✕ : confirmation si modifs.

**Edge cases**
- Carte déjà possédée avec mêmes attributs → suggestion de fusion (toast "Cet exemplaire existe déjà : fusionner ou créer un nouveau ?").
- Hors-ligne : ajout local + sync différée.
- Sync échoue : item marqué "à synchroniser", toast erreur avec retry.

**A11y**
- Form sémantique.
- Stepper accessible (`aria-label`, valeur en `aria-live`).
- Toggle foil : `role="switch"` + `aria-checked`.
- Chips état : `role="radiogroup"`.
- CTA principal sticky bas, accessible au clavier (Entrée = submit).

**Critères d'acceptation**
- [ ] Pré-remplissage intelligent.
- [ ] Mutation optimiste fonctionnelle.
- [ ] Toggle mode série fonctionne.
- [ ] Hors-ligne supporté.
- [ ] Suggestion fusion sur doublon.

---

## #39 — Mode ajout en série (`/add/manual/series`)

**Wireframe** : add.md #39

**Objectif** : permettre l'ajout rapide de plusieurs cartes successives sans friction.

**Données**
- Compteur cartes ajoutées dans la session.
- Valeur cumulée.
- Référence à la dernière carte ajoutée.

**Comportement clé**
- Après chaque "Ajouter", retour ici avec :
  - Focus auto sur le champ recherche.
  - Clavier ouvert.
  - Compteur incrémenté.
  - Bloc "Dernière ajoutée" mis à jour.
  - Toast "Annuler" 5 s sur la carte précédente.

**Interactions**
- Idem #37 + #38 enchaînés.
- Tap "Annuler" sur la carte précédente → suppression de l'item + décrément + toast.
- Tap "Modifier" sur la carte précédente → ouvre `/collection/items/:itemId/edit`.
- Tap "Terminer" → toast bilan + retour à l'origine.

**Edge cases**
- Sortie via swipe ou bouton retour : confirmation si > 0 cartes (ne pas perdre le compteur).
- App en background : compteur persisté en session (sessionStorage), restauré au retour.
- Ajout d'une carte invalide (réseau échoue) : décrément le compteur si finalement non ajoutée.

**A11y**
- Annonce live à chaque ajout : "Lightning Bolt ajoutée, 7 cartes au total, valeur 12.40 euros".
- Bloc "dernière" en `aria-live="polite"`.
- Boutons Annuler/Modifier accessibles.

**Performance**
- Animation d'ajout courte (≤ 200 ms) pour ne pas freiner.
- Pas de re-render complet de la liste de suggestions entre ajouts (memoize).

**Critères d'acceptation**
- [ ] Focus auto persistant.
- [ ] Compteur exact.
- [ ] Annulation fonctionne pendant 5 s.
- [ ] Sortie sécurisée (confirmation).

---

## #40 — Toast de confirmation

**Wireframe** : add.md #40

**Composant transverse**, voir aussi `transverse.md`.

**Variantes** :
| Action | Couleur | Durée | Bouton |
|---|---|---|---|
| Ajout réussi | Succès | 5 s | Annuler |
| Ajout en série | Succès | 3 s | Voir |
| Suppression | Neutre | 5 s | Annuler |
| Erreur sync | Erreur | 6 s | Réessayer |
| Lot ajouté | Succès | 6 s | Voir |

**Interactions**
- Tap action → exécute (annulation : revert mutation + toast confirmation).
- Swipe horizontal → ferme manuellement.
- Auto-dismiss après durée.

**Stack** : max 3 toasts visibles, autres en file. Le plus récent en haut.

**A11y**
- `role="status"` + `aria-live="polite"` (assertive pour erreurs).
- Bouton action accessible au clavier.
- Pas de toast sur action irréversible (utiliser modale).

**Critères d'acceptation**
- [ ] Toast affiché pour chaque action.
- [ ] Action "Annuler" fonctionne pendant la durée.
- [ ] Stack respecté.
- [ ] a11y conforme.
