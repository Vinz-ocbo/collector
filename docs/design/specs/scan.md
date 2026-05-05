# Specs — Scan

Écrans 28 à 35. Wireframes : [`../wireframes/scan.md`](../wireframes/scan.md).

---

## #28 — Choix mode scan (`/scan`)

**Wireframe** : scan.md #28

**Objectif** : orienter l'utilisateur vers le bon flux selon son intention (carte unique vs lot).

**Données**
- État de la file d'attente lot (IndexedDB) : si > 0 cartes, afficher bandeau de reprise.

**Interactions**
- Tap "Scanner une carte" → vérification permission caméra → `/scan/single`.
- Tap "Scanner un lot" → idem → `/scan/batch`.
- Tap "Reprendre votre lot" → `/scan/batch/review` avec file restaurée.

**États** : default, avec/sans reprise.

**Critères d'acceptation**
- [ ] 2 modes accessibles.
- [ ] Reprise affichée seulement si file en cours.
- [ ] Permission caméra demandée à la 1re tentative.

---

## #29 — Viseur scan unique (`/scan/single`) — immersif

**Wireframe** : scan.md #29

**Objectif** : capturer une carte avec aide à la visée et capture automatique.

**Données / sources**
- Stream caméra via `getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 } } })`.
- Modèle de détection (segmentation simple) chargé dynamiquement (pas dans le bundle initial).

**Composants**
- Header minimal (← retour, 💡 flash, ⚙ réglages).
- Vue caméra plein écran.
- Cadre de visée (overlay).
- Texte d'aide.
- Bouton capture manuelle (gros, central).
- Bouton "Saisir manuellement" (échappatoire).

**Interactions**
- **Détection automatique** : analyse 2–3 frames/s pour détecter la présence d'une carte stable.
  - Carte détectée + stable (1–2 s) → capture automatique.
  - Sinon : utilisateur peut taper "capture manuelle".
