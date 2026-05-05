# 01 — Arborescence & inventaire des écrans

> Périmètre : MVP Magic. Mobile-first (360 px), PWA. FR par défaut.
> Référence : `.clinerules-design`, `.clinerules-dev`, `SOURCES/Appli Magic Collector (specs).md`.

---

## 1. Navigation principale (bottom tab bar)

5 onglets, action centrale "Scan" mise en avant.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                  Contenu écran                  │
│                                                 │
├─────────────────────────────────────────────────┤
│  📚        🔍        ⊕        📊        👤      │
│ Collec.  Recherche  Scan    Stats    Profil    │
└─────────────────────────────────────────────────┘
```

| Onglet | Route | Écran par défaut |
|---|---|---|
| Collection | `/` | Liste de ma collection (par défaut au lancement) |
| Recherche | `/search` | Catalogue Scryfall, recherche/filtres |
| Scan | `/scan` | Choix mode scan (unique / lot) — CTA central |
| Stats | `/stats` | Vue d'ensemble de la collection |
| Profil | `/profile` | Compte + paramètres + données |

**Comportement** :
- La tab bar est **persistante** sur tous les écrans de premier niveau.
- Elle **disparaît** dans les flux modaux (scan en cours, ajout en série, plein écran image carte) et sur les écrans de profondeur ≥ 2 (détail, édition).
- Bouton "Retour" système (Android) + swipe-back (iOS via geste navigateur PWA) + bouton in-app explicite (chevron en haut à gauche).

---

## 2. Site map complet

Profondeur indiquée par indentation. `→` = transition contextuelle (modale, bottom sheet, plein écran). `(MVP)` / `(v1.1)` quand utile.

```
/  (racine — redirige vers /collection ou /auth selon état session)
│
├── /auth
│   ├── /auth/login                      Connexion
│   ├── /auth/signup                     Inscription
│   ├── /auth/forgot                     Mot de passe oublié
│   └── /auth/callback                   Retour OAuth (Auth0/Clerk/Supabase)
│
├── /onboarding                          Carrousel 2–3 écrans (1er lancement)
│   └── → /onboarding/permissions        Demande caméra contextuelle (au 1er scan, pas ici)
│
├── /collection                          [TAB] Ma collection — écran d'arrivée
│   │   Modes de vue : liste / grille / pile (toggle)
│   │   Tri : nom · set · date d'ajout · valeur · rareté · couleur
│   │   → /collection/filters            Bottom sheet : filtres avancés
│   │   → /collection/sort               Bottom sheet : tri (mobile)
│   │   → /collection/view-mode          Bottom sheet : choix mode de vue
│   │
│   ├── /collection/binders              Liste des classeurs/binders
│   │   ├── /collection/binders/new      Créer un classeur
│   │   ├── /collection/binders/:id      Vue d'un classeur (sous-collection)
│   │   └── /collection/binders/:id/edit Renommer / supprimer / réordonner
│   │
│   ├── /collection/items/:itemId        Détail d'un exemplaire possédé
│   │   │   (gabarit fiche carte + bloc "Mon exemplaire")
│   │   ├── /collection/items/:itemId/edit   Édition exemplaire
│   │   │                                    (qté, état, foil, langue, classeur, notes)
│   │   ├── → confirmation suppression       Modale (irréversible — voir §6)
│   │   └── → /search/cards/:cardId          Voir la fiche catalogue de cette carte
│   │
│   └── /collection/empty                État vide (collection neuve)
│
├── /search                              [TAB] Catalogue Scryfall
│   │   Barre de recherche persistante, autocomplete (debounce 250 ms)
│   │   Filtres : set, couleur, type, rareté, range de prix, langue
│   │   Tri : pertinence, nom, set, prix, rareté
│   │   → /search/filters                Bottom sheet : filtres avancés
│   │
│   ├── /search/cards/:cardId            Fiche carte du catalogue
│   │   │   (image zoomable, oracle, métadonnées, prix, autres impressions, légalité)
│   │   ├── → /add/manual?cardId=:id     CTA "Ajouter à ma collection"
│   │   ├── /search/cards/:cardId/printings   Autres impressions du même nom
│   │   └── /search/cards/:cardId/rulings     Rulings officiels
│   │
│   └── /search/empty                    État "aucun résultat"
│
├── /scan                                [TAB] Choix mode scan
│   │   2 cartes : "Scanner une carte" / "Scanner un lot"
│   │
│   ├── /scan/single                     Scan carte unique — viseur caméra
│   │   ├── /scan/single/review          Validation post-capture
│   │   │   │   (image capturée, candidats avec score de confiance)
│   │   │   ├── → /add/manual?prefill=:data    Si confiance haute → préremplit
│   │   │   ├── → choix dans liste candidats   Si confiance moyenne
│   │   │   └── → retry / saisie manuelle      Si échec
│   │   └── /scan/single/error           Permission refusée / pas de caméra
│   │
│   ├── /scan/batch                      Scan en lot — viseur + compteur
│   │   ├── /scan/batch/queue            File d'attente (X cartes scannées)
│   │   ├── /scan/batch/review           Revue avant validation globale
│   │   │                                (modifier/retirer chaque carte)
│   │   └── /scan/batch/resume           Reprise d'une session interrompue
│   │
│   └── /scan/empty                      État "aucun scan en cours" (premier lancement)
│
├── /add                                 Flux d'ajout (hors-tab — overlay/plein écran)
│   ├── /add/choose                      Choix : manuel ou photo
│   │                                    (atteint depuis FAB ou /scan)
│   │
│   ├── /add/manual                      Recherche autocomplete + sélection
│   │   ├── /add/manual/details          Saisie qté, état, foil, langue, classeur
│   │   ├── /add/manual/series           Mode "ajout en série" (focus persistant)
│   │   └── /add/manual/confirm          Toast confirmation + "Annuler" 5 s
│   │
│   └── (le scan vit dans /scan/* mais alimente /add/manual/details après reconnaissance)
│
├── /stats                               [TAB] Statistiques
│   │   Vue d'ensemble : nombre de cartes, valeur estimée, sets complétés
│   │
│   ├── /stats/by-color                  Répartition par couleur (WUBRG + multi + colorless)
│   ├── /stats/by-type                   Par type (créature, sort, terrain…)
│   ├── /stats/by-rarity                 Par rareté
│   ├── /stats/by-set                    Complétion par set (% possédé)
│   └── /stats/value-history             (v1.1) Évolution de la valeur dans le temps
│
├── /profile                             [TAB] Profil & paramètres
│   ├── /profile/account                 Email, mot de passe, suppression compte
│   ├── /profile/preferences             Langue UI · thème · valeurs par défaut
│   │                                    (état NM, langue carte par défaut, classeur cible)
│   ├── /profile/data                    Export / import
│   │   ├── /profile/data/export         CSV / JSON (Moxfield/Archidekt v1.1)
│   │   └── /profile/data/import         Upload + mapping + dry-run
│   ├── /profile/about                   Version, mentions Wizards/Scryfall, crédits
│   ├── /profile/legal                   CGU · politique confidentialité · RGPD
│   └── /profile/help                    FAQ, contact, signaler un bug
│
└── /offline                             (Pas une route — bandeau global, voir §7)
```

---

## 3. Inventaire exhaustif des écrans

| # | Écran | Route | Type | Priorité | Notes |
|---:|---|---|---|---|---|
| 1 | Splash / chargement | (transitoire) | full | P0 | Logo + skeleton, ≤ 1 s visible |
| 2 | Connexion | `/auth/login` | full | P0 | OAuth providers + email/mdp |
| 3 | Inscription | `/auth/signup` | full | P0 | Idem + acceptation CGU |
| 4 | Mot de passe oublié | `/auth/forgot` | full | P0 | Lien email |
| 5 | Onboarding | `/onboarding` | full | P0 | 2–3 écrans max |
| 6 | Permission caméra | (modale) | modal | P0 | Au 1er accès `/scan`, contextuel |
| 7 | Collection — vide | `/collection` (état) | full | P0 | Empty state soigné |
| 8 | Collection — liste compacte | `/collection` (mode) | full | P0 | Densité maxi, vignette miniature |
| 9 | Collection — grille | `/collection` (mode) | full | P0 | Défaut mobile, image dominante |
| 10 | Collection — pile (regroupée) | `/collection` (mode) | full | P0 | Regroupement par nom + qté |
| 11 | Filtres collection | `/collection/filters` | bottom-sheet | P0 | Set, couleur, type, rareté, état, foil, langue, classeur |
| 12 | Tri collection | `/collection/sort` | bottom-sheet | P0 | 6 critères, mémoriser le dernier |
| 13 | Sélecteur mode de vue | `/collection/view-mode` | bottom-sheet | P0 | 3 modes |
| 14 | Liste des classeurs | `/collection/binders` | full | P0 | Cards-list avec compteur |
| 15 | Créer un classeur | `/collection/binders/new` | full / sheet | P0 | Nom + description optionnelle |
| 16 | Vue d'un classeur | `/collection/binders/:id` | full | P0 | Réutilise vues collection filtrées |
| 17 | Éditer un classeur | `/collection/binders/:id/edit` | full / sheet | P0 | Renommer, supprimer |
| 18 | Détail exemplaire possédé | `/collection/items/:itemId` | full | P0 | Fiche carte + bloc "Mon exemplaire" |
| 19 | Éditer exemplaire | `/collection/items/:itemId/edit` | full | P0 | Qté, état, foil, langue, classeur, notes |
| 20 | Confirmation suppression | (modale) | modal | P0 | Bouton destructif + cancel |
| 21 | Catalogue (recherche) | `/search` | full | P0 | Barre recherche + résultats |
| 22 | Filtres catalogue | `/search/filters` | bottom-sheet | P0 | Set, couleur, type, rareté, prix, langue |
| 23 | Catalogue — empty | `/search/empty` | état | P0 | "Aucun résultat" + suggestions |
| 24 | Fiche carte catalogue | `/search/cards/:cardId` | full | P0 | Image zoom, oracle, prix, CTA ajout |
| 25 | Image plein écran | (overlay) | overlay | P0 | Pinch/double-tap, swipe pour fermer |
| 26 | Autres impressions | `/search/cards/:cardId/printings` | full | P1 | Liste sets pour ce nom |
| 27 | Rulings | `/search/cards/:cardId/rulings` | full | P1 | Liste rulings officiels |
| 28 | Choix mode scan | `/scan` | full | P0 | "Une carte" / "Un lot" |
| 29 | Viseur scan unique | `/scan/single` | full / immersif | P0 | Caméra + cadre cible + capture |
| 30 | Validation scan unique | `/scan/single/review` | full | P0 | Image + candidats + confiance |
| 31 | Erreur scan (pas de caméra) | `/scan/single/error` | full | P0 | Fallback manuel |
| 32 | Viseur scan lot | `/scan/batch` | full / immersif | P0 | Caméra + compteur + file |
| 33 | File d'attente lot | `/scan/batch/queue` | bottom-sheet / panel | P0 | Vignettes des cartes scannées |
| 34 | Revue de lot | `/scan/batch/review` | full | P0 | Liste éditable avant validation globale |
| 35 | Reprise lot interrompu | `/scan/batch/resume` | banner / sheet | P0 | "Reprendre votre dernier lot ?" |
| 36 | Choix méthode d'ajout | `/add/choose` | bottom-sheet | P0 | Manuel / photo |
| 37 | Recherche manuelle (autocomplete) | `/add/manual` | full | P0 | Focus auto, clavier ouvert |
| 38 | Détails ajout | `/add/manual/details` | full | P0 | Qté/état/foil/langue/classeur |
| 39 | Mode ajout en série | `/add/manual/series` | full | P0 | Focus persistant après chaque ajout |
| 40 | Confirmation ajout | (toast) | toast | P0 | "Annuler" 5 s |
| 41 | Stats — vue d'ensemble | `/stats` | full | P0 | KPIs principaux |
| 42 | Stats par couleur | `/stats/by-color` | full | P0 | Camembert/barres + liste |
| 43 | Stats par type | `/stats/by-type` | full | P0 | Idem |
| 44 | Stats par rareté | `/stats/by-rarity` | full | P0 | Idem |
| 45 | Complétion par set | `/stats/by-set` | full | P0 | Liste sets + % + barre progression |
| 46 | Évolution valeur | `/stats/value-history` | full | P2 | (post-MVP) |
| 47 | Profil — accueil | `/profile` | full | P0 | Liste de sections |
| 48 | Compte | `/profile/account` | full | P0 | Email, mdp, suppression compte (RGPD) |
| 49 | Préférences | `/profile/preferences` | full | P0 | Langue, thème, défauts |
| 50 | Données | `/profile/data` | full | P0 | Liens export/import |
| 51 | Export | `/profile/data/export` | full | P0 | CSV/JSON, choix périmètre |
| 52 | Import | `/profile/data/import` | full | P0 | Upload + dry-run + mapping |
| 53 | À propos | `/profile/about` | full | P0 | Version, crédits Scryfall/Wizards |
| 54 | Mentions légales | `/profile/legal` | full | P0 | CGU, RGPD, confidentialité |
| 55 | Aide | `/profile/help` | full | P1 | FAQ, contact |
| 56 | Erreur réseau (global) | (overlay/inline) | composant | P0 | Bandeau hors-ligne + retry |
| 57 | Erreur 404 | `/*` (catch-all) | full | P0 | "Page introuvable" + retour |
| 58 | Erreur 500 / inattendue | (boundary) | full | P0 | "Une erreur est survenue" + report |

**Total : 58 écrans / vues identifiés au MVP.** P0 = MVP obligatoire, P1 = MVP confortable, P2 = post-MVP.

---

## 4. Flux principaux (parcours)

Référence : `.clinerules-design` §5. Cinq parcours critiques, schématisés ici en transitions d'écrans. Détail des wireframes au document 02.

### P1 — Ajout manuel d'une carte
```
[Tab Collection ou écran X] 
  → tap FAB ⊕ 
  → /add/choose (bottom sheet) 
  → tap "Saisir manuellement" 
  → /add/manual (autocomplete, focus auto, clavier ouvert)
  → tap candidat 
  → /add/manual/details (qté/état/foil/langue/classeur — défauts utilisateur préremplis)
  → tap "Ajouter"
  → toast "Carte ajoutée" + lien "Annuler" (5 s)
  → retour /collection (carte visible avec animation d'arrivée)
```
**Variante "ajout en série"** : toggle activé en haut de `/add/manual/details` → après "Ajouter", retour à `/add/manual/series` avec focus auto sur le champ recherche, compteur "+N cartes ajoutées" en haut.

### P2 — Scan d'une carte unique
```
[Tab Scan]
  → /scan (choix mode)
  → tap "Scanner une carte"
  → (1er lancement) demande permission caméra avec explication
  → /scan/single (viseur, cadre cible, texte d'aide léger)
  → capture auto (carte stable 1–2 s) OU bouton manuel
  → /scan/single/review (image + candidats + score)
     ├─ Confiance ≥ 90% : pré-validation, "Confirmer" en CTA principal
     ├─ Confiance moyenne : liste 3–5 candidats à choisir
     └─ Échec : "Réessayer" / "Saisir manuellement"
  → → /add/manual/details (préremplie depuis le scan)
  → tap "Ajouter" → toast → retour /scan ou /collection (préférence)
```

### P3 — Scan d'un lot
```
[Tab Scan]
  → /scan
  → tap "Scanner un lot"
  → /scan/batch (viseur + compteur "0 cartes scannées" + bouton "File")
  → capture continue (chaque carte détectée → ajoutée à la file SANS validation immédiate)
  → tap "X cartes en attente"
  → /scan/batch/queue (vignettes file)
  → tap "Terminer"
  → /scan/batch/review (liste éditable : modifier/supprimer/préciser état/foil/langue par carte)
  → tap "Tout ajouter à ma collection"
  → toast bilan ("X cartes ajoutées") + lien revue
  → retour /collection
```
**Interruption** : si l'app est fermée pendant le lot, file persistée en IndexedDB. Au prochain lancement → bandeau "Reprendre votre lot de N cartes ?" sur `/scan` ou `/collection`.

### P4 — Recherche dans la collection
```
[Tab Collection]
  → tap barre de recherche persistante en haut
  → suggestions récentes au focus
  → frappe (debounce 250 ms) → résultats filtrés in-place
  → résultats partagent les modes de vue actifs (liste/grille/pile)
```
La recherche dans `/search` (catalogue Scryfall) suit la même mécanique mais cible le catalogue mondial.

### P5 — Mode hors-ligne
```
[Détection perte réseau]
  → bandeau discret "Hors-ligne" en haut, persistant jusqu'au retour
  → Toutes les routes de consultation marchent (collection en cache)
  → Ajout manuel marche (carte mise en file de sync, marquée "à synchroniser" — icône cloud↑)
  → Scan local marche (reco embarquée), résultats marqués pareil
  → [Retour réseau]
  → sync silencieuse en arrière-plan
  → toast discret "X cartes synchronisées"
```

---

## 5. Niveaux d'accès & flux d'authentification

```
                 ┌──────────────────────┐
                 │ Lancement application │
                 └──────────┬───────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
         Session                         Pas de
         valide                          session
            │                               │
            ▼                               ▼
     ┌──────────────┐              ┌──────────────────┐
     │ /collection  │              │ /onboarding (1er)│
     └──────────────┘              │ ou /auth/login   │
                                   └────────┬─────────┘
                                            │
                                  ┌─────────┴─────────┐
                                  │                   │
                              Connexion           Inscription
                                  │                   │
                                  └──────┬────────────┘
                                         ▼
                                  /auth/callback → /collection
```

**Routes publiques** : `/auth/*`, `/onboarding`, `/profile/legal`, `/profile/about`.
**Routes protégées** : tout le reste. Redirection vers `/auth/login` avec param `?redirect=`.

---

## 6. Modales, bottom sheets, overlays

| Type | Quand l'utiliser | Comportement |
|---|---|---|
| **Bottom sheet** | Filtres, tri, choix mode de vue, file de scan, choix méthode d'ajout | Glisse depuis le bas. Glissable pour fermer. Drag handle visible. |
| **Modale plein écran** | Édition longue, prévisualisation média | Bouton fermeture ✕ en haut à gauche/droite selon plateforme. |
| **Modale d'alerte (dialog)** | Action irréversible **uniquement** (suppression, déconnexion) | 2 boutons : "Annuler" (secondaire, à gauche) + action destructive (à droite, couleur erreur). Échap = annuler. |
| **Toast / snackbar** | Confirmation d'action réussie ou info brève | 4 s par défaut, 5 s si action "Annuler" présente. Bas de l'écran (au-dessus de la tab bar). `aria-live="polite"`. |
| **Overlay image** | Image carte plein écran, zoom | Fond noir 90%, swipe down pour fermer. |
| **Banner** | Hors-ligne, lot interrompu, sync en cours | Haut de l'écran, non bloquant. Dismissable si non critique. |

**Règle** : une modale d'alerte ne sert **qu'aux actions irréversibles**. Pour le reste : toast avec "Annuler" (état optimiste).

---

## 7. États transverses

À prévoir pour **chaque** écran de liste/contenu :

| État | Quand | Apparence |
|---|---|---|
| **Default** | Données chargées | UI nominale |
| **Loading** | Premier chargement | Skeleton respectant la forme du contenu (pas de spinner centré) |
| **Empty** | Pas de données | Illustration sobre + titre court + explication + CTA |
| **Error** | Échec réseau / serveur | Icône + message clair + bouton "Réessayer" |
| **Offline** | Sans réseau | Bandeau global + données en cache utilisables, badges "à synchroniser" |
| **Partial / stale** | Cache servi pendant rechargement | Données affichées + indicateur discret de mise à jour |

---

## 8. Préparation à l'extension Pokémon (déjà dans l'arborescence)

Aucune route ne mentionne "magic" ou "mtg". Le contexte TCG actif est implicite au MVP (Magic seul) et deviendra explicite à l'arrivée de Pokémon via :

- un **sélecteur de TCG** dans la barre supérieure de `/collection`, `/search`, `/stats` (invisible tant qu'un seul TCG est actif) ;
- un **filtre `game`** côté API et IndexedDB dès le premier schéma ;
- des **composants génériques** (CardThumbnail, CardDetail, FilterPanel, StatsChart) qui reçoivent leurs labels et renderers du module TCG actif — voir `.clinerules-design` §11.

Les routes resteront identiques. Seuls les filtres avancés et le rendu de la carte changent par TCG.

---

## 9. Ce que cet inventaire ne couvre pas (encore)

- **Wireframes détaillés** — document 02
- **Specs fonctionnelles écran par écran** (interactions, validations, edge cases, data, a11y) — document 03
- **Design system** (tokens, composants atomiques) — Figma à venir
- **Maquettes haute fidélité** — Figma
- **Spécifications d'animation** (durées, easing) — Figma + ADR
- **Microcopy complète** (toutes les chaînes FR/EN) — phase ultérieure
