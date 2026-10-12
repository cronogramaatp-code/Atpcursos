export const premiumStyles = String.raw`
:root{--night:#0b1932;--navy:#112a50;--blue:#2765e8;--cyan:#15b8d4;--gold:#d5a851;--cloud:#f5f8fc;--paper:#fff;--ink:#182840;--muted:#61718a;--line:#e4eaf2;--green:#138c6e;--shadow:0 16px 48px rgba(16,42,81,.075);font:16px/1.55 "Inter","Segoe UI",system-ui,sans-serif;background:var(--cloud);color:var(--ink)}
*,*:before,*:after{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-width:320px;background:radial-gradient(circle at 90% 0%,#e6f3ff 0,transparent 37%),var(--cloud)}[hidden]{display:none!important}
a{color:var(--blue)}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--cyan);outline-offset:3px}
h1,h2,h3,h4{color:var(--night);letter-spacing:-.035em;line-height:1.15}h1{font-size:clamp(2.35rem,5vw,4.15rem);margin:.3em 0}h2{font-size:clamp(1.65rem,3vw,2.35rem);margin:.5em 0}h3{font-size:1.15rem;margin:.65em 0}p{line-height:1.65}
header{background:rgba(11,25,50,.97);color:#fff;border-bottom:1px solid #ffffff20;position:relative;z-index:9}
nav{width:min(1240px,100%);max-width:1240px;margin:auto;padding:14px 28px;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}
nav a{color:#ebf3ff;text-decoration:none;margin:0}nav a:hover{color:#fff}nav .nav-links{display:flex;align-items:center;gap:24px;flex-wrap:wrap;font-size:.91rem;font-weight:650}
nav .brand{display:inline-flex;gap:11px;align-items:center;text-decoration:none;font-size:1.18rem;font-weight:900;letter-spacing:-.03em}nav .brand img{width:47px;height:47px;object-fit:contain}nav .brand strong{color:white}nav .brand em{font-style:normal;color:var(--gold)}nav .nav-cta{background:#ffffff17;border:1px solid #ffffff35;border-radius:11px;padding:10px 15px}
main{max-width:1240px;width:100%;margin:0 auto;padding:36px 28px 70px;min-height:65vh}
footer{background:#0b1932;color:#a8bdd9;padding:34px 24px;text-align:center;border-top:3px solid #d5a85140}footer a{color:#dfeaff;text-decoration:none}
.eyebrow{display:inline-flex;gap:8px;align-items:center;text-transform:uppercase;font-size:.76rem;font-weight:900;letter-spacing:.13em;color:#3272e8}
.market-hero,.sales-hero{background:linear-gradient(119deg,#081a35 2%,#143d7b 70%,#17569b);position:relative;overflow:hidden;border-radius:28px;color:#fff;padding:clamp(32px,5vw,68px);display:grid;grid-template-columns:minmax(0,1.45fr) minmax(215px,1fr);gap:28px;min-height:440px;align-items:center;isolation:isolate;box-shadow:0 25px 60px #0b22473b}
.market-hero:before,.sales-hero:before{content:"";position:absolute;width:560px;height:560px;right:-150px;top:-220px;border:1px solid #ffffff30;border-radius:50%;box-shadow:0 0 0 90px #ffffff07,0 0 0 180px #ffffff04;z-index:-1}
.market-hero h1,.sales-hero h1{color:#fff;max-width:720px;font-weight:850;margin:18px 0;font-size:clamp(2.5rem,5.2vw,4.5rem)}
.market-hero p,.sales-hero p{color:#d8eaff;max-width:630px;font-size:1.06rem;line-height:1.75}
.market-hero .eyebrow,.sales-hero .eyebrow{color:#84e2f2}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;text-decoration:none;border:none;border-radius:12px;background:var(--blue);color:#fff;font:inherit;font-size:.95rem;font-weight:780;padding:13px 21px;transition:transform .17s ease,background .17s ease,box-shadow .17s ease;min-height:45px}
.btn:hover{transform:translateY(-2px);background:#164bc1;box-shadow:0 9px 24px #153e8528;color:white}
.btn.gold,.gold{background:var(--gold);color:#101f37}.btn.gold:hover{background:#edbd65;color:#101f37}
.btn.light{background:white;color:var(--navy)}.btn.light:hover{color:var(--navy);background:#e9f6ff}
.btn.ghost{background:transparent;color:white;border:1px solid #ffffff7c}.btn.ghost:hover{background:#ffffff18}
.hero-visual{display:grid;place-items:center;min-height:290px;position:relative}
.hero-orbit{width:min(100%,310px);aspect-ratio:1;display:grid;place-items:center;border:1px solid #ffffff42;border-radius:34px;background:linear-gradient(150deg,#ffffff20,#ffffff04);box-shadow:0 20px 65px #0003,0 0 0 14px #ffffff0a;transform:rotate(-5deg)}
.hero-orbit img{width:74%;height:74%;object-fit:contain;filter:drop-shadow(0 16px 12px #0004);transform:rotate(5deg)}
.hero-mini{position:absolute;right:2%;bottom:-10px;background:#f6fbff;color:var(--navy);border:1px solid #d4e1f6;padding:12px 16px;border-radius:13px;box-shadow:var(--shadow);font-size:.81rem;font-weight:850}
.trust-row{display:flex;gap:12px 26px;align-items:center;flex-wrap:wrap;margin:23px 0;color:#d4e6fc;font-size:.85rem;font-weight:650}
.trust-row span:before{content:"✓";display:inline-grid;place-items:center;margin-right:7px;width:21px;height:21px;border:1px solid #65d6df70;background:#4cc3de26;border-radius:50%;color:#a3eafa}
.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin:50px 0 22px}.section-heading p{margin:5px 0;color:var(--muted);max-width:570px}
.feature-grid,.step-grid,.category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin:24px 0}
.feature,.step,.category-tile{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:0 5px 22px #183d6510}
.feature .feature-icon,.step .step-number{display:grid;place-items:center;background:#eaf2ff;color:var(--blue);height:45px;width:45px;border-radius:12px;font-weight:850;font-size:1.16rem}
.feature h3,.step h3{margin:14px 0 4px}.feature p,.step p{color:var(--muted);font-size:.89rem;margin:0}
.category-tile{text-decoration:none;color:var(--ink);display:flex;align-items:center;justify-content:space-between;min-height:115px;transition:transform .2s,border-color .2s}.category-tile:hover{transform:translateY(-3px);border-color:#7cacef}.category-tile strong{font-size:1rem}.category-tile span{color:var(--blue);font-size:1.5rem}
.toolbar{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0}.toolbar input{flex:2;min-width:230px}.toolbar select{flex:1;min-width:190px}
input,textarea,select{font:inherit;color:var(--ink);padding:12px 14px;border-radius:11px;border:1px solid #cbd6e4;width:100%;background:white;min-height:45px}input:focus,textarea:focus,select:focus{border-color:var(--blue)}label{display:block;font-weight:680;margin:7px 0}label input,label select,label textarea{margin-top:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:19px}
.card{background:var(--paper);border:1px solid var(--line);border-radius:19px;padding:23px;box-shadow:var(--shadow);margin-bottom:16px}
#results>.card{margin:0;display:flex;flex-direction:column;min-height:340px;padding:16px;transition:transform .2s,box-shadow .2s;border:1px solid #e0e8f2}
#results>.card:hover{transform:translateY(-5px);box-shadow:0 18px 38px #0a29501b}
#results .thumb{height:150px;border-radius:12px;background:linear-gradient(145deg,#0b2349,#2872bc);display:grid;place-items:center;color:#edd18e;font-weight:900;letter-spacing:.2em;position:relative;overflow:hidden}
#results .thumb:after{content:"";position:absolute;right:-20px;top:-20px;width:110px;height:110px;border:1px solid #ffffff35;border-radius:50%}
#results .card h3{margin:15px 2px 2px}
#results .card>p{margin:6px 2px;color:#677891;font-size:.89rem}
#results .card .price{font-size:1.5rem;color:var(--night);font-weight:850;margin:auto 2px 16px}
#results .card .btn{align-self:stretch}
.thumb{background:linear-gradient(145deg,#0b2349,#2872bc);border-radius:12px;display:grid;place-items:center;color:#edd18e;min-height:135px;font-weight:850;letter-spacing:.15em}
.muted{color:var(--muted)}.price{font-size:1.5rem;font-weight:850;color:var(--night)}
.product-layout{display:grid;grid-template-columns:minmax(0,1.16fr) minmax(310px,.85fr);gap:22px;margin-top:22px}
.product-layout .thumb{min-height:270px;margin-bottom:18px;background:linear-gradient(145deg,#0c2143,#2164ab);font-size:2.4rem}
.product-layout .card h1{font-size:clamp(2rem,4vw,3rem)}
.formgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}
form{display:grid;gap:10px}#buy{margin-top:10px}#quote{border-radius:12px;background:#eaf4ff;padding:14px 18px}#msg:empty{display:none}
.product-layout .offers label{font-weight:450;display:flex;align-items:center;gap:9px}.offers input{width:auto}
.admin{display:grid;grid-template-columns:minmax(210px,245px) minmax(0,1fr);gap:25px;align-items:start}
.side{background:#0b1932;border:1px solid #ffffff21;border-radius:20px;padding:25px 18px;min-height:380px;position:sticky;top:22px;box-shadow:var(--shadow)}
.side-brand{display:flex;align-items:center;gap:10px;color:white;font-weight:850;line-height:1.3;margin-bottom:27px}.side-brand img{width:42px;height:42px;object-fit:contain}
.side a{display:block;padding:12px 15px;color:#dbeaff;text-decoration:none;border-radius:10px;margin:6px 0;font-size:.92rem;font-weight:650}
.side a:hover,.side a[aria-current="page"]{background:#ffffff18;color:white}
.admin>section{min-width:0}.admin .card{margin-top:16px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-top:20px}
.kpis .card{margin:0;background:white;min-height:105px;padding:19px}
.kpis strong{display:block;font-size:1.5rem;line-height:1.3;letter-spacing:-.035em;color:var(--night)}
.kpis span{display:block;font-size:.8rem;font-weight:650;color:var(--muted);margin-bottom:11px}
.table{border-collapse:collapse;width:100%;min-width:490px}.table th,.table td{padding:13px 10px;border-bottom:1px solid var(--line);text-align:left;font-size:.9rem}
.table th{font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.row{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid var(--line)}
.student-panel{max-width:860px;margin:28px auto}.student-panel .student-intro{background:linear-gradient(120deg,#0b1932,#1b559c);border-radius:18px;color:white;padding:28px;margin-bottom:20px}.student-panel .student-intro h1{color:white;margin:0 0 8px}.student-panel .student-intro p{color:#deedff;margin:0}
.student-panel>.card{padding:30px}.student-panel #account{padding:12px 0}.student-panel #files>.row{margin-top:12px}
.sales-hero.variant-02{background:linear-gradient(115deg,#0c273f,#116487)}.sales-hero.variant-03{background:linear-gradient(115deg,#111f41,#3a477d)}.sales-hero.variant-04{background:linear-gradient(115deg,#081f3d,#176a8d)}
.sales-caption{margin-top:12px;color:var(--muted);font-size:.85rem}.sale-points{display:grid;gap:12px;margin:20px 0}.sale-point{padding-left:23px;position:relative}.sale-point:before{content:"✓";position:absolute;left:0;color:#1cba9d;font-weight:900}
.faq details{margin:10px 0;background:#fff;padding:17px 19px;border-radius:12px;border:1px solid var(--line)}.faq summary{font-weight:800;cursor:pointer}.faq p{color:var(--muted);margin:9px 0 0}
.bottom-cta{margin-top:45px;padding:32px;border-radius:20px;background:#0c2854;color:white;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.bottom-cta h2{color:white;margin:0}.bottom-cta p{color:#d5e8fd;margin:4px 0 0}
.install-app{border:1px solid #c8a24d;background:transparent;color:#f1d48f;padding:8px 13px;border-radius:8px;font:inherit;font-weight:750;cursor:pointer}
@media(max-width:960px){.feature-grid,.step-grid{grid-template-columns:repeat(2,1fr)}.category-grid{grid-template-columns:repeat(2,1fr)}.market-hero,.sales-hero{grid-template-columns:1.3fr 1fr}.admin{grid-template-columns:190px minmax(0,1fr)}}
@media(max-width:740px){nav{padding:12px 17px}nav .nav-links{gap:12px;font-size:.82rem}nav .brand img{width:37px;height:37px}main{padding:20px 15px 48px}.market-hero,.sales-hero{grid-template-columns:1fr;padding:30px 22px;min-height:0;border-radius:18px}.market-hero h1,.sales-hero h1{font-size:clamp(2.2rem,9vw,3.2rem)}.hero-visual{min-height:180px}.hero-orbit{max-width:190px;border-radius:26px}.hero-mini{right:2%;bottom:0}.feature-grid,.step-grid,.category-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.feature,.step,.category-tile{padding:15px}.product-layout,.admin{grid-template-columns:1fr}.side{position:relative;top:auto;min-height:auto;display:flex;flex-wrap:wrap;gap:4px;padding:15px}.side-brand{width:100%;margin-bottom:4px}.side a{margin:0;padding:8px 12px}.card{padding:18px}.student-panel>.card{padding:19px}#results>.card{min-height:320px}.section-heading{margin-top:36px}}
@media(max-width:460px){.feature-grid,.step-grid,.category-grid{grid-template-columns:1fr}.market-hero h1,.sales-hero h1{font-size:2.25rem}.hero-actions .btn{width:100%}.bottom-cta .btn{width:100%}nav .nav-links{width:100%;justify-content:space-between}.toolbar input,.toolbar select{min-width:100%}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;