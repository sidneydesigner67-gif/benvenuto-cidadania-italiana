/* Benvenuto — interações
   Princípio: todo o conteúdo é visível sem JS; o movimento só é aplicado
   quando o GSAP carrega e o visitante não pediu movimento reduzido. */
(() => {
  const root = document.documentElement;
  // ?nomotion força o caminho de movimento reduzido (QA e capturas de tela)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]nomotion\b/.test(location.search);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const WA = 'https://wa.me/5548999943359?text=';

  const header = $('.site-header');
  const hero = $('.hero');
  const menuBtn = $('.menu-btn');
  const menu = $('#menu-mobile');
  const waFloat = $('.wa-float');

  /* ---------- Header: transparente só sobre o hero escuro; some ao descer, volta ao subir ---------- */
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    const solidFrom = hero ? hero.offsetHeight - header.offsetHeight - 2 : -1;
    header.classList.toggle('is-solid', y >= solidFrom);
    if (!header.classList.contains('menu-open')) {
      header.classList.toggle('is-hidden', y > lastY && y > Math.max(solidFrom, 0) + 200);
    }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.menu-btn__label', menuBtn).textContent = open ? 'Fechar' : 'Menu';
    menu.hidden = !open;
    header.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      $('a', menu).focus();
      if (window.gsap && !reduce) {
        gsap.fromTo($$('ol li', menu), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out' });
      }
    }
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Serviços (home): acordeão, um aberto por vez ---------- */
  $$('.svc').forEach((item) => {
    const btn = $('.svc__btn', item);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      $$('.svc.is-open').forEach((o) => {
        if (o !== item) { o.classList.remove('is-open'); $('.svc__btn', o).setAttribute('aria-expanded', 'false'); }
      });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- WhatsApp flutuante ----------
     Com hero: aparece depois dele. Sem hero: depois de 320px de rolagem.
     Some no CTA final e no rodapé, que já têm o próprio WhatsApp e cujos links ele cobriria. */
  const vis = { top: true, end: false, footer: false };
  const updateFloat = () => waFloat.classList.toggle('is-visible', !vis.top && !vis.end && !vis.footer);
  const watch = (el, key, threshold) => el && new IntersectionObserver(([e]) => { vis[key] = e.isIntersecting; updateFloat(); }, { threshold }).observe(el);
  if (hero) watch(hero, 'top', 0.15);
  else {
    const onTop = () => { vis.top = scrollY < 320; updateFloat(); };
    addEventListener('scroll', onTop, { passive: true });
    onTop();
  }
  watch($('.end'), 'end', 0.2);
  watch($('.site-footer'), 'footer', 0);

  /* ---------- Mapa sob demanda ---------- */
  $$('[data-map]').forEach((box) => {
    const btn = $('[data-map-load]', box);
    btn.addEventListener('click', () => {
      box.append($('[data-map-tpl]', box).content.cloneNode(true));
      box.classList.add('is-loaded');
      $('iframe', box).focus();
    });
  });

  /* ---------- Contato: o formulário só monta a mensagem e abre o WhatsApp ---------- */
  const form = $('[data-compose]');
  if (form) {
    const nome = form.elements.nome;
    const erro = $('#c-nome-erro');
    const setError = (on) => { erro.hidden = !on; nome.setAttribute('aria-invalid', String(on)); };
    nome.addEventListener('input', () => { if (nome.value.trim()) setError(false); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!nome.value.trim()) { setError(true); nome.focus(); return; }
      const msg = form.elements.mensagem.value.trim();
      const text = `Olá! Meu nome é ${nome.value.trim()}. Vim pelo site da Benvenuto.\nAssunto: ${form.elements.assunto.value}.` + (msg ? `\n${msg}` : '');
      const url = WA + encodeURIComponent(text);
      if (window.dataLayer) window.dataLayer.push({ event: 'whatsapp_click', cta_origem: 'contato-form' });
      const win = window.open(url, '_blank', 'noopener');
      if (!win) location.href = url;
    });
  }

  /* ---------- Medição de CTAs (dispara só se houver GA4/GTM na página) ---------- */
  $$('[data-cta]').forEach((a) => a.tagName === 'A' && a.addEventListener('click', () => {
    if (window.dataLayer) window.dataLayer.push({ event: 'whatsapp_click', cta_origem: a.dataset.cta });
  }));

  /* ---------- Movimento ---------- */
  const startMotion = () => {
    if (reduce || !window.gsap || !window.ScrollTrigger) { root.classList.remove('anim-ready'); return; }
    gsap.registerPlugin(ScrollTrigger);
    const ease = 'power3.out';
    const arch = 'inset(0% 0% 0% 0% round 999px 999px 0px 0px)';

    // Primeira dobra: entrada orquestrada (hero da home ou cabeçalho das internas)
    const first = hero || $('.page-head');
    if (first) {
      const tl = gsap.timeline({ defaults: { ease } });
      const archEl = $('[data-anim="arch"]', first);
      if (archEl) {
        tl.to(archEl, { clipPath: arch, duration: 1.4 }, 0.1);
        const img = $('.hero__portrait img', first);
        if (img) tl.fromTo(img, { scale: 1.75 }, { scale: 1.5, duration: 1.8 }, 0.1);
      }
      tl.to($$('[data-anim="lines"] .line > span', first), { y: 0, duration: 1.1, stagger: 0.09 }, 0.2)
        .to($$('[data-anim="fade"]', first), { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.5);
    }
    const inFirst = (el) => first && first.contains(el);

    // Demais seções: revelação no scroll
    $$('[data-anim="lines"]').filter((el) => !inFirst(el)).forEach((el) => {
      gsap.to($$('.line > span', el), { y: 0, duration: 1.1, stagger: 0.09, ease, scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    $$('[data-anim="fade"]').filter((el) => !inFirst(el)).forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('[data-anim="arch"]').filter((el) => !inFirst(el)).forEach((el) => {
      gsap.to(el, { clipPath: arch, duration: 1.4, ease, scrollTrigger: { trigger: el, start: 'top 80%' } });
      const img = $('img', el);
      if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.8, ease, scrollTrigger: { trigger: el, start: 'top 80%' } });
    });

    // Gravura do hero: parallax sutil
    if (hero) gsap.to('.hero__engraving', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

    // Linha genealógica: o traço acompanha a leitura das etapas
    $$('.steps-wrap').forEach((wrap) => {
      gsap.fromTo($('.steps__line', wrap), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 70%', end: 'bottom 70%', scrub: 0.4 } });
    });

    // Imagem que expande até a tela cheia (home)
    if ($('.expand')) {
      gsap.matchMedia().add({ desk: '(min-width: 961px)', mob: '(max-width: 960px)' }, (ctx) => {
        const from = ctx.conditions.desk ? 'inset(16% 31% 16% 31%)' : 'inset(22% 10% 34% 10%)';
        gsap.timeline({ scrollTrigger: { trigger: '.expand', start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
          .fromTo('.expand__media', { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 1 })
          .fromTo('.expand__media img', { scale: 1.25 }, { scale: 1, ease: 'none', duration: 1 }, 0)
          .fromTo('.expand__text > *', { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.35, ease: 'power2.out' }, 0.62);
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startMotion);
  else startMotion();
})();
