/* Standalone test suite — run with: node tests/logic-tests.js
   Mirrors the in-page "Run self-tests" button. Same logic, no DOM. */

const norm = (s) => String(s).trim().toUpperCase();
const DIET_ACCEPTS = {
  VEGAN: ["VEGAN"],
  VEGETARIAN: ["VEGAN", "VEGETARIAN"],
  NO_RESTRICTION: ["VEGAN", "VEGETARIAN", "NON_VEGETARIAN"],
};
const BUILTIN_GROUP = [
  { name: "Asha", diet: "VEGAN", allergens: [] },
  { name: "Dev", diet: "VEGETARIAN", allergens: ["PEANUT"] },
  { name: "Mira", diet: "NO_RESTRICTION", allergens: ["MILK"] },
];
const BUILTIN_DISHES = [
  { id:"D01", cafe:"Hostel Cafe", name:"Lentil Rice Bowl", diet:"VEGAN", ingredients:["LENTIL","RICE","SPINACH"], price:110 },
  { id:"D02", cafe:"Library Cafe", name:"Tomato Pasta", diet:"VEGAN", ingredients:["WHEAT","TOMATO"], price:150 },
  { id:"D03", cafe:"Hostel Cafe", name:"Paneer Wrap", diet:"VEGETARIAN", ingredients:["MILK","WHEAT"], price:140 },
  { id:"D04", cafe:"East Cafe", name:"Peanut Noodles", diet:"VEGAN", ingredients:["PEANUT","WHEAT"], price:130 },
  { id:"D05", cafe:"Library Cafe", name:"Egg Sandwich", diet:"NON_VEGETARIAN", ingredients:["EGG","WHEAT"], price:100 },
];

function normalizeGroup(g){return g.map(r=>({name:String(r.name).trim(),diet:norm(r.diet),allergens:r.allergens.map(norm)}));}
function normalizeDishes(d){return d.map(x=>({id:String(x.id).trim(),cafe:String(x.cafe).trim(),name:String(x.name).trim(),diet:norm(x.diet),ingredients:x.ingredients.map(norm),price:x.price}));}
function validate(group,dishes,budget){
  const e=[];
  if(!(Number.isInteger(budget)&&budget>0))e.push(`INVALID_INPUT: group / budget`);
  group.forEach((r,i)=>{if(!String(r.name).trim())e.push(`INVALID_INPUT: group / row ${i+1} / name`);});
  const seen=new Set();
  dishes.forEach((d,i)=>{const row=i+1,id=String(d.id).trim();
    if(!id)e.push(`INVALID_INPUT: dishes / row ${row} / id`);
    if(!String(d.cafe).trim())e.push(`INVALID_INPUT: dishes / row ${row} / cafe`);
    if(!String(d.name).trim())e.push(`INVALID_INPUT: dishes / row ${row} / name`);
    if(!(Number.isInteger(d.price)&&d.price>0))e.push(`INVALID_INPUT: dishes / row ${row} / price`);
    if(id){if(seen.has(id))e.push(`DUPLICATE_DISH_ID: dishes / row ${row} / id — "${id}"`);else seen.add(id);}
  });
  return e;
}
function evaluateDish(dish,group,budget){
  const reasons=[];
  for(const r of group){
    const acc=DIET_ACCEPTS[r.diet]||[];
    if(!acc.includes(dish.diet))reasons.push(`DIET:${r.name}`);
    for(const ing of dish.ingredients)if(r.allergens.includes(ing))reasons.push(`ALLERGEN:${r.name}:${ing}`);
  }
  if(dish.price>budget)reasons.push("OVER_BUDGET");
  return {id:dish.id,compatible:reasons.length===0,reasons};
}
function evaluateAll(g,d,b){return d.map(x=>evaluateDish(x,g,b));}
function searchFilter(comp,q){q=q.trim().toLowerCase();if(!q)return comp;
  return comp.filter(r=>[r.dish.cafe,r.dish.name,...r.dish.ingredients].join(" ").toLowerCase().includes(q));}

