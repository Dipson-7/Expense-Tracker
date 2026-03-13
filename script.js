var BS_DATA={2078:[31,31,32,32,31,30,30,29,30,29,30,30],2079:[31,32,31,32,31,30,30,30,29,29,30,31],2080:[31,31,32,31,31,31,30,29,30,29,30,30],2081:[31,31,32,32,31,30,30,29,30,29,30,30],2082:[31,32,31,32,31,30,30,30,29,29,30,31],2083:[31,31,32,31,31,31,30,29,30,29,30,30],2084:[31,31,32,32,31,30,30,29,30,29,30,30],2085:[31,32,31,32,31,30,30,30,29,29,30,31],2086:[31,31,32,31,31,31,30,29,30,29,30,30],2087:[31,31,32,32,31,30,30,29,30,29,30,30],2088:[31,32,31,32,31,30,30,30,29,29,30,31],2089:[31,31,32,31,31,31,30,29,30,29,30,30],2090:[31,31,32,32,31,30,30,29,30,29,30,30],2091:[31,32,31,32,31,30,30,30,29,29,30,31],2092:[31,31,32,31,31,31,30,29,30,29,30,30],2093:[31,31,32,32,31,30,30,29,30,29,30,30],2094:[31,32,31,32,31,30,30,30,29,29,30,31],2095:[31,31,32,31,31,31,30,29,30,29,30,30],2096:[31,31,32,32,31,30,30,29,30,29,30,30],2097:[31,32,31,32,31,30,30,30,29,29,30,31],2098:[31,31,32,31,31,31,30,29,30,29,30,30],2099:[31,31,32,32,31,30,30,29,30,29,30,30],2100:[31,32,31,32,31,30,30,30,29,29,30,31]};
var BS_MONTHS=["Baisakh","Jestha","Ashadh","Shrawan","Bhadra","Ashwin","Kartik","Mangsir","Poush","Magh","Falgun","Chaitra"];

function jd(date){var y=date.getFullYear(),m=date.getMonth()+1,d=date.getDate();if(m<=2){y--;m+=12;}return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d-1524;}
var AJ=jd(new Date(2025,3,14));
function adToBs(date){var diff=jd(date)-AJ,y=2082,m=1,d=1;while(diff>0){var yd=BS_DATA[y];if(!yd)break;var md=yd[m-1];if(diff<md){d+=diff;diff=0;}else{diff-=md;m++;if(m>12){m=1;y++;}}}while(diff<0){d--;diff++;if(d<1){m--;if(m<1){m=12;y--;}d=(BS_DATA[y]||[])[m-1]||30;}}return{year:y,month:m,day:d};}
function nxt(y,m){return m===12?{year:y+1,month:1}:{year:y,month:m+1};}
function mKey(y,m){return y+"-"+String(m).padStart(2,"0");}
function cmp(ay,am,by,bm){if(ay!==by)return ay<by?-1:1;return am<bm?-1:am>bm?1:0;}

var tb=adToBs(new Date());
var CUR_Y=tb.year,CUR_M=tb.month,CUR_D=tb.day;

var transactions=JSON.parse(localStorage.getItem("dipson_tx")||"[]");
var frozenBalances=JSON.parse(localStorage.getItem("dipson_frozen")||"{}");
var viewY=CUR_Y,viewM=CUR_M;
var donutChart=null;

function save(){localStorage.setItem("dipson_tx",JSON.stringify(transactions));localStorage.setItem("dipson_frozen",JSON.stringify(frozenBalances));}

function freezeAndCarry(){
  var months={};
  transactions.forEach(function(t){months[mKey(t.bsYear,t.bsMonth)]=true;});
  Object.keys(months).forEach(function(key){
    var p=key.split("-"),ky=parseInt(p[0]),km=parseInt(p[1]);
    if(cmp(ky,km,CUR_Y,CUR_M)>=0)return;
    if(frozenBalances.hasOwnProperty(key))return;
    var closing=transactions.filter(function(t){return t.bsYear===ky&&t.bsMonth===km;}).reduce(function(s,t){return s+t.amount;},0);
    frozenBalances[key]=closing;
    if(closing!==0){
      var nx=nxt(ky,km),cfId="cf_"+nx.year+"_"+nx.month;
      if(!transactions.some(function(t){return t.id===cfId;})){
        transactions.push({id:cfId,description:"Balance Carried Forward ("+BS_MONTHS[km-1]+" "+ky+" BS)",amount:closing,bsYear:nx.year,bsMonth:nx.month,bsDay:1,isCarryForward:true});
      }
    }
  });

  
  save();
}

function getOpening(y,m){var cf=transactions.find(function(t){return t.id==="cf_"+y+"_"+m;});return cf?cf.amount:0;}

function fmt(n){return"NPR "+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0});}
function fmtSigned(n){return(n>=0?"":"-")+"NPR "+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0});}

function showToast(msg){var el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");setTimeout(function(){el.classList.remove("show");},2200);}

function renderDonut(income,expenses){
  var card=document.getElementById("chart-card");
  if(income===0&&expenses===0){card.style.display="none";if(donutChart){donutChart.destroy();donutChart=null;}return;}
  card.style.display="flex";
  var net=income-expenses;
  document.getElementById("donut-net").textContent=fmtSigned(net);
  if(donutChart){donutChart.destroy();donutChart=null;}
  var ctx=document.getElementById("donut-canvas").getContext("2d");
  var incV=income>0?income:0.0001,expV=expenses>0?expenses:0.0001;
  donutChart=new Chart(ctx,{
    type:"doughnut",
    data:{labels:["Income","Expenses"],datasets:[{data:[incV,expV],backgroundColor:["rgba(52,211,153,0.85)","rgba(248,113,113,0.85)"],borderColor:["#34d399","#f87171"],borderWidth:2,hoverBorderWidth:3,hoverOffset:6}]},
    options:{responsive:false,cutout:"70%",animation:{duration:600,easing:"easeOutQuart"},plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){var r=c.dataIndex===0?income:expenses;return" "+c.label+": NPR "+r.toLocaleString();}},backgroundColor:"#1e2d3d",titleColor:"#8fa3b8",bodyColor:"#e8edf2",borderColor:"rgba(255,255,255,0.07)",borderWidth:1,padding:10}}}
  });
}

