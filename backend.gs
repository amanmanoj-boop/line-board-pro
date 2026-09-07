const SHEET_ID='';
const ADMIN_USER='Aman132';
const ADMIN_PASS='Aman@1324';
const SESSION_SECONDS=30*60;
const HASH_ROUNDS=12000;
const MIN_PASSWORD_LEN=8;
const TOTP_STEP=30;
const TOTP_DIGITS=6;
const TOTP_WINDOW=1;
const TOTP_CHALLENGE_SECONDS=300;

function ss_(){return SHEET_ID?SpreadsheetApp.openById(SHEET_ID):SpreadsheetApp.getActiveSpreadsheet();}
function rows_(sh){const v=sh.getDataRange().getValues();return v.length>1?v.slice(1):[];}
function json_(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);}
function setup_(){
 const ss=ss_();let u=ss.getSheetByName('Users'),b=ss.getSheetByName('Batches'),c=ss.getSheetByName('Customers');
 let s=ss.getSheetByName('SFG_Stock'),f=ss.getSheetByName('FG_Stock'),h=ss.getSheetByName('HOMO_Details'),p=ss.getSheetByName('Production_Summary');
 if(!u)u=ss.insertSheet('Users');if(!b)b=ss.insertSheet('Batches');if(!c)c=ss.insertSheet('Customers');if(!s)s=ss.insertSheet('SFG_Stock');if(!f)f=ss.insertSheet('FG_Stock');if(!h)h=ss.insertSheet('HOMO_Details');if(!p)p=ss.insertSheet('Production_Summary');
 if(u.getLastRow()===0)u.appendRow(['username','passwordHash','salt','name','role','mobile','active','created','updated']); else migrateUsersHeader_(u);
 if(b.getLastRow()===0)b.appendRow(['id','date','furnace','castNo','batch','size','alloy','internalAlloyCode','qty','product','customer','customerRequirement','targetDate','targetTime','readyDate','cutOff','etd','targetAchieved','totalBillets','rejectedBillets','billetMT','charge','stage','hold','remarks','created','updated','timingsJson','dispatchTime']); else migrateBatchesHeader_(b);
 if(c.getLastRow()===0)c.appendRow(['name','size','alloy','internalAlloyCode','billets','castWt','targetTime','readyDate','cutOff','etd','requirement']);
 if(s.getLastRow()===0)s.appendRow(['batchNo','alloy','diameter','pcs','quantity','status']);
 if(f.getLastRow()===0)f.appendRow(['date','batchNo','alloy','internalAlloy','diameter','receivedPcs','unpackedPcs','packedPcs','dispatchedPcs','defectedPcs','availableStockPcs','weight','status']);
 if(h.getLastRow()===0)h.appendRow(['batchNo','alloy','diameter','pcs','quantity','status','chargeNo','inTime','outTime','duration']);
 else migrateHomoHeader_(h);
 if(p.getLastRow()===0)p.appendRow(['batchNo','alloy','remarks','totalCast','dispatch','fg','sfg','total','diff','rejection']);
 ensureAdmin_(u);
}
function migrateBatchesHeader_(sh){const required=['id','date','furnace','castNo','batch','size','alloy','internalAlloyCode','qty','product','customer','customerRequirement','targetDate','targetTime','readyDate','cutOff','etd','targetAchieved','totalBillets','rejectedBillets','billetMT','charge','stage','hold','remarks','created','updated','timingsJson','dispatchTime'];if(sh.getLastColumn()<required.length)sh.insertColumnsAfter(sh.getLastColumn(),required.length-sh.getLastColumn());required.forEach((name,i)=>sh.getRange(1,i+1).setValue(name));}
function migrateUsersHeader_(sh){
 const required=['username','passwordHash','salt','name','role','mobile','active','created','updated'];
 if(sh.getLastColumn()<required.length)sh.insertColumnsAfter(sh.getLastColumn(),required.length-sh.getLastColumn());
 const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
 if(h[5]==='active' && h[8]==='twofaEnabled'){
   sh.insertColumnAfter(5);
 }
 required.forEach((name,i)=>sh.getRange(1,i+1).setValue(name));
}
function migrateHomoHeader_(sh){
 const required=['batchNo','alloy','diameter','pcs','quantity','status','chargeNo','inTime','outTime','duration'];
 const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),required.length)).getValues()[0].map(String);
 required.forEach((name,i)=>{if(current[i]!==name)sh.getRange(1,i+1).setValue(name);});
 if(sh.getLastColumn()<required.length)sh.insertColumnsAfter(sh.getLastColumn(),required.length-sh.getLastColumn());
}
function ensureAdmin_(sh){const r=rows_(sh),i=r.findIndex(x=>String(x[0])===ADMIN_USER);if(i<0){const h=hashPassword_(ADMIN_PASS);sh.appendRow([ADMIN_USER,h.hash,h.salt,'Aman132','Admin','',true,new Date(),new Date(),false,'']);}else if(String(r[i][4])!=='Admin'||r[i][5]!==true)sh.getRange(i+2,5,1,2).setValues([['Admin',true]]);}
function hashPassword_(p,s){s=s||Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');let v=s+String(p);for(let i=0;i<HASH_ROUNDS;i++)v=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,v,Utilities.Charset.UTF_8));return {hash:v,salt:s};}
function verifyPassword_(p,h,s){return hashPassword_(p,s).hash===String(h);}
function createSession_(u){const t=Utilities.getUuid()+'-'+Utilities.getUuid();CacheService.getScriptCache().put('session:'+t,JSON.stringify(u),SESSION_SECONDS);return t;}
function auth_(t){if(!t)return null;const k='session:'+t,v=CacheService.getScriptCache().get(k);if(!v)return null;CacheService.getScriptCache().put(k,v,SESSION_SECONDS);return JSON.parse(v);}
function requireAuth_(x){const u=auth_(x.token);if(!u)throw new Error('AUTH');return u;}
function requireAdmin_(x){const u=requireAuth_(x);if(u.role!=='Admin')throw new Error('FORBIDDEN');return u;}
function safeUser_(r){return {username:r[0],name:r[3],role:r[4],mobile:r[5]||'',active:r[6]!==false,twofaEnabled:r[9]===true||String(r[9]).toLowerCase()==='true'};}
function findUserRow_(username){const sh=ss_().getSheetByName('Users'),r=rows_(sh);return {sh,rows:r,index:r.findIndex(a=>String(a[0]).toLowerCase()===String(username||'').trim().toLowerCase())};}
function login_(x){
 const u=String(x.username||'').trim(),p=String(x.password||''),z=findUserRow_(u),r=z.index>=0?z.rows[z.index]:null;
 if(!r||r[6]===false||!verifyPassword_(p,r[1],r[2]))return {ok:false,error:'Invalid username or password.'};
 const user=safeUser_(r);
 return completeLogin_(user);
}
function completeLogin_(user){return {ok:true,token:createSession_(user),user,batches:getBatches_(),customers:getCustomers_().customers,sfgStock:getSfg_(),fgStock:getFg_(),homoDetails:getHomo_(),productionSummary:getProd_()};}
function verify2fa_(x){
 const challenge=String(x.challenge||''),code=String(x.code||'').replace(/\D/g,''),cache=CacheService.getScriptCache(),raw=cache.get('2fa:'+challenge);
 if(!raw)return {ok:false,error:'Verification session expired. Sign in again.'};
 if(!/^\d{6}$/.test(code))return {ok:false,error:'Invalid verification code.'};
 const attemptKey='2fa-attempt:'+challenge,attempts=Number(cache.get(attemptKey)||0)+1;cache.put(attemptKey,String(attempts),TOTP_CHALLENGE_SECONDS);
 if(attempts>5){cache.remove('2fa:'+challenge);return {ok:false,error:'Too many verification attempts. Sign in again.'};}
 const q=JSON.parse(raw),z=findUserRow_(q.username);if(z.index<0)return {ok:false,error:'User not found.'};const r=z.rows[z.index];
 if(!r[10]||!verifyTotp_(String(r[10]),code))return {ok:false,error:'Invalid verification code.'};
 cache.remove('2fa:'+challenge);cache.remove(attemptKey);return completeLogin_(safeUser_(r));
}
function logout_(x){if(x.token)CacheService.getScriptCache().remove('session:'+x.token);return {ok:true};}
function register_(x){const n=String(x.name||'').trim(),u=String(x.username||'').trim(),p=String(x.password||'');if(!n||!u||p.length<MIN_PASSWORD_LEN)return {ok:false,error:'Name, username and password of at least 8 characters are required.'};const sh=ss_().getSheetByName('Users');if(rows_(sh).some(r=>String(r[0]).toLowerCase()===u.toLowerCase()))return {ok:false,error:'Username already exists.'};const h=hashPassword_(p);sh.appendRow([u,h.hash,h.salt,n,'Operator',true,new Date(),new Date()]);return {ok:true};}
function getData_(x){const u=requireAuth_(x);return {ok:true,user:u,batches:getBatches_(),customers:getCustomers_().customers,sfgStock:getSfg_(),fgStock:getFg_(),homoDetails:getHomo_(),productionSummary:getProd_()};}
function getUsers_(x){requireAdmin_(x);return {ok:true,users:rows_(ss_().getSheetByName('Users')).map(safeUser_)};}
function saveUser_(x){requireAdmin_(x);const u=x.user||{},n=String(u.name||'').trim(),un=String(u.username||'').trim(),p=String(u.password||''),role=['Admin','Supervisor','Operator','QC'].includes(u.role)?u.role:'Operator';if(!n||!un||p.length<MIN_PASSWORD_LEN)return {ok:false,error:'Name, username and password of at least 8 characters are required.'};const sh=ss_().getSheetByName('Users'),r=rows_(sh),i=r.findIndex(a=>String(a[0]).toLowerCase()===un.toLowerCase());if(i<0){const h=hashPassword_(p);sh.appendRow([un,h.hash,h.salt,n,role,true,new Date(),new Date(),false,'']);}else{if(String(r[i][0])===ADMIN_USER&&role!=='Admin')return {ok:false,error:'Main Admin cannot be demoted.'};const h=hashPassword_(p);sh.getRange(i+2,2,1,7).setValues([[h.hash,h.salt,n,role,r[i][5]!==false,r[i][6]||new Date(),new Date()]]);}return {ok:true};}
function deleteUser_(x){requireAdmin_(x);const un=String(x.username||'');if(un===ADMIN_USER)return {ok:false,error:'Main Admin cannot be deleted.'};const sh=ss_().getSheetByName('Users'),r=rows_(sh),i=r.findIndex(a=>String(a[0])===un);if(i>=0)sh.deleteRow(i+2);return {ok:true};}
function randomBase32_(len){const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let out='';const bytes=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');for(let i=0;i<len;i++){const n=parseInt(bytes.substr((i*2)%bytes.length,2),16);out+=chars[n%32];}return out;}
function base32Decode_(s){s=String(s).replace(/=+$/,'').toUpperCase().replace(/[^A-Z2-7]/g,'');let bits='',out=[];for(let i=0;i<s.length;i++){bits+=('00000'+('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(s[i])).toString(2)).slice(-5);while(bits.length>=8){out.push(parseInt(bits.slice(0,8),2));bits=bits.slice(8);}}return out;}
function counterBytes_(counter){let a=[];for(let i=7;i>=0;i--)a.push((Math.floor(counter/Math.pow(256,i)))%256);return a;}
function verifyTotp_(secret,code){const key=base32Decode_(secret),now=Math.floor(Date.now()/1000);for(let w=-TOTP_WINDOW;w<=TOTP_WINDOW;w++){const ctr=Math.floor(now/TOTP_STEP)+w,digest=Utilities.computeHmacSha1Signature(counterBytes_(ctr),key),offset=digest[digest.length-1]&15;const bin=((digest[offset]&127)<<24)|((digest[offset+1]&255)<<16)|((digest[offset+2]&255)<<8)|(digest[offset+3]&255);const otp=String(bin%1000000).padStart(TOTP_DIGITS,'0');if(otp===code)return true;}return false;}
function start2faSetup_(x){const u=requireAuth_(x),z=findUserRow_(u.username);if(z.index<0)return {ok:false,error:'User not found.'};const secret=randomBase32_(32),token=Utilities.getUuid()+'-'+Utilities.getUuid();CacheService.getScriptCache().put('2fasetup:'+token,JSON.stringify({username:u.username,secret}),TOTP_CHALLENGE_SECONDS);const account=encodeURIComponent(u.username),issuer=encodeURIComponent('Line Board Pro');return {ok:true,setupToken:token,secret,account:u.username,otpauth:'otpauth://totp/'+issuer+':'+account+'?secret='+secret+'&issuer='+issuer};}
function confirm2faSetup_(x){const u=requireAuth_(x),token=String(x.setupToken||''),raw=CacheService.getScriptCache().get('2fasetup:'+token),code=String(x.code||'').replace(/\D/g,'');if(!raw)return {ok:false,error:'2FA setup expired. Start setup again.'};const q=JSON.parse(raw);if(q.username!==u.username||!verifyTotp_(q.secret,code))return {ok:false,error:'Invalid authenticator code. 2FA was not enabled.'};const z=findUserRow_(u.username);if(z.index<0)return {ok:false,error:'User not found.'};z.sh.getRange(z.index+2,10,1,2).setValues([[true,q.secret]]);CacheService.getScriptCache().remove('2fasetup:'+token);return {ok:true};}
function disable2fa_(x){const u=requireAuth_(x),code=String(x.code||'').replace(/\D/g,''),z=findUserRow_(u.username);if(z.index<0)return {ok:false,error:'User not found.'};const r=z.rows[z.index];if(r[9]!==true&&!String(r[9]).toLowerCase().includes('true'))return {ok:true};if(!r[10]||!verifyTotp_(String(r[10]),code))return {ok:false,error:'Invalid authenticator code.'};z.sh.getRange(z.index+2,10,1,2).setValues([[false,'']]);return {ok:true};}
function securityStatus_(x){const u=requireAuth_(x),z=findUserRow_(u.username);if(z.index<0)return {ok:false,error:'User not found.'};return {ok:true,twofaEnabled:z.rows[z.index][9]===true||String(z.rows[z.index][9]).toLowerCase()==='true'};}

function getBatches_(){return rows_(ss_().getSheetByName('Batches')).map(r=>({id:r[0],date:r[1],furnace:r[2],castNo:r[3],batch:r[4],size:r[5],alloy:r[6],internalAlloyCode:r[7],qty:r[8],product:r[9],customer:r[10],customerRequirement:r[11],targetDate:r[12],targetTime:r[13],readyDate:r[14],cutOff:r[15],etd:r[16],targetAchieved:r[17]===true||String(r[17]).toLowerCase()==='true',totalBillets:Number(r[18]||0),rejectedBillets:Number(r[19]||0),billetMT:Number(r[20]||0),charge:r[21],stage:r[22],hold:r[23]===true||String(r[23]).toLowerCase()==='true',remarks:r[24],created:r[25],updated:r[26],timings:(()=>{try{return r[27]?JSON.parse(r[27]):{}}catch(e){return {}}})(),dispatchTime:r[28]||''}));}
function saveBatch_(x){requireAuth_(x);const b=x.batch||{};if(!b.id||!b.batch)return {ok:false,error:'Invalid batch.'};if(Number(b.rejectedBillets||0)>Number(b.totalBillets||0))return {ok:false,error:'Rejected billets cannot exceed total billets.'};const sh=ss_().getSheetByName('Batches'),r=rows_(sh),i=r.findIndex(a=>String(a[0])===String(b.id));const v=[b.id,b.date,b.furnace,b.castNo,b.batch,b.size,b.alloy,b.internalAlloyCode,b.qty,b.product,b.customer,b.customerRequirement,b.targetDate,b.targetTime,b.readyDate,b.cutOff,b.etd,!!b.targetAchieved,Number(b.totalBillets||0),Number(b.rejectedBillets||0),Number(b.billetMT||0),b.charge,b.stage,!!b.hold,b.remarks,b.created,b.updated,JSON.stringify(b.timings||{}),b.dispatchTime||''];if(i<0)sh.appendRow(v);else sh.getRange(i+2,1,1,29).setValues([v]);return {ok:true};}
function deleteBatch_(x){requireAuth_(x);const sh=ss_().getSheetByName('Batches'),r=rows_(sh),i=r.findIndex(a=>String(a[0])===String(x.id));if(i>=0)sh.deleteRow(i+2);return {ok:true};}
function deleteCustomer_(x){requireAdmin_(x);const n=String(x.name||''),sh=ss_().getSheetByName('Customers'),r=rows_(sh),i=r.findIndex(a=>String(a[0]).toLowerCase()===n.toLowerCase());if(i>=0)sh.deleteRow(i+2);return {ok:true};}
function getCustomers_(x){const sh=ss_().getSheetByName('Customers');if(!sh)return {ok:true,customers:[]};return {ok:true,customers:rows_(sh).map(r=>({name:r[0],size:r[1],alloy:r[2],internalAlloyCode:r[3],billets:r[4],castWt:Number(r[5]||0),targetTime:r[6],readyDate:r[7],cutOff:r[8],etd:r[9],requirement:r[10]}))};}

function getSfg_(){return rows_(ss_().getSheetByName('SFG_Stock')).map(r=>({batchNo:r[0],alloy:r[1],diameter:r[2],pcs:Number(r[3]||0),quantity:Number(r[4]||0),status:r[5]}));}
function getFg_(){return rows_(ss_().getSheetByName('FG_Stock')).map(r=>({date:r[0],batchNo:r[1],alloy:r[2],internalAlloy:r[3],diameter:r[4],receivedPcs:Number(r[5]||0),unpackedPcs:Number(r[6]||0),packedPcs:Number(r[7]||0),dispatchedPcs:Number(r[8]||0),defectedPcs:Number(r[9]||0),availableStockPcs:Number(r[10]||0),weight:Number(r[11]||0),status:r[12]}));}
function getHomo_(){return rows_(ss_().getSheetByName('HOMO_Details')).map(r=>({batchNo:r[0],alloy:r[1],diameter:r[2],pcs:Number(r[3]||0),quantity:Number(r[4]||0),status:r[5],chargeNo:r[6],inTime:r[7]||'',outTime:r[8]||'',duration:r[9]||''}));}
function saveCustomer_(x){requireAdmin_(x);const c=x.customer||{},n=String(c.name||'').trim();if(!n)return {ok:false,error:'Customer name is required.'};const ss=ss_();let sh=ss.getSheetByName('Customers');if(!sh)sh=ss.insertSheet('Customers');if(sh.getLastRow()===0)sh.appendRow(['name','size','alloy','internalAlloyCode','billets','castWt','targetTime','readyDate','cutOff','etd','requirement']);const r=rows_(sh),i=r.findIndex(a=>String(a[0]).toLowerCase()===n.toLowerCase()),v=[n,c.size,c.alloy,c.internalAlloyCode,c.billets,Number(c.castWt||0),c.targetTime,c.readyDate,c.cutOff,c.etd,c.requirement];if(i<0)sh.appendRow(v);else sh.getRange(i+2,1,1,11).setValues([v]);return {ok:true};}
