/* ============================================================
   KIVOKORA — interactions
   ============================================================ */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Nav scroll state ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ---------- Mobile nav burger ---------- */
const burger = document.getElementById('navBurger');
burger.addEventListener('click', () => {
  const links = document.querySelector('.nav-links');
  const isOpen = links.style.display === 'flex';
  links.style.cssText = isOpen
    ? ''
    : 'display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:#0A0806;padding:20px 24px;gap:16px;box-shadow:0 20px 40px -20px rgba(0,0,0,.6);border-radius:0 0 18px 18px;border-top:1px solid rgba(255,255,255,.09);';
});
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => {
  if (window.innerWidth <= 760) document.querySelector('.nav-links').style.display = '';
}));

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = (entry.target.dataset.groupIndex || 0) * 70;
      setTimeout(() => entry.target.classList.add('is-visible'), delay);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('section').forEach(section => {
  const items = section.querySelectorAll('.reveal');
  items.forEach((el, i) => { el.dataset.groupIndex = i % 6; });
});
revealEls.forEach(el => io.observe(el));

/* ============================================================
   3D TILT CARDS — mouse-tracked perspective rotation
   ============================================================ */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.tilt-card').forEach(card => {
    const maxTilt = 8; // degrees

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateY = ((x - cx) / cx) * maxTilt;
      const rotateX = -((y - cy) / cy) * maxTilt;
      const baseRot = card.style.getPropertyValue('--rot') || '0deg';
      card.style.transform = `rotate(${baseRot}) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ---------- Hero bubble parallax ---------- */
const parallaxEls = document.querySelectorAll('[data-parallax]');
if (parallaxEls.length && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    const xRatio = (e.clientX / window.innerWidth) - 0.5;
    const yRatio = (e.clientY / window.innerHeight) - 0.5;
    parallaxEls.forEach(el => {
      const strength = parseFloat(el.dataset.parallax) || 0.3;
      const moveX = xRatio * 40 * strength;
      const moveY = yRatio * 40 * strength;
      el.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  }, { passive: true });
}

/* ============================================================
   CHATBOT — "Kiva", rule-based assistant
   ============================================================ */
const chatbot = document.getElementById('chatbot');
const chatToggle = document.getElementById('chatToggle');
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
    reply: "Kivokora runs your entire digital business under one roof: Performance Marketing, Social Media, Content Marketing, Brand & Design, Search & SEO, and Automation & CRM. One team handles all of it, so nothing gets lost between vendors."
  },
  {
    keys: ['process', 'how does it work', 'steps', 'work with you', 'onboarding'],
    reply: "We follow a 5-step process: Discover → Plan → Develop → Design → Deliver. You can see the full breakdown in the 'Process' section above — every stage feeds the next, so nothing is built in isolation."
  },
  {
    keys: ['price', 'pricing', 'cost', 'how much', 'budget', 'fee'],
    reply: "Pricing depends on which services your business needs right now. The best next step is a free Growth Audit, where we scope this out for your business specifically and give you real numbers."
  },
  {
    keys: ['book', 'audit', 'call', 'meeting', 'talk to', 'contact', 'strategy session', 'consult', 'schedule'],
    reply: "I'd love to set that up. Tap 'Book Free Audit' at the top of the page — it's a free, no-pressure session where we map out an actionable roadmap for your business."
  },
  {
    keys: ['different', 'why kivokora', 'why you', 'vs agency', 'traditional agency', 'better than'],
    reply: "Most businesses end up hiring 4-5 different vendors — a logo agency, a website team, an ads freelancer, an SEO agency — all with different goals and zero accountability. Kivokora replaces that with one team, one strategy, and one goal: your business growth."
  },
  {
    keys: ['time', 'how long', 'timeline', 'duration'],
    reply: "It varies by scope — we'll give you a concrete timeline during your free audit based on exactly what your business needs."
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

/* ============================================================
   AUDIT CONTACT FORM MODAL
   ============================================================ */
const auditModalOverlay = document.getElementById('auditModalOverlay');
const auditModalClose = document.getElementById('auditModalClose');
const auditForm = document.getElementById('auditForm');
const auditFormStatus = document.getElementById('auditFormStatus');
const auditFormSubmit = document.getElementById('auditFormSubmit');

const AUDIT_FORM_ENDPOINT = 'https://formspree.io/f/xzdneqeg';

function openAuditModal() {
  auditModalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAuditModal() {
  auditModalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.open-audit-form').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openAuditModal();
  });
});

auditModalClose.addEventListener('click', closeAuditModal);

auditModalOverlay.addEventListener('click', (e) => {
  if (e.target === auditModalOverlay) closeAuditModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && auditModalOverlay.classList.contains('open')) closeAuditModal();
});

auditForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const services = Array.from(auditForm.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value);
  const formData = new FormData(auditForm);
  formData.delete('services');
  formData.append('services', services.length ? services.join(', ') : 'None selected');
  formData.append('_subject', 'New Free Growth Audit Request — Kivokora');

  auditFormSubmit.disabled = true;
  auditFormSubmit.textContent = 'Sending…';
  auditFormStatus.textContent = '';
  auditFormStatus.className = 'audit-form-status';

  try {
    const response = await fetch(AUDIT_FORM_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      auditFormStatus.textContent = "Thanks! We've received your request and will reach out shortly.";
      auditFormStatus.classList.add('success');
      auditForm.reset();
      setTimeout(closeAuditModal, 2500);
    } else {
      throw new Error('Submission failed');
    }
  } catch (err) {
    auditFormStatus.textContent = 'Something went wrong. Please try again or email us directly at contact@kivokora.com.';
    auditFormStatus.classList.add('error');
  } finally {
    auditFormSubmit.disabled = false;
    auditFormSubmit.textContent = 'Submit Request';
  }
});
