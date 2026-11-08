// Deterministic drafting. Every dimension names its source measurement and rule.
// Rules are DRAFT until a master tailor signs them off (set approved:true).
(function(){
const R=(n)=>Math.round(n*8)/8; // nearest 1/8 inch
const RULES={
 standard:{approved:false,name:"Standard fitted blouse (darts)",ease:{bust:2,waist:1},sa:{seam:0.5,hem:1,neck:0.375}}
};
function validate(m){const f=[];const need=["bust","waist","shoulder","blouseLength","frontNeck","backNeck","armhole","sleeveLength","sleeveRound"];
 need.forEach(k=>{if(!m[k])f.push({lvl:"b",msg:`Missing: ${k}`})});
 if(m.bust&&m.waist&&m.waist>m.bust+2)f.push({lvl:"w",msg:"Waist is larger than bust – recheck both."});
 if(m.bust&&m.underBust&&m.underBust>=m.bust)f.push({lvl:"b",msg:"Under bust must be smaller than full bust."});
 if(m.shoulder&&(m.shoulder<10||m.shoulder>20))f.push({lvl:"w",msg:"Shoulder width outside 10–20 in – recheck (inches assumed)."});
 if(m.armhole&&m.bust&&m.armhole>m.bust/4+1)f.push({lvl:"w",msg:"Armhole depth looks large for this bust."});
 if(m.sleeveRound&&m.sleeveRound<8)f.push({lvl:"w",msg:"Sleeve round under 8 in – recheck."});
 return f}
function draft(m,design){const r=RULES.standard,P=[];
 const add=(piece,qty,rows)=>P.push({piece,qty,rows});
 const fw=R(m.bust/4+r.ease.bust/4+r.sa.seam*0), bw=fw;
 add("Front bodice",2,[
  ["Width at bust",fw,`Full bust ${m.bust} ÷ 4 + ease ${r.ease.bust}÷4`,"bust"],
  ["Length",R(m.blouseLength),"Blouse length (finished) – add hem allowance below","blouseLength"],
  ["Armhole depth",R(m.armhole),"Measured armhole depth","armhole"],
  ["Shoulder length",R(m.shoulder/2),"Shoulder width ÷ 2","shoulder"],
  ["Neck depth",R(m.frontNeck),"Front neck depth","frontNeck"],
  ["Seam allowance",r.sa.seam,"Rule: side/shoulder 1/2 in (not ease)",""],
  ["Hem allowance",r.sa.hem,"Rule: hem 1 in",""]]);
 add("Back bodice",2,[
  ["Width at bust",bw,"Same rule as front","bust"],
  ["Length",R(m.blouseLength),"Blouse length","blouseLength"],
  ["Neck depth",R(m.backNeck),"Back neck depth","backNeck"]]);
 if(!/sleeveless/i.test(design.sleeve||""))add("Sleeve",2,[
  ["Length",R(m.sleeveLength),"Sleeve length","sleeveLength"],
  ["Width at top",R(m.sleeveRound/2+1),"Sleeve round ÷ 2 + 1 in ease","sleeveRound"]]);
 const complex=/princess|katori|bridal|halter|backless|padded/i.test(JSON.stringify(design));
 return {rules:r.name,approved:r.approved,version:"draft-1",pieces:P,
  warnings:[!r.approved&&"DRAFT rules – master tailor review required before cutting.",
   complex&&"Complex design: make a trial (muslin) blouse first. Princess/katori/padded panels are not covered by these rules yet.",
   "Measurements and photos cannot guarantee fit; confirm at trial fitting."].filter(Boolean)}}
window.Engine={validate,draft};
})();
