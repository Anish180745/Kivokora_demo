/* ============================================================
   KIVOKORA — interactions (error-safe)
   ============================================================ */

/* ---------- Current year ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Nav scroll state ---------- */
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ---------- Mobile nav burger ---------- */
const burger = document.getElementById('navBurger');
if (burger) {
  burger.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    if (!links) return;
    const isOpen = links.style.display === 'flex';
    links.style.cssText = isOpen
      ? ''
      : 'display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:rgba(10,8,6,.94);backdrop-filter:blur(18px);padding:20px 24px;gap:16px;box-shadow:0 20px 40px -20px rgba(0,0,0,.6);border-radius:0 0 18px 18px;border-top:1px solid rgba(255,255,255,.09);';
  });
}

document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    if (links && window.innerWidth <= 760) links.style.display = '';
  });
});

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
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
    section.querySelectorAll('.reveal').forEach((el, i) => {
      el.dataset.groupIndex = i % 6;
    });
  });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

/* Card hover is handled entirely by CSS in V6 for maximum reliability. */

/* ---------- Hero bubble parallax ---------- */
const parallaxEls = document.querySelectorAll('[data-parallax]');
if (parallaxEls.length && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    const xRatio = (e.clientX / window.innerWidth) - 0.5;
    const yRatio = (e.clientY / window.innerHeight) - 0.5;
    parallaxEls.forEach(el => {
      const strength = parseFloat(el.dataset.parallax) || 0.3;
      el.style.transform = `translate(${xRatio * 40 * strength}px, ${yRatio * 40 * strength}px)`;
    });
  }, { passive: true });
}

/* ============================================================
   CHATBOT — Kiva (safe on every page)
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
    reply: "Kivokora brings Performance Marketing, Social Media, Websites, Content, Brand & Design, SEO and Automation under one connected growth team."
  },
  {
    keys: ['process', 'how does it work', 'steps', 'work with you', 'onboarding'],
    reply: "We follow Discover → Plan → Develop → Design → Deliver, with clear milestones and ongoing optimization."
  },
  {
    keys: ['price', 'pricing', 'cost', 'how much', 'budget', 'fee', 'package'],
    reply: "Performance Marketing starts at ₹5,999/month, Social Media Marketing at ₹5,999/month, Website Designing at ₹6,999/project, and Growth 360 at ₹25,000/month."
  },
  {
    keys: ['25000', '25k', 'growth 360', 'all in one', 'complete package'],
    reply: "Growth 360 is our ₹25,000/month all-in-one package covering ads, social media, creatives, reels/video editing, shoot support, SEO captions, website support, reporting and growth strategy."
  },
  {
    keys: ['book', 'audit', 'call', 'meeting', 'talk to', 'contact', 'strategy session', 'consult', 'schedule'],
    reply: "Tap any 'Book Free Audit' button and share your details. We'll review your business and recommend the leanest growth setup for your goal."
  },
  {
    keys: ['hello', 'hi', 'hey', 'yo'],
    reply: "Hey! 👋 I'm Kiva. Ask me about services, pricing, Growth 360 or your free growth audit."
  }
];

const FALLBACK = "I can help with Kivokora services, pricing, Growth 360, process or booking a free Growth Audit.";

function addMessage(text, sender) {
  if (!chatMessages) return;
  const el = document.createElement('div');
  el.className = 'msg ' + (sender === 'user' ? 'msg-user' : 'msg-bot');
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  if (!chatMessages) return;
  const el = document.createElement('div');
  el.className = 'msg-typing';
  el.id = 'typingIndicator';
  el.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  document.getElementById('typingIndicator')?.remove();
}

function botReply(userText) {
  const t = userText.toLowerCase();
  const match = KB.find(entry => entry.keys.some(k => t.includes(k)));
  showTyping();
  setTimeout(() => {
    hideTyping();
    addMessage(match ? match.reply : FALLBACK, 'bot');
  }, 550 + Math.random() * 350);
}

function renderQuickReplies() {
  if (!chatQuick) return;
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
  if (!text || !text.trim()) return;
  addMessage(text, 'user');
  if (chatInput) chatInput.value = '';
  botReply(text);
}

let chatInitialized = false;
function initChat() {
  if (chatInitialized) return;
  chatInitialized = true;
  addMessage("Hi, I'm Kiva 👋 — ask me about services, pricing, Growth 360 or your free audit.", 'bot');
  renderQuickReplies();
}

if (chatToggle && chatbot) {
  chatToggle.addEventListener('click', () => {
    chatbot.classList.toggle('open');
    if (chatbot.classList.contains('open')) {
      initChat();
      setTimeout(() => chatInput?.focus(), 300);
    }
  });
}

if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserMessage(chatInput?.value || '');
  });
}

/* ============================================================
   AUDIT CONTACT FORM MODAL — safe and reusable
   ============================================================ */
