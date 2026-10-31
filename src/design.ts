export const premiumStyles = String.raw`
:root{--night:#171512;--navy:#29221b;--blue:#ee701e;--cyan:#b97537;--gold:#f2c98d;--cloud:#f8f3ea;--paper:#fff;--ink:#28221c;--muted:#706659;--line:#e4d8c7;--green:#258566;--shadow:0 16px 48px rgba(16,42,81,.075);font:16px/1.58 "Aptos","Segoe UI",system-ui,sans-serif;background:var(--cloud);color:var(--ink)}
*,*:before,*:after{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-width:320px;background:radial-gradient(circle at 90% 0%,#f4e5ce 0,transparent 37%),var(--cloud)}[hidden]{display:none!important}
a{color:var(--blue)}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--cyan);outline-offset:3px}
h1,h2,h3,h4{color:var(--night);letter-spacing:-.04em;line-height:1.13}h1{font-size:clamp(2.35rem,5vw,4.15rem);margin:.3em 0}h2{font-size:clamp(1.65rem,3vw,2.35rem);margin:.5em 0}h3{font-size:1.15rem;margin:.65em 0}p{line-height:1.65}
header{background:rgba(22,19,15,.98);color:#fff;border-bottom:1px solid #ffffff20;position:relative;z-index:9}
nav{width:min(1240px,100%);max-width:1240px;margin:auto;padding:14px 28px;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}
nav a{color:#f3e6d1;text-decoration:none;margin:0}nav a:hover{color:#fff}nav .nav-links{display:flex;align-items:center;gap:24px;flex-wrap:wrap;font-size:.91rem;font-weight:650}
nav .brand{display:inline-flex;gap:11px;align-items:center;text-decoration:none;font-size:1.18rem;font-weight:900;letter-spacing:-.03em}nav .brand img{width:47px;height:47px;object-fit:contain}nav .brand strong{color:white}nav .brand em{font-style:normal;color:var(--gold)}nav .nav-cta{background:#ffffff13;border:1px solid #f4d19a35;border-radius:11px;padding:10px 15px}
main{max-width:1240px;width:100%;margin:0 auto;padding:36px 28px 70px;min-height:65vh}
footer{background:#171512;color:#d0b99a;padding:34px 24px;text-align:center;border-top:3px solid #f2c98d40}footer a{color:#dfeaff;text-decoration:none}
.eyebrow{display:inline-flex;gap:8px;align-items:center;text-transform:none;font-size:.85rem;font-weight:800;letter-spacing:.025em;color:#a94f1a}
.market-hero,.sales-hero{background:linear-gradient(118deg,#171512 0%,#221b16 62%,#70391f 100%);position:relative;overflow:hidden;border-radius:28px;color:#fff;padding:clamp(32px,5vw,68px);display:grid;grid-template-columns:minmax(0,1.45fr) minmax(215px,1fr);gap:28px;min-height:440px;align-items:center;isolation:isolate;box-shadow:0 25px 60px #2114103b}
.market-hero:before,.sales-hero:before{content:"";position:absolute;width:560px;height:560px;right:-150px;top:-220px;border:1px solid #ffffff30;border-radius:50%;box-shadow:0 0 0 90px #ffffff07,0 0 0 180px #ffffff04;z-index:-1}
.market-hero h1,.sales-hero h1{color:#fff;max-width:720px;font-weight:850;margin:18px 0;font-size:clamp(2.5rem,5.2vw,4.5rem)}
.market-hero p,.sales-hero p{color:#ecdfcb;max-width:630px;font-size:1.06rem;line-height:1.75}
.market-hero .eyebrow,.sales-hero .eyebrow{color:#f4d5a7}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;text-decoration:none;border:none;border-radius:12px;background:var(--blue);color:#fff;font:inherit;font-size:.95rem;font-weight:780;padding:13px 21px;transition:background .17s ease,box-shadow .17s ease;min-height:45px}
.btn:hover{background:#c9550d;box-shadow:0 9px 24px #5c2b1528;color:white}
.btn.gold,.gold{background:var(--gold);color:#20160f}.btn.gold:hover{background:#f8a65f;color:#20160f}
.btn.light{background:white;color:var(--navy)}.btn.light:hover{color:var(--navy);background:#fdf2e3}
.btn.ghost{background:transparent;color:white;border:1px solid #ffffff7c}.btn.ghost:hover{background:#ffffff18}
.hero-visual{display:grid;place-items:center;min-height:290px;position:relative}
.hero-orbit{width:min(100%,310px);aspect-ratio:1;display:grid;place-items:center;border:1px solid #ffffff42;border-radius:34px;background:linear-gradient(147deg,#f3d5ab24,#ffffff03);box-shadow:0 20px 65px #0003,0 0 0 14px #ffffff0a;transform:rotate(-5deg)}
.hero-orbit img{width:74%;height:74%;object-fit:contain;filter:drop-shadow(0 16px 12px #0004);transform:rotate(5deg)}
.hero-mini{position:absolute;right:2%;bottom:-10px;background:#f9f0df;color:var(--navy);border:1px solid #e6cda8;padding:12px 16px;border-radius:13px;box-shadow:var(--shadow);font-size:.81rem;font-weight:850}
.trust-row{display:flex;gap:12px 26px;align-items:center;flex-wrap:wrap;margin:23px 0;color:#e6d3b5;font-size:.85rem;font-weight:650}
.trust-row span:before{content:"✓";display:inline-grid;place-items:center;margin-right:7px;width:21px;height:21px;border:1px solid #e4b87970;background:#ee8a3826;border-radius:50%;color:#f9c279}
.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin:50px 0 22px}.section-heading p{margin:5px 0;color:var(--muted);max-width:570px}
.feature-grid,.step-grid,.category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin:24px 0}
.feature,.step,.category-tile{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:0 5px 22px #3b230f0d}
.feature .feature-icon,.step .step-number{display:grid;place-items:center;background:#f3e4cf;color:var(--blue);height:45px;width:45px;border-radius:12px;font-weight:850;font-size:1.16rem}
.feature h3,.step h3{margin:14px 0 4px}.feature p,.step p{color:var(--muted);font-size:.89rem;margin:0}
.category-tile{text-decoration:none;color:var(--ink);display:flex;align-items:center;justify-content:space-between;min-height:115px;transition:transform .2s,border-color .2s}.category-tile:hover{border-color:#df934e}.category-tile strong{font-size:1rem}.category-tile span{color:var(--blue);font-size:1.5rem}
.toolbar{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0}.toolbar input{flex:2;min-width:230px}.toolbar select{flex:1;min-width:190px}
input,textarea,select{font:inherit;color:var(--ink);padding:12px 14px;border-radius:11px;border:1px solid #cebea8;width:100%;background:white;min-height:45px}input:focus,textarea:focus,select:focus{border-color:var(--blue)}label{display:block;font-weight:680;margin:7px 0}label input,label select,label textarea{margin-top:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:19px}
.card{background:var(--paper);border:1px solid var(--line);border-radius:19px;padding:23px;box-shadow:var(--shadow);margin-bottom:16px}
#results>.card{margin:0;display:flex;flex-direction:column;min-height:340px;padding:16px;transition:transform .2s,box-shadow .2s;border:1px solid #e8dac7}
#results>.card:hover{box-shadow:0 18px 38px #3b220f1b}
#results .thumb{height:150px;border-radius:12px;background:linear-gradient(145deg,#201914,#774223);display:grid;place-items:center;color:#f2c98d;font-weight:900;letter-spacing:.2em;position:relative;overflow:hidden}
#results .thumb:after{content:"";position:absolute;right:-20px;top:-20px;width:110px;height:110px;border:1px solid #f4d19a35;border-radius:50%}
#results .card h3{margin:15px 2px 2px}
#results .card>p{margin:6px 2px;color:#786b5a;font-size:.89rem}
#results .card .price{font-size:1.5rem;color:var(--night);font-weight:850;margin:auto 2px 16px}
#results .card .btn{align-self:stretch}
.thumb{background:linear-gradient(145deg,#201914,#774223);border-radius:12px;display:grid;place-items:center;color:#f2c98d;min-height:135px;font-weight:850;letter-spacing:.15em}
.muted{color:var(--muted)}.price{font-size:1.5rem;font-weight:850;color:var(--night)}
.product-layout{display:grid;grid-template-columns:minmax(0,1.16fr) minmax(310px,.85fr);gap:22px;margin-top:22px}
.product-layout .thumb{min-height:270px;margin-bottom:18px;background:linear-gradient(145deg,#201915,#8f4a22);font-size:2.4rem}
.product-layout .card h1{font-size:clamp(2rem,4vw,3rem)}
.formgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}
form{display:grid;gap:10px}#buy{margin-top:10px}#quote{border-radius:12px;background:#f6e8d0;padding:14px 18px}#msg:empty{display:none}
.product-layout .offers label{font-weight:450;display:flex;align-items:center;gap:9px}.offers input{width:auto}
.admin{display:grid;grid-template-columns:minmax(210px,245px) minmax(0,1fr);gap:25px;align-items:start}
.side{background:#171512;border:1px solid #f7dbb21c;border-radius:20px;padding:25px 18px;min-height:380px;position:sticky;top:22px;box-shadow:var(--shadow)}
.side-brand{display:flex;align-items:center;gap:10px;color:white;font-weight:850;line-height:1.3;margin-bottom:27px}.side-brand img{width:42px;height:42px;object-fit:contain}
.side a{display:block;padding:12px 15px;color:#f4e6d3;text-decoration:none;border-radius:10px;margin:6px 0;font-size:.92rem;font-weight:650}
.side a:hover,.side a[aria-current="page"]{background:#ffffff18;color:white}
.admin>section{min-width:0}.admin .card{margin-top:16px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-top:20px}
.kpis .card{margin:0;background:white;min-height:105px;padding:19px}
.kpis strong{display:block;font-size:1.5rem;line-height:1.3;letter-spacing:-.035em;color:var(--night)}
.kpis span{display:block;font-size:.8rem;font-weight:650;color:var(--muted);margin-bottom:11px}
.table{border-collapse:collapse;width:100%;min-width:490px}.table th,.table td{padding:13px 10px;border-bottom:1px solid var(--line);text-align:left;font-size:.9rem}
.table th{font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.row{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid var(--line)}
.student-panel{max-width:860px;margin:28px auto}.student-panel .student-intro{background:linear-gradient(120deg,#171512,#7c3b1c);border-radius:18px;color:white;padding:28px;margin-bottom:20px}.student-panel .student-intro h1{color:white;margin:0 0 8px}.student-panel .student-intro p{color:#f9e9d2;margin:0}
.student-panel>.card{padding:30px}.student-panel #account{padding:12px 0}.student-panel #files>.row{margin-top:12px}
.sales-hero.variant-02{background:linear-gradient(115deg,#211914,#7e492b)}.sales-hero.variant-03{background:linear-gradient(115deg,#1f1a17,#62503a)}.sales-hero.variant-04{background:linear-gradient(115deg,#191512,#9b501e)}
.sales-caption{margin-top:12px;color:var(--muted);font-size:.85rem}.sale-points{display:grid;gap:12px;margin:20px 0}.sale-point{padding-left:23px;position:relative}.sale-point:before{content:"✓";position:absolute;left:0;color:#c97437;font-weight:900}
.faq details{margin:10px 0;background:#fff;padding:17px 19px;border-radius:12px;border:1px solid var(--line)}.faq summary{font-weight:800;cursor:pointer}.faq p{color:var(--muted);margin:9px 0 0}
.bottom-cta{margin-top:45px;padding:32px;border-radius:20px;background:#251b15;color:white;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.bottom-cta h2{color:white;margin:0}.bottom-cta p{color:#ecd8b9;margin:4px 0 0}
.install-app{border:1px solid #f2c98d;background:transparent;color:#f5d4a1;padding:8px 13px;border-radius:8px;font:inherit;font-weight:750;cursor:pointer}
@media(max-width:960px){.feature-grid,.step-grid{grid-template-columns:repeat(2,1fr)}.category-grid{grid-template-columns:repeat(2,1fr)}.market-hero,.sales-hero{grid-template-columns:1.3fr 1fr}.admin{grid-template-columns:190px minmax(0,1fr)}}
@media(max-width:740px){nav{padding:12px 17px}nav .nav-links{gap:12px;font-size:.82rem}nav .brand img{width:37px;height:37px}main{padding:20px 15px 48px}.market-hero,.sales-hero{grid-template-columns:1fr;padding:30px 22px;min-height:0;border-radius:18px}.market-hero h1,.sales-hero h1{font-size:clamp(2.2rem,9vw,3.2rem)}.hero-visual{min-height:180px}.hero-orbit{max-width:190px;border-radius:26px}.hero-mini{right:2%;bottom:0}.feature-grid,.step-grid,.category-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.feature,.step,.category-tile{padding:15px}.product-layout,.admin{grid-template-columns:1fr}.side{position:relative;top:auto;min-height:auto;display:flex;flex-wrap:wrap;gap:4px;padding:15px}.side-brand{width:100%;margin-bottom:4px}.side a{margin:0;padding:8px 12px}.card{padding:18px}.student-panel>.card{padding:19px}#results>.card{min-height:320px}.section-heading{margin-top:36px}}
@media(max-width:460px){.feature-grid,.step-grid,.category-grid{grid-template-columns:1fr}.market-hero h1,.sales-hero h1{font-size:2.25rem}.hero-actions .btn{width:100%}.bottom-cta .btn{width:100%}nav .nav-links{width:100%;justify-content:space-between}.toolbar input,.toolbar select{min-width:100%}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}

/* ATP Âmbar & Areia — sistema visual institucional e comercial */
:root{--coal:#171512;--coal-soft:#2b2520;--tangerine:#ee701e;--sand:#f2c98d;--oat:#f8f3ea;--charcoal:#28221c;--focus:#a94f1a}
body{background:radial-gradient(circle at 91% 1%,#ecd9b8 0,transparent 29%),var(--oat)}
h1,h2,h3{font-family:"Bahnschrift","Aptos Display","Segoe UI",sans-serif}
header{border-bottom:1px solid #4a3828}nav .brand em{color:var(--sand)}
.market-hero,.sales-hero{border:1px solid #59351d;box-shadow:0 28px 65px #39200b30}
.market-hero:before,.sales-hero:before{opacity:.23;box-shadow:0 0 0 70px #d28a3820,0 0 0 145px #d28a3812}
.market-hero .eyebrow,.sales-hero .eyebrow{color:var(--sand)}
.hero-orbit{border-color:#f2c98d60;box-shadow:0 20px 65px #0005,0 0 0 12px #f2c98d12}
.hero-mini{background:#f7e6c8;color:#292018;border-color:#edca91}
.btn{background:var(--tangerine);color:#171512}
.btn:hover{background:#c9550d;color:white}
.btn.gold,.gold{background:var(--tangerine);color:#171512}
.btn.gold:hover{background:#ff943e;color:#171512}
.btn.light{color:#24170e;background:#f5dcb5}.btn.light:hover{color:#24170e;background:#fbe9cd}
.btn.ghost{background:transparent;color:#fbebd5;border-color:#efd6ac80}
.feature-grid{gap:1px;background:#e5d6c1;border:1px solid #e5d6c1;overflow:hidden;border-radius:16px}
.feature-grid .feature{border:none;box-shadow:none;border-radius:0;background:#fffaf2;min-height:190px}
.feature .feature-icon{background:#f4dcc0;color:#9a4617;width:auto;height:auto;display:inline-block;padding:5px 10px;border-radius:5px;font-size:.79rem}
.trust-row{color:#f3e2c5}.trust-row span:before{color:#ffad60;background:#ee701e25;border-color:#eab67580}
.category-tile{background:#fff9f0;border-color:#ebdbc4;box-shadow:none}
.category-tile:hover{background:#f7e7d1}
#results .thumb{background:linear-gradient(133deg,#1c1713,#704023);color:#ffe0ac}
#results>.card{background:#fffdf9;border-color:#e6d8c6}
#results .card .price{color:#201a15}
#quote{background:#f6e4ce}
.student-panel .student-intro{background:linear-gradient(112deg,#171512,#72401f);border-left:6px solid #ee701e}
.side{background:#191612;border-color:#443226}
.side a[aria-current="page"],.side a:hover{background:#ee701e22;color:#ffdaaf}
.kpis .card{border-top:3px solid #ee701e;background:#fffdfa}
.table th{color:#6e5c48}
.sales-hero.variant-02{background:linear-gradient(116deg,#171512,#393022 69%,#a1531e)}
.sales-hero.variant-03{background:linear-gradient(116deg,#201a16,#53402b 70%,#83562d)}
.sales-hero.variant-04{background:linear-gradient(116deg,#151512,#262321 56%,#a14f1d)}
.bottom-cta{border-left:5px solid #ee701e;background:#211b16}
footer{background:#171512;color:#dbc6a8}
footer a{color:#f7dcae}
@media(max-width:740px){.feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.feature-grid .feature{min-height:160px}}
.nav .brand img,.side-brand img{filter:drop-shadow(0 2px 5px #ee701e55)}
nav .brand img.brand-lockup{display:block;width:clamp(175px,18vw,225px);height:auto;max-height:54px;object-fit:contain;object-position:left center}
@media(max-width:740px){nav .brand img.brand-lockup{width:195px;max-height:50px}}
@media(max-width:420px){nav .brand img.brand-lockup{width:175px;max-height:45px}}
.kpis .card:has(strong){border-top:3px solid #ee701e}
.kpis .card strong{overflow-wrap:anywhere}

/* Thay: figures appear directly on the dark hero; never inside square cutout cards. */
.market-hero,.sales-hero{min-height:500px}
.hero-visual.hero-thay{position:relative;min-height:405px;display:flex;align-items:flex-end;justify-content:center;overflow:visible;isolation:isolate}
.hero-visual.hero-thay:before{content:"";position:absolute;left:50%;top:51%;transform:translate(-50%,-50%);width:min(108%,410px);height:min(90%,400px);border-radius:50%;background:radial-gradient(ellipse at center,#dc721e35 0%,#bd5b101c 48%,transparent 74%);filter:blur(2px);z-index:-1;box-shadow:none}
.hero-visual.hero-thay img.thay-avatar{display:block;width:auto;max-width:100%;height:clamp(410px,42vw,510px);object-fit:contain;object-position:center bottom;filter:drop-shadow(0 18px 22px #0008)}
.hero-visual.hero-thay img.thay-avatar.portrait{height:clamp(350px,37vw,460px);max-width:107%;margin-bottom:-26px}
.hero-visual.hero-thay img.thay-avatar.full{margin-bottom:-37px}
.hero-visual.hero-thay .hero-mini{z-index:2;right:-4%;bottom:9px}
.student-panel .student-intro{position:relative;overflow:hidden;display:flex;align-items:center;min-height:212px;padding:28px 34px}
.student-panel .student-intro>div{position:relative;z-index:2;max-width:calc(100% - 185px)}
.student-panel .student-intro h1{font-size:clamp(1.8rem,3vw,2.45rem)}
.student-panel .student-intro .eyebrow{color:#ffd49b}
.student-panel img.student-thay{position:absolute;right:21px;bottom:-19px;width:auto;height:218px;max-width:41%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 8px 15px #0006);z-index:1}
.admin-intro{position:relative;display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:169px;padding:10px 20px 8px 0;border-bottom:1px solid #e5d5be}
.admin-intro>div{max-width:740px}.admin-intro img{width:auto;height:145px;object-fit:contain;object-position:bottom;align-self:end;flex-shrink:0;filter:drop-shadow(0 8px 13px #50301730)}
@media(max-width:960px){.hero-visual.hero-thay img.thay-avatar{height:clamp(325px,43vw,450px)}.hero-visual.hero-thay img.thay-avatar.portrait{height:clamp(315px,40vw,425px)}.hero-visual.hero-thay{min-height:340px}}
@media(max-width:740px){.market-hero,.sales-hero{min-height:0}.hero-visual.hero-thay{min-height:275px;height:275px;margin:0 -10px -30px;overflow:hidden}.hero-visual.hero-thay img.thay-avatar{height:325px;margin-bottom:-38px}.hero-visual.hero-thay img.thay-avatar.portrait{height:335px;margin-bottom:-49px}.hero-visual.hero-thay .hero-mini{right:4%;bottom:38px}.student-panel .student-intro{min-height:200px}.student-panel img.student-thay{right:3px;height:190px}.student-panel .student-intro>div{max-width:calc(100% - 133px)}.admin-intro img{height:108px}.admin-intro{min-height:140px}}
@media(max-width:460px){.student-panel .student-intro{min-height:225px;padding:25px 20px}.student-panel .student-intro>div{max-width:61%}.student-panel .student-intro h1{font-size:1.8rem;line-height:1.16}.student-panel .student-intro p{font-size:.83rem;line-height:1.45}.student-panel img.student-thay{height:186px;right:-12px}.admin-intro img{height:100px}.admin-intro{padding:10px 0}.hero-visual.hero-thay .hero-mini{font-size:.72rem;max-width:65%;text-align:center}}
@media(max-width:460px){.feature-grid{grid-template-columns:1fr}.feature-grid .feature{min-height:auto}.market-hero,.sales-hero{padding:28px 21px}.hero-orbit{width:min(100%,210px)}}

/* atpconcursos | official permanent palette, applied after legacy declarations. */
:root{
 --brand-primary:#153F59;--brand-secondary:#245F7A;--brand-soft:#DFEBF2;
 --brand-accent:#F17950;--brand-white:#FFFFFF;--brand-page:#F5F6F2;
 --brand-ink:#1B252D;--brand-gray:#717A80;--brand-border:#E2E6E8;--brand-surface:#EDF1F3;
 --night:var(--brand-primary);--navy:var(--brand-primary);--blue:var(--brand-secondary);
 --cyan:var(--brand-secondary);--gold:var(--brand-accent);--cloud:var(--brand-page);
 --paper:var(--brand-white);--ink:var(--brand-ink);--muted:var(--brand-secondary);
 --line:var(--brand-border);--coal:var(--brand-primary);--coal-soft:var(--brand-secondary);
 --tangerine:var(--brand-accent);--sand:var(--brand-soft);--oat:var(--brand-page);
 --charcoal:var(--brand-ink);--focus:var(--brand-primary);
}
body{background:var(--brand-page);color:var(--brand-ink)}
a{color:var(--brand-secondary)}
a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--brand-primary);outline-offset:3px}
header{background:var(--brand-primary);border-bottom-color:var(--brand-secondary)}
header a:focus-visible,header button:focus-visible{outline-color:var(--brand-soft)}
nav a,nav a:hover,.side a,.side a:hover{color:var(--brand-white)}
nav .brand{gap:11px;font-weight:850}
nav .brand img.brand-emblem{display:block;width:47px;height:47px;object-fit:contain}
nav .brand .brand-text{font-size:clamp(1.05rem,2.15vw,1.35rem);color:var(--brand-white);letter-spacing:-.025em}
footer,.side{background:var(--brand-primary);color:var(--brand-soft);border-color:var(--brand-secondary)}
footer a{color:var(--brand-white)}
.eyebrow{color:var(--brand-secondary)}
.market-hero,.sales-hero,.sales-hero.variant-02,.sales-hero.variant-03,.sales-hero.variant-04{background:var(--brand-primary);border-color:var(--brand-secondary);box-shadow:0 14px 34px #153F5920}
.market-hero:before,.sales-hero:before{box-shadow:none;opacity:.16}
.market-hero p,.sales-hero p,.market-hero .eyebrow,.sales-hero .eyebrow,.trust-row{color:var(--brand-soft)}
.market-hero h1,.sales-hero h1{color:var(--brand-white)}
.btn{background:var(--brand-accent);color:var(--brand-ink)}
.btn:hover,.btn.gold:hover{background:var(--brand-accent);color:var(--brand-ink);box-shadow:0 5px 16px #153F5930}
.btn.gold,.gold{background:var(--brand-accent);color:var(--brand-ink)}
.btn.light{background:var(--brand-white);color:var(--brand-primary)}
.btn.light:hover{background:var(--brand-soft);color:var(--brand-primary)}
.btn.ghost{background:transparent;color:var(--brand-white);border-color:var(--brand-soft)}
.btn.ghost:hover{background:var(--brand-secondary);color:var(--brand-white)}
.hero-mini{background:var(--brand-soft);color:var(--brand-primary);border-color:var(--brand-border)}
.feature-grid{background:var(--brand-border);border-color:var(--brand-border)}
.feature-grid .feature,.feature,.step,.category-tile,.card,#results>.card,.kpis .card{background:var(--brand-white);border-color:var(--brand-border)}
.feature .feature-icon,.step .step-number{background:var(--brand-soft);color:var(--brand-primary)}
.category-tile:hover{background:var(--brand-soft);border-color:var(--brand-secondary)}
#results .thumb,.thumb,.product-layout .thumb{background:var(--brand-primary);color:var(--brand-soft)}
#results>.card:hover{box-shadow:0 10px 26px #153F5920}
#results .card>p,.section-heading p,.feature p,.step p,.muted{color:var(--brand-secondary)}
#results .card .price,.price,.kpis strong{color:var(--brand-primary)}
input,textarea,select{border-color:var(--brand-border);background:var(--brand-white);color:var(--brand-ink)}
#quote{background:var(--brand-soft);color:var(--brand-ink)}
.student-panel .student-intro{background:var(--brand-primary);border-left-color:var(--brand-accent)}
.student-panel .student-intro p,.student-panel .student-intro .eyebrow{color:var(--brand-soft)}
.side a[aria-current="page"],.side a:hover{background:var(--brand-secondary);color:var(--brand-white)}
.kpis .card,.kpis .card:has(strong){border-top-color:var(--brand-accent)}
.bottom-cta{background:var(--brand-primary);border-left-color:var(--brand-accent)}
.bottom-cta p{color:var(--brand-soft)}
.install-app{color:var(--brand-white);border-color:var(--brand-soft)}
@media(max-width:740px){nav .brand img.brand-emblem{width:38px;height:38px}nav .brand .brand-text{font-size:1.06rem}}`;