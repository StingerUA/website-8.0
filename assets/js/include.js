// Unified include.js for Alba Space website (Turkish)
// Includes: Dynamic Header/Footer,   l AI Widget (Text+Voice), Analytics (GA4 + Yandex)
runAfterDomReady(() => {
  // AI-виджеты включены — используются для текстового и голосового общения
  window.__disableAiWidgets = false;
  
  // 0. Inject model-viewer error handler (very first, before analytics)
  if (!document.querySelector('script[src*="model-viewer-error-handler"]')) {
    const errorScript = document.createElement('script');
    errorScript.src = '/assets/js/model-viewer-error-handler.js';
    errorScript.defer = false;
    errorScript.async = false;
    document.head.insertBefore(errorScript, document.head.firstChild);
  }

  // 0b. Fullscreen expand button for model-viewer (mobile only)
  if (document.querySelector('model-viewer') &&
      !document.querySelector('script[src*="model-viewer-fullscreen"]')) {
    const _fsScript = document.createElement('script');
    _fsScript.src = '/assets/js/model-viewer-fullscreen.js';
    _fsScript.defer = true;
    document.head.appendChild(_fsScript);
  }
  
  // 1. ЗАПУСК АНАЛИТИКИ (В первую очередь)
  injectAnalytics();

  // Load lang-switch.js dynamically if not present
  if (!document.querySelector('script[src*="lang-switch.js"]')) {
    const script = document.createElement('script');
    script.src = '/assets/js/lang-switch.js';
    script.defer = true;
    document.head.appendChild(script);
  }

  // Voice debug diagnostics have been disabled in production.
  // Previously this loaded /assets/js/voice-debug.js and injected a fixed debug button.
  // 2. Favicon
  (function ensureFavicon() {
    try {
      const icons = Array.from(document.querySelectorAll('link[rel~="icon"]'));
      let primary = icons[0];
      if (icons.length > 1) {
        icons.slice(1).forEach((icon) => {
          if (icon.parentNode) icon.parentNode.removeChild(icon);
        });
      }
      if (primary) {
        if (primary.getAttribute('href') === '/favicon.png') {
          primary.setAttribute('href', '/assets/icons/AlbaLogo.png');
        }
        return;
      }
      const l = document.createElement('link');
      l.rel = 'icon';
      l.type = 'image/png';
      l.href = '/assets/images/albalogo.png';
      document.head.appendChild(l);
    } catch (e) {
      /* silently ignore DOM issues */
    }
  })();

  (function injectOpenGraphMetaTags() {
    try {
      const head = document.head;
      if (!head) return;

      const hasOgTitle = !!document.querySelector('meta[property="og:title"]');
      const hasOgDesc = !!document.querySelector('meta[property="og:description"]');
      const hasOgImage = !!document.querySelector('meta[property="og:image"]');
      const hasOgUrl = !!document.querySelector('meta[property="og:url"]');
      const hasTwitterCard = !!document.querySelector('meta[name="twitter:card"]');

      const pageTitle = document.title || 'Alba Space';
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || 'ALBA Space — kosmos, tehnologiia i opyt dlia vsekh.';
      const pageUrl = window.location.href;
      const imageUrl = '/assets/images/og-preview.jpg';

      if (!hasOgTitle) {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:title');
        meta.setAttribute('content', pageTitle);
        head.appendChild(meta);
      }

      if (!hasOgDesc) {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:description');
        meta.setAttribute('content', metaDescription);
        head.appendChild(meta);
      }

      if (!hasOgImage) {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image');
        meta.setAttribute('content', imageUrl);
        head.appendChild(meta);
      }

      if (!hasOgUrl) {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:url');
        meta.setAttribute('content', pageUrl);
        head.appendChild(meta);
      }

      if (!hasTwitterCard) {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'twitter:card');
        meta.setAttribute('content', 'summary_large_image');
        head.appendChild(meta);
      }
    } catch (e) {
      /* silently ignore metadata injection issues */
    }
  })();

  // 3. Загружаем CSS и скрипт для model-viewer
  injectModelViewerStyles();
  ensureModelViewerLoaded();
  // 3.1. Фикс фона и ширины на iOS
  injectBackgroundFix();
  // 3.2. Загружаем dropdown z-index fix
  injectDropdownZIndexFix();
  try {
    const p = (window.location && window.location.pathname ? window.location.pathname : '/') || '/';
    const path = String(p).toLowerCase();
    const isIndex = path === '/' || path === '/index.html' || path === '/eng/index.html' || path === '/rus/index.html';
    const isProductLike = /\/(product-[^/]+|shop|cart)\.html$/.test(path);
    if (!isIndex && !isProductLike) {
      document.documentElement.classList.add('alba-dark-gradient');
      if (document.body) document.body.classList.add('alba-dark-gradient');
    }
  } catch (e) {}

  // 4. Создаём лоадеры
  const ensurePreloaderScript = createPreloaderLoader();
  const ensureModelPreloader = createModelPreloaderLoader();
  const ensureModelNavLoader = createModelNavLoader();
  // 5. Mobile nav override - REMOVED, using site.css mobile styles instead
  // The override was causing pointer-events issues with menu toggle
  // 6. Load includes (Header / Footer)
  const includes = document.querySelectorAll("[data-include], [data-include-html]");
  if (includes.length) {
    includes.forEach((el) => {
      const url = el.getAttribute("data-include") || el.getAttribute("data-include-html");
      if (!url) return;
      const tryPaths = [url];
      if (url.startsWith("/")) {
        tryPaths.push(url.slice(1));
      }
      const loadFragment = async () => {
        let html = "";
        let lastErr;
        for (const path of tryPaths) {
          try {
            const res = await fetch(path, { cache: "default" });
            if (!res.ok) throw new Error("Failed " + res.status + " for " + path);
            html = await res.text();
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (!html) throw lastErr || new Error("Unknown include error for " + url);
        // Вставка HTML и выполнение скриптов
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        const scripts = Array.from(tmp.querySelectorAll("script"));
        scripts.forEach((s) => {
          if (s.parentNode) s.parentNode.removeChild(s);
        });
        el.innerHTML = tmp.innerHTML;
          // Process any nested data-include elements inside the injected fragment
          const processNestedIncludes = async (rootEl) => {
            const nested = Array.from(rootEl.querySelectorAll('[data-include], [data-include-html]'));
            for (const n of nested) {
              const nestedUrl = n.getAttribute('data-include') || n.getAttribute('data-include-html');
              if (!nestedUrl) continue;
              const nestedTry = [nestedUrl];
              if (nestedUrl.startsWith('/')) nestedTry.push(nestedUrl.slice(1));
              let nestedHtml = '';
              let nestedErr;
              for (const p of nestedTry) {
                try {
                  const res2 = await fetch(p, { cache: 'default' });
                  if (!res2.ok) throw new Error('Failed ' + res2.status + ' for ' + p);
                  nestedHtml = await res2.text();
                  break;
                } catch (ee) { nestedErr = ee; }
              }
              if (!nestedHtml) {
                console.error('[include.js] nested include failed', nestedUrl, nestedErr);
                continue;
              }
              const tmp2 = document.createElement('div');
              tmp2.innerHTML = nestedHtml;
              const scripts2 = Array.from(tmp2.querySelectorAll('script'));
              scripts2.forEach((s) => { if (s.parentNode) s.parentNode.removeChild(s); });
              n.innerHTML = tmp2.innerHTML;
              scripts2.forEach((oldScript) => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes || []).forEach(({ name, value }) => {
                  if (name === 'src') newScript.src = value; else newScript.setAttribute(name, value);
                });
                if (!oldScript.src) newScript.textContent = oldScript.textContent || '';
                if (oldScript.async) newScript.async = true;
                if (oldScript.defer) newScript.defer = true;
                (document.head || document.documentElement).appendChild(newScript);
              });
              // recurse into newly-inserted fragment
              await processNestedIncludes(n);
            }
          };
          await processNestedIncludes(el);
        scripts.forEach((oldScript) => {
          // Skip external scripts already present in the DOM (prevents double-load SyntaxErrors)
          if (oldScript.src) {
            const abs = new URL(oldScript.src, window.location.href).href;
            if (document.querySelector(`script[src="${abs}"]`) ||
                document.querySelector(`script[src="${oldScript.src}"]`)) {
              return; // already loaded — skip
            }
          }
          const newScript = document.createElement("script");
          Array.from(oldScript.attributes || []).forEach(({ name, value }) => {
            if (name === "src") {
              newScript.src = value;
            } else {
              newScript.setAttribute(name, value);
            }
          });
          if (!oldScript.src) {
            newScript.textContent = oldScript.textContent || "";
          }
          if (oldScript.async) newScript.async = true;
          if (oldScript.defer) newScript.defer = true;
          (document.head || document.documentElement).appendChild(newScript);
        });
      };
      loadFragment()
        .then(() => {
          if (url.includes("header-")) {
            markActiveNav();
            setupLangSwitch();
            ensurePreloaderScript();
            ensureModelPreloader();
            ensureModelNavLoader();
            // Re-initialize dropdowns after dynamic header insertion
            // Retry loop handles race condition where menu-toggle.js may still be loading
            (function tryInitDropdowns(attempts) {
              if (window.initDropdowns) {
                window.initDropdowns();
              } else if (attempts > 0) {
                setTimeout(function() { tryInitDropdowns(attempts - 1); }, 80);
              }
            })(15);
          }
          if (url.includes("footer-")) {
            enhanceFooter(el);
            ensureModelPreloader();
          }
          // After an include is injected, re-scan for revealable elements so
          // dynamically-inserted content (header/footer) and content shown by
          // interactive controls are observed and animated.
          try {
            if (typeof initScrollReveal === 'function') initScrollReveal();
          } catch (e) { /* ignore errors during init */ }
        })
        .catch((err) => console.error("[include.js] include failed", url, err));
    });
  } else {
    ensureModelPreloader();
  }
  // 7. GLOBAL AI WIDGET (Albamen / Albaman) — текстовый чат
  // Отключаем авто-открытие по умолчанию — будем открывать только по клику
  // ===== GLOBAL AI WIDGET (Albamen / Albaman) =====
  // Отключаем авто-открытие виджета по умолчанию — открываем только по клику
  window.__allowAiAutoOpen = false;
  // Включаем виджеты только на странице "hakkimizda"
  try {
    const _path = window.location.pathname || '/';
    // Enable unified AI widget on all pages
    if (!window.__disableAiWidgets) {
      injectUnifiedAiWidget();
    } else {
      console.info('[include.js] AI widget is disabled by flag');
    }
  } catch (e) {
    console.error('[include.js] Failed to decide AI widget injection:', e);
  }
    // Safety: ensure AI panels are collapsed on initial load
    try {
      const cleanupOpenAi = () => {
        document.querySelectorAll('.ai-panel-global.ai-open, .ai-panel-voice.ai-open').forEach(el => el.classList.remove('ai-open'));
        const floating = document.getElementById('ai-floating-global');
        if (floating && (!floating.dataset || floating.dataset.keepVisible !== 'true')) {
          floating.setAttribute('style', 'display: none !important');
        }
        const toggle = document.getElementById('ai-widget-toggle-btn');
        if (toggle) toggle.classList.remove('ai-open');
      };
      // run immediately and also shortly after to cover race conditions
      cleanupOpenAi();
      setTimeout(cleanupOpenAi, 300);
    } catch (e) { /* noop */ }
  // 9. Плавное появление блоков на всех страницах
  initScrollReveal();

  // --- Текстовый чат Albamen (старый UI, новая схема с памятью) ---
  function injectAiWidget() {
    const path = window.location.pathname || '/';
    const isEn = path.startsWith('/eng/');
    const isRu = path.startsWith('/rus/');

    const strings = isEn ? {
      placeholder: 'Send a message...',
      listening: 'Listening...',
      connect: 'Connecting...',
      initialStatus: 'How can I help you today?',
      talkPrompt: 'Tap and Talk 🔊',
      welcomeBack: 'Welcome back, ',
      voiceNotSupported: 'Voice not supported',
      connectionError: 'Connection error.'
    } : isRu ? {
      placeholder: 'Напишите сообщение...',
      listening: 'Слушаю...',
      connect: 'Подключение...',
      initialStatus: 'Чем я могу вам помочь?',
      talkPrompt: 'Нажми и говори 🔊',
      welcomeBack: 'С возвращением, ',
      voiceNotSupported: 'Голос не поддерживается',
      connectionError: 'Ошибка соединения.'
    } : {
      placeholder: 'Bir mesaj yazın...',
      listening: 'Dinliyorum...',
      connect: 'Bağlanıyor...',
      initialStatus: 'Bugün sana nasıl yardım edebilirim?',
      talkPrompt: 'Tıkla ve Konuş 🔊',
      welcomeBack: 'Tekrar hoş geldin, ',
      voiceNotSupported: 'Ses desteği yok',
      connectionError: 'Bağlantı hatası.'
    };

    // имя для приветствия
    const storedName = localStorage.getItem('albamen_user_name');
    if (storedName) {
      strings.initialStatus = strings.welcomeBack + storedName + '! 🚀';
    }

    // sessionId для памяти
    const sessionId = getAlbamenSessionId();

    if (document.getElementById('ai-floating-global')) return;

    // Создаем контейнер для виджетов (минимизированный — видны только кнопки)
    const floating = document.createElement('div');
    floating.className = 'ai-floating';
    floating.id = 'ai-floating-global';
    const avatarSrc = '/assets/images/albamenai.png';
    floating.innerHTML = `
      <div class="ai-hero-avatar" id="ai-avatar-trigger">
        <img src="${avatarSrc}" alt="Albamen AI">
      </div>
    `;
    floating.setAttribute('style', 'display: none !important'); // Скрываем виджеты по умолчанию — открываем только по клику
    document.body.appendChild(floating);

    // Создаем главную кнопку вызова виджетов (всегда видна)
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'ai-widget-toggle-btn';
    toggleBtn.id = 'ai-widget-toggle-btn';
    toggleBtn.setAttribute('aria-label', isEn ? 'Open AI assistant' : 'AI asistanı aç');
    toggleBtn.innerHTML = `<img src="/assets/images/albamenai.png" alt="AI" style="width: 100%; height: 100%; object-fit: contain;" />`;
    document.body.appendChild(toggleBtn);

    // Обработчик для открытия/закрытия виджетов
    toggleBtn.addEventListener('click', () => {
      const computedDisplay = window.getComputedStyle(floating).display;
      if (computedDisplay === 'none') {
        floating.setAttribute('style', 'display: flex !important'); // Показываем виджеты
        toggleBtn.classList.add('ai-open');
      } else {
        floating.setAttribute('style', 'display: none !important'); // Скрываем виджеты
        toggleBtn.classList.remove('ai-open');
        // Закрываем панель чата если она открыта
        const panel = document.querySelector('.ai-panel-global');
        if (panel) panel.classList.remove('ai-open');
      }
    });

    const panel = document.createElement('div');
    panel.className = 'ai-panel-global';
    panel.innerHTML = `
      <div class="ai-panel-header">
        <button class="ai-voice-btn" id="ai-voice-btn-panel" aria-label="Call AI">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </button>
        <div class="ai-header-actions">
          <button class="ai-fullscreen-btn" id="ai-fullscreen-btn" aria-label="Toggle fullscreen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path>
            </svg>
          </button>
          <button class="ai-close-icon" id="ai-close-btn">×</button>
        </div>
      </div>
      <div class="ai-panel-body">
        <div class="ai-messages-list" id="ai-messages-list-legacy"></div>
        <div class="ai-chat-avatar-large"><img src="${avatarSrc}" alt="Albamen"></div>
        <div class="ai-status-text" id="ai-status-text">${strings.initialStatus}</div>
        <div class="ai-status-text ai-voice-status" id="voice-status-text" style="display:none;">${strings.talkPrompt}</div>
        <div class="voice-controls hidden" id="voice-inline-controls">
          <div class="voice-wave hidden" id="voice-wave">
            <div class="voice-bar"></div><div class="voice-bar"></div><div class="voice-bar"></div>
          </div>
          <button class="voice-stop-btn hidden" id="voice-stop-btn">■</button>
        </div>
        <div class="ai-input-area">
          <button class="ai-action-btn ai-mic-btn-panel" id="ai-mic-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <input type="text" class="ai-input" id="ai-input-field-legacy" placeholder="${strings.placeholder}">
          <button class="ai-action-btn ai-send-btn-panel" id="ai-send-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Ensure panels are hidden by default and attach delegated handlers
    // This prevents accidental auto-open and makes close buttons reliable
    try {
      panel.classList.remove('ai-open');
      panel.classList.remove('chat-active');
      panel.classList.remove('voice-active');
      // Delegated click handler: open/close reliably even with duplicate IDs
      if (!window.__albamen_ai_delegated) {
        window.__albamen_ai_delegated = true;
        document.addEventListener('click', (ev) => {
          const close = ev.target.closest && ev.target.closest('.ai-close-icon');
          if (close) {
            const p = close.closest('.ai-panel-global, .ai-panel-voice');
            if (p) p.classList.remove('ai-open');
            return;
          }
          const fullscreen = ev.target.closest && ev.target.closest('.ai-fullscreen-btn');
          if (fullscreen) {
            const p = fullscreen.closest('.ai-panel-global');
            if (p) p.classList.toggle('ai-fullscreen');
            return;
          }
          const openChat = ev.target.closest && ev.target.closest('#ai-avatar-trigger, #ai-call-trigger, .ai-call-btn, .ai-hero-avatar');
          if (openChat) {
            const p = document.querySelector('.ai-panel-global');
            if (p) p.classList.add('ai-open');
            return;
          }
          const openVoice = ev.target.closest && ev.target.closest('#ai-voice-btn, .ai-voice-btn');
          if (openVoice) {
            const vp = document.querySelector('.ai-panel-voice');
            if (vp) vp.classList.add('ai-open');
            return;
          }
        }, { capture: false });
      }
    } catch (e) { /* safe fallback */ }

    const avatarTrigger = document.getElementById('ai-avatar-trigger');
    const closeBtn = document.getElementById('ai-close-btn');
    const sendBtn = document.getElementById('ai-send-btn');
    const micBtn = document.getElementById('ai-mic-btn');
    const inputField = document.getElementById('ai-input-field-legacy');
    const msgList = document.getElementById('ai-messages-list-legacy');
    const statusText = document.getElementById('ai-status-text');

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    const recognition = SpeechRec ? new SpeechRec() : null;
    let isListening = false;

    const openPanel = (evt) => {
      // Only open in response to a trusted user event, or when explicitly allowed.
      if (!evt || evt.isTrusted !== true) {
        if (!window.__allowAiAutoOpen) return;
      }
      panel.classList.add('ai-open');
    };
    const closePanel = () => {
      panel.classList.remove('ai-open');
      panel.classList.remove('chat-active');
      statusText.style.display = 'block';
      statusText.textContent = strings.initialStatus;
    };

    avatarTrigger.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);

    const fullscreenBtn = document.getElementById('ai-fullscreen-btn');
    fullscreenBtn.addEventListener('click', () => {
      panel.classList.toggle('ai-fullscreen');
    });

    function addMessage(text, type, id = null) {
      const div = document.createElement('div');
      div.className = `ai-msg ${type}`;
      div.textContent = text;
      if (id) div.id = id;
      msgList.appendChild(div);
      msgList.scrollTop = msgList.scrollHeight;
      return div;
    }

    // ── Conversation history (kept in memory per session) ──
    if (!window.__albamenHistory) window.__albamenHistory = [];
    const chatHistory = window.__albamenHistory;

    // ── Voice synthesis — Google Cloud TTS (мудрый учитель) ──
    const ALBAMEN_WORKER_TTS = 'https://divine-flower-a0ae.nncdecdgc.workers.dev';
    let _ttsAudio = null;

    function speakAlbamen(text) {
      const clean = text
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[🚀🌌👨‍🚀⭐🛸💫🌟]/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\n+/g, ' ')
        .trim();
      if (!clean) return;

      if (_ttsAudio) { _ttsAudio.pause(); _ttsAudio = null; }
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      const isRuText = /[а-яёА-ЯЁ]/.test(clean);
      const isTrText = /[ğışüöçĞİŞÜÖÇ]/.test(clean) && !isRuText;
      const lang = isRuText ? 'ru' : isTrText ? 'tr' : (isEn ? 'en' : 'tr');

      fetch(`${ALBAMEN_WORKER_TTS}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean.slice(0, 800), language: lang })
      })
        .then(res => { if (!res.ok) throw new Error('TTS HTTP ' + res.status); return res.json(); })
        .then(data => {
          if (!data.audioBase64) throw new Error('No audio');
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          _ttsAudio = new Audio(url);
          _ttsAudio.onplay = () => { const av = document.getElementById('ai-avatar-trigger'); if (av) av.classList.add('speaking'); };
          _ttsAudio.onended = () => { URL.revokeObjectURL(url); _ttsAudio = null; const av = document.getElementById('ai-avatar-trigger'); if (av) av.classList.remove('speaking'); };
          _ttsAudio.onerror = () => { URL.revokeObjectURL(url); _ttsAudio = null; _speakFallback(clean, lang); };
          _ttsAudio.play().catch(() => _speakFallback(clean, lang));
        })
        .catch(() => _speakFallback(clean, lang));
    }

    function _speakFallback(clean, lang) {
      if (!window.speechSynthesis) return;
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'tr-TR';
      utt.pitch = 0.70; utt.rate = 0.90; utt.volume = 1;
      window.speechSynthesis.speak(utt);
    }

    function sendMessage() {
      const txt = (inputField.value || '').trim();
      if (!txt) return;

      panel.classList.add('chat-active');
      addMessage(txt, 'user');
      inputField.value = '';

      const loadingId = 'loading-' + Date.now();
      addMessage('...', 'bot', loadingId);
      statusText.textContent = strings.connect;
      statusText.style.display = 'block';

      const workerUrl = 'https://divine-flower-a0ae.nncdecdgc.workers.dev';

      const currentName = localStorage.getItem('albamen_user_name') || null;
      const currentAge  = localStorage.getItem('albamen_user_age')  || null;

      // Send last 10 messages as history for context
      const historySlice = chatHistory.slice(-10);

      fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: txt,
          sessionId,
          language: isEn ? 'en' : isRu ? 'ru' : 'tr',
          savedName: currentName,
          savedAge: currentAge,
          history: historySlice
        })
      })
        .then(res => res.json())
        .then(data => {
          const loader = document.getElementById(loadingId);
          if (loader) loader.remove();

          if (!data || typeof data.reply !== 'string') {
            addMessage(strings.connectionError, 'bot');
            statusText.style.display = 'none';
            return;
          }

          // Save name/age from structured JSON fields (fixed worker)
          if (data.saveName && typeof data.saveName === 'string') {
            const n = data.saveName.trim();
            if (n) localStorage.setItem('albamen_user_name', n);
          }
          if (data.saveAge && typeof data.saveAge === 'string') {
            const a = data.saveAge.trim();
            if (a) localStorage.setItem('albamen_user_age', a);
          }

          // Fallback: extract tags if worker didn't strip them
          let finalReply = data.reply.trim();
          const nmatch = finalReply.match(/<SAVE_NAME:([^>]+)>/);
          if (nmatch) {
            const n = nmatch[1].trim();
            if (n) localStorage.setItem('albamen_user_name', n);
            finalReply = finalReply.replace(nmatch[0], '').trim();
          }
          const amatch = finalReply.match(/<SAVE_AGE:([^>]+)>/);
          if (amatch) {
            const a = amatch[1].trim();
            if (a) localStorage.setItem('albamen_user_age', a);
            finalReply = finalReply.replace(amatch[0], '').trim();
          }

          if (/^(Grok Hatası|JS Hatası)/i.test(finalReply)) {
            addMessage(strings.connectionError, 'bot');
            statusText.style.display = 'none';
            return;
          }

          const reply = finalReply || strings.connectionError;

          // Add to history for next request
          chatHistory.push({ role: 'user',  text: txt   });
          chatHistory.push({ role: 'model', text: reply });

          addMessage(reply, 'bot');
          statusText.style.display = 'none';

          // 🔊 Speak the reply in superhero voice
          speakAlbamen(reply);
        })
        .catch(err => {
          console.error('AI Error:', err);
          const loader = document.getElementById(loadingId);
          if (loader) loader.remove();
          addMessage(strings.connectionError, 'bot');
          statusText.style.display = 'none';
        });
    }

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    micBtn.addEventListener('click', () => {
      if (!recognition) {
        statusText.textContent = strings.voiceNotSupported;
        statusText.style.display = 'block';
        return;
      }
      if (isListening) {
        recognition.stop();
        return;
      }
      panel.classList.add('chat-active');
      statusText.textContent = strings.listening;
      statusText.style.display = 'block';
      inputField.focus();
      recognition.lang = isEn ? 'en-US' : isRu ? 'ru-RU' : 'tr-TR';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      isListening = true;
      recognition.start();
    });

    if (recognition) {
      recognition.addEventListener('result', (event) => {
        const transcript = Array.from(event.results)
          .map(res => res[0].transcript)
          .join(' ')
          .trim();
        if (transcript) {
          inputField.value = transcript;
        }
        // If final result — auto-send immediately
        if (event.results[event.results.length - 1].isFinal) {
          if (transcript) {
            setTimeout(() => sendMessage(), 300);
          }
        }
      });
      recognition.addEventListener('end', () => {
        isListening = false;
        statusText.textContent = strings.initialStatus;
        // Visual: reset mic button
        if (micBtn) micBtn.classList.remove('ai-mic-active');
      });
      recognition.addEventListener('error', () => {
        isListening = false;
        statusText.textContent = strings.voiceNotSupported;
        if (micBtn) micBtn.classList.remove('ai-mic-active');
      });
    }
  }

}); // END runAfterDomReady




