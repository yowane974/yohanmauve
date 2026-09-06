# Site personnel et registre des théories infirmières

Site statique en deux parties : une page personnelle académique et, adossé à elle, un
registre francophone des théories infirmières (221 entrées au départ).

Aucune dépendance, aucun framework. `node build.js` génère `dist/`.

## Structure

```
site.config.json      domaine, identité, version et licence du registre
content/profil.json   biographie, axes de recherche, affiliations
content/travaux.json  publications et communications
data/theories.json    LE registre — une entrée par théorie
data/taxonomies.json  les 4 niveaux d'abstraction et les 14 phénomènes
src/styles.css        feuille de style unique
src/registre.js       filtrage et rendu du registre côté navigateur
build.js              génère dist/
dist/                 sortie — ne pas éditer à la main, ne pas versionner
```

## Démarrer

```bash
node build.js                    # génère dist/
python3 -m http.server -d dist   # prévisualiser sur http://localhost:8000
```

## À faire avant la mise en ligne

1. **`site.config.json`** — renseigner `domaine`, `courriel_registre` (adresse dédiée,
   distincte de l'adresse personnelle) et `orcid`. Laisser `baseUrl` vide pour un
   déploiement à la racine du domaine.
2. **`content/travaux.json`** — remplacer les deux entrées d'exemple par les
   références réelles, puis supprimer les exemples.
3. **`content/profil.json`** — relire la biographie : c'est un point de départ rédigé
   à partir d'éléments de contexte, pas un texte validé.
4. **Zenodo** — relier le dépôt, publier une première version, reporter le DOI obtenu
   dans `site.config.json` et dans `CITATION.cff`.

## Schéma d'une entrée du registre

```json
{
  "id": 1,
  "nom": "Patterns of Knowing in Nursing",
  "auteurs": "Barbara A. Carper",
  "annee": 1978,
  "niveau": "philosophie",
  "niveau_code": "P",
  "phenomene": "epis",
  "resume": "Une à deux phrases sur ce que la théorie affirme.",
  "lecture_critique": "Facultatif. Présupposés, angle mort, position du sujet connaissant.",
  "hors_nursology": true
}
```

`niveau_code` : `P` philosophie, `M` modèle conceptuel, `I` intermédiaire, `S` situationnelle.
`phenomene` : un des quatorze codes de `data/taxonomies.json`.
`hors_nursology` : `true` si l'entrée ne figure pas dans le répertoire Nursology.net.

## Versionnage

Le registre est versionné en `MAJEUR.MINEUR.CORRECTIF` dans `site.config.json` :

- **correctif** — correction d'une entrée existante (date, orthographe, résumé) ;
- **mineur** — ajout ou retrait d'entrées ;
- **majeur** — modification de la taxonomie elle-même, ou du critère d'inclusion.

Chaque version mineure ou majeure justifie une nouvelle publication Zenodo, donc un
nouveau DOI citable. Reporter la version et la date dans `site.config.json` avant de
publier.

## Déploiement

Le workflow `.github/workflows/pages.yml` construit et publie `dist/` sur GitHub Pages
à chaque poussée sur `main`. Pour un domaine personnalisé, ajouter le nom de domaine
dans les réglages Pages du dépôt et créer un fichier `CNAME` dans `dist/` via `build.js`.

## Note sur la migration

Le registre vit aujourd'hui dans une section du site personnel. Les données sont
volontairement isolées dans `data/`, indépendantes de la présentation : si le projet
prend une forme collective, ce répertoire peut être déplacé vers son propre dépôt et
son propre domaine sans rien réécrire. Prévoir alors des redirections depuis
`/theories/`.

## Licence

Code : MIT. Contenus et données du registre : CC BY 4.0.
