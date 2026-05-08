import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

/* ── Reset & Base ── */
.lp * { box-sizing: border-box; margin: 0; padding: 0; }
.lp {
  font-family: 'Cairo', sans-serif;
  background: #1E0D16;
  color: #fff;
  direction: rtl;
  overflow-x: hidden;
  min-height: 100vh;
  position: relative;
}

/* ── Animated background ── */
.lp-bg {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 70% 60% at 20% 10%, rgba(138,21,56,.45) 0%, transparent 60%),
    radial-gradient(ellipse 50% 50% at 80% 80%, rgba(138,21,56,.28) 0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(100,10,35,.45) 0%, transparent 70%),
    #1E0D16;
}
.lp-dots {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: radial-gradient(rgba(196,30,86,.18) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ── Navbar ── */
.lp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: 72px;
  display: flex; align-items: center;
  padding: 0 2.5rem;
  background: rgba(30,13,22,.65);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(196,30,86,.15);
  transition: background .3s;
}
.lp-nav.scrolled { background: rgba(30,13,22,.95); }

.lp-logo { display: flex; align-items: center; gap: .6rem; }
.lp-logo-icon {
  width: 42px; height: 42px;
  background: linear-gradient(135deg, #8A1538, #C41E56);
  border-radius: 12px;
  display: grid; place-items: center;
  font-size: 1.3rem;
  border: 1px solid rgba(196,30,86,.35);
}
.lp-logo-text strong { font-size: .95rem; font-weight: 800; color: #fff; display: block; line-height: 1.2; }
.lp-logo-text span   { font-size: .65rem; color: rgba(255,255,255,.45); font-weight: 500; }

.lp-nav-links {
  display: flex; align-items: center; gap: 2rem;
  position: absolute; left: 50%; transform: translateX(-50%);
  list-style: none;
}
.lp-nav-links a {
  font-size: .85rem; font-weight: 600; color: rgba(255,255,255,.7);
  text-decoration: none; transition: color .2s;
  white-space: nowrap;
}
.lp-nav-links a:hover { color: #C41E56; }

.lp-nav-cta {
  margin-right: auto;
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .55rem 1.4rem;
  background: linear-gradient(135deg, #8A1538, #C41E56);
  color: #fff;
  font-family: 'Cairo', sans-serif; font-size: .88rem; font-weight: 800;
  border: none; border-radius: 10px; cursor: pointer;
  box-shadow: 0 4px 18px rgba(138,21,56,.45);
  transition: transform .2s, box-shadow .2s;
}
.lp-nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(196,30,86,.6); }

@media (max-width: 900px) { .lp-nav-links { display: none; } }

/* ── Hero ── */
.lp-hero {
  min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 120px 2rem 60px;
  position: relative; z-index: 1;
  text-align: center;
}

.lp-badge {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .4rem 1.1rem;
  background: rgba(196,30,86,.1);
  border: 1px solid rgba(196,30,86,.35);
  border-radius: 999px;
  font-size: .78rem; font-weight: 700;
  color: #E05080;
  margin-bottom: 2rem;
  backdrop-filter: blur(8px);
}

.lp-headline {
  font-size: clamp(2.8rem, 8vw, 6.5rem);
  font-weight: 900;
  line-height: 1.0;
  letter-spacing: -.02em;
  margin-bottom: 1.4rem;
  max-width: 900px;
}
.lp-headline .w { color: #fff; }
.lp-headline .g { color: #E0506E; }
.lp-headline .r { color: #E05070; }

.lp-sub {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 700;
  color: rgba(255,255,255,.75);
  margin-bottom: 1rem;
}
.lp-desc {
  font-size: clamp(.85rem, 1.5vw, .95rem);
  color: rgba(255,255,255,.5);
  line-height: 1.8;
  max-width: 520px;
  margin: 0 auto 2.8rem;
}

/* ── Buttons ── */
.lp-btns { display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 3rem; }

.lp-btn-primary {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .9rem 2.2rem;
  background: linear-gradient(135deg, #8A1538, #C41E56);
  color: #fff;
  font-family: 'Cairo', sans-serif; font-size: 1rem; font-weight: 800;
  border: none; border-radius: 13px; cursor: pointer;
  box-shadow: 0 6px 28px rgba(138,21,56,.5);
  transition: transform .2s, box-shadow .2s;
}
.lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(196,30,86,.65); }

.lp-btn-ghost {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .9rem 2.2rem;
  background: transparent;
  color: rgba(255,255,255,.85);
  font-family: 'Cairo', sans-serif; font-size: 1rem; font-weight: 700;
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 13px; cursor: pointer;
  transition: border-color .2s, color .2s, background .2s;
}
.lp-btn-ghost:hover { border-color: rgba(196,30,86,.6); color: #E05080; background: rgba(196,30,86,.08); }

/* ── Pills ── */
.lp-pills {
  display: flex; align-items: center; justify-content: center;
  gap: .75rem; flex-wrap: wrap;
  margin-bottom: 4rem;
}
.lp-pill {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .45rem 1rem;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 999px;
  font-size: .82rem; font-weight: 600;
  color: rgba(255,255,255,.7);
  backdrop-filter: blur(8px);
  transition: border-color .2s, color .2s, background .2s;
  cursor: default;
}
.lp-pill:hover { border-color: rgba(196,30,86,.4); color: #E05080; background: rgba(196,30,86,.08); }
.lp-pill-icon { font-size: 1rem; }

/* ── Stats row ── */
.lp-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: rgba(196,30,86,.15);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(196,30,86,.2);
  backdrop-filter: blur(12px);
}
@media (max-width: 640px) { .lp-stats-row { grid-template-columns: repeat(2,1fr); } }

.lp-stat {
  background: rgba(30,10,18,.55);
  padding: 1.6rem 1rem;
  display: flex; align-items: center; gap: 1rem;
  justify-content: center;
  transition: background .2s;
}
.lp-stat:hover { background: rgba(138,21,56,.35); }
.lp-stat-icon {
  width: 44px; height: 44px;
  background: rgba(196,30,86,.12);
  border: 1px solid rgba(196,30,86,.25);
  border-radius: 12px;
  display: grid; place-items: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}
.lp-stat-n { font-size: 1.6rem; font-weight: 900; color: #E05080; line-height: 1; }
.lp-stat-l { font-size: .72rem; color: rgba(255,255,255,.5); font-weight: 600; margin-top: .15rem; }

/* ── Sections ── */
.lp-section { padding: 100px 0; position: relative; z-index: 1; }
.lp-container { max-width: 1100px; margin: 0 auto; padding: 0 2rem; }

.lp-eyebrow {
  display: inline-flex; align-items: center; gap: .5rem;
  font-size: .72rem; font-weight: 700; color: #E05080;
  letter-spacing: .1em; text-transform: uppercase; margin-bottom: .8rem;
}
.lp-eyebrow::before { content: ""; width: 18px; height: 2px; background: #C41E56; border-radius: 2px; }
.lp-sec-title { font-size: clamp(1.7rem, 4vw, 2.5rem); font-weight: 900; line-height: 1.2; margin-bottom: .6rem; }
.lp-sec-desc { font-size: .95rem; color: rgba(255,255,255,.5); line-height: 1.75; max-width: 460px; }

/* Divider */
.lp-divider { height: 1px; background: linear-gradient(to left, transparent, rgba(196,30,86,.25), transparent); margin: 0; }

/* ── Features ── */
.lp-feat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.2rem; margin-top: 3rem; }
@media (max-width: 900px) { .lp-feat-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 540px) { .lp-feat-grid { grid-template-columns: 1fr; } }

.lp-feat-card {
  background: rgba(30,10,18,.65);
  border: 1px solid rgba(196,30,86,.15);
  border-radius: 20px; padding: 2rem 1.5rem;
  backdrop-filter: blur(12px);
  transition: transform .25s, border-color .25s, box-shadow .25s;
}
.lp-feat-card:hover {
  transform: translateY(-6px);
  border-color: rgba(196,30,86,.45);
  box-shadow: 0 16px 48px rgba(138,21,56,.4);
}
.lp-feat-ico {
  width: 52px; height: 52px;
  background: rgba(196,30,86,.12); border: 1px solid rgba(196,30,86,.25);
  border-radius: 14px; display: grid; place-items: center;
  font-size: 1.5rem; margin-bottom: 1.1rem;
}
.lp-feat-card h3 { font-size: 1rem; font-weight: 800; margin-bottom: .4rem; color: #fff; }
.lp-feat-card p  { font-size: .84rem; color: rgba(255,255,255,.55); line-height: 1.65; }
.lp-feat-tag {
  display: inline-block; margin-top: .9rem;
  padding: .22rem .75rem;
  background: rgba(196,30,86,.12); border: 1px solid rgba(196,30,86,.25);
  border-radius: 999px; font-size: .72rem; font-weight: 700; color: #E05080;
}

/* ── Steps ── */
.lp-steps-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; margin-top: 3rem; position: relative; }
.lp-steps-row::before {
  content: ""; position: absolute; top: 36px;
  right: calc(50%/3 + 36px); left: calc(50%/3 + 36px);
  height: 1px; background: linear-gradient(to left, #8A1538, #C41E56, #8A1538);
  opacity: .6;
}
@media (max-width: 640px) { .lp-steps-row { grid-template-columns: 1fr; } .lp-steps-row::before { display: none; } }

.lp-step { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 1rem; }
.lp-step-n {
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(30,10,18,.85);
  border: 2px solid #C41E56;
  display: grid; place-items: center;
  font-size: 1.5rem; font-weight: 900; color: #E05080;
  margin-bottom: 1.3rem; position: relative; z-index: 1;
  box-shadow: 0 0 24px rgba(196,30,86,.4);
}
.lp-step h3 { font-size: 1.05rem; font-weight: 800; color: #fff; margin-bottom: .4rem; }
.lp-step p  { font-size: .85rem; color: rgba(255,255,255,.5); line-height: 1.65; max-width: 200px; }

/* ── Stats banner ── */
.lp-banner {
  position: relative; z-index: 1;
  background: linear-gradient(135deg, rgba(138,21,56,.55), rgba(100,10,35,.65));
  border-top: 1px solid rgba(196,30,86,.2);
  border-bottom: 1px solid rgba(196,30,86,.2);
  padding: 80px 0;
}
.lp-banner-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; text-align: center; }
@media (max-width: 680px) { .lp-banner-grid { grid-template-columns: repeat(2,1fr); } }
.lp-bstat { padding: 1.5rem 1rem; }
.lp-bstat-n { font-size: clamp(2.2rem,5vw,3.2rem); font-weight: 900; color: #E05080; line-height: 1; }
.lp-bstat-n.w { color: #fff; }
.lp-bstat-l { font-size: .85rem; color: rgba(255,255,255,.6); font-weight: 600; margin-top: .4rem; }
.lp-bdiv { width: 1px; background: rgba(196,30,86,.2); }
@media (max-width: 680px) { .lp-bdiv { display: none; } }

/* ── CTA ── */
.lp-cta-sec { position: relative; z-index: 1; padding: 100px 0; }
.lp-cta-card {
  max-width: 680px; margin: 0 auto; text-align: center;
  background: rgba(30,10,18,.75);
  border: 1px solid rgba(196,30,86,.25);
  border-radius: 28px; padding: 4rem 3rem;
  backdrop-filter: blur(16px);
  position: relative; overflow: hidden;
}
.lp-cta-card::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(138,21,56,.5) 0%, transparent 70%);
}
.lp-cta-card > * { position: relative; z-index: 1; }
.lp-cta-emoji { font-size: 3rem; margin-bottom: 1rem; }
.lp-cta-title { font-size: clamp(1.9rem,4vw,2.6rem); font-weight: 900; margin-bottom: .6rem; }
.lp-cta-desc  { font-size: .95rem; color: rgba(255,255,255,.55); line-height: 1.75; margin: 0 auto 2.2rem; max-width: 420px; }

/* ── Footer ── */
.lp-footer {
  position: relative; z-index: 1;
  background: rgba(15,5,10,.6);
  border-top: 1px solid rgba(196,30,86,.12);
  text-align: center; padding: 2rem;
  font-size: .82rem; color: rgba(255,255,255,.35); line-height: 1.8;
}
.lp-footer strong { color: rgba(255,255,255,.6); }

@media (max-width: 640px) {
  .lp-nav { padding: 0 1rem; }
  .lp-container { padding: 0 1rem; }
  .lp-cta-card { padding: 2.5rem 1.5rem; }
  .lp-section { padding: 64px 0; }
  .lp-hero { padding: 100px 1rem 50px; }
}
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const navRef = useRef(null);
  const animatedCounters = useRef(new Set());

  useEffect(() => {
    let s = document.getElementById("lp-styles");
    if (!s) {
      s = document.createElement("style");
      s.id = "lp-styles";
      document.head.appendChild(s);
    }
    s.textContent = STYLES;

    const onScroll = () => {
      navRef.current?.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const countUp = (el) => {
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || "";
      const dur = 1600;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !animatedCounters.current.has(e.target)) {
          animatedCounters.current.add(e.target);
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

  const navLinks = [
    { label: "الاختبارات", href: "#features" },
    { label: "كيف يعمل", href: "#how" },
    { label: "المدارس", href: "#stats" },
    { label: "تواصل معنا", href: "#cta" },
  ];

  const features = [
    { ico: "🏫", title: "تغطية شاملة", desc: "305 مدرسة متصلة بالمنصة من مختلف مراحل التعليم في قطر.", tag: "305 مدرسة" },
    { ico: "📊", title: "تقارير فورية", desc: "قياس الأداء البدني ومقارنة المدارس والطلاب في لحظة واحدة.", tag: "لحظي" },
    { ico: "🏆", title: "أفضل الطلاب", desc: "تصنيف وتكريم الطلاب المتميزين في اختبارات اللياقة البدنية.", tag: "تميّز" },
    { ico: "⚡", title: "سهولة الاستخدام", desc: "واجهة عربية سلسة مصممة خصيصاً للمدارس والمدربين.", tag: "عربي 100%" },
  ];

  const steps = [
    { n: "١", title: "سجّل مدرستك", desc: "أدخل بيانات المدرسة وأضف حسابات المدربين والمشرفين." },
    { n: "٢", title: "قِس اللياقة", desc: "أدخل نتائج الضغط والبطن والمرونة والتحمل لكل طالب." },
    { n: "٣", title: "تابع النتائج", desc: "راجع التقارير وقارن بين المدارس وكرّم المتميزين." },
  ];

  const pills = [
    { ico: "💪", label: "انبطاح مائل" },
    { ico: "🔄", label: "رقود قرفصاء" },
    { ico: "📏", label: "جلوس طويل" },
    { ico: "⚡", label: "الجري الارتدادي" },
    { ico: "🏃", label: "جري مسافات" },
  ];

  return (
    <div className="lp">
      <div className="lp-bg" />
      <div className="lp-dots" />

      {/* ── Navbar ── */}
      <nav className="lp-nav" ref={navRef}>
        <div className="lp-logo">
          <div className="lp-logo-icon">🏆</div>
          <div className="lp-logo-text">
            <strong>اللياقة البدنية</strong>
            <span>نظام تسجيل الطلاب</span>
          </div>
        </div>
        <ul className="lp-nav-links">
          {navLinks.map((l) => (
            <li key={l.label}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>
        <button className="lp-nav-cta" onClick={goLogin}>
          تسجيل الدخول ←
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-badge">🇶🇦 المنصة الوطنية لقياس اللياقة البدنية</div>

        <h1 className="lp-headline">
          <span className="w">قِس، تتبّع،</span><br />
          <span className="g">ارتقِ</span><span className="w"> بلا حدود.</span>
        </h1>

        <p className="lp-sub">نحوّل بيانات اللياقة إلى نتائج حقيقية</p>
        <p className="lp-desc">
          منصة قياس اللياقة البدنية للطلاب في المدارس القطرية —
          نجمع بين الدقة العلمية وسهولة الاستخدام لتحقيق أهدافك في تطوير الجيل.
        </p>

        <div className="lp-btns">
          <button className="lp-btn-primary" onClick={goLogin}>
            ← ابدأ الآن
          </button>
          <button className="lp-btn-ghost" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
            استكشف الاختبارات
          </button>
        </div>

        <div className="lp-pills">
          {pills.map((p) => (
            <span className="lp-pill" key={p.label}>
              <span className="lp-pill-icon">{p.ico}</span>
              {p.label}
            </span>
          ))}
        </div>

        <div className="lp-stats-row">
          {[
            { ico: "🏫", n: "305", s: "+", label: "مدرسة مسجّلة" },
            { ico: "✅", n: "98",  s: "%", label: "دقة القياس" },
            { ico: "🏅", n: "5",   s: "",  label: "اختبارات معتمدة" },
            { ico: "📅", n: "4",   s: "+", label: "سنوات خبرة" },
          ].map((st) => (
            <div className="lp-stat" key={st.label}>
              <div className="lp-stat-icon">{st.ico}</div>
              <div>
                <div className="lp-stat-n" data-target={st.n} data-suffix={st.s}>0</div>
                <div className="lp-stat-l">{st.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-divider" />

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <div className="lp-eyebrow">المميزات</div>
          <h2 className="lp-sec-title">لماذا اللياقة البدنية؟</h2>
          <p className="lp-sec-desc">منصة متكاملة تجمع دقة القياس مع سهولة الاستخدام لخدمة المدارس والطلاب.</p>
          <div className="lp-feat-grid">
            {features.map((f) => (
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

      <div className="lp-divider" />

      {/* ── How It Works ── */}
      <section className="lp-section" id="how">
        <div className="lp-container">
          <div className="lp-eyebrow">الآلية</div>
          <h2 className="lp-sec-title">كيف يعمل النظام؟</h2>
          <p className="lp-sec-desc">ثلاث خطوات بسيطة للبدء في قياس وتتبّع لياقة طلابك.</p>
          <div className="lp-steps-row">
            {steps.map((s) => (
              <div className="lp-step" key={s.n}>
                <div className="lp-step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-divider" />

      {/* ── Stats Banner ── */}
      <section className="lp-banner" id="stats">
        <div className="lp-container">
          <div className="lp-banner-grid">
            <div className="lp-bstat"><div className="lp-bstat-n" data-target="305" data-suffix="+">0</div><div className="lp-bstat-l">مدرسة مسجّلة</div></div>
            <div className="lp-bdiv" />
            <div className="lp-bstat"><div className="lp-bstat-n w" data-target="5">0</div><div className="lp-bstat-l">اختبارات معتمدة</div></div>
            <div className="lp-bdiv" />
            <div className="lp-bstat"><div className="lp-bstat-n" data-target="4">0</div><div className="lp-bstat-l">قياسات لكل طالب</div></div>
            <div className="lp-bdiv" />
            <div className="lp-bstat"><div className="lp-bstat-n w" data-target="98" data-suffix="%">0</div><div className="lp-bstat-l">دقة القياس</div></div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-sec" id="cta">
        <div className="lp-container">
          <div className="lp-cta-card">
            <div className="lp-cta-emoji">🚀</div>
            <h2 className="lp-cta-title">مستعد للانضمام؟</h2>
            <p className="lp-cta-desc">سجّل الدخول الآن وابدأ في قياس وتتبّع لياقة طلابك بدقة واحترافية.</p>
            <div className="lp-btns">
              <button className="lp-btn-primary" onClick={goLogin}>← تسجيل الدخول</button>
              <button className="lp-btn-ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>العودة للأعلى</button>
            </div>
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
