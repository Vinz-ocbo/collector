# Wireframes — Ajout de carte

Écrans 36 à 40 de l'inventaire. Parcours critique P1 (ajout manuel) et mode série.

---

## #36 — Choix méthode d'ajout (`/add/choose`) — bottom sheet

Déclenché par : tap FAB ⊕ depuis n'importe où (Collection, Stats…), ou tap "Ajouter une carte" depuis collection vide.

```
                ╴╴╴ drag handle ╴╴╴
┌────────────────────────────────────┐
│ Ajouter une carte             ✕    │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────┐      │
│  │  ⌨                        │      │
│  │                           │      │
│  │  Saisir manuellement      │      │
│  │  Recherche par nom        │      │
│  └──────────────────────────┘      │
│                                    │
│  ┌──────────────────────────┐      │
│  │  📷                       │      │
│  │                           │      │
│  │  Photographier            │      │
│  │  Une carte ou un lot      │      │
│  └──────────────────────────┘      │
│                                    │
│  ┌──────────────────────────┐      │
│  │  🖼                        │      │
│  │                           │      │
│  │  Depuis la galerie         │      │   (1)
│  │  Choisir une photo         │      │
│  └──────────────────────────┘      │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Per specs ("ajouter une carte avec reconnaissance photo (galerie ou appareil photo)"), galerie comme troisième option. Ouvre sélecteur de fichiers natif (`<input type="file" accept="image/*">` sans `capture`).
- Tap sur "Photographier" → `/scan` (avec contexte "depuis ajout"). Tap sur "Saisir" → `/add/manual`.
- Si on est dans le contexte d'un classeur (`/collection/binders/:id`), la sheet préremplit le champ classeur.

---

## #37 — Recherche autocomplete (`/add/manual`)

Plein écran, focus auto sur le champ, clavier ouvert immédiatement.

```
┌────────────────────────────────────┐
│ ✕ Ajouter une carte                │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 🔍 Nom de la carte…       ●    │ │   (1)
│ └────────────────────────────────┘ │
│                                    │
├────────────────────────────────────┤
│  Suggestions                       │
│                                    │
│  [img] Lightning Bolt               │   (2)
│        M10 · Common · #133          │
│        Possédée ×3                   │
│                                    │
│  [img] Lightning Strike             │
│        Theros · Common              │
│                                    │
│  [img] Lightning Helix              │
│        Ravnica · Uncommon           │
│                                    │
│  [img] Chain Lightning              │
│        Legends · Uncommon           │
│                                    │
│  [img] Lightning Greaves            │
│        Mirrodin · Uncommon          │
│        Possédée ×1                   │
│                                    │
│  ─────────────                      │
│  📷 Scanner à la place              │   (3)
└────────────────────────────────────┘
```

**État vide** (champ vide) :

```
├────────────────────────────────────┤
│  Recherches récentes                │
│   • lightning bolt                  │
│   • forest m10                      │
│   • brainstorm                      │
│                                    │
│  Suggestions du moment              │
│  [img] [img] [img] [img]            │
└────────────────────────────────────┘
```

**État loading** (recherche en cours, debounce 250 ms) :

```
├────────────────────────────────────┤
│  [skel] [skeleton ligne]            │
│  [skel] [skeleton ligne]            │
│  [skel] [skeleton ligne]            │
└────────────────────────────────────┘
```

**Notes**
1. Indicateur d'activité ● à droite du champ pendant la requête. Bouton ✕ pour effacer la frappe (apparaît dès qu'il y a du texte).
2. Indicateur "déjà possédée" inline. Tap → `/add/manual/details?cardId=:id`.
3. Toujours laisser une porte vers le scan, en bas (chemin alternatif visible).
- Recherche typeahead sur le nom + alias (ex : "fof" → "Force of Will").
- Si plusieurs sets pour le même nom : la suggestion la plus récente est affichée par défaut, avec un sous-tag "Voir les 8 impressions" tappable.
- Hors-ligne : recherche dans le cache local seulement, bandeau d'info en haut.

---

## #38 — Détails de l'ajout (`/add/manual/details`)

Affiché après sélection d'une carte (depuis recherche manuelle ou validation scan).

```
┌────────────────────────────────────┐
│ ✕ Ajouter à ma collection          │
├────────────────────────────────────┤
│                                    │
│  ┌──────┐  Lightning Bolt          │
│  │      │  Magic 2010 · #133       │
│  │ img  │  Common · {R} · Instant  │
│  │      │  Prix : 1.50 €           │
│  └──────┘  [ Voir la fiche ▶ ]     │   (1)
│                                    │
│  ─────────────                      │
│                                    │
│  Quantité                          │
│  ┌──┐  ┌──────┐  ┌──┐              │
│  │ -│  │   1  │  │ +│              │   (2)
│  └──┘  └──────┘  └──┘              │
│                                    │
│  État                              │
│  [NM] [LP] [MP] [HP] [DMG]         │   (3)
│   ●                                 │
│                                    │
│  Foil                              │
│  ⃝──○ Non    (toggle)              │
│                                    │
│  Langue                            │
│  [▼ EN — English]                  │
│                                    │
│  Classeur                          │
│  [▼ Toutes mes cartes]             │
│                                    │
│  Prix payé (facultatif)            │
│  ┌────────────────┐                │
│  │           €    │                │
│  └────────────────┘                │
│                                    │
│  Notes (facultatif)                │
│  ┌────────────────────────────┐    │
│  │                            │    │
│  └────────────────────────────┘    │
│                                    │
│  ─────────────                      │
│  ( ) Ajouter et continuer en série │   (4)
│                                    │
├────────────────────────────────────┤
│  [        Ajouter à ma collection]  │   (5)
└────────────────────────────────────┘
```

**Notes**
1. Lien vers `/search/cards/:cardId` pour consulter la fiche complète sans perdre la saisie.
2. Stepper +/- pour la quantité. Borne basse 1 (en dessous le bouton "Ajouter" est désactivé).
3. Chips toggle, sélection unique. Défaut depuis préférences utilisateur (NM par défaut).
4. **Mode série** : checkbox visible avant le CTA. Si cochée → bascule sur `/add/manual/series` après l'ajout.
5. CTA principal sticky en bas. Désactivé tant que les champs requis sont incomplets (en pratique : tous ont des défauts, donc actif dès l'arrivée).
- Pré-remplissage intelligent : état/foil/langue/classeur depuis le **dernier ajout** ou les **préférences utilisateur** (premier ajout).
- État optimiste : tap "Ajouter" → animation immédiate, toast confirmation, retour à l'écran d'origine. Sync serveur en arrière-plan.

---

## #39 — Mode ajout en série (`/add/manual/series`)

Variante de `/add/manual` avec barre de progression en haut, focus persistant sur le champ recherche après chaque ajout.

```
┌────────────────────────────────────┐
│ ✕ Ajout en série                   │
│ 7 cartes ajoutées · 12.40 €         │   (1)
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 🔍 Nom de la carte…            │ │
│ └────────────────────────────────┘ │
│                                    │
│ Dernière ajoutée :                  │
│ ┌─────────────────────────────┐    │
│ │ [img] Lightning Bolt   ×1   │    │   (2)
│ │       M10 · NM · EN          │    │
│ │       [ Annuler ] [ Modifier ]│    │
│ └─────────────────────────────┘    │
│                                    │
│ Suggestions                         │
│  [img] Lightning Strike             │
│  [img] Chain Lightning              │
│  ...                                │
│                                    │
├────────────────────────────────────┤
│  [    Terminer l'ajout en série ]   │   (3)
└────────────────────────────────────┘
```

**Comportement entre deux ajouts** : après tap "Ajouter" sur `/add/manual/details`, on revient ici, le focus est de nouveau sur le champ recherche, le clavier reste ouvert, le bloc "Dernière ajoutée" met à jour. La carte précédente reste annulable pendant 5 s (lien explicite + toast).

**Notes**
1. **Compteur visible et motivant** : nombre de cartes ajoutées + valeur cumulée.
2. **Bloc "dernière ajoutée"** : feedback de l'action précédente, possibilité d'annuler ou de modifier sans casser le flux.
3. Sortie explicite via "Terminer". À la sortie : toast bilan + retour à `/collection` (ou origine).
- Si l'utilisateur quitte l'app pendant le mode série, l'état est perdu (les cartes ajoutées restent dans la collection — c'est juste le mode rapide qui s'arrête).
- a11y : annonce `aria-live="polite"` à chaque ajout ("Lightning Bolt ajoutée. 7 cartes au total.").

---

## #40 — Toast de confirmation

Composant transverse (utilisé après ajout, suppression, sync, etc.).

```
              (écran d'arrivée)
   ┌────────────────────────────┐
   │ ✓ Lightning Bolt ajoutée    │
   │   à votre collection         │
   │              [ Annuler 5s ] │   (1)
   └────────────────────────────┘
              (au-dessus de la tab bar)
```

**Variantes** :

| Action | Couleur | Durée | Bouton |
|---|---|---|---|
| Ajout réussi | Succès (vert) | 5 s | Annuler |
| Ajout en série | Succès | 3 s | Voir |
| Suppression réussie | Neutre / succès | 5 s | Annuler |
| Erreur réseau (sync échouée) | Erreur (rouge) | 6 s | Réessayer |
| Lot ajouté (X cartes) | Succès | 6 s | Voir |
| Mise à jour cotes | Info | 3 s | — |
| Synchronisation | Info | 3 s | — |

**Notes**
1. **Action Annuler** : présente pour toute action réversible. Disparait après 5 s = action confirmée définitivement.
- Position : bas de l'écran, au-dessus de la tab bar (≥ 80 px de marge).
- Stack : toasts empilés du plus récent en haut (max 3 visibles, les autres en file).
- a11y : `role="status"` + `aria-live="polite"` (sauf erreurs : `aria-live="assertive"`).
- Swipe horizontal pour fermer manuellement.
- Respect `prefers-reduced-motion` : apparition instantanée sans glissement.
