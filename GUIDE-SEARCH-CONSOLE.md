# Guide Google Search Console — BORNEXA

> Procédure étape par étape pour soumettre le site, accélérer l'indexation des nouvelles pages, et monitorer la santé SEO.
> Dernière mise à jour : 31 mai 2026

---

## 0. État actuel

Le site `bornexa.be` contient déjà la meta de vérification Google (`vaBOBaByUVtfU0nOj07FMVp8yHqM8rzjvj9j3eEwIp0`) dans le `index.html`. **Il y a donc déjà une propriété Search Console enregistrée** sur ton compte Google.

Si tu ne sais plus avec quel compte Google : connecte-toi sur [search.google.com/search-console](https://search.google.com/search-console) avec chacun de tes comptes Google jusqu'à voir `bornexa.be` apparaître dans la liste des propriétés.

---

## 1. Vérifier que la propriété est active

1. Va sur [search.google.com/search-console](https://search.google.com/search-console)
2. En haut à gauche, ouvre le sélecteur de propriété
3. Sélectionne `https://www.bornexa.be/` (ou `bornexa.be` si Domain property)

Si la propriété affiche **"Verification expired"** ou est absente :
- Clique sur **"Add property"** > choisir **"URL prefix"** > entrer `https://www.bornexa.be/`
- La meta `<meta name="google-site-verification">` déjà présente dans `index.html` devrait suffire — clique sur **"Verify"**

---

## 2. Soumettre le sitemap

Tu n'as à le faire qu'**une seule fois**. Google le re-lira automatiquement à chaque mise à jour.

1. Dans Search Console, menu de gauche : **Sitemaps**
2. Dans le champ "Add a new sitemap" : entrer `sitemap.xml`
3. Cliquer **"Submit"**
4. Statut attendu : **"Success"** avec le nombre d'URLs détectées (environ 60 URLs pour bornexa.be)

> ✅ Si tu vois "Couldn't fetch" : attends 5-10 minutes après le déploiement Netlify, puis recommence.

---

## 3. Demander l'indexation manuelle des pages prioritaires

C'est la partie qui accélère vraiment l'indexation des nouvelles pages. Limite Google : **environ 10 demandes manuelles par jour** par propriété.

### Pages prioritaires à demander (jour 1)
1. `https://www.bornexa.be/` (homepage repositionnée Vlaams-Brabant)
2. `https://www.bornexa.be/laadpaal-vilvoorde` (gros bassin EV)
3. `https://www.bornexa.be/laadpaal-tervuren` (clientèle premium)
4. `https://www.bornexa.be/borne-recharge-uccle` (plus grande commune bruxelloise)
5. `https://www.bornexa.be/fluvius-premie-laadpaal` (intent commerciale haute)
6. `https://www.bornexa.be/laadpaal-tesla-model-y` (volume Tesla)
7. `https://www.bornexa.be/laadpaal-tesla-model-3` (volume Tesla)
8. `https://www.bornexa.be/wallbox` (page marque clé)
9. `https://www.bornexa.be/tesla` (page marque clé)
10. `https://www.bornexa.be/smappee` (page marque clé)

### Pour chaque URL
1. En haut de Search Console, **barre de recherche "Inspect URL"** > coller l'URL
2. Cliquer **"Request indexing"**
3. Attendre quelques secondes la confirmation

### Pages prioritaires à demander (jour 2)
11. `https://www.bornexa.be/over-bornexa` (page À propos, EEAT)
12. `https://www.bornexa.be/prime-borne-recharge-bruxelles` (guide FR)
13. `https://www.bornexa.be/borne-recharge-tervuren` (n'existe pas — c'est `laadpaal-tervuren` qui couvre)
14. `https://www.bornexa.be/borne-recharge-auderghem`
15. `https://www.bornexa.be/borne-recharge-woluwe-saint-pierre`
16. `https://www.bornexa.be/laadpaal-mechelen` (force le recrawl pour repositionnement)
17. `https://www.bornexa.be/laadpaal-leuven` (idem)
18. `https://www.bornexa.be/laadpaal-bruxelles` (idem)
19. `https://www.bornexa.be/laadpaal-boortmeerbeek` (idem)
20. `https://www.bornexa.be/comparateur` (linkbait outil)

### Pages restantes (jour 3+)
Continuer avec les autres pages locales et guides — pas urgent, Google les trouvera via sitemap + maillage interne.

---

## 4. Vérifier la santé technique

### Rapport "Indexation des pages"
- Menu : **Indexing > Pages**
- Vérifier que les pages publiées sont en "Indexed", pas en "Crawled - currently not indexed" ou "Discovered - currently not indexed"
- Si des pages restent non-indexées après 4 semaines, vérifier :
  - Qualité du contenu (anti-doorway respecté ✓)
  - Liens internes vers la page (maillage)
  - Backlinks externes

### Rapport "Pages avec erreur"
- À surveiller hebdomadairement
- **404 attendus** : `blog-boortmeerbeek` (supprimé volontairement — vérifier que le 301 marche)
- **Pas attendu** : autres 404 → corriger

### Rapport "Core Web Vitals"
- Menu : **Experience > Core Web Vitals**
- Cibles vertes : LCP < 2.5s, INP < 200ms, CLS < 0.1
- Données disponibles après ~28 jours de trafic réel

---

## 5. Tester les Rich Results (Schema.org)

Pour chaque type de page importante :

### Test des Schema.org actuels
1. Va sur [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
2. Tester ces URLs en priorité :

| URL | Schema attendu | Rich Result possible |
|-----|----------------|---------------------|
| `bornexa.be/` | LocalBusiness + WebSite | Knowledge panel |
| `bornexa.be/faq` | FAQPage | FAQ rich result |
| `bornexa.be/laadpaal-boortmeerbeek` | LocalBusiness + FAQPage | FAQ rich result |
| `bornexa.be/fluvius-premie-laadpaal` | Article + FAQPage | FAQ + Article |
| `bornexa.be/laadpaal-tesla-model-y` | Article + FAQPage | FAQ + Article |
| `bornexa.be/blog-tesla` | BlogPosting | Article rich result |
| `bornexa.be/wallbox` | Product | Product (peu probable sans `price`) |
| `bornexa.be/comparateur` | FAQPage | FAQ rich result |

### Résultats attendus
- ✅ **Eligible for "FAQ"** : 8+ pages
- ✅ **Eligible for "Article"** : 5+ pages
- ✅ **Eligible for "Local Business"** : homepage + 20 pages locales

---

## 6. Configurer les autres outils

### Bing Webmaster Tools
- Aller sur [bing.com/webmasters](https://www.bing.com/webmasters)
- Importer la propriété depuis Search Console (un seul clic)
- Soumettre le même sitemap
- Bing représente 5-10% des recherches en Belgique — peu pour Wallonie/FR, plus en NL

### Google Business Profile
- **Action distincte mais critique** : voir le guide `BORNEXA-Plan-Lancement.html` étape 2B
- Valider la fiche, ajouter photos, demander avis
- Une fois validée, **lier dans Search Console** : Settings > Users and permissions

---

## 7. Calendrier de suivi recommandé

| Fréquence | Action |
|-----------|--------|
| Jour 1 | Soumettre sitemap + 10 demandes d'indexation prioritaires |
| Jour 2 | 10 demandes d'indexation supplémentaires |
| Jour 3 | Tester les Rich Results sur 8 pages clés |
| Semaine 1 | Vérifier que les pages clés sont indexées |
| Semaine 2 | Premier rapport "Performance" disponible — voir les requêtes Google sur lesquelles tu apparais |
| Mensuel | Rapport indexation, erreurs, performance, Core Web Vitals |

---

## 8. Métriques à surveiller (1er mois)

| Métrique | Cible mois 1 | Cible mois 3 |
|----------|--------------|--------------|
| Pages indexées | 40+ (sur ~60) | 55+ |
| Impressions hebdomadaires | 100+ | 1 000+ |
| Clics hebdomadaires | 5+ | 50+ |
| Position moyenne | 50+ | 25-35 |
| CTR moyen | 1-2% | 3-5% |

> Ces cibles sont indicatives pour un nouveau site sans backlinks. Avec du link building actif (annuaires locaux, programmes installateur Tesla/Wallbox/Smappee, partenariats), tu peux les doubler.

---

## Annexe — Liens directs Search Console

- Propriété : [search.google.com/search-console](https://search.google.com/search-console)
- Rich Results Test : [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- URL Inspection : [search.google.com/search-console/inspect](https://search.google.com/search-console/inspect)
- Sitemap : [search.google.com/search-console/sitemaps](https://search.google.com/search-console/sitemaps)
- Page Indexing report : [search.google.com/search-console/indexing](https://search.google.com/search-console/indexing)

---

**Une fois ce guide exécuté, le site sera correctement annoncé à Google. Les résultats d'indexation arrivent en 2-6 semaines, le ranking effectif en 3-6 mois.**
