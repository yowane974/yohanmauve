/* Rendu et filtrage du registre. Les données sont injectées par build.js
   dans les constantes globales THEORIES et TAX. */
(function () {
  var out = document.getElementById('out');
  var countEl = document.getElementById('count');
  if (!out) return;

  var NIV = {}, PHEN = {}, ORDRE_PHEN = [], ORDRE_NIV = [];
  TAX.niveaux.forEach(function (n) { NIV[n.code] = n; ORDRE_NIV.push(n.code); });
  TAX.phenomenes.forEach(function (p) { PHEN[p.code] = p; ORDRE_PHEN.push(p.code); });

  var groupMode = 'theme';
  var activeLevels = {};
  var nbLevels = 0;
  var query = '';

  function norm(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function matches(t) {
    if (nbLevels && !activeLevels[t.niveau_code]) return false;
    if (!query) return true;
    var hay = norm([t.nom, t.auteurs, t.resume, t.lecture_critique || '', t.annee,
      NIV[t.niveau_code].label, PHEN[t.phenomene].label].join(' '));
    return query.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function rowHTML(t) {
    var c = t.niveau_code;
    return '<article class="row" style="--lv:var(--lv-' + c + ');--lvbg:var(--lv-' + c + '-bg)">'
      + '<div class="bar"></div><div class="rbody">'
      + '<div class="line1"><h3 class="tname">' + t.nom + '</h3>'
      + '<span class="lvtag">' + NIV[c].court + '</span>'
      + (t.hors_nursology ? '<span class="added">ajout</span>' : '')
      + '</div>'
      + '<p class="line2">' + t.auteurs + ' · ' + t.annee
      + (groupMode === 'level' ? ' · ' + PHEN[t.phenomene].label : '') + '</p>'
      + '<p class="gist">' + t.resume + '</p>'
      + (t.lecture_critique ? '<p class="crit"><b>Lecture critique</b>' + t.lecture_critique + '</p>' : '')
      + '</div></article>';
  }

  function render() {
    var items = THEORIES.filter(matches);
    countEl.textContent = items.length + ' / ' + THEORIES.length + ' entrées';
    if (!items.length) {
      out.innerHTML = '<p class="empty">Aucune théorie ne correspond à ces critères.</p>';
      return;
    }
    var keys = groupMode === 'theme' ? ORDRE_PHEN : ORDRE_NIV;
    var html = '';
    keys.forEach(function (k) {
      var bucket = items.filter(function (t) {
        return groupMode === 'theme' ? t.phenomene === k : t.niveau_code === k;
      });
      if (!bucket.length) return;
      bucket.sort(function (a, b) { return a.annee - b.annee; });
      var titre = groupMode === 'theme' ? PHEN[k].label : NIV[k].label;
      var chapeau = groupMode === 'theme' ? PHEN[k].chapeau : NIV[k].definition;
      html += '<section class="grp"><div class="wrap">'
        + '<div class="grp-head"><h2>' + titre + '</h2><span class="n">' + bucket.length + '</span></div>'
        + '<p class="grp-sub">' + chapeau + '</p>'
        + bucket.map(rowHTML).join('')
        + '</div></section>';
    });
    out.innerHTML = html;
  }

  Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
    b.addEventListener('click', function () {
      groupMode = b.dataset.group;
      Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
      render();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-lv]'), function (b) {
    b.addEventListener('click', function () {
      var lv = b.dataset.lv;
      if (activeLevels[lv]) { delete activeLevels[lv]; b.setAttribute('aria-pressed', 'false'); }
      else { activeLevels[lv] = true; b.setAttribute('aria-pressed', 'true'); }
      nbLevels = Object.keys(activeLevels).length;
      render();
    });
  });

  document.getElementById('q').addEventListener('input', function (e) {
    query = norm(e.target.value.trim());
    render();
  });

  render();
})();