let pass=0,fail=0;
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const t=(label,got,want)=>{const ok=eq(got,want);ok?pass++:fail++;
  console.log(`  ${ok?"PASS":"FAIL"}  ${label}`+(ok?"":`\n        got:  ${JSON.stringify(got)}\n        want: ${JSON.stringify(want)}`));};

const g=normalizeGroup(BUILTIN_GROUP), d=normalizeDishes(BUILTIN_DISHES);
const res=evaluateAll(g,d,150);
const withDish=res.map(r=>({...r,dish:d.find(x=>x.id===r.id)}));

console.log("── Built-in oracle ──");
t("compatible = [D01, D02]",res.filter(r=>r.compatible).map(r=>r.id),["D01","D02"]);
t("count = 2",res.filter(r=>r.compatible).length,2);
t("D03 reasons",res.find(r=>r.id==="D03").reasons,["DIET:Asha","ALLERGEN:Mira:MILK"]);
t("D04 reasons",res.find(r=>r.id==="D04").reasons,["ALLERGEN:Dev:PEANUT"]);
t("D05 reasons",res.find(r=>r.id==="D05").reasons,["DIET:Asha","DIET:Dev"]);

console.log("── Boundary ──");
t("D02 at exactly 150 compatible",res.find(r=>r.id==="D02").compatible,true);
const res130=evaluateAll(g,d,130);
t("D02 OVER_BUDGET at 130",res130.find(r=>r.id==="D02").reasons,["OVER_BUDGET"]);
t("compatible = [D01] at 130",res130.filter(r=>r.compatible).map(r=>r.id),["D01"]);

console.log("── Search decoupling ──");
const comp=withDish.filter(r=>r.compatible);
t("search 'wheat' -> [D02]",searchFilter(comp,"wheat").map(r=>r.id),["D02"]);
t("search 'hostel' -> [D01]",searchFilter(comp,"hostel").map(r=>r.id),["D01"]);
t("count unaffected by search (2)",comp.length,2);

console.log("── Validation ──");
t("zero price rejected",validate(g,[{...d[0],price:0}],150).length>0,true);
t("negative price rejected",validate(g,[{...d[0],price:-50}],150).length>0,true);
t("duplicate dish ID reported",validate(g,[d[0],{...d[1],id:"D01"}],150).some(e=>e.startsWith("DUPLICATE_DISH_ID")),true);
t("empty resident name rejected",validate([{name:"",diet:"VEGAN",allergens:[]}],d,150).length>0,true);
t("empty dish id rejected",validate(g,[{...d[0],id:""}],150).length>0,true);
t("empty dish name rejected",validate(g,[{...d[0],name:""}],150).length>0,true);
t("built-in data passes validation",validate(g,d,150),[]);

console.log("── Diet rules in isolation ──");
const mk=(diet)=>({id:"T",cafe:"c",name:"n",diet,ingredients:[],price:50});
t("VEGAN accepts VEGAN",evaluateDish(mk("VEGAN"),[{name:"X",diet:"VEGAN",allergens:[]}],150).compatible,true);
t("VEGAN rejects VEGETARIAN",evaluateDish(mk("VEGETARIAN"),[{name:"X",diet:"VEGAN",allergens:[]}],150).reasons,["DIET:X"]);
t("VEGETARIAN accepts VEGAN",evaluateDish(mk("VEGAN"),[{name:"X",diet:"VEGETARIAN",allergens:[]}],150).compatible,true);
t("VEGETARIAN accepts VEGETARIAN",evaluateDish(mk("VEGETARIAN"),[{name:"X",diet:"VEGETARIAN",allergens:[]}],150).compatible,true);
t("VEGETARIAN rejects NON_VEGETARIAN",evaluateDish(mk("NON_VEGETARIAN"),[{name:"X",diet:"VEGETARIAN",allergens:[]}],150).reasons,["DIET:X"]);
t("NO_RESTRICTION accepts NON_VEGETARIAN",evaluateDish(mk("NON_VEGETARIAN"),[{name:"X",diet:"NO_RESTRICTION",allergens:[]}],150).compatible,true);

console.log("── Edge case ──");
t("empty group -> trivially compatible",evaluateDish(d[4],[],150).compatible,true);

console.log(`\n${pass}/${pass+fail} passed`);
process.exit(fail?1:0);
