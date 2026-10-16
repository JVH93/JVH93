(()=>{
const AXY_TEACHER_URL="https://jvh93.github.io/JVH93/archivo-xy-docente/";
const AXY_TEACHER_PUBLIC={"kty":"EC","crv":"P-256","x":"BVjtfhQ8OIZhJQW2FHsVxUrUH6WlOJZPM6znJV5RJh8","y":"P2bF5vXO0reUa7ScZE5qe0QN2slpfE7Hh9ZQmhjwrUU","ext":true,"key_ops":["verify"]};
function qrMatrix(text){
  const RS=[null,
    [[1,26,19]],[[1,44,34]],[[1,70,55]],[[1,100,80]],[[1,134,108]],
    [[2,86,68]],[[2,98,78]],[[2,121,97]],[[2,146,116]],[[2,86,68],[2,87,69]]
  ];
  const ALIGN=[null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
  const bytes=Array.from(new TextEncoder().encode(text));
  let ver=0, dataCw=0;
  for(let v=1;v<=10;v++){
    const d=RS[v].reduce((s,g)=>s+g[0]*g[2],0), countBits=v<=9?8:16;
    if(4+countBits+bytes.length*8<=d*8){ver=v;dataCw=d;break}
  }
  if(!ver) throw new Error('QR payload too large');
  const bits=[];
  const put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};
  put(4,4); put(bytes.length,ver<=9?8:16); for(const b of bytes)put(b,8);
  const cap=dataCw*8; for(let i=0;i<Math.min(4,cap-bits.length);i++)bits.push(0);
  while(bits.length%8)bits.push(0);
  let pad=0; while(bits.length<cap){put(pad++%2?0x11:0xEC,8)}
  const data=[]; for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b)}

  const exp=new Array(512),log=new Array(256);let x=1;
  for(let i=0;i<255;i++){exp[i]=x;log[x]=i;x<<=1;if(x&0x100)x^=0x11d}
  for(let i=255;i<512;i++)exp[i]=exp[i-255];
  const mul=(a,b)=>a&&b?exp[log[a]+log[b]]:0;
  const rsGen=n=>{let g=[1];for(let i=0;i<n;i++){const a=exp[i],ng=new Array(g.length+1).fill(0);for(let j=0;j<g.length;j++){ng[j]^=g[j];ng[j+1]^=mul(g[j],a)}g=ng}return g};
  const rsRem=(d,n)=>{const g=rsGen(n),a=d.concat(new Array(n).fill(0));for(let i=0;i<d.length;i++){const f=a[i];if(f)for(let j=0;j<g.length;j++)a[i+j]^=mul(g[j],f)}return a.slice(-n)};
  const blocks=[],ecc=[];let off=0;
  for(const [count,total,dc] of RS[ver])for(let k=0;k<count;k++){const b=data.slice(off,off+dc);off+=dc;blocks.push(b);ecc.push(rsRem(b,total-dc))}
  const code=[];const maxD=Math.max(...blocks.map(b=>b.length));
  for(let i=0;i<maxD;i++)for(const b of blocks)if(i<b.length)code.push(b[i]);
  const maxE=Math.max(...ecc.map(b=>b.length));for(let i=0;i<maxE;i++)for(const e of ecc)if(i<e.length)code.push(e[i]);

  const n=21+4*(ver-1),m=Array.from({length:n},()=>Array(n).fill(0)),fn=Array.from({length:n},()=>Array(n).fill(false));
  const set=(xx,yy,v)=>{if(xx>=0&&yy>=0&&xx<n&&yy<n){m[yy][xx]=v?1:0;fn[yy][xx]=true}};
  function finder(cx,cy){for(let dy=-1;dy<=7;dy++)for(let dx=-1;dx<=7;dx++){const xx=cx+dx,yy=cy+dy;if(xx<0||yy<0||xx>=n||yy>=n)continue;const dark=dx>=0&&dx<=6&&dy>=0&&dy<=6&&(dx===0||dx===6||dy===0||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4));set(xx,yy,dark)}}
  finder(0,0);finder(n-7,0);finder(0,n-7);
  for(const cy of ALIGN[ver])for(const cx of ALIGN[ver]){
    if(fn[cy][cx])continue;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(cx+dx,cy+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
  }
  for(let i=8;i<n-8;i++){if(!fn[6][i])set(i,6,i%2===0);if(!fn[i][6])set(6,i,i%2===0)}
  function format(mask){const data=(1<<3)|mask;let rem=data;for(let i=0;i<10;i++)rem=(rem<<1)^(((rem>>>9)&1)*0x537);const val=((data<<10)|rem)^0x5412;const bit=i=>(val>>>i)&1;
    for(let i=0;i<=5;i++)set(8,i,bit(i));set(8,7,bit(6));set(8,8,bit(7));set(7,8,bit(8));for(let i=9;i<15;i++)set(14-i,8,bit(i));
    for(let i=0;i<8;i++)set(n-1-i,8,bit(i));for(let i=8;i<15;i++)set(8,n-15+i,bit(i));set(8,n-8,1);
  }
  format(0);
  if(ver>=7){let rem=ver;for(let i=0;i<12;i++)rem=(rem<<1)^(((rem>>>11)&1)*0x1f25);const val=(ver<<12)|rem;for(let i=0;i<18;i++){const b=(val>>>i)&1,a=n-11+(i%3),c=Math.floor(i/3);set(a,c,b);set(c,a,b)}}
  let bi=0;for(let right=n-1;right>=1;right-=2){if(right===6)right--;for(let vert=0;vert<n;vert++){const yy=(((right+1)&2)===0)?n-1-vert:vert;for(let j=0;j<2;j++){const xx=right-j;if(fn[yy][xx])continue;let b=0;if(bi<code.length*8)b=(code[bi>>>3]>>>(7-(bi&7)))&1;bi++;if(((xx+yy)&1)===0)b^=1;m[yy][xx]=b}}}
  return {version:ver,size:n,matrix:m};
}