// -------------------- HELPER FUNCTIONS --------------------
function runAfterDomReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

function initScrollReveal() {
  if (window.__albaRevealReady) return;
  window.__albaRevealReady = true;

  const processed = new WeakSet();
  let revealIndex = 0;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -8% 0px'
  });

  const selectors = [
    // Explicit opts-in
    '[data-reveal]',
    '.reveal',

    // Common layout containers across legacy pages
    'body > *:not(script):not(style):not(link):not(meta)',
    'main > *:not(script):not(style)',
    '.container',
    '.row',
    '.col',
    '.section',
    '.content',
    '.wrapper',

    // Semantically meaningful blocks
    'section',
    'article',
    '.card',
    '.glass-box',
    '.product-card',
    '.feature-card',
    '.info-card',
    '.panel',
    '.content-block',
    '.hero',
    '.category-card',
    '.logo-carousel-wrap',
    '.atlas-inner',
    '.shop-card',
    '.blog-card',
    '.gallery-card',
    '.team-card',
    '.mission-card'
  ];

  const tagForReveal = (el) => {
    if (!el || processed.has(el) || el.dataset.revealSkip === 'true') return;

    if (!el.classList.contains('reveal')) {
      el.classList.add('reveal');
    }

    if (!el.dataset.direction) {
      el.dataset.direction = (revealIndex % 2 === 0) ? 'left' : 'right';
    }

    const delay = el.dataset.direction === 'left' ? revealIndex * 0.05 : revealIndex * 0.06;
    el.style.setProperty('--reveal-delay', `${delay}s`);

    observer.observe(el);
    processed.add(el);
    revealIndex += 1;
  };

  const scan = () => {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach(tagForReveal);
    });
  };

  // Run immediately
  scan();
  
  // Run again after layout is painted (optimized with requestIdleCallback for performance)
  // This catches dynamically added elements from headers/footers
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => scan(), { timeout: 800 });
  } else {
    setTimeout(scan, 300);
  }
}

