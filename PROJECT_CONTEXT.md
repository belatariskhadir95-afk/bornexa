# BORNEXA — PROJECT CONTEXT

> **Dernière mise à jour : 2026-06-06**
> **Document de référence** pour reprendre le projet dans une nouvelle conversation sans relire l'historique. Contient l'état actuel exact, les décisions techniques prises, et les tâches restantes.

---

## 1. IDENTITÉ ENTREPRISE

| Champ | Valeur |
|---|---|
| Nom | **BORNEXA** |
| Activité | Installation de bornes de recharge EV en Belgique |
| Statut | **Indépendant en pré-lancement** — pas de clients payants, pas encore de N° TVA / BCE actif |
| Fondateur | Belkounani (sole installer & gérant) |
| Adresse | Boortmeerbeek (3190), Vlaams-Brabant, Belgique |
| Zone de service | Vlaams-Brabant + Brussels-Hoofdstedelijk Gewest + communes périphériques (Antwerpen / Hageland) |
| Téléphone | +32 489 24 77 60 |
| Email | info@bornexa.be |
| Site | https://www.bornexa.be (hébergé Netlify) |
| Google Verif | vaBOBaByUVtfU0nOj07FMVp8yHqM8rzjvj9j3eEwIp0 |

### Certifications officielles (validées par l'utilisateur)
- **Tesla Wall Connector Installer**
- **Wallbox Certified Partner / Official Partner**
- **Smappee Certified EV Installer**

### Email contact utilisateur (gérant du projet)
- belkounani@gmail.com

---

## 2. SERVICES PROPOSÉS

### Installation résidentielle
- Wallbox / Tesla / Smappee
- Monophasé 7,4 kW (32 A)
- Triphasé 11 kW (16 A par phase)
- Triphasé 22 kW (32 A par phase)

### Installation business / B2B
- Borne unique entreprise
- Multi-bornes (avec load balancing)
- Smappee Infinity pour fleet
- OCPP, facturation par utilisateur

