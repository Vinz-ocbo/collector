# 03 — Spécifications fonctionnelles

> Specs détaillées par écran : interactions, validations, sources de données, états, edge cases, a11y, perf, sécurité.
> Référence visuelle : `02-wireframes.md` et son dossier `wireframes/`.
> Référence inventaire : `01-arborescence.md`.

---

## Format des specs

Chaque écran est documenté selon ce gabarit :

```
### #N — Nom de l'écran (route)

**Wireframe** : lien vers le fichier wireframe correspondant.

**Objectif utilisateur** : 1–2 phrases.

**Données affichées**
 - Liste des données + sources (Scryfall, IndexedDB, backend).

**Composants**
 - Composants UI utilisés (référence design system).

**Interactions**
 - Liste des actions utilisateur + comportement attendu.

**Validations**
 - Règles de validation (Zod) côté front.

**États**
 - default, loading, empty, error, offline, partial, ...

**Edge cases**
 - Cas limites + traitement attendu.

**Accessibilité**
 - Spécificités a11y (focus, aria, contraste, alternatives).

**Performance**
 - Cibles, lazy-loading, virtualisation, prefetch.

**Sécurité**
 - Validation, autorisation, données sensibles.

**Analytics / RUM** (optionnel)
 - Événements à logger pour le suivi produit.

**Critères d'acceptation**
 - Checklist binaire (DoD).
```

---

## Référentiel commun

### Modèle de données — domaine partagé

Voir `.clinerules-dev` §3 : `shared/domain` est TCG-agnostique. Types canoniques :

```ts
type Card = {
  id: string;                 // ID stable (Scryfall ID pour Magic)
  game: 'magic' | 'pokemon';  // Discriminant TCG, présent dès le MVP
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';
  language: string;           // ISO 639-1
  imageUris: { small: string; normal: string; large: string; png: string };
  artist?: string;
  releasedAt: string;         // ISO date
  prices: { eur?: number; usd?: number; updatedAt: string };
  // Métadonnées spécifiques au TCG via discriminated union :
  meta: MagicMeta | PokemonMeta;
};

type CollectionItem = {
  id: string;                 // UUID local
  cardId: string;
  game: 'magic' | 'pokemon';
  quantity: number;           // ≥ 1
  condition: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
  foil: boolean;
  language: string;           // ISO 639-1 (de la carte, pas de l'UI)
  binderId?: string;          // null = "Toutes mes cartes" (virtuel)
  pricePaid?: number;         // EUR
  notes?: string;
  addedAt: string;            // ISO datetime
  updatedAt: string;          // ISO datetime
  syncStatus: 'synced' | 'pending' | 'error';
};

type Binder = {
  id: string;                 // UUID
  name: string;               // unique par utilisateur (case-insensitive)
  description?: string;
  icon: string;               // clé d'icône
  position: number;           // ordre d'affichage
  createdAt: string;
  updatedAt: string;
};
```

### Sources de données

| Source | Contenu | Refresh | Cache |
|---|---|---|---|
| **Scryfall (via backend)** | Catalogue Magic, prix, images, rulings | Bulk hebdo + on-demand | Workbox stale-while-revalidate sur images, TanStack Query 5 min sur catalogue |
| **Backend custom** | Auth, collection, classeurs, sync, scan | Temps réel | TanStack Query, invalidation après mutation |
| **IndexedDB (Dexie)** | Collection locale, file de scan, prefs, cache | Local | Persistant |
| **Service Worker** | Bundle JS/CSS, images, manifest | Au déploiement | Cache-first avec révision |

### Validations Zod (référencées partout)

```ts
const conditionSchema = z.enum(['NM', 'LP', 'MP', 'HP', 'DMG']);
const languageSchema = z.string().regex(/^[a-z]{2}$/);
const quantitySchema = z.number().int().min(1).max(9999);
const priceSchema = z.number().min(0).finite();
const binderNameSchema = z.string().trim().min(1).max(60);
const cardIdSchema = z.string().min(1).max(64);
```

### États transverses obligatoires (rappel)

Chaque écran de liste / contenu DOIT spécifier : **default · loading · empty · error · offline**.

Manquant = bug d'UX, à traquer en revue.

### Cibles a11y (rappel)

- Contraste ≥ 4.5:1 texte normal, ≥ 3:1 large/UI.
- Cibles tactiles ≥ 44×44 px.
- Focus visible (`:focus-visible`).
- Tout chemin caméra a un équivalent clavier.
- `aria-live` sur les feedbacks dynamiques (scan, ajout, sync).
- Ordre de tabulation logique.

### Cibles perf (rappel)

- LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- Bundle initial ≤ 200 KB gzip.
- Listes ≥ 100 items virtualisées.
- Images : srcset + AVIF/WebP, dimensions explicites.
- Web Workers pour traitements > 50 ms.

---

## Index des specs détaillées

| Fichier | Couvre | Écrans |
|---|---|---|
| [`specs/auth.md`](./specs/auth.md) | Splash, auth, onboarding, permissions | 1–6 |
| [`specs/collection.md`](./specs/collection.md) | Collection, filtres, classeurs, détail/édition | 7–20 |
| [`specs/search.md`](./specs/search.md) | Catalogue, fiche carte, image, impressions, rulings | 21–27 |
| [`specs/scan.md`](./specs/scan.md) | Scan unique + lot, validation, erreurs | 28–35 |
| [`specs/add.md`](./specs/add.md) | Choix, recherche, détails, série, toast | 36–40 |
| [`specs/stats.md`](./specs/stats.md) | Vue d'ensemble + déclinaisons | 41–46 |
| [`specs/profile.md`](./specs/profile.md) | Profil, compte, prefs, données, légal, aide | 47–55 |
| [`specs/transverse.md`](./specs/transverse.md) | Hors-ligne, 404, 500, composants | 56–58 |

---

## Définition de "fait" (DoD) — par écran

Une spec est livrable si :

- [ ] Wireframe lié et à jour.
- [ ] Tous les états documentés (default, loading, empty, error, offline).
- [ ] Toutes les interactions listées avec comportement attendu.
- [ ] Validations Zod précisées sur chaque champ.
- [ ] Edge cases identifiés et traités (au minimum : mauvais réseau, données partielles, doublons, conflits sync).
- [ ] A11y notée (focus, aria, alternatives clavier, contraste).
- [ ] Perf : prefetch, lazy, virtualisation si applicable.
- [ ] Sécurité : autorisation, validation entrée/sortie, rate limit si applicable.
- [ ] Critères d'acceptation rédigés en checklist binaire.
- [ ] Revue par 1 dev + 1 designer.
