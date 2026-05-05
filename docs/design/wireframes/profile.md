# Wireframes — Profil & paramètres

Écrans 47 à 55 de l'inventaire.

---

## #47 — Profil — accueil (`/profile`)

```
┌────────────────────────────────────┐
│ Profil                             │
├────────────────────────────────────┤
│                                    │
│        ┌──────┐                    │
│        │  👤  │                    │
│        │      │                    │
│        └──────┘                    │
│      vous@exemple.fr                │
│      Membre depuis mars 2026         │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 247 cartes · 18 230 €        │  │
│  │ [ Voir mes statistiques ▶ ]  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─── Mon compte ───                │
│                                    │
│  👤 Compte                  ▶      │   (1)
│  ⚙ Préférences              ▶      │
│  💾 Mes données             ▶      │
│                                    │
│  ─── Application ───               │
│                                    │
│  ℹ À propos                 ▶      │
│  📜 Mentions légales        ▶      │
│  ❓ Aide                    ▶      │
│                                    │
│  ─────────────                      │
│                                    │
│  [    Se déconnecter         ]     │   (2)
│                                    │
│  Version 0.1.0 · build 42b3a       │   (3)
│                                    │
├────────────────────────────────────┤
│  📚    🔍   [⊕]   📊    👤        │
└────────────────────────────────────┘
```

**Notes**
1. Liste de sections, chacune mène à une sous-route. Sépration visuelle claire entre données utilisateur et infos app.
2. Déconnexion = action sensible : modale de confirmation ("Se déconnecter ? Vos données restent disponibles dans le cloud."), pas de pattern destructeur (rouge), juste secondaire.
3. Numéro de version visible discrètement en bas. Tap = copie dans le presse-papiers (utile pour reports de bug).

---

## #48 — Compte (`/profile/account`)

```
┌────────────────────────────────────┐
│ ← Compte                           │
├────────────────────────────────────┤
│                                    │
│  Email                             │
│  vous@exemple.fr                   │
│  [ Modifier l'email      ▶ ]       │   (1)
│                                    │
│  Mot de passe                      │
│  ••••••••••                         │
│  [ Changer le mot de passe ▶ ]     │
│                                    │
│  Authentification à 2 facteurs     │
│  Désactivée                         │
│  [ Activer la 2FA          ▶ ]     │
│                                    │
│  ─── Connexions tierces ───         │
│                                    │
│  ✓ Google     vous@gmail.com  ✕    │   (2)
│  + Lier Apple                       │
│                                    │
│  ─────────────                      │
│  ─── Zone de danger ───            │   (3)
│                                    │
│  [ Exporter mes données  ▶ ]       │   (4)
│  [ Supprimer mon compte  🗑 ]      │
│      Action irréversible            │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Modification email : flux 2 étapes (saisie + confirmation par lien envoyé sur l'ancien et le nouveau).
2. ✕ pour délier un provider OAuth. Bloqué si c'est la seule méthode de connexion (pour éviter le verrouillage).
3. Zone de danger isolée visuellement (séparateur épais, libellé explicite).
4. **Export RGPD** : génère une archive ZIP (JSON collection + métadonnées compte). Lien téléchargeable envoyé par email (peut être long).
- Suppression compte : modale de confirmation avec saisie de l'email pour valider, délai de grâce 30 jours pendant lequel la connexion réactive le compte.

---

## #49 — Préférences (`/profile/preferences`)

```
┌────────────────────────────────────┐
│ ← Préférences                      │
├────────────────────────────────────┤
│                                    │
│  ─── Apparence ───                 │
│                                    │
│  Thème                             │
│  ( ) Clair                         │
│  ( ) Sombre                        │
│  (•) Automatique (système)          │   (1)
│                                    │
│  Langue de l'interface             │
│  [▼ Français]                       │
│                                    │
│  ─── Comportement ───              │
│                                    │
│  Devise d'affichage                │
│  [▼ EUR (€)]                       │
│                                    │
│  Capture caméra                    │
│  ⃝──● Capture automatique           │   (2)
│  ⃝──● Vibration tactile             │
│  ⃝──○ Son de capture                │
│                                    │
│  ─── Valeurs par défaut ───         │
│                                    │
│  État par défaut                   │   (3)
│  [▼ NM — Near Mint]                │
│                                    │
│  Langue par défaut des cartes      │
│  [▼ EN — English]                  │
│                                    │
│  Classeur cible                    │
│  [▼ Toutes mes cartes]             │
│                                    │
│  Foil par défaut                   │
│  ⃝──○ Non                           │
│                                    │
│  ─── Notifications ───              │
│                                    │
│  Sync échouée                      │
│  ⃝──● Notifier                      │
│                                    │
│  Variation de valeur (>10% / 7j)   │   (4)
│  ⃝──○ Notifier                      │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Auto = respect `prefers-color-scheme` du système.
2. Toggles caméra : capture auto activable/désactivable selon préférence.
3. Valeurs par défaut utilisées dans #38 (`/add/manual/details`) — fait gagner du temps.
4. Notifications strictement utiles, jamais promotionnelles (per `.clinerules-design`).

