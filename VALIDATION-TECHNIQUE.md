# BORNEXA — Registre de validation technique (document terrain)

> **À consulter avant CHAQUE installation.** Ce document distingue ce qui est vérifié, à confirmer, ou à vérifier impérativement. Il ne remplace PAS la fiche technique + le manuel d'installation officiels de la **révision exacte** du modèle posé.
>
> **Légende confiance** : 🟢 vérifié (source primaire/normative concordante) · 🟡 à confirmer (source secondaire ou dépend du modèle/version) · 🔴 à vérifier impérativement (pas de source primaire obtenue ici).
>
> **Dernière vérification : 2026-06-06** (par recherche web ; PDF fabricants partiellement inaccessibles via l'outil — voir limites).

---

## ⚖️ RÈGLE D'OR TERRAIN
Avant le chantier, ouvrir la **fiche technique + le manuel d'installation de la révision exacte** du modèle (téléchargés depuis le site officiel du fabricant) et vérifier :
1. Détection de défaut **DC 6 mA intégrée** (RDC-DD, IEC 62955) : **oui / non** ?
2. **RCD externe** exigé par le fabricant : Type A, Type B, ou Type EV (A+6 mA) ?
3. **Disjoncteur (MCB)** recommandé : calibre + courbe.
4. **Section de câble** : à dimensionner par calcul (longueur, pose, chute de tension).

➡️ **En cas de doute : protéger PLUS, jamais moins** (Type B ou Type EV). Une protection insuffisante = refus de contrôle + risque de sécurité.

---

## 1. DIFFÉRENTIEL & DÉTECTION DC — le point le plus sensible

### 1.1 La norme (principe)
🟢 **HD/IEC 60364-7-722** : chaque point de charge doit être protégé soit par un **RCD Type B**, soit par un **RCD Type A (ou F) + un RDC-DD conforme IEC 62955** (déclenche si courant continu lisse ≥ 6 mA).
- **Pourquoi** : un courant DC lisse > 6 mA peut « aveugler » un RCD Type A. Le RDC-DD coupe avant.
- **Source** : Electrical Installation Guide (Schneider) electrical-installation.org ; IEC 62955:2018 ; synthèses VIOX.
- **Limite** : le texte intégral de **NBN HD 60364-7-722 est payant (NBN)** — je n'ai pas pu citer la clause mot pour mot. 🟡 **À confirmer** : numéro d'article exact + interprétation belge auprès de l'organisme de contrôle.

### 1.2 Par marque / modèle
| Borne | DC 6 mA intégré ? | RCD externe | Confiance | Source / réserve |
|---|---|---|---|---|
| **Tesla Wall Connector Gen 3** | Oui (protection AC+DC ground fault) | Type A suffit ; « no separate Type B RCD required » | 🟢 | Manuel install Tesla Gen 3. **Réserve** : « certaines versions régionales = Type A intégré, d'autres Type B » → 🟡 vérifier la version **EU/BE** du manuel de la révision posée |
| **Wallbox Pulsar Plus** | Oui (« integrated DC leakage protection as standard ») | Type A | 🟢 (existence) / 🟡 (valeur 6 mA exacte + « Type A externe » à confirmer datasheet) | support.wallbox.com (Product Overview). Datasheet PDF non lisible via outil |
| **Wallbox Pulsar Max** | Présumé oui (successeur Pulsar Plus) | Type A présumé | 🟡 | **À confirmer sur datasheet Pulsar Max.** ⚠️ Contradiction relevée : un résumé tiers indiquait « Pulsar Max à protéger par RCCB externe **Type B ou Type EV** » → lever l'ambiguïté sur la fiche officielle |
| **Wallbox Commander 2** | À vérifier | À vérifier | 🟡 | Datasheet Commander 2 |
| **Smappee EV Wall / Base / One** | Probable (bornes mode 3) mais **non confirmé** | À vérifier | 🔴 | Page support 403 — **à vérifier impérativement** sur le manuel Smappee EV Wall (v1.7 juin 2022 ou +) avant de défaut sur Type A |

### 1.3 Conclusion opérationnelle
- La règle BORNEXA « **Type A 30 mA dédié suffit (car RDC-DD intégré)** » est **confirmée pour Tesla Gen 3 et Wallbox Pulsar Plus**.
- Elle est **à confirmer par modèle** pour Pulsar Max, Commander 2 et **toute la gamme Smappee**.
- ➡️ Tant que la détection 6 mA intégrée n'est pas confirmée sur le **modèle exact**, prévoir **Type B ou Type EV (A+6 mA)**.
- 🟡 **Action ouverte** (déjà listée) : obtenir une **confirmation écrite** de l'acceptation « Type A + RDC-DD borne » auprès de **Vinçotte / BTV / OCB / ACEG**.

---

## 2. DISJONCTEUR (MCB)
- 🟢 Courants : 7,4 kW mono = **32 A** · 11 kW tri = **16 A/phase** · 22 kW tri = **32 A/phase** (P/U).
- 🟡 **Calibre exact** : doit être ≥ courant de charge réel et ≤ capacité du câble ; **dépend du réglage du courant max de la borne et de la prescription fabricant**. En pratique : C32 ou C40 pour 32 A, C16 ou C20 pour 16 A. **À aligner sur le manuel de la borne** (et le courant max configuré).
- 🟢 Courbe **C** (standard EVSE), circuit **dédié** obligatoire.
- ⚠️ Cohérence interne : le standard projet utilise C32 (7,4) / C20 (11) / C32 (22). Le débat C32 vs C40 sur charge continue 32 A reste 🟡 → trancher selon fabricant + RGIE.

## 3. CÂBLE / SECTION
- 🟡 Les valeurs 3G6 / 3G10 / 5G6 / 5G10 / 5G16 sont **indicatives**. La section réelle = **calcul** selon longueur, mode de pose, température ambiante, groupement et **chute de tension** (RGIE : limite ~5 %). Ne pas traiter comme une table figée.

## 4. COMPTEUR NUMÉRIQUE & PORT P1
- 🟢 P1 = port RJ12 du compteur digital ; données temps réel conso + injection.
- 🟢 Activation **gratuite** via Mijn Fluvius / Sibelga, **à distance, max 24 h** (source Fluvius). À faire **avant** le chantier.
- 🟡 Sans compteur digital → pas de P1 → fallback CT clamps (Wallbox Power Boost CT / Smappee Genius).

## 5. LOAD BALANCING & PHOTOVOLTAÏQUE
- 🟢 **Wallbox** : Power Boost (load balancing dynamique) + Eco-Smart (recharge surplus PV) via module de mesure (P1 belge `WALL-MTR-P1PORT`, MID, ou CT). 🟡 Module exact selon modèle/place DIN → vérifier.
- 🟢 **Smappee** : Connect (P1) / Genius (P1 + CT).
- 🟢 **Tesla Gen 3** : **pas** de load balancing maison ni surplus PV natif sans **Powerwall** ; Power Sharing uniquement entre Wall Connectors Tesla. ➡️ Si client veut LB/PV → proposer Wallbox/Smappee (honnêteté maintenue).

## 6. BATTERIES DOMESTIQUES
- 🟡 Powerwall + Tesla = intégration native. Autres batteries (Sonnen, etc.) → configuration **selon le système** ; pas d'affirmation absolue → évaluer cas par cas avec la doc du fabricant batterie.

## 7. RGIE / CONTRÔLE
- 🟢 **Circuit dédié** obligatoire pour la borne (MCB + différentiel propres, non partagés).
- 🟢 **Nouveau RGIE belge** en vigueur depuis **01/06/2020** (Livres 1-2-3). 🟡 Confirmer l'article applicable à l'EVSE.
- 🟡 **Organismes** (Vinçotte, BTV, OCB, ACEG) : interprétations possibles sur Type A vs Type B → confirmation écrite recommandée (cf §1.3).

---

## ⚠️ LIMITES DE CETTE VÉRIFICATION (honnêteté)
- Texte intégral **NBN HD 60364-7-722** : **payant**, non cité ici → à acheter/consulter pour la formulation exacte.
- **PDF fabricants** (Wallbox Pulsar Max datasheet, Tesla manuel, Smappee manuel) : **non extractibles** via l'outil au moment de la vérification (binaire / 403 / 404). Les conclusions par modèle s'appuient sur les pages support HTML + résumés ; **à reconfirmer sur les PDF officiels téléchargés**.
- Les recommandations fabricants **évoluent par révision** : revérifier à chaque nouvelle version de borne/firmware.

## ✅ CHECKLIST DE VÉRIFICATION PRÉ-CHANTIER (à cocher)
- [ ] Datasheet + manuel de la **révision exacte** du modèle téléchargés (site officiel).
- [ ] DC 6 mA intégré confirmé ? Sinon → Type B / Type EV.
- [ ] RCD externe = celui exigé par le fabricant.
- [ ] MCB = calibre/courbe selon fabricant + courant max configuré.
- [ ] Section câble = calculée (longueur, pose, chute de tension).
- [ ] Circuit dédié.
- [ ] P1 activé par le client (si LB/PV).
- [ ] (Une fois obtenue) Confirmation écrite organisme sur Type A + RDC-DD.

---

## SOURCES CONSULTÉES (2026-06-06)
- Schneider — Electrical Installation Guide : EV charging electrical design (electrical-installation.org)
- IEC 62955:2018 (RDC-DD mode 3) — references via GlobalSpec / VIOX / ivy-metering
- Wallbox — Pulsar Plus Product Overview (support.wallbox.com) : « integrated DC leakage protection as standard »
- Wallbox — Pulsar Max / Pulsar Plus Technical Datasheets (support.wallbox.com, PDF — à reconfirmer)
- Tesla — Gen 3 Wall Connector Installation Manual (energylibrary.tesla.com) : protection AC+DC intégrée, pas de Type B séparé requis
- Smappee — EV Wall Installation & Product Manual v1.7 (smappee.com, PDF — à reconfirmer)
- Fluvius — activation port P1 (mijn.fluvius.be)

*Document interne BORNEXA — mettre à jour à chaque revérification des datasheets.*