- **Tap flash 💡** : toggle torche (si supporté par l'appareil — `track.applyConstraints({ torch: true })`).
- **Tap ⚙** : bottom sheet réglages (qualité photo, mode auto/manuel, son/vibration).
- **Tap retour** : sortie du viseur, libération du stream.

**États**
- `initializing` : "Démarrage de la caméra…" + skeleton.
- `streaming` : flux en cours.
- `detecting` : carte détectée mais pas stable.
- `stable` : prête pour capture (cadre vert, capture imminente).
- `capturing` : flash visuel + son court.
- `permission_denied` : redirige vers #31.
- `device_error` : pas de caméra → #31 avec message adapté.

**Edge cases**
- Permission révoquée pendant le scan : redirection vers #31.
- Onglet en arrière-plan : pause du stream pour économiser la batterie + reprise au retour.
- App passe en background → coupe le stream.
- Pas de caméra arrière → fallback sur la frontale.
- Image trop sombre → texte d'aide "Plus de lumière" + cadre rouge.

**A11y**
- Bouton capture manuelle accessible au clavier (espace = capture).
- Texte d'aide en `aria-live="polite"`.
- État du cadre annoncé ("Carte détectée, stable"/"Carte détectée").
- Toujours possible de basculer en saisie manuelle (échappatoire visible).

**Performance**
- Charger le modèle de détection en chunk dynamique (`import()`).
- Détection dans un Web Worker pour ne pas bloquer le main thread.
- Frame analysis throttle 300 ms.
- Capture : redimensionnement à 2048 px max sur le grand côté avant upload.

**Sécurité**
- Stream caméra jamais transmis en continu.
- Capture envoyée au backend uniquement après validation utilisateur (#30).
- Re-encodage côté serveur (sharp) pour neutraliser les payloads malveillants.
- EXIF supprimés avant stockage (vie privée : géolocalisation).
- Limite taille upload : 8 MB.

**Critères d'acceptation**
- [ ] Caméra arrière utilisée par défaut.
- [ ] Capture auto fonctionne (≤ 2 s sur carte stable).
- [ ] Flash et capture manuelle fonctionnent.
- [ ] Permission refusée → #31 sans crash.
- [ ] Pas de fuite de stream (libéré au retour).

---

## #30 — Validation post-capture (`/scan/single/review`)

**Wireframe** : scan.md #30 (cas A, B, C)

**Objectif** : présenter la carte reconnue avec un score de confiance, demander confirmation. **Jamais d'auto-validation sans tap utilisateur.**

**Données**
- Image capturée (Blob local).
- Résultat de reconnaissance backend : liste de candidats `{ cardId, confidence }` + image candidate.

**Pipeline backend**
1. Reception image + métadonnées.
2. Validation MIME + taille + redimensionnement.
3. OCR (Tesseract) sur la zone "nom" (région supérieure 5–15 % de la hauteur).
4. Lookup Scryfall : nom + set symbol éventuel.
5. Retour des 1–5 meilleurs candidats avec score.

**Interactions cas A (≥ 90 %)**
- Tap "Confirmer" → ajout direct → toast → retour `/scan` (ou `/collection` selon prefs).
- Tap "Modifier les détails" → `/add/manual/details?prefill=...`.
- Tap "Choisir une autre carte" → liste candidats (cas B).
- Tap "Reprendre la photo" → retour `/scan/single`.

**Interactions cas B (50–90 %)**
- Tap candidat → bascule en cas A pour ce candidat.
- Tap "Saisir manuellement" → `/add/manual` avec recherche pré-remplie (depuis OCR si dispo).
- Tap "Reprendre la photo" → retour viseur.

**Interactions cas C (< 50 %)**
- Tap "Reprendre la photo" → viseur.
- Tap "Saisir manuellement" → `/add/manual`.

**Validations** : score de confiance calculé côté backend, jamais "trustless" côté client.

**Edge cases**
- Carte non Magic (autre TCG) reconnue → message "Cette carte ne semble pas être Magic. Vérifiez ou saisissez manuellement".
- Carte foil reconnue : suggestion d'activer le toggle foil dans les détails.
- Carte recto-verso (DFC) reconnue : présenter les deux faces.
- Réseau échoue pendant la reconnaissance : fallback sur OCR local (moins précis) + bandeau d'info.

**A11y**
- Score de confiance lu (`aria-label="Confiance 98 pourcent"`).
- Candidats : liste accessible.
- CTAs principaux en bas, ancrés.

**Performance**
- Réponse backend cible ≤ 1.5 s p50, ≤ 3 s p95.
- Si > 3 s : "Reconnaissance en cours…" + bouton annuler.
- Optimistic UI : ne pas bloquer l'app pendant la requête.

**Critères d'acceptation**
- [ ] Aucune auto-validation sans tap.
- [ ] Comparaison visuelle capture vs candidat affichée.
- [ ] Score de confiance toujours visible.
- [ ] Échappatoire saisie manuelle visible dans tous les cas.

---

## #31 — Erreur scan (`/scan/single/error`)

**Wireframe** : scan.md #31

**Cas** : permission refusée, pas de caméra, support indisponible.

**Interactions**
- Tap "Comment activer la caméra" → bottom sheet d'instructions par OS / navigateur.
- Tap "Saisir manuellement" → `/add/manual`.

**Critères d'acceptation**
- [ ] Affiché dans tous les cas d'indisponibilité.
- [ ] Instructions claires par plateforme.
- [ ] Échappatoire toujours visible.

---

## #32 — Viseur scan lot (`/scan/batch`) — immersif

**Wireframe** : scan.md #32

**Objectif** : capturer plusieurs cartes à la suite sans interruption, mettre en file pour validation groupée.

**Différences vs scan unique**
- **Pas de validation entre chaque carte.** Reconnaissance en arrière-plan, ajout à la file.
- Compteur live "X cartes scannées".
- Feedback visuel court entre captures (toast intégré, ne bloque pas).
- Vibration tactile + son court (toggle prefs).

**Pipeline**
1. Capture (auto ou manuelle).
2. Upload + reconnaissance backend (asynchrone).
3. Carte ajoutée à la file (IndexedDB).
4. Si confiance ≥ 90 % : marquée "prête".
5. Sinon : marquée "à valider".
6. Retour caméra immédiat (pas d'écran de validation).

**Interactions**
- Tap "Voir file" → bottom sheet #33.
- Tap "Terminer" → `/scan/batch/review` (#34).
- Si scan + reconnaissance en cours et tap "Terminer" : attendre la fin de la requête en cours puis afficher review.

**États**
- `streaming` : caméra active.
- `processing` : 1+ requête en cours en arrière-plan (indicateur discret).
- `error_partial` : 1+ erreur dans la file (icône ⚠ sur l'item).

**Edge cases**
- Réseau coupé pendant le lot : reconnaissance locale (moins précise) + marquage "à valider".
- Doublons (même carte scannée 2×) : empilement + suggestion de fusion en revue.
- File saturée (> 200 cartes) : suggérer "Terminer ce lot et démarrer un nouveau".
- App fermée : file persistée, banner de reprise au retour (#35).

**A11y**
- Mode immersif compatible : tab bar masquée, bouton retour explicite.
- Compteur lu en `aria-live="polite"` ("12 cartes scannées").
- Feedback de la dernière carte ajoutée en `aria-live="polite"`.

**Performance**
- Requêtes parallèles limitées (max 3 simultanées) pour ne pas saturer le réseau.
- Compression image avant envoi.
- File en IndexedDB pour ne pas saturer la mémoire.

**Critères d'acceptation**
- [ ] Capture continue sans interruption.
- [ ] File persistée.
- [ ] Compteur exact.
- [ ] Mode hors-ligne fonctionne (reco locale).

---

## #33 — File d'attente lot (`/scan/batch/queue`) — bottom sheet

**Wireframe** : scan.md #33

**Données** : tous les items de la file (statut prête / à valider / erreur).

**Interactions**
- Tap item prêt → édition rapide (qté, état, foil, langue).
- Tap item à valider → liste de candidats inline.
- Tap ⋮ → Modifier, Supprimer de la file.
- Tap "Continuer le scan" → ferme la sheet, retour viseur.
- Tap "Terminer le lot" → `/scan/batch/review`.

**Edge cases**
- Suppression du dernier item de la file → revenir au viseur ou `/scan` ?
  - Choix : revenir au viseur, message "File vide".

**Critères d'acceptation**
- [ ] Toutes les cartes visibles.
- [ ] Édition rapide possible.
- [ ] Suppression possible.

---

## #34 — Revue de lot (`/scan/batch/review`)

**Wireframe** : scan.md #34

**Objectif** : valider et finaliser le lot avant ajout en collection.

**Données** : tous les items de la file groupés par statut.

**Interactions**
- **Section "À valider"** : chaque item résolu individuellement (choisir candidat ou saisir manuellement) avant validation globale.
- **Section "Prêtes"** : éditables individuellement, ou en bulk via menu (appliquer état/foil/langue à tout).
- **Tap "Tout supprimer"** → modale confirmation → vide la file.
- **Tap "Tout ajouter"** → modale confirmation avec récap → mutation backend → toast bilan.

**Validations**
- Au moins 1 carte prête pour activer "Tout ajouter".
- Toutes les cartes doivent avoir qté ≥ 1.

**Edge cases**
- Cartes "à valider" ignorées : option "Ajouter seulement les prêtes" + report des autres dans une nouvelle file.
- Erreur lors de l'ajout (1+ carte échoue côté serveur) : toast erreur + items restant dans la file pour retry.
- Sync hors-ligne : ajout local + queue de sync.

**A11y**
- Sections étiquetées (`<section aria-labelledby>`).
- CTAs ancrés en bas.
- Compteur récap accessible.

**Critères d'acceptation**
- [ ] Sections différenciées.
- [ ] Édition individuelle et bulk.
- [ ] Validation globale fonctionnelle.
- [ ] Bilan affiché.

---

## #35 — Reprise lot interrompu (`/scan/batch/resume`)

**Wireframe** : scan.md #35

**Composant** : banner persistant.

**Affichage** : sur `/scan` et `/collection` au premier accès si une file existe.

**Interactions**
- Tap "Reprendre" → `/scan/batch/review`.
- Tap "Abandonner" → modale confirmation → vide la file.
- Tap discret "Ne plus me proposer pour ce lot" → masque le banner pour cette session.

**Critères d'acceptation**
- [ ] Banner visible si file en attente.
- [ ] Reprise sans perte de données.
- [ ] Abandon avec confirmation.
