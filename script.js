/* ============================================================
   KIVOKORA — interactions
   ============================================================ */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Nav scroll state ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ---------- Mobile nav burger (simple inline menu toggle) ---------- */
const burger = document.getElementById('navBurger');
burger.addEventListener('click', () => {
  const links = document.querySelector('.nav-links');
  const isOpen = links.style.display === 'flex';
  links.style.cssText = isOpen
    ? ''
    : 'display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:#fff;padding:20px 24px;gap:16px;box-shadow:0 20px 40px -20px rgba(13,18,64,.25);border-radius:0 0 18px 18px;';
});
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => {
  if (window.innerWidth <= 760) document.querySelector('.nav-links').style.display = '';
}));

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const delay = (entry.target.dataset.groupIndex || 0) * 70;
      setTimeout(() => entry.target.classList.add('is-visible'), delay);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

// Stagger elements that share a parent section for a nicer cascade
document.querySelectorAll('section').forEach(section => {
  const items = section.querySelectorAll('.reveal');
  items.forEach((el, i) => { el.dataset.groupIndex = i % 6; });
});
revealEls.forEach(el => io.observe(el));

/* ---------- Orbit layout generator ---------- */
function layoutOrbit(container, nodeSelector, lineSelector, radiusPct) {
  const nodes = container.querySelectorAll(nodeSelector);
  const svg = container.querySelector(lineSelector);
  const vb = svg.viewBox.baseVal;
  const cx = vb.width / 2, cy = vb.height / 2;
  const r = vb.width * radiusPct;

  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    const xPct = 50 + Math.cos(angle) * radiusPct * 100;
    const yPct = 50 + Math.sin(angle) * radiusPct * 100;
    node.style.left = xPct + '%';
    node.style.top = yPct + '%';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', cx);
    line.setAttribute('y1', cy);
    line.setAttribute('x2', cx + Math.cos(angle) * r);
    line.setAttribute('y2', cy + Math.sin(angle) * r);
    svg.appendChild(line);

    // staggered reveal
    setTimeout(() => node.classList.add('placed'), 200 + i * 90);
  });
}

const heroOrbit = document.getElementById('heroOrbit');
if (heroOrbit && window.innerWidth > 760) {
  layoutOrbit(heroOrbit, '.orbit-node', '.orbit-lines', 0.42);
}

const servicesOrbit = document.getElementById('servicesOrbit');
if (servicesOrbit && window.innerWidth > 760) {
  layoutOrbit(servicesOrbit, '.service-node', '.services-lines', 0.4);
}

/* ---------- Timeline progress fill ---------- */
const timelineFill = document.getElementById('timelineFill');
const timelineSection = document.querySelector('.timeline');
if (timelineFill && timelineSection) {
  window.addEventListener('scroll', () => {
    const rect = timelineSection.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh * 0.4)));
    timelineFill.style.width = (progress * 100) + '%';
  }, { passive: true });
}

/* ============================================================
   CHATBOT — "Kiva", rule-based assistant
   ============================================================ */
const chatbot = document.getElementById('chatbot');
const chatToggle = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatQuick = document.getElementById('chatQuick');

const QUICK_REPLIES = [
  { label: 'What services do you offer?', key: 'services' },
  { label: 'How does the process work?', key: 'process' },
  { label: 'What does it cost?', key: 'pricing' },
  { label: 'Book a free audit', key: 'book' }
];

