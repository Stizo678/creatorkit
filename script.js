
const form = document.querySelector("#content-form");
const topicInput = document.querySelector("#topic");
const audienceInput = document.querySelector("#audience");
const platformInput = document.querySelector("#platform");
const toneInput = document.querySelector("#tone");

const results = document.querySelector("#results");
const emptyState = document.querySelector("#empty-state");
const resultActions = document.querySelector("#result-actions");
const subtitle = document.querySelector("#result-subtitle");
const copyButton = document.querySelector("#copy-button");
const downloadButton = document.querySelector("#download-button");
const status = document.querySelector("#status");

let currentIdeas = [];

const formats = [
  {
    name: "Conseil pratique",
    title: s => `3 conseils pour progresser en ${s}`,
    hook: s => `Tu veux progresser en ${s} ? Voici trois conseils à tester.`,
    body: s => `Présente trois conseils concrets sur ${s}. Pour chacun, explique comment l'appliquer et donne un exemple.`,
    cta: "Demande lequel de ces conseils le public va tester."
  },
  {
    name: "Erreur à éviter",
    title: s => `L'erreur fréquente quand on débute en ${s}`,
    hook: s => `Si tu débutes en ${s}, attention à cette erreur.`,
    body: s => `Explique une erreur courante liée à ${s}, ses conséquences et une méthode plus adaptée pour l'éviter.`,
    cta: "Invite les personnes à poser leurs questions."
  },
  {
    name: "Tutoriel",
    title: s => `Un mini-tutoriel ${s} en 3 étapes`,
    hook: s => `Voici une méthode simple pour commencer en ${s}.`,
    body: s => `Décompose une tâche utile liée à ${s} en trois étapes numérotées. Montre un exemple du résultat attendu.`,
    cta: "Propose au public d'enregistrer le tutoriel."
  },
  {
    name: "Mythe ou réalité",
    title: s => `Mythe ou réalité : parlons de ${s}`,
    hook: s => `On entend beaucoup de choses sur ${s}. Faisons le point.`,
    body: s => `Choisis une idée reçue concernant ${s}. Distingue ce qui est vérifiable de ce qui relève d'une opinion, puis explique les nuances.`,
    cta: "Demande au public ce qu'il aimerait vérifier."
  },
  {
    name: "Liste utile",
    title: s => `5 idées utiles autour de ${s}`,
    hook: s => `Voici cinq pistes à explorer si ${s} t'intéresse.`,
    body: s => `Présente cinq outils, méthodes ou ressources en lien avec ${s}. Vérifie les informations et précise à qui chaque suggestion peut servir.`,
    cta: "Invite les personnes à partager leurs propres suggestions."
  },
  {
    name: "Coulisses",
    title: s => `Montre les coulisses de ton projet ${s}`,
    hook: s => `Aujourd'hui, je te montre une étape de mon travail sur ${s}.`,
    body: s => `Présente une étape réelle de préparation, un essai ou un apprentissage autour de ${s}. Si tu n'as pas encore réalisé le projet, montre une démonstration et précise-le.`,
    cta: "Demande quelle étape le public aimerait voir ensuite."
  },
  {
    name: "Question à la communauté",
    title: s => `Une question intéressante sur ${s}`,
    hook: s => `Si tu pouvais améliorer une seule chose en ${s}, laquelle choisirais-tu ?`,
    body: s => `Présente le contexte de cette question et deux ou trois pistes possibles. Laisse une place aux expériences et aux avis différents.`,
    cta: "Invite les personnes à répondre et à expliquer leur choix."
  }
];

const toneDescriptions = {
  accessible: "Utilise des phrases simples et explique les termes difficiles.",
  dynamique: "Utilise un rythme rapide, des phrases courtes et une accroche énergique.",
  professionnel: "Sois précis, structuré et nuancé. Évite les promesses exagérées.",
  humoristique: "Ajoute un humour léger et bienveillant, sans inventer de faits."
};