function render(){
  freezeAndCarry();
  var isCurrent=(viewY===CUR_Y&&viewM===CUR_M);
  var isPast=cmp(viewY,viewM,CUR_Y,CUR_M)<0;
  var key=mKey(viewY,viewM);

  document.getElementById("nav-display").textContent=BS_MONTHS[viewM-1]+"  "+viewY+" BS";
  document.getElementById("month-badge").textContent=BS_MONTHS[viewM-1]+" "+viewY;
  document.getElementById("btn-next").disabled=isCurrent;
  document.getElementById("today-tag").textContent="📅 Today: "+CUR_D+" "+BS_MONTHS[CUR_M-1]+" "+CUR_Y+" BS";

  var hero=document.getElementById("balance-hero");
  var monthTx=transactions.filter(function(t){return t.bsYear===viewY&&t.bsMonth===viewM;});
  var opening=getOpening(viewY,viewM);
  var income=monthTx.filter(function(t){return t.amount>0&&!t.isCarryForward;}).reduce(function(s,t){return s+t.amount;},0);
  var expenses=monthTx.filter(function(t){return t.amount<0;}).reduce(function(s,t){return s+t.amount;},0);
  var closing=opening+income+expenses;
  var hasAnyTx=monthTx.filter(function(t){return !t.isCarryForward;}).length>0;

  var displayBal;
  if(isPast&&frozenBalances.hasOwnProperty(key)){displayBal=frozenBalances[key];hero.classList.add("frozen");document.getElementById("balance-lbl-txt").textContent="Final Balance";}
  else{displayBal=closing;hero.classList.remove("frozen");document.getElementById("balance-lbl-txt").textContent="Your Balance";}

  document.getElementById("balance-main").textContent=fmtSigned(displayBal);
  document.getElementById("s-income").textContent=fmt(income);
  document.getElementById("s-expense").textContent=fmt(Math.abs(expenses));
  document.getElementById("s-opening").textContent=fmtSigned(opening);
  document.getElementById("s-closing").textContent=fmtSigned(isPast&&frozenBalances.hasOwnProperty(key)?frozenBalances[key]:closing);

  var formCard=document.getElementById("form-card");
  var frozenPanel=document.getElementById("frozen-panel");

  if(isCurrent){
    formCard.style.display="flex";
    frozenPanel.style.display="none";
  } else if(isPast&&!hasAnyTx){
    formCard.style.display="none";
    frozenPanel.style.display="flex";
  } else {
    formCard.style.display="none";
    frozenPanel.style.display="none";
  }

  renderDonut(income,Math.abs(expenses));

  var list=document.getElementById("tx-list");
  list.innerHTML="";
  if(monthTx.length===0){list.innerHTML='<li class="no-tx-msg">No transactions this month</li>';return;}
  var carries=monthTx.filter(function(t){return t.isCarryForward;});
  var normals=monthTx.filter(function(t){return !t.isCarryForward;}).reverse();
  carries.concat(normals).forEach(function(t){
    var li=document.createElement("li");
    var pos=t.amount>0,canDel=isCurrent&&!t.isCarryForward;
    var dotCls=t.isCarryForward?"cf":pos?"pos":"neg";
    li.className="tx-row"+(t.isCarryForward?" carry-row":"");
    li.innerHTML='<div class="tx-dot '+dotCls+'"></div><div class="tx-info"><div class="tx-desc">'+(t.isCarryForward?"↩ ":"")+t.description+'</div><div class="tx-date">'+t.bsDay+" "+BS_MONTHS[t.bsMonth-1]+" "+t.bsYear+" BS"+'</div></div><div class="tx-amt '+(pos?"pos":"neg")+'">'+(pos?"+":"")+fmtSigned(t.amount)+'</div>'+(canDel?'<button class="tx-del" onclick="delTx('+JSON.stringify(t.id)+')">✕</button>':"");
    list.appendChild(li);
  });
}

document.getElementById("btn-add").addEventListener("click",function(){
  var desc=document.getElementById("inp-desc").value.trim();
  var amt=parseFloat(document.getElementById("inp-amt").value);
  if(!desc){showToast("Enter a description first");return;}
  if(isNaN(amt)||!amt){showToast("Enter a valid amount");return;}
  transactions.push({id:Date.now(),description:desc,amount:amt,bsYear:CUR_Y,bsMonth:CUR_M,bsDay:CUR_D,isCarryForward:false});
  save();
  document.getElementById("inp-desc").value="";
  document.getElementById("inp-amt").value="";
  render();showToast("Added ✓");
});

function delTx(id){var n=Number(id);transactions=transactions.filter(function(t){return t.id!==id&&t.id!==n;});save();render();showToast("Removed");}

document.getElementById("btn-prev").addEventListener("click",function(){viewM--;if(viewM<1){viewM=12;viewY--;}render();});
document.getElementById("btn-next").addEventListener("click",function(){if(viewY===CUR_Y&&viewM===CUR_M)return;viewM++;if(viewM>12){viewM=1;viewY++;}render();});

var s=document.createElement("script");
s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
s.onload=function(){render();};
document.head.appendChild(s);
