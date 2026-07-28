/* tc-mega-menu — shared-shell megamenu, screenshot slider, mobile drawer.
   Accessibility model: APG disclosure navigation (buttons with aria-expanded,
   inactive panes hidden+inert, Esc returns focus to the trigger). */

(() => {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
  const HOVER_CAPABLE = window.matchMedia('(hover: hover)');

  class TcMegaMenu extends HTMLElement {
    connectedCallback() {
      this.shell = this.querySelector('[data-tc-shell]');
      this.panes = Array.from(this.querySelectorAll('.tc-mega__pane'));
      this.triggers = Array.from(this.querySelectorAll('[data-tc-trigger]'));
      if (!this.shell || !this.triggers.length) return;
      this.order = this.panes.map((p) => p.id);
      this.current = null;
      this.closeTimer = null;
      this.hideTimer = null;

      this.triggers.forEach((btn) => {
        const id = `TcPane-${btn.dataset.tcTrigger}`;
        btn.addEventListener('click', () => {
          this.current === id ? this.closeAll() : this.open(id);
        });
        if (HOVER_CAPABLE.matches) {
          btn.closest('.tc-mega__item').addEventListener('mouseenter', () => this.open(id));
          btn.closest('.tc-mega__item').addEventListener('mouseleave', () => this.scheduleClose());
        }
      });
      if (HOVER_CAPABLE.matches) {
        this.shell.addEventListener('mouseenter', () => clearTimeout(this.closeTimer));
        this.shell.addEventListener('mouseleave', () => this.scheduleClose());
      }

      this.onKeydown = (e) => {
        if (e.key === 'Escape' && this.current) {
          const trigger = this.triggerFor(this.current);
          this.closeAll();
          if (trigger) trigger.focus();
        }
      };
      this.onPointerDown = (e) => {
        if (this.current && !this.contains(e.target)) this.closeAll();
      };
      this.onFocusOut = () => {
        // Close when keyboard focus leaves the component entirely.
        requestAnimationFrame(() => {
          if (this.current && !this.contains(document.activeElement)) this.closeAll();
        });
      };
      document.addEventListener('keydown', this.onKeydown);
      document.addEventListener('pointerdown', this.onPointerDown);
      this.addEventListener('focusout', this.onFocusOut);
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.onKeydown);
      document.removeEventListener('pointerdown', this.onPointerDown);
    }

    triggerFor(paneId) {
      const btn = this.triggers.find((t) => `TcPane-${t.dataset.tcTrigger}` === paneId);
      return btn || null;
    }

    pane(id) {
      return this.panes.find((p) => p.id === id);
    }

    open(id) {
      clearTimeout(this.closeTimer);
      if (this.current === id) return;
      const next = this.pane(id);
      if (!next) return;
      const prevId = this.current;
      this.current = id;

      this.triggers.forEach((t) => {
        const owns = `TcPane-${t.dataset.tcTrigger}` === id;
        t.setAttribute('aria-expanded', owns ? 'true' : 'false');
        t.closest('.tc-mega__item').classList.toggle('is-open', owns);
      });
      this.classList.add('is-open');

      clearTimeout(this.hideTimer);
      next.hidden = false;
      next.inert = false;

      if (prevId && !REDUCED_MOTION.matches) {
        const prev = this.pane(prevId);
        const dir = this.order.indexOf(id) > this.order.indexOf(prevId) ? 1 : -1;
        prev.classList.remove('is-active');
        prev.inert = true;
        prev.style.transform = `translateX(${-42 * dir}px)`;
        this.hideTimer = setTimeout(() => {
          prev.hidden = true;
          prev.style.transform = '';
        }, 260);

        next.style.transition = 'none';
        next.style.transform = `translateX(${42 * dir}px)`;
        void next.offsetWidth;
        next.style.transition = '';
        next.classList.add('is-active');
        next.style.transform = '';
      } else {
        if (prevId) {
          const prev = this.pane(prevId);
          prev.classList.remove('is-active');
          prev.hidden = true;
          prev.inert = true;
        }
        next.classList.add('is-active');
      }
      this.shell.style.height = `${next.offsetHeight}px`;
      next.querySelectorAll('tc-slider').forEach((s) => s.wake && s.wake());
    }

    closeAll() {
      if (!this.current) return;
      const cur = this.pane(this.current);
      cur.classList.remove('is-active');
      cur.inert = true;
      clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => {
        cur.hidden = true;
      }, 260);
      this.triggers.forEach((t) => {
        t.setAttribute('aria-expanded', 'false');
        t.closest('.tc-mega__item').classList.remove('is-open');
      });
      this.classList.remove('is-open');
      this.shell.style.height = '0px';
      this.current = null;
    }

    scheduleClose() {
      clearTimeout(this.closeTimer);
      this.closeTimer = setTimeout(() => this.closeAll(), 160);
    }
  }

  class TcSlider extends HTMLElement {
    connectedCallback() {
      this.viewport = this.querySelector('[data-tc-viewport]');
      this.track = this.querySelector('[data-tc-track]');
      if (!this.viewport || !this.track) return;
      this.slides = Array.from(this.track.children);
      this.caption = this.querySelector('[data-tc-caption]');
      this.dotsWrap = this.querySelector('[data-tc-dots]');
      this.idx = 0;
      this.timer = null;
      this.autoplayMs = parseInt(this.dataset.autoplay || '0', 10);
      if (REDUCED_MOTION.matches) this.autoplayMs = 0;

      if (this.dotsWrap) {
        this.slides.forEach((_, i) => {
          const d = document.createElement('button');
          d.type = 'button';
          d.setAttribute('aria-label', `Slide ${i + 1} of ${this.slides.length}`);
          d.addEventListener('click', () => {
            this.go(i);
            this.restart();
          });
          this.dotsWrap.appendChild(d);
        });
      }
      this.slides.forEach((img) => (img.draggable = false));
      const prev = this.querySelector('[data-tc-prev]');
      const next = this.querySelector('[data-tc-next]');
      if (prev) prev.addEventListener('click', () => { this.go(this.idx - 1); this.restart(); });
      if (next) next.addEventListener('click', () => { this.go(this.idx + 1); this.restart(); });

      this.addEventListener('mouseenter', () => this.pause());
      this.addEventListener('mouseleave', () => this.restart());
      this.addEventListener('focusin', () => this.pause());
      this.addEventListener('focusout', () => this.restart());

      // drag like a physical slider: track follows the pointer, snaps on release
      this.dragX = null;
      this.dx = 0;
      this.viewport.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        this.dragX = e.clientX;
        this.dx = 0;
        this.viewport.classList.add('is-dragging');
        this.viewport.setPointerCapture(e.pointerId);
        this.pause();
      });
      this.viewport.addEventListener('pointermove', (e) => {
        if (this.dragX === null) return;
        this.dx = e.clientX - this.dragX;
        this.track.style.transform = `translateX(calc(${-this.idx * 100}% + ${this.dx}px))`;
      });
      const endDrag = () => {
        if (this.dragX === null) return;
        this.viewport.classList.remove('is-dragging');
        const w = this.viewport.clientWidth;
        if (Math.abs(this.dx) > w * 0.15) this.go(this.idx + (this.dx < 0 ? 1 : -1));
        else this.go(this.idx);
        this.dragX = null;
        this.restart();
      };
      this.viewport.addEventListener('pointerup', endDrag);
      this.viewport.addEventListener('pointercancel', endDrag);

      this.go(0);
      this.restart();
    }

    disconnectedCallback() {
      this.pause();
    }

    go(i) {
      const len = this.slides.length;
      if (!len) return;
      this.idx = ((i % len) + len) % len;
      this.track.style.transform = `translateX(${-this.idx * 100}%)`;
      this.slides.forEach((s, n) => s.setAttribute('aria-hidden', n === this.idx ? 'false' : 'true'));
      if (this.dotsWrap) {
        Array.from(this.dotsWrap.children).forEach((d, n) =>
          d.setAttribute('aria-current', n === this.idx ? 'true' : 'false')
        );
      }
      if (this.caption) {
        const text = this.slides[this.idx].dataset.caption || '';
        if (REDUCED_MOTION.matches) {
          this.caption.textContent = text;
        } else {
          this.caption.style.opacity = '0';
          setTimeout(() => {
            this.caption.textContent = text;
            this.caption.style.opacity = '1';
          }, 160);
        }
      }
    }

    pause() {
      clearInterval(this.timer);
      this.timer = null;
    }

    restart() {
      this.pause();
      if (!this.autoplayMs) return;
      this.timer = setInterval(() => {
        // don't advance while our pane is hidden
        if (this.offsetParent === null) return;
        this.go(this.idx + 1);
      }, this.autoplayMs);
    }

    wake() {
      this.go(this.idx);
      this.restart();
    }
  }

  class TcMegaDrawer extends HTMLElement {
    connectedCallback() {
      this.burger = this.querySelector('[data-tc-burger]');
      this.drawer = this.querySelector('.tc-drawer');
      this.scrim = this.querySelector('[data-tc-scrim]');
      if (!this.burger || !this.drawer) return;

      this.burger.addEventListener('click', () => this.openDrawer());
      const close = this.querySelector('[data-tc-close]');
      if (close) close.addEventListener('click', () => this.closeDrawer());
      if (this.scrim) this.scrim.addEventListener('click', () => this.closeDrawer());
      this.onKeydown = (e) => {
        if (e.key === 'Escape' && this.isOpen()) this.closeDrawer();
      };
      document.addEventListener('keydown', this.onKeydown);

      this.querySelectorAll('[data-tc-accordion]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const group = btn.closest('.tc-drawer__group');
          const open = group.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      });
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.onKeydown);
      document.body.classList.remove('tc-drawer-open');
      document.body.style.overflow = '';
    }

    isOpen() {
      return document.body.classList.contains('tc-drawer-open');
    }

    openDrawer() {
      this.drawer.hidden = false;
      if (this.scrim) this.scrim.hidden = false;
      requestAnimationFrame(() => document.body.classList.add('tc-drawer-open'));
      document.body.style.overflow = 'hidden';
      this.burger.setAttribute('aria-expanded', 'true');
      if (window.trapFocus) window.trapFocus(this.drawer);
      else this.drawer.querySelector('a, button')?.focus();
    }

    closeDrawer() {
      document.body.classList.remove('tc-drawer-open');
      document.body.style.overflow = '';
      this.burger.setAttribute('aria-expanded', 'false');
      if (window.removeTrapFocus) window.removeTrapFocus(this.burger);
      this.burger.focus();
      setTimeout(() => {
        this.drawer.hidden = true;
        if (this.scrim) this.scrim.hidden = true;
      }, REDUCED_MOTION.matches ? 0 : 250);
    }
  }

  if (!customElements.get('tc-mega-menu')) customElements.define('tc-mega-menu', TcMegaMenu);
  if (!customElements.get('tc-slider')) customElements.define('tc-slider', TcSlider);
  if (!customElements.get('tc-mega-drawer')) customElements.define('tc-mega-drawer', TcMegaDrawer);

  // Theme editor: selecting a block opens the pane that contains it.
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:block:select', (e) => {
      const menu = document.querySelector('tc-mega-menu');
      if (!menu || !menu.contains(e.target)) return;
      const pane = e.target.closest('.tc-mega__pane');
      const trigger = e.target.querySelector('[data-tc-trigger]') || e.target.closest('[data-tc-trigger]');
      if (pane) menu.open(pane.id);
      else if (trigger && trigger.dataset.tcTrigger) menu.open(`TcPane-${trigger.dataset.tcTrigger}`);
    });
    document.addEventListener('shopify:section:deselect', () => {
      document.querySelector('tc-mega-menu')?.closeAll();
    });
  }
})();