### Tout devis inclut systématiquement
- ✅ Plan électrique fourni
- ✅ AREI / RGIE keuringsattest
- ✅ Mise en service + configuration app
- ✅ Smart charging (si borne le supporte)
- ✅ Garantie installation BORNEXA **2 ans**
- ✅ Garantie constructeur (jusqu'à 5 ans Wallbox)
- ✅ Notification Fluvius/Sibelga si requise

### Hors devis (à mentionner explicitement)
- ❌ Travaux de tranchée (sleuf)
- ❌ Démontage / cloison / peinture
- ❌ Coût de raccordement Fluvius/Sibelga en cas de verzwaring
- ❌ Activation port P1 (le client le fait via Mijn Fluvius — 2 min)

---

## 3. MARQUES & MODÈLES INSTALLÉS

> BORNEXA ne propose **que** ces 3 marques. Aucune autre.

### Wallbox
- **Pulsar Plus** (résidentiel)
- **Pulsar Max** (résidentiel premium — modèle standard BORNEXA)
- **Commander 2** (résidentiel haut de gamme, écran tactile)
- Tous avec RDC-DD intégré (IEC 62955)

### Tesla
- **Wall Connector Gen 3** (uniquement — pas le Gen 2 obsolète)
- RDC-DD intégré IEC 62955

### Smappee
- **EV Wall** (mural)
- **EV Base** (poteau / pied)
- **EV One** (compact)
- **EV Ultra** (haute puissance)
- **Infinity** (système central B2B)
- Tous avec RDC-DD intégré IEC 62955

### Marques explicitement REFUSÉES au lancement
- Easee (procédure suédoise 2023 non levée)
- V2C, Autel
- Marques chinoises sans support belge

---

## 4. TARIFICATION

### Fourchettes prix all-in TVA 6% (annoncées sur le site)
- **Wallbox** : €1.100 – €1.900
- **Tesla** : €1.100 – €1.700
- **Smappee** : €1.300 – €2.100

### Logique de calcul (calculateur interne)
- **Marge matériel** : ×1,45 (≈31% sur prix vente) — STANDARD installateur
- **Marge main d'œuvre** : ×1,00 (RETIRÉE — tarif horaire = prix de vente final, transparent)
- **Tarif horaire MO** : €110/h HT (prix de vente final, plus de marge multiplicative)
- **Heures base** : 4,5 h (était 3,5 h — ajusté à la réalité terrain)
- **Suppléments** :
  - +1 h si triphasé
  - +1 h si câble > 20 m
  - +1,5 h si doorvoer complexe (sleuf, façade)
  - +0,75 h si doorvoer moyen (boring, plafond)
  - +1 h si load balancing/PV (config module)
  - +1 h si 2e EV anticipé (précâblage Power Sharing)
- **AREI keuring** : €160 forfait
- **Déplacement** :
  - 0–25 km : €0
  - 25–50 km : €30
  - 50–75 km : €60
  - >75 km : €95

### TVA
- **6%** sous conditions strictes : logement ≥10 ans + hoofdverblijfplaats + erkend installateur + installé in/aan het gebouw
- **21%** sinon (logement neuf < 10 ans, garage isolé, etc.)

---

## 5. DÉCISIONS TECHNIQUES PRISES (CRITIQUES)

### 5.1 Protections électriques — Standard NBN HD 60364-7-722

**Différentiel par défaut : Type A 30 mA** (PAS Type B)

Justification :
- Les 3 marques BORNEXA (Wallbox / Tesla / Smappee) ont **toutes** un RDC-DD intégré conforme **IEC 62955**
- NBN HD 60364-7-722 reconnaît explicitement la solution Type A 30 mA + RDC-DD borne comme équivalente à Type B
- Type B = sur-protection avec surcoût €100-150 sans bénéfice technique
- Type B installé **uniquement sur demande explicite client** (case à cocher dans calculateur), avec disclaimer écrit

### 5.2 Section câble selon puissance & longueur
| Configuration | ≤ 20 m | > 20 m |
|---|---|---|
| Mono 7,4 kW | 3G6 | 3G10 |
| Tri 11 kW | 5G6 | 5G10 |
| Tri 22 kW | 5G10 | 5G16 |

### 5.3 Disjoncteur courbe C
- 7,4 kW mono → C32 mono
- 11 kW tri → C20 tri
- 22 kW tri → C32 tri

### 5.4 Options techniques disponibles
- **Parafoudre Type 2** (NBN HD 60364-5-534) — upsell zones à risque keraunique
- **Coffret divisionnaire** dédié — si sub-tableau nécessaire

---

## 6. MODULES LOAD BALANCING & RECHARGE SOLAIRE

> **Verdict 2026-06-05** : Wallbox + WALL-MTR-P1PORT et Smappee + Connect sont **équivalents** sur le marché belge. Tesla = exception (pas natif).

### 6.1 Wallbox
| Module | Référence | Rôle | Prix achat estimé 🟡 |
|---|---|---|---|
| **Wallbox P1 module** ⭐ standard BE | `WALL-MTR-P1PORT` | Lit P1 belge, RS485 vers borne, 1 DIN | ~€170 |
| Wallbox Power Meter MID 1P | — | Mesure MID, 1-2 DIN, Wi-Fi vers borne | ~€165 |
| Wallbox Power Meter MID 3P | — | Idem triphasé, 3-4 DIN | ~€250 |
| Wallbox Power Boost CT clamps | — | Alternative si pas place DIN | ~€185 |

**Fonctions actives** quand un de ces modules est installé :
- **Power Boost** = load balancing dynamique
- **Eco-Smart** = recharge surplus PV (3 modes : Eco, Full Solar, Smart)

### 6.2 Tesla — ATTENTION
- **Aucun support P1 belge natif**
- Power Sharing existe MAIS uniquement entre plusieurs Wall Connectors Tesla (pas avec conso maison)
- Pour surplus solaire + load balancing maison → nécessite **Tesla Powerwall** (€8.000-€15.000)
- **Décision BORNEXA** : si client veut LB/PV → proposer Wallbox+P1 ou Smappee+Connect à la place. Dire honnêtement la limitation Tesla.

### 6.3 Smappee
| Module | Rôle | Prix achat estimé 🟡 |
|---|---|---|
| **Smappee Connect** ⭐ | Passerelle P1 Wi-Fi → cloud → borne | ~€200 |
| Smappee Genius | P1 + CT clamps + multi-borne | ~€330 |
| Smappee Infinity | B2B système central multi-bornes | ~€650 |

**Avantages Smappee** :
- HQ belge à Harelbeke, support FR/NL natif
- Compatibilité avec tous onduleurs PV (mesure au compteur)
- Installation Connect : 5-10 min

### 6.4 Logique auto-suggestion dans le calculateur
Quand l'utilisateur coche "Load balancing dynamique maison" OU "Recharge surplus solaire" :
- **Wallbox** → `WB-P1` (WALL-MTR-P1PORT) ajouté + 1 h MO
- **Smappee** → `SM-CONNECT` ajouté + 0,5 h MO
- **Tesla** → AUCUN module ajouté + **risque affiché** : « Tesla Wall Connector seul ne gère pas le load balancing maison ni surplus PV. Proposer Wallbox ou Smappee à la place. »

### 6.5 Port P1 (compteur digital Fluvius/Sibelga)
- Le port P1 (prise RJ12) doit être **activé** par le client via Mijn Fluvius / Mon Sibelga (gratuit, 2-5 min, max 24h pour activation)
- BORNEXA montre la procédure pendant la visite si pas fait
- Sans P1 activé : la borne ne reçoit pas les données → fallback CT clamps ou MID
- Sans compteur digital (5% cas) → fallback Wallbox MID/CT ou Smappee Genius

---

## 7. OUTILS BORNEXA (3 tools HTML, tous internes — noindex)

### 7.1 `visite-terrain.html` (55 KB) — Tablette chantier
**URL prod** : `bornexa.be/visite` ou `bornexa.be/visite-terrain`

7 étapes mobile-first :
1. **Client** : Nom, tel, email, adresse, type particulier/bedrijf, bouwjaar (TVA check), canal contact préféré (Tel/WhatsApp/Email/SMS)
2. **Installation** : Phase (mono/tri), ampère, digital meter Ja/Nee, port P1 (Ja/Te activeren/Nee), DSO (Fluvius/Sibelga), verzwaring, **parafoudre existant**, **marque meter** (Sagemcom/Iskra/Siemens), **place DIN libre** (3+/1-2/0)
3. **Placement** : Lieu (garage/oprit/carport/parking), longueur câble, doorvoer (eenvoudig/gemiddeld/complex), **WiFi signal à l'emplacement borne**, note placement, distance déplacement
4. **Photos** : 6 photos camera native (tableau, compteur, emplacement, passage câble, façade, connexions)
5. **Véhicule** : Marque, modèle, batterie kWh, AC max (3.7/7.4/11/22 kW), **panneaux solaires** (Ja/Binnenkort/Nee), **marque onduleur PV** (Fronius/SMA/SolarEdge/Huawei/Enphase/...), **puissance kWp**, **batterie domestique** (Powerwall/Sonnen/Autre/Aucune), **2e EV anticipé sous 24m**
6. **Besoins** : Multi-select (Eenvoudig/Smart charging/Solar integration/Load balancing/RFID/Reporting/V2H), marque borne préférée, timing
7. **Synthèse + Export** : Récap visible + JSON export (presse-papier / fichier / email vers info@bornexa.be)

**Aide phrases NL** : encadrés `data-toggle="hint"` à chaque étape avec phrases prêtes à dire en NL + traduction FR (le gérant n'est pas NL natif).

**Bilingue NL/FR** : toggle dans topbar, localStorage `bornexa-lang`.

**Persistence** : `localStorage.bornexa-visite-v1` (form + step + photos taken + startTime).

### 7.2 `calculateur-interne.html` (~68 KB) — Devis bureau
**URL prod** : `bornexa.be/calc` ou `bornexa.be/calculateur-interne`

3 onglets :
- **Calcul** : Dimensionnement temps réel + risques détectés + argumentaire commercial
- **Devis** : Document A4 imprimable (PDF via Ctrl+P) — bilingue NL/FR toggle séparé
- **Tarifs** : Catalogue éditable avec migration auto (préserve customisations)

**Sidebar (saisie)** :
- Client (nom, adresse, tel, email, type, bouwjaar)
- Installation (phase, ampère, meter digital, P1, DSO, verzwaring)
- Placement (lieu, longueur, route, note, distance)
- Véhicule (marque, modèle, batterie, AC max)
- Préférences (marque borne, besoins multi-select)
- **Options techniques** (checkboxes) :
  - Diff. Type B sur demande client uniquement
  - Parafoudre Type 2
  - Coffret divisionnaire dédié
- **Smart energy (load balancing & PV)** (checkboxes) :
  - Load balancing dynamique maison (auto-suggère module selon marque)
  - Recharge surplus solaire
  - 2e EV anticipé sous 24 mois

**Imports/Exports** :
- Import JSON depuis visite-terrain (auto-mapping)
- Export CSV (Excel)
- Export JSON (archivage)
- Export PDF (impression A4 native navigateur)

**Devis bilingue** :
- Toggle `📄 Devis : FR` ↔ `📄 Offerte : NL` dans toolbar onglet Devis
- Auto-détection langue depuis JSON visite importé
- Toutes les chaînes ont 2 versions (FR / NL) : DEVIS/OFFERTE, conditions, signatures, dates, etc.

**Section "INCLUS DANS L'OFFRE"** (ajout 2026-06-06) : bloc vert à cases ✓ généré dynamiquement, bilingue, placé entre l'objet et le tableau de prix. Rend visibles toutes les prestations comprises (config app, compte, mise en service, explications, tests, garantie + LB/P1/PV/options selon sélection). Voir Phase 8.

**Migration automatique tarifs** : si saved tariffs manquent un item de DEFAULT_TARIFS, il est ajouté sans perdre les customisations utilisateur. Bug fix appliqué 2026-06-05 pour le module WB-P1 manquant.

### 7.3 Catalogue calculateur (références)
**Bornes** (9 refs) :
- `WB-PM-1.2`, `WB-PM-3`, `WB-PM-22`, `WB-CM2`
- `TS-WC3-11`, `TS-WC3-22`
- `SM-EVB-11`, `SM-EVW-11`, `SM-EVB-22`

**Câbles** (5 refs) : `3G6`, `3G10`, `5G6`, `5G10`, `5G16`

**Protections + accessoires** (18 refs) :
- Différentiels : `DIF-A-40` (€65), `DIF-A-63` (€110), `DIF-B-40` (€185), `DIF-B-63` (€230)
- Disjoncteurs : `DIS-C16`, `DIS-C20`, `DIS-C32`
- Accessoires : `UTP`, `DIV`, `PLAN`
- Options : `SUR-T2` (Parafoudre Type 2, €95), `SUB-COFF` (Coffret divisionnaire, €85)
- **Modules smart energy** : `WB-P1` (€170), `WB-MID-1P` (€165), `WB-MID-3P` (€250), `WB-CT` (€185), `SM-CONNECT` (€200), `SM-GENIUS` (€330), `SM-INFINITY` (€650)

⚠️ **Tous prix achat estimés 🟡** — à valider quand BORNEXA obtient son N° TVA et accès distributeurs.

### 7.4 `chantier-installation.html` (v2.0) — ✅ CRÉÉ & ENRICHI (Phase 9, 2026-06-06)
Outil tablette pour usage **pendant** l'installation. Fonctionnel :
- **Bilingue NL/FR** (toggle topbar, `bornexa-lang`, défaut NL) — tout le contenu (titres, items, tips, phrases client) en `{nl,fr}`
- **Import JSON devis** : pré-sélectionne la marque + affiche une carte contexte (borne, kW, câble, disjoncteur, différentiel, module smart, flags LB/PV)
- **Phase 0 GO/NO-GO sécurité** (gate rouge) : terre conforme, différentiel principal coupé, matériel vs devis, type réseau confirmé… « un seul NO-GO = ne pas démarrer »
- Checklist dynamique par marque (Wallbox / Tesla / Smappee), photos + notes par item
- **Mesures & contrôles RGIE structurés** : inputs numériques avec badge OK/NIET auto (terre < 100 Ω, RCD ≤ 30 mA, RCD < 300 ms, continuité PE < 2 Ω, tension info)
- Récap + export JSON `bornexa-chantier-v2` (contexte devis + mesures + phases)
- Calibre disjoncteur corrigé : C32 mono 7,4 / C20 tri 11 / C32 tri 22 (était C16 erroné)

---

## 8. ARCHITECTURE SITE (≈65 fichiers HTML)

### 8.1 Core (10 pages)
- `index.html`, `services.html`, `contact.html`, `devis.html`, `faq.html`, `blog.html`, `over-bornexa.html`, `garantie-sav.html`, `privacy.html`, `algemene-voorwaarden.html`

### 8.2 Outils SEO publics (2)
- `simulator.html` (épargnes EV vs essence — `hidden`/`aria-hidden` pour contenu bilingue inline)
- `comparateur.html` (Tesla/Wallbox/Smappee + section LB/PV ajoutée 2026-06-05)

### 8.3 Hub régions (1)
- `regios.html` (NL+FR, 34 communes listées avec codes postaux)

### 8.4 Pages marques (3)
- `tesla.html` (avec section "Eerlijk over Tesla" — limitations LB/PV)
- `wallbox.html` (avec section P1 vs MID)
- `smappee.html` (avec section Connect / Genius / Infinity)

### 8.5 Pages locales NL Vlaams-Brabant + Antwerpen (22)
laadpaal- : boortmeerbeek, mechelen, leuven, bruxelles, zemst, haacht, kampenhout, keerbergen, tremelo, rotselaar, vilvoorde, lier, aarschot, bonheiden, sint-katelijne-waver, diest, overijse, herent, holsbeek, begijnendijk, tervuren, tesla-model-y, tesla-model-3

### 8.6 Pages locales FR Bruxelles + périphérie (13)
borne-recharge- : uccle, auderghem, woluwe-saint-pierre, woluwe-saint-lambert, ixelles, etterbeek, watermael-boitsfort, wezembeek-oppem, kraainem, saint-gilles, schaerbeek, forest, jette

### 8.7 Guides (2)
- `fluvius-premie-laadpaal.html` (NL+FR) — pas de prime Fluvius en 2026
- `prime-borne-recharge-bruxelles.html` (FR+NL) — Sibelga vs Fluvius

### 8.8 Blog articles (9)
| Slug | Date | Thème |
|---|---|---|
| `blog-tesla` | 2026-05-14 | Tesla Wall Connector vs autres |
| `blog-solar` | 2026-05-14 | Smart charging + zonnepanelen |
| `blog-economie` | 2026-05-14 | EV vs essence économies |
| `blog-business` | 2026-06-02 | B2B installation |
| `blog-appartement` | 2026-06-02 | VME / copropriété 2026 |
| `blog-securite-installation` | 2026-06-03 | Sécurité installation |
| `blog-couts-laadpaal-2026` | 2026-06-03 | Coûts laadpaal 2026 |
| `blog-type-a-type-b-differentiel` | 2026-06-04 | Type A vs Type B + NBN HD 60364-7-722 |
| `blog-recharge-solaire-load-balancing` | 2026-06-05 | LB/PV + WALL-MTR-P1PORT |

### 8.9 Outils internes noindex (2 actifs + 1 à créer)
- `visite-terrain.html` (actif, X-Robots-Tag noindex)
- `calculateur-interne.html` (actif, X-Robots-Tag noindex)
- `chantier.html` (à créer, sera noindex)

### 8.10 Fichiers infrastructure
- `sitemap.xml` (61 URLs avec hreflang + `<image:image>` sur 14 entrées)
- `robots.txt` (Disallow internal tools + print pages)
- `_redirects` (Netlify pretty URLs)
- `_headers` (CSP, X-Robots-Tag noindex tools, X-Frame DENY, HSTS, etc.)
- `feed.xml` (RSS 9 articles)
- `llms.txt` (résumé GEO/IA — pour ChatGPT/Claude/Perplexity)
- `manifest.json` (PWA, PNG icons 192/512/512-maskable)
- `netlify.toml` (`[build] publish = "."`)
- `images/` : favicon.svg, logos SVG, 5 OG images JPEG, 3 PNG icons

---

## 9. INFRASTRUCTURE TECHNIQUE

### Hébergement
- **Netlify** (statique, Forms, redirects, headers)
- Domain : `bornexa.be` + `www.bornexa.be`

### Bilingue NL/FR
- **Langue par défaut** : néerlandais (NL)
- `js/translations.js` : ~80 KB, 575 clés NL = 575 clés FR (parité parfaite)
- `js/lang.js` : MutationObserver sur `<html lang>`, swap data-key/data-nl/data-fr
- `js/main.js` (v=2026-06-05) : nav, mobile menu, FAQ, **idempotent injection** Simulator/Comparateur (skip si déjà en HTML)

### Cache busting
- CSS : `?v=2026-06-03b`
- JS main : `?v=2026-06-05`
- `_headers` : `Cache-Control: public, max-age=31536000, immutable` sur `/css/`, `/js/`, `/images/`
- HTML : `Cache-Control: public, max-age=3600, must-revalidate`

### Sécurité (_headers)
- `Content-Security-Policy` avec `report-uri /.netlify/functions/csp-report`
- `Report-To` header
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` sur tools internes

### Formulaires
- `devis.html` → Netlify Forms + EmailJS (template `template_trlr0zo` NL / `template_8dpqasa` FR, service `service_jnr5z6q`)
- `contact.html` → Netlify Forms

### Schema.org (omniprésent)
- LocalBusiness + ElectricalContractor (@id `#business`) sur index
- Person (@id `#founder`) sur index — Belkounani
- WebSite, BreadcrumbList sur toutes pages
- FAQPage sur faq, articles blog, pages locales
- Service avec offers/AggregateOffer/priceSpecification sur pages locales + marques
- HowTo sur services (5 étapes install)
- BlogPosting sur articles blog
- CollectionPage sur regios.html
- speakable sur faq.html

### Hreflang
- `nl` / `fr` / `x-default` sur **toutes** les pages
- Sitemap.xml inclut alternates pour chaque URL

---

## 10. CONVENTIONS GRAPHIQUES

### Palette
| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#00C896` | Vert turquoise BORNEXA (signature) |
| `--primary-dark` | `#009E76` | Hover, CTA dark |
| `--primary-light` | `#E0FBF4` | Backgrounds subtils |
| Dark navy | `#0B1E3C` | Logo background |
| `--dark` | `#0C1018` | UI dark sections |
| `--bg` | `#F6F8FB` | App background |
| `--text` | `#111827` | Texte principal |
| `--text-muted` | `#6B7280` | Texte secondaire |
| `--border` | `#E5E7EB` | Bordures cards |

### Logo
- Hexagone gradient `#1ADBA8 → #009E76`
- Éclair blanc centré
- Wordmark "BORNEXA"
- Tagline "LAADPAAL INSTALLATEUR"

### Typography
- **System fonts** (`-apple-system, Segoe UI, system-ui, Roboto, ...`) — pas de Google Fonts

### Border radius
- 8 / 14 / 20 / 28 / 999px (échelle ascendante)

### Shadow signature
- `0 8px 32px rgba(0,200,150,.25)` (halo vert primary sur boutons CTA)

### Mobile
- Mobile-first responsive
- Sticky CTA mobile sur certaines pages (form devis)
- Nav-mobile avec hamburger
- PWA manifest installable

---

## 11. POSITIONNEMENT COMMERCIAL

### Premium honnête, pas low-cost
- **Pas le moins cher** sur le marché
- Mais **transparent** : catalogue tarifs accessible, conditions claires
- **Pas de rabais cosmétiques** type "20% jusqu'à fin février" (comportement concurrent OCA Energy à éviter)
- **Prix fixe = prix payé** (aucun supplément caché)

### Points forts à mettre en avant
1. **Triple certification** Tesla + Wallbox + Smappee (rare en BE)
2. **Belkounani sur chantier** — pas de sous-traitance
3. **Protection DC 6 mA intégrée + Type A 30 mA dédié** (conforme NBN HD 60364-7-722) — pas de surcoût Type B inutile
4. **AREI/RGIE keuringsattest** livré systématiquement
5. **2 ans garantie installation** + garantie constructeur
6. **Plan électrique fourni** avant intervention
7. **Bilingue NL/FR** natif

### Pièges commerciaux à éviter (auto-discipline)
- ❌ Pas de stats inventées ("30% de nos installations à Uccle") — formulation descriptive
- ❌ Pas de témoignages tant qu'il n'y a pas de vrais clients
- ❌ Pas de mention de prime Fluvius (supprimée pour particuliers depuis 2024)
- ❌ Pas de promesse de délai garantie sans capacité réelle de tenir
- ❌ Pas de "Type B obligatoire" — c'est techniquement faux pour les bornes BORNEXA
- ❌ Pas de proposer Tesla pour client voulant LB/PV sans Powerwall

### Recommandation par scénario client
| Scénario | Recommandation |
|---|---|
| Mono 7,4 kW basique | Wallbox Pulsar Max 1.2 (sans module) |
| Mono + PV + load balancing | Wallbox + WALL-MTR-P1PORT |
| Tri 11 kW + PV + load balancing | Wallbox Pulsar Max 3P + WALL-MTR-P1PORT OU Smappee EV Wall + Connect |
| Tesla owner sans Powerwall + veut LB/PV | **Smappee EV Wall + Connect** (PAS Tesla) |
| Tesla owner avec Powerwall | Tesla Wall Connector Gen 3 |
| 2e EV sous 24 mois | Wallbox Pulsar Max + précâblage 5G10 |
| Entreprise multi-bornes 5+ | Smappee Infinity B2B |

---

## 12. AUDITS DÉJÀ RÉALISÉS (chronologie)

| Date | Audit | Findings principaux |
|---|---|---|
| 2026-05-30 | Conformité légale + véracité | 17 pages locales nettoyées de stats inventées, loi VME 2018 corrigée |
| 2026-05-31 | Accessibilité SVG WCAG | 462 SVG décoratifs marqués aria-hidden |
| 2026-06-03 | SEO + Conversion + Technique + GBP | 50 améliorations classées impact/difficulté |
| 2026-06-03 | Traductions NL/FR complètes | 13 critiques + 11 importantes : schemas FR sans accents, footer Brabant flamand, aria-labels, placeholders |
| 2026-06-05 | Protections électriques (Wallbox/Tesla/Smappee × NBN/IEC 62955) | Type A 30 mA + RDC-DD = standard ; Type B = sur-protection optionnelle |
| 2026-06-05 | Tool Devis + Tool Visite + tarification | Marge MO retirée, heures base ajustées 4,5 h, parafoudre + sub-coffret + 7 modules smart energy ajoutés |
| 2026-06-05 | Étude load balancing + PV par marque | Wallbox WALL-MTR-P1PORT révélé, verdict révisé : Wallbox = Smappee équivalents BE |
| 2026-06-06 | Visibilité Tool Devis (incident client réel) | Section "Inclus dans l'offre" dynamique + label client modules + fix cause racine double-source LB/PV (besoins client ≠ smart energy) |

---

## 13. ERREURS CORRIGÉES (récap exhaustif)

### Phase 1 (conformité légale)
- Loi VME : "Sinds 2024" → "loi du 18 juin 2018"
- Déduction fiscale 200% nuancée (dégressif depuis 2023)
- "Tax shelter" → "déduction fiscale renforcée"
- 17 pages locales : stats inventées → formulation descriptive

### Phase 2 (techniques bornes)
- Eco-Smart Wallbox : mention Power Boost nécessaire ajoutée
- Prix Wallbox/Tesla sous-évalués → "Prix sur demande" / fourchettes réalistes
- Fourchette Fluvius vague → "selon situation, déterminé par Fluvius"
- Garantie Wallbox uniforme → "2 à 3 ans selon modèle"

### Phase 3 (SEO + structure)
- Sitemap : 24 hreflang cassés (`/=fr`, `/=nl`) → reconstruit propre
- og:image SVG → JPEG sur 32 pages
- Manifest PWA : SVG only → 3 PNG icons générés (192/512/512-maskable)
- addressRegion incohérent → uniformisé `Vlaams-Brabant`
- areaServed pollué (Boortmeerbeek/Keerbergen/Haacht/Leuven sur pages Bruxelles)
- 78 faux toponymes `Xbos` (Forestbos, Ucclebos, etc.) purgés
- meta keywords mix NL+FR → purgés (53 fichiers)
- /contact vs /devis cannibalisation → différenciés (badge, H1, OG)
- /devis : téléphone visible (hero + sticky bar)
- llms.txt créé (GEO/IA)
- feed.xml créé (RSS 9 articles)
- regios.html créé (hub bilingue 34 communes)
- robots.txt + _headers : protection tools internes

### Phase 4 (traductions NL/FR)
- 13 fichiers FR : Schema Service sans accents → corrigés
- 13 fichiers FR : LocalBusiness description en NL → corrigée FR
- "Officiele" → "Officiële" sur 62 fichiers + translations.js
- Footer fallback "Brabant flamand en Brussel" (mix) → corrigé pur NL ou FR selon page
- og:locale `fr_BE` sur page NL `laadpaal-bruxelles` → `nl_BE` + alternate `fr_BE`
- og:image SVG → JPEG sur 32 pages
- aria-labels `Hoofdnavigatie/Mobiel menu/Menu openen` traduits sur 14 pages FR
- Service `serviceType` en FR sur pages NL → traduit NL
- contact.html placeholder f-email bilingualisé
- simulator.html : ajout `lang="nl"`/`lang="fr"` + `hidden` + `aria-hidden` sur conteneurs

### Phase 5 (protections électriques)
- Type B obsolète → Type A 30 mA + RDC-DD borne (IEC 62955)
- blog-securite-installation.html : Schema FAQ + body NL/FR + FAQ visible réécrits
- services.html : Schema HowTo mis à jour
- over-bornexa.html : body NL/FR
- index.html : Schema knowsAbout
- llms.txt ligne 15
- blog-couts-laadpaal-2026.html : composition prix
- calculateur-interne.html : DEFAULT_TARIFS, computeDimensioning, argumentaire, objectStr
- blog-type-a-type-b-differentiel.html créé

### Phase 6 (load balancing & PV)
- Catalogue calculateur : 7 modules smart energy ajoutés
- 3 checkboxes Options techniques ajoutées (LB / Solar / 2e EV)
- Auto-suggestion logique selon marque
- Risque contextuel Tesla affiché si LB/PV cochés
- Tool Visite : 5 nouveaux champs (meter brand, DIN space, PV inverter, kWp, batterie domestique)
- 3 phrases NL d'aide ajoutées (P1 Mijn Fluvius, onduleur, batterie)
- Pages site : wallbox/tesla/smappee/services/comparateur sections LB/PV
- blog-recharge-solaire-load-balancing.html créé

### Phase 7 (bug fixes finaux)
- Nav : "Comparatif × 2" sur simulator → main.js idempotent
- Calculateur : page blanche à l'impression → CSS print fix (`#tab-calc, #tab-tarifs` masqués, `#tab-devis` forcé)
- Calculateur : module WB-P1 manquant dans devis → migration auto localStorage dans `loadState()`

### Phase 10 (audit total site — corrections urgentes Bloc 1 — 2026-06-06)
Suite à l'audit total. Corrections appliquées :
- **Sitemap** : doublon `blog-recharge-solaire-load-balancing` supprimé ; **`borne-entreprise` ajouté** (était absent).
- **`borne-entreprise`** (était page orpheline) : ajoutée à `_redirects` (URL propre + alias), `llms.txt`, et **2 liens entrants en contenu** (services.html bloc B2B + sidebar blog-business.html repointée).
- **`sameAs` Facebook/LinkedIn retiré** de `index.html` (profils inexistants → évite pointer vers 404). À rajouter quand les profils existeront.
- **Analytics GA4 + bannière de consentement RGPD** (load-on-consent, bilingue) ajoutée dans `js/main.js` (chargé partout). **⚠️ INERTE tant que `GA_ID` = `'G-XXXXXXXXXX'`** : remplacer par le vrai ID GA4 dans `js/main.js` pour activer. CSP `_headers` étendue (connect-src GA4). Cache-buster `main.js?v=2026-06-06` bumpé sur 66 fichiers HTML.
### Phase 16 (correction régression — couche dossier partagée « Option A » — 2026-06-06)
**Contexte / incident** : la Phase 15 (`bornexa-workflow.html`, monolithe condensé) a provoqué une **régression** : perte de la gestion des tarifs, devis sans signatures/validité/objet/émetteur/footer, impression blanche, checklist chantier réduite (~50→9), pas de plan de position/annotation ni d'alertes de conformité, pas de téléchargements SVG/PNG, phrases-conseils visite disparues. Demande explicite de l'utilisateur : **« garder tout ce qui fonctionnait bien et centraliser les outils »** — une **évolution**, pas une simplification. Décision : **Option A**.
- **Principe** : on **garde les 4 outils riches inchangés** dans leurs fonctions, et on ajoute une **couche de dossier partagée** qui relaie automatiquement les payloads natifs de chaque outil via localStorage → **fin du copier-coller JSON, zéro fonctionnalité perdue** (tarifs/signatures/checklist/annotateur reviennent puisqu'on utilise les vrais outils).
- **`js/bornexa-sync.js`** (nouveau, clé de voûte) : module `window.Bornexa`. Store `bornexa-dossiers-v1` = `{current, dossiers:{id:{id,name,status,created,updated, visite,devis,chantier,docs}}}`, séquence `bornexa-dossier-seq` (id `BX-AAAA-0001`). API : `list/currentId/active/has/setCurrent/create/rename/del/duplicate/put(type,payload)/get(type)/exportActive/importDossier`. `put()` dérive le nom client + fait monter le statut (rang Nouveau<Visite<Devis<Chantier<Documents) ; `write()` a un repli quota (drop des photos visite). Sur `DOMContentLoaded`, si `<body data-bornexa-tool="…">`, injecte un **bandeau sticky « dossier actif »** (id + nom + statut + lien Hub) ou un avertissement si aucun dossier.
- **`bornexa-hub.html`** (nouveau, `data-bornexa-tool="hub"`, noindex) : **centre de pilotage des dossiers** — liste (Ouvrir/Renommer/Dupliquer/Supprimer), « + Nouveau dossier », carte du dossier actif avec 4 liens de lancement (visite/calculateur/chantier/documents), résumé lu depuis les payloads, export/import dossier JSON.
- **Intégration des 4 outils** (refactor faible risque, on réutilise les mappers d'import déjà testés) :
  - `visite-terrain.html` (`data-bornexa-tool="visite"`) : pull `Bornexa.get('visite')` à l'init, push `buildPayload()` au save et aux exports (avec photos).
  - `calculateur-interne.html` (`calc`) : import devis refactoré en `applyVisitePayload()`, push `buildDevisPayload()` débouncé (400 ms) à chaque `update()`, auto-import du payload visite à l'init.
  - `chantier-installation.html` (`chantier`) : import refactoré en `applyDevisToChantier()`, `buildChantierPayload()`, push au save, auto-import du devis à l'init.
  - `documenten-installatie.html` (`docs`) : imports refactorés en `applyDevisPayload()` / `applyChantierPayload()`, `buildDocsPayload()`, push au save, auto-import **devis + chantier** à l'init, n° de dossier aligné sur l'id du hub actif.
- **noindex** : hub ajouté à robots.txt / _headers / _redirects (alias `/hub`, `/dossiers`, `/bornexa-hub`).
- **`bornexa-workflow.html` conservé** (non supprimé) mais **superseded** par hub + outils riches ; ne plus l'utiliser comme flux principal.
- **⚠️ Non testé en navigateur par l'assistant** → l'utilisateur doit valider le flux : créer un dossier au hub → visite → calculateur (préremplis) → chantier (préremplis) → documents (préremplis) → vérifier que devis signatures/tarifs/impression et checklist/annotateur sont bien intacts.

### Phase 15 (écosystème unifié — bornexa-workflow.html — 2026-06-06)
**5e outil = outil GÉNÉRAL** : `bornexa-workflow.html` (noindex, tablette+PC) qui centralise tout le processus en **une source de données unique** (fin du copier-coller JSON entre les 4 outils).
- **Modèle unifié `BornexaProjectData`** (`D`) : meta{dossierId,status}, client, vehicle, network, solar, placement, needs[], options, borne, pricing, chantier{checks,measures}, documents, photos. Binding générique via `data-bind="path"` + `setP/getP`.
- **Gestion de dossiers** : localStorage (`bornexa-workflow-v1`), multi-clients (sélecteur), nouveau/ouvrir/supprimer, n° séquentiel (`bornexa-wf-seq`), **autosave débouncé**, reprise plus tard.
- **Stepper 11 étapes** : client → visite (+photos compressées) → technique → borne → options → calcul → devis → prépa chantier → assistance (checklist condensée + mesures) → documents (unifilaire SVG + dossier) → export. Progress + validation champs requis (*).
- **Logique portée du calculateur** (exacte) : TARIFS, `computeDim`, `buildLines`, `buildIncluded`, helpers `wantsLB/wantsSolar/smartModuleRef/effTva`, `MODULE_LABEL`. + devis A4 bilingue NL/FR, unifilaire SVG (porté de documenten), dossier installation.
- **Exports** : impression PDF (devis / dossier), export/import JSON (sauvegarde réimportable + **import rétro-compatible** des JSON `bornexa-visite-v1` et du modèle workflow). Câblé noindex (robots/_headers/_redirects, alias /workflow /outil-bornexa).
- **Les 4 outils existants restent** (fallback + fonctions avancées non portées : hints NL visite, annotateur photo du tool documents, checklist chantier exhaustive). Le workflow couvre le flux complet pour le cas courant.
- **⚠️ Non testé en navigateur par l'assistant** (pas de navigateur dans l'environnement) → l'utilisateur doit exécuter les 10 scénarios de test. Limites connues : checklist chantier condensée (vs chantier-installation complet), pas d'annotateur photo de plan dans le workflow (rester sur documenten-installatie pour ça), schémas = circuit borne uniquement.

### Phase 14 (outil génération documents keuring — 2026-06-06)
**4e outil interne créé : `documenten-installatie.html`** (noindex, tablette+PC, standalone). Génère le dossier post-installation : schéma unifilaire, schéma de position, fiche/dossier client A4.
- **Audit préalable** (sources réelles) : eendraadschema + situatieschema **obligatoires** à la keuring (sinon refus, 18 mois) ; doivent figurer : raccordement/EAN, protections (type/calibre/courbe/pouvoir de coupure kA), différentiels (type/sensibilité), section câble, et **depuis AM 5 mars 2023 : borne EV, PV, batterie à représenter** ; symboles IEC 60617/NBN EN 60617 (RGIE Livre 1 §3.1.4). Cause de refus n°1 = **Type A vs Type B** (selon organisme). Sources : Certinergie, Atlas Contrôle, Vinçotte, kwootech, OCB, Volta.
- **Décisions utilisateur** : (1) champ différentiel explicite, **défaut Type A 30 mA + RDC-DD borne**, bascule Type B en 1 clic, + mention de prudence imposée ; (2) plan de position = **schéma auto** (compteur/coffret/borne/cheminement) **+ option upload photo/plan + annotation** (repères borne/coffret/compteur/percement/note + tracé câble).
- **Fonctions** : import JSON Devis (`bornexa-devis-v1`) + Chantier (`bornexa-chantier-v2`, mesures RGIE) → pré-remplissage ; formulaire complément (EAN, kA, type terre, calibres) ; **unifilaire SVG** (symboles IEC approximés + étiquettes, cartouche, sources PV/P1/batterie AM2023, terre) ; **position SVG auto + annotateur canvas** (tactile) ; **dossier A4 imprimable** (NL/FR au choix — organisme flamand = NL) avec mesures pass/fail, garantie, signatures, mention prudence, schémas intégrés ; export JSON `bornexa-docs-v1`. Câblé noindex (robots/_headers/_redirects, alias /documenten /documents).
- **Limites assumées (dans l'outil)** : aucune garantie d'acceptation organisme ; symboles EV/PV/batterie à recouper avec planche officielle Volta/OCB 🟡 ; unifilaire = **circuit borne** (à intégrer au schéma global) ; position = schématique (pas métré) ; Type A/B dépend de l'agent.
- **v1.1 améliorations (2026-06-06)** : persistance localStorage (anti-perte, `bornexa-docs-form-v1`, sauvegarde débouncée + image annotée en dataURL) ; **n° dossier séquentiel** (`bornexa-docs-seq`) ; **panneau de contrôle de conformité** (alertes live : terre/RCD/isolement hors normes, EAN/câble/borne manquants, rappel Type A à confirmer, PV/batterie à représenter) ; **sous-tableau/coffret divisionnaire** (stage supplémentaire dans l'unifilaire, `buildUni` refondu en stages) ; **mesures supplémentaires** isolement (MΩ, ≥0,5) + polarité/raccordement (OK/NOK) ; **téléchargements** unifilaire SVG/PNG + plan position SVG/JPG ; symboles compteur/sous-tableau ajoutés.

### Phase 13 (validation documentaire technique — 2026-06-06)
Vérification des affirmations techniques contre sources réelles (fabricants + normatives). Créé **`VALIDATION-TECHNIQUE.md`** = document terrain (avant chaque chantier), avec niveaux de confiance 🟢/🟡/🔴, sources et limites. Conclusions clés :
- 🟢 **Norme HD/IEC 60364-7-722** : Type B OU Type A + RDC-DD 6 mA (IEC 62955) = alternative valable (Schneider/electrical-installation.org, IEC). Texte NBN intégral **payant** → clause exacte à confirmer sur copie.
- 🟢 **Tesla Wall Connector Gen 3** : protection AC+DC intégrée, « no separate Type B RCD required » (manuel Tesla) → Type A OK. 🟡 vérifier version EU/BE.
- 🟢 **Wallbox Pulsar Plus** : « integrated DC leakage protection as standard » (support.wallbox.com) → Type A. 🟡 **Pulsar Max / Commander 2** : à confirmer sur datasheet (contradiction tierce relevée : « Pulsar Max à protéger par Type B ou Type EV »).
- 🔴 **Smappee EV Wall/Base/One** : source primaire inaccessible (403) → **à vérifier impérativement** sur le manuel avant de défaut sur Type A.
- 🟡 **MCB** : calibre exact (C32/C40, C16/C20) dépend du courant max configuré + fabricant. **Câble** : section = calcul (longueur, pose, chute de tension ~5 %), pas table figée.
- **Règle d'or** : avant chantier, vérifier la datasheet de la révision exacte ; en cas de doute → protéger plus (Type B/Type EV).
- **Guide public `gids-laadpaal-zekering-kabel.html`** : ajout encart « Per model gecontroleerd » (honnêteté).
- **Actions ouvertes** : (1) confirmer DC 6 mA intégré sur datasheets Pulsar Max/Commander 2/Smappee ; (2) acheter/consulter NBN HD 60364-7-722 ; (3) **confirmation écrite Vinçotte/BTV/OCB/ACEG** sur Type A + RDC-DD (déjà listée).

### Phase 12 (exécution plan avant-lancement — 2026-06-06)
Suite au 2e audit concurrentiel (Wall Connect = menace n°1 mais zéro contenu Type A/B/P1 ; nouveaux concurrents Advanced Energy, PMG Charge ; leaders d'avis distants → Local Pack des petites communes gagnable ; niche GEO/IA libre). Exécuté (sauf EEAT, exclu par l'utilisateur) :
- **`MARKETING-PRELANCEMENT.md`** (livrable hors-code) : pack Google Business Profile prêt-à-coller (catégories, zones, descriptions NL/FR ≤750c, services, 3 posts, Q&A, photos) + checklist listings (locators OEM Tesla/Smappee/Wallbox = backlinks autoritaires, agrégateurs Bobex/Solvari/Trustlocal/Plugnet, cartes) + système d'avis. NAP de référence figé.
- **`prijsberekening.html`** : calculateur de prix public bilingue (4 questions + options → fourchette all-in BTW 6%, honnête, CTA devis). Wall Connect en a un, BORNEXA non → comblé. Schema WebApplication+FAQPage. Câblé : sitemap (prio 0.9), _redirects (+alias /prijs, /wat-kost-een-laadpaal), lien depuis simulator.html.
- **2 guides GEO** (moat IA, questions que les concurrents ne couvrent pas) : `gids-p1-poort-activeren.html` (HowTo schema, activation P1 Fluvius/Sibelga pas-à-pas) + `gids-laadpaal-zekering-kabel.html` (Article+FAQ, tableau automaat/differentieel/kabelsectie C16-C40 / 3G6-5G16 par kW & longueur, conform AREI/NBN HD 60364-7-722). Câblés : sitemap, _redirects, llms.txt (citation IA), cross-links entre guides + vers prijsberekening + Type A/B existant.
- **Reste du plan (à faire)** : point 3 — étoffer les 7 pages communes Hageland vers ~2 000+ mots + quartiers (combler l'écart de volume vs Wall Connect ~4 000 mots). Point 5 EEAT : exclu par l'utilisateur. Actions hors-code (GBP, listings, avis) : à exécuter par le gérant via MARKETING-PRELANCEMENT.md.

### Phase 11 (expansion locale Hageland + audit concurrentiel — 2026-06-06)
**Audit concurrentiel réel** (WebSearch/WebFetch) : concurrents directs = **Wall Connect** (même stratégie pages locales, ~3 000 mots/page, FAQ 7, VCA, 4 000 installs, 4,9/5, calculateur de prix public), **Brever** (Leuven depuis 2016, pas de FAQ ni RGIE, marques datées EVBox/NewMotion), **Dgs-groep** (Tremelo, 140 avis), **Venneman** (Kortenberg, 116 avis) ; agrégateurs (Bobex, Trustlocal, Laadpaalplaatsen) dominent le générique. **Benchmark avis** : leaders 78-546 avis → cible BORNEXA réaliste 10-20 avis en 90 j. **Faiblesses concurrents exploitables** : Wall Connect sans Schema.org ni codes postaux ; Brever sans RGIE ; personne ne couvre Type A/B + P1 (niche GEO).
**7 nouvelles pages locales créées** (zones cibles est-Brabant/Hageland non couvertes) : `laadpaal-tienen` (3300), `-boutersem` (3370), `-zoutleeuw` (3440), `-landen` (3400), `-lubbeek` (3210), `-bierbeek` (3360), `-kortenberg` (3070). Template propre et **plus profond que Wall Connect** : codes postaux + deelgemeenten dans le contenu, **5 FAQ dont Type A/B et P1** (que les concurrents n'ont pas), schema Service+LocalBusiness+FAQPage, maillage croisé + vers pages existantes. Ajoutées à sitemap.xml, _redirects, et hub regios.html. **Total pages locales NL : 22 → 29.**
**Enrichissement + correction des pages existantes (fait 2026-06-06)** :
- **FAQ Type B + P1/solaire** (bilingue, différenciateur GEO que les concurrents n'ont pas) ajoutée à **36 pages locales existantes** (les 7 nouvelles l'avaient déjà). FAQ visible 3→5 questions (schema JSON-LD non modifié — enrichissement schema reste optionnel).
- **Bug copier-coller corrigé** : 93 cartes « buurgemeente » + 93 liens footer (= **186 liens internes**) avaient un libellé figé (Boortmeerbeek/Keerbergen/Haacht/Leuven) ne correspondant pas à l'URL cible. Libellé + description réalignés sur la commune du href (titre dérivé du slug). Accent FR « à » corrigé (24 pages). Noms de commune dupliqués « X en X » réduits (3 pages : holsbeek, lier, watermael-boitsfort).
- **Reste optionnel** : codes postaux dans le corps des 22 pages existantes (les 7 nouvelles les ont) ; enrichissement du schema FAQPage JSON-LD avec les 2 nouvelles Q ; ids `aria-labelledby="...-tremelo"` résiduels (valides, cosmétiques) ; quelques hrefs voisins en double (ex. Holsbeek 2× tremelo).

### Phase 10b (indexation FR + double H1 + C16 — 2026-06-06)
- **🔴 Cause racine indexation FR corrigée** dans `js/lang.js` : la langue s'initialisait *uniquement* depuis localStorage (défaut NL) en **ignorant le `<html lang>`** et en écrasant `documentElement.lang` en NL. → Les pages FR (`<html lang="fr">` : 13× `borne-recharge-*` Bruxelles + `prime-borne-recharge-bruxelles`) rendaient du **NL pour Googlebot** → invisibles en FR. Nouvelle priorité : **`?lang=` URL > préférence stockée > `<html lang>` > NL**. `lang.js` cache-busté `?v=2026-06-06` (65 fichiers). **Impact : les pages locales FR s'indexent enfin en FR.**
- **Double H1 résolu** : 10 pages (blogs + simulator + comparateur + privacy) avaient 2 `<h1>` (héros NL + FR dual-DOM). Le H1 du bloc FR (caché par défaut sur ces pages NL-canoniques) passé en `<h2>` stylé → **1 seul H1 par page indexée** (404.html garde 2, non indexé). Effet de bord mineur : titre FR légèrement différent en vue togglée FR.
- **C16 corrigé** dans le schema HowTo de `services.html` (« C16/C20/C32 » → « C20/C32 », cohérent avec le standard 7,4 mono C32 / 11 tri C20 / 22 tri C32). `DIS-C16` reste comme réf catalogue inutilisée dans le calculateur (produit réel, non affiché au client).
- **Limite restante (décision structurelle)** : les pages **core/blog/marques** (`<html lang="nl">`, canonical NL) restent indexées en NL ; leur version FR (`?lang=fr`) est canonicalisée vers le NL → pas indexable séparément. Pour les indexer en FR il faudrait des **URLs FR distinctes `/fr/...`** (≈25 pages) — non fait, à décider.
- **Reste de l'audit** : EEAT `over-bornexa` + Person/photo, calcul chute de tension, confirmation BTV Type A, calibre C32 vs C40, relecture NL native, preuve sociale, GA4 ID à renseigner.

### Phase 9 (audit complet 3 outils + flux de données continu — 2026-06-06)
**Audit dans 7 rôles** (installateur, commercial, UX, conversion, RGIE, client, SAV). Cause systémique identifiée : **fuite de données entre outils** (Visite→Devis→Chantier). Corrections appliquées :
- **Bugs évidents** : calibre C16→C32 (chantier, contredisait standard projet) · texte « Excel-calculator » obsolète → calculateur HTML (visite).
- **VISITE** (`visite-terrain.html`) : + réseau triphasé 3×230 V sans neutre (subtilité belge), + mise à la terre (RGIE bloquant), + EAN compteur (notif Fluvius), + type de mur (fixation), validation tel/e-mail (e-mail requis si canal=E-mail), **photos embarquées** (compression canvas → dataURL, incluses dans JSON téléchargé, JSON copié/mailé reste léger), nouveaux champs dans summary/labels.
- **DEVIS** (`calculateur-interne.html`) : **import visite complété** — auto-coche `wantSolar` (hasSolar/needs), `want2ndEV` (futureEV), normalise clientType/brandPref, stocke les ~14 champs sans équivalent dans la note interne (rien ne se perd). **Auto-TVA 21 %** si logement < 10 ans (`effectiveTva()`, répercuté devis/CSV/JSON + note conditions). **Forfait MO optionnel** (`f-laborForfait`, masque h×taux). **N° devis séquentiel** (`getQuoteSeq`, compteur localStorage). **Bloc Garantie & SAV** bilingue dans le devis.
- **CHANTIER** (`chantier-installation.html` v2.0) : réécrit — bilingue NL/FR, import devis (carte contexte), phase GO/NO-GO, mesures RGIE structurées. Voir §7.4.

### Phase 8 (visibilité du devis — incident client réel 2026-06-06)
**Contexte** : un client a cru que config app / load balancing / module P1 / connexion compteur numérique / optimisation PV n'étaient PAS inclus car invisibles dans le devis.
**3 causes racines corrigées dans `calculateur-interne.html`** :
1. **Aucune section "Inclus"** → ajout d'une section **« INCLUS DANS L'OFFRE / INBEGREPEN IN DE OFFERTE »** générée dynamiquement (bilingue), placée AVANT le tableau de prix (valeur avant prix = conversion). Liste toujours : config app, création/paramétrage compte, mise en service, explication fonctionnement, explication réglages, smart charging, plan élec, AREI, tests, garantie. Conditionnellement : load balancing + connexion P1 (si LB + module présent), optimisation/surplus PV (si solaire + module présent), parafoudre, coffret, Type B, précâblage 2e EV.
2. **Module nommé techniquement** → `MODULE_LABEL` : nom client clair (« Wallbox Power Boost (module P1) — Dynamisch laadbeheer & optimisation solaire » / Smappee Connect équivalent).
3. **🔴 Bug de cohérence (cause majeure)** : LB/PV demandables à 2 endroits (cases "Besoins client" .need ET cases "Smart energy" f-want*), mais SEULES les secondes ajoutaient le module → module/fonctions pouvaient disparaître du devis. **Corrigé à la source** via helpers unifiés `wantsLoadBalance()` / `wantsSolar()` / `wantsSmart()` / `smartModuleRef()` lisant LES DEUX sources. Répercuté sur : `buildQuoteLines`, risques `renderCalc` (`smartReq`), CSV export, JSON payload (`smartEnergy` + `included`).
- Ligne main d'œuvre enrichie : « ...configuration de l'app & mise en service » (FR/NL).
- Section Tesla : `smartModuleRef` renvoie null → aucune fonction LB/PV inventée dans "Inclus" (honnêteté maintenue, risque toujours affiché).

---

## 14. TÂCHES RESTANTES

### Priorité 1 — ✅ FAIT (Phase 9, 2026-06-06)
- ~~`chantier.html`~~ → **`chantier-installation.html` v2.0 créé** (bilingue, import devis, GO/NO-GO, mesures RGIE). Voir §7.4.
- Reste optionnel : embarquer les **photos chantier** (actuellement drapeau booléen, comme l'ancienne visite) + signature client + génération PDF dossier final.

### Priorité 2 — Manuels installation (en attente d'être convertis HTML)
L'étude technique est faite, les contenus existent (cf étude load balancing 2026-06-05). À produire :
- `manuel-install-wallbox.html` (variante P1 par défaut + variante MID en alternative)
- `manuel-install-tesla.html`
- `manuel-install-smappee.html`

### Priorité 3 — En attente d'action utilisateur (bloquant)
| Item | Bloqué par |
|---|---|
| Témoignages clients réels (O5) | Premier client en attente |
| Vidéo YouTube 60-90 sec installation (O7) | Besoin tournage chantier réel |
| Avis Google (5 premiers) | Premier client + validation GBP |
| Prix distributeur réels | Obtention N° TVA + accès distributeurs |
| Photos installations terrain | Premier chantier |
| N° TVA / BCE | Démarches utilisateur |
| Confirmation BTV/SECT que Type A + RDC-DD accepté | Email organismes |
| Documentation manuels Wallbox/Tesla/Smappee dernière révision | Récupération PDF officiels |

### Priorité 4 — Améliorations futures non urgentes
- Page B2B `/borne-entreprise` (fleet)
- Page B2B `/borne-syndic` (VME)
- Pages locales Bruxelles-Ville, Anderlecht, Halle, Asse, Dilbeek, Zaventem, Waterloo
- Page glossaire `/glossaire-borne-recharge` (énorme potentiel GEO/IA)
- Conversion images OG en AVIF / WebP
- Schema AggregateRating (après 5 avis Google)
- Person schema avec photo Belkounani (besoin photo)
- Compatibilité onduleurs PV liste exhaustive testée
- WhatsApp click-to-chat sticky mobile
- Sticky CTA mobile (Tel + Devis) sur toutes pages
- Calculateur prix instantané 3 questions → fourchette (lead capture)
- Exit-intent popup (à valider)
- Trust strip sticky top (à valider)
- Sub-mètres dédiés borne (B2B fiscal)

---

## 15. RÈGLES DE TRAVAIL PERMANENTES

1. **Bilingue NL/FR obligatoire** — NL = langue principale, FR = sérieusement optimisée
2. **Mobile-first responsive** — tester sur mobile après chaque modification
3. **Schema.org sur chaque page** — LocalBusiness + FAQPage minimum
4. **Hreflang nl/fr/x-default** — sur chaque nouvelle page
5. **Maillage interne** — chaque page locale doit pointer vers ≥3 autres pages voisines
6. **Confiance déclarée** — toujours marquer 🟢 (vérifié) / 🟡 (à confirmer) / 🔴 (à vérifier impérativement) pour affirmations techniques
7. **Présentation avant modification** des grosses décisions (sauf bugs évidents)
8. **Conversion → /devis** — chaque page doit pousser vers le formulaire
9. **Cache busting** quand modif CSS/JS — bump version dans `<link rel="stylesheet" href="...?v=...">`
10. **Pas de modifications sans push Netlify** — toutes les modifs sont en local jusqu'au push manuel
11. **Tools = HTML standalone** — pas de dépendances externes (Excel COM rejeté, on est en HTML/JS pur)
12. **Migration douce localStorage** — quand on ajoute un item au catalogue calculateur, prévoir migration auto pour ne pas perdre les customisations utilisateur
13. **Tesla = pas tabou mais transparent** — dire honnêtement les limitations (pas de LB/PV sans Powerwall)
14. **Type A par défaut** — pas Type B (sauf demande client documentée)
15. **WALL-MTR-P1PORT par défaut Wallbox** en Belgique (pas le Power Meter MID sauf cas particulier)

---

## 16. MÉMOIRE LOCALE PROJET

Le système de mémoire persistante Claude Code est dans :
`C:\Users\Admin\.claude\projects\c--Users-Admin-Desktop-BORNEXA-SEO\memory\`

Fichiers actifs :
- `MEMORY.md` (index)
- `project_bornexa_site.md` (architecture)
- `feedback_seo_strategy.md` (stratégie SEO permanente)
- `project_fluvius_premie_discontinued.md` (Fluvius supprimé)
- `project_indexation_progress.md` (où on en est dans indexation GSC manuelle)

---

## 17. CONTACT TECHNIQUE PROJET

- Utilisateur : Belkounani (gérant BORNEXA)
- Email utilisateur : belkounani@gmail.com
- BORNEXA contact public : info@bornexa.be · +32 489 24 77 60
- Adresse : Boortmeerbeek (3190) · Belgique
- Site : https://www.bornexa.be

---

## ANNEXE A — État sitemap au 2026-06-05

**61 URLs** dans sitemap.xml avec hreflang complet :
- 10 core pages
- 2 outils SEO publics
- 1 hub regios
- 2 guides (Fluvius, Brussels)
- 3 brand pages
- 9 blog articles
- 22 pages locales NL
- 13 pages locales FR
- 2 legal (privacy, algemene-voorwaarden)
- + 14 entrées avec `<image:image>` sur core/blog/marques/locales pilotes

---

## ANNEXE B — Versions cache busters

| Asset | Version actuelle |
|---|---|
| `css/style.css` | `?v=2026-06-03b` |
| `js/main.js` | `?v=2026-06-06` (bumpé Phase 10 — ajout module GA4+consent) |
| `js/lang.js` | `?v=2026-06-06` (Phase 10 — fix init langue depuis `<html lang>`/URL ; cache-busté sur 65 fichiers) |
| `js/translations.js` | (pas de cache buster) |

**Quand bumper** :
- Modif CSS → bump `style.css` version
- Modif `main.js` → bump `main.js` version + appliquer sur les 63 fichiers HTML
- Pour autres JS → considérer ajout cache buster si modif fréquente

---

**Fin du document.** Mise à jour intégrale au 2026-06-05. À actualiser après chaque session importante.
