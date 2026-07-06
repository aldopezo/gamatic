import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, set, push, remove } from "firebase/database";

const CLAVES = { admin:"123", abastecedor:"", almacenero:"" };

const SEED={
  productos:{
    p1:{id:"p1",nombre:"Coca Cola 500ml",costo:2.5,margen:40,precioVenta:3.50,precioEco:2.80,proveedor:"Coca-Cola SAC",fecha:"2026-01-01"},
    p2:{id:"p2",nombre:"Agua San Luis 600ml",costo:1.2,margen:50,precioVenta:1.80,precioEco:1.50,proveedor:"Backus",fecha:"2026-01-01"},
    p3:{id:"p3",nombre:"Snickers",costo:1.8,margen:45,precioVenta:2.60,precioEco:2.20,proveedor:"Mars Inc.",fecha:"2026-01-01"},
  },
  proveedores:{
    v1:{id:"v1",nombre:"Coca-Cola SAC",contacto:"Juan Pérez",telefono:"999-111-222"},
    v2:{id:"v2",nombre:"Backus",contacto:"Ana López",telefono:"999-333-444"},
    v3:{id:"v3",nombre:"Mars Inc.",contacto:"Carlos Ruiz",telefono:"999-555-666"},
  },
  maquinas:{
    m1:{id:"m1",nombre:"Máquina A1",ubicacion:"Mall del Sur - Piso 1",alquiler:450,activa:true},
    m2:{id:"m2",nombre:"Máquina B2",ubicacion:"Real Plaza - Entrada",alquiler:380,activa:true},
    m3:{id:"m3",nombre:"Máquina C3",ubicacion:"Aeropuerto - Sala de espera",alquiler:620,activa:true},
  },
  stock:{
    s1:{id:"s1",productoId:"p1",cantidad:48,minimo:10},
    s2:{id:"s2",productoId:"p2",cantidad:60,minimo:15},
    s3:{id:"s3",productoId:"p3",cantidad:35,minimo:8},
  },
  traslados:{},ventas:{},cobranzas:{},gastos:{},sugerencias:{},devoluciones:{},stockMaquina:{},sencillo:{},tickets:{},productosEco:{},personal:{},
  horario:{lunes:{maquinas:[]},martes:{maquinas:[]},miercoles:{maquinas:[]},jueves:{maquinas:[]},viernes:{maquinas:[]},sabado:{maquinas:[]},domingo:{maquinas:[]}},
};

const fmt=(n)=>`S/ ${Number(n||0).toFixed(2)}`;
const today=()=>new Date().toISOString().split("T")[0];
const objToArr=(o)=>o?Object.values(o):[];
const uid=()=>push(ref(db,"_tmp")).key;
const mesActual=()=>new Date().toISOString().slice(0,7);
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const nombreMes=(ym)=>{if(!ym)return"";const[y,m]=ym.split("-");return`${MESES[parseInt(m)-1]} ${y}`;};
const mesDesFecha=(f)=>f?f.slice(0,7):"";

const Icon=({name,size=18})=>{
  const paths={
    machine:"M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 4v6m-3-3h6",
    product:"M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-10 5H6m4 0h4",
    supplier:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    stock:"M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4",
    transfer:"M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    money:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    chart:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    logout:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    plus:"M12 4v16m8-8H4",
    trash:"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    location:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    trend:"M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    alert:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    spin:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
    edit:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    calendar:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    tag:"M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    menu:"M4 6h16M4 12h16M4 18h16",
    close:"M6 18L18 6M6 6l12 12",
    chevL:"M15 19l-7-7 7-7",
    chevR:"M9 5l7 7-7 7",
    bolt:"M13 10V3L4 14h7v7l9-11h-7z",
    lock:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    filter:"M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z",
    suggest:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    return2:"M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 2 2 2-2 2 2 2-2 4 2z",
    pricetag:"M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
    layers:"M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    coin:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    personal:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    wrench:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    trophy:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    kit:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
};

const Logo=()=>(
  <div style={{display:"flex",alignItems:"center",gap:8}}>
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
      <rect x="10" y="5" width="58" height="78" rx="6" stroke="#f59e0b" strokeWidth="5" fill="none"/>
      <rect x="18" y="14" width="18" height="16" rx="2" fill="#f59e0b"/>
      <rect x="42" y="14" width="18" height="16" rx="2" fill="#f59e0b"/>
      <rect x="18" y="35" width="18" height="16" rx="2" fill="#f59e0b"/>
      <rect x="42" y="35" width="18" height="16" rx="2" fill="#f59e0b"/>
      <rect x="18" y="56" width="42" height="7" rx="2" fill="#f59e0b"/>
      <rect x="18" y="67" width="42" height="12" rx="2" fill="#f59e0b" opacity="0.4"/>
      <circle cx="39" cy="93" r="5" fill="#f59e0b"/>
      <path d="M20 93 Q39 100 58 93" stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round"/>
    </svg>
    <span style={{fontWeight:900,fontSize:20,color:"#f59e0b",letterSpacing:2,fontFamily:"Arial Black,sans-serif",whiteSpace:"nowrap"}}>GAMATIC</span>
  </div>
);

const css=`
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root{--bg:#f8fafc;--surface:#ffffff;--surface2:#f1f5f9;--border:#e2e8f0;--accent:#f59e0b;--accent2:#3b82f6;--green:#10b981;--red:#ef4444;--text:#0f172a;--muted:#64748b;--radius:12px;}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
  h1,h2,h3,h4{font-family:'Syne',sans-serif}
  .app{display:flex;min-height:100vh;position:relative}
  .sidebar{width:240px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;z-index:50}
  .sidebar-logo{padding:18px 16px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;min-height:64px}
  .sidebar-role{margin:10px 12px;background:var(--surface2);border-radius:8px;padding:7px 11px;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px}
  .sidebar-role span{color:var(--accent);font-weight:600}
  .nav{flex:1;padding:6px 0;overflow-y:auto}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 18px;cursor:pointer;color:var(--muted);font-size:13px;font-weight:500;transition:all .15s;border-left:3px solid transparent;white-space:nowrap;overflow:hidden}
  .nav-item:hover{color:var(--text);background:var(--surface2)}
  .nav-item.active{color:var(--accent);background:rgba(245,158,11,.08);border-left-color:var(--accent)}
  .nav-section{padding:12px 18px 4px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600}
  .logout-btn{padding:14px 18px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer;color:var(--muted);font-size:13px;transition:color .15s}
  .logout-btn:hover{color:var(--red)}
  .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:49}
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
  .topbar{padding:0 16px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;height:56px;gap:10px}
  .topbar h1{font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .topbar-date{font-size:11px;color:var(--muted);white-space:nowrap;display:none}
  .hamburger{background:none;border:none;color:var(--muted);cursor:pointer;padding:6px;border-radius:8px;flex-shrink:0}
  .content{flex:1;padding:16px;overflow-y:auto}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:11px;margin-bottom:16px}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px}
  .card-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
  .card-value{font-size:20px;font-family:'Syne',sans-serif;font-weight:700}
  .card-value.green{color:var(--green)}.card-value.amber{color:var(--accent)}.card-value.blue{color:var(--accent2)}.card-value.red{color:var(--red)}
  .card-sub{font-size:11px;color:var(--muted);margin-top:3px}
  .section{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:16px;overflow:hidden}
  .section-header{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:8px}
  .section-header h3{font-size:13px;font-weight:700}
  .table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
  table{width:100%;border-collapse:collapse;font-size:12px;min-width:460px}
  th{text-align:left;padding:8px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);background:var(--surface2);border-bottom:1px solid var(--border)}
  td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text)}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:rgba(255,255,255,.02)}
  .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600}
  .badge.green{background:rgba(16,185,129,.15);color:var(--green)}
  .badge.red{background:rgba(239,68,68,.15);color:var(--red)}
  .badge.amber{background:rgba(245,158,11,.15);color:var(--accent)}
  .badge.blue{background:rgba(59,130,246,.15);color:var(--accent2)}
  .btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;transition:all .15s}
  .btn-primary{background:var(--accent);color:#000}.btn-primary:hover{background:#d97706}
  .btn-secondary{background:var(--surface2);color:var(--text);border:1px solid var(--border)}.btn-secondary:hover{background:var(--border)}
  .btn-danger{background:rgba(239,68,68,.15);color:var(--red)}.btn-danger:hover{background:rgba(239,68,68,.28)}
  .btn-sm{padding:3px 9px;font-size:11px}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;z-index:100;backdrop-filter:blur(4px)}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:16px 16px 0 0;padding:22px 20px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto}
  .modal h3{font-size:16px;font-weight:700;margin-bottom:16px}
  .form-group{margin-bottom:12px}
  .form-group label{display:block;font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em}
  .form-group input,.form-group select{width:100%;padding:9px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s}
  .form-group input:focus,.form-group select:focus{border-color:var(--accent)}
  .form-group select option{background:var(--surface2)}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .modal-actions{display:flex;gap:9px;justify-content:flex-end;margin-top:16px}
  .prod-row{display:grid;grid-template-columns:1fr 80px 32px;gap:7px;align-items:center;margin-bottom:7px}
  .prod-row select,.prod-row input{padding:8px 9px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:12px;font-family:'DM Sans',sans-serif;outline:none;width:100%}
  .prod-row select:focus,.prod-row input:focus{border-color:var(--accent)}
  .add-prod-btn{background:rgba(245,158,11,.12);border:1px dashed var(--accent);border-radius:8px;padding:7px;color:var(--accent);cursor:pointer;font-size:12px;font-weight:600;width:100%;display:flex;align-items:center;justify-content:center;gap:5px}
  /* LOGIN mejorado */
  .login-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:20px}
  .login-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px 28px;width:100%;max-width:480px}
  .login-logo{text-align:center;margin-bottom:24px}
  .login-logo p{color:var(--muted);font-size:13px;margin-top:8px}
  .role-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
  .role-card{padding:18px 12px;border:2px solid var(--border);border-radius:14px;cursor:pointer;text-align:center;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:6px}
  .role-card:hover{border-color:var(--accent);background:rgba(245,158,11,.04)}
  .role-card.selected{border-color:var(--accent);background:rgba(245,158,11,.1)}
  .role-card .role-icon{font-size:28px;line-height:1}
  .role-card h4{font-size:13px;font-weight:700;color:var(--text);white-space:nowrap}
  .role-card p{font-size:10px;color:var(--muted);line-height:1.3}
  @media(max-width:500px){
    .role-grid{grid-template-columns:1fr;gap:10px}
    .role-card{flex-direction:row;padding:14px 18px;text-align:left;gap:16px;align-items:center}
    .role-card .role-icon{font-size:34px;flex-shrink:0}
    .role-card h4{font-size:15px;margin-bottom:2px}
    .role-card p{font-size:12px}
    .login-card{padding:28px 20px}
  }
  .mes-nav{display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:6px 12px;margin-bottom:16px}
  .mes-nav span{font-weight:700;font-size:13px;flex:1;text-align:center}
  .mes-nav button{background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;border-radius:6px;display:flex}
  .mes-nav button:hover{background:var(--border);color:var(--text)}
  .filtro-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px;padding:10px 14px;background:var(--surface2);border-radius:10px;border:1px solid var(--border)}
  .filtro-bar select,.filtro-bar input{padding:6px 10px;background:var(--surface);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:12px;font-family:'DM Sans',sans-serif;outline:none}
  .filtro-bar select:focus,.filtro-bar input:focus{border-color:var(--accent)}
  .filtro-label{font-size:11px;color:var(--muted);font-weight:600;display:flex;align-items:center;gap:4px}
  .profit-card{border-radius:var(--radius);padding:16px;margin-bottom:12px}
  .profit-positive{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3)}
  .profit-negative{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3)}
  .profit-neutral{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3)}
  .alert-box{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:8px;color:var(--red);font-size:12px;margin-bottom:12px}
  .loading{display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;background:var(--bg)}
  .loading p{color:var(--muted);font-size:14px}
  .spinner{animation:spin 1s linear infinite;color:var(--accent)}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .syncing{position:fixed;bottom:16px;right:16px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 12px;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:5px;z-index:200}
  .horario-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:4px}
  .dia-col{background:var(--surface2);border:1px solid var(--border);border-radius:8px;overflow:hidden}
  .dia-header{padding:5px 7px;font-size:9px;font-weight:700;text-transform:uppercase;background:rgba(245,158,11,.1);color:var(--accent);border-bottom:1px solid var(--border)}
  .dia-body{padding:5px}
  .dia-maq{font-size:9px;padding:3px 5px;background:var(--surface);border-radius:4px;margin-bottom:3px;border:1px solid var(--border)}
  .dia-empty{font-size:9px;color:var(--muted);padding:3px 5px;font-style:italic}
  .precio-estimado{font-size:11px;color:var(--muted);text-decoration:line-through}
  .precio-real{font-size:13px;font-weight:700;color:var(--green)}
  .precio-eco{font-size:13px;font-weight:700;color:var(--accent2)}
  .info-box{background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);border-radius:9px;padding:9px 13px;font-size:12px;color:var(--accent2);margin-bottom:11px}
  .edit-banner{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:9px;padding:8px 12px;font-size:12px;color:var(--accent);margin-bottom:14px}
  .confirm-modal{background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.3);border-radius:14px;padding:24px;text-align:center}
  .view-only-badge{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.25);border-radius:8px;padding:8px 13px;font-size:12px;color:var(--accent2);margin-bottom:12px;display:flex;align-items:center;gap:6px}
  .maq-check{display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px}
  .maq-check-item{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:7px;cursor:pointer;transition:background .12s}
  .maq-check-item:hover{background:rgba(245,158,11,.08)}
  .maq-check-item input[type=checkbox]{width:16px;height:16px;accent-color:var(--accent);cursor:pointer}
  .maq-check-item.checked{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3)}
  @media(min-width:768px){
    .hamburger{display:none!important}
    .topbar{padding:0 24px;height:60px}
    .topbar h1{font-size:18px}
    .topbar-date{display:block}
    .content{padding:22px 24px}
    .modal-overlay{align-items:center}
    .modal{border-radius:16px;padding:26px;width:90%}
    table{font-size:13px}
    th{padding:9px 18px}
    td{padding:11px 18px}
  }
  @media(max-width:767px){
    .sidebar{position:fixed;top:0;left:0;height:100%;transform:translateX(-100%);transition:transform .25s;z-index:50;width:240px}
    .sidebar.open{transform:translateX(0)}
    .sidebar-overlay.open{display:block}
    .hamburger{display:flex!important}
    .horario-grid{grid-template-columns:repeat(4,1fr)}
    .form-row{grid-template-columns:1fr}
    .role-card h4{font-size:12px}
    .role-card p{font-size:9px}
    .role-card{padding:14px 8px}
  }
`;

const CloseBtn=({onClick})=>(
  <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",padding:"2px 6px",borderRadius:6,fontSize:22,lineHeight:1,display:"flex",alignItems:"center",flexShrink:0}}
    onMouseEnter={e=>e.currentTarget.style.color="var(--text)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}>✕</button>
);

function useFirebase(){
  const [data,setData]=useState(null);
  const [syncCount,setSyncCount]=useState(0);
  const syncing=syncCount>0;
  const incSync=()=>setSyncCount(n=>n+1);
  const decSync=()=>setSyncCount(n=>Math.max(0,n-1));
  useEffect(()=>{
    return onValue(ref(db,"gamatic"),(snap)=>{
      const val=snap.val();
      if(!val){set(ref(db,"gamatic"),SEED);return;}
      setData({
        productos:objToArr(val.productos),proveedores:objToArr(val.proveedores),
        maquinas:objToArr(val.maquinas),stock:objToArr(val.stock),
        traslados:objToArr(val.traslados),ventas:objToArr(val.ventas),
        cobranzas:objToArr(val.cobranzas),gastos:objToArr(val.gastos||{}),
        sugerencias:objToArr(val.sugerencias||{}),devoluciones:objToArr(val.devoluciones||{}),stockMaquina:objToArr(val.stockMaquina||{}),sencillo:objToArr(val.sencillo||{}),tickets:objToArr(val.tickets||{}),
        productosEco:objToArr(val.productosEco||{}),personal:objToArr(val.personal||{}),
        horario:val.horario||SEED.horario,
      });
    });
  },[]);
  const save=async(path,id,val)=>{incSync();try{await set(ref(db,`gamatic/${path}/${id}`),val);}finally{decSync();}};
  const saveMulti=async(ops)=>{incSync();try{for(const[p,i,v]of ops)await set(ref(db,`gamatic/${p}/${i}`),v);}finally{decSync();}};
  const del=async(path,id)=>{incSync();try{await remove(ref(db,`gamatic/${path}/${id}`));}finally{decSync();}};
  return{data,save,saveMulti,del,syncing};
}

function MesNav({mes,setMes}){
  const go=(d)=>{const[y,m]=mes.split("-").map(Number);const nd=new Date(y,m-1+d);setMes(`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}`);};
  const ea=mes===mesActual();
  return(
    <div className="mes-nav">
      <button onClick={()=>go(-1)}><Icon name="chevL" size={15}/></button>
      <span>{nombreMes(mes)}</span>
      <button onClick={()=>go(1)} disabled={ea} style={{opacity:ea?.3:1}}><Icon name="chevR" size={15}/></button>
    </div>
  );
}

function ConfirmDelete({texto,onConfirm,onCancel}){
  return(
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth:360}}>
        <div className="confirm-modal">
          <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
          <h3 style={{marginBottom:8,color:"var(--red)"}}>Eliminar</h3>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:20}}>{texto}</p>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-danger" onClick={onConfirm}>Sí, eliminar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────────
function SearchBar({value,onChange,placeholder="Buscar...",total=null,filtrado=null}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--surface2)",border:`1px solid ${value?"var(--accent)":"var(--border)"}`,borderRadius:9,padding:"8px 13px",marginBottom:14,transition:"border-color .15s"}}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={value?"var(--accent)":"var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input
        value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        style={{background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:13,width:"100%",fontFamily:"'DM Sans',sans-serif"}}
      />
      {value&&filtrado!==null&&total!==null&&(
        <span style={{fontSize:11,color:"var(--accent)",fontWeight:600,whiteSpace:"nowrap"}}>{filtrado}/{total}</span>
      )}
      {value&&<button onClick={()=>onChange("")} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:16,padding:0,lineHeight:1,flexShrink:0}}>✕</button>}
    </div>
  );
}



