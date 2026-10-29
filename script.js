(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "creatorkit_saved_prompts_v2";
  const PLAN_KEY = "creatorkit_demo_plan_v2";
  let currentPrompt = "";
  let toastTimer;

  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function getSaved() {
    try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }
  function setSaved(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
  }
  function readForm() {
    const subject = $("#subject")?.value.trim() || "";
    return {
      subject,
      platform: $("#platform")?.value || "TikTok",
      goal: $("#goal")?.value || "Gagner en visibilité",
      format: $("#format")?.value || "Vidéo courte",
      tone: $("#tone")?.value || "Naturel et dynamique",
      audience: $("#audience")?.value.trim() || "personnes intéressées par le sujet",
      duration: $("#duration")?.value || "30 secondes",
      details: $("#details")?.value.trim() || ""
    };
  }
  function buildPrompt(data) {
    return `Agis comme un créateur de contenu expérimenté et un stratège éditorial.\n\nSUJET : ${data.subject}\nPLATEFORME : ${data.platform}\nOBJECTIF : ${data.goal}\nFORMAT : ${data.format}\nTON : ${data.tone}\nPUBLIC CIBLE : ${data.audience}\nDURÉE / LONGUEUR : ${data.duration}\n${data.details ? `DÉTAILS À PRENDRE EN COMPTE : ${data.details}\n` : ""}\n\nMISSION : Propose un concept original et adapté à cette plateforme. Commence par une accroche claire, structure le contenu étape par étape, utilise un langage adapté au public cible et termine par un appel à l'action naturel. Évite les clichés, les promesses exagérées et les formulations vagues.\n\nFORMAT DE RÉPONSE ATTENDU :\n1. Le concept en une phrase\n2. Trois propositions d'accroche\n3. Le contenu complet, adapté au format choisi\n4. Les indications visuelles ou de mise en scène utiles\n5. Une légende ou description adaptée à ${data.platform}\n6. Une suggestion d'appel à l'action\n7. Trois variantes pour tester différents angles\n\nSi une information essentielle manque, indique clairement ton hypothèse au lieu d'inventer des faits.`;
  }
  function generatePrompt(event) {
    if (event) event.preventDefault();
    const data = readForm();
    if (!data.subject) { $("#subject")?.focus(); toast("Ajoute d'abord un sujet à ton prompt."); return; }
    currentPrompt = buildPrompt(data);
    const out = $("#promptOutput");
    if (out) out.textContent = currentPrompt;
    const status = $("#outputStatus");
    if (status) status.textContent = "Prompt créé à partir de tes choix.";
    toast("Ton prompt est prêt !");
  }
  function downloadText(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  }
  async function copyText(text) {
    if (!text) { toast("Génère d'abord un prompt."); return; }
    try { await navigator.clipboard.writeText(text); toast("Copié dans le presse-papiers !"); }
    catch {
      const area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select();
      try { document.execCommand("copy"); toast("Copié dans le presse-papiers !"); }
      catch { toast("La copie automatique n'est pas disponible sur ce navigateur."); }
      area.remove();
    }
  }

  // Navigation and common footer.
  const menuButton = $("#mobileMenu"), nav = $("#mainNav");
  menuButton?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(Boolean(open)));
  });
  $$("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

  // Prompt generator.
  $("#promptForm")?.addEventListener("submit", generatePrompt);
  $("#copyPrompt")?.addEventListener("click", () => copyText(currentPrompt));
  $("#downloadPrompt")?.addEventListener("click", () => {
    if (!currentPrompt) { toast("Génère d'abord un prompt."); return; }
    downloadText("creatorkit-prompt.txt", currentPrompt);
  });
  $("#savePrompt")?.addEventListener("click", () => {
    if (!currentPrompt) { toast("Génère d'abord un prompt."); return; }
    const data = readForm();
    const items = getSaved();
    items.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), title: data.subject, platform: data.platform, prompt: currentPrompt, createdAt: new Date().toISOString() });
    setSaved(items.slice(0, 100));
    const status = $("#outputStatus"); if (status) status.textContent = "Prompt enregistré dans Mes créations.";
    toast("Ajouté à Mes créations !");
  });

  // Ideas: curated templates with topic/platform personalization, no external AI call.
  const ideaTemplates = [
    { tag: "CONSEIL", title: "3 erreurs que tout le monde fait", body: "Présente trois erreurs fréquentes autour de {topic}, puis donne une solution simple pour chacune." },
    { tag: "COULISSES", title: "Une journée dans les coulisses", body: "Montre les étapes, les imprévus et les petits détails qu'on ne voit jamais dans {topic}." },
    { tag: "COMPARAISON", title: "Avant de commencer / après", body: "Compare les premières impressions avec ce que tu sais aujourd'hui sur {topic}, puis partage tes apprentissages." },
    { tag: "TUTORIEL", title: "Le guide express pour débuter", body: "Crée un mini-guide en trois étapes pour aider un débutant à faire ses premiers pas dans {topic}." },
    { tag: "MYTHE", title: "Vrai ou faux ?", body: "Choisis une idée reçue sur {topic}, explique ce qui est vrai et nuance ce qui mérite de l'être." },
    { tag: "STORYTELLING", title: "Ce que j'aurais aimé savoir", body: "Raconte trois choses que tu aurais aimé connaître avant de te lancer dans {topic}." },
    { tag: "DÉFI", title: "Le défi en 7 jours", body: "Propose un petit défi de sept jours autour de {topic}, avec un objectif réaliste chaque jour." },
    { tag: "LISTE", title: "Mes 5 indispensables", body: "Présente cinq outils, habitudes ou ressources utiles quand on s'intéresse à {topic}." },
    { tag: "QUESTION", title: "Répondre à une question fréquente", body: "Prends une question que les débutants se posent sur {topic} et réponds-y de façon claire et concrète." }
  ];
  function renderIdeas() {
    const grid = $("#ideasGrid");
    if (!grid) return;
    const topic = $("#ideaTopic")?.value.trim() || "création de contenu";
    const platform = $("#ideaPlatform")?.value || "TikTok";
    const chosen = [...ideaTemplates].sort(() => Math.random() - .5).slice(0, 6);
    grid.innerHTML = chosen.map((item, i) => `<article class="idea-card" style="animation-delay:${i * 55}ms"><span class="idea-number">${String(i + 1).padStart(2, "0")} / ${escapeHTML(item.tag)}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.body.replaceAll("{topic}", topic))}</p><button class="text-button" data-idea="${escapeHTML(item.title + " — " + item.body.replaceAll("{topic}", topic) + " (plateforme : " + platform + ")")}">Utiliser cette idée →</button></article>`).join("");
    $$("[data-idea]", grid).forEach(btn => btn.addEventListener("click", () => {
      const idea = btn.dataset.idea || "";
      try { sessionStorage.setItem("creatorkit_prefill_subject", idea); } catch {}
      location.href = "generateur.html";
    }));
  }
  $("#refreshIdeas")?.addEventListener("click", renderIdeas);
  if ($("#ideasGrid")) {
    $$("[data-idea]", $("#ideasGrid")).forEach(btn => btn.addEventListener("click", () => {
      try { sessionStorage.setItem("creatorkit_prefill_subject", btn.dataset.idea || ""); } catch {}
      location.href = "generateur.html";
    }));
  }
  if (document.body.dataset.page === "generator") {
    try {
      const prefill = sessionStorage.getItem("creatorkit_prefill_subject");
      if (prefill && $("#subject")) { $("#subject").value = prefill; sessionStorage.removeItem("creatorkit_prefill_subject"); }
    } catch {}
  }

  // Saved prompt library.
  function renderSaved() {
    const list = $("#savedList");
    if (!list) return;
    const query = ($("#savedSearch")?.value || "").trim().toLowerCase();
    const all = getSaved();
    const items = all.filter(item => `${item.title} ${item.platform} ${item.prompt}`.toLowerCase().includes(query));
    const count = $("#savedCount");
    if (count) count.textContent = `${items.length} création${items.length > 1 ? "s" : ""}`;
    if (!items.length) {
      list.innerHTML = all.length ? `<div class="empty-library"><span>⌕</span><h2>Aucun résultat pour cette recherche.</h2><p>Essaie un autre mot-clé.</p></div>` : `<div class="empty-library"><span>▣</span><h2>Ta bibliothèque est prête à accueillir tes idées.</h2><p>Génère un prompt puis clique sur « Enregistrer » pour le retrouver ici.</p><a class="button button-primary" href="generateur.html">Créer mon premier prompt →</a></div>`;
      return;
    }
    list.innerHTML = items.map(item => `<article class="saved-item"><div class="saved-item-icon">✧</div><div class="saved-item-main"><div class="saved-meta">${escapeHTML(item.platform || "Prompt")} · ${new Date(item.createdAt).toLocaleDateString("fr-FR")}</div><h3>${escapeHTML(item.title || "Prompt sans titre")}</h3><p>${escapeHTML(item.prompt)}</p><div class="saved-actions"><button class="small-action" data-copy-saved="${escapeHTML(item.id)}">Copier</button><button class="small-action" data-download-saved="${escapeHTML(item.id)}">Télécharger TXT</button><button class="small-action danger" data-delete-saved="${escapeHTML(item.id)}">Supprimer</button></div></div></article>`).join("");
    $$("[data-copy-saved]", list).forEach(btn => btn.addEventListener("click", () => { const item = getSaved().find(x => x.id === btn.dataset.copySaved); if (item) copyText(item.prompt); }));
    $$("[data-download-saved]", list).forEach(btn => btn.addEventListener("click", () => { const item = getSaved().find(x => x.id === btn.dataset.downloadSaved); if (item) downloadText("creatorkit-" + (item.title || "prompt").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + ".txt", item.prompt); }));
    $$("[data-delete-saved]", list).forEach(btn => btn.addEventListener("click", () => {
      setSaved(getSaved().filter(x => x.id !== btn.dataset.deleteSaved)); renderSaved(); toast("Création supprimée.");
    }));
  }
  $("#savedSearch")?.addEventListener("input", renderSaved);
  renderSaved();

  // Demo-only plan picker.
  function getPlan() { try { return localStorage.getItem(PLAN_KEY) || "Free"; } catch { return "Free"; } }
  function setPlan(plan) { try { localStorage.setItem(PLAN_KEY, plan); } catch {} }
  function renderPlan() {
    const current = getPlan();
    const heading = $("#currentPlan"), message = $("#planMessage");
    if (heading) heading.textContent = `Offre sélectionnée : ${current}`;
    if (message) message.textContent = "Ce choix est enregistré localement pour la démonstration. Aucun paiement n'est effectué.";
    $$("[data-plan]").forEach(btn => {
      const selected = btn.dataset.plan === current;
      btn.textContent = selected ? `✓ Offre actuelle : ${current}` : `Choisir ${btn.dataset.plan}`;
      btn.classList.toggle("button-primary", selected || btn.dataset.plan === "Creator");
      btn.classList.toggle("button-soft", !(selected || btn.dataset.plan === "Creator"));
    });
  }
  $$("[data-plan]").forEach(btn => btn.addEventListener("click", () => { setPlan(btn.dataset.plan); renderPlan(); toast(`Offre de démonstration sélectionnée : ${btn.dataset.plan}`); }));
  renderPlan();

  // Original ambient music generated with Web Audio API. No external song or copyrighted recording.
  let audioContext = null, masterGain = null, musicPlaying = false, musicTimer = null, noteIndex = 0;
  const musicNotes = [261.63, 329.63, 392.00, 493.88, 392.00, 329.63, 293.66, 349.23, 440.00, 523.25, 440.00, 349.23];
  function playNote(freq, startAt, duration, volume) {
    if (!audioContext || !masterGain) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startAt);
    filter.type = "lowpass"; filter.frequency.setValueAtTime(1200, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), startAt + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(filter); filter.connect(gain); gain.connect(masterGain);
    osc.start(startAt); osc.stop(startAt + duration + 0.04);
  }
  function scheduleMusic() {
    if (!musicPlaying || !audioContext) return;
    const now = audioContext.currentTime;
    const freq = musicNotes[noteIndex % musicNotes.length];
    playNote(freq, now + 0.02, 1.5, 0.11);
    if (noteIndex % 3 === 0) playNote(musicNotes[(noteIndex + 3) % musicNotes.length] / 2, now + 0.02, 2.2, 0.045);
    noteIndex++;
  }
  function updateMusicUI() {
    const toggle = $("#musicToggle"), play = $("#musicPlay"), state = $("#musicState");
    toggle?.classList.toggle("playing", musicPlaying);
    if (toggle) toggle.setAttribute("aria-label", musicPlaying ? "Mettre la musique en pause" : "Ouvrir le lecteur de musique");
    if (play) { play.textContent = musicPlaying ? "Ⅱ" : "▶"; play.setAttribute("aria-label", musicPlaying ? "Mettre en pause" : "Lancer la musique"); }
    if (state) state.textContent = musicPlaying ? "Musique en cours" : "Musique en pause";
  }
  async function startMusic() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) { toast("La musique n'est pas prise en charge par ce navigateur."); return; }
      if (!audioContext) {
        audioContext = new AudioContextClass();
        masterGain = audioContext.createGain();
        masterGain.gain.value = (Number($("#musicVolume")?.value ?? 25) / 100) * 0.5;
        masterGain.connect(audioContext.destination);
      }
      await audioContext.resume();
      if (musicPlaying) return;
      musicPlaying = true;
      scheduleMusic();
      musicTimer = window.setInterval(scheduleMusic, 850);
      updateMusicUI();
    } catch { toast("Impossible de démarrer le son. Vérifie les réglages de ton navigateur."); }
  }
  function stopMusic() {
    musicPlaying = false;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (masterGain && audioContext) {
      const now = audioContext.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(0, now, 0.04);
      setTimeout(() => {
        if (!musicPlaying && masterGain && audioContext) {
          masterGain.gain.setTargetAtTime((Number($("#musicVolume")?.value ?? 25) / 100) * 0.5, audioContext.currentTime, 0.05);
        }
      }, 180);
    }
    updateMusicUI();
  }
  $("#musicToggle")?.addEventListener("click", () => {
    const panel = $("#musicPanel");
    if (panel) { panel.hidden = !panel.hidden; document.body.classList.toggle("music-open", !panel.hidden); }
    if (musicPlaying) stopMusic();
  });
  $("#musicClose")?.addEventListener("click", () => { const panel = $("#musicPanel"); if (panel) panel.hidden = true; document.body.classList.remove("music-open"); });
  $("#musicPlay")?.addEventListener("click", () => musicPlaying ? stopMusic() : startMusic());
  $("#musicVolume")?.addEventListener("input", event => {
    const value = Number(event.target.value);
    const label = $("#volumeValue"); if (label) label.textContent = `${value} %`;
    if (masterGain && audioContext) masterGain.gain.setTargetAtTime(value / 100 * 0.5, audioContext.currentTime, 0.04);
  });
  updateMusicUI();
})();