function injectAnalytics() {
  if (!document.querySelector('script[src*="googletagmanager"]')) {
    const gScript = document.createElement('script');
    gScript.async = true;
    gScript.src = "https://www.googletagmanager.com/gtag/js?id=G-FV3RXWJ5PQ";
    document.head.appendChild(gScript);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-FV3RXWJ5PQ');
  }
  if (!window.ym) {
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        k=e.createElement(t),a=e.getElementsByTagName(t)[0];
        k.async=1;
        k.src=r;
        if(a) { a.parentNode.insertBefore(k,a); }
        else { document.head.appendChild(k); }
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=105726731", "ym");
    ym(105726731, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true,
        ecommerce:"dataLayer"
    });
  }
}

function injectModelViewerStyles() {
  if (document.getElementById("albaspace-model-viewer-styles")) return;
  const style = document.createElement("style");
  style.id = "albaspace-model-viewer-styles";
  style.textContent = `
    model-viewer { width: 100%; height: 600px; margin-top: 30px; background: rgba(0, 0, 0, 0.65); border-radius: 12px; box-shadow: 0 0 30px rgba(0, 150, 255, 0.5); display: block; }
    @media (max-width: 768px) { model-viewer { height: 420px; margin-top: 20px; } }
    model-viewer[ar-status="session-started"] { display: block !important; }
    model-viewer::part(default-progress-bar) { background: linear-gradient(90deg, #00b4ff, #00e5ff); }
  `;
  document.head.appendChild(style);
}

