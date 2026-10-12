import { layout } from "./ui";
export function adminCustomersPage(){
return layout(`
<div class="admin"><aside class="side"><div class="side-brand"><img src="/brand/logo-atp.png" alt="Logo ATPCursos" width="45" height="45">Admin ATPCursos</div><a href="/adm">Dashboard</a><a href="/adm/produtos">Importar PDFs</a><a href="/adm/alunos">Alunos e cortesias</a></aside>
<section><h1>Alunos e cortesias</h1><p class="muted">Cortesias não entram na receita. A alteração do e-mail e da senha é confirmada pelo destinatário.</p>
<div class="card"><h2>Cadastrar aluno</h2><form id="register"><label>Nome completo<input name="name" required maxlength="120"></label><label>E-mail<input name="email" type="email" required maxlength="254"></label><button class="btn">Cadastrar</button></form></div>
<h2>Pesquisar alunos</h2><div class="toolbar"><input id="filter" placeholder="Nome ou e-mail"><button id="refresh" class="btn">Pesquisar</button></div>
<div id="list" class="card"></div>
<div id="manage" class="card" style="margin-top:20px" hidden><h2 id="customerName"></h2>
<form id="give"><h3>Cortesia de PDF</h3><label>PDF publicado<select name="productId" id="productId" required></select></label>
<label>Validade (dias, vazio = permanente)<input name="validDays" type="number" min="1" max="366"></label>
<label>Motivo<input name="reason" maxlength="200"></label><button class="btn">Liberar cortesia</button></form>
<h3>Cortesias concedidas</h3><div id="grants"></div>
<h3>Trocar e-mail</h3><form id="changeEmail"><label>Novo endereço<input name="newEmail" type="email" required></label><button class="btn">Enviar link para confirmar alteração</button></form>
<h3>Trocar senha</h3><p class="muted">O aluno cria sua nova senha pelo link recebido. Nenhuma senha é exibida ao administrador.</p>
<button class="btn" id="sendReset" type="button">Enviar link de redefinição</button>
<p role="status" id="message"></p>
</div></section></div>
<script>
let current=null;let customers=[];
const $=s=>document.querySelector(s);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function req(url,method='GET',data){let r=await fetch(url,{method,headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined});let v=await r.json();if(!r.ok)throw Error(v.error||'Falha');return v}
function say(v){$('#message').textContent=v}
async function list(){try{let d=await req('/api/admin/customers?q='+encodeURIComponent($('#filter').value));customers=d.customers;$('#list').innerHTML=d.customers.map(c=>'<div class="row" style="padding:10px 0;border-bottom:1px solid #ddd"><b>'+escapeHtml(c.full_name)+'</b><span>'+escapeHtml(c.email)+'</span><small>'+c.courtesies+' cortesias</small><button class="btn" data-id="'+escapeHtml(c.id)+'">Gerenciar</button></div>').join('')||'Nenhum aluno';document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>select(b.dataset.id))}catch(e){$('#list').textContent=e.message}}
async function select(id){current=id;const c=customers.find(x=>x.id===id);$('#manage').hidden=false;$('#customerName').textContent=c.full_name;await grants()}
async function grants(){try{let d=await req('/api/admin/customers/'+current+'/courtesies');$('#grants').innerHTML=d.courtesies.map(g=>'<div class="row"><b>'+escapeHtml(g.title)+'</b><small>'+escapeHtml(g.status)+'</small><button type="button" class="btn" data-resend="'+escapeHtml(g.id)+'">Reenviar</button><button type="button" class="btn" data-revoke="'+escapeHtml(g.id)+'">Revogar</button></div>').join('')||'Sem cortesias';document.querySelectorAll('[data-resend]').forEach(b=>b.onclick=()=>act('/api/admin/courtesies/'+b.dataset.resend+'/resend',{}));document.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=()=>{if(confirm('Revogar esta cortesia?'))act('/api/admin/courtesies/'+b.dataset.revoke+'/revoke',{})})}catch(e){say(e.message)}}
async function act(path,data){try{let result=await req(path,'POST',data);say(result.emailSent===false?'Liberado, mas o e-mail ainda não foi enviado. Confira o Resend.':'Solicitação processada.');await grants();await list()}catch(e){say(e.message)}}
$('#register').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await req('/api/admin/customers','POST',{name:f.get('name'),email:f.get('email')});e.target.reset();await list()}catch(err){say(err.message)}};
$('#give').onsubmit=async e=>{e.preventDefault();if(!current)return;const f=new FormData(e.target);await act('/api/admin/customers/'+current+'/courtesies',{productId:f.get('productId'),reason:f.get('reason'),validDays:f.get('validDays')?Number(f.get('validDays')):null})};
$('#changeEmail').onsubmit=async e=>{e.preventDefault();if(current)await act('/api/admin/customers/'+current+'/email-change',{newEmail:new FormData(e.target).get('newEmail')})};
$('#sendReset').onclick=async()=>{if(current)await act('/api/admin/customers/'+current+'/reset-password',{})};
$('#refresh').onclick=list;
req('/api/admin/products').then(d=>{$('#productId').innerHTML=(d.products||[]).filter(p=>p.status==='published').map(p=>'<option value="'+escapeHtml(p.id)+'">'+escapeHtml(p.title)+'</option>').join('')}).catch(()=>{});
list();
</script>`,"Admin · Alunos",true);
}
export function confirmPage(){
return layout(`<div class="card" style="max-width:600px;margin:40px auto"><h1>Confirme sua alteração</h1><form id="confirm"><label id="passwordLabel">Nova senha (mínimo 12 caracteres)<input id="password" type="password" minlength="12" maxlength="128" autocomplete="new-password"></label><button class="btn">Confirmar</button><p id="message" role="status"></p></form></div>
<script>
const params=new URLSearchParams(location.search),action=params.get('acao'),token=params.get('token');
document.querySelector('#passwordLabel').hidden=action!=='password_reset';
document.querySelector('#confirm').onsubmit=async e=>{e.preventDefault();const el=document.querySelector('#message');try{if(!['password_reset','email_change'].includes(action)||!token)throw Error('Link inválido');const r=await fetch('/api/customer/action/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,password:document.querySelector('#password').value})});const d=await r.json();if(!r.ok)throw Error(d.error);el.textContent='Alteração concluída. Acesse seus materiais.';history.replaceState(null,'','/confirmar')}catch(error){el.textContent=error.message}};
</script>`,"Confirmar alteração");
}
export function customerMaterialsPage(){
return layout(`<div class="student-panel"><div class="student-intro"><div><span class="eyebrow">Portal do aluno</span><h1>Minha biblioteca digital</h1><p>Seus materiais e cortesias reunidos em um único lugar.</p></div><img class="student-thay" src="/brand/thay-avatar-portrait.webp?v=sem-letras-2" alt="Avatar ilustrada da Thay" width="170" height="218" loading="lazy"></div><div class="card"><h2>Acessar meus PDFs</h2><p class="muted">As compras são entregues por e-mail. Para consultar suas cortesias, acesse sua conta opcional.</p>
<form id="login"><label>E-mail<input id="email" type="email" required autocomplete="email"></label><label>Senha<input id="password" type="password" required autocomplete="current-password"></label><button class="btn">Entrar</button><p id="message"></p></form>
<section id="account" hidden><h2 id="hello"></h2><button type="button" id="logout" class="btn">Sair</button><div id="files"></div></section></div></div>
<script>
const $=s=>document.querySelector(s);const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){const r=await fetch('/api/customer/me');if(!r.ok)return;const d=await r.json();$('#login').hidden=true;$('#account').hidden=false;$('#hello').textContent='Olá, '+d.customer.full_name;$('#files').innerHTML=d.courtesies.map(g=>'<div class="row" style="padding:12px 0"><b>'+esc(g.title)+'</b><a class="btn" href="/api/customer/courtesies/'+encodeURIComponent(g.id)+'/download">Baixar PDF</a></div>').join('')||'<p>Você ainda não possui cortesias ativas.</p>'}
$('#login').onsubmit=async e=>{e.preventDefault();const r=await fetch('/api/customer/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:$('#email').value,password:$('#password').value})});if(!r.ok){$('#message').textContent='E-mail ou senha inválidos';return}load()};
$('#logout').onclick=async()=>{await fetch('/api/customer/logout',{method:'POST'});location.reload()};load();
</script>`,"Meus Materiais");
}