function createIdea(format, index, topic, audience, platform, tone) {
  let formatTip;

  if (platform === "TikTok") {
    formatTip = "Vidéo verticale courte, avec sous-titres lisibles.";
  } else if (platform === "Instagram") {
    formatTip = "Carrousel ou Reel : choisis selon la complexité du sujet.";
  } else if (platform === "YouTube") {
    formatTip = "Short pour une idée rapide, ou tutoriel plus long si nécessaire.";
  } else {
    formatTip = "Publication structurée avec un exemple et des paragraphes courts.";
  }

  const title = format.title(topic);
  const hook = format.hook(topic);
  const body = format.body(topic);
  const closing = format.cta;

  const script = [
    `ACCROCHE\n${hook}`,
    `DÉVELOPPEMENT\n${body} Adapte les explications au public suivant : ${audience}.`,
    `CONCLUSION\n${closing}`
  ].join("\n\n");

  return {
    day: index + 1,
    format: format.name,
    title,
    hook,
    body: `${body} ${toneDescriptions[tone]}`,
    cta: closing,
    formatTip,
    script
  };
}

function addTextElement(parent, tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function buildIdeaText(idea) {
  return [
    `JOUR ${idea.day} — ${idea.format}`,
    idea.title,
    "",
    idea.script,
    "",
    `FORMAT CONSEILLÉ\n${idea.formatTip}`
  ].join("\n");
}

function buildPlainText(ideas, topic, platform) {
  const heading =
    `CALENDRIER CREATORKIT\nSujet : ${topic}\nPlateforme : ${platform}\n\n`;

  return heading + ideas.map(buildIdeaText).join(
    "\n\n------------------------------\n\n"
  );
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);
    textarea.select();

    let success = false;

    try {
      success = document.execCommand("copy");
    } catch {
      success = false;
    }

    textarea.remove();
    return success;
  }
}

function renderIdeas(ideas) {
  results.replaceChildren();

  ideas.forEach(idea => {
    const card = document.createElement("article");
    card.className = "idea-card";

    const top = document.createElement("div");
    top.className = "idea-top";

    addTextElement(top, "span", "day-label", `JOUR ${idea.day}`);
    addTextElement(top, "span", "format-label", idea.format);
    card.appendChild(top);

    addTextElement(card, "h3", "", idea.title);
    addTextElement(card, "p", "", `Accroche : ${idea.hook}`);
    addTextElement(card, "p", "", `Développement : ${idea.body}`);
    addTextElement(card, "p", "", `Conclusion : ${idea.cta}`);
    addTextElement(card, "p", "", `Format : ${idea.formatTip}`);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "idea-copy-button";
    button.textContent = "Copier cette idée";

    button.addEventListener("click", async () => {
      const success = await copyText(buildIdeaText(idea));
      status.textContent = success
        ? `Idée ${idea.day} copiée !`
        : "Copie impossible. Essaie le téléchargement TXT.";
    });

    card.appendChild(button);
    results.appendChild(card);
  });

  emptyState.hidden = true;
  results.hidden = false;
  resultActions.hidden = false;
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const topic = topicInput.value.trim();

  if (!topic) {
    topicInput.focus();
    return;
  }

  const audience = audienceInput.value.trim() || "Débutants";
  const platform = platformInput.value;
  const tone = toneInput.value;

  currentIdeas = formats.map((format, index) =>
    createIdea(format, index, topic, audience, platform, tone)
  );

  renderIdeas(currentIdeas);
  subtitle.textContent = `7 idées pour ${platform} · Sujet : ${topic}`;
  status.textContent = "";
});

copyButton.addEventListener("click", async () => {
  if (currentIdeas.length === 0) return;

  const text = buildPlainText(
    currentIdeas,
    topicInput.value.trim(),
    platformInput.value
  );

  const success = await copyText(text);

  status.textContent = success
    ? "Calendrier complet copié !"
    : "Copie impossible. Essaie le téléchargement TXT.";
});

downloadButton.addEventListener("click", () => {
  if (currentIdeas.length === 0) return;

  const text = buildPlainText(
    currentIdeas,
    topicInput.value.trim(),
    platformInput.value
  );

  const blob = new Blob(["\uFEFF", text], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "calendrier-creatorkit.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = "Téléchargement lancé !";
});