// Фикс увеличенного фона и «лишней ширины» на iPhone/iOS
function injectBackgroundFix() {
  if (document.getElementById('alba-bg-fix-style')) return;

  const style = document.createElement('style');
  style.id = 'alba-bg-fix-style';
  style.textContent = `
    /* Prevent horizontal overflow — use clip on html (safe for position:fixed) */
    html { overflow-x: clip; }
    body { overflow-x: hidden !important; max-width: 100vw !important; }
    model-viewer { max-width: 100% !important; box-sizing: border-box !important; }
    @media (max-width: 1024px) {
      body { background-attachment: scroll !important; }
    }
  `;
  document.head.appendChild(style);
}

// Inject dropdown z-index fix CSS
function injectDropdownZIndexFix() {
  if (document.getElementById('alba-dropdown-z-index-fix')) return;
  
  const link = document.createElement('link');
  link.id = 'alba-dropdown-z-index-fix';
  link.rel = 'stylesheet';
  link.href = '/assets/css/dropdown-z-index-fix.css';
  document.head.appendChild(link);
}

function ensureModelViewerLoaded() {
  const hasModelViewer = !!document.querySelector("model-viewer");
  if (!hasModelViewer) return;
  if (window.customElements && window.customElements.get("model-viewer")) return;
  const googleSrc = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.0.0/model-viewer.min.js";
  const fallbackSrc = "https://unpkg.com/@google/model-viewer@3.0.0/dist/model-viewer.min.js";
  const localSrc = "/assets/js/model-viewer.min.js";
  const existingGoogleScript = document.querySelector(`script[src="${googleSrc}"]`);
  const existingLocalScript = document.querySelector(`script[src="${localSrc}"]`);

  const loadModelViewerScript = (src, onSuccess, onError) => {
    if (window.customElements && window.customElements.get("model-viewer")) {
      onSuccess?.();
      return;
    }

    if (document.querySelector(`script[src="${src}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = src;
    script.setAttribute('crossorigin', 'anonymous');
    script.onload = () => {
      onSuccess?.();
    };
    script.onerror = () => {
      onError?.();
    };
    document.head.appendChild(script);
  };

  const tryLocalFallback = () => {
    if (window.customElements && window.customElements.get("model-viewer")) return;
    console.debug('[model-viewer] Trying local fallback...');
    loadModelViewerScript(localSrc, () => {
      console.debug('[model-viewer] Local fallback loaded successfully');
    }, () => {
      console.warn('[model-viewer] Local fallback failed too');
    });
  };

  const tryFallback = () => {
    if (window.customElements && window.customElements.get("model-viewer")) return;
    console.debug('[model-viewer] Primary CDN failed, trying unpkg fallback...');
    loadModelViewerScript(fallbackSrc, () => {
      console.debug('[model-viewer] Fallback CDN loaded successfully');
    }, () => {
      console.warn('[model-viewer] Fallback CDN failed, trying local fallback...');
      tryLocalFallback();
    });
  };

  const loadPrimaryModelViewer = () => {
    if (window.customElements && window.customElements.get("model-viewer")) return;
    if (!existingGoogleScript) {
      loadModelViewerScript(googleSrc, () => {
        console.debug('[model-viewer] Primary CDN loaded successfully');
      }, tryFallback);
    } else {
      console.debug('[model-viewer] Primary CDN script already present, waiting for registration...');
    }

    setTimeout(() => {
      if (!window.customElements || !window.customElements.get("model-viewer")) {
        console.debug('[model-viewer] model-viewer not registered after timeout, trying fallback...');
        tryFallback();
      }
    }, 10000); // 10 second timeout
  };

  if (!existingLocalScript) {
    setTimeout(loadPrimaryModelViewer, 800);
  } else {
    console.debug('[model-viewer] Local model-viewer script already present');
  }
}

function createPreloaderLoader() {
  let loaded = false;
  return function ensurePreloaderScript() {
    if (loaded) return;
    if (document.querySelector("script[data-preloader-loader]")) { loaded = true; return; }
    const script = document.createElement("script");
    script.src = "/assets/js/preloader.js";
    script.defer = true;
    script.dataset.preloaderLoader = "true";
    document.head.appendChild(script);
    loaded = true;
  };
}

function createModelPreloaderLoader() {
  let loaded = false;
  return function ensureModelPreloader() {
    if (loaded) return;
    if (!document.querySelector('model-viewer')) return;
    if (document.querySelector('script[data-model-preloader]')) { loaded = true; return; }
    const script = document.createElement("script");
    script.src = '/assets/js/model-preloader.js';
    script.defer = true;
    script.dataset.modelPreloader = 'true';
    document.head.appendChild(script);
    loaded = true;
  };
}

function createModelNavLoader() {
  let loaded = false;
  return function ensureModelNavLoader() {
    if (loaded) return;
    if (document.querySelector('script[data-model-nav-loader]')) { loaded = true; return; }
    const script = document.createElement("script");
    script.src = '/assets/js/model-nav-loader.js';
    script.defer = true;
    script.dataset.modelNavLoader = 'true';
    document.head.appendChild(script);
    loaded = true;
  };
}

function markActiveNav() {
  const path = normalizePath(window.location.pathname || "/");
  const navLinks = document.querySelectorAll(".main-nav a");
  const isEnglish = (document.documentElement.lang || "").toLowerCase().startsWith("en") || path.startsWith("/eng/");
  const isProductPage = /\/product-[^/]+\.html$/i.test(path);
  let matched = false;

  const highlightShop = () => {
    const targetPath = normalizePath(isEnglish ? "/eng/shop.html" : "/shop.html");
    let found = false;
    navLinks.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      try {
        const linkPath = normalizePath(new URL(href, window.location.origin).pathname);
        if (linkPath === targetPath) { a.classList.add("active"); found = true; }
      } catch (e) {
        // fallback below
      }
      if (!found) {
        const label = (a.textContent || "").trim().toUpperCase();
        if ((isEnglish && label.includes("SHOP")) || (!isEnglish && label.includes("MAĞAZA"))) {
          a.classList.add("active");
          found = true;
        }
      }
    });
    return found;
  };

  if (isProductPage) {
    matched = highlightShop();
  }
  navLinks.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;
    try {
      const linkPath = normalizePath(new URL(href, window.location.origin).pathname);
      if (linkPath === path) { a.classList.add("active"); matched = true; }
    } catch (e) {
      if (href && path.endsWith(href)) { a.classList.add("active"); matched = true; }
    }
  });
  if (!matched) {
    navLinks.forEach((a) => {
      const text = (a.textContent || "").trim().toUpperCase();
      if (text.includes("ATLAS")) a.classList.add("active");
    });
  }
}

function normalizePath(p) {
  if (!p || p === "/") return "/index.html";
  if (!p.endsWith(".html") && !p.endsWith("/")) return p + "/";
  return p;
}

function setupLangSwitch() {
  const path = window.location.pathname || "/";
  const isEn = path.startsWith("/eng/");
  const isRu = path.startsWith("/rus/");
  const currentLang = isEn ? "en" : isRu ? "ru" : "tr";
  const container = document.querySelector(".top-lang-switch");
  if (!container) return;
  container.querySelectorAll("[data-lang]").forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    btn.classList.toggle("active", lang === currentLang);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (lang === currentLang) return;
      let targetPath;
      if (lang === "en") targetPath = toEnPath(path);
      else if (lang === "ru") targetPath = toRuPath(path);
      else targetPath = toTrPath(path);
      window.location.href = targetPath;
    });
  });
}

function toEnPath(path) {
  path = normalizePath(path);
  if (path.startsWith("/eng/")) return path;
  if (path.startsWith("/rus/")) return path.replace(/^\/rus/, "/eng");
  if (path === "/index.html") return "/eng/index.html";
  return "/eng" + (path.startsWith("/") ? path : "/" + path);
}

function toTrPath(path) {
  path = normalizePath(path);
  if (path.startsWith("/eng/")) return path.replace(/^\/eng/, "") || "/index.html";
  if (path.startsWith("/rus/")) return path.replace(/^\/rus/, "") || "/index.html";
  return path;
}

function toRuPath(path) {
  path = normalizePath(path);
  if (path.startsWith("/rus/")) return path;
  if (path.startsWith("/eng/")) return path.replace(/^\/eng/, "/rus");
  if (path === "/index.html") return "/rus/index.html";
  return "/rus" + (path.startsWith("/") ? path : "/" + path);
}

function enhanceFooter(root) {
  injectFooterStyles();
  const footer = root.querySelector("footer");
  if (!footer || footer.classList.contains("alba-footer-v5")) return;
  footer.classList.add("alba-footer-v5");
  const allowCallSquare = /\/hizmetler(\.html)?\/?$/i.test(window.location.pathname || "");
  if (!allowCallSquare) { footer.querySelectorAll(".alba-call-square").forEach((el) => el.remove()); }
  const socials = footer.querySelector(".social-icons") || footer.querySelector(".footer-socials") || footer.querySelector("[data-socials]");
  if (socials) socials.classList.add("alba-footer-socials");
  const addressContainer = footer.querySelector(".footer-actions") || footer.querySelector(".footer-right") || footer.querySelector(".footer-address") || footer.querySelector(".footer-contact") || footer.querySelector("[data-footer-address]");
  if (!addressContainer) return;
  const rawAddrText = (addressContainer.innerText || "").trim();
  if (!rawAddrText) return;
  const isEnglish = window.location.pathname.startsWith('/eng/');
  const headOfficeRegex = isEnglish ? /Head Office/i : /Merkez Ofis/i;
  const branchOfficeRegex = isEnglish ? /Branch Office/i : /Adana Şube/i;
  const phoneHint = isEnglish ? 'Tap to call' : 'Aramak için dokunun';
  const emailHint = isEnglish ? 'Write to us' : 'Bize yazın';
  const mapHint = isEnglish ? 'Tap to open map' : 'Haritayı açmak için dokunun';
  const merkezBlock = extractSection(rawAddrText, headOfficeRegex, branchOfficeRegex);
  const mailAnchors = footer.querySelectorAll('a[href^="mailto:"]');
  mailAnchors.forEach((el) => el.remove());
  const contactPanel = document.createElement('div');
  contactPanel.className = 'alba-footer-contact-panel';
  const phoneBtn = document.createElement('a');
  phoneBtn.className = 'alba-footer-action';
  phoneBtn.href = 'tel:+905387781018';
  phoneBtn.innerHTML = `<div class="action-row"><span class="action-icon">☎</span><span class="action-text">+90 538 778 10 18</span></div><div class="action-hint alba-blink">${phoneHint}</div>`;
  contactPanel.appendChild(phoneBtn);
  const emailBtn = document.createElement('a');
  emailBtn.className = 'alba-footer-action';
  emailBtn.href = 'mailto:hello@albaspace.com.tr';
  emailBtn.innerHTML = `<div class="action-row"><span class="action-icon">✉</span><span class="action-text">hello@albaspace.com.tr</span></div><div class="action-hint alba-blink">${emailHint}</div>`;
  contactPanel.appendChild(emailBtn);
  const map1 = buildMapButton(merkezBlock, mapHint);
  if (map1) contactPanel.appendChild(map1);
  addressContainer.innerHTML = '';
  addressContainer.style.display = 'flex';
  addressContainer.style.flexDirection = 'column';
  addressContainer.style.alignItems = 'center';
  addressContainer.style.justifyContent = 'center';
  addressContainer.style.width = '100%';
  addressContainer.style.margin = '0 auto';
  addressContainer.appendChild(contactPanel);
}

function buildMapButton(blockText, hint) {
  if (!blockText) return null;
  const lines = blockText.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  const title = lines[0];
  const addressLines = lines.slice(1).filter((l) => !/(\+?\s*\d[\d\s()\-]{7,}\d)/.test(l));
  const address = addressLines.join(', ').replace(/\s+/g, ' ').trim();
  if (!address) return null;
  const a = document.createElement('a');
  a.className = 'alba-footer-action';
  a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
  a.target = '_blank';
  a.rel = 'noopener';
  a.innerHTML = `<div class="action-row"><span class="action-icon">📍</span><span class="action-text">${escapeHtml(title)}</span></div><div class="map-address">${escapeHtml(address)}</div><div class="action-hint alba-blink">${escapeHtml(hint)}</div>`;
  return a;
}

function extractSection(text, startRegex, beforeRegex) {
  if (!text) return "";
  const start = text.search(startRegex);
  if (start === -1) return "";
  const sliced = text.slice(start);
  if (!beforeRegex) return sliced.trim();
  const end = sliced.search(beforeRegex);
  if (end === -1) return sliced.trim();
  return sliced.slice(0, end).trim();
}

function escapeHtml(str) {
  return String(str || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function injectFooterStyles() {
  if (document.getElementById("alba-footer-style-v5")) return;
  const s = document.createElement("style");
  s.id = "alba-footer-style-v5";
  s.textContent = `
    .alba-footer-contact-panel { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 20px; }
    .alba-footer-action { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 16px; border-radius: 12px; background: rgba(15,23,42,0.88); border: 1px solid rgba(148,163,184,0.45); color: #e5e7eb; text-decoration: none; width: 100%; max-width: 360px; box-shadow: 0 16px 40px rgba(15,23,42,0.8); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease; }
    .alba-footer-action:hover { transform: translateY(-1px); box-shadow: 0 20px 55px rgba(15,23,42,0.95); border-color: rgba(56,189,248,0.8); background: radial-gradient(circle at top, rgba(15,23,42,1), rgba(8,47,73,0.96)); }
    .action-row { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; }
    .action-icon { font-size: 18px; }
    .action-text { letter-spacing: 0.01em; }
    .map-address { margin-top: 6px; font-size: 13px; color: #cbd5f5; text-align: center; line-height: 1.35; }
    .action-hint { margin-top: 6px; font-size: 12px; color: #60a5fa; }
    .alba-blink { animation: albaBlink 1.6s ease-in-out infinite; }
    @keyframes albaBlink { 0%, 100% { opacity: 1; transform: translateY(0); } 50% { opacity: 0.4; transform: translateY(-1px); } }
  `;
  document.head.appendChild(s);
}

function getAlbamenSessionId() {
  let id = localStorage.getItem('albamen_session_id');
  if (!id) {
    if (window.crypto && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = 'sess-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    }
    localStorage.setItem('albamen_session_id', id);
  }
  return id;
}


function getAlbamenIdentity() {
  return {
    sessionId: getAlbamenSessionId(),
    name: localStorage.getItem('albamen_user_name') || null,
    age: localStorage.getItem('albamen_user_age') || null,
  };
}



/**
 * Unified AI Chat Widget
 * Combines text chat and voice chat in one window
 * Matches Albamen page design with dark theme and cyan/green accents
 */


// ── Alba Model Player — автозагрузка на страницах с model-viewer ──
(function loadAlbaModelPlayer() {
  if (!document.querySelector('model-viewer')) return;
  var s = document.createElement('script');
  s.src = '/assets/js/alba-model-player.js';
  s.defer = true;
  document.head.appendChild(s);
})();
function injectUnifiedAiWidget() {
  const path = window.location.pathname || '/';
  const isEn = path.startsWith('/eng/');
  const isRu = path.startsWith('/rus/');
  const WORKER = 'https://divine-flower-a0ae.nncdecdgc.workers.dev';

  const strings = isEn ? {
    placeholder: 'Send a message...',
    listening: 'Listening...',
    initialStatus: 'How can I help you today?',
    welcomeBack: 'Welcome back, ',
    voiceNotSupported: 'Voice not supported',
    connectionError: 'Connection error.',
    speakBtn: 'Play', micTitle: 'Voice message'
  } : isRu ? {
    placeholder: 'Напишите сообщение...',
    listening: 'Слушаю...',
    initialStatus: 'Чем я могу вам помочь?',
    welcomeBack: 'С возвращением, ',
    voiceNotSupported: 'Голос не поддерживается',
    connectionError: 'Ошибка соединения.',
    speakBtn: 'Озвучить', micTitle: 'Голосовое'
  } : {
    placeholder: 'Bir mesaj yazın...',
    listening: 'Dinliyorum...',
    initialStatus: 'Bugün sana nasıl yardım edebilirim?',
    welcomeBack: 'Tekrar hoş geldin, ',
    voiceNotSupported: 'Ses desteği yok',
    connectionError: 'Bağlantı hatası.',
    speakBtn: 'Dinle', micTitle: 'Sesli mesaj'
  };

  const storedName = localStorage.getItem('albamen_user_name');
  if (storedName) strings.initialStatus = strings.welcomeBack + storedName + '! 🚀';

  const sessionId = getAlbamenSessionId();
  const avatarSrc = '/assets/images/albamenai.png';
  const voiceLang = isEn ? 'en' : isRu ? 'ru' : 'tr';

  if (document.getElementById('ai-unified-widget')) return;

  // ── CSS ──
  if (!document.getElementById('ai-unified-style')) {
    const style = document.createElement('style');
    style.id = 'ai-unified-style';
    style.textContent = `
      .ai-widget-button{position:fixed;bottom:calc(50vh + 20px);right:20px;width:64px;height:64px;border-radius:50%;background:#020617;border:2px solid rgba(56,189,248,.5);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(6,182,212,.4);transition:transform .3s,box-shadow .3s;z-index:1200;overflow:hidden;padding:6px;}
      .ai-widget-button:hover{transform:scale(1.1);box-shadow:0 12px 32px rgba(6,182,212,.6);}
      .ai-widget-button:active{transform:scale(.95);}
      .ai-unified-widget{position:fixed;bottom:20px;right:20px;width:400px;max-width:92vw;height:54vh;max-height:54vh;background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid rgba(56,189,248,.18);border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 40px rgba(6,182,212,.08);display:none;flex-direction:column;overflow:hidden;z-index:1201;animation:aiSlideUp .3s cubic-bezier(.16,1,.3,1);}
      .ai-unified-widget.open{display:flex;}
      @keyframes aiSlideUp{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
      .ai-widget-header{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(56,189,248,.1);background:rgba(15,23,42,.85);flex-shrink:0;}
      .ai-header-avatar{width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(56,189,248,.4);object-fit:cover;flex-shrink:0;}
      .ai-header-title{flex:1;font-size:13px;font-weight:600;color:#e2e8f0;display:flex;flex-direction:column;gap:1px;}
      .ai-header-title span{font-size:10px;color:#22c55e;font-weight:400;}
      .ai-header-close{background:transparent;border:none;color:#94a3b8;font-size:22px;cursor:pointer;padding:0;width:28px;height:28px;display:flex;align-items:center;justify-content:center;transition:color .2s,transform .2s;}
      .ai-header-close:hover{color:#38bdf8;transform:rotate(90deg);}
      #aiChatPlayer{flex-shrink:0;margin:8px 10px 0;padding:8px 12px 7px;background:linear-gradient(135deg,rgba(2,6,23,.95),rgba(15,23,42,.98));border:1px solid rgba(56,189,248,.2);border-radius:12px;box-shadow:0 0 0 1px rgba(56,189,248,.06),0 4px 16px rgba(0,0,0,.5);font-family:'Courier New',monospace;display:none;}
      #aiChatPlayer.has-track{display:block;}
      .acp-track{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#38bdf8;opacity:.8;margin-bottom:6px;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .acp-dot{width:5px;height:5px;border-radius:50%;background:#38bdf8;box-shadow:0 0 6px #38bdf8;flex-shrink:0;animation:acpPulse 2s ease-in-out infinite;}
      @keyframes acpPulse{0%,100%{opacity:1}50%{opacity:.35}}
      .acp-row{display:flex;align-items:center;gap:8px;}
      .acp-btn{width:28px;height:28px;border-radius:50%;border:1px solid rgba(56,189,248,.35);background:rgba(56,189,248,.07);color:#38bdf8;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .15s,transform .1s;}
      .acp-btn svg{width:13px;height:13px;}
      .acp-btn:hover{background:rgba(56,189,248,.2);}
      .acp-btn:active{transform:scale(.9);}
      .acp-btn-stop{border-color:rgba(168,85,247,.35);background:rgba(168,85,247,.07);color:#a855f7;}
      .acp-btn-stop:hover{background:rgba(168,85,247,.2);}
      .acp-mid{flex:1;position:relative;height:28px;display:flex;align-items:center;}
      .acp-bar{width:100%;height:3px;background:rgba(255,255,255,.07);border-radius:99px;position:relative;cursor:pointer;display:none;}
      .acp-bar.vis{display:block;}
      .acp-fill{height:100%;width:0%;background:linear-gradient(90deg,#38bdf8,#a855f7);border-radius:99px;transition:width .1s linear;}
      .acp-thumb{width:9px;height:9px;background:#fff;border-radius:50%;position:absolute;top:50%;left:0%;transform:translate(-50%,-50%);transition:left .1s linear;cursor:pointer;}
      .acp-load{display:none;align-items:flex-end;gap:2px;height:18px;width:100%;justify-content:center;}
      .acp-load.vis{display:flex;}
      .acp-load span{display:block;width:3px;background:linear-gradient(to top,#38bdf8,#a855f7);border-radius:2px;animation:acpLoad .75s ease-in-out infinite;opacity:.7;}
      .acp-load span:nth-child(1){height:5px;animation-delay:0s}.acp-load span:nth-child(2){height:10px;animation-delay:.07s}.acp-load span:nth-child(3){height:16px;animation-delay:.14s}.acp-load span:nth-child(4){height:10px;animation-delay:.21s}.acp-load span:nth-child(5){height:5px;animation-delay:.28s}.acp-load span:nth-child(6){height:10px;animation-delay:.35s}
      @keyframes acpLoad{0%,100%{transform:scaleY(.35);opacity:.35}50%{transform:scaleY(1);opacity:1}}
      .acp-eq{display:none;align-items:flex-end;gap:2px;height:18px;width:100%;justify-content:center;}
      .acp-eq.vis{display:flex;}
      .acp-eq span{display:block;width:3px;background:linear-gradient(to top,#38bdf8,#a855f7);border-radius:2px;animation:acpEq .55s ease-in-out infinite alternate;}
      .acp-eq span:nth-child(1){height:5px;animation-duration:.42s}.acp-eq span:nth-child(2){height:14px;animation-duration:.58s}.acp-eq span:nth-child(3){height:18px;animation-duration:.36s}.acp-eq span:nth-child(4){height:11px;animation-duration:.67s}.acp-eq span:nth-child(5){height:7px;animation-duration:.48s}
      @keyframes acpEq{from{transform:scaleY(.28);opacity:.45}to{transform:scaleY(1);opacity:1}}
      .acp-time{font-size:10px;color:#64748b;white-space:nowrap;flex-shrink:0;display:flex;align-items:center;gap:1px;min-width:52px;}
      .acp-cur{color:#38bdf8;font-weight:700;}
      .acp-sep{color:#334155;margin:0 1px;}
      .ai-messages-container{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;}
      .ai-messages-container::-webkit-scrollbar{width:4px;}
      .ai-messages-container::-webkit-scrollbar-thumb{background:rgba(56,189,248,.25);border-radius:10px;}
      .ai-message{display:flex;gap:6px;animation:aiMsgIn .2s ease;}
      @keyframes aiMsgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      .ai-message.user{justify-content:flex-end;}
      .ai-message.bot{justify-content:flex-start;align-items:flex-end;}
      .ai-msg-avatar{width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;margin-bottom:2px;border:1px solid rgba(56,189,248,.3);}
      .ai-msg-wrap{display:flex;flex-direction:column;gap:3px;max-width:72%;}
      .ai-message.user .ai-msg-wrap{align-items:flex-end;}
      .ai-message-content{padding:9px 13px;border-radius:16px;word-wrap:break-word;font-size:13px;line-height:1.45;}
      .ai-message.user .ai-message-content{background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:#fff;border-bottom-right-radius:4px;}
      .ai-message.bot .ai-message-content{background:rgba(56,189,248,.09);color:#e2e8f0;border-bottom-left-radius:4px;border:1px solid rgba(56,189,248,.15);}
      .ai-msg-speak-btn{display:inline-flex;align-items:center;gap:4px;background:none;border:none;color:#38bdf8;font-size:10px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:.08em;cursor:pointer;padding:2px 4px;border-radius:6px;opacity:.55;transition:opacity .2s;}
      .ai-msg-speak-btn:hover{opacity:1;}
      .ai-msg-speak-btn svg{width:11px;height:11px;}
      .ai-msg-speak-btn.active{color:#a855f7;opacity:1;}
      .ai-typing-dots span{display:inline-block;width:5px;height:5px;border-radius:50%;background:#38bdf8;margin:0 2px;animation:aiDot .9s ease-in-out infinite;}
      .ai-typing-dots span:nth-child(2){animation-delay:.15s}.ai-typing-dots span:nth-child(3){animation-delay:.30s}
      @keyframes aiDot{0%,80%,100%{transform:scale(.5);opacity:.4}40%{transform:scale(1);opacity:1}}
      .ai-input-area{display:flex;gap:7px;padding:9px 12px;border-top:1px solid rgba(56,189,248,.08);background:rgba(15,23,42,.7);flex-shrink:0;}
      .ai-input-field{flex:1;background:rgba(56,189,248,.05);border:1px solid rgba(56,189,248,.18);color:#e2e8f0;padding:9px 11px;border-radius:12px;font-size:13px;transition:border-color .2s,background .2s;}
      .ai-input-field:focus{outline:none;border-color:rgba(56,189,248,.45);background:rgba(56,189,248,.08);}
      .ai-input-field::placeholder{color:#475569;}
      .ai-action-btn{width:36px;height:36px;border-radius:11px;border:1px solid rgba(56,189,248,.2);background:rgba(56,189,248,.06);color:#38bdf8;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .18s,transform .1s;}
      .ai-action-btn:hover{background:rgba(56,189,248,.18);}
      .ai-action-btn:active{transform:scale(.9);}
      .ai-action-btn.recording{background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.4);color:#ef4444;animation:aiRecPulse 1s ease-in-out infinite;}
      @keyframes aiRecPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}
      @media(max-width:480px){
        .ai-unified-widget{width:100%;max-width:100%;height:72vh;bottom:0;left:0;right:0;border-radius:16px 16px 0 0;padding-bottom:env(safe-area-inset-bottom,12px);}
        .ai-widget-button{width:48px;height:48px;bottom:calc(72vh + 12px);right:14px;}
      }
    `;
    document.head.appendChild(style);
  }

  // ── Floating button ──
  const button = document.createElement('button');
  button.className = 'ai-widget-button'; button.id = 'ai-widget-button';
  button.setAttribute('aria-label', isEn ? 'Open AI Chat' : 'AI Sohbeti Aç');
  button.innerHTML = `<img src="${avatarSrc}" alt="AI" style="width:100%;height:100%;object-fit:contain;">`;
  button.addEventListener('click', () => {
    const w = document.getElementById('ai-unified-widget');
    if (w) { w.classList.toggle('open'); button.style.display = w.classList.contains('open') ? '' : 'none'; }
  });
  button.style.display = 'none';
  document.body.appendChild(button);

  // ── Widget HTML ──
  const widget = document.createElement('div');
  widget.className = 'ai-unified-widget'; widget.id = 'ai-unified-widget';
  widget.innerHTML = `
    <div class="ai-widget-header">
      <img src="${avatarSrc}" class="ai-header-avatar" alt="Albamen">
      <div class="ai-header-title">Albamen AI<span>● Online</span></div>
      <button class="ai-header-close" id="ai-widget-close">×</button>
    </div>
    <div id="aiChatPlayer">
      <div class="acp-track"><span class="acp-dot"></span><span id="acpLabel">—</span></div>
      <div class="acp-row">
        <button class="acp-btn" id="acpPlay"><svg id="acpIcoPlay" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><svg id="acpIcoPause" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></button>
        <button class="acp-btn acp-btn-stop" id="acpStop"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg></button>
        <div class="acp-mid">
          <div class="acp-load" id="acpLoad"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          <div class="acp-bar" id="acpBar"><div class="acp-fill" id="acpFill"></div><div class="acp-thumb" id="acpThumb"></div></div>
          <div class="acp-eq" id="acpEq"><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="acp-time"><span class="acp-cur" id="acpCur">0:00</span><span class="acp-sep">/</span><span id="acpDur">—:——</span></div>
      </div>
    </div>
    <div class="ai-messages-container" id="ai-messages-list"></div>
    <div class="ai-input-area">
      <button class="ai-action-btn" id="ai-mic-btn" title="${strings.micTitle}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
      </button>
      <input type="text" class="ai-input-field" id="ai-input-field" placeholder="${strings.placeholder}">
      <button class="ai-action-btn" id="ai-send-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(widget);

  // ── Close ──
  document.getElementById('ai-widget-close').addEventListener('click', () => {
    widget.classList.remove('open'); button.style.display = 'none';
  });

  // ── Mini player logic ──
  const player   = document.getElementById('aiChatPlayer');
  const acpLabel = document.getElementById('acpLabel');
  const acpPlay  = document.getElementById('acpPlay');
  const acpStop  = document.getElementById('acpStop');
  const acpIcoPlay  = document.getElementById('acpIcoPlay');
  const acpIcoPause = document.getElementById('acpIcoPause');
  const acpBar   = document.getElementById('acpBar');
  const acpFill  = document.getElementById('acpFill');
  const acpThumb = document.getElementById('acpThumb');
  const acpLoad  = document.getElementById('acpLoad');
  const acpEq    = document.getElementById('acpEq');
  const acpCur   = document.getElementById('acpCur');
  const acpDur   = document.getElementById('acpDur');

  let _acpAudio = null, _acpText = '', _acpLoading = false;

  function acpFmt(s) {
    if (!isFinite(s)||s<0) return '—:——';
    return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  }

  function acpSetState(st) {
    acpLoad.classList.toggle('vis', st==='loading');
    acpEq.classList.toggle('vis',   st==='playing');
    acpBar.classList.toggle('vis',  st==='playing'||st==='paused');
    acpIcoPlay.style.display  = st==='playing' ? 'none' : '';
    acpIcoPause.style.display = st==='playing' ? '' : 'none';
    document.querySelectorAll('.ai-msg-speak-btn').forEach(b => {
      b.classList.toggle('active', st==='playing' && b.dataset.text===_acpText);
    });
  }

  function acpDestroy() {
    if (_acpAudio) { _acpAudio.pause(); _acpAudio.src=''; _acpAudio=null; }
    acpFill.style.width='0%'; acpThumb.style.left='0%';
    acpCur.textContent='0:00'; acpDur.textContent='—:——';
  }

  function acpPlayText(text, label) {
    acpDestroy();
    _acpText = text; _acpLoading = true;
    player.classList.add('has-track');
    acpLabel.textContent = label || (text.slice(0,40)+(text.length>40?'…':''));
    acpSetState('loading');

    fetch(WORKER+'/tts', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({text: text.slice(0,800), language: voiceLang})
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (!data.audioBase64) throw new Error('no audio');
        const bin=atob(data.audioBase64), buf=new Uint8Array(bin.length);
        for (let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([buf],{type:'audio/mpeg'}));
        _acpAudio = new Audio(url);
        _acpLoading = false;
        _acpAudio.addEventListener('loadedmetadata', ()=>{ acpDur.textContent=acpFmt(_acpAudio.duration); });
        _acpAudio.addEventListener('timeupdate', ()=>{
          if (!_acpAudio.duration) return;
          const p=(_acpAudio.currentTime/_acpAudio.duration)*100;
          acpFill.style.width=p+'%'; acpThumb.style.left=p+'%';
          acpCur.textContent=acpFmt(_acpAudio.currentTime);
        });
        _acpAudio.addEventListener('ended', ()=>{ URL.revokeObjectURL(url); acpDestroy(); acpSetState('stopped'); });
        _acpAudio.addEventListener('error', ()=>{ URL.revokeObjectURL(url); acpDestroy(); acpSetState('stopped'); });
        _acpAudio.play()
          .then(()=>{ acpBar.classList.add('vis'); acpSetState('playing'); })
          .catch(()=>acpSetState('stopped'));
      })
      .catch(()=>{ _acpLoading=false; acpSetState('stopped'); });
  }

  acpPlay.addEventListener('click', ()=>{
    if (_acpLoading) return;
    if (!_acpAudio||!_acpAudio.src||_acpAudio.ended) { if (_acpText) acpPlayText(_acpText, acpLabel.textContent); return; }
    if (_acpAudio.paused) { _acpAudio.play(); acpSetState('playing'); }
    else { _acpAudio.pause(); acpSetState('paused'); }
  });

  acpStop.addEventListener('click', ()=>{ acpDestroy(); acpSetState('stopped'); });

  acpBar.addEventListener('click', e=>{
    if (!_acpAudio||!_acpAudio.duration) return;
    const r=acpBar.getBoundingClientRect();
    _acpAudio.currentTime=((e.clientX-r.left)/r.width)*_acpAudio.duration;
  });

  // ── Messages ──
  const messagesList = document.getElementById('ai-messages-list');

  function addMessage(text, type, id) {
    const wrap = document.createElement('div');
    wrap.className = `ai-message ${type}`;
    if (id) wrap.id = id;

    if (type === 'bot') {
      const av = document.createElement('img');
      av.src = avatarSrc; av.className = 'ai-msg-avatar'; av.alt = 'AI';
      wrap.appendChild(av);
    }

    const msgWrap = document.createElement('div');
    msgWrap.className = 'ai-msg-wrap';

    const content = document.createElement('div');
    content.className = 'ai-message-content';
    if (type === 'bot') content.innerHTML = text;
    else content.textContent = text;
    msgWrap.appendChild(content);

    // Кнопка озвучить — только для бота и не для индикатора загрузки
    if (type === 'bot' && !id) {
      const cleanText = text.replace(/<[^>]+>/g,'').trim();
      const speakBtn = document.createElement('button');
      speakBtn.className = 'ai-msg-speak-btn';
      speakBtn.dataset.text = cleanText;
      speakBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>${strings.speakBtn}`;
      speakBtn.addEventListener('click', ()=>{
        acpPlayText(cleanText, cleanText.slice(0,38)+(cleanText.length>38?'…':''));
      });
      msgWrap.appendChild(speakBtn);
    }

    wrap.appendChild(msgWrap);
    messagesList.appendChild(wrap);
    messagesList.scrollTop = messagesList.scrollHeight;
    return wrap;
  }

  // ── Send ──
  const inputField = document.getElementById('ai-input-field');
  const sendBtn    = document.getElementById('ai-send-btn');

  function sendMessage(text) {
    const txt = (text || inputField.value).trim();
    if (!txt) return;
    if (!text) inputField.value = '';
    addMessage(txt, 'user');

    const loadId = 'ld-' + Date.now();
    const ldDiv = addMessage('', 'bot', loadId);
    ldDiv.querySelector('.ai-message-content').innerHTML =
      '<span class="ai-typing-dots"><span></span><span></span><span></span></span>';

    fetch(WORKER, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        message: txt, sessionId,
        language: voiceLang,
        savedName: localStorage.getItem('albamen_user_name')||null,
        savedAge:  localStorage.getItem('albamen_user_age') ||null
      })
    })
      .then(r=>r.json())
      .then(data=>{
        document.getElementById(loadId)?.remove();
        if (!data||typeof data.reply!=='string'){ addMessage(strings.connectionError,'bot'); return; }
        if (data.saveName) localStorage.setItem('albamen_user_name', data.saveName.trim());
        if (data.saveAge)  localStorage.setItem('albamen_user_age',  data.saveAge.trim());
        addMessage(data.reply.trim()||strings.connectionError, 'bot');
      })
      .catch(()=>{ document.getElementById(loadId)?.remove(); addMessage(strings.connectionError,'bot'); });
  }

  sendBtn.addEventListener('click', ()=>sendMessage());
  inputField.addEventListener('keydown', e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} });

  // ── Microphone ──
  const micBtn = document.getElementById('ai-mic-btn');
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null, isListening = false;

  if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.lang = isEn ? 'en-US' : isRu ? 'ru-RU' : 'tr-TR';
    recognition.interimResults = true;
    recognition.addEventListener('result', e=>{
      inputField.value = Array.from(e.results).map(r=>r[0].transcript).join('').trim();
    });
    recognition.addEventListener('end', ()=>{
      isListening = false; micBtn.classList.remove('recording');
      inputField.placeholder = strings.placeholder;
      const t = inputField.value.trim();
      if (t) sendMessage(t);
    });
    recognition.addEventListener('error', ()=>{ isListening=false; micBtn.classList.remove('recording'); inputField.placeholder=strings.placeholder; });
  }

  micBtn.addEventListener('click', ()=>{
    if (!recognition){ inputField.placeholder=strings.voiceNotSupported; return; }
    if (isListening){ recognition.stop(); return; }
    isListening=true; micBtn.classList.add('recording');
    inputField.value=''; inputField.placeholder=strings.listening;
    recognition.start();
  });

} // end injectUnifiedAiWidget