// ─── LOGIN ──────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [role,setRole]=useState("admin");
  const [clave,setClave]=useState("");
  const [error,setError]=useState("");
  const ROLES=[
    ["admin","🔐","Administrador","Gestión total"],
    ["abastecedor","🔧","Abastecedor","Operaciones de campo"],
    ["almacenero","🏭","Almacenero","Gestión de almacén"],
  ];
  const intentar=()=>{
    const req=CLAVES[role];
    if(req&&clave!==req){setError("Clave incorrecta");return;}
    setError("");onLogin(role);
  };
  return(
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Logo/></div>
          <p>Sistema de gestión de máquinas expendedoras</p>
        </div>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Selecciona tu perfil:</p>
        <div className="role-grid">
          {ROLES.map(([r,ico,lbl,sub])=>(
            <div key={r} className={`role-card ${role===r?"selected":""}`} onClick={()=>{setRole(r);setClave("");setError("");}}>
              <span className="role-icon">{ico}</span><h4>{lbl}</h4><p>{sub}</p>
            </div>
          ))}
        </div>
        {CLAVES[role]&&(
          <div className="form-group" style={{marginBottom:14}}>
            <label>Clave de acceso</label>
            <input type="password" value={clave} onChange={e=>{setClave(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&intentar()} placeholder="Ingresa la clave..." autoFocus/>
            {error&&<div style={{color:"var(--red)",fontSize:12,marginTop:5}}>⚠️ {error}</div>}
          </div>
        )}
        <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",padding:13,fontSize:14}} onClick={intentar}>
          <Icon name="lock" size={15}/>Ingresar
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD con filtro por máquina ──────────────────────────────────────────
function Dashboard({data}){
  const [mes,setMes]=useState(mesActual());
  const [maqFiltro,setMaqFiltro]=useState("todas");
  const maqActivas=data.maquinas.filter(m=>m.activa);
  const maqList=maqFiltro==="todas"?maqActivas:maqActivas.filter(m=>m.id===maqFiltro);
  const maqIds=maqList.map(m=>m.id);
  const ventasMes=data.ventas.filter(v=>v.fecha?.startsWith(mes)&&maqIds.includes(v.maquinaId));
  const cobranzasMes=data.cobranzas.filter(c=>c.fecha?.startsWith(mes)&&maqIds.includes(c.maquinaId));
  const gastosMes=data.gastos.filter(g=>g.fecha?.startsWith(mes)&&(maqFiltro==="todas"||!g.maquinaId||g.maquinaId===maqFiltro));
  const tv=ventasMes.reduce((s,v)=>s+(v.ingreso||0),0);
  const tc=cobranzasMes.reduce((s,c)=>s+(c.monto||0),0);
  const ta=maqList.reduce((s,m)=>s+(m.alquiler||0),0);
  const tg=gastosMes.reduce((s,g)=>s+(g.monto||0),0);
  const cp=ventasMes.reduce((s,v)=>{const p=data.productos.find(p=>p.id===v.productoId);return s+(p?p.costo*v.cantidad:0);},0);
  const util=tv-cp-ta-tg;
  const stockBajo=data.stock.filter(s=>s.cantidad<=s.minimo);
  const dias=[...new Set(ventasMes.map(v=>v.fecha))].sort();
  const acum=dias.map(d=>({fecha:d,total:ventasMes.filter(v=>v.fecha<=d).reduce((s,v)=>s+(v.ingreso||0),0)}));
  return(
    <div>
      {stockBajo.length>0&&<div className="alert-box"><Icon name="alert" size={14}/>{stockBajo.length} producto(s) con stock bajo mínimo</div>}
      <MesNav mes={mes} setMes={setMes}/>
      {/* Filtro por máquina */}
      <div className="filtro-bar">
        <span className="filtro-label"><Icon name="filter" size={13}/> Máquina:</span>
        <select value={maqFiltro} onChange={e=>setMaqFiltro(e.target.value)}>
          <option value="todas">Todas las activas</option>
          {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
        </select>
      </div>
      <div className="cards">
        {[["Ventas",fmt(tv),"green",`${ventasMes.length} registros`],["Cobranza",fmt(tc),"amber",`${cobranzasMes.length} visitas`],["Alquiler",fmt(ta),"blue",`${maqList.length} máq.`],["Gastos extras",fmt(tg),"red",`${gastosMes.length} reg.`],["Utilidad",fmt(util),util>=0?"green":"red","neto del mes"]].map(([l,v,c,s])=>(
          <div key={l} className="card"><div className="card-label">{l}</div><div className={`card-value ${c}`}>{v}</div><div className="card-sub">{s}</div></div>
        ))}
      </div>
      {acum.length>0&&(
        <div className="section" style={{marginBottom:14}}>
          <div className="section-header"><h3>Avance de ventas — {nombreMes(mes)}{maqFiltro!=="todas"&&` · ${maqActivas.find(m=>m.id===maqFiltro)?.nombre}`}</h3></div>
          <div style={{padding:13}}>
            {acum.map((a,i)=>{const pct=tv>0?(a.total/tv*100):0;return(<div key={i} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}><span style={{color:"var(--muted)"}}>{a.fecha}</span><span style={{color:"var(--green)",fontWeight:600}}>{fmt(a.total)}</span></div><div style={{height:5,background:"var(--surface2)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:"var(--green)",borderRadius:4}}/></div></div>);})}
          </div>
        </div>
      )}
      <div className="section">
        <div className="section-header"><h3>Rendimiento por máquina — {nombreMes(mes)}</h3></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Máquina</th><th>Ubicación</th><th>Ventas</th><th>Alquiler</th><th>Gastos</th><th>Rentabilidad</th></tr></thead>
          <tbody>{maqList.map(m=>{
            const vm=ventasMes.filter(v=>v.maquinaId===m.id);
            const ing=vm.reduce((s,v)=>s+(v.ingreso||0),0);
            const cost=vm.reduce((s,v)=>{const p=data.productos.find(p=>p.id===v.productoId);return s+(p?p.costo*v.cantidad:0);},0);
            const gm=gastosMes.filter(g=>g.maquinaId===m.id).reduce((s,g)=>s+(g.monto||0),0);
            const rent=ing-cost-(m.alquiler||0)-gm;
            return(<tr key={m.id}><td><strong>{m.nombre}</strong></td><td style={{color:"var(--muted)",fontSize:11}}>{m.ubicacion}</td><td>{fmt(ing)}</td><td style={{color:"var(--red)"}}>{fmt(m.alquiler)}</td><td style={{color:"var(--red)"}}>{gm>0?fmt(gm):"—"}</td><td><span className={`badge ${rent>=0?"green":"red"}`}>{fmt(rent)}</span></td></tr>);
          })}</tbody>
        </table></div>
      </div>
    </div>
  );
}

// ─── RENTABILIDAD ────────────────────────────────────────────────────────────────
function Rentabilidad({data}){
  const [mes,setMes]=useState(mesActual());
  const maqActivas=data.maquinas.filter(m=>m.activa);
  const ventasMes=data.ventas.filter(v=>v.fecha?.startsWith(mes)&&maqActivas.find(m=>m.id===v.maquinaId));
  const gastosMes=data.gastos.filter(g=>g.fecha?.startsWith(mes));
  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      {maqActivas.map(m=>{
        const vm=ventasMes.filter(v=>v.maquinaId===m.id);
        const ing=vm.reduce((s,v)=>s+(v.ingreso||0),0);
        const cost=vm.reduce((s,v)=>{const p=data.productos.find(p=>p.id===v.productoId);return s+(p?p.costo*v.cantidad:0);},0);
        const gm=gastosMes.filter(g=>g.maquinaId===m.id).reduce((s,g)=>s+(g.monto||0),0);
        const util=ing-cost-(m.alquiler||0)-gm;
        const roi=ing>0?((util/ing)*100).toFixed(1):0;
        const tipo=util>50?"positive":util>=0?"neutral":"negative";
        return(
          <div key={m.id} className={`profit-card profit-${tipo}`}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><div style={{fontWeight:700,fontSize:14}}>{m.nombre}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.ubicacion}</div></div>
              <span className={`badge ${tipo==="positive"?"green":tipo==="negative"?"red":"amber"}`}>ROI: {roi}%</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:8}}>
              {[["Ingresos",fmt(ing),"var(--green)"],["Costo prod.",fmt(cost),"var(--muted)"],["Alquiler",fmt(m.alquiler),"var(--red)"],["Gastos extras",fmt(gm),"var(--red)"],["Utilidad",fmt(util),util>=0?"var(--green)":"var(--red)"]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(0,0,0,.2)",padding:"7px 10px",borderRadius:8}}>
                  <div style={{fontSize:9,color:"var(--muted)",marginBottom:2,textTransform:"uppercase"}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"7px 10px",background:"rgba(0,0,0,.2)",borderRadius:8,fontSize:12}}>
              {util>=100&&"✅ Muy rentable"}{util>=0&&util<100&&"⚠️ Rentable con margen ajustado"}{util<0&&"❌ No rentable — revisar alquiler o gastos"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── GASTOS con edición ───────────────────────────────────────────────────────
function GastosAdicionales({data,save,del}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const EF={descripcion:"",maquinaId:"",monto:"",fecha:today()};
  const [form,setForm]=useState(EF);
  const [mes,setMes]=useState(mesActual());
  const maqActivas=data.maquinas.filter(m=>m.activa);
  const abrirNuevo=()=>{setForm(EF);setEditando(null);setModal(true);};
  const abrirEditar=(g)=>{setForm({descripcion:g.descripcion,maquinaId:g.maquinaId||"",monto:String(g.monto),fecha:g.fecha});setEditando(g);setModal(true);};
  const doSave=()=>{
    if(!form.descripcion||!form.monto)return;
    if(editando)save("gastos",editando.id,{...editando,descripcion:form.descripcion,maquinaId:form.maquinaId||null,monto:+form.monto,fecha:form.fecha});
    else{const id=uid();save("gastos",id,{id,descripcion:form.descripcion,maquinaId:form.maquinaId||null,monto:+form.monto,fecha:form.fecha});}
    setModal(false);setForm(EF);setEditando(null);
  };
  const gastosMes=data.gastos.filter(g=>g.fecha?.startsWith(mes));
  const totalMes=gastosMes.reduce((s,g)=>s+(g.monto||0),0);
  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      <div className="cards"><div className="card"><div className="card-label">Total gastos {nombreMes(mes)}</div><div className="card-value red">{fmt(totalMes)}</div><div className="card-sub">{gastosMes.length} registros</div></div></div>
      <div className="section">
        <div className="section-header"><h3>Gastos adicionales — {nombreMes(mes)}</h3><button className="btn btn-primary btn-sm" onClick={abrirNuevo}><Icon name="plus" size={13}/> Agregar</button></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Descripción</th><th>Máquina</th><th>Monto</th><th>Acciones</th></tr></thead>
          <tbody>
            {gastosMes.length===0?<tr><td colSpan={5} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin gastos en {nombreMes(mes)}</td></tr>
            :[...gastosMes].reverse().map(g=>{
              const maq=data.maquinas.find(m=>m.id===g.maquinaId);
              return(<tr key={g.id}>
                <td style={{color:"var(--muted)"}}>{g.fecha}</td>
                <td><strong>{g.descripcion}</strong></td>
                <td style={{color:"var(--muted)"}}>{maq?maq.nombre:"General"}</td>
                <td style={{color:"var(--red)",fontWeight:700}}>{fmt(g.monto)}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(g)}><Icon name="edit" size={12}/></button>
                  <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(g)}><Icon name="trash" size={12}/></button>
                </div></td>
              </tr>);
            })}
          </tbody>
        </table></div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar gasto":"Agregar gasto adicional"}</h3>
        {editando&&<div className="edit-banner">Editando: <strong>{editando.descripcion}</strong></div>}
        <div className="form-group"><label>Descripción</label><input value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Ej: Servicio de luz, mantenimiento..."/></div>
        <div className="form-group"><label>Máquina (opcional)</label>
          <select value={form.maquinaId} onChange={e=>setForm({...form,maquinaId:e.target.value})}>
            <option value="">General (todas las máquinas)</option>
            {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Monto (S/)</label><input type="number" step="0.01" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})}/></div>
          <div className="form-group"><label>Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></div>
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Guardar"}</button></div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto={`¿Eliminar el gasto "${confirmDel.descripcion}"?`} onConfirm={()=>{del("gastos",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────
function Productos({data,save,del,soloEditar=false}){
  const [busqueda,setBusqueda]=useState("");
  const productosFiltrados=[...data.productos].sort((a,b)=>a.nombre.localeCompare(b.nombre)).filter(p=>!busqueda||p.nombre.toLowerCase().includes(busqueda.toLowerCase())||p.proveedor?.toLowerCase().includes(busqueda.toLowerCase()));
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [precioEdit,setPrecioEdit]=useState("");
  const [editandoPrecioId,setEditandoPrecioId]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [form,setForm]=useState({nombre:"",costo:"",margen:"",precioVenta:"",precioEco:"",proveedor:"",fecha:today(),fechaVenc:""});
  const est=(c,m)=>c&&m?(+c*(1+ +m/100)).toFixed(2):"";
  const abrirNuevo=()=>{setForm({nombre:"",costo:"",margen:"",precioVenta:"",proveedor:"",fecha:today()});setEditando(null);setModal(true);};
  const abrirEditar=(p)=>{const s=data.stock.find(st=>st.productoId===p.id);setForm({nombre:p.nombre,costo:String(p.costo),margen:String(p.margen),precioVenta:String(p.precioVenta||""),precioEco:String(p.precioEco||""),proveedor:p.proveedor,fecha:p.fecha||today(),fechaVenc:s?.fechaVenc||""});setEditando(p);setModal(true);};
  const doSave=()=>{
    if(!form.nombre||!form.costo)return;
    const e=parseFloat(est(form.costo,form.margen));
    const obj={nombre:form.nombre,costo:+form.costo,margen:+form.margen,precioVenta:form.precioVenta?+form.precioVenta:e,precioEco:form.precioEco?+form.precioEco:null,proveedor:form.proveedor,fecha:form.fecha};
    if(editando){
      save("productos",editando.id,{...editando,...obj});
      const s=data.stock.find(st=>st.productoId===editando.id);
      if(s)save("stock",s.id,{...s,fechaVenc:form.fechaVenc||null});
    } else{const id=uid();save("productos",id,{id,...obj});}
    setModal(false);setEditando(null);
  };
  const guardarPrecio=(p)=>{save("productos",p.id,{...p,precioVenta:+precioEdit});setEditandoPrecioId(null);};
  return(
    <div>
      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o proveedor..." total={data.productos.length} filtrado={productosFiltrados.length}/>
      <div className="section">
        <div className="section-header"><h3>Catálogo de productos</h3><button className="btn btn-primary btn-sm" onClick={abrirNuevo}><Icon name="plus" size={13}/> Agregar</button></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Producto</th><th>F.Registro</th><th>F.Vencimiento</th><th>Proveedor</th><th>Costo</th><th>Margen</th><th>Estimado</th><th>Precio venta</th><th>Precio económico</th><th>Acciones</th></tr></thead>
          <tbody>{productosFiltrados.map(p=>{
            const e=(p.costo*(1+p.margen/100)).toFixed(2);
            const epId=editandoPrecioId===p.id;
            return(<tr key={p.id}>
              <td><strong>{p.nombre}</strong></td>
              <td style={{color:"var(--muted)",fontSize:11}}>{p.fecha||"—"}</td>
              <td>{(()=>{const s=data.stock.find(st=>st.productoId===p.id);if(!s?.fechaVenc)return<span style={{color:"var(--muted)",fontSize:11}}>—</span>;const dias=Math.ceil((new Date(s.fechaVenc)-new Date())/(1000*60*60*24));return<span style={{fontSize:11,fontWeight:600,color:dias<=7?"var(--red)":dias<=30?"var(--accent)":"var(--muted)"}}>{s.fechaVenc}{dias<=30&&<span style={{marginLeft:3,fontSize:9}}>{dias<=0?"⚠️ Vencido":dias<=7?`⚠️ ${dias}d`:`⚡ ${dias}d`}</span>}</span>;})()}</td>
              <td style={{color:"var(--muted)"}}>{p.proveedor}</td>
              <td>{fmt(p.costo)}</td>
              <td><span className="badge amber">{p.margen}%</span></td>
              <td><span className="precio-estimado">S/ {e}</span></td>
              <td>{epId
                ?<div style={{display:"flex",gap:5,alignItems:"center"}}>
                    <input type="number" step="0.10" value={precioEdit} onChange={ev=>setPrecioEdit(ev.target.value)} style={{width:75,padding:"4px 7px",background:"var(--surface2)",border:"1px solid var(--accent)",borderRadius:7,color:"var(--text)",fontSize:12}}/>
                    <button className="btn btn-primary btn-sm" onClick={()=>guardarPrecio(p)}>OK</button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>setEditandoPrecioId(null)}>✕</button>
                  </div>
                :<div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span className="precio-real">{fmt(p.precioVenta||e)}</span>
                    <button className="btn btn-secondary btn-sm" onClick={()=>{setEditandoPrecioId(p.id);setPrecioEdit(p.precioVenta||e);}}><Icon name="edit" size={11}/></button>
                  </div>
              }</td>
              <td>{p.precioEco?<span className="precio-eco">{fmt(p.precioEco)}</span>:<span style={{color:"var(--muted)",fontSize:11}}>—</span>}</td>
              <td><div style={{display:"flex",gap:5}}>
                <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(p)}><Icon name="edit" size={12}/></button>
                {!soloEditar&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(p)}><Icon name="trash" size={12}/></button>}
              </div></td>
            </tr>);
          })}</tbody>
        </table></div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar producto":"Nuevo producto"}</h3>
        {editando&&<div className="edit-banner">✏️ Editando: <strong>{editando.nombre}</strong></div>}
        <div className="form-row">
          <div className="form-group"><label>Nombre</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Coca Cola 500ml"/></div>
          <div className="form-group"><label>Fecha de registro</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Costo (S/)</label><input type="number" step="0.01" value={form.costo} onChange={e=>setForm({...form,costo:e.target.value})}/></div>
          <div className="form-group"><label>Margen (%)</label><input type="number" value={form.margen} onChange={e=>setForm({...form,margen:e.target.value})}/></div>
        </div>
        {form.costo&&form.margen&&<div className="info-box">Precio estimado: <strong>S/ {est(form.costo,form.margen)}</strong></div>}
        <div className="form-group"><label>Precio real de venta (puedes redondearlo)</label><input type="number" step="0.10" value={form.precioVenta} onChange={e=>setForm({...form,precioVenta:e.target.value})} placeholder={`Ej: ${est(form.costo,form.margen)||"2.50"}`}/></div>
        <div className="form-group"><label>Precio económico (S/) — opcional</label><input type="number" step="0.10" value={form.precioEco||""} onChange={e=>setForm({...form,precioEco:e.target.value})} placeholder="Ej: 2.80 (para máquinas con precios reducidos)"/></div>
        <div className="form-group"><label>Fecha de vencimiento (opcional)</label><input type="date" value={form.fechaVenc||""} onChange={e=>setForm({...form,fechaVenc:e.target.value})}/></div>
        <div className="form-group"><label>Proveedor</label>
          <select value={form.proveedor} onChange={e=>setForm({...form,proveedor:e.target.value})}>
            <option value="">Seleccionar...</option>
            {data.proveedores.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Guardar"}</button></div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto={`¿Eliminar el producto "${confirmDel.nombre}"?`} onConfirm={()=>{del("productos",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

function ListaPrecios({data}){
  const [busqueda,setBusqueda]=useState("");
  const pfiltrados=[...data.productos].sort((a,b)=>a.nombre.localeCompare(b.nombre)).filter(p=>!busqueda||p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  return(<div><div className="info-box">Precios de venta que debes cobrar al cargar las máquinas.</div><SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." total={data.productos.length} filtrado={pfiltrados.length}/><div className="section"><div className="section-header"><h3>Precios de venta</h3></div><div className="table-wrap"><table><thead><tr><th>Producto</th><th>Proveedor</th><th>Precio de venta</th></tr></thead><tbody>{pfiltrados.map(p=>(<tr key={p.id}><td><strong>{p.nombre}</strong></td><td style={{color:"var(--muted)"}}>{p.proveedor}</td><td><span className="precio-real">{fmt(p.precioVenta||(p.costo*(1+p.margen/100)))}</span></td></tr>))}</tbody></table></div></div></div>);
}

// ─── PROVEEDORES ─────────────────────────────────────────────────────────────────
function Proveedores({data,save,del,soloEditar=false}){
  const [busqueda,setBusqueda]=useState("");
  const provFiltrados=[...data.proveedores].sort((a,b)=>a.nombre.localeCompare(b.nombre)).filter(p=>!busqueda||p.nombre.toLowerCase().includes(busqueda.toLowerCase())||p.contacto?.toLowerCase().includes(busqueda.toLowerCase()));
  const [modal,setModal]=useState(false);const [editando,setEditando]=useState(null);const [confirmDel,setConfirmDel]=useState(null);
  const EF={nombre:"",contacto:"",telefono:""};const [form,setForm]=useState(EF);
  const doSave=()=>{
    if(!form.nombre)return;
    if(editando)save("proveedores",editando.id,{...editando,...form});
    else{const id=uid();save("proveedores",id,{id,...form});}
    setModal(false);setForm(EF);setEditando(null);
  };
  return(
    <div><SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar proveedor..." total={data.proveedores.length} filtrado={provFiltrados.length}/>
  
      <div className="section">
        <div className="section-header"><h3>Proveedores</h3><button className="btn btn-primary btn-sm" onClick={()=>{setForm(EF);setEditando(null);setModal(true);}}><Icon name="plus" size={13}/> Agregar</button></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Empresa</th><th>Contacto</th><th>Teléfono</th><th>Productos</th><th>Acciones</th></tr></thead>
          <tbody>{provFiltrados.map(p=>(<tr key={p.id}>
            <td><strong>{p.nombre}</strong></td><td>{p.contacto}</td><td style={{color:"var(--muted)"}}>{p.telefono}</td>
            <td><span className="badge blue">{data.productos.filter(pr=>pr.proveedor===p.nombre).length}</span></td>
            <td><div style={{display:"flex",gap:5}}>
              <button className="btn btn-secondary btn-sm" onClick={()=>{setForm({nombre:p.nombre,contacto:p.contacto,telefono:p.telefono});setEditando(p);setModal(true);}}><Icon name="edit" size={12}/></button>
              {!soloEditar&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(p)}><Icon name="trash" size={12}/></button>}
            </div></td>
          </tr>))}</tbody>
        </table></div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar proveedor":"Nuevo proveedor"}</h3>
        {editando&&<div className="edit-banner">Editando: <strong>{editando.nombre}</strong></div>}
        <div className="form-group"><label>Empresa</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div>
        <div className="form-row">
          <div className="form-group"><label>Contacto</label><input value={form.contacto} onChange={e=>setForm({...form,contacto:e.target.value})}/></div>
          <div className="form-group"><label>Teléfono</label><input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></div>
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Guardar"}</button></div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto={`¿Eliminar el proveedor "${confirmDel.nombre}"?`} onConfirm={()=>{del("proveedores",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── MÁQUINAS ─────────────────────────────────────────────────────────────────
function Maquinas({data,save,del,esAdmin,esAbastecedor=false,soloEditar=false}){
  const [modal,setModal]=useState(false);const [editando,setEditando]=useState(null);const [confirmDel,setConfirmDel]=useState(null);
  const EF={nombre:"",ubicacion:"",alquiler:""};const [form,setForm]=useState(EF);
  const doSave=()=>{
    if(!form.nombre||!form.ubicacion)return;
    if(editando)save("maquinas",editando.id,{...editando,nombre:form.nombre,ubicacion:form.ubicacion,alquiler:+form.alquiler});
    else{const id=uid();save("maquinas",id,{id,nombre:form.nombre,ubicacion:form.ubicacion,alquiler:+form.alquiler,activa:true});}
    setModal(false);setForm(EF);setEditando(null);
  };
  const toggleActiva=(m)=>save("maquinas",m.id,{...m,activa:!m.activa});
  const puedeVerAlquiler=esAdmin||soloEditar;
  // Abastecedor solo visualiza
  if(esAbastecedor){
    return(
      <div>
        <div className="view-only-badge"><Icon name="lock" size={14}/> Solo visualización — no puedes editar máquinas</div>
        <div className="section">
          <div className="section-header"><h3>Mis máquinas</h3></div>
          <div className="table-wrap"><table>
            <thead><tr><th>Máquina</th><th>Ubicación</th><th>Estado</th></tr></thead>
            <tbody>{data.maquinas.map(m=>(<tr key={m.id}><td><strong>{m.nombre}</strong></td><td style={{fontSize:11,color:"var(--muted)"}}>{m.ubicacion}</td><td><span className={`badge ${m.activa?"green":"red"}`}>{m.activa?"Activa":"Inactiva"}</span></td></tr>))}</tbody>
          </table></div>
        </div>
      </div>
    );
  }
  return(
    <div>
      <div className="section">
        <div className="section-header"><h3>Máquinas registradas</h3><button className="btn btn-primary btn-sm" onClick={()=>{setForm(EF);setEditando(null);setModal(true);}}><Icon name="plus" size={13}/> Agregar</button></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Máquina</th><th>Ubicación</th>{puedeVerAlquiler&&<th>Alquiler/mes</th>}<th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{data.maquinas.map(m=>(<tr key={m.id}>
            <td><strong>{m.nombre}</strong></td>
            <td style={{fontSize:11,color:"var(--muted)"}}>{m.ubicacion}</td>
            {puedeVerAlquiler&&<td style={{color:"var(--red)"}}>{fmt(m.alquiler)}</td>}
            <td><div onClick={()=>toggleActiva(m)} style={{display:"inline-flex",alignItems:"center",gap:5,cursor:"pointer",padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,userSelect:"none",background:m.activa?"rgba(16,185,129,.15)":"rgba(239,68,68,.15)",color:m.activa?"var(--green)":"var(--red)"}}><span style={{width:6,height:6,borderRadius:"50%",background:m.activa?"var(--green)":"var(--red)",display:"inline-block"}}/>{m.activa?"Activa":"Inactiva"}</div></td>
            <td><div style={{display:"flex",gap:5}}>
              <button className="btn btn-secondary btn-sm" onClick={()=>{setForm({nombre:m.nombre,ubicacion:m.ubicacion,alquiler:String(m.alquiler)});setEditando(m);setModal(true);}}><Icon name="edit" size={12}/> Editar</button>
              {!soloEditar&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(m)}><Icon name="trash" size={12}/></button>}
            </div></td>
          </tr>))}</tbody>
        </table></div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar máquina":"Nueva máquina"}</h3>
        {editando&&<div className="edit-banner">✏️ Editando: <strong>{editando.nombre}</strong></div>}
        <div className="form-group"><label>Nombre / Código</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Máquina D4"/></div>
        <div className="form-group"><label>Ubicación</label><input value={form.ubicacion} onChange={e=>setForm({...form,ubicacion:e.target.value})} placeholder="Ej: CC Real Plaza - Piso 2"/></div>
        <div className="form-group"><label>Alquiler mensual (S/)</label><input type="number" step="0.01" value={form.alquiler} onChange={e=>setForm({...form,alquiler:e.target.value})}/></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Crear"}</button></div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto={`¿Eliminar la máquina "${confirmDel.nombre}"?`} onConfirm={()=>{del("maquinas",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── STOCK ──────────────────────────────────────────────────────────────────────
function Stock({data,save,del,soloLectura=false,esAdmin=false}){
  const [busqueda,setBusqueda]=useState("");
  const stockFiltrado=[...data.stock].sort((a,b)=>{const pa=data.productos.find(p=>p.id===a.productoId);const pb=data.productos.find(p=>p.id===b.productoId);return(pa?.nombre||"").localeCompare(pb?.nombre||"");}).filter(s=>{const p=data.productos.find(p=>p.id===s.productoId);return !busqueda||p?.nombre.toLowerCase().includes(busqueda.toLowerCase());});
  const [modal,setModal]=useState(false);const [editando,setEditando]=useState(null);const [confirmDel,setConfirmDel]=useState(null);
  const EF={productoId:"",cantidad:"",minimo:"",fechaVenc:"",fechaReg:""};const [form,setForm]=useState(EF);
  const doSave=()=>{
    if(editando){
      save("stock",editando.id,{...editando,cantidad:+form.cantidad,minimo:+form.minimo,fechaVenc:form.fechaVenc||null,fechaReg:form.fechaReg||editando.fechaReg||null});
      const prod=data.productos.find(p=>p.id===editando.productoId);
      if(prod&&form.nombreProducto&&form.nombreProducto!==prod.nombre)save("productos",prod.id,{...prod,nombre:form.nombreProducto});
    } else {
      if(!form.productoId||!form.cantidad)return;
      const existe=data.stock.find(s=>s.productoId===form.productoId);
      if(existe)save("stock",existe.id,{...existe,cantidad:existe.cantidad+ +form.cantidad,fechaVenc:form.fechaVenc||existe.fechaVenc||null});
      else{const id=uid();save("stock",id,{id,productoId:form.productoId,cantidad:+form.cantidad,minimo:+form.minimo||10,fechaVenc:form.fechaVenc||null,fechaReg:form.fechaReg||null});}
    }
    setModal(false);setForm(EF);setEditando(null);
  };
  const abrirEditar=(s)=>{const prod=data.productos.find(p=>p.id===s.productoId);setForm({productoId:s.productoId,nombreProducto:prod?.nombre||"",cantidad:String(s.cantidad),minimo:String(s.minimo),fechaVenc:s.fechaVenc||"",fechaReg:s.fechaReg||""});setEditando(s);setModal(true);};
  return(
    <div>
      <div className="section">
        <div className="section-header">
          <h3>Stock del almacén</h3>
          {!soloLectura&&<button className="btn btn-primary btn-sm" onClick={()=>{setForm(EF);setEditando(null);setModal(true);}}><Icon name="plus" size={13}/> Entrada</button>}
        </div>
        {soloLectura&&<div className="view-only-badge" style={{margin:"12px 16px 0"}}><Icon name="lock" size={13}/> Solo visualización</div>}
        <div style={{padding:"0 16px 12px"}}><SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto en stock..." total={data.stock.length} filtrado={stockFiltrado.length}/></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Producto</th><th>F.Ingreso</th><th>F.Vencimiento</th><th>Cantidad</th><th>Mínimo</th><th>Estado</th>{!soloLectura&&<th>Acciones</th>}</tr></thead>
          <tbody>{stockFiltrado.map(s=>{
            const prod=data.productos.find(p=>p.id===s.productoId);
            const bajo=s.cantidad<=s.minimo;
            return(<tr key={s.id}>
              <td><strong>{prod?.nombre||"—"}</strong></td>
              <td style={{color:"var(--muted)",fontSize:11}}>{s.fechaReg||"—"}</td>
              <td>{(()=>{if(!s.fechaVenc)return<span style={{color:"var(--muted)",fontSize:11}}>—</span>;const dias=Math.ceil((new Date(s.fechaVenc)-new Date())/(1000*60*60*24));return<span style={{fontSize:11,fontWeight:600,color:dias<=7?"var(--red)":dias<=30?"var(--accent)":"var(--muted)"}}>{s.fechaVenc}{dias<=30&&<span style={{marginLeft:4,fontSize:9}}>{dias<=0?"⚠️ Vencido":dias<=7?`⚠️ ${dias}d`:`⚡ ${dias}d`}</span>}</span>;})()}</td>
                            <td style={{fontSize:15,fontWeight:700,color:bajo?"var(--red)":"var(--text)"}}>{s.cantidad}</td>
              <td style={{color:"var(--muted)"}}>{s.minimo}</td>
              <td><span className={`badge ${bajo?"red":s.cantidad>s.minimo*2?"green":"amber"}`}>{bajo?"Stock bajo":s.cantidad>s.minimo*2?"OK":"Moderado"}</span></td>
              {!soloLectura&&<td><div style={{display:"flex",gap:5}}>
                <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(s)}><Icon name="edit" size={12}/> Editar</button>
                {esAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(s)}><Icon name="trash" size={12}/></button>}
              </div></td>}
            </tr>);
          })}</tbody>
        </table></div>
      </div>
      {!soloLectura&&modal&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar stock":"Entrada de stock"}</h3>
        {editando&&<div className="edit-banner">Editando producto en stock</div>}
        {editando
          ?<><div className="form-group"><label>Nombre del producto</label><input value={form.nombreProducto||""} onChange={e=>setForm({...form,nombreProducto:e.target.value})}/></div>
             <div className="form-row">
               <div className="form-group"><label>Cantidad en stock</label><input type="number" value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})}/></div>
               <div className="form-group"><label>Stock mínimo</label><input type="number" value={form.minimo} onChange={e=>setForm({...form,minimo:e.target.value})}/></div>
             </div>
             <div className="form-row"><div className="form-group"><label>Fecha de ingreso</label><input type="date" value={form.fechaReg||""} onChange={e=>setForm({...form,fechaReg:e.target.value})}/></div><div className="form-group"><label>Fecha de vencimiento (opcional)</label><input type="date" value={form.fechaVenc||""} onChange={e=>setForm({...form,fechaVenc:e.target.value})}/></div></div></>
          :<><div className="form-group"><label>Producto</label>
               <select value={form.productoId} onChange={e=>setForm({...form,productoId:e.target.value})}>
                 <option value="">Seleccionar...</option>
                 {data.productos.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
               </select>
             </div>
             <div className="form-row">
               <div className="form-group"><label>Cantidad a ingresar</label><input type="number" value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})}/></div>
               <div className="form-group"><label>Stock mínimo</label><input type="number" value={form.minimo} onChange={e=>setForm({...form,minimo:e.target.value})} placeholder="10"/></div>
             </div>
             <div className="form-row"><div className="form-group"><label>Fecha de ingreso</label><input type="date" value={form.fechaReg||""} onChange={e=>setForm({...form,fechaReg:e.target.value})}/></div><div className="form-group"><label>Fecha de vencimiento (opcional)</label><input type="date" value={form.fechaVenc||""} onChange={e=>setForm({...form,fechaVenc:e.target.value})}/></div></div></>
        }
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Registrar"}</button></div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto={`¿Eliminar el registro de stock de "${data.productos.find(p=>p.id===confirmDel.productoId)?.nombre}"?`} onConfirm={()=>{del("stock",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── TRASLADOS con fecha, edición y borrado ─────────────────────────────────────
function Traslados({data,save,saveMulti,del,usuario,esAdmin=false,soloLectura=false}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [maquinasSelec,setMaquinasSelec]=useState([]);
  const [fechaReg,setFechaReg]=useState(today());
  const [items,setItems]=useState([{productoId:"",cantidad:""}]);
  const [mes,setMes]=useState(mesActual());
  const [formEdit,setFormEdit]=useState({fecha:"",maquinaId:"",productoId:"",cantidad:""});
  const maqActivas=data.maquinas.filter(m=>m.activa);
  const toggleMaqSelec=(id)=>setMaquinasSelec(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const addItem=()=>setItems(i=>[...i,{productoId:"",cantidad:""}]);
  const removeItem=idx=>setItems(i=>i.filter((_,j)=>j!==idx));
  const setItem=(idx,f,v)=>setItems(i=>i.map((r,j)=>j===idx?{...r,[f]:v}:r));
  const abrirEditar=(t)=>{setFormEdit({fecha:t.fecha,maquinaId:t.maquinaId,productoId:t.productoId,cantidad:String(t.cantidad)});setEditando(t);};
  const doGuardarEdicion=()=>{
    if(!editando)return;
    save("traslados",editando.id,{...editando,fecha:formEdit.fecha,maquinaId:formEdit.maquinaId,productoId:formEdit.productoId,cantidad:+formEdit.cantidad});
    setEditando(null);
  };
  const doSave=async()=>{
    if(maquinasSelec.length===0)return;
    const valid=items.filter(it=>it.productoId&&it.cantidad);
    if(!valid.length)return;
    const ops=[];
    maquinasSelec.forEach(maqId=>{
      valid.forEach(it=>{
        const tId=uid();
        ops.push(["traslados",tId,{id:tId,fecha:fechaReg,maquinaId:maqId,productoId:it.productoId,cantidad:+it.cantidad,responsable:usuario}]);
      });
    });
    valid.forEach(it=>{
      const si=data.stock.find(s=>s.productoId===it.productoId);
      if(si){const total=+it.cantidad*maquinasSelec.length;ops.push(["stock",si.id,{...si,cantidad:Math.max(0,si.cantidad-total)}]);}
    });
    await saveMulti(ops);
    setModal(false);setMaquinasSelec([]);setFechaReg(today());setItems([{productoId:"",cantidad:""}]);
  };
  const trasladosMes=data.traslados.filter(t=>t.fecha?.startsWith(mes));
  const grupos={};
  [...trasladosMes].reverse().forEach(t=>{
    const key=`${t.fecha}__${t.maquinaId}__${t.id}`;
    grupos[key]={...t};
  });
  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      {soloLectura&&<div className="view-only-badge"><Icon name="lock" size={14}/> Solo visualización — no puedes registrar traslados</div>}
      <div className="section">
        <div className="section-header"><h3>Traslados — {nombreMes(mes)}</h3>{!soloLectura&&<button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={13}/> Registrar</button>}</div>
        <div className="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Máquina</th><th>Producto</th><th>Cantidad</th><th>Responsable</th>{!soloLectura&&<th>Acciones</th>}</tr></thead>
          <tbody>
            {Object.values(grupos).length===0
              ?<tr><td colSpan={6} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin traslados en {nombreMes(mes)}</td></tr>
              :Object.values(grupos).map(t=>{
                const maq=data.maquinas.find(m=>m.id===t.maquinaId);
                const prod=data.productos.find(p=>p.id===t.productoId);
                return(<tr key={t.id}>
                  <td style={{color:"var(--muted)"}}>{t.fecha}</td>
                  <td><strong>{maq?.nombre||"—"}</strong><br/><span style={{fontSize:10,color:"var(--muted)"}}>{maq?.ubicacion}</span></td>
                  <td>{prod?.nombre||"—"}</td>
                  <td><span className="badge blue">{t.cantidad} uds</span></td>
                  <td style={{color:"var(--muted)"}}>{t.responsable}{t.origenStockMaquina&&<span style={{marginLeft:5,fontSize:9,padding:"1px 6px",borderRadius:10,background:"rgba(59,130,246,.15)",color:"var(--accent2)",fontWeight:700}}>Stock máq.</span>}</td>
                  {!soloLectura&&<td><div style={{display:"flex",gap:5}}>
                    <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(t)}><Icon name="edit" size={12}/></button>
                    {esAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(t)}><Icon name="trash" size={12}/></button>}
                  </div></td>}
                </tr>);
              })
            }
          </tbody>
        </table></div>
      </div>
      {/* Modal nuevo traslado */}
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>Registrar traslado</h3>
        <div className="form-row">
          <div className="form-group"><label>Fecha del traslado</label><input type="date" value={fechaReg} onChange={e=>setFechaReg(e.target.value)}/></div>
        </div>
        <div className="form-group">
          <label>Máquinas destino — selecciona una o varias activas</label>
          <div className="maq-check">
            {maqActivas.map(m=>(
              <div key={m.id} className={`maq-check-item ${maquinasSelec.includes(m.id)?"checked":""}`} onClick={()=>toggleMaqSelec(m.id)}>
                <input type="checkbox" checked={maquinasSelec.includes(m.id)} onChange={()=>toggleMaqSelec(m.id)}/>
                <div><div style={{fontSize:12,fontWeight:600}}>{m.nombre}</div><div style={{fontSize:10,color:"var(--muted)"}}>{m.ubicacion}</div></div>
              </div>
            ))}
          </div>
          {maquinasSelec.length>0&&<div style={{marginTop:6,fontSize:11,color:"var(--accent)"}}>✓ {maquinasSelec.length} máquina(s) seleccionada(s)</div>}
        </div>
        <div className="form-group">
          <label>Productos trasladados</label>
          <div style={{background:"var(--surface2)",borderRadius:9,padding:10,border:"1px solid var(--border)"}}>
            {items.map((it,idx)=>(
              <div key={idx} className="prod-row">
                <select value={it.productoId} onChange={e=>setItem(idx,"productoId",e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {[...data.productos].sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(p=>{const s=data.stock.find(s=>s.productoId===p.id);return<option key={p.id} value={p.id}>{p.nombre} (stock:{s?.cantidad||0})</option>;})}
                </select>
                <input type="number" value={it.cantidad} onChange={e=>setItem(idx,"cantidad",e.target.value)} placeholder="0"/>
                <button className="btn btn-danger btn-sm" style={{padding:"5px 7px"}} onClick={()=>removeItem(idx)} disabled={items.length===1}>✕</button>
              </div>
            ))}
            <button className="add-prod-btn" onClick={addItem}><Icon name="plus" size={12}/> Agregar producto</button>
          </div>
        </div>
        {maquinasSelec.length>1&&items.some(it=>it.productoId&&it.cantidad)&&<div className="info-box" style={{marginBottom:8}}>Se registrará el mismo traslado para las {maquinasSelec.length} máquinas. El stock se descontará {maquinasSelec.length} veces por producto.</div>}
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>Registrar traslado</button></div>
      </div></div>}
      {/* Modal editar traslado */}
      {editando&&<div className="modal-overlay"><div className="modal">
        <h3>Editar traslado</h3>
        <div className="edit-banner">Editando traslado del {editando.fecha}</div>
        <div className="form-row">
          <div className="form-group"><label>Fecha</label><input type="date" value={formEdit.fecha} onChange={e=>setFormEdit({...formEdit,fecha:e.target.value})}/></div>
          <div className="form-group"><label>Máquina (activas)</label>
            <select value={formEdit.maquinaId} onChange={e=>setFormEdit({...formEdit,maquinaId:e.target.value})}>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label>Producto</label>
          <select value={formEdit.productoId} onChange={e=>setFormEdit({...formEdit,productoId:e.target.value})}>
            {data.productos.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Cantidad</label><input type="number" value={formEdit.cantidad} onChange={e=>setFormEdit({...formEdit,cantidad:e.target.value})}/></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setEditando(null)}>Cancelar</button><button className="btn btn-primary" onClick={doGuardarEdicion}>Guardar cambios</button></div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto="¿Eliminar este traslado? El stock no se revertirá automáticamente." onConfirm={()=>{del("traslados",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── VENTAS con fecha, edición y borrado ──────────────────────────────────────
function Ventas({data,save,del,esAdmin=false,soloLectura=false}){
  const [modal,setModal]=useState(false);
  const [editandoVenta,setEditandoVenta]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [maquinaId,setMaquinaId]=useState("");
  const [fechaReg,setFechaReg]=useState(today());
  const [items,setItems]=useState([{productoId:"",cantidad:""}]);
  const [mes,setMes]=useState(mesActual());
  const [formEdit,setFormEdit]=useState({fecha:"",maquinaId:"",productoId:"",cantidad:"",ingreso:""});
  // Sugerencia: guarda la última clave "fecha__maqId" para la que se guardó sugerencia
  const [modalSug,setModalSug]=useState(null); // {maqId, maqNombre, grupoKey}
  const [sugTexto,setSugTexto]=useState("");
  const [verSug,setVerSug]=useState(null);
  const maqActivas=data.maquinas.filter(m=>m.activa);

  // Obtener sugerencias de un grupo específico: busca por maquinaId y fecha del grupo
  const getSugsGrupo=(g)=>data.sugerencias.filter(s=>s.maquinaId===g.maquinaId&&s.fecha===g.fecha);

  const addItem=()=>setItems(i=>[...i,{productoId:"",cantidad:""}]);
  const removeItem=idx=>setItems(i=>i.filter((_,j)=>j!==idx));
  const setItem=(idx,f,v)=>setItems(i=>i.map((r,j)=>j===idx?{...r,[f]:v}:r));
  const totalModal=items.reduce((s,it)=>{const p=data.productos.find(p=>p.id===it.productoId);return s+(p&&it.cantidad?(p.precioVenta||(p.costo*(1+p.margen/100)))* +it.cantidad:0);},0);

  const doSave=async()=>{
    if(!maquinaId)return;
    const valid=items.filter(it=>it.productoId&&it.cantidad);
    if(!valid.length)return;
    const maq=data.maquinas.find(m=>m.id===maquinaId);
    for(const it of valid){
      const prod=data.productos.find(p=>p.id===it.productoId);
      const precio=prod?(prod.precioVenta||(prod.costo*(1+prod.margen/100))):0;
      const id=uid();
      await save("ventas",id,{id,fecha:fechaReg,maquinaId,productoId:it.productoId,cantidad:+it.cantidad,ingreso:+(precio* +it.cantidad).toFixed(2)});
    }
    const fechaUsada=fechaReg;
    const maqIdUsado=maquinaId;
    setModal(false);setMaquinaId("");setFechaReg(today());setItems([{productoId:"",cantidad:""}]);
    // Abrir modal de sugerencia con la fecha exacta de la venta
    if(maq)setModalSug({maqId:maqIdUsado,maqNombre:maq.nombre,fecha:fechaUsada,grupoKey:`${fechaUsada}__${maqIdUsado}`});
    setSugTexto("");
  };

  const guardarSug=()=>{
    if(!modalSug||!sugTexto.trim())return;
    const id=uid();
    // Guardar con la MISMA fecha que la venta registrada
    save("sugerencias",id,{id,maquinaId:modalSug.maqId,mensaje:sugTexto.trim(),fecha:modalSug.fecha});
    setModalSug(null);setSugTexto("");
  };

  const abrirSugManual=(g)=>{
    const maq=data.maquinas.find(m=>m.id===g.maquinaId);
    setModalSug({maqId:g.maquinaId,maqNombre:maq?.nombre||"",fecha:g.fecha,grupoKey:`${g.fecha}__${g.maquinaId}`});
    setSugTexto("");
  };

  const abrirEditar=(v)=>{setFormEdit({fecha:v.fecha,maquinaId:v.maquinaId,productoId:v.productoId,cantidad:String(v.cantidad),ingreso:String(v.ingreso)});setEditandoVenta(v);};
  const doGuardarEdicion=()=>{
    if(!editandoVenta)return;
    save("ventas",editandoVenta.id,{...editandoVenta,fecha:formEdit.fecha,maquinaId:formEdit.maquinaId,productoId:formEdit.productoId,cantidad:+formEdit.cantidad,ingreso:+formEdit.ingreso});
    setEditandoVenta(null);
  };

  const ventasMes=data.ventas.filter(v=>v.fecha?.startsWith(mes));
  const grupos={};
  [...ventasMes].reverse().forEach(v=>{
    const key=`${v.fecha}__${v.maquinaId}`;
    if(!grupos[key])grupos[key]={fecha:v.fecha,maquinaId:v.maquinaId,ventas:[],total:0};
    const prod=data.productos.find(p=>p.id===v.productoId);
    grupos[key].ventas.push({...v,prodNombre:prod?.nombre||"—"});
    grupos[key].total+=(v.ingreso||0);
  });
  const totalMes=ventasMes.reduce((s,v)=>s+(v.ingreso||0),0);
  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      <div className="cards">
        <div className="card"><div className="card-label">Total {nombreMes(mes)}</div><div className="card-value amber">{fmt(totalMes)}</div><div className="card-sub">{ventasMes.length} registros</div></div>
        <div className="card"><div className="card-label">Unidades vendidas</div><div className="card-value blue">{ventasMes.reduce((s,v)=>s+(v.cantidad||0),0)}</div><div className="card-sub">Todos los productos</div></div>
      </div>
      <div className="section">
        <div className="section-header"><h3>Ventas — {nombreMes(mes)}</h3>{!soloLectura&&<button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={13}/> Registrar</button>}{soloLectura&&<span className="view-only-badge" style={{fontSize:11,padding:"3px 10px"}}><Icon name="lock" size={12}/> Solo visualización</span>}</div>
        <div className="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Máquina</th><th>Productos vendidos</th><th>Total</th><th>Sugerencia</th></tr></thead>
          <tbody>
            {Object.values(grupos).length===0?<tr><td colSpan={esAdmin?5:4} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin ventas en {nombreMes(mes)}</td></tr>
            :Object.values(grupos).map((g,i)=>{
              const maq=data.maquinas.find(m=>m.id===g.maquinaId);
              return(<tr key={i}>
                <td style={{color:"var(--muted)"}}>{g.fecha}</td>
                <td><strong>{maq?.nombre}</strong><br/><span style={{fontSize:10,color:"var(--muted)"}}>{maq?.ubicacion}</span></td>
                <td>{g.ventas.map((v,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                    <span className="badge blue">{v.cantidad}</span>
                    <span style={{fontSize:11}}>{v.prodNombre}</span>
                    <span style={{fontSize:11,color:"var(--green)"}}>{fmt(v.ingreso)}</span>
                    {!soloLectura&&<button className="btn btn-secondary btn-sm" style={{padding:"1px 6px",fontSize:10}} onClick={()=>abrirEditar(v)}><Icon name="edit" size={10}/></button>}
                    {esAdmin&&<button className="btn btn-danger btn-sm" style={{padding:"1px 6px",fontSize:10}} onClick={()=>setConfirmDel(v)}><Icon name="trash" size={10}/></button>}
                  </div>
                ))}</td>
                <td style={{color:"var(--green)",fontWeight:700}}>{fmt(g.total)}</td>
                <td>{(()=>{
                  const sugs=getSugsGrupo(g);
                  if(sugs.length>0) return(
                    <button onClick={()=>setVerSug(sugs[0])} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:"rgba(245,158,11,.15)",color:"var(--accent)"}}>
                      💡 Ver sugerencia
                    </button>
                  );
                  if(esAdmin) return <span style={{color:"var(--muted)",fontSize:11}}>—</span>;
                  return(
                    <button onClick={()=>abrirSugManual(g)} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,border:"1px dashed var(--muted)",cursor:"pointer",fontSize:11,fontWeight:600,background:"transparent",color:"var(--muted)"}}>
                      💡 Agregar sugerencia
                    </button>
                  );
                })()}</td>
              </tr>);
            })}
          </tbody>
        </table></div>
      </div>
      {modal&&!soloLectura&&<div className="modal-overlay"><div className="modal">
        <h3>Registrar ventas del día</h3>
        <div className="form-row">
          <div className="form-group"><label>Máquina (solo activas)</label>
            <select value={maquinaId} onChange={e=>setMaquinaId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Fecha de venta</label><input type="date" value={fechaReg} onChange={e=>setFechaReg(e.target.value)}/></div>
        </div>
        <div className="form-group">
          <label>Productos vendidos</label>
          <div style={{background:"var(--surface2)",borderRadius:9,padding:10,border:"1px solid var(--border)"}}>
            {items.map((it,idx)=>{
              const prod=data.productos.find(p=>p.id===it.productoId);
              const precio=prod?(prod.precioVenta||(prod.costo*(1+prod.margen/100))):0;
              return(<div key={idx}>
                <div className="prod-row">
                  <select value={it.productoId} onChange={e=>setItem(idx,"productoId",e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {data.productos.map(p=><option key={p.id} value={p.id}>{p.nombre} — {fmt(p.precioVenta||(p.costo*(1+p.margen/100)))}</option>)}
                  </select>
                  <input type="number" value={it.cantidad} onChange={e=>setItem(idx,"cantidad",e.target.value)} placeholder="0"/>
                  <button className="btn btn-danger btn-sm" style={{padding:"5px 7px"}} onClick={()=>removeItem(idx)} disabled={items.length===1}>✕</button>
                </div>
                {prod&&it.cantidad&&<div style={{fontSize:11,color:"var(--green)",marginBottom:5,paddingLeft:2}}>Subtotal: {fmt(precio* +it.cantidad)}</div>}
              </div>);
            })}
            <button className="add-prod-btn" onClick={addItem}><Icon name="plus" size={12}/> Agregar producto</button>
          </div>
        </div>
        {totalModal>0&&<div style={{padding:"8px 12px",background:"rgba(16,185,129,.1)",borderRadius:8,fontSize:13,color:"var(--green)",fontWeight:700,marginBottom:3}}>Total: {fmt(totalModal)}</div>}
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>Registrar</button></div>
      </div></div>}
      {/* ── Modal nueva sugerencia ── */}
      {modalSug&&<div className="modal-overlay">
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"24px 22px",width:"90%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:38,height:38,borderRadius:10,background:"rgba(245,158,11,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>💡</div>
            <div>
              <div style={{fontSize:15,fontWeight:700}}>Agregar sugerencia</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>Máquina: <strong style={{color:"var(--accent)"}}>{modalSug.maqNombre}</strong></div>
            </div>
          </div>
          {/* Textarea */}
          <div className="form-group" style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:600,color:"var(--muted)",letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6}}>Tu sugerencia o comentario</label>
            <textarea
              autoFocus
              value={sugTexto}
              onChange={e=>setSugTexto(e.target.value)}
              placeholder="Ej: Los clientes piden Doritos, podemos colocar uno nuevo..."
              style={{width:"100%",padding:"10px 13px",background:"var(--surface2)",border:`1px solid ${sugTexto.trim()?"var(--accent)":"var(--border)"}`,borderRadius:9,color:"var(--text)",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",minHeight:100,resize:"vertical",transition:"border-color .15s"}}
            />
          </div>
          {/* Actions */}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setModalSug(null)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",fontSize:13,fontWeight:600}}>
              Omitir
            </button>
            <button onClick={guardarSug} style={{padding:"8px 20px",borderRadius:8,border:"none",background:sugTexto.trim()?"var(--accent)":"var(--border)",color:sugTexto.trim()?"#000":"var(--muted)",cursor:sugTexto.trim()?"pointer":"default",fontSize:13,fontWeight:700,transition:"all .15s"}}>
              Guardar sugerencia
            </button>
          </div>
        </div>
      </div>}

      {/* ── Modal ver sugerencia (admin) ── */}
      {verSug&&<div className="modal-overlay">
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"24px 22px",width:"90%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:38,height:38,borderRadius:10,background:"rgba(245,158,11,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>💡</div>
            <div>
              <div style={{fontSize:15,fontWeight:700}}>Sugerencia del abastecedor</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>
                <strong style={{color:"var(--accent)"}}>{data.maquinas.find(m=>m.id===verSug.maquinaId)?.nombre}</strong> — {verSug.fecha}
              </div>
            </div>
          </div>
          <div style={{background:"var(--surface2)",borderRadius:10,padding:"14px 16px",fontSize:14,lineHeight:1.7,border:"1px solid var(--border)",color:"var(--text)",marginBottom:16}}>
            {verSug.mensaje}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>setVerSug(null)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"var(--accent)",color:"#000",cursor:"pointer",fontSize:13,fontWeight:700}}>
              Cerrar
            </button>
          </div>
        </div>
      </div>}

      {editandoVenta&&<div className="modal-overlay"><div className="modal">
        <h3>Editar venta</h3>
        <div className="edit-banner">Editando venta del {editandoVenta.fecha}</div>
        <div className="form-row">
          <div className="form-group"><label>Fecha</label><input type="date" value={formEdit.fecha} onChange={e=>setFormEdit({...formEdit,fecha:e.target.value})}/></div>
          <div className="form-group"><label>Máquina (activas)</label>
            <select value={formEdit.maquinaId} onChange={e=>setFormEdit({...formEdit,maquinaId:e.target.value})}>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label>Producto</label>
          <select value={formEdit.productoId} onChange={e=>setFormEdit({...formEdit,productoId:e.target.value})}>
            {data.productos.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Cantidad</label><input type="number" value={formEdit.cantidad} onChange={e=>setFormEdit({...formEdit,cantidad:e.target.value})}/></div>
          <div className="form-group"><label>Ingreso (S/)</label><input type="number" step="0.01" value={formEdit.ingreso} onChange={e=>setFormEdit({...formEdit,ingreso:e.target.value})}/></div>
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setEditandoVenta(null)}>Cancelar</button><button className="btn btn-primary" onClick={doGuardarEdicion}>Guardar cambios</button></div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto={`¿Eliminar esta venta de ${confirmDel.prodNombre}?`} onConfirm={()=>{del("ventas",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── COBRANZAS con check y comentario ────────────────────────────────────────
function Cobranzas({data,save,del,usuario,esAdmin=false}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [form,setForm]=useState({maquinaId:"",monto:"",fecha:today(),sencillo:false,montoSencillo:""});
  const [formEdit,setFormEdit]=useState({fecha:"",maquinaId:"",monto:""});
  const [mes,setMes]=useState(mesActual());
  // Comentario modal
  const [modalCom,setModalCom]=useState(null); // {cobId, maqNombre, fecha}
  const [comTexto,setComTexto]=useState("");
  const [verCom,setVerCom]=useState(null);
  const maqActivas=data.maquinas.filter(m=>m.activa);

  const doSave=()=>{
    if(!form.maquinaId||!form.monto)return;
    const id=uid();
    save("cobranzas",id,{id,fecha:form.fecha,maquinaId:form.maquinaId,monto:+form.monto,responsable:usuario,verificado:false,comentarioId:null,sencillo:form.sencillo?+form.montoSencillo||0:0});
    setModal(false);setForm({maquinaId:"",monto:"",fecha:today(),sencillo:false,montoSencillo:""});
  };
  const toggleVerificado=(cob)=>save("cobranzas",cob.id,{...cob,verificado:!cob.verificado});
  const abrirEditar=(cob)=>{setFormEdit({fecha:cob.fecha,maquinaId:cob.maquinaId,monto:String(cob.monto)});setEditando(cob);};
  const doGuardarEdicion=()=>{
    if(!editando)return;
    save("cobranzas",editando.id,{...editando,fecha:formEdit.fecha,maquinaId:formEdit.maquinaId,monto:+formEdit.monto});
    setEditando(null);
  };
  const abrirModalCom=(cob,maqNombre)=>{
    const comExistente=data.sugerencias.find(s=>s.cobId===cob.id);
    setComTexto(comExistente?.mensaje||"");
    setModalCom({cobId:cob.id,maqNombre,fecha:cob.fecha,existente:comExistente||null});
  };
  const guardarCom=()=>{
    if(!modalCom||!comTexto.trim())return;
    if(modalCom.existente){
      save("sugerencias",modalCom.existente.id,{...modalCom.existente,mensaje:comTexto.trim()});
    } else {
      const id=uid();
      save("sugerencias",id,{id,cobId:modalCom.cobId,maquinaId:null,mensaje:comTexto.trim(),fecha:modalCom.fecha,tipo:"cobranza"});
    }
    setModalCom(null);setComTexto("");
  };
  const getComCob=(cobId)=>data.sugerencias.find(s=>s.cobId===cobId);

  const cobranzasMes=data.cobranzas.filter(c=>c.fecha?.startsWith(mes));
  const totalMes=cobranzasMes.reduce((s,c)=>s+(c.monto||0),0);
  const totalVerificado=cobranzasMes.filter(c=>c.verificado).reduce((s,c)=>s+(c.monto||0),0);
  const totalSencillo=cobranzasMes.reduce((s,c)=>s+(c.sencillo||0),0);

  const BtnCom=({cob,maqNombre})=>{
    const com=getComCob(cob.id);
    return com
      ?<button onClick={()=>setVerCom(com)} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:7,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,background:"rgba(245,158,11,.15)",color:"var(--accent)"}}>💬 Ver</button>
      :<button onClick={()=>abrirModalCom(cob,maqNombre)} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:7,border:"1px dashed var(--muted)",cursor:"pointer",fontSize:10,fontWeight:600,background:"transparent",color:"var(--muted)"}}>💬 Comentar</button>;
  };

  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      <div className="cards">
        <div className="card"><div className="card-label">Total {nombreMes(mes)}</div><div className="card-value green">{fmt(totalMes)}</div><div className="card-sub">{cobranzasMes.length} registros</div></div>
        <div className="card"><div className="card-label">Verificado</div><div className="card-value green">{fmt(totalVerificado)}</div><div className="card-sub">{cobranzasMes.filter(c=>c.verificado).length} confirmados</div></div>
        <div className="card"><div className="card-label">Pendiente</div><div className="card-value amber">{fmt(totalMes-totalVerificado)}</div><div className="card-sub">{cobranzasMes.filter(c=>!c.verificado).length} por verificar</div></div>
        <div className="card"><div className="card-label">Sencillo entregado</div><div className="card-value blue">{fmt(totalSencillo)}</div><div className="card-sub">{cobranzasMes.filter(c=>c.sencillo>0).length} con sencillo</div></div>
      </div>
      <div className="section">
        <div className="section-header"><h3>Cobranza — {nombreMes(mes)}</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={13}/> Registrar</button></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Máquina</th><th>Ubicación</th><th>Monto cobrado</th><th>Sencillo</th><th>Responsable</th><th>Estado</th><th>Comentario</th><th>Acciones</th></tr></thead>
          <tbody>
            {cobranzasMes.length===0?<tr><td colSpan={9} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin cobranzas en {nombreMes(mes)}</td></tr>
            :[...cobranzasMes].reverse().map(cob=>{
              const maq=data.maquinas.find(m=>m.id===cob.maquinaId);
              const verificado=!!cob.verificado;
              return(<tr key={cob.id}>
                <td style={{color:"var(--muted)"}}>{cob.fecha}</td>
                <td><strong>{maq?.nombre}</strong></td>
                <td style={{color:"var(--muted)",fontSize:11}}>{maq?.ubicacion}</td>
                <td style={{color:"var(--green)",fontWeight:700}}>{fmt(cob.monto)}</td>
                <td>{cob.sencillo>0
                  ?<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:"rgba(59,130,246,.15)",color:"var(--accent2)"}}>💵 {fmt(cob.sencillo)}</span>
                  :<span style={{color:"var(--muted)",fontSize:11}}>—</span>
                }</td>
                <td style={{color:"var(--muted)"}}>{cob.responsable}</td>
                <td>
                  {esAdmin
                    ?<button
                        onClick={()=>toggleVerificado(cob)}
                        style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,userSelect:"none",transition:"all .2s",background:verificado?"rgba(16,185,129,.15)":"rgba(245,158,11,.15)",color:verificado?"var(--green)":"var(--accent)"}}>
                        {verificado?"✅ Correcto":"⏳ Pendiente"}
                      </button>
                    :<span style={{...{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:700},background:verificado?"rgba(16,185,129,.15)":"rgba(245,158,11,.15)",color:verificado?"var(--green)":"var(--accent)"}}>
                        {verificado?"✅ Correcto":"⏳ Pendiente"}
                      </span>
                  }
                </td>
                <td><BtnCom cob={cob} maqNombre={maq?.nombre||""}/></td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(cob)}><Icon name="edit" size={12}/></button>
                  {esAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(cob)}><Icon name="trash" size={12}/></button>}
                </div></td>
              </tr>);
            })}
          </tbody>
        </table></div>
      </div>

      {/* Modal registrar */}
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>Registrar dinero recogido</h3>
        <div className="form-row">
          <div className="form-group"><label>Máquina (solo activas)</label>
            <select value={form.maquinaId} onChange={e=>setForm({...form,maquinaId:e.target.value})}>
              <option value="">Seleccionar...</option>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Fecha de cobranza</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></div>
        </div>
        <div className="form-group"><label>Monto recogido (S/)</label><input type="number" step="0.01" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})}/></div>
        {/* Sencillo */}
        <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:9,padding:"12px 14px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:form.sencillo?10:0}}>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>💵 ¿Se entrega sencillo/cambio?</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Dinero que se da al abastecedor para el cambio de las máquinas</div>
            </div>
            <div onClick={()=>setForm({...form,sencillo:!form.sencillo,montoSencillo:""})}
              style={{width:44,height:24,borderRadius:20,background:form.sencillo?"var(--accent)":"var(--border)",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:form.sencillo?23:3,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
            </div>
          </div>
          {form.sencillo&&<div className="form-group" style={{marginBottom:0,marginTop:8}}>
            <label>Monto de sencillo entregado (S/)</label>
            <input autoFocus type="number" step="0.50" value={form.montoSencillo} onChange={e=>setForm({...form,montoSencillo:e.target.value})} placeholder="Ej: 20.00"/>
          </div>}
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>Registrar</button></div>
      </div></div>}

      {/* Modal editar */}
      {editando&&<div className="modal-overlay"><div className="modal">
        <h3>Editar cobranza</h3>
        <div className="edit-banner">Editando cobranza del {editando.fecha}</div>
        <div className="form-row">
          <div className="form-group"><label>Fecha</label><input type="date" value={formEdit.fecha} onChange={e=>setFormEdit({...formEdit,fecha:e.target.value})}/></div>
          <div className="form-group"><label>Máquina (activas)</label>
            <select value={formEdit.maquinaId} onChange={e=>setFormEdit({...formEdit,maquinaId:e.target.value})}>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label>Monto (S/)</label><input type="number" step="0.01" value={formEdit.monto} onChange={e=>setFormEdit({...formEdit,monto:e.target.value})}/></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setEditando(null)}>Cancelar</button><button className="btn btn-primary" onClick={doGuardarEdicion}>Guardar cambios</button></div>
      </div></div>}

      {/* Modal comentario */}
      {modalCom&&<div className="modal-overlay">
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"24px 22px",width:"90%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:38,height:38,borderRadius:10,background:"rgba(59,130,246,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>💬</div>
            <div>
              <div style={{fontSize:15,fontWeight:700}}>Comentario de cobranza</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>Máquina: <strong style={{color:"var(--accent)"}}>{modalCom.maqNombre}</strong> — {modalCom.fecha}</div>
            </div>
          </div>
          <div className="form-group" style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:600,color:"var(--muted)",letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6}}>Nota sobre este dinero</label>
            <textarea autoFocus value={comTexto} onChange={e=>setComTexto(e.target.value)}
              placeholder="Ej: Se usaron S/20 para pagar pasaje, entrego S/80 de S/100..."
              style={{width:"100%",padding:"10px 13px",background:"var(--surface2)",border:`1px solid ${comTexto.trim()?"var(--accent2)":"var(--border)"}`,borderRadius:9,color:"var(--text)",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",minHeight:90,resize:"vertical",transition:"border-color .15s"}}/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setModalCom(null)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",fontSize:13,fontWeight:600}}>Cancelar</button>
            <button onClick={guardarCom} style={{padding:"8px 20px",borderRadius:8,border:"none",background:comTexto.trim()?"var(--accent2)":"var(--border)",color:comTexto.trim()?"#fff":"var(--muted)",cursor:comTexto.trim()?"pointer":"default",fontSize:13,fontWeight:700,transition:"all .15s"}}>
              {modalCom.existente?"Actualizar":"Guardar comentario"}
            </button>
          </div>
        </div>
      </div>}

      {/* Modal ver comentario */}
      {verCom&&<div className="modal-overlay">
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"24px 22px",width:"90%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:38,height:38,borderRadius:10,background:"rgba(59,130,246,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>💬</div>
            <div><div style={{fontSize:15,fontWeight:700}}>Comentario de cobranza</div><div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>{verCom.fecha}</div></div>
          </div>
          <div style={{background:"var(--surface2)",borderRadius:10,padding:"14px 16px",fontSize:14,lineHeight:1.7,border:"1px solid var(--border)",color:"var(--text)",marginBottom:16}}>{verCom.mensaje}</div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>{setVerCom(null);setModalCom({cobId:verCom.cobId,maqNombre:"",fecha:verCom.fecha,existente:verCom});setComTexto(verCom.mensaje);}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text)",cursor:"pointer",fontSize:13,fontWeight:600}}>Editar</button>
            <button onClick={()=>setVerCom(null)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"var(--accent2)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700}}>Cerrar</button>
          </div>
        </div>
      </div>}

      {confirmDel&&<ConfirmDelete texto={`¿Eliminar la cobranza del ${confirmDel.fecha} de ${fmt(confirmDel.monto)}?`} onConfirm={()=>{del("cobranzas",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── HORARIO ─────────────────────────────────────────────────────────────────────
const DIAS=["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];
const DL={lunes:"Lun",martes:"Mar",miercoles:"Mié",jueves:"Jue",viernes:"Vie",sabado:"Sáb",domingo:"Dom"};

function HorarioAdmin({data,save}){
  const [ed,setEd]=useState(false);
  const [draft,setDraft]=useState(null);
  const [comentarioModal,setComentarioModal]=useState(null); // {dia, maqId}
  const [textoComentario,setTextoComentario]=useState("");

  const abrir=()=>{
    const d={};
    DIAS.forEach(dia=>{d[dia]={maquinas:(data.horario[dia]?.maquinas||[]).slice(),comentarios:{...(data.horario[dia]?.comentarios||{})},mensajeGeneral:data.horario[dia]?.mensajeGeneral||""};});
    setDraft(d);setEd(true);
  };
  const tog=(dia,id)=>setDraft(p=>{const l=[...(p[dia]?.maquinas||[])];const i=l.indexOf(id);if(i>=0)l.splice(i,1);else l.push(id);return{...p,[dia]:{...p[dia],maquinas:l}};});
  const setMsg=(dia,val)=>setDraft(p=>({...p,[dia]:{...p[dia],mensajeGeneral:val}}));
  const guardar=async()=>{for(const dia of DIAS)await save("horario",dia,draft[dia]);setEd(false);};

  // Comentario por maquina en el listado (no en el modal de edicion)
  const abrirComentario=(dia,maqId)=>{
    const actual=(data.horario[dia]?.comentarios||{})[maqId]||"";
    setTextoComentario(actual);
    setComentarioModal({dia,maqId});
  };
  const guardarComentario=async()=>{
    if(!comentarioModal)return;
    const{dia,maqId}=comentarioModal;
    const diaActual=data.horario[dia]||{maquinas:[],comentarios:{},mensajeGeneral:""};
    const nuevosComentarios={...(diaActual.comentarios||{}), [maqId]:textoComentario};
    await save("horario",dia,{...diaActual,comentarios:nuevosComentarios});
    setComentarioModal(null);setTextoComentario("");
  };

  const h=data.horario||{};
  return(
    <div>
      <div className="section">
        <div className="section-header"><h3>Horario semanal del abastecedor</h3><button className="btn btn-primary btn-sm" onClick={abrir}><Icon name="edit" size={13}/> Editar</button></div>
        <div style={{padding:12}}>
          <div className="horario-grid">
            {DIAS.map(dia=>{
              const ids=h[dia]?.maquinas||[];
              const comentarios=h[dia]?.comentarios||{};
              const msgGeneral=h[dia]?.mensajeGeneral||"";
              return(
                <div key={dia} className="dia-col">
                  <div className="dia-header">{DL[dia]}</div>
                  <div className="dia-body">
                    {msgGeneral&&<div style={{fontSize:9,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",borderRadius:4,padding:"3px 6px",marginBottom:4,color:"var(--accent)"}}>{msgGeneral}</div>}
                    {ids.length===0?<div className="dia-empty">Libre</div>:ids.map(id=>{
                      const m=data.maquinas.find(m=>m.id===id);
                      const com=comentarios[id]||"";
                      return(
                        <div key={id} style={{marginBottom:4}}>
                          <div className="dia-maq" style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={()=>abrirComentario(dia,id)}>
                            <span>📍 {m?.nombre||id}</span>
                            <span style={{fontSize:9,color:"var(--accent)",opacity:.7}}>✏️</span>
                          </div>
                          {com&&<div style={{fontSize:9,color:"var(--accent2)",padding:"2px 5px",fontStyle:"italic",background:"rgba(59,130,246,.08)",borderRadius:4,marginTop:2}}>{com}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal editar horario */}
      {ed&&draft&&<div className="modal-overlay"><div className="modal" style={{maxWidth:600}}>
        <h3>Editar horario semanal</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:13}}>Toca las máquinas para asignar/quitar. Agrega un mensaje general por día (opcional).</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {DIAS.map(dia=>(
            <div key={dia}>
              <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:"var(--accent)",marginBottom:5,textAlign:"center"}}>{DL[dia]}</div>
              {data.maquinas.map(m=>{
                const sel=(draft[dia]?.maquinas||[]).includes(m.id);
                return(<div key={m.id} onClick={()=>tog(dia,m.id)} style={{padding:"4px 6px",borderRadius:6,marginBottom:4,cursor:"pointer",fontSize:10,background:sel?"rgba(245,158,11,.15)":"var(--surface2)",border:`1px solid ${sel?"var(--accent)":"var(--border)"}`,color:sel?"var(--accent)":"var(--muted)",textAlign:"center",transition:"all .12s"}}>{m.nombre}</div>);
              })}
              <input
                value={draft[dia]?.mensajeGeneral||""}
                onChange={e=>setMsg(dia,e.target.value)}
                placeholder="Mensaje..."
                style={{width:"100%",padding:"4px 6px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,color:"var(--text)",fontSize:10,outline:"none",marginTop:4}}
              />
            </div>
          ))}
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setEd(false)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar horario</button></div>
      </div></div>}

      {/* Modal comentario por maquina */}
      {comentarioModal&&<div className="modal-overlay"><div className="modal" style={{maxWidth:380}}>
        <h3>Comentario para máquina</h3>
        {(()=>{const{dia,maqId}=comentarioModal;const m=data.maquinas.find(m=>m.id===maqId);return(
          <div>
            <div className="edit-banner">📍 {m?.nombre} — {DL[dia]}</div>
            <div className="form-group">
              <label>Instrucción o comentario para el abastecedor</label>
              <textarea value={textoComentario} onChange={e=>setTextoComentario(e.target.value)} placeholder="Ej: Llevar productos adicionales, revisar dispensador..." style={{width:"100%",padding:"9px 12px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif",minHeight:90,resize:"vertical"}}/>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={()=>setComentarioModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarComentario}>Guardar comentario</button>
            </div>
          </div>
        );})()}
      </div></div>}
    </div>
  );
}

function MiHorario({data,save,puedeComentarMaq=false}){
  const de=["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
  const da=de[new Date().getDay()];const h=data.horario||{};const mh=h[da]?.maquinas||[];
  const comentariosHoy=h[da]?.comentarios||{};
  const msgHoy=h[da]?.mensajeGeneral||"";
  const [comModal,setComModal]=useState(null);
  const [comTexto,setComTexto]=useState("");
  const abrirCom=(dia,maqId)=>{
    const actual=(h[dia]?.comentarios||{})[maqId]||"";
    setComTexto(actual);setComModal({dia,maqId});
  };
  const guardarCom=async()=>{
    if(!comModal)return;
    const{dia,maqId}=comModal;
    const diaData=h[dia]||{maquinas:[],comentarios:{},mensajeGeneral:""};
    const nuevos={...(diaData.comentarios||{}),[maqId]:comTexto};
    await save("horario",dia,{...diaData,comentarios:nuevos});
    setComModal(null);setComTexto("");
  };
  return(
    <div>
      {/* Resumen de hoy */}
      <div style={{marginBottom:14,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.25)",borderRadius:12,padding:14}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:9}}><Icon name="calendar" size={14}/><span style={{fontWeight:700,fontSize:14}}>Hoy — {da.charAt(0).toUpperCase()+da.slice(1)}</span></div>
        {msgHoy&&<div style={{background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.3)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"var(--accent)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}><span>📢</span>{msgHoy}</div>}
        {mh.length===0
          ?<p style={{color:"var(--muted)",fontSize:13}}>No tienes máquinas asignadas hoy.</p>
          :mh.map(id=>{
            const m=data.maquinas.find(m=>m.id===id);
            const com=comentariosHoy[id]||"";
            return(
              <div key={id} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:9,padding:"10px 13px",marginBottom:7}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:com?6:0}}>
                  <Icon name="location" size={14}/>
                  <div><div style={{fontWeight:700,fontSize:13}}>{m?.nombre}</div><div style={{fontSize:11,color:"var(--muted)"}}>{m?.ubicacion}</div></div>
                </div>
                {com&&<div style={{background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",borderRadius:7,padding:"6px 10px",fontSize:12,color:"var(--accent2)",display:"flex",alignItems:"flex-start",gap:6}}><span>💬</span><span>{com}</span></div>}
              </div>
            );
          })
        }
      </div>

      {/* Semana completa */}
      <div className="section">
        <div className="section-header"><h3>Mi horario semanal</h3></div>
        <div style={{padding:12}}>
          <div className="horario-grid">
            {DIAS.map(dia=>{
              const ids=h[dia]?.maquinas||[];const esh=dia===da;
              const coms=h[dia]?.comentarios||{};
              const msg=h[dia]?.mensajeGeneral||"";
              return(
                <div key={dia} className="dia-col" style={esh?{border:"1px solid var(--accent)"}:{}}>
                  <div className="dia-header" style={esh?{background:"rgba(245,158,11,.25)"}:{}}>{DL[dia]}{esh&&" ★"}</div>
                  <div className="dia-body">
                    {msg&&<div style={{fontSize:9,background:"rgba(245,158,11,.12)",borderRadius:4,padding:"2px 5px",marginBottom:4,color:"var(--accent)"}}>{msg}</div>}
                    {ids.length===0?<div className="dia-empty">Libre</div>:ids.map(id=>{
                      const m=data.maquinas.find(m=>m.id===id);
                      const com=coms[id]||"";
                      return(
                        <div key={id} style={{marginBottom:3}}>
                          <div className="dia-maq">📍 {m?.nombre||id}</div>
                          {com&&<div style={{fontSize:9,color:"var(--accent2)",padding:"2px 5px",fontStyle:"italic",background:"rgba(59,130,246,.08)",borderRadius:3,marginTop:1}}>💬 {com}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {comModal&&puedeComentarMaq&&<div className="modal-overlay"><div className="modal" style={{maxWidth:380}}>
        <h3>Comentario para máquina</h3>
        {(()=>{const{dia,maqId}=comModal;const m=data.maquinas.find(m=>m.id===maqId);return(
          <div>
            <div className="edit-banner">📍 {m?.nombre} — {DL[dia]}</div>
            <div className="form-group">
              <label>Tu comentario o nota</label>
              <textarea value={comTexto} onChange={e=>setComTexto(e.target.value)} placeholder="Ej: Llevar productos extra, revisar dispensador..." style={{width:"100%",padding:"9px 12px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif",minHeight:90,resize:"vertical"}}/>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={()=>setComModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarCom}>Guardar comentario</button>
            </div>
          </div>
        );})()}
      </div></div>}
    </div>
  );
}

// ─── SUGERENCIAS ─────────────────────────────────────────────────────────────────
function Sugerencias({data,save,del,soloLectura=false}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const EF={maquinaId:"",mensaje:"",fecha:today()};
  const [form,setForm]=useState(EF);
  const maqActivas=data.maquinas.filter(m=>m.activa);
  const doSave=()=>{
    if(!form.mensaje)return;
    if(editando)save("sugerencias",editando.id,{...editando,...form,maquinaId:form.maquinaId||null});
    else{const id=uid();save("sugerencias",id,{id,...form,maquinaId:form.maquinaId||null});}
    setModal(false);setForm(EF);setEditando(null);
  };
  const abrirEditar=(s)=>{setForm({maquinaId:s.maquinaId||"",mensaje:s.mensaje,fecha:s.fecha});setEditando(s);setModal(true);};
  return(
    <div>
      <div className="section">
        <div className="section-header">
          <h3>Sugerencias</h3>
          {!soloLectura&&<button className="btn btn-primary btn-sm" onClick={()=>{setForm(EF);setEditando(null);setModal(true);}}><Icon name="plus" size={13}/> Nueva sugerencia</button>}
        </div>
        {soloLectura&&<div className="view-only-badge" style={{margin:"12px 16px 0"}}><Icon name="lock" size={13}/> Solo visualización</div>}
        <div className="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Máquina</th><th>Mensaje / Sugerencia</th>{!soloLectura&&<th>Acciones</th>}</tr></thead>
          <tbody>
            {data.sugerencias.length===0?<tr><td colSpan={soloLectura?3:4} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin sugerencias registradas</td></tr>
            :[...data.sugerencias].reverse().map(s=>{
              const maq=data.maquinas.find(m=>m.id===s.maquinaId);
              return(<tr key={s.id}>
                <td style={{color:"var(--muted)",whiteSpace:"nowrap"}}>{s.fecha}</td>
                <td><span className="badge blue">{maq?maq.nombre:"General"}</span></td>
                <td style={{fontSize:13}}>{s.mensaje}</td>
                {!soloLectura&&<td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(s)}><Icon name="edit" size={12}/></button>
                  <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(s)}><Icon name="trash" size={12}/></button>
                </div></td>}
              </tr>);
            })}
          </tbody>
        </table></div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar sugerencia":"Nueva sugerencia"}</h3>
        {editando&&<div className="edit-banner">Editando sugerencia</div>}
        <div className="form-group"><label>Máquina (opcional)</label>
          <select value={form.maquinaId} onChange={e=>setForm({...form,maquinaId:e.target.value})}>
            <option value="">General (todas)</option>
            {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></div>
        <div className="form-group"><label>Mensaje / Sugerencia</label>
          <textarea value={form.mensaje} onChange={e=>setForm({...form,mensaje:e.target.value})} placeholder="Ej: Podemos colocar este producto nuevo, nos han solicitado..." style={{width:"100%",padding:"9px 12px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif",minHeight:90,resize:"vertical"}}/>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Guardar"}</button>
        </div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto="¿Eliminar esta sugerencia?" onConfirm={()=>{del("sugerencias",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── DEVOLUCIONES ─────────────────────────────────────────────────────────────────
const MOTIVOS_DEV=["Producto vencido","Producto con poca venta","Producto con fallas"];
function Devoluciones({data,save,del,soloLectura=false,esAdmin=false}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [mes,setMes]=useState(mesActual());
  const maqActivas=data.maquinas.filter(m=>m.activa);

  // Estado para nuevo registro (multi-producto)
  const EF_HEADER={maquinaId:"",fecha:today(),motivo:MOTIVOS_DEV[0],observacion:""};
  const EF_ITEM={productoId:"",cantidad:""};
  const [formH,setFormH]=useState(EF_HEADER);
  const [items,setItems]=useState([{...EF_ITEM}]);
  const addItem=()=>setItems(i=>[...i,{...EF_ITEM}]);
  const removeItem=idx=>setItems(i=>i.filter((_,j)=>j!==idx));
  const setItem=(idx,f,v)=>setItems(i=>i.map((r,j)=>j===idx?{...r,[f]:v}:r));

  // Estado para edición individual
  const [formEdit,setFormEdit]=useState({maquinaId:"",productoId:"",motivo:MOTIVOS_DEV[0],cantidad:"",fecha:today(),observacion:""});

  const doSave=async()=>{
    if(!formH.maquinaId)return;
    const valid=items.filter(it=>it.productoId&&it.cantidad);
    if(!valid.length)return;
    for(const it of valid){
      const id=uid();
      await save("devoluciones",id,{id,maquinaId:formH.maquinaId,fecha:formH.fecha,motivo:formH.motivo,observacion:formH.observacion,productoId:it.productoId,cantidad:+it.cantidad});
    }
    setModal(false);setFormH(EF_HEADER);setItems([{...EF_ITEM}]);
  };

  const abrirEditar=(d)=>{
    setFormEdit({maquinaId:d.maquinaId,productoId:d.productoId,motivo:d.motivo,cantidad:String(d.cantidad),fecha:d.fecha,observacion:d.observacion||""});
    setEditando(d);
  };
  const doGuardarEdicion=()=>{
    if(!editando)return;
    save("devoluciones",editando.id,{...editando,...formEdit,cantidad:+formEdit.cantidad});
    setEditando(null);
  };

  const devMes=data.devoluciones.filter(d=>d.fecha?.startsWith(mes));
  const colores={"Producto vencido":"red","Producto con poca venta":"amber","Producto con fallas":"blue"};

  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      <div className="section">
        <div className="section-header">
          <h3>Devoluciones — {nombreMes(mes)}</h3>
          {!soloLectura&&<button className="btn btn-primary btn-sm" onClick={()=>{setFormH(EF_HEADER);setItems([{...EF_ITEM}]);setModal(true);}}><Icon name="plus" size={13}/> Registrar</button>}
        </div>
        {soloLectura&&<div className="view-only-badge" style={{margin:"12px 16px 0"}}><Icon name="lock" size={13}/> Solo visualización</div>}
        <div className="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Máquina</th><th>Producto</th><th>Motivo</th><th>Cantidad</th><th>Observación</th>{!soloLectura&&<th>Acciones</th>}</tr></thead>
          <tbody>
            {devMes.length===0
              ?<tr><td colSpan={soloLectura?6:7} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin devoluciones en {nombreMes(mes)}</td></tr>
              :[...devMes].reverse().map(d=>{
                const maq=data.maquinas.find(m=>m.id===d.maquinaId);
                const prod=data.productos.find(p=>p.id===d.productoId);
                const col=colores[d.motivo]||"blue";
                return(<tr key={d.id}>
                  <td style={{color:"var(--muted)",whiteSpace:"nowrap"}}>{d.fecha}</td>
                  <td><strong>{maq?.nombre||"—"}</strong><br/><span style={{fontSize:10,color:"var(--muted)"}}>{maq?.ubicacion}</span></td>
                  <td>{prod?.nombre||"—"}</td>
                  <td><span className={`badge ${col}`}>{d.motivo}</span></td>
                  <td style={{fontWeight:700}}>{d.cantidad||"—"}</td>
                  <td style={{fontSize:11,color:"var(--muted)"}}>{d.observacion||"—"}</td>
                  {!soloLectura&&<td><div style={{display:"flex",gap:5}}>
                    <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(d)}><Icon name="edit" size={12}/></button>
                    {esAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(d)}><Icon name="trash" size={12}/></button>}
                  </div></td>}
                </tr>);
              })
            }
          </tbody>
        </table></div>
      </div>

      {/* Modal nuevo registro multi-producto */}
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>Registrar devolución</h3>
        <div className="form-row">
          <div className="form-group"><label>Máquina</label>
            <select value={formH.maquinaId} onChange={e=>setFormH({...formH,maquinaId:e.target.value})}>
              <option value="">Seleccionar...</option>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Fecha</label>
            <input type="date" value={formH.fecha} onChange={e=>setFormH({...formH,fecha:e.target.value})}/>
          </div>
        </div>
        <div className="form-group"><label>Motivo (aplica a todos los productos)</label>
          <select value={formH.motivo} onChange={e=>setFormH({...formH,motivo:e.target.value})}>
            {MOTIVOS_DEV.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Productos a devolver</label>
          <div style={{background:"var(--surface2)",borderRadius:9,padding:10,border:"1px solid var(--border)"}}>
            {items.map((it,idx)=>(
              <div key={idx} className="prod-row">
                <select value={it.productoId} onChange={e=>setItem(idx,"productoId",e.target.value)}>
                  <option value="">Seleccionar producto...</option>
                  {data.productos.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <input type="number" value={it.cantidad} onChange={e=>setItem(idx,"cantidad",e.target.value)} placeholder="Cant."/>
                <button className="btn btn-danger btn-sm" style={{padding:"5px 7px"}} onClick={()=>removeItem(idx)} disabled={items.length===1}>✕</button>
              </div>
            ))}
            <button className="add-prod-btn" onClick={addItem}><Icon name="plus" size={12}/> Agregar producto</button>
          </div>
        </div>
        <div className="form-group"><label>Observación general (opcional)</label>
          <input value={formH.observacion} onChange={e=>setFormH({...formH,observacion:e.target.value})} placeholder="Ej: Productos vencidos del lote del 01/06..."/>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>Registrar</button>
        </div>
      </div></div>}

      {/* Modal editar registro individual */}
      {editando&&<div className="modal-overlay"><div className="modal">
        <h3>Editar devolución</h3>
        <div className="edit-banner">Editando devolución del {editando.fecha}</div>
        <div className="form-row">
          <div className="form-group"><label>Máquina</label>
            <select value={formEdit.maquinaId} onChange={e=>setFormEdit({...formEdit,maquinaId:e.target.value})}>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Fecha</label>
            <input type="date" value={formEdit.fecha} onChange={e=>setFormEdit({...formEdit,fecha:e.target.value})}/>
          </div>
        </div>
        <div className="form-group"><label>Producto</label>
          <select value={formEdit.productoId} onChange={e=>setFormEdit({...formEdit,productoId:e.target.value})}>
            {data.productos.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Motivo</label>
            <select value={formEdit.motivo} onChange={e=>setFormEdit({...formEdit,motivo:e.target.value})}>
              {MOTIVOS_DEV.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Cantidad</label>
            <input type="number" value={formEdit.cantidad} onChange={e=>setFormEdit({...formEdit,cantidad:e.target.value})}/>
          </div>
        </div>
        <div className="form-group"><label>Observación (opcional)</label>
          <input value={formEdit.observacion} onChange={e=>setFormEdit({...formEdit,observacion:e.target.value})}/>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setEditando(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doGuardarEdicion}>Guardar cambios</button>
        </div>
      </div></div>}

      {confirmDel&&<ConfirmDelete texto={`¿Eliminar esta devolución de "${data.productos.find(p=>p.id===confirmDel.productoId)?.nombre}"?`} onConfirm={()=>{del("devoluciones",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── PRODUCTOS ECONÓMICOS ─────────────────────────────────────────────────────────
function ProductosEco({data,save,del}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [iniciado,setIniciado]=useState(false);
  const [form,setForm]=useState({nombre:"",precioVenta:"",proveedor:"",observacion:""});

  // Auto-import from productos if productosEco is empty
  const importarDesdeProductos=()=>{
    data.productos.forEach(p=>{
      if(!data.productosEco.find(pe=>pe.origenId===p.id)){
        const id=uid();
        save("productosEco",id,{id,origenId:p.id,nombre:p.nombre,precioVenta:p.precioVenta||(p.costo*(1+p.margen/100)),proveedor:p.proveedor,observacion:""});
      }
    });
    setIniciado(true);
  };

  const abrirEditar=(p)=>{setForm({nombre:p.nombre,precioVenta:String(p.precioVenta),proveedor:p.proveedor,observacion:p.observacion||""});setEditando(p);setModal(true);};
  const abrirNuevo=()=>{setForm({nombre:"",precioVenta:"",proveedor:"",observacion:""});setEditando(null);setModal(true);};
  const doSave=()=>{
    if(!form.nombre||!form.precioVenta)return;
    if(editando)save("productosEco",editando.id,{...editando,...form,precioVenta:+form.precioVenta});
    else{const id=uid();save("productosEco",id,{id,origenId:null,...form,precioVenta:+form.precioVenta});}
    setModal(false);setForm({nombre:"",precioVenta:"",proveedor:"",observacion:""});setEditando(null);
  };
  return(
    <div>
      {data.productosEco.length===0&&(
        <div style={{background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.25)",borderRadius:12,padding:16,marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>📋 Lista independiente de precios económicos</div>
          <p style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>Esta lista es independiente de los productos principales. Puedes importar los productos actuales como base y luego editar los precios por separado.</p>
          <button className="btn btn-primary" onClick={importarDesdeProductos}><Icon name="plus" size={13}/> Importar productos actuales como base</button>
        </div>
      )}
      <div className="section">
        <div className="section-header">
          <h3>Productos económicos</h3>
          <div style={{display:"flex",gap:8}}>
            {data.productosEco.length>0&&<button className="btn btn-secondary btn-sm" onClick={importarDesdeProductos}>↻ Sincronizar nuevos</button>}
            <button className="btn btn-primary btn-sm" onClick={abrirNuevo}><Icon name="plus" size={13}/> Agregar</button>
          </div>
        </div>
        <div className="info-box" style={{margin:"12px 16px 0",fontSize:11}}>
          ⚡ Editar aquí NO modifica los productos principales ni la lista de precios normal.
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>Producto</th><th>Proveedor</th><th>Precio económico</th><th>Observación</th><th>Acciones</th></tr></thead>
          <tbody>
            {data.productosEco.length===0?<tr><td colSpan={5} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin productos económicos aún</td></tr>
            :data.productosEco.map(p=>(
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td>
                <td style={{color:"var(--muted)"}}>{p.proveedor}</td>
                <td><span className="precio-real">{fmt(p.precioVenta)}</span></td>
                <td style={{fontSize:11,color:"var(--muted)"}}>{p.observacion||"—"}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(p)}><Icon name="edit" size={12}/></button>
                  <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(p)}><Icon name="trash" size={12}/></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar producto económico":"Nuevo producto económico"}</h3>
        {editando&&<div className="edit-banner">✏️ Editando solo la lista económica — no afecta los productos principales</div>}
        <div className="form-group"><label>Nombre del producto</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Coca Cola 500ml"/></div>
        <div className="form-row">
          <div className="form-group"><label>Precio de venta económico (S/)</label><input type="number" step="0.10" value={form.precioVenta} onChange={e=>setForm({...form,precioVenta:e.target.value})} placeholder="Ej: 2.50"/></div>
          <div className="form-group"><label>Proveedor</label><input value={form.proveedor} onChange={e=>setForm({...form,proveedor:e.target.value})} placeholder="Ej: Backus"/></div>
        </div>
        <div className="form-group"><label>Observación (opcional)</label><input value={form.observacion} onChange={e=>setForm({...form,observacion:e.target.value})} placeholder="Ej: Para máquinas de zona popular"/></div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Guardar"}</button>
        </div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto={`¿Eliminar "${confirmDel.nombre}" de la lista económica?`} onConfirm={()=>{del("productosEco",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

function ListaPreciosEco({data}){
  const [busqueda,setBusqueda]=useState("");
  const conEco2=[...data.productos].sort((a,b)=>a.nombre.localeCompare(b.nombre)).filter(p=>p.precioEco&&(!busqueda||p.nombre.toLowerCase().includes(busqueda.toLowerCase())));
  return(
    <div>
      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto económico..." total={data.productos.filter(p=>p.precioEco).length} filtrado={conEco2.length}/>
    <div className="info-box">Lista de precios económicos — todos los productos con su precio reducido configurado.</div>
      <div className="section">
        <div className="section-header"><h3>Lista de precios económica</h3></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Producto</th><th>Proveedor</th><th>Precio económico</th></tr></thead>
          <tbody>
            {conEco2.length===0
              ?<tr><td colSpan={3} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin precios económicos. El administrador puede agregarlos en Productos.</td></tr>
              :conEco2.map(p=>(
                <tr key={p.id}>
                  <td><strong>{p.nombre}</strong></td>
                  <td style={{color:"var(--muted)"}}>{p.proveedor}</td>
                  <td><span className="precio-eco">{fmt(p.precioEco)}</span></td>
                </tr>
              ))
            }
          </tbody>
        </table></div>
      </div>
    </div>
  );
}


// ─── STOCK POR MÁQUINA ──────────────────────────────────────────────────────────
// Lógica:
//   Ventas calculadas = StockAnterior (residuo) + TrasladosDía - StockActual (después de abastecer)
//   El abastecedor registra: máquina, fecha, producto, residuo (antes), cantidad traslado, stock final (después)

function StockMaquina({data,save,del,soloLectura=false}){
  const [modal,setModal]=useState(false);
  const [maqId,setMaqId]=useState("");
  const [fecha,setFecha]=useState(today());
  const [filas,setFilas]=useState([]);
  const [confirmDel,setConfirmDel]=useState(null);
  const [mes,setMes]=useState(mesActual());
  const [busquedaSM,setBusquedaSM]=useState("");
  const [modalSugSM,setModalSugSM]=useState(null);
  const [sugTextoSM,setSugTextoSM]=useState("");
  // Modal mover producto entre máquinas
  const [modalMover,setModalMover]=useState(false);
  const EFM={productoId:"",maqOrigen:"",maqDestino:"",cantidad:"",fecha:today()};
  const [formMover,setFormMover]=useState(EFM);
  const doMover=async()=>{
    if(!formMover.productoId||!formMover.maqOrigen||!formMover.maqDestino||!formMover.cantidad)return;
    if(formMover.maqOrigen===formMover.maqDestino)return;
    const qty=+formMover.cantidad;
    // Registrar como traslado en colección traslados
    const tId=uid();
    await save("traslados",tId,{id:tId,fecha:formMover.fecha,maquinaId:formMover.maqDestino,productoId:formMover.productoId,cantidad:qty,responsable:"Movimiento entre máquinas",origenMaqId:formMover.maqOrigen,origenStockMaquina:false,esMovimiento:true});
    setModalMover(false);setFormMover(EFM);
  };
  const maqActivas=data.maquinas.filter(m=>m.activa);

  const abrirSugSM=(maqId,maqNombre,fecha)=>{setModalSugSM({maqId,maqNombre,fecha});setSugTextoSM("");};
  const guardarSugSM=()=>{
    if(!modalSugSM||!sugTextoSM.trim())return;
    const id=uid();
    save("sugerencias",id,{id,maquinaId:modalSugSM.maqId,mensaje:sugTextoSM.trim(),fecha:modalSugSM.fecha});
    setModalSugSM(null);setSugTextoSM("");
  };
  const getSugSM=(maqId,fecha)=>data.sugerencias.filter(s=>s.maquinaId===maqId&&s.fecha===fecha&&!s.cobId&&!s.tipo);

  // Obtener el último stockFinal registrado para una máquina+producto
  const getStockAnterior=(maqId,productoId)=>{
    const registros=data.stockMaquina
      .filter(r=>r.maquinaId===maqId&&r.registros?.some(rg=>rg.productoId===productoId))
      .sort((a,b)=>b.fecha.localeCompare(a.fecha));
    if(!registros.length)return null;
    const reg=registros[0].registros.find(rg=>rg.productoId===productoId);
    return reg?.stockFinal??null;
  };

  const abrirModal=(maq)=>{
    const mid=maq?maq.id:"";
    setMaqId(mid);
    setFecha(today());
    // Pre-cargar filas ordenadas A-Z con stock anterior automático
    setFilas([...data.productos].sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(p=>{
      const anterior=getStockAnterior(mid,p.id);
      return{productoId:p.id,stockAnterior:anterior,residuo:"",traslado:"",fechaVenc:""};
    }));
    setBusquedaSM("");
    setModal(true);
  };

  const setFila=(idx,campo,val)=>setFilas(f=>f.map((r,i)=>i===idx?{...r,[campo]:val}:r));

  // Nueva lógica:
  // Ventas = StockAnterior - Residuo
  // StockFinal = Residuo + Traslado
  const calcVentas=(f)=>{
    if(f.residuo===""||f.stockAnterior===null)return null;
    return Math.max(0,(f.stockAnterior||0)-(+f.residuo||0));
  };
  const calcStockFinal=(f)=>{
    if(f.residuo===""&&f.traslado==="")return null;
    return(+f.residuo||0)+(+f.traslado||0);
  };

  const doSave=async()=>{
    if(!maqId)return;
    const filasValidas=filas.filter(f=>f.residuo!==""||f.traslado!=="");
    if(!filasValidas.length)return;
    const id=uid();
    const registros=filasValidas.map(f=>({
      productoId:f.productoId,
      stockAnterior:f.stockAnterior,
      residuo:f.residuo!==""?+f.residuo:null,
      traslado:f.traslado!==""?+f.traslado:null,
      stockFinal:calcStockFinal(f),
      ventasCalculadas:calcVentas(f),
      fechaVenc:f.fechaVenc||null,
    }));
    await save("stockMaquina",id,{id,maquinaId:maqId,fecha,registros});
    // Guardar traslados en la colección de traslados (visible para el admin)
    for(const reg of registros){
      if(reg.traslado>0){
        const tId=uid();
        await save("traslados",tId,{id:tId,fecha,maquinaId:maqId,productoId:reg.productoId,cantidad:reg.traslado,responsable:"Abastecedor",origenStockMaquina:true,fechaVenc:reg.fechaVenc||null});
      }
    }
    // Guardar ventas calculadas automáticamente
    for(const reg of registros){
      if(reg.ventasCalculadas>0){
        const prod=data.productos.find(p=>p.id===reg.productoId);
        const precio=prod?(prod.precioVenta||(prod.costo*(1+prod.margen/100))):0;
        const vId=uid();
        await save("ventas",vId,{id:vId,fecha,maquinaId:maqId,productoId:reg.productoId,cantidad:reg.ventasCalculadas,ingreso:+(precio*reg.ventasCalculadas).toFixed(2),autoCalculado:true});
      }
    }
    setModal(false);setMaqId("");setFilas([]);
  };

  const registrosMes=(data.stockMaquina||[]).filter(r=>r.fecha?.startsWith(mes));
  const porMaq={};
  registrosMes.forEach(r=>{if(!porMaq[r.maquinaId])porMaq[r.maquinaId]=[];porMaq[r.maquinaId].push(r);});

  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      {!soloLectura&&(
        <div style={{marginBottom:16}}>
          <div style={{background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",borderRadius:10,padding:"12px 16px",fontSize:13,marginBottom:12}}>
            <strong style={{color:"var(--accent2)"}}>Nueva lógica simplificada</strong><br/>
            <span style={{color:"var(--muted)",fontSize:12}}>
              Solo llenas <strong>Residuo</strong> (lo que quedó) y <strong>Traslado</strong> (lo que pusiste).
              El sistema calcula solo: <em>Ventas = Stock anterior − Residuo</em> y <em>Stock final = Residuo + Traslado</em>.
            </span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
            {maqActivas.map(m=>(
              <button key={m.id} onClick={()=>abrirModal(m)}
                style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:3}}>{m.nombre}</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>{m.ubicacion}</div>
                <div style={{marginTop:8,fontSize:11,color:"var(--accent)"}}>+ Registrar inventario</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botón mover entre máquinas */}
      {!soloLectura&&maqActivas.length>=2&&(
        <div style={{marginBottom:14}}>
          <button className="btn btn-secondary" onClick={()=>{setFormMover(EFM);setModalMover(true);}}>
            <Icon name="transfer" size={14}/> Mover producto entre máquinas
          </button>
        </div>
      )}

      {/* Historial */}
      {Object.keys(porMaq).length===0
        ?<div className="section"><div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Sin registros en {nombreMes(mes)}.</div></div>
        :Object.entries(porMaq).map(([mId,regs])=>{
          const maq=data.maquinas.find(m=>m.id===mId);
          return(
            <div key={mId} className="section" style={{marginBottom:14}}>
              <div className="section-header">
                <h3>📍 {maq?.nombre||mId} <span style={{fontSize:11,fontWeight:400,color:"var(--muted)"}}>{maq?.ubicacion}</span></h3>
                {(()=>{
                  const ultimoReg=[...regs].sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
                  const sugs=getSugSM(mId,ultimoReg?.fecha||"");
                  return sugs.length>0
                    ?<button onClick={()=>{setModalSugSM({maqId:mId,maqNombre:maq?.nombre||"",fecha:ultimoReg.fecha});setSugTextoSM(sugs[0].mensaje);}}
                        style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:"rgba(245,158,11,.15)",color:"var(--accent)"}}>
                        💡 Ver sugerencia
                      </button>
                    :<button onClick={()=>abrirSugSM(mId,maq?.nombre||"",ultimoReg?.fecha||today())}
                        style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,border:"1px dashed var(--muted)",cursor:"pointer",fontSize:11,fontWeight:600,background:"transparent",color:"var(--muted)"}}>
                        💡 Agregar sugerencia
                      </button>;
                })()}
              </div>
              <div className="table-wrap"><table>
                <thead><tr><th>Fecha</th><th>Producto</th><th>Stock anterior</th><th>Residuo</th><th>Traslado</th><th>F.Vencimiento</th><th>Stock final</th><th>Ventas</th>{!soloLectura&&<th></th>}</tr></thead>
                <tbody>
                  {[...regs].reverse().flatMap(r=>
                    r.registros.map((reg,i)=>{
                      const prod=data.productos.find(p=>p.id===reg.productoId);
                      const vc=reg.ventasCalculadas;
                      return(
                        <tr key={`${r.id}-${i}`}>
                          {i===0&&<td rowSpan={r.registros.length} style={{color:"var(--muted)",verticalAlign:"middle"}}>{r.fecha}</td>}
                          <td><strong>{prod?.nombre||"—"}</strong></td>
                          <td style={{color:"var(--muted)"}}>{reg.stockAnterior??<span style={{color:"var(--muted)",fontSize:11}}>—</span>}</td>
                          <td style={{color:"var(--muted)"}}>{reg.residuo??<span style={{fontSize:11}}>—</span>}</td>
                          <td style={{color:"var(--accent2)"}}>{reg.traslado??<span style={{fontSize:11}}>—</span>}</td>
                          <td>{(()=>{
                            if(!reg.fechaVenc)return<span style={{color:"var(--muted)",fontSize:11}}>—</span>;
                            const dias=Math.ceil((new Date(reg.fechaVenc)-new Date())/(1000*60*60*24));
                            return<span style={{fontSize:11,fontWeight:600,color:dias<=7?"var(--red)":dias<=30?"var(--accent)":"var(--muted)"}}>{reg.fechaVenc}{dias<=30&&<span style={{marginLeft:3,fontSize:9}}>{dias<=0?"⚠️Vencido":dias<=7?`⚠️${dias}d`:`⚡${dias}d`}</span>}</span>;
                          })()}</td>
                          <td style={{fontWeight:700}}>{reg.stockFinal??<span style={{fontSize:11}}>—</span>}</td>
                          <td><span style={{fontWeight:700,color:vc>0?"var(--green)":vc===0?"var(--muted)":"var(--muted)"}}>{vc!=null?`${vc} uds`:"—"}</span></td>
                          {!soloLectura&&i===0&&<td rowSpan={r.registros.length} style={{verticalAlign:"middle"}}>
                            <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(r)}><Icon name="trash" size={12}/></button>
                          </td>}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table></div>
            </div>
          );
        })
      }

      {/* Modal registro inventario */}
      {modal&&<div className="modal-overlay"><div className="modal" style={{maxWidth:680}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <h3 style={{margin:0}}>📋 Registrar inventario de máquina</h3>
          <button onClick={()=>setModal(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",padding:4,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,lineHeight:1}} onMouseEnter={e=>e.currentTarget.style.color="var(--text)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}>✕</button>
        </div>
        <div className="form-row" style={{marginBottom:14}}>
          <div className="form-group"><label>Máquina</label>
            <select value={maqId} onChange={e=>{setMaqId(e.target.value);const m=maqActivas.find(m=>m.id===e.target.value);if(m)abrirModal(m);}}>
              <option value="">Seleccionar...</option>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Fecha de visita</label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/></div>
        </div>
        {/* Buscador */}
        <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--surface2)",border:`1px solid ${busquedaSM?"var(--accent)":"var(--border)"}`,borderRadius:9,padding:"8px 12px",marginBottom:10,transition:"border-color .15s"}}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={busquedaSM?"var(--accent)":"var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={busquedaSM} onChange={e=>setBusquedaSM(e.target.value)}
            placeholder="Buscar producto..."
            style={{background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:13,width:"100%",fontFamily:"'DM Sans',sans-serif"}}/>
          {busquedaSM&&<button onClick={()=>setBusquedaSM("")} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:16,padding:0,lineHeight:1,flexShrink:0}}>✕</button>}
        </div>
        {/* Cabecera referencia */}
        <div style={{display:"flex",gap:6,padding:"6px 12px",background:"var(--surface2)",borderRadius:7,marginBottom:8,fontSize:9,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>
          <span style={{flex:1}}>Producto — Residuo / Traslado / Final / Ventas</span>
          <span style={{color:"var(--accent)"}}>Solo llena Residuo y Traslado</span>
        </div>
        <div style={{maxHeight:380,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
          {filas.map((f,realIdx)=>{
            // Filtrar por búsqueda usando el índice REAL para setFila
            const prod=data.productos.find(p=>p.id===f.productoId);
            if(busquedaSM&&!prod?.nombre.toLowerCase().includes(busquedaSM.toLowerCase()))return null;
            const vc=calcVentas(f);
            const sf=calcStockFinal(f);
            const tieneActividad=f.residuo!==""||f.traslado!=="";
            return(
              <div key={f.productoId} style={{background:tieneActividad?"rgba(245,158,11,.06)":"var(--surface2)",borderRadius:9,padding:"10px 12px",border:tieneActividad?"1px solid rgba(245,158,11,.2)":"1px solid var(--border)",marginBottom:2}}>
                {/* Nombre del producto */}
                <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"var(--text)"}}>{prod?.nombre||"—"}</div>
                {/* Grid de campos */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:f.traslado!==""&&+f.traslado>0?8:0}}>
                  {/* Stock anterior — solo lectura */}
                  <div style={{background:"var(--surface)",borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",marginBottom:3}}>Anterior</div>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--muted)"}}>{f.stockAnterior!==null?f.stockAnterior:"—"}</div>
                  </div>
                  {/* Residuo — editable con índice REAL */}
                  <div style={{background:"var(--surface)",borderRadius:6,padding:"6px 8px"}}>
                    <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",marginBottom:3}}>Residuo</div>
                    <input type="number" min="0" value={f.residuo} onChange={e=>setFila(realIdx,"residuo",e.target.value)} placeholder="0"
                      style={{padding:"3px 0",background:"none",border:"none",borderBottom:"2px solid var(--border)",color:"var(--text)",fontSize:14,fontWeight:700,outline:"none",width:"100%",textAlign:"center"}}/>
                  </div>
                  {/* Traslado — editable con índice REAL */}
                  <div style={{background:"rgba(59,130,246,.07)",borderRadius:6,padding:"6px 8px",border:"1px solid rgba(59,130,246,.2)"}}>
                    <div style={{fontSize:9,color:"var(--accent2)",textTransform:"uppercase",marginBottom:3}}>Traslado</div>
                    <input type="number" min="0" value={f.traslado} onChange={e=>setFila(realIdx,"traslado",e.target.value)} placeholder="0"
                      style={{padding:"3px 0",background:"none",border:"none",borderBottom:"2px solid rgba(59,130,246,.4)",color:"var(--text)",fontSize:14,fontWeight:700,outline:"none",width:"100%",textAlign:"center"}}/>
                  </div>
                  {/* Stock final — calculado */}
                  <div style={{background:"var(--surface)",borderRadius:6,padding:"6px 8px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",marginBottom:3}}>Final</div>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{sf!==null?sf:"—"}</div>
                  </div>
                  {/* Ventas calculadas */}
                  <div style={{background:vc>0?"rgba(16,185,129,.08)":"var(--surface)",borderRadius:6,padding:"6px 8px",textAlign:"center",border:vc>0?"1px solid rgba(16,185,129,.2)":"none"}}>
                    <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",marginBottom:3}}>Ventas</div>
                    <div style={{fontSize:13,fontWeight:700,color:vc>0?"var(--green)":"var(--muted)"}}>{vc!==null?vc:"—"}</div>
                  </div>
                </div>
                {/* Fecha vencimiento — solo si hay traslado */}
                {f.traslado!==""&&+f.traslado>0&&(
                  <div style={{marginTop:6}}>
                    <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",marginBottom:3}}>F. Vencimiento</div>
                    <input type="date" value={f.fechaVenc||""} onChange={e=>setFila(realIdx,"fechaVenc",e.target.value)}
                      style={{padding:"5px 8px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:6,color:f.fechaVenc?"var(--accent)":"var(--muted)",fontSize:12,outline:"none",width:"100%"}}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{marginTop:10,padding:"9px 12px",background:"var(--surface2)",borderRadius:8,fontSize:11,color:"var(--muted)"}}>
          💡 <strong>Ant.</strong>: stock del registro anterior (automático) &nbsp;|&nbsp; <strong>Residuo</strong>: cuánto quedó en la máquina &nbsp;|&nbsp; <strong>Traslado</strong>: cuánto pusiste
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>Guardar y registrar ventas</button>
        </div>
      </div></div>}
      {/* Modal sugerencia */}
      {modalSugSM&&<div className="modal-overlay">
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"24px 22px",width:"90%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:"rgba(245,158,11,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>💡</div>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>Sugerencia</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>Máquina: <strong style={{color:"var(--accent)"}}>{modalSugSM.maqNombre}</strong> — {modalSugSM.fecha}</div>
              </div>
            </div>
            <CloseBtn onClick={()=>setModalSugSM(null)}/>
          </div>
          <div className="form-group" style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:600,color:"var(--muted)",letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6}}>Tu sugerencia o comentario</label>
            <textarea autoFocus value={sugTextoSM} onChange={e=>setSugTextoSM(e.target.value)}
              placeholder="Ej: Agregar producto nuevo, revisar precios..."
              style={{width:"100%",padding:"10px 13px",background:"var(--surface2)",border:`1px solid ${sugTextoSM.trim()?"var(--accent)":"var(--border)"}`,borderRadius:9,color:"var(--text)",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",minHeight:90,resize:"vertical",transition:"border-color .15s"}}/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setModalSugSM(null)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",fontSize:13,fontWeight:600}}>Cancelar</button>
            <button onClick={guardarSugSM} style={{padding:"8px 20px",borderRadius:8,border:"none",background:sugTextoSM.trim()?"var(--accent)":"var(--border)",color:sugTextoSM.trim()?"#000":"var(--muted)",cursor:sugTextoSM.trim()?"pointer":"default",fontSize:13,fontWeight:700}}>Guardar</button>
          </div>
        </div>
      </div>}
      {/* Modal mover producto entre máquinas */}
      {modalMover&&<div className="modal-overlay"><div className="modal" style={{maxWidth:440}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <h3 style={{margin:0}}>🔄 Mover producto entre máquinas</h3>
          <button onClick={()=>setModalMover(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",padding:4,borderRadius:6,display:"flex",fontSize:20,lineHeight:1}}>✕</button>
        </div>
        <div className="info-box" style={{fontSize:12,marginBottom:14}}>
          Registra el movimiento de unidades de una máquina a otra. Quedará en el historial de traslados del admin.
        </div>
        <div className="form-group"><label>Producto</label>
          <select value={formMover.productoId} onChange={e=>setFormMover({...formMover,productoId:e.target.value})}>
            <option value="">Seleccionar...</option>
            {[...data.productos].sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Máquina origen (sale de aquí)</label>
            <select value={formMover.maqOrigen} onChange={e=>setFormMover({...formMover,maqOrigen:e.target.value})}>
              <option value="">Seleccionar...</option>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Máquina destino (va aquí)</label>
            <select value={formMover.maqDestino} onChange={e=>setFormMover({...formMover,maqDestino:e.target.value})}>
              <option value="">Seleccionar...</option>
              {maqActivas.filter(m=>m.id!==formMover.maqOrigen).map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Cantidad a mover</label>
            <input type="number" min="1" value={formMover.cantidad} onChange={e=>setFormMover({...formMover,cantidad:e.target.value})} placeholder="0"/>
          </div>
          <div className="form-group"><label>Fecha</label>
            <input type="date" value={formMover.fecha} onChange={e=>setFormMover({...formMover,fecha:e.target.value})}/>
          </div>
        </div>
        {formMover.maqOrigen&&formMover.maqOrigen===formMover.maqDestino&&(
          <div style={{color:"var(--red)",fontSize:12,marginBottom:8}}>⚠️ Origen y destino no pueden ser la misma máquina</div>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModalMover(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doMover}
            disabled={!formMover.productoId||!formMover.maqOrigen||!formMover.maqDestino||!formMover.cantidad||formMover.maqOrigen===formMover.maqDestino}>
            Registrar movimiento
          </button>
        </div>
      </div></div>}

      {confirmDel&&<ConfirmDelete texto="¿Eliminar este registro? Las ventas generadas no se eliminarán." onConfirm={()=>{del("stockMaquina",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO: TICKETS DE MANTENIMIENTO
// ═══════════════════════════════════════════════════════════════════════════════
const ESTADOS_TICKET=["Abierto","En proceso","Resuelto"];
const COLOR_ESTADO={"Abierto":"red","En proceso":"amber","Resuelto":"green"};
const TIPOS_FALLA=["Dispensador trabado","Pantalla no funciona","No acepta monedas","No da cambio","Producto atascado","Falla eléctrica","Puerta no cierra","Otro"];

function Tickets({data,save,del,esAdmin=false}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [filtroEstado,setFiltroEstado]=useState("todos");
  const [busqueda,setBusqueda]=useState("");
  const EF={maquinaId:"",tipo:"Dispensador trabado",descripcion:"",prioridad:"Media",estado:"Abierto",fecha:today(),fechaResolucion:"",notas:""};
  const [form,setForm]=useState(EF);

  const doSave=()=>{
    if(!form.maquinaId||!form.descripcion)return;
    if(editando)save("tickets",editando.id,{...editando,...form});
    else{const id=uid();save("tickets",id,{id,...form});}
    setModal(false);setForm(EF);setEditando(null);
  };
  const abrirEditar=(t)=>{setForm({maquinaId:t.maquinaId,tipo:t.tipo,descripcion:t.descripcion,prioridad:t.prioridad,estado:t.estado,fecha:t.fecha,fechaResolucion:t.fechaResolucion||"",notas:t.notas||""});setEditando(t);setModal(true);};
  const cambiarEstado=(t,nuevoEstado)=>save("tickets",t.id,{...t,estado:nuevoEstado,fechaResolucion:nuevoEstado==="Resuelto"?today():t.fechaResolucion});

  const ticketsFiltrados=(data.tickets||[]).filter(t=>{
    const maq=data.maquinas.find(m=>m.id===t.maquinaId);
    const matchEstado=filtroEstado==="todos"||t.estado===filtroEstado;
    const matchBusq=!busqueda||maq?.nombre.toLowerCase().includes(busqueda.toLowerCase())||t.tipo.toLowerCase().includes(busqueda.toLowerCase())||t.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado&&matchBusq;
  }).sort((a,b)=>b.fecha.localeCompare(a.fecha));

  const abiertos=(data.tickets||[]).filter(t=>t.estado==="Abierto").length;
  const enProceso=(data.tickets||[]).filter(t=>t.estado==="En proceso").length;
  const resueltos=(data.tickets||[]).filter(t=>t.estado==="Resuelto").length;
  const PRIOR_COLOR={Alta:"red",Media:"amber",Baja:"blue"};

  return(
    <div>
      <div className="cards">
        {[["🔴 Abiertos",abiertos,"red"],["🟡 En proceso",enProceso,"amber"],["✅ Resueltos",resueltos,"green"]].map(([l,v,col])=>(
          <div key={l} className="card"><div className="card-label">{l}</div><div className={`card-value ${col}`}>{v}</div><div className="card-sub">tickets</div></div>
        ))}
      </div>
      <div style={{marginBottom:14}}>
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por máquina, tipo o descripción..."/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {["todos",...ESTADOS_TICKET].map(e=>(
            <button key={e} onClick={()=>setFiltroEstado(e)}
              style={{padding:"5px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:filtroEstado===e?"var(--accent)":"var(--surface2)",color:filtroEstado===e?"#000":"var(--muted)"}}>
              {e==="todos"?"Todos":e}
            </button>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button className="btn btn-primary btn-sm" onClick={()=>{setForm(EF);setEditando(null);setModal(true);}}><Icon name="plus" size={13}/> Nuevo ticket</button>
        </div>
      </div>

      {ticketsFiltrados.length===0
        ?<div className="section"><div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Sin tickets{filtroEstado!=="todos"?` con estado "${filtroEstado}"`:""}.</div></div>
        :ticketsFiltrados.map(t=>{
          const maq=data.maquinas.find(m=>m.id===t.maquinaId);
          return(
            <div key={t.id} className="section" style={{marginBottom:12}}>
              <div style={{padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <span className={`badge ${COLOR_ESTADO[t.estado]||"blue"}`}>{t.estado}</span>
                      <span className={`badge ${PRIOR_COLOR[t.prioridad]||"blue"}`}>{t.prioridad}</span>
                      <span style={{fontSize:11,color:"var(--muted)"}}>{t.fecha}</span>
                      {t.fechaResolucion&&<span style={{fontSize:11,color:"var(--green)"}}>✅ Resuelto: {t.fechaResolucion}</span>}
                    </div>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>📍 {maq?.nombre||"—"} <span style={{fontWeight:400,fontSize:11,color:"var(--muted)"}}>{maq?.ubicacion}</span></div>
                    <div style={{fontSize:12,color:"var(--accent)",marginBottom:4}}>{t.tipo}</div>
                    <div style={{fontSize:13,lineHeight:1.5}}>{t.descripcion}</div>
                    {t.notas&&<div style={{fontSize:11,color:"var(--muted)",marginTop:5,fontStyle:"italic"}}>📝 {t.notas}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {ESTADOS_TICKET.filter(e=>e!==t.estado).map(e=>(
                        <button key={e} onClick={()=>cambiarEstado(t,e)}
                          style={{padding:"4px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",fontSize:10,fontWeight:600,color:"var(--muted)"}}>
                          → {e}
                        </button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(t)}><Icon name="edit" size={12}/></button>
                      {esAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(t)}><Icon name="trash" size={12}/></button>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      }

      {modal&&<div className="modal-overlay">
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"24px 22px",width:"90%",maxWidth:540,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <div style={{width:40,height:40,borderRadius:10,background:"rgba(239,68,68,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🔧</div>
            <div>
              <div style={{fontSize:16,fontWeight:700}}>{editando?"Editar ticket":"Nuevo ticket"}</div>
              {editando&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Ticket #{editando.id?.slice(-4)}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Máquina</label>
              <select value={form.maquinaId} onChange={e=>setForm({...form,maquinaId:e.target.value})}>
                <option value="">Seleccionar...</option>
                {data.maquinas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Tipo de falla</label>
              <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
                {TIPOS_FALLA.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Prioridad</label>
              <div style={{display:"flex",gap:6}}>
                {["Alta","Media","Baja"].map(p=>{
                  const col={Alta:"var(--red)",Media:"var(--accent)",Baja:"var(--accent2)"}[p];
                  const sel=form.prioridad===p;
                  return(<button key={p} onClick={()=>setForm({...form,prioridad:p})}
                    style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${sel?col:"var(--border)"}`,background:sel?`${col}20`:"var(--surface2)",color:sel?col:"var(--muted)",cursor:"pointer",fontSize:12,fontWeight:700,transition:"all .15s"}}>
                    {p}
                  </button>);
                })}
              </div>
            </div>
          </div>
          <div className="form-group"><label>Descripción del problema</label>
            <textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}
              placeholder="Describe el problema con detalle..."
              style={{minHeight:80,resize:"vertical",width:"100%",padding:"9px 12px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
          </div>
          {editando&&<div className="form-row">
            <div className="form-group"><label>Estado</label>
              <div style={{display:"flex",gap:6}}>
                {ESTADOS_TICKET.map(e=>{
                  const col={"Abierto":"var(--red)","En proceso":"var(--accent)","Resuelto":"var(--green)"}[e];
                  const sel=form.estado===e;
                  return(<button key={e} onClick={()=>setForm({...form,estado:e})}
                    style={{flex:1,padding:"6px 4px",borderRadius:8,border:`2px solid ${sel?col:"var(--border)"}`,background:sel?`${col}20`:"var(--surface2)",color:sel?col:"var(--muted)",cursor:"pointer",fontSize:10,fontWeight:700,transition:"all .15s"}}>
                    {e}
                  </button>);
                })}
              </div>
            </div>
            <div className="form-group"><label>Fecha resolución</label><input type="date" value={form.fechaResolucion} onChange={e=>setForm({...form,fechaResolucion:e.target.value})}/></div>
          </div>}
          <div className="form-group"><label>Notas adicionales (opcional)</label>
            <input value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Ej: Revisar resorte del dispensador 3..."/>
          </div>
          <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:16}}>
            <button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button>
            <button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Crear ticket"}</button>
          </div>
        </div>
      </div>}
      {confirmDel&&<ConfirmDelete texto="¿Eliminar este ticket?" onConfirm={()=>{del("tickets",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO: CONTROL DE SENCILLO
// ═══════════════════════════════════════════════════════════════════════════════
const MONEDAS=[0.10,0.20,0.50,1.00,2.00,5.00];

function ControlSencillo({data,save,del,esAdmin=false}){
  const [modalEntregar,setModalEntregar]=useState(false);
  const [modalUso,setModalUso]=useState(null);
  const [modalDev,setModalDev]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [mes,setMes]=useState(mesActual());
  const [fMonedas,setFMonedas]=useState(MONEDAS.reduce((o,m)=>({...o,[m]:""}),{}));
  const [fAbas,setFAbas]=useState("");
  const [fFecha,setFFecha]=useState(today());
  const [fNota,setFNota]=useState("");
  const [uMaqId,setUMaqId]=useState("");
  const [uMonedas,setUMonedas]=useState(MONEDAS.reduce((o,m)=>({...o,[m]:""}),{}));
  const [uFecha,setUFecha]=useState(today());
  const [dMonedas,setDMonedas]=useState(MONEDAS.reduce((o,m)=>({...o,[m]:""}),{}));
  const [dFecha,setDFecha]=useState(today());
  const maqActivas=data.maquinas.filter(m=>m.activa);
  const totalMonedas=(obj)=>MONEDAS.reduce((s,m)=>s+(+obj[m]||0)*m,0);

  const doEntregar=()=>{
    const total=totalMonedas(fMonedas);
    if(total<=0)return;
    const id=uid();
    const detalle=MONEDAS.filter(m=>+fMonedas[m]>0).map(m=>({moneda:m,cantidad:+fMonedas[m],subtotal:+(+fMonedas[m]*m).toFixed(2)}));
    save("sencillo",id,{id,fecha:fFecha,responsable:fAbas,totalEntregado:+total.toFixed(2),detalle,usos:[],devolucion:null,nota:fNota,cerrado:false});
    setModalEntregar(false);
    setFMonedas(MONEDAS.reduce((o,m)=>({...o,[m]:""}),{}));setFAbas("");setFNota("");setFFecha(today());
  };

  const doRegistrarUso=(reg)=>{
    const total=totalMonedas(uMonedas);
    if(total<=0||!uMaqId)return;
    const maq=maqActivas.find(m=>m.id===uMaqId);
    const detalle=MONEDAS.filter(m=>+uMonedas[m]>0).map(m=>({moneda:m,cantidad:+uMonedas[m],subtotal:+(+uMonedas[m]*m).toFixed(2)}));
    const nuevosUsos=[...(reg.usos||[]),{fecha:uFecha,maquinaId:uMaqId,maqNombre:maq?.nombre||"",total:+total.toFixed(2),detalle}];
    save("sencillo",reg.id,{...reg,usos:nuevosUsos});
    setModalUso(null);setUMaqId("");setUFecha(today());setUMonedas(MONEDAS.reduce((o,m)=>({...o,[m]:""}),{}));
  };

  const doRegistrarDevolucion=(reg)=>{
    const total=totalMonedas(dMonedas);
    if(total<=0)return;
    const detalle=MONEDAS.filter(m=>+dMonedas[m]>0).map(m=>({moneda:m,cantidad:+dMonedas[m],subtotal:+(+dMonedas[m]*m).toFixed(2)}));
    save("sencillo",reg.id,{...reg,devolucion:{fecha:dFecha,total:+total.toFixed(2),detalle},cerrado:true});
    setModalDev(null);setDFecha(today());setDMonedas(MONEDAS.reduce((o,m)=>({...o,[m]:""}),{}));
  };

  const MonedasInput=({valores,onChange,label})=>(
    <div style={{background:"var(--surface2)",borderRadius:9,padding:"12px 14px",border:"1px solid var(--border)",marginBottom:10}}>
      <div style={{fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",marginBottom:10}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {MONEDAS.map(m=>(
          <div key={m} style={{background:"var(--surface)",borderRadius:7,padding:"8px 10px",border:"1px solid var(--border)"}}>
            <div style={{fontSize:10,color:"var(--muted)",marginBottom:4}}>S/ {m.toFixed(2)}</div>
            <input type="number" min="0" value={valores[m]} onChange={e=>onChange({...valores,[m]:e.target.value})} placeholder="0"
              style={{width:"100%",background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}/>
            {+valores[m]>0&&<div style={{fontSize:9,color:"var(--accent)",marginTop:2}}>= S/ {(+valores[m]*m).toFixed(2)}</div>}
          </div>
        ))}
      </div>
      <div style={{marginTop:10,padding:"6px 10px",background:"rgba(245,158,11,.1)",borderRadius:7,fontSize:12,fontWeight:700,color:"var(--accent)"}}>
        Total: {fmt(totalMonedas(valores))}
      </div>
    </div>
  );

  const sencilloMes=(data.sencillo||[]).filter(s=>s.fecha?.startsWith(mes));

  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      <div className="cards">
        <div className="card"><div className="card-label">Entregado</div><div className="card-value amber">{fmt(sencilloMes.reduce((s,r)=>s+(r.totalEntregado||0),0))}</div><div className="card-sub">{sencilloMes.length} entregas</div></div>
        <div className="card"><div className="card-label">Usado en máquinas</div><div className="card-value blue">{fmt(sencilloMes.reduce((s,r)=>s+(r.usos||[]).reduce((a,u)=>a+(u.total||0),0),0))}</div></div>
        <div className="card"><div className="card-label">Devuelto</div><div className="card-value green">{fmt(sencilloMes.reduce((s,r)=>s+(r.devolucion?.total||0),0))}</div></div>
      </div>
      {esAdmin&&<div style={{marginBottom:14}}><button className="btn btn-primary" onClick={()=>setModalEntregar(true)}><Icon name="plus" size={14}/> Entregar sencillo al abastecedor</button></div>}
      {sencilloMes.length===0
        ?<div className="section"><div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Sin registros en {nombreMes(mes)}.</div></div>
        :sencilloMes.map(reg=>{
          const totalUsado=(reg.usos||[]).reduce((s,u)=>s+(u.total||0),0);
          const totalDev=reg.devolucion?.total||0;
          const diferencia=+(reg.totalEntregado-totalUsado-totalDev).toFixed(2);
          const cuadra=Math.abs(diferencia)<0.01;
          return(
            <div key={reg.id} className="section" style={{marginBottom:14}}>
              <div className="section-header">
                <div>
                  <h3>💵 {reg.fecha} <span style={{fontWeight:400,fontSize:12,color:"var(--muted)"}}>— {reg.responsable||"Sin responsable"}</span></h3>
                  {reg.nota&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{reg.nota}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:reg.cerrado?"rgba(16,185,129,.15)":"rgba(245,158,11,.15)",color:reg.cerrado?"var(--green)":"var(--accent)"}}>
                    {reg.cerrado?"✅ Liquidado":"⏳ Pendiente"}
                  </span>
                  {esAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(reg)}><Icon name="trash" size={12}/></button>}
                </div>
              </div>
              <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,borderBottom:"1px solid var(--border)"}}>
                {[["Entregado",fmt(reg.totalEntregado),"var(--accent)"],["Usado",fmt(totalUsado),"var(--accent2)"],["Devuelto",fmt(totalDev),"var(--green)"],["Diferencia",fmt(diferencia),cuadra?"var(--green)":"var(--red)"]].map(([l,v,col])=>(
                  <div key={l} style={{background:"var(--surface2)",borderRadius:8,padding:"8px 12px"}}>
                    <div style={{fontSize:10,color:"var(--muted)",marginBottom:3}}>{l}</div>
                    <div style={{fontSize:14,fontWeight:700,color:col}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Detalle entregado</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {(reg.detalle||[]).map((d,i)=>(
                    <span key={i} style={{padding:"3px 9px",borderRadius:20,background:"rgba(245,158,11,.12)",color:"var(--accent)",fontSize:11,fontWeight:600}}>
                      {d.cantidad}× S/{d.moneda.toFixed(2)} = {fmt(d.subtotal)}
                    </span>
                  ))}
                </div>
              </div>
              {(reg.usos||[]).length>0&&<div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Usado en máquinas</div>
                {reg.usos.map((u,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:4,padding:"6px 10px",background:"rgba(59,130,246,.06)",borderRadius:7,fontSize:12}}>
                    <span><strong>{u.maqNombre}</strong> — {u.fecha}</span>
                    <span style={{fontWeight:700,color:"var(--accent2)"}}>{fmt(u.total)}</span>
                  </div>
                ))}
              </div>}
              {reg.devolucion&&<div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Devolución</div>
                <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:"rgba(16,185,129,.08)",borderRadius:7,fontSize:12}}>
                  <span>Devuelto el {reg.devolucion.fecha}</span>
                  <span style={{fontWeight:700,color:"var(--green)"}}>{fmt(reg.devolucion.total)}</span>
                </div>
              </div>}
              {!reg.cerrado&&<div style={{padding:"10px 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
                <button className="btn btn-secondary btn-sm" onClick={()=>{setModalUso(reg);setUMaqId("");setUFecha(today());setUMonedas(MONEDAS.reduce((o,m)=>({...o,[m]:""}),{}));}}>
                  <Icon name="machine" size={12}/> Uso en máquina
                </button>
                <button className="btn btn-secondary btn-sm" onClick={()=>{setModalDev(reg);setDFecha(today());setDMonedas(MONEDAS.reduce((o,m)=>({...o,[m]:""}),{}));}}>
                  <Icon name="money" size={12}/> Registrar devolución
                </button>
              </div>}
            </div>
          );
        })
      }
      {modalEntregar&&<div className="modal-overlay"><div className="modal" style={{maxWidth:520}}>
        <h3>💵 Entregar sencillo</h3>
        <div className="form-row">
          <div className="form-group"><label>Responsable</label><input value={fAbas} onChange={e=>setFAbas(e.target.value)} placeholder="Nombre del abastecedor"/></div>
          <div className="form-group"><label>Fecha</label><input type="date" value={fFecha} onChange={e=>setFFecha(e.target.value)}/></div>
        </div>
        <MonedasInput valores={fMonedas} onChange={setFMonedas} label="Monedas entregadas"/>
        <div className="form-group"><label>Nota (opcional)</label><input value={fNota} onChange={e=>setFNota(e.target.value)} placeholder="Ej: Para máquinas del centro..."/></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModalEntregar(false)}>Cancelar</button><button className="btn btn-primary" onClick={doEntregar}>Registrar entrega</button></div>
      </div></div>}
      {modalUso&&<div className="modal-overlay"><div className="modal" style={{maxWidth:520}}>
        <h3>Uso de sencillo en máquina</h3>
        <div className="edit-banner">Saldo aprox.: {fmt(modalUso.totalEntregado-(modalUso.usos||[]).reduce((s,u)=>s+(u.total||0),0))}</div>
        <div className="form-row">
          <div className="form-group"><label>Máquina</label>
            <select value={uMaqId} onChange={e=>setUMaqId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Fecha</label><input type="date" value={uFecha} onChange={e=>setUFecha(e.target.value)}/></div>
        </div>
        <MonedasInput valores={uMonedas} onChange={setUMonedas} label="Monedas usadas"/>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModalUso(null)}>Cancelar</button><button className="btn btn-primary" onClick={()=>doRegistrarUso(modalUso)}>Guardar</button></div>
      </div></div>}
      {modalDev&&<div className="modal-overlay"><div className="modal" style={{maxWidth:520}}>
        <h3>Devolución de sencillo</h3>
        <div className="edit-banner">Entregado: {fmt(modalDev.totalEntregado)} | Usado: {fmt((modalDev.usos||[]).reduce((s,u)=>s+(u.total||0),0))}</div>
        <div className="form-group"><label>Fecha</label><input type="date" value={dFecha} onChange={e=>setDFecha(e.target.value)}/></div>
        <MonedasInput valores={dMonedas} onChange={setDMonedas} label="Monedas devueltas"/>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModalDev(null)}>Cancelar</button><button className="btn btn-primary" onClick={()=>doRegistrarDevolucion(modalDev)}>Confirmar</button></div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto="¿Eliminar este registro de sencillo?" onConfirm={()=>{del("sencillo",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO 2: PRE-KIT DE REPOSICIÓN
// ═══════════════════════════════════════════════════════════════════════════════
function PreKit({data}){
  const [maqId,setMaqId]=useState("");
  const maqActivas=data.maquinas.filter(m=>m.activa);

  // Calcular pre-kit para una máquina:
  // Stock actual en máquina = último registro de StockMaquina (stockFinal)
  // Necesita = capacidad estimada - stock actual (usamos el último stockFinal como referencia)
  // Si no hay registro de StockMaquina, asumimos que está vacía

  const calcularPreKit=(maqId)=>{
    if(!maqId)return[];
    // Obtener último registro de stock por máquina para esta máquina
    const registros=data.stockMaquina.filter(r=>r.maquinaId===maqId).sort((a,b)=>b.fecha.localeCompare(a.fecha));
    const ultimoReg=registros[0];

    return data.productos.map(prod=>{
      let stockActual=0;
      let ultimaFecha="—";
      if(ultimoReg){
        const regProd=ultimoReg.registros?.find(r=>r.productoId===prod.id);
        if(regProd){stockActual=regProd.stockFinal??0;ultimaFecha=ultimoReg.fecha;}
      }
      // Stock en almacén disponible
      const stockAlm=data.stock.find(s=>s.productoId===prod.id);
      const disponible=stockAlm?.cantidad||0;
      // Ventas promedio últimos 30 días en esta máquina
      const hace30=new Date();hace30.setDate(hace30.getDate()-30);
      const ventasMaq=data.ventas.filter(v=>v.maquinaId===maqId&&v.productoId===prod.id&&new Date(v.fecha)>=hace30);
      const totalVentas=ventasMaq.reduce((s,v)=>s+(v.cantidad||0),0);
      const promDiario=+(totalVentas/30).toFixed(1);
      // Sugerir llevar para 7 días de ventas menos lo que ya hay en máquina
      const sugerido=Math.max(0,Math.ceil(promDiario*7)-stockActual);
      return{prod,stockActual,ultimaFecha,disponible,promDiario,sugerido};
    }).filter(r=>r.sugerido>0||r.stockActual>0||r.disponible>0);
  };

  const kit=calcularPreKit(maqId);
  const maq=data.maquinas.find(m=>m.id===maqId);
  const totalSugerido=kit.reduce((s,r)=>s+r.sugerido,0);
  const alertaStock=kit.filter(r=>r.sugerido>r.disponible);

  return(
    <div>
      <div style={{background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",borderRadius:10,padding:"12px 16px",fontSize:13,marginBottom:16}}>
        <strong style={{color:"var(--accent2)"}}>¿Cómo funciona el Pre-Kit?</strong><br/>
        <span style={{color:"var(--muted)",fontSize:12}}>
          Selecciona una máquina y el sistema calcula automáticamente qué productos llevar basándose en el stock actual de la máquina y el promedio de ventas de los últimos 30 días (para 7 días de cobertura).
        </span>
      </div>

      <div className="form-group" style={{marginBottom:16}}>
        <label>Seleccionar máquina para pre-kit</label>
        <select value={maqId} onChange={e=>setMaqId(e.target.value)} style={{width:"100%",padding:"9px 12px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,outline:"none"}}>
          <option value="">Seleccionar máquina...</option>
          {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
        </select>
      </div>

      {maqId&&(
        <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:16,fontWeight:700}}>📋 Pre-kit para {maq?.nombre}</div>
              <div style={{fontSize:11,color:"var(--muted)"}}>{maq?.ubicacion} — Cobertura sugerida: 7 días</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div className="card" style={{padding:"8px 14px",minWidth:100}}>
                <div className="card-label">Total a llevar</div>
                <div className="card-value blue">{totalSugerido} uds</div>
              </div>
            </div>
          </div>

          {alertaStock.length>0&&(
            <div className="alert-box" style={{marginBottom:12}}>
              <Icon name="alert" size={14}/>
              <span><strong>{alertaStock.length} producto(s)</strong> con stock insuficiente en almacén para cubrir la demanda.</span>
            </div>
          )}

          <div className="section">
            <div className="section-header"><h3>Lista de productos a llevar</h3></div>
            <div className="table-wrap"><table>
              <thead><tr><th>Producto</th><th>Stock en máquina</th><th>Última visita</th><th>Venta/día (prom.)</th><th>Disponible almacén</th><th style={{color:"var(--accent)"}}>Llevar</th></tr></thead>
              <tbody>
                {kit.length===0
                  ?<tr><td colSpan={6} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin datos suficientes. Registra stock por máquina para obtener sugerencias precisas.</td></tr>
                  :kit.map(r=>{
                    const sinStock=r.sugerido>r.disponible;
                    return(
                      <tr key={r.prod.id}>
                        <td><strong>{r.prod.nombre}</strong></td>
                        <td style={{color:r.stockActual<=2?"var(--red)":"var(--text)",fontWeight:700}}>{r.stockActual} uds</td>
                        <td style={{color:"var(--muted)",fontSize:11}}>{r.ultimaFecha}</td>
                        <td style={{color:"var(--muted)"}}>{r.promDiario>0?`${r.promDiario} uds`:"Sin datos"}</td>
                        <td style={{color:sinStock?"var(--red)":"var(--green)",fontWeight:600}}>{r.disponible} uds {sinStock&&"⚠️"}</td>
                        <td>
                          <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"4px 14px",borderRadius:8,background:r.sugerido>0?"rgba(245,158,11,.15)":"var(--surface2)",color:r.sugerido>0?"var(--accent)":"var(--muted)",fontWeight:700,fontSize:13}}>
                            {r.sugerido>0?`${r.sugerido} uds`:"✓ OK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table></div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO 3: REPORTE DE PRODUCTOS MÁS VENDIDOS
// ═══════════════════════════════════════════════════════════════════════════════
function Reportes({data}){
  const [mes,setMes]=useState(mesActual());
  const [maqFiltro,setMaqFiltro]=useState("todas");
  const maqActivas=data.maquinas.filter(m=>m.activa);

  const ventasMes=data.ventas.filter(v=>{
    const matchMes=v.fecha?.startsWith(mes);
    const matchMaq=maqFiltro==="todas"||v.maquinaId===maqFiltro;
    return matchMes&&matchMaq;
  });

  // Ranking por producto
  const porProducto={};
  ventasMes.forEach(v=>{
    if(!porProducto[v.productoId])porProducto[v.productoId]={productoId:v.productoId,unidades:0,ingresos:0,maquinas:new Set()};
    porProducto[v.productoId].unidades+=v.cantidad||0;
    porProducto[v.productoId].ingresos+=v.ingreso||0;
    porProducto[v.productoId].maquinas.add(v.maquinaId);
  });
  const rankingProductos=Object.values(porProducto).sort((a,b)=>b.unidades-a.unidades).map((r,i)=>({...r,rank:i+1,maquinas:r.maquinas.size}));

  // Ranking por máquina
  const porMaquina={};
  ventasMes.forEach(v=>{
    if(!porMaquina[v.maquinaId])porMaquina[v.maquinaId]={maquinaId:v.maquinaId,unidades:0,ingresos:0,productos:new Set()};
    porMaquina[v.maquinaId].unidades+=v.cantidad||0;
    porMaquina[v.maquinaId].ingresos+=v.ingreso||0;
    porMaquina[v.maquinaId].productos.add(v.productoId);
  });
  const rankingMaquinas=Object.values(porMaquina).sort((a,b)=>b.ingresos-a.ingresos).map((r,i)=>({...r,rank:i+1,productos:r.productos.size}));

  const totalUds=ventasMes.reduce((s,v)=>s+(v.cantidad||0),0);
  const totalIng=ventasMes.reduce((s,v)=>s+(v.ingreso||0),0);
  const maxUds=rankingProductos[0]?.unidades||1;

  const medallaColor=(rank)=>rank===1?"#f59e0b":rank===2?"#94a3b8":rank===3?"#cd7f32":"var(--muted)";

  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>

      {/* Filtro máquina */}
      <div className="filtro-bar" style={{marginBottom:16}}>
        <span className="filtro-label"><Icon name="filter" size={13}/> Máquina:</span>
        <select value={maqFiltro} onChange={e=>setMaqFiltro(e.target.value)}>
          <option value="todas">Todas</option>
          {maqActivas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>

      <div className="cards">
        <div className="card"><div className="card-label">Total unidades</div><div className="card-value blue">{totalUds}</div><div className="card-sub">{ventasMes.length} registros</div></div>
        <div className="card"><div className="card-label">Total ingresos</div><div className="card-value green">{fmt(totalIng)}</div><div className="card-sub">{nombreMes(mes)}</div></div>
        <div className="card"><div className="card-label">Productos distintos</div><div className="card-value amber">{Object.keys(porProducto).length}</div><div className="card-sub">vendidos en el mes</div></div>
      </div>

      {/* Ranking productos */}
      <div className="section" style={{marginBottom:16}}>
        <div className="section-header"><h3>🏆 Productos más vendidos — {nombreMes(mes)}</h3></div>
        {rankingProductos.length===0
          ?<div style={{padding:20,textAlign:"center",color:"var(--muted)"}}>Sin ventas en {nombreMes(mes)}.</div>
          :<div style={{padding:"8px 16px 16px"}}>
            {rankingProductos.map(r=>{
              const prod=data.productos.find(p=>p.id===r.productoId);
              const pct=totalUds>0?(r.unidades/totalUds*100).toFixed(1):0;
              const barW=(r.unidades/maxUds*100);
              return(
                <div key={r.productoId} style={{marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                    <span style={{fontSize:15,fontWeight:900,color:medallaColor(r.rank),minWidth:24,textAlign:"center"}}>
                      {r.rank<=3?["🥇","🥈","🥉"][r.rank-1]:r.rank}
                    </span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontSize:13,fontWeight:600}}>{prod?.nombre||"—"}</span>
                        <div style={{display:"flex",gap:12,fontSize:12}}>
                          <span style={{color:"var(--accent2)",fontWeight:700}}>{r.unidades} uds</span>
                          <span style={{color:"var(--green)",fontWeight:700}}>{fmt(r.ingresos)}</span>
                          <span style={{color:"var(--muted)"}}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{height:6,background:"var(--surface2)",borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${barW}%`,background:r.rank===1?"var(--accent)":r.rank===2?"var(--accent2)":"var(--green)",borderRadius:4,transition:"width .4s"}}/>
                      </div>
                    </div>
                  </div>
                  <div style={{paddingLeft:34,fontSize:10,color:"var(--muted)"}}>Vendido en {r.maquinas} máquina(s)</div>
                </div>
              );
            })}
          </div>
        }
      </div>

      {/* Ranking máquinas */}
      {maqFiltro==="todas"&&(
        <div className="section">
          <div className="section-header"><h3>📍 Máquinas más rentables — {nombreMes(mes)}</h3></div>
          {rankingMaquinas.length===0
            ?<div style={{padding:20,textAlign:"center",color:"var(--muted)"}}>Sin datos.</div>
            :<div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Máquina</th><th>Ubicación</th><th>Unidades</th><th>Ingresos</th><th>Productos</th></tr></thead>
              <tbody>
                {rankingMaquinas.map(r=>{
                  const maq=data.maquinas.find(m=>m.id===r.maquinaId);
                  return(
                    <tr key={r.maquinaId}>
                      <td style={{fontWeight:900,color:medallaColor(r.rank),fontSize:15}}>{r.rank<=3?["🥇","🥈","🥉"][r.rank-1]:r.rank}</td>
                      <td><strong>{maq?.nombre||"—"}</strong></td>
                      <td style={{color:"var(--muted)",fontSize:11}}>{maq?.ubicacion}</td>
                      <td style={{color:"var(--accent2)",fontWeight:700}}>{r.unidades} uds</td>
                      <td style={{color:"var(--green)",fontWeight:700}}>{fmt(r.ingresos)}</td>
                      <td><span className="badge blue">{r.productos}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          }
        </div>
      )}
    </div>
  );
}




// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO: CIERRE DEL DÍA
// ═══════════════════════════════════════════════════════════════════════════════
function CierreDia({data}){
  const [fecha,setFecha]=useState(today());

  // ── Cobranzas del día ──────────────────────────────────────────────────────
  const cobranzasDia=data.cobranzas.filter(c=>c.fecha===fecha);
  const totalCobrado=cobranzasDia.reduce((s,c)=>s+(c.monto||0),0);
  const totalVerificado=cobranzasDia.filter(c=>c.verificado).reduce((s,c)=>s+(c.monto||0),0);
  const totalPendiente=totalCobrado-totalVerificado;
  const totalSencilloCob=cobranzasDia.reduce((s,c)=>s+(c.sencillo||0),0);

  // ── Sencillo del día ───────────────────────────────────────────────────────
  const sencilloDia=data.sencillo.filter(s=>s.fecha===fecha);
  const totalEntregado=sencilloDia.reduce((s,r)=>s+(r.totalEntregado||0),0);
  const totalUsado=sencilloDia.reduce((s,r)=>s+(r.usos||[]).reduce((a,u)=>a+(u.total||0),0),0);
  const totalDevuelto=sencilloDia.reduce((s,r)=>s+(r.devolucion?.total||0),0);
  const sencilloPendiente=totalEntregado-totalUsado-totalDevuelto;

  // ── Neto del día ───────────────────────────────────────────────────────────
  const netoEsperado=totalCobrado-totalEntregado;
  const netoReal=totalVerificado-totalEntregado+totalDevuelto;

  // ── Agrupado por abastecedor ───────────────────────────────────────────────
  const porResponsable={};
  cobranzasDia.forEach(c=>{
    const r=c.responsable||"Sin nombre";
    if(!porResponsable[r])porResponsable[r]={nombre:r,maquinas:[],total:0,verificado:0,pendiente:0};
    const maq=data.maquinas.find(m=>m.id===c.maquinaId);
    porResponsable[r].maquinas.push({nombre:maq?.nombre||"—",ubicacion:maq?.ubicacion||"",monto:c.monto||0,verificado:!!c.verificado,sencillo:c.sencillo||0,comentario:data.sugerencias.find(s=>s.cobId===c.id)?.mensaje||null});
    porResponsable[r].total+=c.monto||0;
    if(c.verificado)porResponsable[r].verificado+=c.monto||0;
    else porResponsable[r].pendiente+=c.monto||0;
  });

  const STATUS_COLOR={true:"var(--green)",false:"var(--accent)"};

  return(
    <div>
      {/* Selector de fecha */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px"}}>
        <Icon name="calendar" size={16}/>
        <span style={{fontWeight:700,fontSize:15}}>Cierre del día</span>
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
          style={{marginLeft:"auto",padding:"7px 12px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
      </div>

      {/* Cards resumen */}
      <div className="cards" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-label">💰 Total cobrado</div>
          <div className="card-value green">{fmt(totalCobrado)}</div>
          <div className="card-sub">{cobranzasDia.length} máquinas</div>
        </div>
        <div className="card">
          <div className="card-label">✅ Verificado</div>
          <div className="card-value green">{fmt(totalVerificado)}</div>
          <div className="card-sub">{cobranzasDia.filter(c=>c.verificado).length} confirmados</div>
        </div>
        <div className="card">
          <div className="card-label">⏳ Pendiente verificar</div>
          <div className="card-value amber">{fmt(totalPendiente)}</div>
          <div className="card-sub">{cobranzasDia.filter(c=>!c.verificado).length} por revisar</div>
        </div>
        <div className="card">
          <div className="card-label">💵 Sencillo entregado</div>
          <div className="card-value blue">{fmt(totalEntregado)}</div>
          <div className="card-sub">vs {fmt(totalDevuelto)} devuelto</div>
        </div>
        <div className="card">
          <div className="card-label">{Math.abs(sencilloPendiente)<0.01?"✅ Sencillo cuadrado":"⚠️ Sencillo pendiente"}</div>
          <div className={`card-value ${Math.abs(sencilloPendiente)<0.01?"green":"red"}`}>{fmt(Math.abs(sencilloPendiente))}</div>
          <div className="card-sub">{Math.abs(sencilloPendiente)<0.01?"Todo devuelto":"Por devolver/rendir"}</div>
        </div>
        <div className="card">
          <div className="card-label">📊 Neto esperado</div>
          <div className="card-value green">{fmt(netoEsperado)}</div>
          <div className="card-sub">Cobrado − sencillo</div>
        </div>
      </div>

      {/* Sin datos */}
      {cobranzasDia.length===0&&sencilloDia.length===0&&(
        <div className="section"><div style={{padding:32,textAlign:"center",color:"var(--muted)",fontSize:14}}>
          <div style={{fontSize:40,marginBottom:12}}>📭</div>
          Sin registros para el {fecha}
        </div></div>
      )}

      {/* Detalle por abastecedor */}
      {Object.values(porResponsable).map(r=>(
        <div key={r.nombre} className="section" style={{marginBottom:14}}>
          <div className="section-header">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:"rgba(245,158,11,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🔧</div>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{r.nombre}</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{r.maquinas.length} máquina(s) visitadas</div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[["Cobrado",fmt(r.total),"var(--green)"],["Verificado",fmt(r.verificado),"var(--green)"],["Pendiente",fmt(r.pendiente),"var(--accent)"]].map(([l,v,col])=>(
                <div key={l} style={{textAlign:"center",background:"var(--surface2)",borderRadius:8,padding:"6px 12px"}}>
                  <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase"}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:col}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla máquinas */}
          <div className="table-wrap"><table>
            <thead><tr><th>Máquina</th><th>Ubicación</th><th>Monto</th><th>Sencillo usado</th><th>Estado</th><th>Comentario</th></tr></thead>
            <tbody>
              {r.maquinas.map((m,i)=>(
                <tr key={i}>
                  <td><strong>{m.nombre}</strong></td>
                  <td style={{color:"var(--muted)",fontSize:11}}>{m.ubicacion}</td>
                  <td style={{color:"var(--green)",fontWeight:700}}>{fmt(m.monto)}</td>
                  <td>{m.sencillo>0?<span style={{fontSize:11,fontWeight:600,color:"var(--accent2)"}}>{fmt(m.sencillo)}</span>:<span style={{color:"var(--muted)",fontSize:11}}>—</span>}</td>
                  <td>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,background:m.verificado?"rgba(16,185,129,.15)":"rgba(245,158,11,.15)",color:STATUS_COLOR[m.verificado]}}>
                      {m.verificado?"✅ Correcto":"⏳ Pendiente"}
                    </span>
                  </td>
                  <td style={{fontSize:11,color:"var(--muted)",fontStyle:m.comentario?"italic":"normal"}}>{m.comentario||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ))}

      {/* Sencillo del día */}
      {sencilloDia.length>0&&(
        <div className="section">
          <div className="section-header"><h3>💵 Control de sencillo del día</h3></div>
          <div style={{padding:"12px 16px"}}>
            {sencilloDia.map(reg=>{
              const usado=(reg.usos||[]).reduce((s,u)=>s+(u.total||0),0);
              const devuelto=reg.devolucion?.total||0;
              const diff=+(reg.totalEntregado-usado-devuelto).toFixed(2);
              const cuadra=Math.abs(diff)<0.01;
              return(
                <div key={reg.id} style={{background:"var(--surface2)",borderRadius:10,padding:"12px 14px",marginBottom:10,border:`1px solid ${cuadra?"rgba(16,185,129,.3)":"rgba(245,158,11,.3)"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:8}}>
                    <div style={{fontWeight:600}}>{reg.responsable||"Sin nombre"}</div>
                    <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:cuadra?"rgba(16,185,129,.15)":"rgba(245,158,11,.15)",color:cuadra?"var(--green)":"var(--accent)"}}>
                      {cuadra?"✅ Cuadrado":`⚠️ Pendiente ${fmt(diff)}`}
                    </span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8}}>
                    {[["Entregado",fmt(reg.totalEntregado),"var(--accent)"],["Usado",fmt(usado),"var(--accent2)"],["Devuelto",fmt(devuelto),"var(--green)"],["Diferencia",fmt(diff),cuadra?"var(--green)":"var(--red)"]].map(([l,v,col])=>(
                      <div key={l} style={{background:"var(--surface)",borderRadius:7,padding:"7px 10px"}}>
                        <div style={{fontSize:9,color:"var(--muted)",marginBottom:2,textTransform:"uppercase"}}>{l}</div>
                        <div style={{fontSize:13,fontWeight:700,color:col}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {reg.nota&&<div style={{marginTop:8,fontSize:11,color:"var(--muted)",fontStyle:"italic"}}>📝 {reg.nota}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Línea de cierre */}
      {(cobranzasDia.length>0||sencilloDia.length>0)&&(
        <div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.25)",borderRadius:12,padding:"16px 18px",marginTop:8}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--green)",marginBottom:10}}>📊 Resumen de cierre</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
            {[
              ["Total cobranza",fmt(totalCobrado),"var(--green)"],
              ["Sencillo entregado",fmt(totalEntregado),"var(--red)"],
              ["Neto esperado",fmt(netoEsperado),"var(--green)"],
              ["Verificado",fmt(totalVerificado),"var(--green)"],
              ["Sin verificar",fmt(totalPendiente),"var(--amber)"],
              ["Sencillo pendiente",fmt(Math.max(0,sencilloPendiente)),"var(--accent)"],
            ].map(([l,v,col])=>(
              <div key={l} style={{background:"var(--surface)",borderRadius:9,padding:"10px 13px"}}>
                <div style={{fontSize:10,color:"var(--muted)",marginBottom:3,textTransform:"uppercase"}}>{l}</div>
                <div style={{fontSize:15,fontWeight:700,color:col}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO: PERSONAL
// ═══════════════════════════════════════════════════════════════════════════════
const ROLES_PERSONAL=["Abastecedor","Almacenero","Supervisor","Administrador","Otro"];
const TURNOS=["Tiempo completo","Medio tiempo","Por horas","Por días"];

function Personal({data,save,del}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [busqueda,setBusqueda]=useState("");
  const [verDetalle,setVerDetalle]=useState(null);
  const EF={nombre:"",rol:ROLES_PERSONAL[0],turno:TURNOS[0],sueldo:"",telefono:"",dni:"",fechaIngreso:today(),activo:true,notas:""};
  const [form,setForm]=useState(EF);

  const doSave=()=>{
    if(!form.nombre||!form.sueldo)return;
    if(editando)save("personal",editando.id,{...editando,...form,sueldo:+form.sueldo});
    else{const id=uid();save("personal",id,{id,...form,sueldo:+form.sueldo});}
    setModal(false);setForm(EF);setEditando(null);
  };
  const abrirEditar=(p)=>{
    setForm({nombre:p.nombre,rol:p.rol,turno:p.turno,sueldo:String(p.sueldo),telefono:p.telefono||"",dni:p.dni||"",fechaIngreso:p.fechaIngreso||today(),activo:p.activo!==false,notas:p.notas||""});
    setEditando(p);setModal(true);
  };
  const toggleActivo=(p)=>save("personal",p.id,{...p,activo:!p.activo});

  const personalFiltrado=[...data.personal]
    .sort((a,b)=>a.nombre.localeCompare(b.nombre))
    .filter(p=>!busqueda||p.nombre.toLowerCase().includes(busqueda.toLowerCase())||p.rol.toLowerCase().includes(busqueda.toLowerCase()));

  const activos=data.personal.filter(p=>p.activo!==false);
  const totalSueldos=activos.reduce((s,p)=>s+(p.sueldo||0),0);
  const ROL_COLOR={Abastecedor:"blue",Almacenero:"green",Supervisor:"amber",Administrador:"red",Otro:"blue"};

  return(
    <div>
      {/* Cards resumen */}
      <div className="cards">
        <div className="card"><div className="card-label">Personal activo</div><div className="card-value blue">{activos.length}</div><div className="card-sub">{data.personal.filter(p=>p.activo===false).length} inactivos</div></div>
        <div className="card"><div className="card-label">Planilla mensual</div><div className="card-value amber">{fmt(totalSueldos)}</div><div className="card-sub">Solo activos</div></div>
        {ROLES_PERSONAL.filter(r=>data.personal.some(p=>p.rol===r&&p.activo!==false)).map(r=>(
          <div key={r} className="card"><div className="card-label">{r}s</div><div className="card-value green">{data.personal.filter(p=>p.rol===r&&p.activo!==false).length}</div></div>
        ))}
      </div>

      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre o rol..." total={data.personal.length} filtrado={personalFiltrado.length}/>

      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <button className="btn btn-primary" onClick={()=>{setForm(EF);setEditando(null);setModal(true);}}><Icon name="plus" size={14}/> Agregar personal</button>
      </div>

      {personalFiltrado.length===0
        ?<div className="section"><div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:13}}>Sin personal registrado.</div></div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {personalFiltrado.map(p=>(
            <div key={p.id} className="section" style={{marginBottom:0}}>
              <div style={{padding:"14px 16px"}}>
                {/* Header card */}
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:42,height:42,borderRadius:10,background:`rgba(${p.activo!==false?"59,130,246":"100,116,139"},0.15)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                      {p.rol==="Abastecedor"?"🔧":p.rol==="Almacenero"?"🏭":p.rol==="Supervisor"?"👁️":p.rol==="Administrador"?"🔐":"👤"}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{p.nombre}</div>
                      <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>
                        <span className={`badge ${ROL_COLOR[p.rol]||"blue"}`}>{p.rol}</span>
                        <span style={{fontSize:10,color:"var(--muted)"}}>{p.turno}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:p.activo!==false?"rgba(16,185,129,.15)":"rgba(239,68,68,.15)",color:p.activo!==false?"var(--green)":"var(--red)",flexShrink:0}}>
                    {p.activo!==false?"Activo":"Inactivo"}
                  </span>
                </div>
                {/* Info */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  <div style={{background:"var(--surface2)",borderRadius:7,padding:"7px 10px"}}>
                    <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",marginBottom:2}}>Sueldo/mes</div>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--accent)"}}>{fmt(p.sueldo)}</div>
                  </div>
                  <div style={{background:"var(--surface2)",borderRadius:7,padding:"7px 10px"}}>
                    <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",marginBottom:2}}>Ingreso</div>
                    <div style={{fontSize:12,fontWeight:600}}>{p.fechaIngreso||"—"}</div>
                  </div>
                  {p.telefono&&<div style={{background:"var(--surface2)",borderRadius:7,padding:"7px 10px"}}>
                    <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",marginBottom:2}}>Teléfono</div>
                    <div style={{fontSize:12}}>{p.telefono}</div>
                  </div>}
                  {p.dni&&<div style={{background:"var(--surface2)",borderRadius:7,padding:"7px 10px"}}>
                    <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",marginBottom:2}}>DNI</div>
                    <div style={{fontSize:12}}>{p.dni}</div>
                  </div>}
                </div>
                {p.notas&&<div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic",marginBottom:10,padding:"6px 8px",background:"var(--surface2)",borderRadius:6}}>📝 {p.notas}</div>}
                {/* Acciones */}
                <div style={{display:"flex",gap:6}}>
                  <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={()=>abrirEditar(p)}><Icon name="edit" size={12}/> Editar</button>
                  <button className="btn btn-secondary btn-sm" style={{color:p.activo!==false?"var(--red)":"var(--green)"}} onClick={()=>toggleActivo(p)}>
                    {p.activo!==false?"Desactivar":"Activar"}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(p)}><Icon name="trash" size={12}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      {/* Modal crear/editar */}
      {modal&&<div className="modal-overlay"><div className="modal" style={{maxWidth:500}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <h3 style={{margin:0}}>{editando?"Editar personal":"Agregar personal"}</h3>
          <CloseBtn onClick={()=>{setModal(false);setEditando(null);}}/>
        </div>
        {editando&&<div className="edit-banner">Editando: <strong>{editando.nombre}</strong></div>}
        <div className="form-row">
          <div className="form-group"><label>Nombre completo</label>
            <input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Juan Pérez García"/>
          </div>
          <div className="form-group"><label>DNI</label>
            <input value={form.dni} onChange={e=>setForm({...form,dni:e.target.value})} placeholder="12345678"/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Rol</label>
            <select value={form.rol} onChange={e=>setForm({...form,rol:e.target.value})}>
              {ROLES_PERSONAL.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Turno</label>
            <select value={form.turno} onChange={e=>setForm({...form,turno:e.target.value})}>
              {TURNOS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Sueldo mensual (S/)</label>
            <input type="number" step="0.01" value={form.sueldo} onChange={e=>setForm({...form,sueldo:e.target.value})} placeholder="Ej: 1500.00"/>
          </div>
          <div className="form-group"><label>Teléfono</label>
            <input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="999-888-777"/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Fecha de ingreso</label>
            <input type="date" value={form.fechaIngreso} onChange={e=>setForm({...form,fechaIngreso:e.target.value})}/>
          </div>
          {editando&&<div className="form-group"><label>Estado</label>
            <select value={form.activo} onChange={e=>setForm({...form,activo:e.target.value==="true"})}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>}
        </div>
        <div className="form-group"><label>Notas (opcional)</label>
          <input value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="Ej: Conductor con licencia, experiencia en vending..."/>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave} disabled={!form.nombre||!form.sueldo}>{editando?"Guardar cambios":"Agregar"}</button>
        </div>
      </div></div>}
      {confirmDel&&<ConfirmDelete texto={`¿Eliminar a "${confirmDel.nombre}" del registro de personal?`} onConfirm={()=>{del("personal",confirmDel.id);setConfirmDel(null);}} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}

// ─── NAVEGACIÓN ─────────────────────────────────────────────────────────────────
const ADMIN_NAV=[
  {section:"General"},{id:"dashboard",label:"Dashboard",icon:"chart"},{id:"cierreDia",label:"Cierre del día",icon:"bolt"},{id:"rentabilidad",label:"Rentabilidad",icon:"trend"},
  {id:"horario",label:"Horario semanal",icon:"calendar"},{id:"gastos",label:"Gastos adicionales",icon:"bolt"},
  {section:"Catálogo"},{id:"productos",label:"Productos",icon:"product"},{id:"proveedores",label:"Proveedores",icon:"supplier"},
  {section:"Operaciones"},{id:"maquinas",label:"Máquinas",icon:"machine"},{id:"stock",label:"Stock almacén",icon:"stock"},
  {id:"stockMaquina",label:"Stock por máquina",icon:"layers"},
  {id:"ventas",label:"Ventas",icon:"chart"},{id:"cobranzas",label:"Cobranzas",icon:"money"},
  {id:"devoluciones",label:"Devoluciones",icon:"devolver"},
  {id:"sencillo",label:"Control de sencillo",icon:"coin"},
  {section:"Análisis"},{id:"reportes",label:"Reportes",icon:"trophy"},{id:"prekit",label:"Pre-Kit reposición",icon:"kit"},
  {id:"tickets",label:"Tickets mantenimiento",icon:"wrench"},
  {section:"Administración"},{id:"personal",label:"Personal",icon:"personal"},
];
const ABASTECEDOR_NAV=[
  {section:"Mi semana"},{id:"mihorario",label:"Mi horario",icon:"calendar"},
  {section:"Operaciones"},{id:"traslados",label:"Traslados",icon:"transfer"},{id:"stockMaquina",label:"Stock por máquina",icon:"layers"},
  {id:"cobranzas",label:"Cobranza",icon:"money"},
  {id:"devoluciones",label:"Devoluciones",icon:"devolver"},
  {id:"sencillo",label:"Control de sencillo",icon:"coin"},
  {id:"tickets",label:"Tickets mantenimiento",icon:"wrench"},
  {section:"Análisis"},{id:"prekit",label:"Pre-Kit reposición",icon:"kit"},
  {section:"Consultas"},{id:"ventas",label:"Ventas del día",icon:"chart"},{id:"precios",label:"Lista de precios",icon:"tag"},{id:"preciosEco",label:"Precios económicos",icon:"pricetag"},{id:"stock",label:"Stock almacén",icon:"stock"},
];
const ALMACENERO_NAV=[
  {section:"Mi semana"},{id:"mihorario",label:"Mi horario",icon:"calendar"},
  {section:"Almacén"},{id:"stock",label:"Stock almacén",icon:"stock"},
  {section:"Catálogo"},{id:"productos",label:"Productos",icon:"product"},{id:"proveedores",label:"Proveedores",icon:"supplier"},
  {section:"Operaciones"},{id:"maquinas",label:"Máquinas",icon:"machine"},{id:"traslados",label:"Traslados",icon:"transfer"},
  {id:"devoluciones",label:"Devoluciones",icon:"devolver"},
];
const TITLES={
  dashboard:"Dashboard",rentabilidad:"Rentabilidad",horario:"Horario semanal",mihorario:"Mi horario",
  gastos:"Gastos adicionales",productos:"Productos",proveedores:"Proveedores",maquinas:"Máquinas",
  stock:"Stock almacén",traslados:"Traslados",ventas:"Ventas",cobranzas:"Cobranzas",
  precios:"Precios de venta",preciosEco:"Lista de precios económica",
  devoluciones:"Devoluciones",cierreDia:"Cierre del día",personal:"Personal",sugerencias:"Sugerencias",stockMaquina:"Stock por máquina",sencillo:"Control de sencillo",tickets:"Tickets de mantenimiento",prekit:"Pre-Kit de reposición",reportes:"Reportes de ventas",
};
const ROL_ICONO={admin:"🔐",abastecedor:"🔧",almacenero:"🏭"};
const ROL_NOMBRE={admin:"Administrador",abastecedor:"Abastecedor",almacenero:"Almacenero"};

// ─── APP ──────────────────────────────────────────────────────────────────────────
export default function App(){
  const{data,save,saveMulti,del,syncing}=useFirebase();
  const [usuario,setUsuario]=useState(null);
  const [tab,setTab]=useState("dashboard");
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const cerrar=()=>setSidebarOpen(false);
  const navegar=(id)=>{setTab(id);cerrar();};
  if(!data)return(<><style>{css}</style><div className="loading"><div className="spinner"><Icon name="spin" size={42}/></div><p>Conectando con la base de datos...</p></div></>);
  if(!usuario)return(<><style>{css}</style><LoginScreen onLogin={role=>{setUsuario(role);setTab(role==="admin"?"dashboard":role==="almacenero"?"stock":"mihorario");}}/></>);
  const esAdmin=usuario==="admin";
  const esAbastecedor=usuario==="abastecedor";
  const esAlmacenero=usuario==="almacenero";
  const nav=esAdmin?ADMIN_NAV:esAlmacenero?ALMACENERO_NAV:ABASTECEDOR_NAV;
  const nombreUsuario=ROL_NOMBRE[usuario]||usuario;
  const dateStr=new Date().toLocaleDateString("es-PE",{weekday:"short",day:"numeric",month:"short"});
  const RC=()=>{switch(tab){
    case "dashboard":    return <Dashboard data={data}/>;
    case "cierreDia":    return <CierreDia data={data}/>;
    case "personal":     return <Personal data={data} save={save} del={del}/>;
    case "rentabilidad": return <Rentabilidad data={data}/>;
    case "horario":      return <HorarioAdmin data={data} save={save}/>;
    case "mihorario":    return <MiHorario data={data} save={save} puedeComentarMaq={esAbastecedor||esAdmin}/>;
    case "gastos":       return <GastosAdicionales data={data} save={save} del={del}/>;
    case "productos":    return <Productos data={data} save={save} del={del} soloEditar={esAlmacenero}/>;
    case "precios":      return <ListaPrecios data={data}/>;
    case "proveedores":  return <Proveedores data={data} save={save} del={del} soloEditar={esAlmacenero}/>;
    case "maquinas":     return <Maquinas data={data} save={save} del={del} esAdmin={esAdmin} esAbastecedor={esAbastecedor} soloEditar={esAlmacenero}/>;
    case "stock":        return <Stock data={data} save={save} del={del} soloLectura={esAbastecedor} esAdmin={esAdmin}/>;
    case "traslados":    return <Traslados data={data} save={save} saveMulti={saveMulti} del={del} usuario={nombreUsuario} esAdmin={esAdmin} soloLectura={esAlmacenero}/>;
    case "ventas":       return <Ventas data={data} save={save} del={del} esAdmin={esAdmin} soloLectura={esAbastecedor}/>;
    case "cobranzas":    return <Cobranzas data={data} save={save} del={del} usuario={nombreUsuario} esAdmin={esAdmin}/>;
    case "preciosEco":   return <ListaPreciosEco data={data}/>;
    case "devoluciones": return <Devoluciones data={data} save={save} del={del} soloLectura={esAlmacenero} esAdmin={esAdmin} puedeEditar={esAdmin||esAbastecedor}/>;
    case "stockMaquina":  return <StockMaquina data={data} save={save} del={del} soloLectura={false}/>;
    case "sencillo":      return <ControlSencillo data={data} save={save} del={del} esAdmin={esAdmin}/>;
    case "tickets":      return <Tickets data={data} save={save} del={del} esAdmin={esAdmin}/>;
    case "prekit":       return <PreKit data={data}/>;
    case "reportes":     return <Reportes data={data}/>;
    case "sugerencias":  return <Sugerencias data={data} save={save} del={del} soloLectura={esAlmacenero}/>;
    default: return null;
  }};
  return(
    <><style>{css}</style>
    <div className="app">
      <div className={`sidebar-overlay ${sidebarOpen?"open":""}`} onClick={cerrar}/>
      <aside className={`sidebar ${sidebarOpen?"open":""}`}>
        <div className="sidebar-logo">
          <Logo/>
          <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",padding:4,display:"flex"}} onClick={cerrar}><Icon name="close" size={18}/></button>
        </div>
        <div className="sidebar-role">{ROL_ICONO[usuario]} <span>{nombreUsuario}</span></div>
        <nav className="nav">
          {nav.map((item,i)=>item.section
            ?<div key={i} className="nav-section">{item.section}</div>
            :<div key={item.id} className={`nav-item ${tab===item.id?"active":""}`} onClick={()=>navegar(item.id)}><Icon name={item.icon} size={15}/>{item.label}</div>
          )}
        </nav>
        <div className="logout-btn" onClick={()=>setUsuario(null)}><Icon name="logout" size={15}/> Cerrar sesión</div>
      </aside>
      <main className="main">
        <div className="topbar">
          <button className="hamburger" onClick={()=>setSidebarOpen(true)}><Icon name="menu" size={22}/></button>
          <h1>{TITLES[tab]}</h1>
          <span className="topbar-date">{dateStr}</span>
        </div>
        <div className="content"><RC/></div>
      </main>
    </div>
    {syncing&&<div className="syncing"><Icon name="spin" size={12}/> Guardando...</div>}
    </>
  );
}