const KB = [
  {
    keys: ['service', 'offer', 'what do you do', 'brand', 'website', 'seo', 'ads', 'social', 'automation', 'marketplace'],
    reply: "Kivokora runs your entire digital business under one roof: Brand & Design, Websites, Performance Marketing, Social Media, Search & Visibility (SEO), Marketplace Growth, Automation & CRM, and Analytics & Growth. One team handles all of it, so nothing gets lost between vendors."
  },
  {
    keys: ['process', 'how does it work', 'steps', 'work with you', 'onboarding'],
    reply: "We follow 8 connected steps: Discover → Audit → Strategy → Build → Launch → Grow → Optimize → Scale. You can see the full breakdown in the 'Process' section above — every stage feeds the next, so nothing is built in isolation."
  },
  {
    keys: ['price', 'pricing', 'cost', 'how much', 'budget', 'fee'],
    reply: "Pricing depends on which pillars your business needs right now — most clients start with a Foundation package (brand + website + one growth channel) and expand from there. The best next step is a free Growth Audit, where we scope this out for your business specifically and give you real numbers."
  },
  {
    keys: ['book', 'audit', 'call', 'meeting', 'talk to', 'contact', 'strategy session', 'consult'],
    reply: "I'd love to set that up. Tap 'Book Your Free Growth Audit' at the top of the page (or the button in the final section) — it's a free, no-pressure session where we map out an actionable roadmap for your business."
  },
  {
    keys: ['different', 'why kivokora', 'why you', 'vs agency', 'traditional agency', 'better than'],
    reply: "Most businesses end up hiring 4-5 different vendors — a logo agency, a website team, an ads freelancer, an SEO agency — all with different goals and zero accountability. Kivokora replaces that with one team, one strategy, one dashboard, and one goal: your business growth."
  },
  {
    keys: ['time', 'how long', 'timeline', 'duration'],
    reply: "It varies by scope, but most businesses see their Foundation (brand + website + first growth channel) live within 3-6 weeks, then move into ongoing Growth and Optimization. We'll give you a concrete timeline during your free audit."
  },
  {
    keys: ['industries', 'niche', 'type of business', 'who do you work with'],
    reply: "We work with growing businesses across e-commerce, local services, D2C brands, and B2B companies — basically anyone who's tired of managing five different vendors instead of one growth partner."
  },
  {
    keys: ['human', 'real person', 'talk to someone', 'agent'],
    reply: "Happy to connect you with the team — the fastest way is booking a free Growth Audit using the button above. A real strategist will walk through your business with you."
  },
  {
    keys: ['hello', 'hi', 'hey', 'yo'],
    reply: "Hey! I'm Kiva, Kivokora's assistant. Ask me about our services, our process, pricing, or how to book a free growth audit."
  },
  {
    keys: ['thank', 'thanks', 'great', 'awesome', 'cool'],
    reply: "Anytime! If you want a tailored growth plan, booking your free audit is the best next step 🚀"
  }
];

const FALLBACK = "Good question — I don't have a scripted answer for that yet, but the team can help directly. Try booking a free Growth Audit, or ask me about our services, process, pricing, or what makes Kivokora different.";

function addMessage(text, sender) {
  const el = document.createElement('div');
  el.className = 'msg ' + (sender === 'user' ? 'msg-user' : 'msg-bot');
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'msg-typing';
  el.id = 'typingIndicator';
  el.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function botReply(userText) {
  const t = userText.toLowerCase();
  let match = KB.find(entry => entry.keys.some(k => t.includes(k)));
  const reply = match ? match.reply : FALLBACK;
  showTyping();
  setTimeout(() => {
    hideTyping();
    addMessage(reply, 'bot');
  }, 550 + Math.random() * 400);
}

function renderQuickReplies() {
  chatQuick.innerHTML = '';
  QUICK_REPLIES.forEach(q => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.textContent = q.label;
    chip.addEventListener('click', () => handleUserMessage(q.label));
    chatQuick.appendChild(chip);
  });
}

function handleUserMessage(text) {
  if (!text.trim()) return;
  addMessage(text, 'user');
  chatInput.value = '';
  botReply(text);
}

let chatInitialized = false;
function initChat() {
  if (chatInitialized) return;
  chatInitialized = true;
  addMessage("Hi, I'm Kiva 👋 — Kivokora's assistant. Ask me about our services, process, pricing, or how to book your free growth audit.", 'bot');
  renderQuickReplies();
}

chatToggle.addEventListener('click', () => {
  chatbot.classList.toggle('open');
  if (chatbot.classList.contains('open')) {
    initChat();
    setTimeout(() => chatInput.focus(), 300);
  }
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleUserMessage(chatInput.value);
});

/* ---------- CTA buttons open the chat ready to book ---------- */
document.querySelectorAll('a[href="#audit"], #ctaButton').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (btn.getAttribute('href') === '#') e.preventDefault();
    // Let it scroll normally, then nudge the chatbot open with a booking prompt
    setTimeout(() => {
      if (!chatbot.classList.contains('open')) {
        chatbot.classList.add('open');
        initChat();
      }
      setTimeout(() => handleUserMessage('Book a free audit'), 400);
    }, 500);
  });
});
