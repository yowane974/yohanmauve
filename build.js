#!/usr/bin/env node
/**
 * Génère le site statique dans dist/ à partir des fichiers de données.
 * Aucune dépendance externe : node build.js suffit.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// Passe à true pour afficher les travaux dont le statut est "en-preparation".
const afficher_travaux_en_cours = false;

const cfg = read('site.config.json');
const tax = read('data/taxonomies.json');
const theories = read('data/theories.json');
const profil = read('content/profil.json');
const travaux = read('content/travaux.json');

function read(p) { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); }
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&(?!(?:[a-zA-Z]+|#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
const B = cfg.baseUrl ? cfg.baseUrl.replace(/\/$/, '') : '';
const url = p => B + p;

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">';

function page({ title, description, current, body, script, cssDepth }) {
  const css = url('/styles.css');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${FONTS}
<link rel="stylesheet" href="${css}">
</head>
<body>
<div class="sitenav"><div class="wrap">
  <a class="name" href="${url('/')}">${esc(cfg.auteur.nom)}</a>
  <nav>
    <a href="${url('/')}"${current === 'accueil' ? ' aria-current="page"' : ''}>Accueil</a>
    <a href="${url('/theories/')}"${current === 'theories' ? ' aria-current="page"' : ''}>Registre des théories</a>
    <a href="${url('/contribuer/')}"${current === 'contribuer' ? ' aria-current="page"' : ''}>Contribuer</a>
  </nav>
</div></div>
${body}
<footer><div class="wrap">
  <p>${esc(cfg.auteur.nom)} — ${esc(cfg.auteur.titre)}${cfg.auteur.courriel_perso ? ` · <a href="mailto:${esc(cfg.auteur.courriel_perso)}">${esc(cfg.auteur.courriel_perso)}</a>` : ''}${cfg.auteur.orcid ? ` · ORCID <a href="https://orcid.org/${esc(cfg.auteur.orcid)}">${esc(cfg.auteur.orcid)}</a>` : ''}</p>
  <p>Contenus sous licence <a href="${esc(cfg.registre.licenceUrl)}">${esc(cfg.registre.licence)}</a>. Réutilisation libre avec attribution.</p>
</div></footer>
${script || ''}
</body>
</html>`;
}

/* ---------- accueil ---------- */
function accueil() {
  const parN = {}, parP = {};
  theories.forEach(t => { parN[t.niveau_code] = (parN[t.niveau_code] || 0) + 1; parP[t.phenomene] = (parP[t.phenomene] || 0) + 1; });
  const horsNursology = theories.filter(t => t.hors_nursology).length;

  const pubs = travaux.publications.filter(p => afficher_travaux_en_cours || p.statut !== 'en-preparation');
  const comms = travaux.communications.filter(p => afficher_travaux_en_cours || p.statut !== 'en-preparation');

  const listeTravaux = (items, vide) => items.length
    ? `<ul class="works">${items.map(w => `<li><span class="y">${w.annee || 'à paraître'}</span> — ${esc(w.auteurs)}. <span class="t">${w.url ? `<a href="${esc(w.url)}">${esc(w.titre)}</a>` : esc(w.titre)}</span>. <em>${esc(w.support)}</em>.${w.doi ? ` <a href="https://doi.org/${esc(w.doi)}">doi:${esc(w.doi)}</a>` : ''}${w.statut && w.statut !== 'publie' ? `<span class="st">${esc(w.statut)}</span>` : ''}</li>`).join('')}</ul>`
    : `<p class="empty-note">${vide}</p>`;

  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">${esc(profil.accroche)}</p>
  <h1>${esc(cfg.auteur.nom)}</h1>
  <div class="lede">${profil.presentation.map(p => `<p>${esc(p)}</p>`).join('')}</div>
  <div class="meta">${[...new Set(profil.affiliations.map(a => a.structure))].slice(0, 4).map(s => `<span>${esc(s)}</span>`).join('')}</div>
</div></header>

<section class="section"><div class="wrap">
  <h2 class="section-head">Axes de recherche</h2>
  <div class="axes-grid">
    ${profil.axes.map(a => `<div class="axis-item"><h3>${esc(a.titre)}</h3><p>${esc(a.detail)}</p></div>`).join('')}
  </div>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="section-head">Registre des théories infirmières</h2>
  <div class="teaser">
    <div>
      <h2 style="margin-bottom:12px">${esc(cfg.registre.sousTitre)}</h2>
      <p style="font-size:15.5px;color:var(--ink-2);max-width:60ch">Un répertoire des cadres théoriques de la discipline, classés par degré d'abstraction et par phénomène central. Il documente en particulier ce que les répertoires anglophones n'indexent pas : les traditions nordique, francophone, brésilienne et asiatique.</p>
      <p style="font-size:15.5px;color:var(--ink-2);max-width:60ch">Critère d'inclusion unique : l'autrice ou l'auteur principal est infirmier·ère. Mise à jour mensuelle, chaque entrée validée à la main.</p>
      <a class="btn" href="${url('/theories/')}">Consulter le registre</a>
    </div>
    <div class="figures">
      <div class="fig-row"><span class="n">${theories.length}</span><span class="l">théories recensées</span></div>
      ${tax.niveaux.map(n => `<div class="fig-row"><span class="n">${parN[n.code] || 0}</span><span class="sw" style="background:var(--lv-${n.code})"></span><span class="l">${esc(n.label)}</span></div>`).join('')}
      <div class="fig-row"><span class="n">${horsNursology}</span><span class="l">hors répertoire de référence</span></div>
      <div class="fig-row"><span class="n">${tax.phenomenes.length}</span><span class="l">phénomènes</span></div>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="section-head">Publications</h2>
  ${listeTravaux(pubs, 'Section à compléter — voir content/travaux.json.')}
</div></section>

<section class="section"><div class="wrap">
  <h2 class="section-head">Communications</h2>
  ${listeTravaux(comms, 'Section à compléter — voir content/travaux.json.')}
</div></section>

<section class="section"><div class="wrap">
  <h2 class="section-head">Fonctions et affiliations</h2>
  <ul class="affils">
    ${profil.affiliations.map(a => `<li><span class="role">${esc(a.role)}</span><span class="struct">${esc(a.structure)}</span></li>`).join('')}
  </ul>
</div></section>`;

  return page({
    title: cfg.auteur.nom,
    description: profil.accroche,
    current: 'accueil',
    body
  });
}

/* ---------- registre ---------- */
function registre() {
  const parN = {};
  theories.forEach(t => { parN[t.niveau_code] = (parN[t.niveau_code] || 0) + 1; });

  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">Version ${esc(cfg.registre.version)} · ${esc(cfg.registre.date)} · taxonomie de Fawcett × phénomène central</p>
  <h1>${esc(cfg.registre.titre)}</h1>
  <p class="standfirst">${theories.length} cadres théoriques, rangés selon deux axes : leur degré d'abstraction et le phénomène qu'ils prennent pour objet. Critère d'inclusion unique : l'autrice ou l'auteur principal est infirmier·ère. Les cadres empruntés à la psychologie, à la sociologie ou à la médecine, même massivement utilisés en soins infirmiers, en sont exclus.</p>
  <div class="meta">
    <span>${theories.length} entrées</span>
    <span>${tax.niveaux.length} niveaux</span>
    <span>${tax.phenomenes.length} phénomènes</span>
    <span>Licence ${esc(cfg.registre.licence)}</span>
    ${cfg.registre.doi ? `<span>doi:${esc(cfg.registre.doi)}</span>` : ''}
  </div>
</div></header>

<div class="wrap"><div class="axes">
  <div class="axis">
    <h2>Axe 1 — Degré d'abstraction</h2>
    <ul class="ladder">
      ${tax.niveaux.map(n => `<li><span class="rung" style="background:var(--lv-${n.code})">${n.code}</span><span class="txt"><b>${esc(n.label)}.</b> ${esc(n.definition)}</span></li>`).join('')}
    </ul>
  </div>
  <div class="axis">
    <h2>Ce que la taxonomie fait et cache</h2>
    <div class="note">
      <p>La hiérarchie de Fawcett ordonne l'abstraction, non la maturité empirique ni la portée critique. Plusieurs entrées résistent au classement : Watson oscille entre philosophie et modèle conceptuel, Benner relève de la phénoménologie plus que de la théorisation formelle, la Transitions Theory de Meleis est à la fois cadre intermédiaire et matrice génératrice de théories situationnelles.</p>
      <p>Aucun répertoire n'est neutre. Celui-ci assume un critère d'inclusion étroit et une lecture critique explicite. Les entrées marquées <span class="added">ajout</span> ne figurent pas dans le répertoire anglophone de référence.</p>
      <p>Le total n'est pas un fait : les théories situationnelles se publient au rythme de plusieurs par an. Ce nombre est un état de la collecte, pas un inventaire de la discipline.</p>
    </div>
  </div>
</div></div>

<div class="controls"><div class="wrap"><div class="ctrl-row">
  <div class="seg" role="group" aria-label="Mode de regroupement">
    <button type="button" data-group="theme" aria-pressed="true">Par phénomène</button>
    <button type="button" data-group="level" aria-pressed="false">Par niveau</button>
  </div>
  ${tax.niveaux.map(n => `<button type="button" class="chip lv${n.code}" data-lv="${n.code}" aria-pressed="false">${esc(n.court)}</button>`).join('')}
  <input type="search" id="q" placeholder="Autrice, théorie, concept…" aria-label="Rechercher dans le registre">
  <span class="count" id="count"></span>
</div></div></div>

<main id="out"></main>

<section class="section"><div class="wrap">
  <h2 class="section-head">Méthode et limites</h2>
  <div class="note" style="max-width:70ch">
    <p><b>Sources.</b> Répertoires Nursology.net ; recherches PubMed ; manuels de théories intermédiaires (Smith &amp; Liehr, Peterson &amp; Bredow) ; guides bibliographiques universitaires ; littérature primaire des traditions nordique, francophone, brésilienne et asiatique.</p>
    <p><b>Ce qui vient des sources et ce qui n'en vient pas.</b> Noms, autrices et années viennent des sources. Le classement par niveau, le regroupement par phénomène, les résumés et les lectures critiques sont une interprétation éditoriale, discutable et révisable. Ne les citez pas comme des données.</p>
    <p><b>Dates.</b> Année de première formulation publiée, non de la dernière édition. Quelques dates restent approximatives pour les travaux dont la première publication n'est pas en anglais.</p>
    <p><b>Angles morts assumés.</b> Le recensement reste majoritairement anglophone. Les productions théoriques japonaises, thaïlandaises, africaines et arabophones sont très probablement sous-représentées : absence de la collecte, non de la discipline. <a href="${url('/contribuer/')}">Signalez-les</a>.</p>
  </div>
  <div class="cite" style="font-family:var(--mono);font-size:12px;background:var(--surface);border:1px solid var(--rule);border-radius:4px;padding:12px 14px;margin-top:20px;overflow-x:auto;color:var(--ink-2)">
    ${esc(cfg.auteur.nom)} (${cfg.registre.date.slice(0, 4)}). <em>${esc(cfg.registre.titre)}</em>, version ${esc(cfg.registre.version)}.${cfg.registre.doi ? ` https://doi.org/${esc(cfg.registre.doi)}` : ''}${cfg.domaine && cfg.domaine !== 'exemple.fr' ? ` https://${esc(cfg.domaine)}/theories/` : ''}
  </div>
</div></section>`;

  const script = `<script>
const THEORIES = ${JSON.stringify(theories)};
const TAX = ${JSON.stringify(tax)};
</script>
<script src="${url('/registre.js')}"></script>`;

  return page({
    title: cfg.registre.titre,
    description: cfg.registre.sousTitre + ' — ' + theories.length + ' cadres théoriques classés par degré d\'abstraction et par phénomène.',
    current: 'theories',
    body,
    script
  });
}

/* ---------- contribuer ---------- */
function contribuer() {
  const mail = cfg.auteur.courriel_registre;
  const lienMail = mail
    ? `<a class="mailto" href="mailto:${esc(mail)}?subject=${encodeURIComponent('Proposition — registre des théories infirmières')}">${esc(mail)}</a>`
    : `<span class="empty-note">adresse à renseigner dans site.config.json</span>`;

  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">Signaler, corriger, discuter</p>
  <h1>Contribuer au registre</h1>
  <p class="standfirst">Le registre est incomplet par construction et le restera. Trois types de contribution sont utiles : signaler une théorie absente, corriger une entrée fausse, contester un classement. La troisième est la plus précieuse.</p>
</div></header>

<section class="section"><div class="wrap">
  <h2 class="section-head">Ce qu'une proposition doit contenir</h2>
  <dl class="spec">
    <dt>Référence</dt><dd>Référence complète de la publication où la théorie est formulée, avec DOI ou PMID si disponible. Une théorie sans publication identifiable n'est pas indexable.</dd>
    <dt>Autrice</dt><dd>Nom, et élément permettant d'établir qu'elle ou il est infirmier·ère : c'est le seul critère d'inclusion, et le point sur lequel les propositions échouent le plus souvent.</dd>
    <dt>Niveau</dt><dd>Philosophie, modèle conceptuel, théorie intermédiaire ou situationnelle — avec une phrase de justification. Le désaccord sur ce point est bienvenu et sera signalé dans l'entrée.</dd>
    <dt>Phénomène</dt><dd>Rubrique proposée parmi les quatorze du registre, ou proposition d'une rubrique nouvelle si aucune ne convient.</dd>
    <dt>Résumé</dt><dd>Une à deux phrases sur ce que la théorie affirme. Pas un résumé d'article : l'énoncé théorique.</dd>
  </dl>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="section-head">Comment procéder</h2>
  <ol class="steps">
    <li><div><h3>Par courriel</h3><p>Écrivez à ${lienMail}. C'est la voie la plus simple, et celle qui convient si vous ne travaillez pas avec Git.</p></div></li>
    <li><div><h3>Par le dépôt</h3><p>Les données du registre vivent dans un fichier JSON versionné. Une proposition peut prendre la forme d'une <em>issue</em> ou d'une <em>pull request</em> sur <code>data/theories.json</code>. L'historique complet des modifications est ainsi public.</p></div></li>
    <li><div><h3>Ce qui se passe ensuite</h3><p>Chaque proposition est examinée à la main. Elle est acceptée, refusée avec motif, ou mise en attente si le critère infirmier ne peut être établi. Les décisions sont visibles dans l'historique du dépôt.</p></div></li>
    <li><div><h3>Attribution</h3><p>Les contributrices et contributeurs sont nommés dans le fichier des remerciements et dans les métadonnées de la version citable, sauf demande contraire.</p></div></li>
  </ol>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="section-head">Sur la veille automatisée</h2>
  <div class="callout">
    <p>Une veille mensuelle interroge PubMed, SciELO, les revues francophones et nordiques, et repère les théories nouvellement publiées. Elle ne modifie jamais le registre : elle produit une liste de candidates, examinées ensuite une par une.</p>
    <p>Cette séparation est délibérée. Un répertoire qui s'écrit sans décision humaine identifiable perd ce qui le rend citable, et illustrerait exactement le mécanisme que ce travail cherche par ailleurs à documenter : la délégation silencieuse du jugement à un dispositif automatique.</p>
  </div>
</div></section>`;

  return page({
    title: 'Contribuer au registre',
    description: 'Signaler une théorie absente, corriger une entrée, contester un classement du registre des théories infirmières.',
    current: 'contribuer',
    body
  });
}

/* ---------- écriture ---------- */
function write(rel, content) {
  const full = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log('  ' + rel + '  ' + (content.length / 1024).toFixed(1) + ' Ko');
}

fs.rmSync(DIST, { recursive: true, force: true });
console.log('Génération du site :');
write('index.html', accueil());
write('theories/index.html', registre());
write('contribuer/index.html', contribuer());
write('styles.css', fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8'));
write('registre.js', fs.readFileSync(path.join(ROOT, 'src/registre.js'), 'utf8'));
write('data/theories.json', JSON.stringify(theories, null, 2));
write('data/taxonomies.json', JSON.stringify(tax, null, 2));
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
// GitHub Pages efface le domaine personnalisé à chaque déploiement s'il n'est pas
// régénéré : le fichier CNAME doit donc être produit par le build, pas ajouté à la main.
if (cfg.domaine && cfg.domaine !== 'exemple.fr') {
  fs.writeFileSync(path.join(DIST, 'CNAME'), cfg.domaine + '\n');
  console.log('  CNAME  ' + cfg.domaine);
}
console.log('\n' + theories.length + ' théories · dist/ prêt à déployer.');
