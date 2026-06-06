import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, set, push } from "firebase/database";

const SEED = {
  productos: {
    p1:{id:"p1",nombre:"Coca Cola 500ml",costo:2.5,margen:40,precioVenta:3.50,proveedor:"Coca-Cola SAC"},
    p2:{id:"p2",nombre:"Agua San Luis 600ml",costo:1.2,margen:50,precioVenta:1.80,proveedor:"Backus"},
    p3:{id:"p3",nombre:"Snickers",costo:1.8,margen:45,precioVenta:2.60,proveedor:"Mars Inc."},
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
  traslados:{},ventas:{},cobranzas:{},
  horario:{lunes:{maquinas:[]},martes:{maquinas:[]},miercoles:{maquinas:[]},jueves:{maquinas:[]},viernes:{maquinas:[]},sabado:{maquinas:[]},domingo:{maquinas:[]}},
};

const fmt=(n)=>`S/ ${Number(n||0).toFixed(2)}`;
const today=()=>new Date().toISOString().split("T")[0];
const objToArr=(o)=>o?Object.values(o):[];
const uid=()=>push(ref(db,"_tmp")).key;
const mesActual=()=>new Date().toISOString().slice(0,7);
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const nombreMes=(ym)=>{const[y,m]=ym.split("-");return `${MESES[parseInt(m)-1]} ${y}`;};

const Icon=({name,size=18})=>{
  const p={
    machine:<path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 4v6m-3-3h6" strokeLinecap="round" strokeLinejoin="round"/>,
    product:<path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-10 5H6m4 0h4" strokeLinecap="round" strokeLinejoin="round"/>,
    supplier:<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>,
    stock:<path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" strokeLinecap="round" strokeLinejoin="round"/>,
    transfer:<path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round"/>,
    money:<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>,
    chart:<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>,
    logout:<path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>,
    plus:<path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/>,
    trash:<path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>,
    location:<path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>,
    trend:<path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>,
    alert:<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>,
    spin:<path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>,
    edit:<path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>,
    calendar:<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>,
    tag:<path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round"/>,
    menu:<path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"/>,
    close:<path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>,
    chevL:<path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>,
    chevR:<path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{p[name]}</svg>;
};

// Logo usando la imagen real (PNG en base64-like via img tag con la URL del logo)
const GamaticLogo=({collapsed=false})=>(
  <div style={{display:"flex",alignItems:"center",gap:8,overflow:"hidden"}}>
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
    {!collapsed&&<span style={{fontWeight:900,fontSize:20,color:"#f59e0b",letterSpacing:2,fontFamily:"Arial Black,sans-serif",whiteSpace:"nowrap"}}>GAMATIC</span>}
  </div>
);

const css=`
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root{--bg:#0a0e1a;--surface:#111827;--surface2:#1a2235;--border:#1e2d45;--accent:#f59e0b;--accent2:#3b82f6;--green:#10b981;--red:#ef4444;--text:#f1f5f9;--muted:#64748b;--radius:12px;}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
  h1,h2,h3,h4{font-family:'Syne',sans-serif}
  .app{display:flex;min-height:100vh;position:relative}

  /* SIDEBAR DESKTOP */
  .sidebar{width:240px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;transition:width .2s;z-index:50}
  .sidebar-logo{padding:18px 16px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;min-height:64px}
  .sidebar-role{margin:10px 12px;background:var(--surface2);border-radius:8px;padding:7px 11px;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px;overflow:hidden;white-space:nowrap}
  .sidebar-role span{color:var(--accent);font-weight:600}
  .nav{flex:1;padding:6px 0;overflow-y:auto}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 18px;cursor:pointer;color:var(--muted);font-size:13px;font-weight:500;transition:all .15s;border-left:3px solid transparent;white-space:nowrap;overflow:hidden}
  .nav-item:hover{color:var(--text);background:var(--surface2)}
  .nav-item.active{color:var(--accent);background:rgba(245,158,11,.08);border-left-color:var(--accent)}
  .nav-section{padding:12px 18px 4px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600;white-space:nowrap;overflow:hidden}
  .logout-btn{padding:14px 18px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer;color:var(--muted);font-size:13px;transition:color .15s;white-space:nowrap}
  .logout-btn:hover{color:var(--red)}

  /* MOBILE OVERLAY */
  .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:49;backdrop-filter:blur(2px)}

  /* MAIN */
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
  .topbar{padding:0 16px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;height:56px;gap:10px}
  .topbar h1{font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .topbar-date{font-size:11px;color:var(--muted);white-space:nowrap;display:none}
  .hamburger{background:none;border:none;color:var(--muted);cursor:pointer;padding:6px;border-radius:8px;display:none;flex-shrink:0}
  .hamburger:hover{background:var(--surface2);color:var(--text)}
  .content{flex:1;padding:16px;overflow-y:auto}

  /* CARDS */
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px}
  .card-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
  .card-value{font-size:20px;font-family:'Syne',sans-serif;font-weight:700}
  .card-value.green{color:var(--green)}.card-value.amber{color:var(--accent)}.card-value.blue{color:var(--accent2)}.card-value.red{color:var(--red)}
  .card-sub{font-size:11px;color:var(--muted);margin-top:3px}

  /* SECTION */
  .section{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:16px;overflow:hidden}
  .section-header{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:8px}
  .section-header h3{font-size:13px;font-weight:700}

  /* TABLE — scroll horizontal en móvil */
  .table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
  table{width:100%;border-collapse:collapse;font-size:12px;min-width:480px}
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
  .btn-danger{background:rgba(239,68,68,.15);color:var(--red)}
  .btn-sm{padding:3px 9px;font-size:11px}

  /* MODAL */
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
  .add-prod-btn{background:rgba(245,158,11,.12);border:1px dashed var(--accent);border-radius:8px;padding:7px;color:var(--accent);cursor:pointer;font-size:12px;font-weight:600;width:100%;display:flex;align-items:center;justify-content:center;gap:5px;transition:background .15s}

  /* LOGIN */
  .login-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:16px}
  .login-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px 24px;width:100%;max-width:400px}
  .login-logo{text-align:center;margin-bottom:24px}
  .login-logo p{color:var(--muted);font-size:13px;margin-top:8px}
  .role-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:20px}
  .role-card{padding:14px;border:2px solid var(--border);border-radius:12px;cursor:pointer;text-align:center;transition:all .15s}
  .role-card:hover{border-color:var(--accent)}
  .role-card.selected{border-color:var(--accent);background:rgba(245,158,11,.08)}
  .role-card h4{font-size:13px;font-weight:700;margin-bottom:3px}
  .role-card p{font-size:11px;color:var(--muted)}

  /* FILTRO FECHA */
  .filtro-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px}
  .filtro-bar select,.filtro-bar input{padding:7px 11px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:'DM Sans',sans-serif;outline:none}
  .filtro-bar select:focus,.filtro-bar input:focus{border-color:var(--accent)}
  .filtro-label{font-size:11px;color:var(--muted);font-weight:600}

  /* MES NAVEGACION */
  .mes-nav{display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:6px 12px;margin-bottom:18px}
  .mes-nav span{font-weight:700;font-size:14px;flex:1;text-align:center}
  .mes-nav button{background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;border-radius:6px;display:flex;align-items:center}
  .mes-nav button:hover{background:var(--border);color:var(--text)}

  /* RENTABILIDAD */
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

  /* HORARIO */
  .horario-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:4px}
  .dia-col{background:var(--surface2);border:1px solid var(--border);border-radius:9px;overflow:hidden}
  .dia-header{padding:6px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;background:rgba(245,158,11,.1);color:var(--accent);border-bottom:1px solid var(--border)}
  .dia-body{padding:6px}
  .dia-maq{font-size:10px;padding:4px 6px;background:var(--surface);border-radius:5px;margin-bottom:4px;color:var(--text);border:1px solid var(--border)}
  .dia-empty{font-size:10px;color:var(--muted);padding:4px 6px;font-style:italic}
  .precio-estimado{font-size:11px;color:var(--muted);text-decoration:line-through}
  .precio-real{font-size:13px;font-weight:700;color:var(--green)}
  .info-box{background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);border-radius:9px;padding:9px 13px;font-size:12px;color:var(--accent2);margin-bottom:11px}

  /* RESPONSIVE */
  @media(min-width:768px){
    .hamburger{display:none!important}
    .topbar{padding:0 24px;height:60px}
    .topbar h1{font-size:18px}
    .topbar-date{display:block}
    .content{padding:22px 24px}
    .cards{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:20px}
    .card{padding:18px}
    .card-value{font-size:22px}
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
  }
`;

function useFirebase(){
  const [data,setData]=useState(null);
  const [syncing,setSyncing]=useState(false);
  useEffect(()=>{
    const rootRef=ref(db,"gamatic");
    return onValue(rootRef,(snap)=>{
      const val=snap.val();
      if(!val){set(ref(db,"gamatic"),SEED);return;}
      setData({
        productos:objToArr(val.productos),
        proveedores:objToArr(val.proveedores),
        maquinas:objToArr(val.maquinas),
        stock:objToArr(val.stock),
        traslados:objToArr(val.traslados),
        ventas:objToArr(val.ventas),
        cobranzas:objToArr(val.cobranzas),
        horario:val.horario||SEED.horario,
      });
    });
  },[]);
  const save=async(path,id,value)=>{setSyncing(true);await set(ref(db,`gamatic/${path}/${id}`),value);setSyncing(false);};
  const saveMulti=async(ops)=>{setSyncing(true);for(const[path,id,value]of ops)await set(ref(db,`gamatic/${path}/${id}`),value);setSyncing(false);};
  return{data,save,saveMulti,syncing};
}

// ── MES NAV ──
function MesNav({mes,setMes}){
  const prev=()=>{const[y,m]=mes.split("-").map(Number);const d=new Date(y,m-2);setMes(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};
  const next=()=>{const[y,m]=mes.split("-").map(Number);const d=new Date(y,m);setMes(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};
  const esActual=mes===mesActual();
  return(
    <div className="mes-nav">
      <button onClick={prev}><Icon name="chevL" size={16}/></button>
      <span>{nombreMes(mes)}</span>
      <button onClick={next} disabled={esActual} style={{opacity:esActual?.3:1}}><Icon name="chevR" size={16}/></button>
    </div>
  );
}

// ── LOGIN ──
function LoginScreen({onLogin}){
  const [role,setRole]=useState("admin");
  return(
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><GamaticLogo/></div>
          <p>Sistema de gestión de máquinas expendedoras</p>
        </div>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>Selecciona tu perfil:</p>
        <div className="role-grid">
          {[["admin","👤","Administrador","Gestión total del sistema"],["abastecedor","🔧","Abastecedor","Operaciones de campo"]].map(([r,ico,lbl,sub])=>(
            <div key={r} className={`role-card ${role===r?"selected":""}`} onClick={()=>setRole(r)}>
              <div style={{fontSize:26,marginBottom:5}}>{ico}</div>
              <h4>{lbl}</h4><p>{sub}</p>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",padding:13,fontSize:14}} onClick={()=>onLogin(role)}>
          Ingresar como {role==="admin"?"Administrador":"Abastecedor"}
        </button>
      </div>
    </div>
  );
}

// ── DASHBOARD ──
function Dashboard({data}){
  const [mes,setMes]=useState(mesActual());
  const ventasMes=data.ventas.filter(v=>v.fecha&&v.fecha.startsWith(mes));
  const cobranzasMes=data.cobranzas.filter(c=>c.fecha&&c.fecha.startsWith(mes));
  const totalVentas=ventasMes.reduce((s,v)=>s+(v.ingreso||0),0);
  const totalCobr=cobranzasMes.reduce((s,c)=>s+(c.monto||0),0);
  const totalAlq=data.maquinas.reduce((s,m)=>s+(m.alquiler||0),0);
  const costoProds=ventasMes.reduce((s,v)=>{const p=data.productos.find(p=>p.id===v.productoId);return s+(p?p.costo*v.cantidad:0);},0);
  const utilidad=totalVentas-costoProds-totalAlq;
  const stockBajo=data.stock.filter(s=>s.cantidad<=s.minimo);

  // avance del mes dia a dia
  const diasConVentas=[...new Set(ventasMes.map(v=>v.fecha))].sort();
  const acumulado=diasConVentas.map(d=>{
    const hasta=ventasMes.filter(v=>v.fecha<=d);
    return{fecha:d,total:hasta.reduce((s,v)=>s+(v.ingreso||0),0)};
  });

  return(
    <div>
      {stockBajo.length>0&&<div className="alert-box"><Icon name="alert" size={14}/>{stockBajo.length} producto(s) con stock bajo mínimo</div>}
      <MesNav mes={mes} setMes={setMes}/>
      <div className="cards">
        {[["Ventas",fmt(totalVentas),"green",`${ventasMes.length} registros`],
          ["Cobranza",fmt(totalCobr),"amber",`${cobranzasMes.length} visitas`],
          ["Alquiler",fmt(totalAlq),"blue",`${data.maquinas.length} máquinas`],
          ["Utilidad",fmt(utilidad),utilidad>=0?"green":"red","ventas − costos − alquiler"],
        ].map(([l,v,c,s])=>(
          <div key={l} className="card"><div className="card-label">{l}</div><div className={`card-value ${c}`}>{v}</div><div className="card-sub">{s}</div></div>
        ))}
      </div>

      {acumulado.length>0&&(
        <div className="section" style={{marginBottom:16}}>
          <div className="section-header"><h3>Avance de ventas — {nombreMes(mes)}</h3></div>
          <div style={{padding:14}}>
            {acumulado.map((a,i)=>{
              const pct=totalVentas>0?(a.total/totalVentas*100):0;
              return(
                <div key={i} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                    <span style={{color:"var(--muted)"}}>{a.fecha}</span>
                    <span style={{color:"var(--green)",fontWeight:600}}>{fmt(a.total)}</span>
                  </div>
                  <div style={{height:6,background:"var(--surface2)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"var(--green)",borderRadius:4,transition:"width .3s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-header"><h3>Rendimiento por máquina — {nombreMes(mes)}</h3></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Máquina</th><th>Ubicación</th><th>Ventas</th><th>Alquiler</th><th>Rentabilidad</th></tr></thead>
            <tbody>
              {data.maquinas.map(m=>{
                const vm=ventasMes.filter(v=>v.maquinaId===m.id);
                const ing=vm.reduce((s,v)=>s+(v.ingreso||0),0);
                const cost=vm.reduce((s,v)=>{const p=data.productos.find(p=>p.id===v.productoId);return s+(p?p.costo*v.cantidad:0);},0);
                const rent=ing-cost-(m.alquiler||0);
                return(<tr key={m.id}>
                  <td><strong>{m.nombre}</strong></td>
                  <td style={{color:"var(--muted)",fontSize:11}}>{m.ubicacion}</td>
                  <td>{fmt(ing)}</td>
                  <td style={{color:"var(--red)"}}>{fmt(m.alquiler)}</td>
                  <td><span className={`badge ${rent>=0?"green":"red"}`}>{fmt(rent)}</span></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── RENTABILIDAD ──
function Rentabilidad({data}){
  const [mes,setMes]=useState(mesActual());
  const ventasMes=data.ventas.filter(v=>v.fecha&&v.fecha.startsWith(mes));
  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      {data.maquinas.map(m=>{
        const vm=ventasMes.filter(v=>v.maquinaId===m.id);
        const ing=vm.reduce((s,v)=>s+(v.ingreso||0),0);
        const cost=vm.reduce((s,v)=>{const p=data.productos.find(p=>p.id===v.productoId);return s+(p?p.costo*v.cantidad:0);},0);
        const util=ing-cost-(m.alquiler||0);
        const roi=ing>0?((util/ing)*100).toFixed(1):0;
        const tipo=util>50?"positive":util>=0?"neutral":"negative";
        return(
          <div key={m.id} className={`profit-card profit-${tipo}`}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><div style={{fontWeight:700,fontSize:14,fontFamily:"'Syne',sans-serif"}}>{m.nombre}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.ubicacion}</div></div>
              <span className={`badge ${tipo==="positive"?"green":tipo==="negative"?"red":"amber"}`}>ROI: {roi}%</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:8}}>
              {[["Ingresos",fmt(ing),"var(--green)"],["Costo prod.",fmt(cost),"var(--muted)"],["Alquiler",fmt(m.alquiler),"var(--red)"],["Utilidad",fmt(util),util>=0?"var(--green)":"var(--red)"]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(0,0,0,.2)",padding:"8px 10px",borderRadius:8}}>
                  <div style={{fontSize:9,color:"var(--muted)",marginBottom:2,textTransform:"uppercase"}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:700,color:c,fontFamily:"'Syne',sans-serif"}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"7px 10px",background:"rgba(0,0,0,.2)",borderRadius:8,fontSize:12}}>
              {util>=100&&"✅ Muy rentable — considera expandir"}
              {util>=0&&util<100&&"⚠️ Rentable con margen ajustado"}
              {util<0&&"❌ No rentable — revisar alquiler o ubicación"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── PRODUCTOS (Admin) ──
function Productos({data,save}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [precioEdit,setPrecioEdit]=useState("");
  const [form,setForm]=useState({nombre:"",costo:"",margen:"",precioVenta:"",proveedor:""});
  const est=(c,m)=>c&&m?(+c*(1+ +m/100)).toFixed(2):"";
  const doSave=()=>{
    if(!form.nombre||!form.costo)return;
    const e=parseFloat(est(form.costo,form.margen));
    const id=uid();
    save("productos",id,{id,nombre:form.nombre,costo:+form.costo,margen:+form.margen,precioVenta:form.precioVenta?+form.precioVenta:e,proveedor:form.proveedor});
    setModal(false);setForm({nombre:"",costo:"",margen:"",precioVenta:"",proveedor:""});
  };
  const guardarPrecio=(p)=>{save("productos",p.id,{...p,precioVenta:+precioEdit});setEditando(null);};
  return(
    <div>
      <div className="section">
        <div className="section-header"><h3>Catálogo de productos</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={13}/> Agregar</button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Producto</th><th>Proveedor</th><th>Costo</th><th>Margen</th><th>Estimado</th><th>Precio venta</th></tr></thead>
            <tbody>
              {data.productos.map(p=>{
                const e=(p.costo*(1+p.margen/100)).toFixed(2);
                return(<tr key={p.id}>
                  <td><strong>{p.nombre}</strong></td>
                  <td style={{color:"var(--muted)"}}>{p.proveedor}</td>
                  <td>{fmt(p.costo)}</td>
                  <td><span className="badge amber">{p.margen}%</span></td>
                  <td><span className="precio-estimado">S/ {e}</span></td>
                  <td>
                    {editando===p.id
                      ?<div style={{display:"flex",gap:5,alignItems:"center"}}>
                          <input type="number" step="0.10" value={precioEdit} onChange={e=>setPrecioEdit(e.target.value)} style={{width:75,padding:"4px 7px",background:"var(--surface2)",border:"1px solid var(--accent)",borderRadius:7,color:"var(--text)",fontSize:12}}/>
                          <button className="btn btn-primary btn-sm" onClick={()=>guardarPrecio(p)}>OK</button>
                          <button className="btn btn-secondary btn-sm" onClick={()=>setEditando(null)}>✕</button>
                        </div>
                      :<div style={{display:"flex",alignItems:"center",gap:7}}>
                          <span className="precio-real">{fmt(p.precioVenta||e)}</span>
                          <button className="btn btn-secondary btn-sm" onClick={()=>{setEditando(p.id);setPrecioEdit(p.precioVenta||e);}}><Icon name="edit" size={12}/></button>
                        </div>
                    }
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>Nuevo producto</h3>
        <div className="form-group"><label>Nombre</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Coca Cola 500ml"/></div>
        <div className="form-row">
          <div className="form-group"><label>Costo (S/)</label><input type="number" step="0.01" value={form.costo} onChange={e=>setForm({...form,costo:e.target.value})}/></div>
          <div className="form-group"><label>Margen (%)</label><input type="number" value={form.margen} onChange={e=>setForm({...form,margen:e.target.value})}/></div>
        </div>
        {form.costo&&form.margen&&<div className="info-box">Precio estimado: <strong>S/ {est(form.costo,form.margen)}</strong></div>}
        <div className="form-group"><label>Precio real de venta (puedes redondearlo)</label><input type="number" step="0.10" value={form.precioVenta} onChange={e=>setForm({...form,precioVenta:e.target.value})} placeholder={`Ej: ${est(form.costo,form.margen)||"2.50"}`}/></div>
        <div className="form-group"><label>Proveedor</label>
          <select value={form.proveedor} onChange={e=>setForm({...form,proveedor:e.target.value})}>
            <option value="">Seleccionar...</option>
            {data.proveedores.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>Guardar</button></div>
      </div></div>}
    </div>
  );
}

function ListaPrecios({data}){
  return(
    <div>
      <div className="info-box">Precios de venta que debes cobrar al cargar las máquinas.</div>
      <div className="section">
        <div className="section-header"><h3>Precios de venta</h3></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Producto</th><th>Proveedor</th><th>Precio de venta</th></tr></thead>
            <tbody>
              {data.productos.map(p=>(
                <tr key={p.id}>
                  <td><strong>{p.nombre}</strong></td>
                  <td style={{color:"var(--muted)"}}>{p.proveedor}</td>
                  <td><span className="precio-real">{fmt(p.precioVenta||(p.costo*(1+p.margen/100)))}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Proveedores({data,save}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const EF={nombre:"",contacto:"",telefono:""};
  const [form,setForm]=useState(EF);
  const abrirNuevo=()=>{setForm(EF);setEditando(null);setModal(true);};
  const abrirEditar=(p)=>{setForm({nombre:p.nombre,contacto:p.contacto,telefono:p.telefono});setEditando(p);setModal(true);};
  const doSave=()=>{
    if(!form.nombre)return;
    if(editando) save("proveedores",editando.id,{...editando,...form});
    else{const id=uid();save("proveedores",id,{id,...form});}
    setModal(false);setForm(EF);setEditando(null);
  };
  return(
    <div>
      <div className="section">
        <div className="section-header"><h3>Proveedores</h3><button className="btn btn-primary btn-sm" onClick={abrirNuevo}><Icon name="plus" size={13}/> Agregar</button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Empresa</th><th>Contacto</th><th>Teléfono</th><th>Productos</th><th>Acciones</th></tr></thead>
            <tbody>
              {data.proveedores.map(p=>(
                <tr key={p.id}>
                  <td><strong>{p.nombre}</strong></td>
                  <td>{p.contacto}</td>
                  <td style={{color:"var(--muted)"}}>{p.telefono}</td>
                  <td><span className="badge blue">{data.productos.filter(pr=>pr.proveedor===p.nombre).length}</span></td>
                  <td><button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(p)}><Icon name="edit" size={12}/> Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar proveedor":"Nuevo proveedor"}</h3>
        {editando&&<div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--accent)",marginBottom:14}}>Editando: <strong>{editando.nombre}</strong></div>}
        <div className="form-group"><label>Empresa</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div>
        <div className="form-row">
          <div className="form-group"><label>Contacto</label><input value={form.contacto} onChange={e=>setForm({...form,contacto:e.target.value})}/></div>
          <div className="form-group"><label>Teléfono</label><input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Guardar"}</button>
        </div>
      </div></div>}
    </div>
  );
}

function Maquinas({data,save,esAdmin}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null); // maquina seleccionada para editar
  const FORM_EMPTY={nombre:"",ubicacion:"",alquiler:""};
  const [form,setForm]=useState(FORM_EMPTY);

  const abrirNueva=()=>{setForm(FORM_EMPTY);setEditando(null);setModal(true);};
  const abrirEditar=(m)=>{setForm({nombre:m.nombre,ubicacion:m.ubicacion,alquiler:m.alquiler});setEditando(m);setModal(true);};

  const doSave=()=>{
    if(!form.nombre||!form.ubicacion)return;
    if(editando){
      // Editar existente — conserva id y activa original
      save("maquinas",editando.id,{...editando,nombre:form.nombre,ubicacion:form.ubicacion,alquiler:+form.alquiler});
    } else {
      // Nueva máquina
      const id=uid();
      save("maquinas",id,{id,nombre:form.nombre,ubicacion:form.ubicacion,alquiler:+form.alquiler,activa:true});
    }
    setModal(false);setForm(FORM_EMPTY);setEditando(null);
  };

  const toggleActiva=(m)=>save("maquinas",m.id,{...m,activa:!m.activa});

  return(
    <div>
      <div className="section">
        <div className="section-header">
          <h3>Máquinas registradas</h3>
          {esAdmin&&<button className="btn btn-primary btn-sm" onClick={abrirNueva}><Icon name="plus" size={13}/> Agregar</button>}
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Máquina</th><th>Ubicación</th>{esAdmin&&<th>Alquiler/mes</th>}<th>Estado</th>{esAdmin&&<th>Acciones</th>}</tr></thead>
            <tbody>
              {data.maquinas.map(m=>(
                <tr key={m.id}>
                  <td><strong>{m.nombre}</strong></td>
                  <td style={{fontSize:11,color:"var(--muted)"}}>{m.ubicacion}</td>
                  {esAdmin&&<td style={{color:"var(--red)"}}>{fmt(m.alquiler)}</td>}
                  <td>
                    {esAdmin
                      ? <div
                          onClick={()=>toggleActiva(m)}
                          title={m.activa?"Clic para desactivar":"Clic para activar"}
                          style={{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",padding:"3px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:m.activa?"rgba(16,185,129,.15)":"rgba(239,68,68,.15)",color:m.activa?"var(--green)":"var(--red)",userSelect:"none",transition:"all .2s"}}>
                          <span style={{width:7,height:7,borderRadius:"50%",background:m.activa?"var(--green)":"var(--red)",display:"inline-block"}}/>
                          {m.activa?"Activa":"Inactiva"}
                        </div>
                      : <span className={`badge ${m.activa?"green":"red"}`}>{m.activa?"Activa":"Inactiva"}</span>
                    }
                  </td>
                  {esAdmin&&(
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(m)} style={{gap:4}}>
                        <Icon name="edit" size={12}/> Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal&&esAdmin&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar máquina":"Nueva máquina"}</h3>
        {editando&&(
          <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--accent)",marginBottom:14}}>
            Editando: <strong>{editando.nombre}</strong>
          </div>
        )}
        <div className="form-group"><label>Nombre / Código</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Máquina D4"/></div>
        <div className="form-group"><label>Ubicación</label><input value={form.ubicacion} onChange={e=>setForm({...form,ubicacion:e.target.value})} placeholder="Ej: CC Real Plaza - Piso 2"/></div>
        <div className="form-group"><label>Alquiler mensual (S/)</label><input type="number" step="0.01" value={form.alquiler} onChange={e=>setForm({...form,alquiler:e.target.value})}/></div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Crear máquina"}</button>
        </div>
      </div></div>}
    </div>
  );
}

function Stock({data,save}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const EF={productoId:"",cantidad:"",minimo:""};
  const [form,setForm]=useState(EF);

  const abrirNuevo=()=>{setForm(EF);setEditando(null);setModal(true);};
  const abrirEditar=(s)=>{
    const prod=data.productos.find(p=>p.id===s.productoId);
    setForm({productoId:s.productoId,nombreProducto:prod?.nombre||"",cantidad:String(s.cantidad),minimo:String(s.minimo)});
    setEditando(s);setModal(true);
  };
  const doSave=()=>{
    if(editando){
      // Editar stock existente — también actualizar nombre en productos si cambió
      save("stock",editando.id,{...editando,cantidad:+form.cantidad,minimo:+form.minimo});
      // Si el nombre cambió, actualizar el producto también
      const prod=data.productos.find(p=>p.id===editando.productoId);
      if(prod&&form.nombreProducto&&form.nombreProducto!==prod.nombre){
        save("productos",prod.id,{...prod,nombre:form.nombreProducto});
      }
    } else {
      if(!form.productoId||!form.cantidad)return;
      const existe=data.stock.find(s=>s.productoId===form.productoId);
      if(existe)save("stock",existe.id,{...existe,cantidad:existe.cantidad+ +form.cantidad});
      else{const id=uid();save("stock",id,{id,productoId:form.productoId,cantidad:+form.cantidad,minimo:+form.minimo||10});}
    }
    setModal(false);setForm(EF);setEditando(null);
  };

  return(
    <div>
      <div className="section">
        <div className="section-header"><h3>Stock del almacén</h3><button className="btn btn-primary btn-sm" onClick={abrirNuevo}><Icon name="plus" size={13}/> Entrada</button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Mínimo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {data.stock.map(s=>{
                const prod=data.productos.find(p=>p.id===s.productoId);
                const bajo=s.cantidad<=s.minimo;
                return(<tr key={s.id}>
                  <td><strong>{prod?.nombre||"—"}</strong></td>
                  <td style={{fontSize:16,fontWeight:700,color:bajo?"var(--red)":"var(--text)"}}>{s.cantidad}</td>
                  <td style={{color:"var(--muted)"}}>{s.minimo}</td>
                  <td><span className={`badge ${bajo?"red":s.cantidad>s.minimo*2?"green":"amber"}`}>{bajo?"Stock bajo":s.cantidad>s.minimo*2?"OK":"Moderado"}</span></td>
                  <td><button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(s)}><Icon name="edit" size={12}/> Editar</button></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>{editando?"Editar stock":"Entrada de stock"}</h3>
        {editando&&<div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--accent)",marginBottom:14}}>Editando producto en stock</div>}
        {editando
          ? <>
              <div className="form-group"><label>Nombre del producto</label><input value={form.nombreProducto||""} onChange={e=>setForm({...form,nombreProducto:e.target.value})}/></div>
              <div className="form-row">
                <div className="form-group"><label>Cantidad en stock</label><input type="number" value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})}/></div>
                <div className="form-group"><label>Stock mínimo</label><input type="number" value={form.minimo} onChange={e=>setForm({...form,minimo:e.target.value})}/></div>
              </div>
            </>
          : <>
              <div className="form-group"><label>Producto</label>
                <select value={form.productoId} onChange={e=>setForm({...form,productoId:e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {data.productos.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Cantidad a ingresar</label><input type="number" value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})}/></div>
                <div className="form-group"><label>Stock mínimo</label><input type="number" value={form.minimo} onChange={e=>setForm({...form,minimo:e.target.value})} placeholder="10"/></div>
              </div>
            </>
        }
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>{setModal(false);setEditando(null);}}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>{editando?"Guardar cambios":"Registrar"}</button>
        </div>
      </div></div>}
    </div>
  );
}

function Traslados({data,save,saveMulti,usuario}){
  const [modal,setModal]=useState(false);
  const [maquinaId,setMaquinaId]=useState("");
  const [items,setItems]=useState([{productoId:"",cantidad:""}]);
  const [mes,setMes]=useState(mesActual());
  const addItem=()=>setItems(i=>[...i,{productoId:"",cantidad:""}]);
  const removeItem=idx=>setItems(i=>i.filter((_,j)=>j!==idx));
  const setItem=(idx,f,v)=>setItems(i=>i.map((r,j)=>j===idx?{...r,[f]:v}:r));
  const doSave=async()=>{
    if(!maquinaId)return;
    const valid=items.filter(it=>it.productoId&&it.cantidad);
    if(!valid.length)return;
    const ops=[];
    valid.forEach(it=>{
      const tId=uid();
      ops.push(["traslados",tId,{id:tId,fecha:today(),maquinaId,productoId:it.productoId,cantidad:+it.cantidad,responsable:usuario}]);
      const si=data.stock.find(s=>s.productoId===it.productoId);
      if(si)ops.push(["stock",si.id,{...si,cantidad:Math.max(0,si.cantidad- +it.cantidad)}]);
    });
    await saveMulti(ops);
    setModal(false);setMaquinaId("");setItems([{productoId:"",cantidad:""}]);
  };
  const trasladosMes=data.traslados.filter(t=>t.fecha&&t.fecha.startsWith(mes));
  const grupos={};
  [...trasladosMes].reverse().forEach(t=>{
    const key=`${t.fecha}__${t.maquinaId}`;
    if(!grupos[key])grupos[key]={fecha:t.fecha,maquinaId:t.maquinaId,responsable:t.responsable,items:[]};
    const prod=data.productos.find(p=>p.id===t.productoId);
    grupos[key].items.push({nombre:prod?.nombre||"—",cantidad:t.cantidad});
  });
  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      <div className="section">
        <div className="section-header"><h3>Traslados — {nombreMes(mes)}</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={13}/> Registrar</button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Máquina</th><th>Productos</th><th>Responsable</th></tr></thead>
            <tbody>
              {Object.values(grupos).length===0?<tr><td colSpan={4} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin traslados en {nombreMes(mes)}</td></tr>
              :Object.values(grupos).map((g,i)=>{
                const maq=data.maquinas.find(m=>m.id===g.maquinaId);
                return(<tr key={i}>
                  <td style={{color:"var(--muted)"}}>{g.fecha}</td>
                  <td><strong>{maq?.nombre}</strong><br/><span style={{fontSize:10,color:"var(--muted)"}}>{maq?.ubicacion}</span></td>
                  <td>{g.items.map((it,j)=><div key={j} style={{fontSize:11,marginBottom:2}}><span className="badge blue">{it.cantidad}</span> {it.nombre}</div>)}</td>
                  <td style={{color:"var(--muted)"}}>{g.responsable}</td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>Registrar traslado</h3>
        <div className="form-group"><label>Máquina destino</label>
          <select value={maquinaId} onChange={e=>setMaquinaId(e.target.value)}>
            <option value="">Seleccionar máquina...</option>
            {data.maquinas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Productos trasladados</label>
          <div style={{background:"var(--surface2)",borderRadius:9,padding:10,border:"1px solid var(--border)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px 32px",gap:7,marginBottom:6}}>
              <span style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase"}}>Producto</span>
              <span style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase"}}>Cant.</span>
              <span/>
            </div>
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
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>Registrar</button></div>
      </div></div>}
    </div>
  );
}

function Ventas({data,save}){
  const [modal,setModal]=useState(false);
  const [editandoVenta,setEditandoVenta]=useState(null);
  const [maquinaId,setMaquinaId]=useState("");
  const [items,setItems]=useState([{productoId:"",cantidad:""}]);
  const [mes,setMes]=useState(mesActual());
  // form edición individual
  const [formEdit,setFormEdit]=useState({fecha:"",maquinaId:"",productoId:"",cantidad:"",ingreso:""});

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
      await save("ventas",id,{id,fecha:today(),maquinaId,productoId:it.productoId,cantidad:+it.cantidad,ingreso:+(precio* +it.cantidad).toFixed(2)});
    }
    setModal(false);setMaquinaId("");setItems([{productoId:"",cantidad:""}]);
  };

  const abrirEditar=(v)=>{setFormEdit({fecha:v.fecha,maquinaId:v.maquinaId,productoId:v.productoId,cantidad:String(v.cantidad),ingreso:String(v.ingreso)});setEditandoVenta(v);};
  const doGuardarEdicion=()=>{
    if(!editandoVenta)return;
    save("ventas",editandoVenta.id,{...editandoVenta,fecha:formEdit.fecha,maquinaId:formEdit.maquinaId,productoId:formEdit.productoId,cantidad:+formEdit.cantidad,ingreso:+formEdit.ingreso});
    setEditandoVenta(null);
  };

  const ventasMes=data.ventas.filter(v=>v.fecha&&v.fecha.startsWith(mes));
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
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Máquina</th><th>Productos vendidos</th><th>Total</th></tr></thead>
            <tbody>
              {Object.values(grupos).length===0?<tr><td colSpan={4} style={{textAlign:"center",color:"var(--muted)",padding:20}}>Sin ventas en {nombreMes(mes)}</td></tr>
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
                    </div>
                  ))}</td>
                  <td style={{color:"var(--green)",fontWeight:700}}>{fmt(g.total)}</td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva venta */}
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>Registrar ventas del día</h3>
        <div className="form-group"><label>Máquina</label>
          <select value={maquinaId} onChange={e=>setMaquinaId(e.target.value)}>
            <option value="">Seleccionar máquina...</option>
            {data.maquinas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
          </select>
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

      {/* Modal editar venta individual */}
      {editandoVenta&&<div className="modal-overlay"><div className="modal">
        <h3>Editar registro de venta</h3>
        <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--accent)",marginBottom:14}}>
          Editando venta del {editandoVenta.fecha}
        </div>
        <div className="form-group"><label>Fecha</label><input type="date" value={formEdit.fecha} onChange={e=>setFormEdit({...formEdit,fecha:e.target.value})}/></div>
        <div className="form-group"><label>Máquina</label>
          <select value={formEdit.maquinaId} onChange={e=>setFormEdit({...formEdit,maquinaId:e.target.value})}>
            {data.maquinas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
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
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setEditandoVenta(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doGuardarEdicion}>Guardar cambios</button>
        </div>
      </div></div>}
    </div>
  );
}

function Cobranzas({data,save,usuario}){
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [form,setForm]=useState({maquinaId:"",monto:""});
  const [formEdit,setFormEdit]=useState({fecha:"",maquinaId:"",monto:""});
  const [mes,setMes]=useState(mesActual());

  const doSave=()=>{
    if(!form.maquinaId||!form.monto)return;
    const id=uid();
    save("cobranzas",id,{id,fecha:today(),maquinaId:form.maquinaId,monto:+form.monto,responsable:usuario});
    setModal(false);setForm({maquinaId:"",monto:""});
  };
  const abrirEditar=(c)=>{setFormEdit({fecha:c.fecha,maquinaId:c.maquinaId,monto:String(c.monto)});setEditando(c);};
  const doGuardarEdicion=()=>{
    if(!editando)return;
    save("cobranzas",editando.id,{...editando,fecha:formEdit.fecha,maquinaId:formEdit.maquinaId,monto:+formEdit.monto});
    setEditando(null);
  };

  const cobranzasMes=data.cobranzas.filter(c=>c.fecha&&c.fecha.startsWith(mes));
  const totalMes=cobranzasMes.reduce((s,c)=>s+(c.monto||0),0);
  return(
    <div>
      <MesNav mes={mes} setMes={setMes}/>
      <div className="cards">
        <div className="card"><div className="card-label">Total {nombreMes(mes)}</div><div className="card-value green">{fmt(totalMes)}</div><div className="card-sub">{cobranzasMes.length} visitas</div></div>
      </div>
      <div className="section">
        <div className="section-header"><h3>Cobranza — {nombreMes(mes)}</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={13}/> Registrar</button></div>
        <div className="table-wrap">
          <table>
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
                  <td><button className="btn btn-secondary btn-sm" onClick={()=>abrirEditar(c)}><Icon name="edit" size={12}/> Editar</button></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva cobranza */}
      {modal&&<div className="modal-overlay"><div className="modal">
        <h3>Registrar dinero recogido</h3>
        <div className="form-group"><label>Máquina</label>
          <select value={form.maquinaId} onChange={e=>setForm({...form,maquinaId:e.target.value})}>
            <option value="">Seleccionar...</option>
            {data.maquinas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Monto recogido (S/)</label><input type="number" step="0.01" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})}/></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={doSave}>Registrar</button></div>
      </div></div>}

      {/* Modal editar cobranza */}
      {editando&&<div className="modal-overlay"><div className="modal">
        <h3>Editar cobranza</h3>
        <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:9,padding:"8px 12px",fontSize:12,color:"var(--accent)",marginBottom:14}}>
          Editando cobranza del {editando.fecha}
        </div>
        <div className="form-group"><label>Fecha</label><input type="date" value={formEdit.fecha} onChange={e=>setFormEdit({...formEdit,fecha:e.target.value})}/></div>
        <div className="form-group"><label>Máquina</label>
          <select value={formEdit.maquinaId} onChange={e=>setFormEdit({...formEdit,maquinaId:e.target.value})}>
            {data.maquinas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Monto (S/)</label><input type="number" step="0.01" value={formEdit.monto} onChange={e=>setFormEdit({...formEdit,monto:e.target.value})}/></div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setEditando(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doGuardarEdicion}>Guardar cambios</button>
        </div>
      </div></div>}
    </div>
  );
}

const DIAS=["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];
const DIAS_L={lunes:"Lun",martes:"Mar",miercoles:"Mié",jueves:"Jue",viernes:"Vie",sabado:"Sáb",domingo:"Dom"};

function HorarioAdmin({data,save}){
  const [editando,setEditando]=useState(false);
  const [draft,setDraft]=useState(null);
  const abrir=()=>{const d={};DIAS.forEach(dia=>{d[dia]={maquinas:(data.horario[dia]?.maquinas||[]).slice()};});setDraft(d);setEditando(true);};
  const toggleMaq=(dia,maqId)=>setDraft(prev=>{const lista=[...(prev[dia]?.maquinas||[])];const idx=lista.indexOf(maqId);if(idx>=0)lista.splice(idx,1);else lista.push(maqId);return{...prev,[dia]:{maquinas:lista}};});
  const guardar=async()=>{for(const dia of DIAS)await save("horario",dia,draft[dia]);setEditando(false);};
  const horario=data.horario||{};
  return(
    <div>
      <div className="section">
        <div className="section-header"><h3>Horario semanal del abastecedor</h3><button className="btn btn-primary btn-sm" onClick={abrir}><Icon name="edit" size={13}/> Editar</button></div>
        <div style={{padding:14}}>
          <div className="horario-grid">
            {DIAS.map(dia=>{
              const maqIds=horario[dia]?.maquinas||[];
              return(<div key={dia} className="dia-col">
                <div className="dia-header">{DIAS_L[dia]}</div>
                <div className="dia-body">
                  {maqIds.length===0?<div className="dia-empty">Libre</div>:maqIds.map(id=>{const m=data.maquinas.find(m=>m.id===id);return<div key={id} className="dia-maq">📍 {m?.nombre||id}</div>;})}
                </div>
              </div>);
            })}
          </div>
        </div>
      </div>
      {editando&&draft&&<div className="modal-overlay"><div className="modal" style={{maxWidth:600}}>
        <h3>Editar horario semanal</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Toca para asignar o quitar una máquina de cada día.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {DIAS.map(dia=>(
            <div key={dia}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:"var(--accent)",marginBottom:7,textAlign:"center"}}>{DIAS_L[dia]}</div>
              {data.maquinas.map(m=>{
                const sel=(draft[dia]?.maquinas||[]).includes(m.id);
                return(<div key={m.id} onClick={()=>toggleMaq(dia,m.id)} style={{padding:"5px 7px",borderRadius:7,marginBottom:5,cursor:"pointer",fontSize:11,background:sel?"rgba(245,158,11,.15)":"var(--surface2)",border:`1px solid ${sel?"var(--accent)":"var(--border)"}`,color:sel?"var(--accent)":"var(--muted)",textAlign:"center",transition:"all .15s"}}>
                  {m.nombre}
                </div>);
              })}
            </div>
          ))}
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setEditando(false)}>Cancelar</button><button className="btn btn-primary" onClick={guardar}>Guardar</button></div>
      </div></div>}
    </div>
  );
}

function MiHorario({data}){
  const diasEs=["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
  const diaActual=diasEs[new Date().getDay()];
  const horario=data.horario||{};
  const maqHoy=horario[diaActual]?.maquinas||[];
  return(
    <div>
      <div style={{marginBottom:16,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.25)",borderRadius:12,padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><Icon name="calendar" size={15}/><span style={{fontWeight:700,fontSize:14}}>Hoy — {diaActual.charAt(0).toUpperCase()+diaActual.slice(1)}</span></div>
        {maqHoy.length===0?<p style={{color:"var(--muted)",fontSize:13}}>No tienes máquinas asignadas hoy.</p>
          :maqHoy.map(id=>{const m=data.maquinas.find(m=>m.id===id);return<div key={id} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:9,padding:"9px 13px",marginBottom:7,display:"flex",alignItems:"center",gap:9}}><Icon name="location" size={14}/><div><div style={{fontWeight:700,fontSize:13}}>{m?.nombre}</div><div style={{fontSize:11,color:"var(--muted)"}}>{m?.ubicacion}</div></div></div>;})}
      </div>
      <div className="section">
        <div className="section-header"><h3>Mi horario semanal</h3></div>
        <div style={{padding:14}}>
          <div className="horario-grid">
            {DIAS.map(dia=>{
              const maqIds=horario[dia]?.maquinas||[];
              const esHoy=dia===diaActual;
              return(<div key={dia} className="dia-col" style={esHoy?{border:"1px solid var(--accent)"}:{}}>
                <div className="dia-header" style={esHoy?{background:"rgba(245,158,11,.25)"}:{}}>{DIAS_L[dia]}{esHoy&&" ★"}</div>
                <div className="dia-body">
                  {maqIds.length===0?<div className="dia-empty">Libre</div>:maqIds.map(id=>{const m=data.maquinas.find(m=>m.id===id);return<div key={id} className="dia-maq">📍 {m?.nombre||id}</div>;})}
                </div>
              </div>);
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const ADMIN_NAV=[{section:"General"},{id:"dashboard",label:"Dashboard",icon:"chart"},{id:"rentabilidad",label:"Rentabilidad",icon:"trend"},{id:"horario",label:"Horario semanal",icon:"calendar"},{section:"Catálogo"},{id:"productos",label:"Productos",icon:"product"},{id:"proveedores",label:"Proveedores",icon:"supplier"},{section:"Operaciones"},{id:"maquinas",label:"Máquinas",icon:"machine"},{id:"stock",label:"Stock almacén",icon:"stock"},{id:"traslados",label:"Traslados",icon:"transfer"},{id:"ventas",label:"Ventas",icon:"chart"},{id:"cobranzas",label:"Cobranzas",icon:"money"}];
const ABASTECEDOR_NAV=[{section:"Mi semana"},{id:"mihorario",label:"Mi horario",icon:"calendar"},{section:"Operaciones"},{id:"ventas",label:"Ventas del día",icon:"chart"},{id:"cobranzas",label:"Cobranza",icon:"money"},{id:"traslados",label:"Traslados",icon:"transfer"},{section:"Consultas"},{id:"precios",label:"Lista de precios",icon:"tag"},{id:"stock",label:"Stock almacén",icon:"stock"},{id:"maquinas",label:"Mis máquinas",icon:"machine"}];
const TITLES={dashboard:"Dashboard",rentabilidad:"Rentabilidad",horario:"Horario semanal",mihorario:"Mi horario",productos:"Productos",proveedores:"Proveedores",maquinas:"Máquinas",stock:"Stock almacén",traslados:"Traslados",ventas:"Ventas",cobranzas:"Cobranzas",precios:"Precios de venta"};

export default function App(){
  const{data,save,saveMulti,syncing}=useFirebase();
  const[usuario,setUsuario]=useState(null);
  const[tab,setTab]=useState("dashboard");
  const[sidebarOpen,setSidebarOpen]=useState(false);

  const cerrarSidebar=()=>setSidebarOpen(false);
  const navegar=(id)=>{setTab(id);cerrarSidebar();};

  if(!data)return(<><style>{css}</style><div className="loading"><div className="spinner"><Icon name="spin" size={42}/></div><p>Conectando con la base de datos...</p></div></>);
  if(!usuario)return(<><style>{css}</style><LoginScreen onLogin={(role)=>{setUsuario(role);setTab(role==="admin"?"dashboard":"mihorario");}}/></>);

  const esAdmin=usuario==="admin";
  const nav=esAdmin?ADMIN_NAV:ABASTECEDOR_NAV;
  const nombreUsuario=esAdmin?"Administrador":"Abastecedor";
  const dateStr=new Date().toLocaleDateString("es-PE",{weekday:"short",day:"numeric",month:"short"});

  const renderContent=()=>{
    switch(tab){
      case "dashboard":    return<Dashboard data={data}/>;
      case "rentabilidad": return<Rentabilidad data={data}/>;
      case "horario":      return<HorarioAdmin data={data} save={save}/>;
      case "mihorario":    return<MiHorario data={data}/>;
      case "productos":    return<Productos data={data} save={save}/>;
      case "precios":      return<ListaPrecios data={data}/>;
      case "proveedores":  return<Proveedores data={data} save={save}/>;
      case "maquinas":     return<Maquinas data={data} save={save} esAdmin={esAdmin}/>;
      case "stock":        return<Stock data={data} save={save}/>;
      case "traslados":    return<Traslados data={data} save={save} saveMulti={saveMulti} usuario={nombreUsuario}/>;
      case "ventas":       return<Ventas data={data} save={save}/>;
      case "cobranzas":    return<Cobranzas data={data} save={save} usuario={nombreUsuario}/>;
      default:return null;
    }
  };

  return(
    <><style>{css}</style>
    <div className="app">
      {/* overlay móvil */}
      <div className={`sidebar-overlay ${sidebarOpen?"open":""}`} onClick={cerrarSidebar}/>

      <aside className={`sidebar ${sidebarOpen?"open":""}`}>
        <div className="sidebar-logo">
          <GamaticLogo/>
          <button style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",padding:4,display:"flex"}} onClick={cerrarSidebar}><Icon name="close" size={18}/></button>
        </div>
        <div className="sidebar-role">{esAdmin?"👤":"🔧"} <span>{nombreUsuario}</span></div>
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
        <div className="content">{renderContent()}</div>
      </main>
    </div>
    {syncing&&<div className="syncing"><Icon name="spin" size={12}/> Guardando...</div>}
    </>
  );
}
