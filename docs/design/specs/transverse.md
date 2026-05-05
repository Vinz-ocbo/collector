# Specs — Composants & états transverses

Écrans 56 à 58 + composants. Wireframes : [`../wireframes/transverse.md`](../wireframes/transverse.md).

---

## #56 — Bandeau hors-ligne (composant global)

**Wireframe** : transverse.md #56

**Objectif** : informer l'utilisateur de son état de connectivité et de l'avancée de la sync, sans bloquer.

**Détection**
- `navigator.onLine` au mount + listener `online` / `offline`.
- Échec de requête avec pattern réseau (timeout, DNS, etc.) déclenche le passage en "hors-ligne" même si `navigator.onLine === true` (faux positif fréquent sur mobile).

**3 états visibles**
1. **Hors-ligne** : "Vos modifications seront synchronisées au retour de la connexion".
2. **Sync en cours** (au retour) : "Synchronisation… X / Y".
3. **Sync échouée** : "X modifications n'ont pas pu être synchronisées" + retry.

**Composant**
- Bandeau persistant en haut, sous le header (push le contenu).
- Couleur neutre (info), pas alarmiste.
- Hauteur ≈ 48 px.
- Sur écrans immersifs (scan) : overlay semi-transparent en haut.

**Interactions**
- Tap "Réessayer" (variante échec) → relance la sync.
- Tap "Voir détails" → liste des modifications en échec (route ou bottom sheet).
- Pas de bouton "Fermer" : le bandeau disparaît automatiquement quand l'état change.

**A11y**
- `role="status"` `aria-live="polite"` sur le bandeau.
- Variante échec : `role="alert"`.
- Bouton "Réessayer" accessible au clavier.

**Performance**
- File de sync limitée à N items en parallèle (max 3).
- Backoff exponentiel sur les retries.
- Pas de spam de retry (cooldown 30 s).

**Critères d'acceptation**
- [ ] Détection robuste (vrais positifs/négatifs).
- [ ] 3 états affichés correctement.
- [ ] Sync au retour fonctionnelle.
- [ ] Retry possible.
- [ ] Pas de blocage de l'app.

---

## #57 — Erreur 404 (`/*` catch-all)

**Wireframe** : transverse.md #57

**Objectif** : récupérer l'utilisateur sur une URL inexistante.

**Données** : aucune.

**Interactions**
- Tap "Retour" → `history.back()` ou `/collection` si pas d'historique.
- Tap "Ma collection" → `/collection`.

**A11y**
- Titre H1 "Page introuvable".
- Boutons accessibles.

**Critères d'acceptation**
- [ ] Affiché sur toute URL inconnue.
- [ ] Échappatoires fonctionnelles.
- [ ] Pas de tab bar (confusion évitée).

---

## #58 — Erreur 500 / inattendue (boundary global)

**Wireframe** : transverse.md #58

**Objectif** : récupérer l'utilisateur d'une exception non gérée sans perdre ses données.

**Détection** : Error Boundary React (`componentDidCatch`).

**Données**
- ID d'erreur (UUID v4 généré + envoyé à Sentry).
- Pas de stack trace exposée à l'utilisateur en prod.

**Interactions**
- Tap "Réessayer" → reset du boundary, retente le rendu.
- Tap "Retour à l'accueil" → `/collection`.
- Tap "Copier" l'ID → presse-papiers + toast.
- Tap "Signaler" → mailto pré-rempli avec ID OR formulaire intégré.

**A11y**
- Titre H1 "Une erreur est survenue".
- Bouton de copie accessible.
- Annonce d'erreur en `role="alert"`.

**Sécurité**
- Aucune info technique sensible (env vars, chemins, tokens) exposée.
- ID corrélé côté Sentry pour le support.
- Source maps activées en interne uniquement.

**Critères d'acceptation**
- [ ] Boundary catch les erreurs render.
- [ ] ID généré et corrélé.
- [ ] Réessayer fonctionne sans recharge complète.
- [ ] Données collection préservées.

---

## Composants transverses (specs)

### Header standard

**Caractéristiques**
- Hauteur 56 px.
- Sticky en haut au scroll.
- Bouton retour à gauche (sauf onglets racines).
- Titre H1, 1 ligne, ellipsis.
- Max 2 actions à droite (sinon menu ⋮).

**A11y**
- `<header role="banner">` au niveau racine.
- Titre = H1 unique par page.
- Bouton retour : `aria-label="Retour"`.
- Actions : labels explicites.

### Tab bar mobile

**Caractéristiques**
- Hauteur 64 px (safe-area incluse).
- Persistante sauf : flux scan immersif, plein écran image, ajout en série.
- Onglet actif : icône pleine + couleur accent + label gras.
- Badges sur Scan (lot en cours) et Profil (sync échouée).

**A11y**
- `<nav role="navigation" aria-label="Navigation principale">`.
- Onglets : `<a aria-current="page">` sur l'actif.
- Labels visibles (jamais que les icônes).

### FAB (Floating Action Button)

**Caractéristiques**
- 56×56 px.
- Bas droit, 16 px de marge, au-dessus de la tab bar.
- Couleur accent + ombre niveau "raised".
- Présent : `/collection`, `/collection/binders/:id`, `/stats` (P1).
- Absent : écrans immersifs, modaux, formulaires.