---

## #50 — Mes données (`/profile/data`)

```
┌────────────────────────────────────┐
│ ← Mes données                      │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 📤 Exporter                   │  │
│  │                              │  │
│  │ Téléchargez votre collection  │  │
│  │ au format CSV ou JSON.       │  │
│  │ [ Exporter ▶ ]               │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 📥 Importer                   │  │
│  │                              │  │
│  │ Ajoutez des cartes depuis     │  │
│  │ un fichier CSV ou JSON.      │  │
│  │ [ Importer ▶ ]               │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─── Synchronisation ───           │
│                                    │
│  Dernière sync : il y a 5 min       │
│  [ Synchroniser maintenant   ]      │   (1)
│                                    │
│  ─── Cache local ───                │
│                                    │
│  Images en cache : 142 Mo           │
│  Données en cache : 8 Mo            │
│  [ Vider le cache              ]    │   (2)
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Sync manuelle pour forcer (utile après modifs offline).
2. Vider le cache : modale de confirmation, prévient que les images devront être retéléchargées (impact data mobile).

---

## #51 — Export (`/profile/data/export`)

```
┌────────────────────────────────────┐
│ ← Exporter ma collection           │
├────────────────────────────────────┤
│                                    │
│  Périmètre                         │
│  (•) Toute ma collection            │
│  ( ) Un classeur en particulier    │
│      [▼ Choisir un classeur]        │
│                                    │
│  Format                            │
│  ( ) CSV (tableur, Excel)           │
│  (•) JSON (complet, structuré)     │
│  ( ) Format Moxfield (CSV)         │   (1)
│  ( ) Format Archidekt (CSV)        │
│                                    │
│  Inclure                           │
│  [x] Métadonnées Scryfall           │
│  [x] Mes notes                      │
│  [x] Prix payés                     │
│  [ ] Photos de scan (peut être lourd)│
│                                    │
│  ─── Aperçu ───                     │
│  247 cartes · ≈ 850 Ko              │
│                                    │
├────────────────────────────────────┤
│  [   Télécharger l'export      ]   │
└────────────────────────────────────┘
```

**Notes**
1. Formats Moxfield/Archidekt : v1.1, mais structure d'export prévoit le mapping dès le MVP.
- Génération côté client si volume raisonnable, sinon backend asynchrone + email.
- Toast "Export téléchargé" + ouverture/partage natif.

---

## #52 — Import (`/profile/data/import`)

```
┌────────────────────────────────────┐
│ ← Importer une collection          │
├────────────────────────────────────┤
│                                    │
│  Étape 1 / 3 — Choisir un fichier   │   (1)
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │       📁 + Glisser-déposer   │  │
│  │       un fichier CSV / JSON   │  │
│  │                              │  │
│  │   ou [ Parcourir ]           │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  Formats supportés :                │
│   • CSV (notre format, Moxfield,    │
│     Archidekt, Deckbox)             │
│   • JSON (notre format)             │
│                                    │
│  [ Voir un exemple de fichier ]     │
│                                    │
└────────────────────────────────────┘
```

**Étape 2 — Mapping** (si format inconnu) :

```
┌────────────────────────────────────┐
│ ← Importer (2/3) — Mapping         │
├────────────────────────────────────┤
│  Format détecté : Moxfield CSV      │
│  142 lignes · ~138 cartes           │
│                                    │
│  Vérifiez les associations :        │
│                                    │
│  Colonne CSV     →  Champ           │
│  "Name"          →  Nom carte    ✓ │
│  "Edition"       →  Set          ✓ │
│  "Quantity"      →  Quantité     ✓ │
│  "Foil"          →  Foil         ✓ │
│  "Condition"     →  État          ▼│   (2)
│  "Language"      →  Langue        ▼│
│                                    │
│  [   Suivant : aperçu          ]   │
└────────────────────────────────────┘
```

**Étape 3 — Aperçu (dry-run)** :

```
┌────────────────────────────────────┐
│ ← Importer (3/3) — Aperçu          │
├────────────────────────────────────┤
│  Bilan de l'import                 │
│  ✓ 138 cartes prêtes à l'import     │
│  ⚠ 4 cartes nécessitent attention   │
│  ✗ 0 erreur bloquante               │
│                                    │
│  ─── Cartes non reconnues (4) ───  │
│  • "Bblack Lotus" → Black Lotus ?   │   (3)
│    [ Corriger ] [ Ignorer ]         │
│  • ...                              │
│                                    │
│  ─── Doublons détectés ───          │
│  • Lightning Bolt M10 : déjà ×3,    │   (4)
│    +2 → ×5 ?                        │
│    (•) Additionner                  │
│    ( ) Garder l'existant            │
│    ( ) Remplacer                    │
│                                    │
│  Classeur de destination            │
│  [▼ Toutes mes cartes]              │
│                                    │
├────────────────────────────────────┤
│  [        Importer 138 cartes  ]   │
└────────────────────────────────────┘
```

**Notes**
1. Stepper visible (1/3, 2/3, 3/3).
2. Mapping inférer + corriger. Champs sans correspondance = ignorés.
3. Suggestions de correction par fuzzy matching.
4. Stratégie de fusion sur doublons, applicable globalement ou par carte.
- Après tap "Importer" : barre de progression, ne pas bloquer l'app.
- En cas d'échec partiel : rapport téléchargeable des lignes en erreur.

---

## #53 — À propos (`/profile/about`)

```
┌────────────────────────────────────┐
│ ← À propos                         │
├────────────────────────────────────┤
│                                    │
│            [logo]                  │
│         tcg-collector              │
│                                    │
│         Version 0.1.0              │
│         build 42b3a                 │
│                                    │
│  ─────────────                      │
│                                    │
│  Données de cartes fournies par    │
│  Scryfall (scryfall.com)           │   (1)
│                                    │
│  Magic: The Gathering, ses cartes  │
│  et symboles sont des marques       │
│  déposées de Wizards of the Coast.  │
│  Cette application n'est pas        │
│  affiliée à Wizards of the Coast.   │
│                                    │
│  ─────────────                      │
│                                    │
│  Crédits techniques                │
│  • Scryfall API                     │
│  • OpenCV / TensorFlow             │
│  • React, Vite, …                   │
│                                    │
│  ─────────────                      │
│                                    │
│  [ Site web              ▶ ]       │
│  [ Code source (GitHub)  ▶ ]       │
│  [ Signaler un bug       ▶ ]       │
│                                    │
└────────────────────────────────────┘
```

**Notes**
1. Mention Scryfall et Wizards obligatoire (CGU Scryfall + droit des marques).

---

## #54 — Mentions légales (`/profile/legal`)

```
┌────────────────────────────────────┐
│ ← Mentions légales                 │
├────────────────────────────────────┤
│                                    │
│  ▶ Conditions générales d'utilisation│
│                                    │
│  ▶ Politique de confidentialité    │
│                                    │
│  ▶ Politique des cookies           │
│                                    │
│  ▶ Vos droits RGPD                 │   (1)
│      Accès · rectification ·        │
│      suppression · portabilité      │
│                                    │
│  ▶ Mentions de licence              │
│      (open-source dependencies)     │
│                                    │
└────────────────────────────────────┘
```

**Sous-page typique (CGU, Confidentialité…)** : page de texte longue, scrollable, avec table des matières flottante en haut sur mobile (bottom sheet "Sections").

**Notes**
1. Présentation explicite des droits RGPD + accès direct aux actions (`/profile/account` zone de danger).

---

## #55 — Aide (`/profile/help`) — P1

```
┌────────────────────────────────────┐
│ ← Aide                             │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 🔍 Rechercher dans l'aide      │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│                                    │
│  ─── Premiers pas ───              │
│  ▶ Comment ajouter ma première     │
│     carte                           │
│  ▶ Scanner un lot rapidement       │
│  ▶ Organiser avec des classeurs    │
│                                    │
│  ─── Reconnaissance photo ───       │
│  ▶ Bonnes pratiques de photo        │
│  ▶ Que faire si une carte n'est     │
│     pas reconnue                    │
│                                    │
│  ─── Synchronisation ───            │
│  ▶ Mode hors-ligne                  │
│  ▶ Sync : pourquoi mes cartes ne    │
│     s'affichent pas ailleurs ?      │
│                                    │
│  ─── Compte ───                     │
│  ▶ Changer mon mot de passe         │
│  ▶ Supprimer mon compte             │
│                                    │
│  ─────────────                      │
│  Pas trouvé ?                       │
│  [   📧 Contacter le support   ]    │
│                                    │
└────────────────────────────────────┘
```

**Notes**
- FAQ statique, contenu en markdown chargé à la demande.
- Bouton de contact ouvre un mailto avec sujet pré-rempli incluant la version de l'app.
