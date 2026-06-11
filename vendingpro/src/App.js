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
  traslados:{},ventas:{},cobranzas:{},gastos:{},sugerencias:{},devoluciones:{},productosEco:{},
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
  :root{--bg:#0a0e1a;--surface:#111827;--surface2:#1a2235;--border:#1e2d45;--accent:#f59e0b;--accent2:#3b82f6;--green:#10b981;--red:#ef4444;--text:#f1f5f9;--muted:#64748b;--radius:12px;}
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

function useFirebase(){
  const [data,setData]=useState(null);
  const [syncing,setSyncing]=useState(false);
  useEffect(()=>{
    return onValue(ref(db,"gamatic"),(snap)=>{
      const val=snap.val();
      if(!val){set(ref(db,"gamatic"),SEED);return;}
      setData({
        productos:objToArr(val.productos),proveedores:objToArr(val.proveedores),
        maquinas:objToArr(val.maquinas),stock:objToArr(val.stock),
        traslados:objToArr(val.traslados),ventas:objToArr(val.ventas),
        cobranzas:objToArr(val.cobranzas),gastos:objToArr(val.gastos||{}),
        sugerencias:objToArr(val.sugerencias||{}),devoluciones:objToArr(val.devoluciones||{}),
        productosEco:objToArr(val.productosEco||{}),
        horario:val.horario||SEED.horario,
      });
    });
  },[]);
  const save=async(path,id,val)=>{setSyncing(true);await set(ref(db,`gamatic/${path}/${id}`),val);setSyncing(false);};
  const saveMulti=async(ops)=>{setSyncing(true);for(const[p,i,v]of ops)await set(ref(db,`gamatic/${p}/${i}`),v);setSyncing(false);};
  const del=async(path,id)=>{setSyncing(true);await remove(ref(db,`gamatic/${path}/${id}`));setSyncing(false);};
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
              <span className="role-icon">{ico}</span>
              <h4>{lbl}</h4>
              <p>{sub}</p>
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
      <div className="section">
        <div className="section-header"><h3>Catálogo de productos</h3><button className="btn btn-primary btn-sm" onClick={abrirNuevo}><Icon name="plus" size={13}/> Agregar</button></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Producto</th><th>F.Registro</th><th>F.Vencimiento</th><th>Proveedor</th><th>Costo</th><th>Margen</th><th>Estimado</th><th>Precio venta</th><th>Precio económico</th><th>Acciones</th></tr></thead>
          <tbody>{data.productos.map(p=>{
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
  return(<div><div className="info-box">Precios de venta que debes cobrar al cargar las máquinas.</div><div className="section"><div className="section-header"><h3>Precios de venta</h3></div><div className="table-wrap"><table><thead><tr><th>Producto</th><th>Proveedor</th><th>Precio de venta</th></tr></thead><tbody>{data.productos.map(p=>(<tr key={p.id}><td><strong>{p.nombre}</strong></td><td style={{color:"var(--muted)"}}>{p.proveedor}</td><td><span className="precio-real">{fmt(p.precioVenta||(p.costo*(1+p.margen/100)))}</span></td></tr>))}</tbody></table></div></div></div>);
}

// ─── PROVEEDORES ─────────────────────────────────────────────────────────────────
function Proveedores({data,save,del,soloEditar=false}){
  const [modal,setModal]=useState(false);const [editando,setEditando]=useState(null);const [confirmDel,setConfirmDel]=useState(null);
  const EF={nombre:"",contacto:"",telefono:""};const [form,setForm]=useState(EF);
  const doSave=()=>{
    if(!form.nombre)return;
    if(editando)save("proveedores",editando.id,{...editando,...form});
    else{const id=uid();save("proveedores",id,{id,...form});}
    setModal(false);setForm(EF);setEditando(null);
  };
  return(
    <div>
      <div className="section">
        <div className="section-header"><h3>Proveedores</h3><button className="btn btn-primary btn-sm" onClick={()=>{setForm(EF);setEditando(null);setModal(true);}}><Icon name="plus" size={13}/> Agregar</button></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Empresa</th><th>Contacto</th><th>Teléfono</th><th>Productos</th><th>Acciones</th></tr></thead>
          <tbody>{data.proveedores.map(p=>(<tr key={p.id}>
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
        <div className="table-wrap"><table>
          <thead><tr><th>Producto</th><th>F.Ingreso</th><th>F.Vencimiento</th><th>Cantidad</th><th>Mínimo</th><th>Estado</th>{!soloLectura&&<th>Acciones</th>}</tr></thead>
          <tbody>{data.stock.map(s=>{
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
                  <td style={{color:"var(--muted)"}}>{t.responsable}</td>
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
                  {data.productos.map(p=>{const s=data.stock.find(s=>s.productoId===p.id);return<option key={p.id} value={p.id}>{p.nombre} (stock:{s?.cantidad||0})</option>;})}
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
function Ventas({data,save,del,esAdmin=false}){
  const [modal,setModal]=useState(false);
  const [editandoVenta,setEditandoVenta]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [maquinaId,setMaquinaId]=useState("");
  const [fechaReg,setFechaReg]=useState(today());
  const [items,setItems]=useState([{productoId:"",cantidad:""}]);
  const [mes,setMes]=useState(mesActual());
  const [formEdit,setFormEdit]=useState({fecha:"",maquinaId:"",productoId:"",cantidad:"",ingreso:""});
  // Modal sugerencia vinculada a venta
  const [modalSug,setModalSug]=useState(false);
  const [sugMaqId,setSugMaqId]=useState("");
  const [sugMaqNombre,setSugMaqNombre]=useState("");
  const [sugTexto,setSugTexto]=useState("");
  const [verSug,setVerSug]=useState(null); // sugerencia a visualizar
  const maqActivas=data.maquinas.filter(m=>m.activa);
  const abrirModalSug=(maqId,maqNombre)=>{setSugMaqId(maqId);setSugMaqNombre(maqNombre);setSugTexto("");setModalSug(true);};
  const guardarSug=()=>{
    if(!sugTexto.trim())return;
    const id=uid();
    save("sugerencias",id,{id,maquinaId:sugMaqId,mensaje:sugTexto,fecha:today()});
    setModalSug(false);setSugTexto("");
  };
  const getSugDeGrupo=(g)=>data.sugerencias.filter(s=>s.maquinaId===g.maquinaId&&s.fecha===g.fecha);
  const addItem=()=>setItems(i=>[...i,{productoId:"",cantidad:""}]);
  const removeItem=idx=>setItems(i=>i.filter((_,j)=>j!==idx));
  const setItem=(idx,f,v)=>setItems(i=>i.map((r,j)=>j===idx?{...r,[f]:v}:r));
  const totalModal=items.reduce((s,it)=>{const p=data.productos.find(p=>p.id===it.productoId);return s+(p&&it.cantidad?(p.precioVenta||(p.costo*(1+p.margen/100)))* +it.cantidad:0);},0);
  const doSave=async()=>{
    if(!maquinaId)return;
    const valid=items.filter(it=>it.productoId&&it.cantidad);
    if(!valid.length)return;
    for(const it of valid){
      const prod=data.productos.find(p=>p.id===it.productoId);
      const precio=prod?(prod.precioVenta||(prod.costo*(1+prod.margen/100))):0;
      const id=uid();
      await save("ventas",id,{id,fecha:fechaReg,maquinaId,productoId:it.productoId,cantidad:+it.cantidad,ingreso:+(precio* +it.cantidad).toFixed(2)});
    }
    setModal(false);
    // Guardar maquinaId para ofrecer sugerencia
    const _maq=data.maquinas.find(m=>m.id===maquinaId);
    setMaquinaId("");setFechaReg(today());setItems([{productoId:"",cantidad:""}]);
    // Ofrecer sugerencia automáticamente después de registrar
    if(_maq)abrirModalSug(_maq.id,_maq.nombre);
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
        <div className="section-header"><h3>Ventas — {nombreMes(mes)}</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={13}/> Registrar</button></div>
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
                    <button className="btn btn-secondary btn-sm" style={{padding:"1px 6px",fontSize:10}} onClick={()=>abrirEditar(v)}><Icon name="edit" size={10}/></button>
                    {esAdmin&&<button className="btn btn-danger btn-sm" style={{padding:"1px 6px",fontSize:10}} onClick={()=>setConfirmDel(v)}><Icon name="trash" size={10}/></button>}
                  </div>
                ))}</td>
                <td style={{color:"var(--green)",fontWeight:700}}>{fmt(g.total)}</td>
                <td>{(()=>{
                  const sugs=getSugDeGrupo(g);
                  if(sugs.length===0) return(
                    !esAdmin?<button className="btn btn-secondary btn-sm" style={{fontSize:10,gap:3}} onClick={()=>abrirModalSug(g.maquinaId,data.maquinas.find(m=>m.id===g.maquinaId)?.nombre||"")}>
                      💡 Agregar sugerencia
                    </button>:<span style={{color:"var(--muted)",fontSize:11}}>—</span>
                  );
                  return <button className="btn btn-secondary btn-sm" style={{fontSize:10,gap:3,color:"var(--accent)"}} onClick={()=>setVerSug(sugs[0])}>
                    💡 Ver sugerencia
                  </button>;
                })()}</td>
              </tr>);
            })}
          </tbody>
        </table></div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
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
      {/* Modal nueva sugerencia post-venta */}
      {modalSug&&<div className="modal-overlay"><div className="modal" style={{maxWidth:420}}>
        <h3>💡 Agregar sugerencia</h3>
        <div className="edit-banner">Máquina: <strong>{sugMaqNombre}</strong></div>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>Puedes dejar una nota o sugerencia para esta máquina. Ejemplo: "Nos pidieron un producto nuevo".</p>
        <div className="form-group">
          <label>Tu sugerencia</label>
          <textarea value={sugTexto} onChange={e=>setSugTexto(e.target.value)} placeholder="Ej: Podemos colocar Doritos, los clientes lo están pidiendo..." style={{minHeight:90,resize:"vertical"}}/>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModalSug(false)}>Omitir</button>
          <button className="btn btn-primary" onClick={guardarSug}>Guardar sugerencia</button>
        </div>
      </div></div>}

      {/* Modal ver sugerencia (admin) */}
      {verSug&&<div className="modal-overlay"><div className="modal" style={{maxWidth:420}}>
        <h3>💡 Sugerencia del abastecedor</h3>
        <div className="edit-banner">Máquina: <strong>{data.maquinas.find(m=>m.id===verSug.maquinaId)?.nombre}</strong> — {verSug.fecha}</div>
        <div style={{background:"var(--surface2)",borderRadius:10,padding:"14px 16px",fontSize:14,lineHeight:1.6,border:"1px solid var(--border)"}}>
          {verSug.mensaje}
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={()=>setVerSug(null)}>Cerrar</button>
        </div>
      </div></div>}

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

// ─── COBRANZAS con fecha y borrado ───────────────────────────────────────────
function Cobranzas({data,save,del,usuario,esAdmin=false}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [form,setForm]=useState({maquinaId:"",monto:"",fecha:today()});
  const [formEdit,setFormEdit]=useState({fecha:"",maquinaId:"",monto:""});
  const [mes,setMes]=useState(mesActual());
  const maqActivas=data.maquinas.filter(m=>m.activa);
  const doSave=()=>{
    if(!form.maquinaId||!form.monto)return;
    const id=uid();
    save("cobranzas",id,{id,fecha:form.fecha,maquinaId:form.maquinaId,monto:+form.monto,responsable:usuario});
    setModal(false);setForm({maquinaId:"",monto:"",fecha:today()});
  };
  const abrirEditar=(c)=>{setFormEdit({fecha:c.fecha,maquinaId:c.maquinaId,monto:String(c.monto)});setEditando(c);};
  const doGuardarEdicion=()=>{
    if(!editando)return;
    save("cobranzas",editando.id,{...editando,fecha:formEdit.fecha,maquinaId:formEdit.maquinaId,monto:+formEdit.monto});
    setEditando(null);
  };
  const cobranzasMes=data.cobranzas.filter(c=>c.fecha?.startsWith(mes));
  const totalMes=cobranzasMes.reduce((s,c)=>s+(c.monto||0),0);
  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      <div className="cards"><div className="card"><div className="card-label">Total {nombreMes(mes)}</div><div className="card-value green">{fmt(totalMes)}</div><div className="card-sub">{cobranzasMes.length} visitas</div></div></div>
      <div className="section">
        <div className="section-header"><h3>Cobranza — {nombreMes(mes)}</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={13}/> Registrar</button></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Máquina</th><th>Ubicación</th><th>Monto</th><th>Responsable</th><th>Acciones</th></tr></thead>
          <tbody>
            {cobranzasMes.length===0?<tr><td colSpan={6} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin cobranzas en {nombreMes(mes)}</td></tr>
            :[...cobranzasMes].reverse().map(c=>{
              const maq=data.maquinas.find(m=>m.id===c.maquinaId);
              return(<tr key={c.id}>
                <td style={{color:"var(--muted)"}}>{c.fecha}</td>
                <td><strong>{maq?.nombre}</strong></td>
                <td style={{color:"var(--muted)",fontSize:11}}>{maq?.ubicacion}</td>
                <td style={{color:"var(--green)",fontWeight:700}}>{fmt(c.monto)}</td>
                <td style={{color:"var(--muted)"}}>{c.responsable}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(c)}><Icon name="edit" size={12}/></button>
                  {esAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>setConfirmDel(c)}><Icon name="trash" size={12}/></button>}
                </div></td>
              </tr>);
            })}
          </tbody>
        </table></div>
      </div>
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
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>Registrar</button></div>
      </div></div>}
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
  return(
    <div>
      <div className="info-box">Lista de precios económicos — todos los productos con su precio reducido configurado.</div>
      <div className="section">
        <div className="section-header"><h3>Lista de precios económica</h3></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Producto</th><th>Proveedor</th><th>Precio económico</th></tr></thead>
          <tbody>
            {data.productos.filter(p=>p.precioEco).length===0
              ?<tr><td colSpan={3} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin precios económicos. El administrador puede agregarlos en Productos.</td></tr>
              :data.productos.filter(p=>p.precioEco).map(p=>(
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

// ─── NAVEGACIÓN ─────────────────────────────────────────────────────────────────
const ADMIN_NAV=[
  {section:"General"},{id:"dashboard",label:"Dashboard",icon:"chart"},{id:"rentabilidad",label:"Rentabilidad",icon:"trend"},
  {id:"horario",label:"Horario semanal",icon:"calendar"},{id:"gastos",label:"Gastos adicionales",icon:"bolt"},
  {section:"Catálogo"},{id:"productos",label:"Productos",icon:"product"},{id:"proveedores",label:"Proveedores",icon:"supplier"},
  {section:"Operaciones"},{id:"maquinas",label:"Máquinas",icon:"machine"},{id:"stock",label:"Stock almacén",icon:"stock"},
  {id:"traslados",label:"Traslados",icon:"transfer"},{id:"ventas",label:"Ventas",icon:"chart"},{id:"cobranzas",label:"Cobranzas",icon:"money"},
  {id:"devoluciones",label:"Devoluciones",icon:"devolver"},
];
const ABASTECEDOR_NAV=[
  {section:"Mi semana"},{id:"mihorario",label:"Mi horario",icon:"calendar"},
  {section:"Operaciones"},{id:"ventas",label:"Ventas del día",icon:"chart"},{id:"cobranzas",label:"Cobranza",icon:"money"},
  {id:"traslados",label:"Traslados",icon:"transfer"},{id:"devoluciones",label:"Devoluciones",icon:"devolver"},
  {section:"Consultas"},{id:"precios",label:"Lista de precios",icon:"tag"},{id:"preciosEco",label:"Precios económicos",icon:"pricetag"},{id:"stock",label:"Stock almacén",icon:"stock"},{id:"maquinas",label:"Mis máquinas",icon:"machine"},
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
  devoluciones:"Devoluciones",sugerencias:"Sugerencias",
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
    case "rentabilidad": return <Rentabilidad data={data}/>;
    case "horario":      return <HorarioAdmin data={data} save={save}/>;
    case "mihorario":    return <MiHorario data={data} save={save} puedeComentarMaq={esAbastecedor||esAdmin}/>;
    case "gastos":       return <GastosAdicionales data={data} save={save} del={del}/>;
    case "productos":    return <Productos data={data} save={save} del={del} soloEditar={esAlmacenero}/>;
    case "precios":      return <ListaPrecios data={data}/>;
    case "proveedores":  return <Proveedores data={data} save={save} del={del} soloEditar={esAlmacenero}/>;
    case "maquinas":     return <Maquinas data={data} save={save} del={del} esAdmin={esAdmin} esAbastecedor={esAbastecedor} soloEditar={esAlmacenero}/>;
    case "stock":        return <Stock data={data} save={save} del={del} soloLectura={false} esAdmin={esAdmin}/>;
    case "traslados":    return <Traslados data={data} save={save} saveMulti={saveMulti} del={del} usuario={nombreUsuario} esAdmin={esAdmin} soloLectura={esAlmacenero}/>;
    case "ventas":       return <Ventas data={data} save={save} del={del} esAdmin={esAdmin}/>;
    case "cobranzas":    return <Cobranzas data={data} save={save} del={del} usuario={nombreUsuario} esAdmin={esAdmin}/>;
    case "preciosEco":   return <ListaPreciosEco data={data}/>;
    case "devoluciones": return <Devoluciones data={data} save={save} del={del} soloLectura={esAlmacenero} esAdmin={esAdmin} puedeEditar={esAdmin||esAbastecedor}/>;
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
