import { layout } from "./ui";
export function adminPinPage() {
 return layout(`
 <section class="card" style="max-width:520px;margin:36px auto">
 <span class="eyebrow">Acesso administrativo protegido</span>
 <h1>Confirmar PIN do administrador</h1>
 <p class="muted">Após o Cloudflare Access, informe seu PIN individual de 8 números. Nunca compartilhe o código.</p>
 <form id="admin-pin-login" hidden><label>PIN de 8 números
 <input name="pin" id="admin-pin-input" type="password" inputmode="numeric" pattern="[0-9]{8}" minlength="8" maxlength="8" autocomplete="current-password" required>
 </label><button class="btn">Entrar no painel</button></form>
 <form id="admin-pin-enroll" hidden><label>Cadastrar novo PIN (8 números)
 <input name="pin" id="admin-pin-new" type="password" inputmode="numeric" pattern="[0-9]{8}" minlength="8" maxlength="8" autocomplete="new-password" required>
 </label><button class="btn">Confirmar PIN</button></form>
 <button class="btn" type="button" id="admin-pin-request" hidden>Enviar link de ativação ou recuperação por e-mail</button>
 <p id="admin-pin-message" role="status" aria-live="polite"></p>
 </section>
 <script>
 (async()=>{
 const $=id=>document.getElementById(id);
 const search=new URLSearchParams(location.search),token=search.get('pin_token')||'';
 if(token)history.replaceState(null,'',location.pathname);
 const msg=$('admin-pin-message');
 async function post(path,data){
  const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
  const j=await r.json();if(!r.ok)throw Error(j.error||'Falha de autenticação');return j;
 }
 let enrolled=false;
 try{
  const r=await fetch('/api/admin/pin/status');
  const j=await r.json();if(!r.ok)throw Error(j.error||'Acesso indisponível');
  enrolled=!!j.enrolled;
 }catch(e){msg.textContent=e.message;return;}
 $('admin-pin-enroll').hidden=!token;
 $('admin-pin-login').hidden=!!token||!enrolled;
 $('admin-pin-request').hidden=!!token;
 $('admin-pin-request').textContent=enrolled?'Esqueci meu PIN — enviar link de redefinição':'Enviar link para cadastrar meu PIN';
 $('admin-pin-request').onclick=async()=>{
  try{await post('/api/admin/pin/request',{});msg.textContent='Confira o e-mail da conta autorizada pelo Cloudflare Access.';}
  catch(e){msg.textContent=e.message;}
 };
 $('admin-pin-login').onsubmit=async e=>{
  e.preventDefault();msg.textContent='Conferindo PIN...';
  try{await post('/api/admin/pin/login',{pin:$('admin-pin-input').value});location.replace('/adm');}
  catch(err){msg.textContent=err.message;}
 };
 $('admin-pin-enroll').onsubmit=async e=>{
  e.preventDefault();msg.textContent='Validando link...';
  try{await post('/api/admin/pin/enroll',{pin:$('admin-pin-new').value,token});location.replace('/adm');}
  catch(err){msg.textContent=err.message;}
 };
 })();
 </script>
 `,"Confirmação administrativa",true).replace('<script src="/app.js" defer></script>','');
}
