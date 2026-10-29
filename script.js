
"use strict";

const STORAGE_KEY = "creatorkit_saved_v2";
const MAX_SAVES = 50;

const form = document.getElementById("generatorForm");
const topicInput = document.getElementById("topic");
const platformInput = document.getElementById("platform");
const goalInput = document.getElementById("goal");
const formatInput = document.getElementById("format");
const toneInput = document.getElementById("tone");
const audienceInput = document.getElementById("audience");
const durationInput = document.getElementById("duration");
const extraInput = document.getElementById("extra");

const promptOutput = document.getElementById("promptOutput");
const promptWordCount = document.getElementById("promptWordCount");
const ideasGrid = document.getElementById("ideasGrid");
const ideasCount = document.getElementById("ideasCount");

const copyPromptBtn = document.getElementById("copyPromptBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const copyAllBtn = document.getElementById("copyAllBtn");
const downloadBtn = document.getElementById("downloadBtn");
const saveBtn = document.getElementById("saveBtn");

const copyStatus = document.getElementById("copyStatus");
const ideasStatus = document.getElementById("ideasStatus");
const savedStatus = document.getElementById("savedStatus");
const savedList = document.getElementById("savedList");
const savedCount = document.getElementById("savedCount");

let currentIdeas = [];
let currentPrompt = "";
let currentBrief = null;

document.getElementById("currentYear").textContent =
  String(new Date().getFullYear());

/* -------------------------------------------------------
   1. OUTILS
------------------------------------------------------- */

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeTopic(value) {
  return cleanText(value).replace(/\s+/g, " ");
}

function getBrief() {
  return {
    topic: normalizeTopic(topicInput.value),
    platform: platformInput.value,
    goal: goalInput.value,
    format: formatInput.value,
    tone: toneInput.value,
    audience: audienceInput.value,
    duration: durationInput.value,
    extra: cleanText(extraInput.value)
  };
}

function pluralize(count, singular, plural = singular + "s") {
  return count + " " + (count > 1 ? plural : singular);
}

function countWords(text) {
  const trimmed = cleanText(text);
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function setStatus(element, message, isError = false) {
  element.textContent = message;
  element.style.color = isError ? "#b45669" : "";
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function slugify(value) {
  const result = cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 55);

  return result || "creatorkit";
}

/* -------------------------------------------------------
   2. CONSTRUCTION DU PROMPT
------------------------------------------------------- */

function getPlatformGuidance(platform) {
  const guidance = {
    TikTok:
      "Commence par une accroche immédiate, utilise des phrases orales et rythmées, privilégie un seul message central et termine par une action simple. Prévois une progression visuelle adaptée à une vidéo verticale.",

    Instagram:
      "Privilégie une accroche visuelle, un message facile à retenir et une présentation adaptée aux usages Instagram. Si le format s'y prête, suggère des éléments de texte à afficher à l'écran.",

    YouTube:
      "Construis une progression claire, une promesse compréhensible et une structure qui maintient l'intérêt. Évite les promesses exagérées et propose un titre cohérent avec le contenu.",

    LinkedIn:
      "Adopte une approche claire et professionnelle, apporte un enseignement concret et relie le sujet à une situation réelle. Favorise la crédibilité plutôt que les formules sensationnalistes."
  };

  return guidance[platform] || guidance.TikTok;
}

function getFormatInstructions(format) {
  const instructions = {
    "Script vidéo":
      "Rédige un script avec une accroche, des séquences distinctes, les paroles à prononcer, des suggestions de visuels ou de plans, puis une conclusion avec un appel à l'action.",

    "Liste d'idées":
      "Propose une liste numérotée d'idées différentes. Pour chaque idée, donne un titre, un angle précis, une accroche et une courte explication.",

    "Tutoriel":
      "Organise le contenu en étapes progressives. Pour chaque étape, précise ce qu'il faut faire et donne un exemple concret. Termine par un récapitulatif.",

    "Storytelling":
      "Construis un récit avec une situation de départ, un problème, un déclic et une conclusion utile. N'invente pas d'expérience personnelle réelle attribuée au créateur.",

    "Carrousel":
      "Propose un plan diapositive par diapositive. Chaque diapositive doit avoir un titre court, un message principal et, si utile, une suggestion visuelle.",

    "Publication écrite":
      "Rédige une publication structurée avec une première phrase accrocheuse, un développement facile à lire et une conclusion cohérente avec l'objectif."
  };

  return instructions[format] || instructions["Script vidéo"];
}

function getToneInstructions(tone) {
  const instructions = {
    Dynamique:
      "Utilise un rythme énergique, des formulations directes et des phrases vivantes, sans en faire trop.",

    Pédagogique:
      "Explique les idées avec clarté, donne des exemples et rends les notions faciles à comprendre.",

    Humoristique:
      "Utilise un humour accessible et pertinent, sans moquerie blessante ni blague forcée.",

    Professionnel:
      "Adopte un ton précis, crédible et structuré, avec un vocabulaire adapté au domaine.",

    Inspirant:
      "Mets en avant les possibilités de progression et donne envie d'agir sans promettre de résultats garantis.",

    Décontracté:
      "Utilise un langage naturel, accessible et conversationnel, comme dans une discussion."
  };

  return instructions[tone] || instructions.Dynamique;
}

function getAudienceInstructions(audience) {
  const instructions = {
    Débutant:
      "Pars des bases, définis les termes techniques et évite de supposer que le public possède déjà des connaissances.",

    Intermédiaire:
      "Considère que le public connaît déjà les bases. Propose des méthodes applicables, des exemples précis et quelques astuces moins évidentes.",

    Avancé:
      "Privilégie les nuances, les stratégies approfondies, les compromis et les exemples techniques pertinents. Évite les explications trop élémentaires.",

    "Grand public":
      "Privilégie les explications universellement accessibles, les exemples de la vie courante et les formulations simples."
  };

  return instructions[audience] || instructions.Intermédiaire;
}

function getGoalInstructions(goal) {
  const instructions = {
    "Trouver des idées originales":
      "Cherche des angles spécifiques et variés. Évite les idées génériques et reformule les sujets classiques avec une perspective nouvelle.",

    "Éduquer mon audience":
      "Apporte un apprentissage clair, une méthode pratique et un exemple que le public peut essayer.",

    "Divertir mon audience":
      "Privilégie une situation reconnaissable, un contraste surprenant ou une idée amusante qui reste pertinente par rapport au sujet.",

    "Développer ma communauté":
      "Propose un contenu qui aide les personnes visées à se reconnaître, à partager leurs expériences et à participer à une conversation.",

    "Présenter un produit ou service":
      "Montre le problème auquel le produit ou service répond, son utilité concrète et ses limites éventuelles. Évite les affirmations invérifiables.",

    "Augmenter les interactions":
      "Propose une question ou une invitation à réagir qui soit directement liée au sujet et qui ne pousse pas artificiellement à l'engagement."
  };

  return instructions[goal] || instructions["Trouver des idées originales"];
}

function buildPrompt(brief) {
  const parts = [
    "Tu es un assistant de conception de contenu pour créateurs. Aide-moi à préparer un contenu original et exploitable.",
    "",
    "MON BRIEF",
    "- Sujet : " + brief.topic,
    "- Plateforme : " + brief.platform,
    "- Objectif : " + brief.goal,
    "- Format : " + brief.format,
    "- Ton : " + brief.tone,
    "- Public visé : " + brief.audience,
    "- Durée ou longueur : " + brief.duration,
    "",
    "CONSIGNES PERSONNALISÉES",
    "1. " + getGoalInstructions(brief.goal),
    "2. " + getFormatInstructions(brief.format),
    "3. " + getToneInstructions(brief.tone),
    "4. " + getAudienceInstructions(brief.audience),
    "5. " + getPlatformGuidance(brief.platform)
  ];

  if (brief.extra) {
    parts.push(
      "",
      "MES PRÉCISIONS SUPPLÉMENTAIRES",
      brief.extra
    );
  }

  parts.push(
    "",
    "RÉSULTAT ATTENDU",
    "Présente une proposition concrète, spécifique au sujet et adaptée aux contraintes ci-dessus. Évite les répétitions, les banalités, les informations inventées et les promesses de résultats garantis.",
    "Si une information essentielle manque, signale brièvement l'hypothèse retenue au lieu de la présenter comme un fait.",
    "Organise la réponse pour que je puisse facilement réutiliser ou modifier le contenu."
  );

  return parts.join("\n");
}

/* -------------------------------------------------------
   3. GÉNÉRATION LOCALE DES IDÉES
   Ces modèles ne font aucun appel à une IA externe.
------------------------------------------------------- */

function buildIdeas(brief) {
  const topic = brief.topic;
  const platform = brief.platform;
  const format = brief.format;

  const ideaTemplates = [
    {
      title: "L'erreur que beaucoup de créateurs commettent",
      hook: "Tu fais peut-être cette erreur sans t'en rendre compte.",
      description:
        "Présente une erreur fréquente liée à « " + topic +
        " », explique pourquoi elle arrive et montre une façon concrète de l'éviter.",
      cta: "Demande au public quelle difficulté il rencontre le plus souvent."
    },
    {
      title: "3 façons de faire autrement",
      hook: "Et si tu essayais ces trois approches ?",
      description:
        "Propose trois méthodes différentes autour de « " + topic +
        " ». Donne un exemple pour chacune et précise dans quel cas elle peut être utile.",
      cta: "Invite les personnes à choisir l'approche qu'elles veulent tester."
    },
    {
      title: "Avant et après : une méthode améliorée",
      hook: "Voici comment rendre cette méthode plus efficace.",
      description:
        "Compare une approche classique de « " + topic +
        " » à une version mieux structurée. Explique les changements et les compromis.",
      cta: "Propose au public de partager sa propre méthode."
    },
    {
      title: "Le mini-défi pratique",
      hook: "Teste ça lors de ta prochaine session.",
      description:
        "Crée un petit exercice lié à « " + topic +
        " » que le public peut réaliser rapidement, avec une consigne claire et un résultat à observer.",
      cta: "Invite le public à essayer le défi et à raconter son expérience."
    },
    {
      title: "Une idée reçue à remettre en question",
      hook: "On entend souvent ça… mais est-ce toujours vrai ?",
      description:
        "Choisis une idée reçue liée à « " + topic +
        " ». Présente ce qui peut être vrai, ce qui dépend du contexte et un exemple nuancé.",
      cta: "Pose une question ouverte pour recueillir différents points de vue."
    },
    {
      title: "La méthode en étapes simples",
      hook: "Voici une méthode claire pour t'y mettre.",
      description:
        "Décompose « " + topic +
        " » en trois étapes progressives. Pour chaque étape, donne une action réalisable et un exemple.",
      cta: "Invite le public à enregistrer la méthode pour la retrouver."
    },
    {
      title: "La question que l'on oublie de poser",
      hook: "Avant de commencer, pose-toi cette question.",
      description:
        "Pars d'une question souvent négligée autour de « " + topic +
        " ». Explique pourquoi elle compte et montre comment la réponse peut modifier la démarche.",
      cta: "Demande au public quelle question il ajouterait."
    }
  ];

  return ideaTemplates.map((template, index) => {
    const hook = adaptHook(template.hook, brief);
    const description = adaptDescription(template.description, brief);
    const cta = adaptCTA(template.cta, brief);

    return {
      id: makeId(),
      number: index + 1,
      title: template.title,
      hook,
      description,
      cta,
      platform,
      format,
      goal: brief.goal,
      tone: brief.tone,
      audience: brief.audience,
      topic
    };
  });
}

function adaptHook(hook, brief) {
  if (brief.tone === "Professionnel") {
    return hook
      .replace("Tu fais peut-être", "Une erreur fréquente consiste peut-être à")
      .replace("Et si tu essayais", "Trois approches méritent d'être explorées")
      .replace("Teste ça lors de ta prochaine session.", "Voici un exercice à tester lors de ta prochaine session.");
  }

  if (brief.tone === "Pédagogique") {
    return hook
      .replace("Tu fais peut-être cette erreur sans t'en rendre compte.", "Voyons comment repérer et corriger cette erreur.")
      .replace("On entend souvent ça… mais est-ce toujours vrai ?", "Examinons cette idée reçue et ses limites.");
  }

  if (brief.tone === "Décontracté") {
    return hook
      .replace("Tu fais peut-être cette erreur sans t'en rendre compte.", "Petit point à vérifier dans ta méthode.")
      .replace("Voici une méthode claire pour t'y mettre.", "On regarde une méthode simple pour commencer.");
  }

  if (brief.tone === "Humoristique") {
    return hook
      .replace("Tu fais peut-être cette erreur sans t'en rendre compte.", "Cette erreur s'invite parfois sans prévenir.")
      .replace("Voici comment rendre cette méthode plus efficace.", "On va essayer de faire mieux sans compliquer les choses.");
  }

  if (brief.tone === "Inspirant") {
    return hook
      .replace("Tu fais peut-être cette erreur sans t'en rendre compte.", "Une petite amélioration peut changer ta façon d'avancer.")
      .replace("Teste ça lors de ta prochaine session.", "Accorde-toi quelques minutes pour essayer cette méthode.");
  }

  return hook;
}

function adaptDescription(description, brief) {
  let result = description;

  if (brief.audience === "Débutant") {
    result += " Définis les termes utiles et accompagne chaque étape d'un exemple simple.";
  } else if (brief.audience === "Avancé") {
    result += " Ajoute une nuance avancée, une limite ou un cas particulier pour enrichir l'analyse.";
  } else if (brief.audience === "Grand public") {
    result += " Utilise des situations courantes et évite le jargon inutile.";
  } else {
    result += " Va au-delà des bases avec un exemple pratique et un conseil immédiatement applicable.";
  }

  if (brief.goal === "Éduquer mon audience") {
    result += " Mets en évidence ce que le public pourra apprendre.";
  } else if (brief.goal === "Divertir mon audience") {
    result += " Cherche une présentation vivante et une situation facile à reconnaître.";
  } else if (brief.goal === "Développer ma communauté") {
    result += " Fais le lien avec une expérience commune au public visé.";
  } else if (brief.goal === "Présenter un produit ou service") {
    result += " Si un produit est concerné, illustre son utilité sans inventer de caractéristiques.";
  } else if (brief.goal === "Augmenter les interactions") {
    result += " Intègre une question authentique qui facilite les réponses.";
  }

  return result;
}

function adaptCTA(cta, brief) {
  if (brief.platform === "LinkedIn") {
    return cta.replace("Invite le public", "Invite les lecteurs");
  }

  if (brief.platform === "YouTube") {
    return cta.replace("le public", "les spectateurs");
  }

  if (brief.platform === "Instagram") {
    return cta.replace("le public", "la communauté");
  }

  return cta;
}

/* -------------------------------------------------------
   4. AFFICHAGE DES IDÉES
------------------------------------------------------- */

function renderIdeas() {
  ideasGrid.innerHTML = "";

  if (!currentIdeas.length) {
    ideasGrid.innerHTML = `
      <div class="empty-state">
        <strong>Aucune idée pour le moment</strong>
        <p>Complète ton sujet pour construire une nouvelle sélection.</p>
      </div>
    `;

    ideasCount.textContent = "0 IDÉE";
    return;
  }

  ideasCount.textContent = currentIdeas.length + " IDÉES";

  currentIdeas.forEach((idea) => {
    const card = document.createElement("article");
    card.className = "idea-card";

    card.innerHTML = `
      <div class="idea-topline">
        <span class="idea-number">${idea.number}</span>
        <span class="idea-format">${escapeHTML(idea.format.toUpperCase())}</span>
      </div>

      <h3>${escapeHTML(idea.title)}</h3>

      <div class="idea-hook">${escapeHTML(idea.hook)}</div>

      <p class="idea-description">${escapeHTML(idea.description)}</p>

      <p class="idea-cta">
        <strong>Appel à l'action :</strong>
        ${escapeHTML(idea.cta)}
      </p>

      <div class="idea-actions">
        <button
          class="button button-secondary"
          type="button"
          data-action="copy-idea"
          data-id="${escapeHTML(idea.id)}"
        >▣ Copier</button>

        <button
          class="button button-secondary"
          type="button"
          data-action="prompt-idea"
          data-id="${escapeHTML(idea.id)}"
        >Créer un prompt pour cette idée</button>
      </div>
    `;

    ideasGrid.appendChild(card);
  });
}

function ideaToText(idea) {
  return [
    idea.number + ". " + idea.title,
    "",
    "Accroche : " + idea.hook,
    "",
    "Développement : " + idea.description,
    "",
    "Appel à l'action : " + idea.cta,
    "",
    "Plateforme : " + idea.platform,
    "Format : " + idea.format
  ].join("\n");
}

function allIdeasToText() {
  const header = [
    "CREATORKIT — MA BOÎTE À IDÉES",
    "Sujet : " + (currentBrief?.topic || ""),
    "Plateforme : " + (currentBrief?.platform || ""),
    "Objectif : " + (currentBrief?.goal || ""),
    "Format : " + (currentBrief?.format || ""),
    "Ton : " + (currentBrief?.tone || ""),
    "Public : " + (currentBrief?.audience || ""),
    "",
    "PROMPT PERSONNALISÉ",
    currentPrompt,
    "",
    "IDÉES"
  ];

  return header.concat(
    currentIdeas.map(ideaToText)
  ).join("\n\n------------------------------\n\n");
}

/* -------------------------------------------------------
   5. SAUVEGARDE LOCALE
------------------------------------------------------- */

function readSavedItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) => {
      return item &&
        typeof item.id === "string" &&
        typeof item.topic === "string" &&
        typeof item.prompt === "string" &&
        Array.isArray(item.ideas);
    });
  } catch (error) {
    console.warn("Impossible de lire les sauvegardes CreatorKit.", error);
    return [];
  }
}

function writeSavedItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error("Impossible d'enregistrer les sauvegardes.", error);
    setStatus(
      savedStatus,
      "La sauvegarde a échoué. Vérifie l'espace disponible ou les réglages du navigateur.",
      true
    );
    return false;
  }
}

function renderSavedItems() {
  const items = readSavedItems();

  savedList.innerHTML = "";
  savedCount.textContent =
    items.length + (items.length > 1 ? " SAUVEGARDES" : " SAUVEGARDE");

  if (!items.length) {
    savedList.innerHTML = `
      <div class="empty-state">
        <strong>Ta bibliothèque est encore vide.</strong>
        <p>Utilise le bouton « Sauvegarder » pour conserver ton prompt et tes idées sur cet appareil.</p>
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "saved-card";

    const summary = [
      item.platform,
      item.format,
      item.tone,
      item.audience
    ].filter(Boolean).join(" · ");

    card.innerHTML = `
      <div class="saved-card-header">
        <div>
          <h3>${escapeHTML(item.topic)}</h3>
          <span class="saved-date">${escapeHTML(formatDate(item.createdAt))}</span>
        </div>
      </div>

      <p class="saved-summary">
        ${escapeHTML(summary)}<br>
        ${item.ideas.length} idées sauvegardées
      </p>

      <div class="saved-actions">
        <button
          class="button button-secondary"
          type="button"
          data-action="load-save"
          data-id="${escapeHTML(item.id)}"
        >Charger</button>

        <button
          class="button button-secondary"
          type="button"
          data-action="copy-save"
          data-id="${escapeHTML(item.id)}"
        >Copier le prompt</button>

        <button
          class="button button-secondary delete-button"
          type="button"
          data-action="delete-save"
          data-id="${escapeHTML(item.id)}"
        >Supprimer</button>
      </div>
    `;

    savedList.appendChild(card);
  });
}

function saveCurrentIdeas() {
  if (!currentBrief || !currentPrompt || !currentIdeas.length) {
    setStatus(ideasStatus, "Génère d'abord un prompt et des idées.", true);
    return;
  }

  const items = readSavedItems();

  const entry = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    ...currentBrief,
    prompt: currentPrompt,
    ideas: currentIdeas
  };

  items.unshift(entry);

  if (!writeSavedItems(items.slice(0, MAX_SAVES))) {
    return;
  }

  renderSavedItems();
  setStatus(ideasStatus, "Prompt et idées sauvegardés sur cet appareil.");
  setStatus(savedStatus, "Nouvelle sauvegarde ajoutée.");
}

function loadSavedItem(id) {
  const item = readSavedItems().find((entry) => entry.id === id);

  if (!item) {
    setStatus(savedStatus, "Cette sauvegarde est introuvable.", true);
    renderSavedItems();
    return;
  }

  topicInput.value = item.topic || "";
  platformInput.value = item.platform || "TikTok";
  goalInput.value = item.goal || "Trouver des idées originales";
  formatInput.value = item.format || "Script vidéo";
  toneInput.value = item.tone || "Dynamique";
  audienceInput.value = item.audience || "Intermédiaire";
  durationInput.value = item.duration || "30 secondes environ";
  extraInput.value = item.extra || "";

  currentBrief = getBrief();
  currentPrompt = item.prompt;
  currentIdeas = item.ideas;

  promptOutput.value = currentPrompt;
  updatePromptWordCount();
  renderIdeas();

  setStatus(savedStatus, "Sauvegarde chargée.");
  setStatus(copyStatus, "");
  setStatus(ideasStatus, "");

  document.getElementById("generator").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function deleteSavedItem(id) {
  const items = readSavedItems();
  const remaining = items.filter((item) => item.id !== id);

  if (remaining.length === items.length) {
    setStatus(savedStatus, "Cette sauvegarde est introuvable.", true);
    return;
  }

  if (!writeSavedItems(remaining)) return;

  renderSavedItems();
  setStatus(savedStatus, "Sauvegarde supprimée.");
}

/* -------------------------------------------------------
   6. COPIE ET EXPORT
------------------------------------------------------- */

async function copyText(text) {
  if (!text) {
    throw new Error("Aucun texte à copier.");
  }

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporary = document.createElement("textarea");
  temporary.value = text;
  temporary.setAttribute("readonly", "");
  temporary.style.position = "fixed";
  temporary.style.left = "-9999px";
  temporary.style.top = "0";

  document.body.appendChild(temporary);
  temporary.select();
  temporary.setSelectionRange(0, temporary.value.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } finally {
    temporary.remove();
  }

  if (!copied) {
    throw new Error("La copie automatique n'est pas disponible dans ce navigateur.");
  }
}

async function handleCopy(text, statusElement, successMessage) {
  try {
    await copyText(text);
    setStatus(statusElement, successMessage);
  } catch (error) {
    console.error(error);
    setStatus(
      statusElement,
      "Copie impossible. Sélectionne le texte et copie-le manuellement.",
      true
    );
  }
}

function downloadTextFile() {
  const content = allIdeasToText();
  const blob = new Blob(
    ["\uFEFF", content],
    { type: "text/plain;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "creatorkit-" + slugify(currentBrief?.topic || "idees") + ".txt";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  setStatus(ideasStatus, "Export texte préparé.");
}

function updatePromptWordCount() {
  const count = countWords(promptOutput.value);
  promptWordCount.textContent = pluralize(count, "mot");
}

/* -------------------------------------------------------
   7. GÉNÉRATION ET ÉVÉNEMENTS
------------------------------------------------------- */

function generateContent() {
  const brief = getBrief();

  if (!brief.topic) {
    topicInput.setCustomValidity("Entre un sujet pour générer ton contenu.");
    topicInput.reportValidity();
    topicInput.setCustomValidity("");
    topicInput.focus();
    return false;
  }

  currentBrief = brief;
  currentPrompt = buildPrompt(brief);
  currentIdeas = buildIdeas(brief);

  promptOutput.value = currentPrompt;
  updatePromptWordCount();
  renderIdeas();

  setStatus(copyStatus, "");
  setStatus(ideasStatus, "Prompt et " + currentIdeas.length + " idées préparés.");
  setStatus(savedStatus, "");

  return true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (generateContent()) {
    setStatus(copyStatus, "Ton prompt a été actualisé.");
  }
});

regenerateBtn.addEventListener("click", () => {
  generateContent();
});

copyPromptBtn.addEventListener("click", () => {
  handleCopy(
    currentPrompt,
    copyStatus,
    "Prompt copié. Tu peux maintenant le coller dans ton assistant IA."
  );
});

copyAllBtn.addEventListener("click", () => {
  handleCopy(
    allIdeasToText(),
    ideasStatus,
    "Le prompt et toutes les idées ont été copiés."
  );
});

downloadBtn.addEventListener("click", downloadTextFile);
saveBtn.addEventListener("click", saveCurrentIdeas);

ideasGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const idea = currentIdeas.find((item) => item.id === id);

  if (!idea) return;

  if (action === "copy-idea") {
    await handleCopy(
      ideaToText(idea),
      ideasStatus,
      "Idée copiée."
    );
  }

  if (action === "prompt-idea") {
    const specificPrompt = [
      "Tu es un assistant de conception de contenu.",
      "",
      "Développe cette idée en respectant mon brief.",
      "Sujet : " + currentBrief.topic,
      "Plateforme : " + currentBrief.platform,
      "Objectif : " + currentBrief.goal,
      "Format : " + currentBrief.format,
      "Ton : " + currentBrief.tone,
      "Public : " + currentBrief.audience,
      "Durée ou longueur : " + currentBrief.duration,
      "",
      "IDÉE À DÉVELOPPER",
      ideaToText(idea),
      "",
      "CONSIGNES",
      getPlatformGuidance(currentBrief.platform),
      getFormatInstructions(currentBrief.format),
      getToneInstructions(currentBrief.tone),
      getAudienceInstructions(currentBrief.audience),
      currentBrief.extra ? "Précisions : " + currentBrief.extra : "",
      "",
      "Produis une version concrète, structurée et prête à être retravaillée."
    ].filter(Boolean).join("\n");

    currentPrompt = specificPrompt;
    promptOutput.value = specificPrompt;
    updatePromptWordCount();

    setStatus(copyStatus, "Prompt spécifique à cette idée créé.");
    document.getElementById("generator").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});

savedList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const { action, id } = button.dataset;
  const item = readSavedItems().find((entry) => entry.id === id);

  if (action === "load-save") {
    loadSavedItem(id);
  }

  if (action === "delete-save") {
    deleteSavedItem(id);
  }

  if (action === "copy-save" && item) {
    handleCopy(
      item.prompt,
      savedStatus,
      "Prompt de la sauvegarde copié."
    );
  }
});

/* -------------------------------------------------------
   8. INITIALISATION
------------------------------------------------------- */

generateContent();
renderSavedItems();