const css=`
.qr-auth-block{display:grid;gap:12px;justify-items:center;margin-top:12px}.qr-holder{background:#fff;border-radius:16px;padding:14px;box-shadow:0 0 0 1px rgba(114,240,208,.28),0 14px 42px rgba(0,0,0,.35);width:min(320px,76vw);aspect-ratio:1;display:grid;place-items:center}.qr-holder canvas{width:100%;height:100%;image-rendering:pixelated}.qr-instructions{max-width:590px;text-align:center;color:#cbd9e8;line-height:1.45}.qr-fallback{width:min(620px,92vw);margin-top:4px}.qr-fallback summary{cursor:pointer;color:#9fb6cc;font-size:.83rem}.qr-fallback input{width:100%;margin-top:8px}.qr-scan-overlay{position:fixed;inset:0;z-index:12000;background:rgba(2,7,14,.97);display:none;place-items:center;padding:18px}.qr-scan-overlay.show{display:grid}.qr-scan-card{width:min(760px,96vw);display:grid;gap:12px;justify-items:center;text-align:center}.qr-video-wrap{position:relative;width:min(620px,92vw);aspect-ratio:4/3;background:#02060b;border:1px solid #29445f;border-radius:18px;overflow:hidden}.qr-video-wrap video{width:100%;height:100%;object-fit:cover}.qr-frame{position:absolute;inset:13%;border:3px solid #72f0d0;border-radius:18px;box-shadow:0 0 30px rgba(114,240,208,.24)}.auth-status{font-size:.93rem;color:#cbd9e8;min-height:1.4em}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
function qrDraw(holder,text){const q=qrMatrix(text),quiet=4,scale=6,c=document.createElement('canvas');c.width=c.height=(q.size+quiet*2)*scale;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#000';q.matrix.forEach((row,y)=>row.forEach((v,xx)=>{if(v)x.fillRect((xx+quiet)*scale,(y+quiet)*scale,scale,scale)}));holder.innerHTML='';holder.appendChild(c)}
function rb(n=10){const a=new Uint8Array(n);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('')}
function b64uBytes(a){let s='';a.forEach(b=>s+=String.fromCharCode(b));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'')}
function b64uText(t){return b64uBytes(new TextEncoder().encode(t))}
function b64uToBytes(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const r=atob(s),a=new Uint8Array(r.length);for(let i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a}
async function sha(t){return b64uBytes(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))))}
let verifyKey=null;async function vk(){if(!verifyKey)verifyKey=await crypto.subtle.importKey('jwk',AXY_TEACHER_PUBLIC,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);return verifyKey}
state.supervised=state.supervised||{};if(!state.supervised.sessionId)state.supervised.sessionId=rb(8);if(!state.supervised.pendingAuth)state.supervised.pendingAuth=null;save();
const cp=document.querySelector('#checkpointOverlay .checkpoint-card');
if(cp)cp.innerHTML=`<div class="micro">CONTROL DOCENTE · QR FIRMADO</div><h2>Punto de control</h2><p class="lead" style="font-size:1rem">Muestra tu libreta al docente. Después muestra este QR. No se utiliza ninguna contraseña en el equipo del alumno.</p><div class="checkpoint-token" id="checkpointInfo">Control 1 · progreso verificado</div><div class="qr-auth-block"><div id="checkpointQr" class="qr-holder"></div><div class="qr-instructions">El docente escanea tu solicitud con su teléfono. Cuando su pantalla muestre la autorización, pulsa el botón y escanea el QR de respuesta.</div><div id="checkpointMsg" class="feedback"></div><button class="btn" onclick="startAuthScan('checkpoint')">ESCANEAR RESPUESTA DOCENTE</button><details class="qr-fallback"><summary>Alternativa si la cámara no está disponible</summary><input id="checkpointAuthToken" placeholder="Pega aquí el token de autorización"><button class="btn secondary" style="margin-top:8px" onclick="submitAuthToken('checkpoint')">VALIDAR TOKEN</button></details></div>`;
const ga=document.getElementById('guardTeacherArea');if(ga)ga.innerHTML=`<div class="qr-auth-block"><div class="micro">SOLICITUD DE DESBLOQUEO</div><div id="guardQr" class="qr-holder"></div><div class="qr-instructions">Muestra este QR al docente. El docente lo escanea con su teléfono y te mostrará un QR de respuesta firmado.</div><div id="guardTeacherMsg" class="feedback"></div><button class="btn secondary" onclick="startAuthScan('guard')">ESCANEAR RESPUESTA DOCENTE</button><details class="qr-fallback"><summary>Alternativa si la cámara no está disponible</summary><input id="guardAuthToken" placeholder="Pega aquí el token de autorización"><button class="btn secondary" style="margin-top:8px" onclick="submitAuthToken('guard')">VALIDAR TOKEN</button></details></div>`;
const gb=document.getElementById('guardTeacherBtn');if(gb){gb.textContent='AUTORIZACIÓN QR';gb.onclick=()=>startAuthScan('guard')}
const gs3=document.getElementById('guardS3');if(gs3)gs3.innerHTML='<b>3</b>Autorización docente';
const scan=document.createElement('div');scan.className='qr-scan-overlay';scan.id='qrScanOverlay';scan.innerHTML=`<div class="qr-scan-card"><div class="micro">LECTOR DE AUTORIZACIÓN DOCENTE</div><h2 style="margin:.1rem 0">Apunta al QR del docente</h2><div class="qr-video-wrap"><video id="qrVideo" playsinline muted></video><div class="qr-frame"></div></div><div id="qrScanMsg" class="auth-status">Preparando cámara…</div><div class="actions"><button class="btn secondary" onclick="stopAuthScan()">CANCELAR</button></div><canvas id="qrScanCanvas" class="hidden"></canvas></div>`;document.body.appendChild(scan);
function req(kind,idx){const s=state.supervised;let a=s.pendingAuth;if(a&&a.kind===kind&&a.idx===idx&&a.token)return a;const code=kind==='checkpoint'?'c':'g',name=b64uText((state.student?.name||'').slice(0,40)),group=b64uText((state.student?.group||'').slice(0,16));const token=['AXYQ1',s.sessionId,code,idx,totalRecovered(),rb(10),name,group,Date.now().toString(36)].join('~');a={kind,idx,token,created:Date.now()};s.pendingAuth=a;save();return a}
function renderReq(kind,idx,id){const a=req(kind,idx),u=AXY_TEACHER_URL+'#r='+a.token;qrDraw(document.getElementById(id),u);return a}
async function verify(raw,kind){raw=(raw||'').trim();const p=raw.split('.');if(p.length!==4||p[0]!=='AXYR1')throw new Error('Formato de autorización no reconocido');const exp=parseInt(p[1],36);if(!Number.isFinite(exp)||Date.now()>exp)throw new Error('La autorización expiró');if(exp-Date.now()>180000)throw new Error('Tiempo de autorización inválido');const a=state.supervised.pendingAuth;if(!a||a.kind!==kind)throw new Error('No existe una solicitud activa');const h=await sha(a.token);if(h!==p[2])throw new Error('La autorización pertenece a otra solicitud');const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},await vk(),b64uToBytes(p[3]),new TextEncoder().encode(`AXYR1|${p[1]}|${h}`));if(!ok)throw new Error('Firma docente inválida');return true}
async function apply(raw,kind){const msg=document.getElementById(kind==='checkpoint'?'checkpointMsg':'guardTeacherMsg');msg.textContent='Verificando firma docente…';msg.className='feedback';try{await verify(raw,kind);if(kind==='checkpoint'){const idx=state.supervised.pendingCheckpoint;if(!state.supervised.checkpointsPassed.includes(idx))state.supervised.checkpointsPassed.push(idx);state.supervised.pendingCheckpoint=null;state.supervised.pendingAuth=null;save();msg.textContent='Autorización docente verificada.';msg.className='feedback good';setTimeout(()=>{document.getElementById('checkpointOverlay').classList.remove('show');continueAfterRecoveredPoint()},300)}else{state.supervised.hardLocked=false;state.supervised.tempLockUntil=0;state.supervised.pendingAuth=null;save();msg.textContent='Desbloqueo docente verificado.';msg.className='feedback good';await enterFullscreen();setTimeout(()=>document.getElementById('guardOverlay').classList.remove('show'),350)}}catch(e){msg.textContent=e.message||'Autorización inválida';msg.className='feedback bad'}}
window.submitAuthToken=kind=>{const e=document.getElementById(kind==='checkpoint'?'checkpointAuthToken':'guardAuthToken');apply(e?.value||'',kind)};
const oldShowGuard=window.showGuard;window.showGuard=function(reason){oldShowGuard(reason);if(state.supervised.hardLocked){renderReq('guard',state.supervised.incidents.length,'guardQr');if(gb)gb.classList.add('hidden')}};
window.showCheckpoint=function(){const idx=state.supervised.pendingCheckpoint;if(idx===null||idx<0)return;document.getElementById('checkpointInfo').textContent=`Control ${idx+1} · ${CHECKPOINTS[idx]} puntos recuperados`;document.getElementById('checkpointMsg').textContent='';const f=document.getElementById('checkpointAuthToken');if(f)f.value='';renderReq('checkpoint',idx,'checkpointQr');document.getElementById('checkpointOverlay').classList.add('show')};
window.approveCheckpoint=()=>submitAuthToken('checkpoint');window.unlockGuardWithTeacher=()=>submitAuthToken('guard');
let stream=null,kindNow=null,busy=false;function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}async function ensureJsQR(){if(window.jsQR)return true;try{await loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js')}catch(e){try{await loadScript('https://unpkg.com/jsqr@1.4.0/dist/jsQR.js')}catch(e2){}}return !!window.jsQR}
window.startAuthScan=async function(kind){kindNow=kind;const ov=document.getElementById('qrScanOverlay'),msg=document.getElementById('qrScanMsg'),v=document.getElementById('qrVideo');ov.classList.add('show');msg.textContent='Preparando lector QR…';if(!await ensureJsQR()){msg.textContent='No se pudo cargar el lector QR. Usa la alternativa de token.';return}try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});v.srcObject=stream;await v.play();msg.textContent='Centra el QR del docente dentro del recuadro.';busy=false;requestAnimationFrame(loop)}catch(e){msg.textContent='No fue posible abrir la cámara. Revisa el permiso del navegador.'}};
window.stopAuthScan=function(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}const v=document.getElementById('qrVideo');if(v)v.srcObject=null;document.getElementById('qrScanOverlay').classList.remove('show');busy=false};
async function loop(){if(!stream)return;const v=document.getElementById('qrVideo'),c=document.getElementById('qrScanCanvas');if(v.readyState>=2&&!busy){busy=true;const w=v.videoWidth,h=v.videoHeight;if(w&&h){c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(v,0,0,w,h);const im=x.getImageData(0,0,w,h),code=window.jsQR(im.data,w,h,{inversionAttempts:'attemptBoth'});if(code&&code.data){const k=kindNow,r=code.data;stopAuthScan();await apply(r,k);return}}busy=false}requestAnimationFrame(loop)}
})();