const auditModalOverlay = document.getElementById('auditModalOverlay');
const auditModalClose = document.getElementById('auditModalClose');
const auditForm = document.getElementById('auditForm');
const auditFormStatus = document.getElementById('auditFormStatus');
const auditFormSubmit = document.getElementById('auditFormSubmit');
const AUDIT_FORM_ENDPOINT = 'https://formspree.io/f/xzdneqeg';

function openAuditModal() {
  if (!auditModalOverlay) return;
  if (location.hash === '#auditModalOverlay') history.replaceState(null, '', location.pathname + location.search);
  auditModalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelector('.audit-smart-popup')?.classList.remove('show');
  setTimeout(() => document.getElementById('auditName')?.focus(), 250);
}

function closeAuditModal() {
  if (!auditModalOverlay) return;
  auditModalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  if (location.hash === '#auditModalOverlay') history.replaceState(null, '', location.pathname + location.search);
}

window.openKivokoraAudit = openAuditModal;
window.closeKivokoraAudit = closeAuditModal;

// V6 direct delegated audit CTA handler — works for current and future buttons.
document.addEventListener('click', (e) => {
  const trigger = e.target.closest?.('.open-audit-form, a[href="#auditModalOverlay"], [data-open-audit]');
  if (!trigger || !auditModalOverlay) return;
  e.preventDefault();
  e.stopPropagation();
  openAuditModal();
}, true);

// Native hash remains an independent fallback if JS is disabled or interrupted.
if (location.hash === '#auditModalOverlay') openAuditModal();
window.addEventListener('hashchange', () => {
  if (location.hash === '#auditModalOverlay') openAuditModal();
});

if (auditModalClose) auditModalClose.addEventListener('click', closeAuditModal);
if (auditModalOverlay) {
  auditModalOverlay.addEventListener('click', (e) => {
    if (e.target === auditModalOverlay) closeAuditModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && auditModalOverlay?.classList.contains('open')) closeAuditModal();
});

if (auditForm) {
  auditForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const services = Array.from(auditForm.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value);
    const formData = new FormData(auditForm);
    formData.delete('services');
    formData.append('services', services.length ? services.join(', ') : 'None selected');
    formData.append('_subject', 'New Free Growth Audit Request — Kivokora');

    if (auditFormSubmit) {
      auditFormSubmit.disabled = true;
      auditFormSubmit.textContent = 'Sending…';
    }
    if (auditFormStatus) {
      auditFormStatus.textContent = '';
      auditFormStatus.className = 'audit-form-status';
    }

    try {
      const response = await fetch(AUDIT_FORM_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error('Submission failed');

      if (auditFormStatus) {
        auditFormStatus.textContent = "Thanks! We've received your request and will reach out shortly.";
        auditFormStatus.classList.add('success');
      }
      auditForm.reset();
      setTimeout(closeAuditModal, 2200);
    } catch (err) {
      if (auditFormStatus) {
        auditFormStatus.textContent = 'Something went wrong. Please try again or email us at contact@kivokora.com.';
        auditFormStatus.classList.add('error');
      }
    } finally {
      if (auditFormSubmit) {
        auditFormSubmit.disabled = false;
        auditFormSubmit.textContent = 'Submit Request';
      }
    }
  });
}

/* ============================================================
   SMART FREE AUDIT POPUP
   Auto appears once per session after 5 seconds
   ============================================================ */
function createAuditPopup() {
  if (document.querySelector('.audit-smart-popup')) return;

  const popup = document.createElement('aside');
  popup.className = 'audit-smart-popup';
  popup.setAttribute('aria-label', 'Free Growth Audit');
  popup.innerHTML = `
    <div class="audit-smart-popup-inner">
      <div class="audit-popup-icon"><i class="fa-solid fa-chart-line"></i></div>
      <div class="audit-popup-copy">
        <strong>Want a clearer growth plan?</strong>
        <span>Get a free Kivokora Growth Audit — no sales pitch, just practical next steps for your brand.</span>
      </div>
      <div class="audit-popup-actions">
        <button type="button" class="btn btn-primary audit-popup-cta open-audit-form">Get Free Audit</button>
        <button type="button" class="audit-popup-close" aria-label="Close">×</button>
      </div>
    </div>`;

  document.body.appendChild(popup);

  popup.querySelector('.audit-popup-close')?.addEventListener('click', () => {
    popup.classList.remove('show');
    sessionStorage.setItem('kivokoraAuditPopupClosed', '1');
  });

  if (!sessionStorage.getItem('kivokoraAuditPopupClosed')) {
    setTimeout(() => popup.classList.add('show'), 5000);
  }
}

createAuditPopup();

/* ---------- Glass spotlight ---------- */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.glass-card, .usp-card, .service-card, .result-card, .about-plan, .faq-item, .compare-col, .final-cta').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}
