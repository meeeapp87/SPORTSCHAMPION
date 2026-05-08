import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

  .lp-root {
    font-family: 'Cairo', sans-serif;
    background: #FDFBF7;
    color: #1A1A1A;
    direction: rtl;
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* ── Navbar ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    height: 70px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem;
    background: rgba(253,251,247,.8);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid transparent;
    transition: background .3s, border-color .3s, box-shadow .3s;
  }
  .lp-nav.scrolled {
    background: rgba(253,251,247,.97);
    border-bottom-color: #E8E2D8;
    box-shadow: 0 2px 20px rgba(0,0,0,.06);
  }
  .lp-logo { display: flex; align-items: center; gap: .65rem; text-decoration: none; }
  .lp-logo-badge {
    width: 44px; height: 44px; background: #8A1538; border-radius: 13px;
    display: grid; place-items: center; font-size: 1.3rem; flex-shrink: 0;
  }
  .lp-logo-text strong { display: block; font-size: 1rem; font-weight: 800; color: #8A1538; line-height: 1.2; }
  .lp-logo-text span   { font-size: .7rem; color: #6B6B6B; font-weight: 500; }
  .lp-nav-btn {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .55rem 1.4rem; background: #8A1538; color: #fff;
    font-family: 'Cairo', sans-serif; font-size: .88rem; font-weight: 700;
    border: none; border-radius: 10px; cursor: pointer;
    transition: background .2s, transform .15s;
    text-decoration: none;
  }
  .lp-nav-btn:hover { background: #A8294A; transform: translateY(-1px); }

  /* ── Hero ── */
  .lp-hero {
    min-height: 100vh; display: flex; align-items: center;
    padding: 110px 2rem 80px; position: relative; overflow: hidden;
    background:
      radial-gradient(ellipse 55% 55% at 75% 15%, rgba(138,21,56,.11) 0%, transparent 65%),
      radial-gradient(ellipse 45% 40% at 15% 85%, rgba(201,147,58,.08) 0%, transparent 65%),
      #FDFBF7;
  }
  .lp-orb {
    position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none;
    animation: lpBob 9s ease-in-out infinite alternate;
  }
  .lp-orb-1 { width: 360px; height: 360px; background: rgba(138,21,56,.18); top: -80px; left: -80px; animation-delay: 0s; }
  .lp-orb-2 { width: 240px; height: 240px; background: rgba(201,147,58,.14); bottom: 60px; right: -60px; animation-delay: -4s; }
  @keyframes lpBob { from { transform: translate(0,0); } to { transform: translate(16px,-22px); } }

  .lp-hero-inner { position: relative; z-index: 2; text-align: center; max-width: 720px; margin: 0 auto; }
  .lp-pill {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .35rem 1rem; background: rgba(138,21,56,.07);
    border: 1px solid rgba(138,21,56,.16); border-radius: 999px;
    font-size: .78rem; font-weight: 600; color: #8A1538; margin-bottom: 1.8rem;
  }
  .lp-title {
    font-size: clamp(2.8rem, 8vw, 5.5rem); font-weight: 900;
    line-height: 1.06; color: #1A1A1A; margin-bottom: 1.2rem;
  }
  .lp-title .c-burg { color: #8A1538; }
  .lp-title .c-gold { color: #C9933A; }
  .lp-sub {
    font-size: clamp(.9rem, 2vw, 1.05rem); color: #6B6B6B;
    line-height: 1.75; margin: 0 auto 2.4rem; max-width: 460px;
  }
  .lp-cta-btn {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .9rem 2.4rem; background: #8A1538; color: #fff;
    font-family: 'Cairo', sans-serif; font-size: 1rem; font-weight: 700;
    border: none; border-radius: 13px; cursor: pointer;
    box-shadow: 0 6px 28px rgba(138,21,56,.28);
    transition: background .2s, transform .2s, box-shadow .2s;
    text-decoration: none;
  }
  .lp-cta-btn:hover { background: #A8294A; transform: translateY(-2px); box-shadow: 0 10px 36px rgba(138,21,56,.36); }

  .lp-stats {
    display: flex; justify-content: center; align-items: center;
    flex-wrap: wrap; gap: 1.5rem; margin-top: 3.8rem;
  }
  .lp-stat { text-align: center; min-width: 90px; }
  .lp-stat-n  { font-size: 2rem; font-weight: 900; color: #8A1538; line-height: 1; }
  .lp-stat-l  { font-size: .76rem; color: #6B6B6B; font-weight: 500; margin-top: .2rem; }
  .lp-sep     { width: 1px; height: 38px; background: #E8E2D8; }

  /* ── Sections ── */
  .lp-section { padding: 96px 0; }
  .lp-container { max-width: 1100px; margin: 0 auto; padding: 0 2rem; }
  .lp-eyebrow {
    display: flex; align-items: center; gap: .5rem;
    font-size: .75rem; font-weight: 700; color: #8A1538;
    letter-spacing: .07em; text-transform: uppercase; margin-bottom: .75rem;
  }
  .lp-eyebrow::before { content: ""; width: 22px; height: 2px; background: #C9933A; border-radius: 2px; }
  .lp-sec-title { font-size: clamp(1.6rem, 3.5vw, 2.3rem); font-weight: 900; color: #1A1A1A; line-height: 1.2; margin-bottom: .5rem; }
  .lp-sec-desc  { font-size: .95rem; color: #6B6B6B; line-height: 1.7; max-width: 440px; }

  /* Features */
  .lp-features { background: #fff; }
  .lp-feat-grid {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 1.25rem; margin-top: 3rem;
  }
  @media (max-width: 900px) { .lp-feat-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 540px) { .lp-feat-grid { grid-template-columns: 1fr; } }
  .lp-feat-card {
    background: #FDFBF7; border: 1px solid #E8E2D8; border-radius: 20px;
    padding: 1.8rem 1.5rem;
    transition: transform .25s, box-shadow .25s, border-color .25s;
  }
  .lp-feat-card:hover { transform: translateY(-5px); box-shadow: 0 14px 40px rgba(138,21,56,.09); border-color: rgba(138,21,56,.22); }
  .lp-feat-ico { width: 50px; height: 50px; background: rgba(138,21,56,.07); border-radius: 13px; display: grid; place-items: center; font-size: 1.45rem; margin-bottom: 1rem; }
  .lp-feat-card h3 { font-size: 1rem; font-weight: 800; margin-bottom: .35rem; }
  .lp-feat-card p  { font-size: .85rem; color: #6B6B6B; line-height: 1.6; }
  .lp-feat-tag { display: inline-block; margin-top: .85rem; padding: .22rem .7rem; background: rgba(138,21,56,.07); border-radius: 999px; font-size: .72rem; font-weight: 700; color: #8A1538; }

  /* How */
  .lp-how { background: #F4F1EC; }
  .lp-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; margin-top: 3rem; position: relative; }
  .lp-steps::before {
    content: ""; position: absolute; top: 35px;
    right: calc(50%/3 + 35px); left: calc(50%/3 + 35px);
    height: 2px;
    background: linear-gradient(to left, #8A1538, #C9933A, #8A1538);
    opacity: .25;
  }
  @media (max-width: 640px) { .lp-steps { grid-template-columns: 1fr; } .lp-steps::before { display: none; } }
  .lp-step { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 .5rem; }
  .lp-step-circle {
    width: 70px; height: 70px; border-radius: 50%; background: #fff;
    border: 2.5px solid #8A1538; display: grid; place-items: center;
    font-size: 1.5rem; font-weight: 900; color: #8A1538;
    margin-bottom: 1.2rem; position: relative; z-index: 1;
    box-shadow: 0 4px 18px rgba(138,21,56,.12);
  }
  .lp-step h3 { font-size: 1.05rem; font-weight: 800; margin-bottom: .4rem; }
  .lp-step p  { font-size: .86rem; color: #6B6B6B; line-height: 1.6; max-width: 200px; }

  /* Stats banner */
  .lp-banner { background: #8A1538; padding: 80px 0; }
  .lp-banner-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; text-align: center; }
  @media (max-width: 680px) { .lp-banner-grid { grid-template-columns: repeat(2,1fr); } }
  .lp-bstat { padding: 1.5rem .5rem; }
  .lp-bstat-n { font-size: clamp(2.2rem,5vw,3.2rem); font-weight: 900; color: #fff; line-height: 1; }
  .lp-bstat-n.gold { color: #E2AC52; }
  .lp-bstat-l { font-size: .85rem; color: rgba(255,255,255,.65); font-weight: 600; margin-top: .4rem; }
  .lp-bdiv { width: 1px; background: rgba(255,255,255,.12); }
  @media (max-width: 680px) { .lp-bdiv { display: none; } }

  /* CTA */
  .lp-cta { background: #fff; padding: 100px 0; }
  .lp-cta-card {
    max-width: 620px; margin: 0 auto; text-align: center;
    background: linear-gradient(135deg, rgba(138,21,56,.04), rgba(201,147,58,.04));
    border: 1px solid #E8E2D8; border-radius: 28px; padding: 4rem 3rem;
    position: relative; overflow: hidden;
  }
  .lp-cta-card::before {
    content: ""; position: absolute; inset: 0;
    background: radial-gradient(circle at 10% 20%, rgba(138,21,56,.06) 0%, transparent 55%),
                radial-gradient(circle at 90% 80%, rgba(201,147,58,.07) 0%, transparent 55%);
    pointer-events: none;
  }
  .lp-cta-card > * { position: relative; z-index: 1; }
  .lp-cta-emoji { font-size: 3rem; margin-bottom: 1rem; }
  .lp-cta-title { font-size: clamp(1.8rem,4vw,2.4rem); font-weight: 900; margin-bottom: .6rem; }
  .lp-cta-desc  { font-size: .95rem; color: #6B6B6B; line-height: 1.7; margin: 0 auto 2rem; max-width: 380px; }

  /* Footer */
  .lp-footer { background: #1A1A1A; color: rgba(255,255,255,.45); text-align: center; padding: 2.2rem 2rem; font-size: .82rem; line-height: 1.8; }
  .lp-footer strong { color: rgba(255,255,255,.8); }

  @media (max-width: 640px) {
    .lp-nav, .lp-hero { padding-left: 1rem; padding-right: 1rem; }
    .lp-container { padding: 0 1rem; }
    .lp-sep { display: none; }
    .lp-section { padding: 64px 0; }
    .lp-cta-card { padding: 2.5rem 1.5rem; }
  }
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const navRef = useRef(null);
  const countersAnimated = useRef(new Set());

  useEffect(() => {
    // Inject styles once
    if (!document.getElementById("lp-styles")) {
      const style = document.createElement("style");
      style.id = "lp-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }

    // Navbar scroll effect
    const onScroll = () => {
      if (navRef.current) navRef.current.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Counter animation
    const countUp = (el) => {
      const target = +el.dataset.target;
      const dur = 1500;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !countersAnimated.current.has(e.target)) {
          countersAnimated.current.add(e.target);
          countUp(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll("[data-target]").forEach((el) => cio.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      cio.disconnect();
    };
  }, []);

  const goLogin = () => navigate("/login");

  return (
    <div className="lp-root">
      {/* ── Navbar ── */}
      <nav className="lp-nav" ref={navRef}>
        <a href="#" className="lp-logo" onClick={(e) => e.preventDefault()}>
          <div className="lp-logo-badge">🏆</div>
          <div className="lp-logo-text">
            <strong>اللياقة البدنية</strong>
            <span>نظام تسجيل الطلاب</span>
          </div>
        </a>
        <button className="lp-nav-btn" onClick={goLogin}>تسجيل الدخول ←</button>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-orb lp-orb-1"></div>
        <div className="lp-orb lp-orb-2"></div>
        <div className="lp-hero-inner">
          <div className="lp-pill">🇶🇦 المنصة الوطنية لقياس اللياقة البدنية</div>
          <h1 className="lp-title">
            <span className="c-burg">قِس،</span> تتبّع،<br />
            <span className="c-gold">ارتقِ.</span>
          </h1>
          <p className="lp-sub">
            منصة قياس اللياقة البدنية للطلاب في المدارس القطرية —<br />
            أدوات دقيقة، تقارير فورية، نتائج حقيقية.
          </p>
          <button className="lp-cta-btn" onClick={goLogin}>ابدأ الآن ←</button>

          <div className="lp-stats">
            <div className="lp-stat"><div className="lp-stat-n" data-target="305">0</div><div className="lp-stat-l">مدرسة مسجّلة</div></div>
            <div className="lp-sep"></div>
            <div className="lp-stat"><div className="lp-stat-n" data-target="3">0</div><div className="lp-stat-l">طلاب مسجّلون</div></div>
            <div className="lp-sep"></div>
            <div className="lp-stat"><div className="lp-stat-n" data-target="5">0</div><div className="lp-stat-l">اختبارات معتمدة</div></div>
            <div className="lp-sep"></div>
            <div className="lp-stat"><div className="lp-stat-n" data-target="4">0</div><div className="lp-stat-l">قياسات لكل طالب</div></div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section lp-features">
        <div className="lp-container">
          <div className="lp-eyebrow">المميزات</div>
          <h2 className="lp-sec-title">لماذا اللياقة البدنية؟</h2>
          <p className="lp-sec-desc">منصة متكاملة تجمع سهولة الاستخدام مع دقة القياس لخدمة المدارس والطلاب.</p>
          <div className="lp-feat-grid">
            {[
              { ico: "🏫", title: "تغطية شاملة", desc: "305 مدرسة متصلة بالمنصة من مختلف مراحل التعليم في دولة قطر.", tag: "305 مدرسة" },
              { ico: "📊", title: "تقارير فورية", desc: "قياس الأداء البدني ومقارنة المدارس والطلاب في لحظة واحدة.", tag: "لحظي" },
              { ico: "🏆", title: "أفضل الطلاب", desc: "تصنيف وتكريم الطلاب المتميزين في اختبارات اللياقة البدنية.", tag: "تميّز" },
              { ico: "⚡", title: "سهولة الاستخدام", desc: "واجهة عربية سلسة وسريعة مصممة خصيصاً للمدارس والمدربين.", tag: "عربي 100%" },
            ].map((f) => (
              <div className="lp-feat-card" key={f.title}>
                <div className="lp-feat-ico">{f.ico}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className="lp-feat-tag">{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="lp-section lp-how">
        <div className="lp-container">
          <div className="lp-eyebrow">الآلية</div>
          <h2 className="lp-sec-title">كيف يعمل النظام؟</h2>
          <p className="lp-sec-desc">ثلاث خطوات بسيطة للبدء في قياس وتتبّع لياقة طلابك.</p>
          <div className="lp-steps">
            {[
              { n: "١", title: "سجّل مدرستك", desc: "أدخل بيانات المدرسة وأضف حسابات المدربين والمشرفين." },
              { n: "٢", title: "قِس اللياقة", desc: "أدخل نتائج الضغط والبطن والمرونة والتحمل لكل طالب." },
              { n: "٣", title: "تابع النتائج", desc: "راجع التقارير وقارن بين المدارس وكرّم المتميزين." },
            ].map((s) => (
              <div className="lp-step" key={s.n}>
                <div className="lp-step-circle">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section className="lp-banner">
        <div className="lp-container">
          <div className="lp-banner-grid">
            <div className="lp-bstat"><div className="lp-bstat-n gold" data-target="305">0</div><div className="lp-bstat-l">مدرسة مسجّلة</div></div>
            <div className="lp-bdiv"></div>
            <div className="lp-bstat"><div className="lp-bstat-n" data-target="5">0</div><div className="lp-bstat-l">اختبارات معتمدة</div></div>
            <div className="lp-bdiv"></div>
            <div className="lp-bstat"><div className="lp-bstat-n gold" data-target="4">0</div><div className="lp-bstat-l">قياسات لكل طالب</div></div>
            <div className="lp-bdiv"></div>
            <div className="lp-bstat"><div className="lp-bstat-n" data-target="3">0</div><div className="lp-bstat-l">طلاب مسجّلون</div></div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-card">
            <div className="lp-cta-emoji">🚀</div>
            <h2 className="lp-cta-title">مستعد للانضمام؟</h2>
            <p className="lp-cta-desc">سجّل الدخول الآن وابدأ في قياس وتتبّع لياقة طلابك بدقة واحترافية.</p>
            <button className="lp-cta-btn" onClick={goLogin}>تسجيل الدخول ←</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <strong>اللياقة البدنية</strong> — نظام تسجيل الطلاب الوطني<br />
        © 2025 وزارة التربية والتعليم — دولة قطر
      </footer>
    </div>
  );
}