**Interactions**
- Tap → bottom sheet `/add/choose` (#36).
- Long press → menu d'actions secondaires (P1 : "Saisie rapide", "Scan rapide").

**A11y**
- `<button aria-label="Ajouter une carte">`.
- Focus visible.

### Bottom sheet

**Caractéristiques**
- 3 hauteurs : compact (30%), médium (60%), full (95%).
- Drag handle visible.
- Drag-to-resize entre hauteurs.
- Drag down pour fermer.
- Tap sur le scrim = fermeture.
- Animation 250 ms ease-out.

**A11y**
- `role="dialog"` `aria-modal="true"`.
- Focus piégé.
- Échap = fermer.
- Focus restauré sur le déclencheur.

### Modale d'alerte

**Caractéristiques**
- Largeur 320 px, centrée.
- Padding 24 px.
- 2 boutons : annuler (gauche, secondaire) + action (droite, primaire ou destructive).
- **Réservée aux actions irréversibles uniquement.**

**A11y**
- `role="alertdialog"`.
- `aria-labelledby` sur le titre.
- `aria-describedby` sur le message.
- Focus initial sur "Annuler" (action sûre).
- Focus piégé.
- Échap = annuler.

### Toast / Snackbar

**Voir** `add.md` #40.

**Variantes** : succès, info, erreur, neutre.

**Caractéristiques**
- Position : bas, au-dessus de la tab bar (≥ 80 px de marge).
- Largeur max : 360 px.
- Stack max 3 visibles.
- Auto-dismiss 3–6 s selon variante.

**A11y**
- `role="status"` `aria-live="polite"` (succès/info/neutre).
- `role="alert"` `aria-live="assertive"` (erreur).
- Action : bouton accessible au clavier.
- Pas pour actions irréversibles.

### Skeleton loaders

**Caractéristiques**
- Forme respecte le contenu attendu.
- Animation pulse douce (1.4 s).
- `prefers-reduced-motion` : statique.
- Couleur : 8% sur fond ambiant.

**A11y**
- `aria-busy="true"` sur le conteneur.
- Pas de label spécifique (le contenu remplacera).

### Empty states

**Pattern réutilisé partout**
- Illustration sobre.
- Titre court.
- Texte explicatif.
- 1–2 CTAs.

**A11y**
- Titre = H2 ou H3 selon contexte.
- Illustration : `alt=""` (décorative) ou alt descriptif.
- CTAs accessibles.

### Chips

**Variantes** : filtre (toggle), tag (info), action (button).

**Caractéristiques**
- Hauteur 32 px, padding horizontal 12 px.
- Croix ✕ visible si supprimable (44px touch target via padding).
- État actif : couleur accent + texte contrasté.

**A11y**
- Toggle : `aria-pressed`.
- Tag : `<span>` avec `aria-label`.
- Action : `<button>`.

### Symboles de mana Magic

**Caractéristiques**
- SVG natifs.
- Importés dynamiquement (pas dans bundle initial).
- Rendu inline dans les textes oracle.

**A11y**
- `aria-label` textuel obligatoire ("Mana blanc", "Mana bleu", etc.).
- `role="img"` si standalone.

**Préparation Pokémon** : abstraction `<GameSymbol type="..." />` qui résout via le module TCG actif.

---

## File de synchronisation (logique transverse)

**Données** (IndexedDB Dexie) :
```ts
type SyncTask = {
  id: string;
  entityType: 'item' | 'binder' | 'preference';
  operation: 'create' | 'update' | 'delete';
  payload: object;
  attemptCount: number;
  lastError?: string;
  createdAt: string;
};
```

**Comportement**
- Toute mutation hors-ligne → ajoute une `SyncTask`.
- Au retour réseau → drain la file (FIFO, max 3 parallèles, backoff exponentiel sur retry).
- Succès → supprime la tâche, met à jour `syncStatus` de l'entité.
- Échec persistant (5 tentatives) → marque `syncStatus: 'error'`, affiche dans bandeau.

**Conflit serveur (entité modifiée par un autre device)**
- MVP : last-write-wins.
- P1 : merge intelligent + prompt utilisateur sur conflits non triviaux.

**Critères d'acceptation**
- [ ] Mutations offline persistées.
- [ ] Drain au retour réseau.
- [ ] Backoff fonctionnel.
- [ ] État final cohérent.

---

## Préparation Pokémon (rappel transverse)

Tous les composants génériques doivent recevoir leur **renderer** et leurs **labels** du module TCG actif :
- `<CardThumbnail card={card} />` : le renderer interne consulte `card.game` et délègue au module.
- `<FilterPanel filters={availableFilters} />` : filtres listés par le module.
- `<StatsChart category={categoryConfig} />` : couleurs/types fournis par le module.
- `<GameSymbol type={...} />` : icônes mana/énergie selon le jeu.

**Aucune string `"magic"` ou `"mtg"` en dur** dans `shared/ui` ou `features/*` — uniquement dans `tcg/magic/*`. Vérification : un grep doit retourner 0 occurrence dans `shared/` et `features/` au MVP.

**Modèle de données** : champ `game` présent dès le premier schéma backend et IndexedDB.
