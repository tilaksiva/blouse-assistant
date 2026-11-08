/** Apps Script backend. Set SPREADSHEET_ID in Project Settings > Script properties. */
const SHEETS={Customers:["CustomerID","Name","Phone","Created","Updated"],Orders:["OrderID","CustomerID","Date","Delivery","Count","Occasion","Tailor","Notes","Pct","Created","Updated"],Measurements:["MeasID","CustomerID","OrderID","JSON","Created","Updated"],"Design Configurations":["ConfigID","OrderID","JSON","Created","Updated"],"Fabric Details":["FabricID","OrderID","JSON","Created","Updated"],"Pattern Instructions":["PatternID","OrderID","RulesVersion","Approved","JSON","Created","Updated"],"Progress Tracking":["ProgressID","OrderID","Stages","Pct","Created","Updated"],"Image References":["ImageID","OrderID","Label","DriveUrl","Created","Updated"],"Stitching Instructions":["StepsID","OrderID","Model","RulesVersion","JSON","Created","Updated"],"Application Settings":["Key","Value"]};
function ss_(){return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID"))}
function setup(){const ss=ss_();Object.keys(SHEETS).forEach(n=>{const s=ss.getSheetByName(n)||ss.insertSheet(n);if(s.getLastRow()==0)s.appendRow(SHEETS[n])})}
function doPost(e){try{const {action,data,token}=JSON.parse(e.postData.contents);const need=PropertiesService.getScriptProperties().getProperty("APP_TOKEN");if(need&&token!==need)throw new Error("Unauthorized");const h={saveOrder,getOrders,searchCustomer,analyzeDesign,stitchingSteps}[action];if(!h)throw new Error("Unknown action");return out_({ok:true,data:h(data)})}catch(err){return out_({ok:false,error:String(err)})}}
function doGet(){return out_({ok:true,data:"Blouse backend is running"})}
function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function upsert_(name,idCol,id,row){const s=ss_().getSheetByName(name),v=s.getDataRange().getValues();const i=v.findIndex((r,k)=>k>0&&r[idCol]==id),now=new Date();
 if(i>0){row[row.length-1]=now;row[row.length-2]=v[i][row.length-2];s.getRange(i+1,1,1,row.length).setValues([row])}else s.appendRow(row)}
function saveOrder(r){if(!r||!r.id||!r.order||!r.order.name)throw new Error("Order ID and customer name required");
 const lock=LockService.getScriptLock();lock.waitLock(10000);try{const n=new Date(),o=r.order,cid="CUS-"+String(o.phone||o.name).replace(/\W/g,"").slice(-10).toUpperCase();
 upsert_("Customers",0,cid,[cid,o.name,o.phone,n,n]);
 upsert_("Orders",0,r.id,[r.id,cid,o.date,o.delivery,o.count,o.occasion,o.tailor,o.notes,r.pct,n,n]);
 upsert_("Measurements",2,r.id,["MEAS-"+r.id,cid,r.id,JSON.stringify(r.m),n,n]);
 upsert_("Design Configurations",1,r.id,["CFG-"+r.id,r.id,JSON.stringify(r.design),n,n]);
 upsert_("Fabric Details",1,r.id,["FAB-"+r.id,r.id,JSON.stringify(r.fabric),n,n]);
 if(r.pattern)upsert_("Pattern Instructions",1,r.id,["PAT-"+r.id,r.id,r.rulesVersion,r.pattern.approved,JSON.stringify(r.pattern),n,n]);
 upsert_("Progress Tracking",1,r.id,["PRG-"+r.id,r.id,JSON.stringify(r.stages),r.pct,n,n]);
 if(r.steps&&!r.steps.generic)upsert_("Stitching Instructions",1,r.id,["STP-"+r.id,r.id,r.steps.model||"",r.rulesVersion,JSON.stringify(r.steps),n,n]);
 ((r.design&&r.design.imageUrls)||[]).forEach((u,i)=>upsert_("Image References",0,"IMG-"+r.id+"-"+i,["IMG-"+r.id+"-"+i,r.id,(r.imgs||[])[i]||"",u,n,n]));
 return {orderId:r.id,customerId:cid}}finally{lock.releaseLock()}}
function getOrders(){const v=ss_().getSheetByName("Orders").getDataRange().getValues();return v.slice(1).map(r=>Object.fromEntries(v[0].map((h,i)=>[h,r[i]])))}
function searchCustomer(q){q=String(q).toLowerCase();return ss_().getSheetByName("Customers").getDataRange().getValues().slice(1).filter(r=>r.join(" ").toLowerCase().includes(q))}

/* ---------- AI (Phase 2). Provider is isolated in callAI_; swap it to change vendors. ---------- */
const AI_RULES="You assist a tailor with Indian women's blouses. Never invent details you cannot see; mark them determinable:false. Never give cutting dimensions or guarantee fit; the app's deterministic engine does that. Reply with JSON only.";
function callAI_(content,maxTokens){const p=PropertiesService.getScriptProperties(),key=p.getProperty("AI_API_KEY");if(!key)throw new Error("AI_API_KEY not set in Script properties");const model=p.getProperty("AI_MODEL")||"meta-llama/llama-4-scout-17b-16e-instruct";
 const res=UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions",{method:"post",contentType:"application/json",headers:{Authorization:"Bearer "+key},payload:JSON.stringify({model:model,max_tokens:maxTokens,temperature:0.2,response_format:{type:"json_object"},messages:[{role:"system",content:AI_RULES},{role:"user",content:content}]}),muteHttpExceptions:true});
 const j=JSON.parse(res.getContentText());if(j.error)throw new Error(j.error.message);return {model:model,json:JSON.parse(j.choices[0].message.content)}}
function saveImage_(b64,name){const it=DriveApp.getFoldersByName("BlouseImages"),f=it.hasNext()?it.next():DriveApp.createFolder("BlouseImages");return f.createFile(Utilities.newBlob(Utilities.base64Decode(b64),"image/jpeg",name)).getUrl()}
function analyzeDesign(d){if(!d.images||!d.images.length||d.images.length>3)throw new Error("Send 1 to 3 images");
 const parts=[];d.images.forEach(function(im){parts.push({type:"text",text:"Photo label: "+im.label});parts.push({type:"image_url",image_url:{url:"data:image/jpeg;base64,"+im.b64}})});
 parts.push({type:"text",text:"Selected design so far: "+JSON.stringify(d.design)+'\nAnalyse the blouse. Return {"features":[{"feature","value","confidence":"high|medium|low","determinable":bool,"needs":"what is needed if not visible"}],"questions":[{"q","why","options":[optional]}]}. Cover front/back neckline, shoulder, sleeve type/length/opening, bust construction, darts/princess seams, waist shaping, length, back opening, closures, padding, lining, decoration. Ask only questions that arise from THIS design; ask for a back photo if no back view.'});
 const r=callAI_(parts,2000),urls=d.images.map(function(im,i){return saveImage_(im.b64,"ref-"+Date.now()+"-"+i+".jpg")});
 r.json.features=(r.json.features||[]).slice(0,30);r.json.questions=(r.json.questions||[]).slice(0,10);r.json.model=r.model;r.json.imageUrls=urls;return r.json}
function stitchingSteps(d){const txt="Tailor level: "+d.level+'\nDesign: '+JSON.stringify(d.design)+"\nAI analysis (tailor-corrected): "+JSON.stringify(d.analysis)+"\nTailor answers: "+JSON.stringify(d.answers)+"\nFabric: "+JSON.stringify(d.fabric)+"\nDraft pattern pieces: "+JSON.stringify((d.pattern||{}).pieces||[]).slice(0,3000)+'\nWrite sequential stitching steps fitted to THIS construction. Return {"steps":[{"n","title","detail":"beginner explanation","seamAllowance","precaution","check"}],"fabricNotes":["lining, handling, nap, shrinkage advice for this fabric"]}. Do not state new cutting measurements.';
 const r=callAI_(txt,3000);r.json.model=r.model;return r.json}
