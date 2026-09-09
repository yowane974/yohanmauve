#!/usr/bin/env node
/**
 * Génère le site statique dans dist/ à partir des fichiers de données.
 * Aucune dépendance externe : node build.js suffit.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// Passe à false pour masquer les travaux dont le statut est "en-preparation".
const afficher_travaux_en_cours = true;

function read(p) { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); }

const cfg = read('site.config.json');
const tax = read('data/taxonomies.json');
const theories = read('data/theories.json');
const profil = read('content/profil.json');
const travaux = read('content/travaux.json');
const fil = read('content/fil.json');
const socleData = read('content/socle.json');
const reperesData = read('content/reperes.json');

// Espaces insécables de la typographie française : évite les guillemets ou la
// ponctuation double rejetés seuls en début de ligne.
function typo(s) {
  return s
    .replace(/«\s+/g, '\u00AB\u202F')
    .replace(/\s+»/g, '\u202F\u00BB')
    .replace(/\s+([;!?])/g, '\u202F$1')
    .replace(/\s+:/g, '\u00A0:');
}
function esc(s) {
  return typo(String(s == null ? '' : s))
    .replace(/&(?!(?:[a-zA-Z]+|#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const B = cfg.baseUrl ? cfg.baseUrl.replace(/\/$/, '') : '';
const url = p => B + p;
const lien = p => (p && p.startsWith('/') ? url(p) : esc(p || '#'));

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">';

const RESEAUX = [
  { cle: 'youtube', label: 'YouTube' },
  { cle: 'instagram', label: 'Instagram' },
  { cle: 'linkedin', label: 'LinkedIn' },
  { cle: 'googleScholar', label: 'Google Scholar' }
];
function liensReseaux() {
  const l = cfg.liens || {};
  const actifs = RESEAUX.filter(r => l[r.cle]);
  if (!actifs.length) return '';
  return actifs.map(r => `<a href="${esc(l[r.cle])}" rel="me noopener">${r.label}</a>`).join('<span class="sep">/</span>');
}

const GC = (cfg.analytics && cfg.analytics.goatcounterCode) ? cfg.analytics.goatcounterCode : '';
const ANALYTICS = GC
  ? `<script data-goatcounter="https://${GC}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
  : '';
const MENTION_MESURE = GC
  ? '<p class="mesure">Fréquentation mesurée avec GoatCounter : pages vues, provenance, pays. Sans cookie, sans identifiant, sans donnée personnelle conservée.</p>'
  : '';

function page({ title, description, current, body }) {
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
<link rel="icon" href="${url('/favicon.svg')}" type="image/svg+xml">
<link rel="alternate icon" href="${url('/favicon.ico')}" sizes="any">
<link rel="apple-touch-icon" href="${url('/apple-touch-icon.png')}">
<meta name="theme-color" content="#6E2E5B">
<link rel="stylesheet" href="${url('/styles.css')}">
</head>
<body>
<div class="sitenav"><div class="wrap">
  <a class="name" href="${url('/')}">${esc(profil.prenom)} <i>${esc(profil.nom)}</i></a>
  <nav>
    <a href="${url('/')}"${current === 'accueil' ? ' aria-current="page"' : ''}>Accueil</a>
    <a href="${url('/fil/')}"${current === 'fil' ? ' aria-current="page"' : ''}>Fil</a>
    <a href="${url('/reperes/')}"${current === 'reperes' ? ' aria-current="page"' : ''}>Repères</a>
    <a href="${url('/theories/')}"${current === 'theories' ? ' aria-current="page"' : ''}>Registre</a>
    <a href="${url('/socle/')}"${current === 'socle' ? ' aria-current="page"' : ''}>Socle</a>
    <a href="${url('/contribuer/')}"${current === 'contribuer' ? ' aria-current="page"' : ''}>Contribuer</a>
    <a href="${url('/contact/')}"${current === 'contact' ? ' aria-current="page"' : ''}>Contact</a>
  </nav>
</div></div>
${body}
<footer><div class="wrap">
  <p>${esc(profil.prenom)} ${esc(profil.nom)} — ${esc(cfg.auteur.titre)}${cfg.auteur.courriel_perso ? ` · <a href="mailto:${esc(cfg.auteur.courriel_perso)}">${esc(cfg.auteur.courriel_perso)}</a>` : ''}${cfg.auteur.orcid ? ` · ORCID <a href="https://orcid.org/${esc(cfg.auteur.orcid)}">${esc(cfg.auteur.orcid)}</a>` : ''}</p>
  ${liensReseaux() ? `<p class="reseaux">${liensReseaux()}</p>` : ''}
  <p>Contenus sous licence <a href="${esc(cfg.registre.licenceUrl)}">${esc(cfg.registre.licence)}</a>. Réutilisation libre avec attribution.</p>
  ${MENTION_MESURE}
</div></footer>
${ANALYTICS}
</body>
</html>`;
}

/* ---------- fil : rendu partagé ---------- */
const TYPE_FIL = { lecture: 'Lecture', production: 'Production' };
function entreesFil(limite) {
  const items = (fil.entrees || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const liste = limite ? items.slice(0, limite) : items;
  return liste.map(e => {
    const d = new Date(e.date + 'T12:00:00');
    const mois = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    const titre = e.url ? `<a href="${lien(e.url)}">${esc(e.titre)}</a>` : esc(e.titre);
    return `<article class="fil-item ${e.type === 'production' ? 'is-prod' : 'is-lect'}">
      <div class="fil-date"><time datetime="${esc(e.date)}">${mois}</time></div>
      <div class="fil-type">${TYPE_FIL[e.type] || ''}</div>
      <div class="fil-body">
        <h3>${titre}</h3>
        <p class="fil-src">${esc(e.source)}</p>
        <p class="fil-com">${esc(e.commentaire)}</p>
        ${(e.tags || []).length ? `<p class="fil-tags">${e.tags.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
      </div>
    </article>`;
  }).join('');
}

/* ---------- accueil ---------- */
function accueil() {
  const STATUT = { accepte: 'accepté', soumis: 'soumis', 'en-preparation': 'en préparation' };
  const garde = w => afficher_travaux_en_cours || w.statut !== 'en-preparation';
  const pubs = travaux.publications.filter(garde);
  const comms = travaux.communications.filter(garde);

  const listeTravaux = (items, vide) => items.length
    ? `<ul class="works">${items.map(w => `<li><span class="y">${w.annee || 'à paraître'}</span> — ${esc(w.auteurs).replace(/\.$/, '')}. <span class="t">${w.url ? `<a href="${esc(w.url)}">${esc(w.titre)}</a>` : esc(w.titre)}</span>. <em>${esc(w.support)}</em>.${w.doi ? ` <a href="https://doi.org/${esc(w.doi)}">doi:${esc(w.doi)}</a>` : ''}${STATUT[w.statut] ? `<span class="st">${STATUT[w.statut]}</span>` : ''}</li>`).join('')}</ul>`
    : `<p class="empty-note">${vide}</p>`;

  const tj = profil.trajectoire;

  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">${esc(profil.eyebrow)}</p>
  ${profil.photo ? `<img class="portrait" src="${url('/' + profil.photo.replace(/^\//, ''))}" alt="Portrait de ${esc(profil.prenom)} ${esc(profil.nom)}">` : ''}
  <h1>${esc(profil.prenom)} <i>${esc(profil.nom)}</i></h1>
  <p class="tagline">${esc(profil.tagline)}${profil.taglineItalique ? `<em>${esc(profil.taglineItalique)}</em>` : ''}</p>
  <p class="creds">${profil.creds.map((c, i) => `${i ? '<span class="s">·</span>' : ''}<span${c.fort ? ' class="x"><b>' : '>'}${esc(c.texte)}${c.fort ? '</b>' : ''}</span>`).join('')}</p>
</div></header>

<div class="reperes">
  ${profil.reperes.map(r => `<div class="repere"><div class="v">${esc(r.valeur)}${r.suffixe ? `<i> ${esc(r.suffixe)}</i>` : ''}</div><div class="l">${esc(r.libelle)}</div></div>`).join('')}
</div>

<div class="portes">
  ${profil.portes.map(p => `<a class="porte" href="${lien(p.lien)}">
    <span class="num">${esc(p.num)} / ${esc(p.titre)}</span>
    <span class="arrow">→</span>
    <h3>${esc(p.titre)}${p.titreItalique ? ` <i>${esc(p.titreItalique)}</i>` : ''}</h3>
    <p>${esc(p.texte)}</p>
  </a>`).join('')}
</div>

<section class="nuit"><div class="wrap">
  <div>
    <p class="eyebrow-rule">Projet en cours · registre francophone</p>
    <h2>Les théories que personne <i>n'indexe.</i></h2>
    <p>Un recensement des cadres théoriques en sciences infirmières, organisés selon leur niveau d'abstraction et les phénomènes qu'ils permettent d'éclairer. L'objectif est aussi de rendre visibles ce que les répertoires anglophones documentent peu ou mal : les traditions nordiques, francophones, brésiliennes, philippines et asiatiques.</p>
    <p><b>Mise à jour mensuelle. Chaque entrée est vérifiée manuellement.</b></p>
    <a class="cta" href="${url('/theories/')}">Consulter le registre →</a>
  </div>
  <div class="chiffre">
    <div class="n">${theories.length}</div>
    <div class="l">cadres théoriques recensés<br>${theories.filter(t => t.hors_nursology).length} hors répertoire de référence<br>${tax.phenomenes.length} phénomènes · ${tax.niveaux.length} niveaux</div>
  </div>
</div></section>

<section class="section" id="recherche"><div class="wrap">
  <div class="duo">
    <div>
      <p class="eyebrow-rule">Parcours</p>
      <h2>${esc(tj.titre)}<br><i>${esc(tj.titreItalique)}</i></h2>
    </div>
    <div class="prose">${tj.paragraphes.map(p => `<p>${esc(p)}</p>`).join('')}</div>
  </div>
</div></section>

<section class="section alt"><div class="wrap">
  <div class="section-head"><p class="eyebrow-rule" style="margin:0">Axes de recherche</p></div>
  <div class="axes-grid">
    ${profil.axes.map(a => `<div class="axis-item"><h3>${esc(a.titre)}</h3><p>${esc(a.detail)}</p></div>`).join('')}
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head">
    <p class="eyebrow-rule" style="margin:0">Le fil — ce que je lis, ce que je produis</p>
    <a class="more" href="${url('/fil/')}">Tout le fil →</a>
  </div>
  <div class="fil">${entreesFil(3)}</div>
</div></section>

<section class="section alt"><div class="wrap">
  <div class="duo">
    <div><p class="eyebrow-rule">Publications</p><h2>Écrits</h2></div>
    <div>${listeTravaux(pubs, 'Section à compléter — voir content/travaux.json.')}</div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="duo">
    <div><p class="eyebrow-rule">Communications</p><h2>Congrès</h2></div>
    <div>${listeTravaux(comms, 'Section à compléter — voir content/travaux.json.')}</div>
  </div>
</div></section>

${(profil.distinctions || []).length ? `<section class="section alt"><div class="wrap">
  <div class="duo">
    <div><p class="eyebrow-rule">Projets lauréats</p><h2>Financements</h2></div>
    <div><ul class="works">${profil.distinctions.map(d => `<li><span class="y">${d.annee}</span> — <span class="t">${esc(d.intitule)}</span>. ${esc(d.detail)}</li>`).join('')}</ul></div>
  </div>
</div></section>` : ''}

<section class="section"><div class="wrap">
  <div class="duo">
    <div><p class="eyebrow-rule">Fonctions</p><h2>Affiliations</h2></div>
    <div><ul class="affils">${profil.affiliations.map(a => `<li><span class="role">${esc(a.role)}</span><span class="struct">${esc(a.structure)}</span></li>`).join('')}</ul></div>
  </div>
</div></section>

<section class="contact"><div class="wrap">
  <p class="eyebrow">Écrire</p>
  <h2>Contact<span class="dot">.</span></h2>
  <p>${esc(profil.contact.accroche)}</p>
  <p class="adresse"><a href="mailto:${esc(cfg.auteur.courriel_perso)}">${esc(cfg.auteur.courriel_perso)}</a><br>${esc(profil.contact.lieu)}</p>
  <p class="cta"><a href="${url('/contact/')}">Passer par le formulaire</a></p>
</div></section>`;

  return page({
    title: `${profil.prenom} ${profil.nom}`,
    description: profil.tagline,
    current: 'accueil',
    body
  });
}

/* ---------- fil ---------- */
function pageFil() {
  const n = (fil.entrees || []).length;
  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">Mis à jour chaque mois · ${n} entrée${n > 1 ? 's' : ''}</p>
  <h1>Le <i>fil</i></h1>
  <p class="tagline">Ce que je lis et ce que j'en fais.<em>Avec les impasses.</em></p>
</div></header>

<section class="section"><div class="wrap">
  <div class="fil">${entreesFil(null)}</div>
</div></section>

<section class="section alt"><div class="wrap">
  <div class="note">
    <p><b>D'où viennent ces entrées.</b> Une veille automatisée interroge chaque mois PubMed, SciELO, les revues francophones et nordiques, et propose une sélection. Je l'élague, j'écris les commentaires, je publie. Ce que vous lisez ici a été choisi et signé, jamais publié automatiquement.</p>
  </div>
</div></section>`;

  return page({
    title: 'Le fil',
    description: 'Lectures commentées et productions — veille mensuelle en sciences infirmières, épistémologie du soin et numérique en santé.',
    current: 'fil',
    body
  });
}

/* ---------- registre ---------- */
function registre() {
  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">Version ${esc(cfg.registre.version)} · ${esc(cfg.registre.date)}</p>
  <h1>Registre des <i>théories</i></h1>
  <p class="tagline">${theories.length} cadres théoriques de la discipline infirmière, par degré d'abstraction et par phénomène.<em>Critère unique : l'autrice ou l'auteur principal est infirmier·ère.</em></p>
</div></header>

<div class="reperes">
  ${tax.niveaux.map(n => `<div class="repere"><div class="v">${theories.filter(t => t.niveau_code === n.code).length}</div><div class="l">${esc(n.label)}</div></div>`).join('')}
</div>

<div class="wrap"><div class="axes">
  <div class="axis">
    <h2 class="mini">Axe 1 — degré d'abstraction</h2>
    <ul class="ladder">
      ${tax.niveaux.map(n => `<li><span class="rung" style="background:var(--lv-${n.code})">${n.code}</span><span class="txt"><b>${esc(n.label)}.</b> ${esc(n.definition)}</span></li>`).join('')}
    </ul>
  </div>
  <div class="axis">
    <h2 class="mini">Ce que la taxonomie fait et cache</h2>
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

<section class="section alt"><div class="wrap">
  <div class="duo">
    <div><p class="eyebrow-rule">Méthode</p><h2>Et <i>limites</i></h2></div>
    <div class="note" style="max-width:70ch">
      <p><b>Sources.</b> Répertoires Nursology.net ; recherches PubMed ; manuels de théories intermédiaires (Smith &amp; Liehr, Peterson &amp; Bredow) ; guides bibliographiques universitaires ; littérature primaire des traditions nordique, francophone, brésilienne et asiatique.</p>
      <p><b>Ce qui vient des sources et ce qui n'en vient pas.</b> Noms, autrices et années viennent des sources. Le classement par niveau, le regroupement par phénomène, les résumés et les lectures critiques sont une interprétation éditoriale, discutable et révisable. Ne les citez pas comme des données.</p>
      <p><b>Dates.</b> Année de première formulation publiée, non de la dernière édition.</p>
      <p><b>Angles morts assumés.</b> Le recensement reste majoritairement anglophone. Les productions japonaises, thaïlandaises, africaines et arabophones sont très probablement sous-représentées : absence de la collecte, non de la discipline. <a href="${url('/contribuer/')}">Signalez-les</a>.</p>
      <div class="cite">${esc(profil.prenom)} ${esc(profil.nom)} (${cfg.registre.date.slice(0, 4)}). <em>${esc(cfg.registre.titre)}</em>, version ${esc(cfg.registre.version)}.${cfg.registre.doi ? ` https://doi.org/${esc(cfg.registre.doi)}` : ''}${cfg.domaine ? ` https://${esc(cfg.domaine)}/theories/` : ''}</div>
    </div>
  </div>
</div></section>

<script>
const THEORIES = ${JSON.stringify(theories)};
const TAX = ${JSON.stringify(tax)};
</script>
<script src="${url('/registre.js')}"></script>`;

  return page({
    title: cfg.registre.titre,
    description: cfg.registre.sousTitre + ' — ' + theories.length + " cadres théoriques classés par degré d'abstraction et par phénomène.",
    current: 'theories',
    body
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
  <p class="eyebrow">Signaler · corriger · contester</p>
  <h1>Contribuer<span class="dot">.</span></h1>
  <p class="tagline">Le registre est incomplet par construction et le restera.<em>Contester un classement est la contribution la plus utile.</em></p>
</div></header>

<section class="section"><div class="wrap">
  <div class="duo">
    <div><p class="eyebrow-rule">Exigences</p><h2>Ce qu'une proposition <i>doit contenir</i></h2></div>
    <div><dl class="spec">
      <dt>Référence</dt><dd>Référence complète de la publication où la théorie est formulée, avec DOI ou PMID si disponible. Une théorie sans publication identifiable n'est pas indexable.</dd>
      <dt>Autrice</dt><dd>Nom, et élément permettant d'établir qu'elle ou il est infirmier·ère : c'est le seul critère d'inclusion, et le point sur lequel les propositions échouent le plus souvent.</dd>
      <dt>Niveau</dt><dd>Philosophie, modèle conceptuel, théorie intermédiaire ou situationnelle — avec une phrase de justification. Le désaccord est bienvenu et sera signalé dans l'entrée.</dd>
      <dt>Phénomène</dt><dd>Rubrique proposée parmi les quatorze du registre, ou proposition d'une rubrique nouvelle.</dd>
      <dt>Résumé</dt><dd>Une à deux phrases sur ce que la théorie affirme. Pas un résumé d'article : l'énoncé théorique.</dd>
    </dl></div>
  </div>
</div></section>

<section class="section alt"><div class="wrap">
  <div class="duo">
    <div><p class="eyebrow-rule">Marche à suivre</p><h2>Comment <i>procéder</i></h2></div>
    <div><ol class="steps">
      <li><div><h3>Par courriel</h3><p>Écrivez à ${lienMail}. C'est la voie la plus simple, et celle qui convient si vous ne travaillez pas avec Git.</p></div></li>
      <li><div><h3>Par le dépôt</h3><p>Les données du registre vivent dans un fichier JSON versionné. Une proposition peut prendre la forme d'une <em>issue</em> ou d'une <em>pull request</em> sur <code>data/theories.json</code>. L'historique complet des modifications est ainsi public.</p></div></li>
      <li><div><h3>Ce qui se passe ensuite</h3><p>Chaque proposition est examinée à la main. Elle est acceptée, refusée avec motif, ou mise en attente si le critère infirmier ne peut être établi. Les décisions sont visibles dans l'historique du dépôt.</p></div></li>
      <li><div><h3>Attribution</h3><p>Les contributrices et contributeurs sont nommés dans le fichier des remerciements et dans les métadonnées de la version citable, sauf demande contraire.</p></div></li>
    </ol></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="duo">
    <div><p class="eyebrow-rule">Automatisation</p><h2>Ce que la machine <i>ne fait pas</i></h2></div>
    <div class="callout">
      <p>Une veille mensuelle interroge PubMed, SciELO, les revues francophones et nordiques, et repère les théories nouvellement publiées. Elle ne modifie jamais le registre : elle produit une liste de candidates, examinées ensuite une par une.</p>
      <p>Cette séparation est délibérée. Un répertoire qui s'écrit sans décision humaine identifiable perd ce qui le rend citable, et illustrerait exactement le mécanisme que ce travail cherche par ailleurs à documenter : la délégation silencieuse du jugement à un dispositif automatique.</p>
    </div>
  </div>
</div></section>`;

  return page({
    title: 'Contribuer au registre',
    description: 'Signaler une théorie absente, corriger une entrée, contester un classement du registre des théories infirmières.',
    current: 'contribuer',
    body
  });
}

/* ---------- repères ---------- */
function blocRepere(s) {
  let corps = '';
  if (s.type === 'prose') {
    corps = `<div class="prose">${s.paragraphes.map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
  } else if (s.type === 'definitions') {
    corps = `<div><dl class="spec">${s.items.map(i => `<dt>${esc(i.terme)}</dt><dd>${esc(i.texte)}</dd>`).join('')}</dl></div>`;
  } else if (s.type === 'chrono') {
    corps = `<div><ol class="chrono">${s.items.map(i => `<li><span class="per">${esc(i.periode)}</span><div><h3>${esc(i.titre)}</h3><p>${esc(i.texte)}</p></div></li>`).join('')}</ol></div>`;
  } else if (s.type === 'objections') {
    corps = `<div><ul class="objs">${s.items.map(i => `<li><p class="obj">${esc(i.objection)}</p><p class="rep">${esc(i.reponse)}</p></li>`).join('')}</ul></div>`;
  } else if (s.type === 'lectures') {
    corps = `<div><ul class="socle">${s.items.map(i => `<li><p class="ref">${esc(i.reference)}</p><p class="pourquoi">${esc(i.note)}</p></li>`).join('')}</ul></div>`;
  }
  return corps;
}

function reperes() {
  let rang = 0;
  const corps = reperesData.sections.map(s => {
    if (s.fond === 'nuit') {
      return `
<section class="section nuit-bloc"><div class="wrap">
  <div class="duo">
    <div>
      <p class="eyebrow-rule">${esc(s.eyebrow)}</p>
      <h2>${esc(s.titre)}${s.titreItalique ? ` <i>${esc(s.titreItalique)}</i>` : ''}</h2>
      ${s.chapeau ? `<p class="chapeau">${esc(s.chapeau)}</p>` : ''}
    </div>
    ${blocRepere(s)}
  </div>
</div></section>`;
    }
    const i = rang++;
    return `
<section class="section${i % 2 ? ' alt' : ''}"><div class="wrap">
  <div class="duo">
    <div>
      <p class="eyebrow-rule">${esc(s.eyebrow)}</p>
      <h2>${esc(s.titre)}${s.titreItalique ? ` <i>${esc(s.titreItalique)}</i>` : ''}</h2>
      ${s.chapeau ? `<p class="chapeau">${esc(s.chapeau)}</p>` : ''}
    </div>
    ${blocRepere(s)}
  </div>
</div></section>`;
  }).join('');

  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">${esc(reperesData.eyebrow)}</p>
  <h1>${esc(reperesData.titre)}</h1>
  <p class="tagline">${esc(reperesData.tagline)}${reperesData.taglineItalique ? `<em>${esc(reperesData.taglineItalique)}</em>` : ''}</p>
</div></header>
${corps}

<section class="section"><div class="wrap">
  <p class="cta-centre"><a href="${url('/theories/')}">Consulter le registre →</a></p>
</div></section>`;

  return page({
    title: 'Repères — comprendre les théories infirmières',
    description: "Pourquoi la théorie infirmière compte pour un infirmier en poste : d'où viennent les quatorze besoins, quatre définitions, cent cinquante ans d'histoire, et par où commencer.",
    current: 'reperes',
    body
  });
}

/* ---------- socle ---------- */
function socle() {
  const total = socleData.sections.reduce((n, s) => n + s.oeuvres.length, 0);
  const corps = socleData.sections.map(s => `
<section class="section"><div class="wrap">
  <div class="duo">
    <div>
      <p class="eyebrow-rule">${esc(s.titre)}</p>
      ${s.chapeau ? `<p class="chapeau">${esc(s.chapeau)}</p>` : ''}
    </div>
    <div><ul class="socle">
      ${s.oeuvres.map(o => `<li${o.incomplet ? ' class="a-verifier"' : ''}>
        <p class="ref">${esc(o.reference)}${o.doi ? ` <a class="doi" href="${esc(o.doi)}" rel="noopener">↗</a>` : ''}</p>
        <p class="pourquoi">${esc(o.note)}</p>
        ${o.incomplet ? '<p class="flag">Référence à compléter</p>' : ''}
      </li>`).join('')}
    </ul></div>
  </div>
</div></section>`).join('');

  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">${total} textes · ${socleData.sections.length} entrées thématiques</p>
  <h1>Le <i>socle</i></h1>
  <p class="tagline">${esc(socleData.intro)}</p>
</div></header>
${corps}`;

  return page({
    title: 'Le socle',
    description: 'Les textes qui structurent une pensée en sciences infirmières : épistémologie du soin, décolonialité, numérique critique, pédagogie.',
    current: 'socle',
    body
  });
}

/* ---------- contact ---------- */
function formulaire() {
  const f = cfg.formulaire || {};
  const mail = cfg.auteur.courriel_registre || cfg.auteur.courriel_perso;
  if (!f.web3formsKey) {
    return `<div class="callout">
      <p><b>Formulaire en attente de sa clé.</b> Renseignez <code>formulaire.web3formsKey</code> dans <code>site.config.json</code> pour l'activer. En attendant, l'adresse ci-dessus reste la voie de contact.</p>
    </div>`;
  }
  const motifs = (f.motifs || []).map(m => `<option>${esc(m)}</option>`).join('');
  return `<form class="form" action="https://api.web3forms.com/submit" method="POST">
  <input type="hidden" name="access_key" value="${esc(f.web3formsKey)}">
  <input type="hidden" name="subject" value="Message depuis ${esc(cfg.domaine || 'le site')}">
  <input type="hidden" name="from_name" value="${esc(cfg.domaine || 'Site')}">
  <input type="hidden" name="redirect" value="https://${esc(cfg.domaine)}${url('/contact/merci/')}">
  <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">

  <div class="field-row">
    <p class="field"><label for="f-nom">Nom <span class="req">*</span></label>
      <input id="f-nom" name="Nom" type="text" required autocomplete="name"></p>
    <p class="field"><label for="f-mail">Courriel <span class="req">*</span></label>
      <input id="f-mail" name="email" type="email" required autocomplete="email"></p>
  </div>

  <p class="field"><label for="f-org">Organisation</label>
    <input id="f-org" name="Organisation" type="text" autocomplete="organization"></p>

  <p class="field"><label for="f-motif">Motif <span class="req">*</span></label>
    <select id="f-motif" name="Motif" required>
      <option value="" selected disabled>Choisir…</option>
      ${motifs}
    </select></p>

  <p class="field"><label for="f-msg">Message <span class="req">*</span></label>
    <textarea id="f-msg" name="Message" rows="7" required></textarea></p>

  <div class="form-foot">
    <button type="submit">Envoyer</button>
    ${f.delaiReponse ? `<span class="hint">${esc(f.delaiReponse)}</span>` : ''}
  </div>
  <p class="legal">Les champs de ce formulaire sont transmis par le service Web3Forms, qui les réexpédie à ${esc(mail)} sans les conserver durablement. Aucun traceur, aucune mesure d'audience sur ce site. Écrivez directement à cette adresse si vous préférez éviter l'intermédiaire.</p>
</form>`;
}

function contact() {
  const mail = cfg.auteur.courriel_registre || cfg.auteur.courriel_perso;
  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">Écrire</p>
  <h1>Contact<span class="dot">.</span></h1>
  <p class="tagline">${esc(profil.contact.accroche)}<em>Une objection argumentée vaut mieux qu'un accord poli.</em></p>
</div></header>

<section class="section"><div class="wrap">
  <div class="duo">
    <div>
      <p class="eyebrow-rule">Directement</p>
      <h2>Par <i>courriel</i></h2>
      <p class="adresse"><a href="mailto:${esc(mail)}">${esc(mail)}</a><br>${esc(profil.contact.lieu)}</p>
      <p class="note-inline">Pour une théorie absente du registre, lisez d'abord <a href="${url('/contribuer/')}">ce qu'une proposition doit contenir</a> : c'est ce qui fait la différence entre un signalement traité et un signalement en attente.</p>
    </div>
    <div>${formulaire()}</div>
  </div>
</div></section>`;

  return page({
    title: 'Contact',
    description: `Écrire à ${profil.prenom} ${profil.nom} — collaboration de recherche, intervention, encadrement, contribution au registre des théories infirmières.`,
    current: 'contact',
    body
  });
}

function merci() {
  const body = `
<header class="hero"><div class="wrap">
  <p class="eyebrow">Message reçu</p>
  <h1>Merci<span class="dot">.</span></h1>
  <p class="tagline">Votre message est arrivé.<em>${esc((cfg.formulaire || {}).delaiReponse || '')}</em></p>
</div></header>

<section class="section"><div class="wrap">
  <div class="note" style="max-width:60ch">
    <p>Chaque message est lu et traité à la main. Si votre envoi concerne une théorie à ajouter au registre, la réponse dira ce qui a été retenu, ce qui ne l'a pas été, et pourquoi.</p>
    <p><a href="${url('/')}">Retour à l'accueil</a> · <a href="${url('/theories/')}">Le registre</a> · <a href="${url('/fil/')}">Le fil</a></p>
  </div>
</div></section>`;

  return page({ title: 'Message envoyé', description: 'Confirmation d\'envoi.', current: 'contact', body });
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
write('fil/index.html', pageFil());
write('theories/index.html', registre());
write('contribuer/index.html', contribuer());
write('reperes/index.html', reperes());
write('socle/index.html', socle());
write('contact/index.html', contact());
write('contact/merci/index.html', merci());
for (const ic of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) {
  const src = path.join(ROOT, 'src', ic);
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(DIST, ic)); console.log('  ' + ic); }
}
write('styles.css', fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8'));
write('registre.js', fs.readFileSync(path.join(ROOT, 'src/registre.js'), 'utf8'));
write('data/theories.json', JSON.stringify(theories, null, 2));
write('data/taxonomies.json', JSON.stringify(tax, null, 2));
if (profil.photo) {
  const src = path.join(ROOT, profil.photo.replace(/^\//, ''));
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(DIST, path.basename(src))); console.log('  ' + path.basename(src)); }
  else console.log('  ⚠ photo introuvable : ' + profil.photo);
}
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
// GitHub Pages efface le domaine personnalisé à chaque déploiement s'il n'est pas
// régénéré : le fichier CNAME doit donc être produit par le build.
if (cfg.domaine && cfg.domaine !== 'exemple.fr') {
  fs.writeFileSync(path.join(DIST, 'CNAME'), cfg.domaine + '\n');
  console.log('  CNAME  ' + cfg.domaine);
}
console.log('\n' + theories.length + ' théories · dist/ prêt à déployer.');
