const $=(s)=>document.querySelector(s),KEY="blouse_db",steps=["Order","Design","Measure","Fabric","Pattern","Progress"];
const DESIGNS=["Traditional","Madhubala","Princess-cut","Katori","Padded","Boat-neck","Sweetheart-neck","High-neck","Collar-neck","Deep-back","Backless","Puff-sleeve","Bridal","U-neck","V-neck","Square-neck","Halter-neck","Keyhole-back","Tie-back","Custom designer"];
const STAGES=["Order received","Design selected","Reference analysed","Measurements completed","Fabric confirmed","Pattern drafted","Cutting completed","Main stitching","Neckline","Sleeves","Trial fitting","Alterations","Finishing","Quality inspection","Delivered"];
const FIELDS=[["bust","Full bust","Around fullest part, tape level"],["underBust","Under bust","Around ribcage just below bust"],["waist","Waist","Narrowest part"],["shoulder","Shoulder width","Shoulder point to shoulder point, across back"],["frontNeck","Front neck depth","Base of neck down to neckline"],["backNeck","Back neck depth","Base of neck down to back neckline"],["armhole","Armhole depth","Underarm to shoulder top"],["blouseLength","Blouse length","Shoulder top to desired hem"],["sleeveLength","Sleeve length","Shoulder point to desired sleeve end"],["sleeveRound","Sleeve round","Around the fullest upper arm"]];
let S={step:0,order:{},design:{base:"",elements:{}},m:{},fabric:{},remote:!!CONFIG.BACKEND_URL},db=JSON.parse(localStorage.getItem(KEY)||'{"orders":[]}');
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
async function api(action,data){if(!CONFIG.BACKEND_URL){return{ok:true,local:true}}
 const r=await fetch(CONFIG.BACKEND_URL,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action,data})});return r.json()}
function nav(){$("#nav").innerHTML=steps.map((s,i)=>`<button class="${i==S.step?"on":""}" onclick="go(${i})">${s}</button>`).join("")}
function go(i){collect();S.step=i;render()}
function collect(){document.querySelectorAll("[data-o]").forEach(e=>S.order[e.dataset.o]=e.value);
 document.querySelectorAll("[data-m]").forEach(e=>{if(e.value!=="")S.m[e.dataset.m]=+e.value});
 document.querySelectorAll("[data-f]").forEach(e=>S.fabric[e.dataset.f]=e.value)}
function render(){nav();[vOrder,vDesign,vMeasure,vFabric,vPattern,vProgress][S.step]();window.scrollTo(0,0)}
const inp=(k,l,t="text",v="")=>`<label>${l}<input type="${t}" data-o="${k}" value="${S.order[k]||v}"></label>`;
const next=()=>`<button class="go" onclick="go(S.step+1)">Save and continue</button>`;
function vOrder(){const o=S.order;$("#view").innerHTML=`<div class="card"><h2>Customer and order</h2><div class="row">${inp("name","Customer name")}${inp("phone","Contact number","tel")}${inp("date","Order date","date",new Date().toISOString().slice(0,10))}${inp("delivery","Expected delivery","date")}${inp("count","Number of blouses","number",1)}${inp("tailor","Tailor assigned")}</div>
<label>Occasion<select data-o="occasion">${["Daily wear","Wedding","Party","Festive","Bridal"].map(x=>`<option ${o.occasion==x?"selected":""}>${x}</option>`).join("")}</select></label>${inp("notes","Notes")}
<label>Find returning customer<input id="q" placeholder="Name or number" oninput="find(this.value)"></label><div id="found"></div>${next()}</div>`}
function find(q){q=q.toLowerCase();const hits=q.length<2?[]:db.orders.filter(o=>(o.order.name||"").toLowerCase().includes(q)||(o.order.phone||"").includes(q));
 $("#found").innerHTML=hits.map((h,i)=>`<div class="flag i">${h.order.name} · ${h.order.phone} <button class="alt" onclick="reuse('${h.id}')">Reuse details</button></div>`).join("")}
