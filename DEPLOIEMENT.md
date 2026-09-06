# Mise en ligne, pas à pas

Compter une heure la première fois, dont l'essentiel en attente de propagation DNS.

## 1. Le dépôt

Créer un dépôt **public** sur GitHub — un dépôt privé ne peut pas être publié sur Pages
avec un compte gratuit, et la publicité de l'historique fait partie de ce qui rend le
registre vérifiable.

```bash
cd registre
git init
git add .
git commit -m "Première version du site et du registre (221 théories)"
git branch -M main
git remote add origin https://github.com/yowane974/yohanmauve.git
git push -u origin main
```

Avec GitHub Desktop, rien de tout cela : cloner le dépôt vide, y copier le **contenu** du dossier
`registre`, écrire un message, « Commit to main », puis « Push origin ».

## 2. Activer GitHub Pages

Dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions.**

Ne pas choisir « Deploy from a branch » : le workflow fourni construit le site avant de
le publier. La première mise en ligne prend une à deux minutes ; l'onglet **Actions**
montre l'avancement et, en cas d'échec, la ligne exacte qui a bloqué.

Le site est alors à **`https://yowane974.github.io/yohanmauve/`**.

Le dépôt s'appelant `yohanmauve` et non `yowane974.github.io`, le site est servi depuis un
sous-chemin : `baseUrl` est donc déjà réglé à `/yohanmauve` dans `site.config.json`. Ne pas y
toucher tant que le domaine personnalisé n'est pas en place — c'est ce réglage qui fait que la
feuille de style et les liens internes se résolvent correctement.

## 3. Le nom de domaine

Après achat, chez le registraire, créer les enregistrements DNS :

| Type  | Nom   | Valeur                                                              |
|-------|-------|---------------------------------------------------------------------|
| A     | @     | `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` (quatre lignes) |
| CNAME | www   | `VOTRE-COMPTE.github.io`                                             |

Puis renseigner `domaine` dans `site.config.json` — **et remettre `baseUrl` à `""`**,
puisque le site passe alors à la racine du domaine et n'est plus servi depuis `/yohanmauve`.
Oublier ce changement casse d'un coup toute la mise en page : c'est le piège numéro un. Reconstruire, repousser : `build.js` génère
le fichier `CNAME` que GitHub Pages attend. Ce fichier doit venir du build, sinon chaque
déploiement efface le domaine personnalisé.

Dans **Settings → Pages**, saisir le domaine et cocher **Enforce HTTPS** une fois le
certificat émis (quelques minutes à quelques heures).

## 4. Le DOI

Se connecter à [Zenodo](https://zenodo.org) avec le compte GitHub, aller dans
**GitHub**, activer l'interrupteur du dépôt. Puis créer une *release* sur GitHub
(`v0.1.0`) : Zenodo l'archive et attribue un DOI.

Reporter ce DOI dans `site.config.json` et dans `CITATION.cff`, reconstruire, repousser.
Le registre devient citable ; il l'est alors dans une version précise et figée, ce qui
est le but.

Répéter à chaque version mineure ou majeure. Zenodo crée un DOI par version, plus un DOI
« concept » qui pointe toujours vers la dernière : c'est celui-là qu'on met sur le site.

## 5. Après chaque mise à jour du registre

```bash
# éditer data/theories.json, puis
node build.js                    # vérifier que le compte d'entrées est le bon
python3 -m http.server -d dist   # relire à l'œil
git add . && git commit -m "Ajout de N théories — veille de [mois]"
git push
```

Le déploiement est automatique. Penser à incrémenter `version` et `date` dans
`site.config.json` avant de pousser un lot d'ajouts.

## Pièges connus

- **Page blanche après déploiement** — presque toujours `baseUrl` mal renseigné.
- **Domaine personnalisé qui disparaît** — le fichier `CNAME` n'a pas été régénéré ;
  vérifier que `domaine` est bien renseigné dans `site.config.json`.
- **Modification invisible en ligne** — le cache du navigateur ; recharger sans cache.
- **`dist/` versionné par erreur** — il est dans `.gitignore` et doit y rester : c'est
  une sortie, pas une source.
