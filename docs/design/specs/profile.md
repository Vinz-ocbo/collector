# Specs — Profil & paramètres

Écrans 47 à 55. Wireframes : [`../wireframes/profile.md`](../wireframes/profile.md).

---

## #47 — Profil — accueil (`/profile`)

**Wireframe** : profile.md #47

**Objectif** : point d'entrée vers la gestion compte, préférences, données et infos app.

**Données**
- Email + date d'inscription.
- KPIs collection (nombre, valeur).
- Version de l'app (depuis env).
- Build hash (depuis env).

**Interactions**
- Tap section → sous-route correspondante.
- Tap "Voir mes statistiques" → `/stats`.
- Tap "Se déconnecter" → modale confirmation → logout (révocation token + nettoyage cache local non sensible) → redirection `/auth/login`.
- Tap version → copie dans presse-papiers + toast.

**États** : default, loading (skeletons), error.

**Edge cases**
- Hors-ligne : toutes les sections accessibles, mais déconnexion = warning ("Cela supprimera vos données locales jusqu'à la prochaine connexion. Continuer ?").

**A11y**
- Liste sémantique de sections.
- Chaque section = `<a>` avec icône + label.
- Bouton déconnexion clairement labellé, focus visible.

**Critères d'acceptation**
- [ ] Toutes les sections accessibles.
- [ ] Déconnexion fonctionnelle avec confirmation.
- [ ] Version copiable.

---

## #48 — Compte (`/profile/account`)

**Wireframe** : profile.md #48

**Objectif** : gérer email, mot de passe, 2FA, connexions OAuth, et exercer ses droits RGPD.

**Sections**
1. Email + bouton modifier.
2. Mot de passe + bouton changer.
3. 2FA (Activer / Désactiver).
4. Connexions tierces (lier/délier).
5. Zone de danger : Export RGPD, Suppression compte.

**Interactions**
- **Modifier email** : flux 2 étapes (saisie + confirmation par lien envoyé sur ancien et nouveau).
- **Changer mdp** : écran dédié avec ancien mdp + nouveau (×2) + indicateur force.
- **Activer 2FA** : flux QR code + code de vérification + codes de récupération.
- **Délier provider** : bloqué si seul moyen de connexion.
- **Exporter mes données** : génère archive ZIP, lien email envoyé.
- **Supprimer mon compte** : modale confirmation → saisie email pour valider → délai de grâce 30 jours.

**Validations**
- Email : `z.string().email()`.
- Nouveau mdp : `signupSchema.shape.password`.
- Codes 2FA : 6 chiffres.

**Edge cases**
- Modification email : si nouvel email déjà utilisé par un autre compte, échec silencieux côté UI (ne pas révéler).
- Délier le seul provider : bouton désactivé + tooltip explicatif.
- Suppression : annulable pendant 30 jours par simple connexion.

**Sécurité**
- Toutes les actions sensibles requièrent une re-authentification (mdp ou OAuth) si la session date de plus de 5 min.
- Codes de récupération 2FA générés une seule fois, téléchargeables.
- Export : token signé, expiration 1h.
- Suppression : soft delete + hard delete après 30j (cron backend).

**A11y**
- Sections clairement séparées.
- Zone de danger : `<section role="region" aria-label="Zone de danger">`.
- Boutons destructifs en couleur erreur + label clair.

**Critères d'acceptation**
- [ ] Modification email fonctionnelle (2 étapes).
- [ ] Changement mdp fonctionnel.
- [ ] 2FA TOTP fonctionnelle.
- [ ] Connexions OAuth gérables.
- [ ] Export RGPD fonctionnel.
- [ ] Suppression compte avec délai de grâce.
- [ ] Re-auth obligatoire pour actions sensibles.

---

## #49 — Préférences (`/profile/preferences`)

**Wireframe** : profile.md #49

**Catégories**
1. Apparence : thème (clair / sombre / auto), langue UI.
2. Comportement : devise d'affichage, capture caméra (auto/manuel/vibration/son).
3. Valeurs par défaut : état, langue carte, classeur, foil.
4. Notifications : sync échouée, variation valeur.

**Interactions**
- Toutes les modifications appliquées immédiatement (pas de bouton "Sauvegarder").
- Persistance : backend (compte) + IndexedDB (cache local).
- Changement de thème : transition fluide (200 ms).
- Changement de langue UI : reload nécessaire si i18next charge à l'initialisation, sinon hot swap.

**Validations**
- Enums sur tous les selects.

**Edge cases**
- Hors-ligne : changements locaux + sync différée.
- Retour aux valeurs par défaut : bouton dédié en bas (P1).

**A11y**
- Tous les contrôles avec labels clairs.
- Switch : `role="switch"` `aria-checked`.
- Combobox : `aria-haspopup`.
- Section avec heading.

**Critères d'acceptation**
- [ ] Toutes les prefs persistées.
- [ ] Thème auto respecte `prefers-color-scheme`.
- [ ] Langue UI changeable.
- [ ] Valeurs par défaut utilisées dans `/add/manual/details`.

---

## #50 — Mes données (`/profile/data`)

**Wireframe** : profile.md #50

**Sections** : Export, Import, Synchronisation, Cache local.