function reuse(id){const h=db.orders.find(o=>o.id==id);S.order={...S.order,name:h.order.name,phone:h.order.phone};S.m={...h.m};S.reused=true;render()}
function vDesign(){const d=S.design,el=[["Neckline",["Round","U-neck","Deep U","V-neck","Sweetheart","Square","Boat","High","Collar"]],["Sleeves",["Sleeveless","Cap","Short","Elbow","Three-quarter","Full","Puff","Bell"]],["Back",["Round","Deep U","Deep V","Square","Keyhole","Dori","Tie-back","Button-back"]],["Bust",["Darts","Princess cut","Katori","Panel","Padded","Non-padded"]],["Closure",["Hooks","Zip","Buttons"]]];
 $("#view").innerHTML=`<div class="card"><h2>Choose a base design</h2><p>Designs combine. Pick a base, then adjust the parts below.</p><div class="chips">${DESIGNS.map(x=>`<div class="chip ${d.base==x?"on":""}" onclick="S.design.base='${x}';render()">${x}</div>`).join("")}</div></div>
${el.map(([k,v])=>`<div class="card"><h3>${k}</h3><div class="chips">${v.map(x=>`<div class="chip ${d.elements[k]==x?"on":""}" onclick="S.design.elements['${k}']='${x}';render()">${x}</div>`).join("")}</div></div>`).join("")}
<div class="card"><label>Reference photo<input type="file" accept="image/*" disabled></label><div class="flag w">AI image analysis arrives in Phase 2. Until then, choose features by hand.</div></div>${next()}`}
function vMeasure(){const warn=Engine.validate(S.m);
 $("#view").innerHTML=`<div class="card"><h2>Measurements (inches)</h2>${S.reused?'<div class="flag w">Previous measurements loaded. Confirm each is still correct before cutting.</div>':""}${FIELDS.map(([k,l,h])=>`<label>${l}${S.mode=="pro"?"":`<small style="font-weight:400;display:block">${h}</small>`}<input type="number" step="0.125" data-m="${k}" value="${S.m[k]??""}"></label>`).join("")}
<button class="go alt" onclick="collect();vMeasure()">Check measurements</button><div>${warn.map(w=>`<div class="flag ${w.lvl}">${w.msg}</div>`).join("")||'<div class="flag i">No problems found.</div>'}</div>${next()}</div>`}
function vFabric(){const f=S.fabric;$("#view").innerHTML=`<div class="card"><h2>Fabric</h2><label>Type<select data-f="type">${["Silk","Cotton","Cotton silk","Raw silk","Banarasi silk","Velvet","Satin","Georgette","Chiffon","Crepe","Net","Brocade","Linen","Stretch"].map(x=>`<option ${f.type==x?"selected":""}>${x}</option>`).join("")}</select></label>
<div class="row"><label>Width (in)<input type="number" data-f="width" value="${f.width||44}"></label><label>Length available (in)<input type="number" data-f="len" value="${f.len||40}"></label></div>
<div class="flag w">${tip(f.type)}</div>${est()}${next()}</div>`}
const tip=t=>({Velvet:"Velvet: check nap direction. Cut all pieces in the same direction.",Georgette:"Georgette: stabilise edges and use a lining.",Cotton:"Cotton: pre-wash to remove shrinkage before cutting.",Silk:"Silk: use a lining and a fine needle; leave wider seam allowance.",Stretch:"Stretch: ease depends on construction; test on scrap."}[t]||"Confirm fabric behaviour on a scrap before cutting.");
function est(){const m=S.m;if(!m.blouseLength||!m.sleeveLength)return"";const n=(m.blouseLength+3)+(m.sleeveLength+2);return`<p>Rough estimate: about ${Math.ceil(n)} in of main fabric at 44 in width. This is not exact until you plan the cutting layout.</p>`}
function vPattern(){collect();const f=Engine.validate(S.m).filter(x=>x.lvl=="b");
 if(f.length){$("#view").innerHTML=`<div class="card"><h2>Pattern</h2>${f.map(w=>`<div class="flag b">${w.msg}</div>`).join("")}<button class="go" onclick="go(2)">Back to measurements</button></div>`;return}
 const p=Engine.draft(S.m,{...S.design.elements,base:S.design.base,sleeve:S.design.elements.Sleeves});S.pattern=p;
 $("#view").innerHTML=`<div class="card"><h2>Pattern: ${p.rules}</h2>${p.warnings.map(w=>`<div class="flag w">${w}</div>`).join("")}
${p.pieces.map(x=>`<h3>${x.piece} × ${x.qty}</h3><table><tr><th>Item</th><th>in</th><th>Rule and source</th></tr>${x.rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</table>`).join("")}
<h3>Cutting steps</h3><ol><li>Press fabric and confirm the grain.</li><li>Fold selvedge to selvedge for front and back.</li><li>Mark each piece using the table; add seam allowance shown.</li><li>Mark shoulder slope, neckline and armhole curves.</li><li>Add notches, then have the draft reviewed before cutting.</li></ol>
<label><input type="checkbox" id="rev" style="width:auto"> Reviewed by tailor. OK to cut.</label>${next()}</div>`}
async function vProgress(){const done=S.stages||(S.stages=[0,1]);const pct=Math.round(done.length/STAGES.length*100);
 $("#view").innerHTML=`<div class="card"><h2>${S.order.name||"Order"} · ${pct}% done</h2><div class="bar"><i style="width:${pct}%"></i></div><div class="chips" style="margin-top:12px">${STAGES.map((s,i)=>`<div class="chip ${done.includes(i)?"on":""}" onclick="tog(${i})">${s}</div>`).join("")}</div>
<button class="go" onclick="saveOrder()">Save order</button> <span id="msg"></span></div><div class="card"><h3>Saved orders</h3>${db.orders.map(o=>`<div>${o.id} · ${o.order.name} · ${o.pct}%</div>`).join("")||"No orders yet."}</div>`}
function tog(i){const d=S.stages;d.includes(i)?d.splice(d.indexOf(i),1):d.push(i);vProgress()}
async function saveOrder(){collect();const id=S.id||"ORD-"+Date.now().toString(36).toUpperCase();S.id=id;const rec={id,order:S.order,design:S.design,m:S.m,fabric:S.fabric,pattern:S.pattern||null,stages:S.stages,pct:Math.round(S.stages.length/STAGES.length*100),updated:new Date().toISOString(),rulesVersion:CONFIG.RULES_VERSION};
 db.orders=db.orders.filter(o=>o.id!=id).concat(rec);save();try{const r=await api("saveOrder",rec);$("#msg").textContent=r.ok?(r.local?"Saved in this browser (demo mode).":"Saved to Google Sheets."):"Backend error: "+r.error}catch(e){$("#msg").textContent="Saved locally; backend unreachable."}}
$("#mode").onchange=e=>{S.mode=e.target.value;render()};render();
