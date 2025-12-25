let combos = JSON.parse(localStorage.getItem('hellgen_clean_unverified_combos') || '[]');
let settings = JSON.parse(localStorage.getItem('hellgen_settings') || '{}');
settings.selfDestruct ??= false; settings.delay ??= 5; settings.autoNext ??= false; settings.unverifiedOnly ??= true;

const comboRegex = /combo:([\S]+):([\S]+?)(?=\s*cooldown:|\s*$)/gi;
const verifiedNoRegex = /Verified\s*:\s*No/i;

function extractCombos(text) {
  let match, found = [];
  while ((match = comboRegex.exec(text)) !== null) {
    let username = match[1].trim();
    let password = match[2].trim().replace(/\s*cooldown.*$/i, '');
    if (/roblox$/i.test(password)) password = password.slice(0, -6);
    const combo = `${username}:${password}`;
    if (combos.includes(combo)) continue;
    const context = text.slice(Math.max(0, match.index - 600), match.index + match[0].length + 600);
    const isUnverified = verifiedNoRegex.test(context);
    if (!settings.unverifiedOnly || isUnverified) {
      combos.unshift(combo);
      found.push(combo);
    }
  }
  if (found.length) {
    if (combos.length > 100) combos = combos.slice(0, 100);
    localStorage.setItem('hellgen_clean_unverified_combos', JSON.stringify(combos));
    console.log(`[Hellgen] Found ${found.length} combos:`, found);
  }
  return found;
}

let currentTimer = null, isWaiting = false;
function findGenerateButton() {
  return [...document.querySelectorAll('button, [role="button"], .btn')]
    .find(b => b.textContent?.toLowerCase().trim().includes('generate another') || b.textContent?.toLowerCase().trim().includes('gen another'));
}
function startTimer(button) {
  if (currentTimer || isWaiting || !settings.autoNext) return;
  isWaiting = true;
  let timeLeft = settings.delay;
  currentTimer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(currentTimer); currentTimer = null; isWaiting = false;
      button?.click();
    }
  }, 1000);
}

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 3) extractCombos(node.textContent || '');
      else if (node.nodeType === 1 && node.textContent) extractCombos(node.textContent);
    });
    if (mutation.type === 'characterData') extractCombos(mutation.target.textContent || '');
  });
  const button = findGenerateButton();
  if (button && !isWaiting && !currentTimer) startTimer(button);
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  extractCombos(document.body.innerText || '');
}
setInterval(() => {
  extractCombos(document.body?.innerText || '');
  const button = findGenerateButton();
  if (button && !isWaiting && !currentTimer) startTimer(button);
}, 1200);