**Interactions**
- Tap "Exporter" → `/profile/data/export`.
- Tap "Importer" → `/profile/data/import`.
- Tap "Synchroniser maintenant" → force la sync, indicateur visuel.
- Tap "Vider le cache" → modale confirmation → vide images + données catalogue (pas la collection).

**Critères d'acceptation**
- [ ] Sync manuelle fonctionnelle.
- [ ] Vidage cache n'affecte pas la collection.
- [ ] Tailles cache exactes.

---

## #51 — Export (`/profile/data/export`)

**Wireframe** : profile.md #51

**Objectif** : exporter sa collection au format CSV ou JSON, optionnellement compatible avec Moxfield/Archidekt.

**Champs**
- Périmètre : toute la collection / un classeur.
- Format : CSV / JSON / Moxfield (CSV) / Archidekt (CSV) — les 2 derniers en P1.
- Inclure : métadonnées Scryfall, notes, prix payés, photos de scan.

**Interactions**
- Tap "Télécharger l'export" :
  - Volume raisonnable (< 5 MB) → génération côté client + download natif.
  - Volume important → génération backend + email avec lien (token signé, expiration 24h).

**Validations** : aucune (toutes les options ont des défauts).

**Edge cases**
- Photos volumineuses : avertissement de taille avant génération.
- Hors-ligne : génération côté client uniquement, possible si périmètre raisonnable.

**Sécurité**
- Lien backend : token signé, à usage unique, expiration 24h.
- Photos : versions déjà ré-encodées (pas l'original).

**Critères d'acceptation**
- [ ] CSV et JSON fonctionnels (MVP).
- [ ] Téléchargement immédiat si possible.
- [ ] Email + lien si volume important.
- [ ] Périmètre filtrable.

---

## #52 — Import (`/profile/data/import`)

**Wireframe** : profile.md #52

**Stepper 3 étapes** : Choisir fichier → Mapping → Aperçu (dry-run).

**Étape 1 — Fichier**
- Drag & drop OU bouton parcourir.
- Formats : CSV (notre format, Moxfield, Archidekt, Deckbox), JSON (notre format).
- Lien "Voir un exemple de fichier".

**Étape 2 — Mapping**
- Détection automatique du format (header CSV).
- Mapping inférer + correction utilisateur via combobox.
- Champs sans correspondance → ignorés.

**Étape 3 — Aperçu (dry-run)**
- Cartes prêtes / à attention / erreur.
- Cartes non reconnues : suggestions par fuzzy matching.
- Doublons détectés : stratégie (Additionner / Garder / Remplacer).
- Classeur de destination.

**Validations**
- Taille fichier ≤ 10 MB.
- MIME type accepté.
- Lignes invalides : rejetées avec rapport.

**Interactions**
- Tap "Importer X cartes" → barre de progression non bloquante.
- En cas d'échec partiel : rapport téléchargeable des lignes en erreur.

**Edge cases**
- Fichier corrompu : message d'erreur + retry.
- Très gros fichier (> 1000 lignes) : import asynchrone backend + notification.
- Hors-ligne : import désactivé (besoin de Scryfall pour résoudre les cartes).

**Sécurité**
- Validation MIME réelle (magic bytes), pas seulement extension.
- Parser CSV sécurisé (pas de RCE — `papaparse` strict).
- Pas d'écrasement silencieux : utilisateur valide la stratégie sur doublons.

**Critères d'acceptation**
- [ ] CSV et JSON fonctionnels.
- [ ] Mapping flexible.
- [ ] Dry-run montre les conflits.
- [ ] Stratégie de fusion respectée.
- [ ] Rapport d'erreur disponible.

---

## #53 — À propos (`/profile/about`)

**Wireframe** : profile.md #53

**Données** : version, build hash, mentions Scryfall + Wizards, crédits techniques, liens externes.

**Conformité légale**
- Mention Scryfall obligatoire (ToS).
- Mention Wizards of the Coast (droit des marques).
- Précision "non affilié à WotC".
- Crédits open-source (mentions de licences).

**Critères d'acceptation**
- [ ] Mentions légales présentes.
- [ ] Version + build visibles.
- [ ] Liens externes ouvrent dans nouvel onglet.

---

## #54 — Mentions légales (`/profile/legal`)

**Wireframe** : profile.md #54

**Sous-pages** : CGU, Politique confidentialité, Politique cookies, Droits RGPD, Mentions de licence.

**Format** : pages markdown longues, scrollables. Sur mobile, table des matières en bottom sheet "Sections".

**RGPD spécifique**
- Liste des droits (accès, rectification, suppression, portabilité, opposition).
- Liens directs vers les actions associées dans `/profile/account`.
- Coordonnées du DPO si applicable.

**Critères d'acceptation**
- [ ] Toutes les pages accessibles.
- [ ] Markdown rendu correctement.
- [ ] TOC fonctionnelle sur mobile.
- [ ] Conformité RGPD.

---

## #55 — Aide (`/profile/help`) — P1

**Wireframe** : profile.md #55

**Format** : FAQ statique organisée par sections.

**Interactions**
- Recherche dans l'aide (filtre les FAQ).
- Tap question → expand inline.
- Bouton "Contacter le support" → mailto avec sujet + version + ID utilisateur (sans données sensibles).

**Critères d'acceptation** (P1)
- [ ] FAQ structurée.
- [ ] Recherche fonctionnelle.
- [ ] Lien support fonctionnel.
