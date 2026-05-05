# 02 — Wireframes

> Wireframes basse fidélité, ASCII, **mobile 360 px** par défaut. Variantes desktop notées quand significatives.
> Référence inventaire : `01-arborescence.md`. Référence specs : `03-specs-fonctionnelles.md` (à venir).

---

## Conventions de notation

```
┌────────────────────────────────────┐
│ ← Titre              [ic1] [ic2]   │   ← header (≈ 56 px haut)
├────────────────────────────────────┤
│                                    │
│        Zone de contenu             │
│        (scrollable)                │
│                                    │
├────────────────────────────────────┤
│  📚    🔍    [⊕]   📊    👤        │   ← bottom tab bar (≈ 64 px haut)
│ Coll.  Rech.  Scan  Stats Profil   │
└────────────────────────────────────┘
```

| Symbole | Signification |
|---|---|
| `←` `→` | Bouton retour / chevron |
| `⊕` | Action principale (FAB ou tab Scan) |
| `⋮` | Menu contextuel (kebab) |
| `[ ]` | Bouton |
| `[●]` | Bouton sélectionné / actif |
| `[ ]` `[x]` | Checkbox |
| `( )` `(•)` | Radio |
| `▼` | Dropdown / accordéon fermé |
| `▲` | Accordéon ouvert |
| `[img]` | Image / vignette |
| `[skel]` | Skeleton loader |
| `(N)` | Annotation référencée sous le wireframe |
| `╴╴╴╴` | Limite de pli (au-delà : scroll) |

**Largeur** : 40 caractères ≈ 360 px mobile. Pour desktop, conteneur fluide jusqu'à 1280 px max-width 1200 px, marges latérales ≥ 24 px.

**États documentés systématiquement** : default, loading (skeleton), empty, error. Hover/focus traités au niveau du design system, pas répétés ici.

---

## Index des wireframes

| Fichier | Couvre | Écrans (n° du §3 de l'arborescence) |
|---|---|---|
| [`wireframes/auth.md`](./wireframes/auth.md) | Splash, auth, onboarding, permissions | 1–6 |
| [`wireframes/collection.md`](./wireframes/collection.md) | Ma collection, filtres, classeurs, détail/édition exemplaire | 7–20 |
| [`wireframes/search.md`](./wireframes/search.md) | Catalogue Scryfall, fiche carte, image plein écran | 21–27 |
| [`wireframes/scan.md`](./wireframes/scan.md) | Scan unique, scan lot, validation, erreurs caméra | 28–35 |
| [`wireframes/add.md`](./wireframes/add.md) | Flux d'ajout manuel, mode série, toast confirmation | 36–40 |
| [`wireframes/stats.md`](./wireframes/stats.md) | Vue d'ensemble + déclinaisons par couleur/type/rareté/set | 41–46 |
| [`wireframes/profile.md`](./wireframes/profile.md) | Profil, compte, préférences, données, légal | 47–55 |
| [`wireframes/transverse.md`](./wireframes/transverse.md) | Hors-ligne, 404, 500, modales génériques, toasts | 56–58 + composants |

---

## Principes appliqués dans tous les wireframes

(Rappels de `.clinerules-design` qui se traduisent visuellement)

1. **Zone de pouce** : actions principales en bas (FAB, CTA collés au footer ou tab bar).
2. **Header léger** : titre + 1–2 actions max. Pas de hamburger.
3. **Cibles tactiles ≥ 44 px** : tous les boutons et items de liste respectent cette hauteur minimale même quand le wireframe ASCII les dessine compacts.
4. **Skeleton plutôt que spinner** : chaque écran avec données distantes a un état loading skeleton.
5. **Empty state actionnable** : titre court + explication + CTA, pas juste "Aucun élément".
6. **Une modale = une action irréversible**. Le reste passe par toast avec "Annuler".
7. **Filtres en bottom sheet sur mobile**, panneau latéral droit sur desktop ≥ 768 px.
8. **Tab bar persistante** sauf : flux scan immersif, plein écran image, ajout en série en cours.
9. **Bandeau hors-ligne** discret en haut, sous le header, persistant.
10. **Image carte respectée** : ratio 5:7, jamais déformée, aucun filtre.
