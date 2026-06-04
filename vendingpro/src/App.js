import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, set, push } from "firebase/database";

// ─── SEED ─────────────────────────────────────────────────────────────────────
const SEED = {
  productos: {
    p1: { id:"p1", nombre:"Coca Cola 500ml",      costo:2.5,  margen:40, precioVenta:3.50, proveedor:"Coca-Cola SAC" },
    p2: { id:"p2", nombre:"Agua San Luis 600ml",  costo:1.2,  margen:50, precioVenta:1.80, proveedor:"Backus" },
    p3: { id:"p3", nombre:"Snickers",             costo:1.8,  margen:45, precioVenta:2.60, proveedor:"Mars Inc." },
  },
  proveedores: {
    v1: { id:"v1", nombre:"Coca-Cola SAC", contacto:"Juan Pérez",  telefono:"999-111-222" },
    v2: { id:"v2", nombre:"Backus",        contacto:"Ana López",   telefono:"999-333-444" },
    v3: { id:"v3", nombre:"Mars Inc.",     contacto:"Carlos Ruiz", telefono:"999-555-666" },
  },
  maquinas: {
    m1: { id:"m1", nombre:"Máquina A1", ubicacion:"Mall del Sur - Piso 1",        alquiler:450, activa:true },
    m2: { id:"m2", nombre:"Máquina B2", ubicacion:"Real Plaza - Entrada",         alquiler:380, activa:true },
    m3: { id:"m3", nombre:"Máquina C3", ubicacion:"Aeropuerto - Sala de espera",  alquiler:620, activa:true },
  },
  stock: {
    s1: { id:"s1", productoId:"p1", cantidad:48, minimo:10 },
    s2: { id:"s2", productoId:"p2", cantidad:60, minimo:15 },
    s3: { id:"s3", productoId:"p3", cantidad:35, minimo:8  },
  },
  traslados:  {},
  ventas:     {},
  cobranzas:  {},
  horario: {
    lunes:     { maquinas:[] },
    martes:    { maquinas:[] },
    miercoles: { maquinas:[] },
    jueves:    { maquinas:[] },
    viernes:   { maquinas:[] },
    sabado:    { maquinas:[] },
    domingo:   { maquinas:[] },
  },
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt     = (n) => `S/ ${Number(n||0).toFixed(2)}`;
const today   = () => new Date().toISOString().split("T")[0];
const objToArr= (o) => o ? Object.values(o) : [];
const uid     = () => push(ref(db,"_tmp")).key;

// ─── ÍCONOS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size=18 }) => {
  const p = {
    machine:  <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 4v6m-3-3h6" strokeLinecap="round" strokeLinejoin="round"/>,
    product:  <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-10 5H6m4 0h4" strokeLinecap="round" strokeLinejoin="round"/>,
    supplier: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>,
    stock:    <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" strokeLinecap="round" strokeLinejoin="round"/>,
    transfer: <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round"/>,
    money:    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>,
    chart:    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>,
    logout:   <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>,
    plus:     <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/>,
    trash:    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>,
    location: <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>,
    trend:    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>,
    alert:    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>,
    spin:     <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>,
    edit:     <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>,
    calendar: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>,
    tag:      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{p[name]}</svg>;
};

// ─── LOGO GAMATIC SVG ─────────────────────────────────────────────────────────
const GamaticLogo = ({ size = 32 }) => (
  <svg width={size * 2.8} height={size} viewBox="0 0 140 50" fill="none">
    {/* Vending machine icon */}
    <rect x="2" y="4" width="28" height="38" rx="3" stroke="#f59e0b" strokeWidth="2.5" fill="none"/>
    <rect x="6" y="8"  width="8" height="7" rx="1" fill="#f59e0b"/>
    <rect x="16" y="8" width="8" height="7" rx="1" fill="#f59e0b"/>
    <rect x="6" y="18" width="8" height="7" rx="1" fill="#f59e0b"/>
    <rect x="16" y="18" width="8" height="7" rx="1" fill="#f59e0b"/>
    <rect x="6" y="28"  width="18" height="3" rx="1" fill="#f59e0b"/>
    <rect x="6" y="33"  width="18" height="6" rx="1" fill="#f59e0b" opacity="0.4"/>
    <circle cx="16" cy="46" r="2.5" fill="#f59e0b"/>
    <path d="M9 46 Q16 49 23 46" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* GAMATIC text */}
    <text x="36" y="34" fontFamily="'Syne',sans-serif" fontWeight="800" fontSize="22" fill="#f59e0b" letterSpacing="1">GAMATIC</text>
  </svg>
);

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root {
    --bg:#0a0e1a; --surface:#111827; --surface2:#1a2235; --border:#1e2d45;
    --accent:#f59e0b; --accent2:#3b82f6; --green:#10b981; --red:#ef4444;
    --text:#f1f5f9; --muted:#64748b; --radius:12px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
  h1,h2,h3,h4{font-family:'Syne',sans-serif}
  .app{display:flex;min-height:100vh}
  .sidebar{width:248px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0}
  .sidebar-logo{padding:20px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center}
  .sidebar-role{margin:10px 14px;background:var(--surface2);border-radius:8px;padding:7px 12px;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px}
  .sidebar-role span{color:var(--accent);font-weight:600}
  .nav{flex:1;padding:6px 0;overflow-y:auto}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;color:var(--muted);font-size:13px;font-weight:500;transition:all .15s;border-left:3px solid transparent}
  .nav-item:hover{color:var(--text);background:var(--surface2)}
  .nav-item.active{color:var(--accent);background:rgba(245,158,11,.08);border-left-color:var(--accent)}
  .nav-section{padding:12px 20px 4px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600}
  .logout-btn{padding:14px 20px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer;color:var(--muted);font-size:13px;transition:color .15s}
  .logout-btn:hover{color:var(--red)}
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden}
  .topbar{padding:18px 28px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
  .topbar h1{font-size:19px;font-weight:700}
  .topbar-date{font-size:12px;color:var(--muted)}
  .content{flex:1;padding:22px 28px;overflow-y:auto}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:22px}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px}
  .card-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
  .card-value{font-size:24px;font-family:'Syne',sans-serif;font-weight:700}
  .card-value.green{color:var(--green)}.card-value.amber{color:var(--accent)}.card-value.blue{color:var(--accent2)}.card-value.red{color:var(--red)}
  .card-sub{font-size:12px;color:var(--muted);margin-top:4px}
  .section{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:18px;overflow:hidden}
  .section-header{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)}
  .section-header h3{font-size:14px;font-weight:700}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:9px 20px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);background:var(--surface2);border-bottom:1px solid var(--border)}
  td{padding:11px 20px;border-bottom:1px solid var(--border);color:var(--text)}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:rgba(255,255,255,.02)}
  .badge{display:inline-flex;align-items:center;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600}
  .badge.green{background:rgba(16,185,129,.15);color:var(--green)}
  .badge.red{background:rgba(239,68,68,.15);color:var(--red)}
  .badge.amber{background:rgba(245,158,11,.15);color:var(--accent)}
  .badge.blue{background:rgba(59,130,246,.15);color:var(--accent2)}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;transition:all .15s}
  .btn-primary{background:var(--accent);color:#000}.btn-primary:hover{background:#d97706}
  .btn-secondary{background:var(--surface2);color:var(--text);border:1px solid var(--border)}.btn-secondary:hover{background:var(--border)}
  .btn-danger{background:rgba(239,68,68,.15);color:var(--red)}.btn-danger:hover{background:rgba(239,68,68,.28)}
  .btn-sm{padding:4px 10px;font-size:12px}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(4px)}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px;width:90%;max-width:560px;max-height:90vh;overflow-y:auto}
  .modal h3{font-size:17px;font-weight:700;margin-bottom:18px}
  .form-group{margin-bottom:14px}
  .form-group label{display:block;font-size:11px;font-weight:600;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em}
  .form-group input,.form-group select{width:100%;padding:9px 13px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s}
  .form-group input:focus,.form-group select:focus{border-color:var(--accent)}
  .form-group select option{background:var(--surface2)}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}
  /* multi-producto rows */
  .prod-row{display:grid;grid-template-columns:1fr 100px 34px;gap:8px;align-items:center;margin-bottom:8px}
  .prod-row select,.prod-row input{padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%}
  .prod-row select:focus,.prod-row input:focus{border-color:var(--accent)}
  .add-prod-btn{background:rgba(245,158,11,.12);border:1px dashed var(--accent);border-radius:8px;padding:7px;color:var(--accent);cursor:pointer;font-size:12px;font-weight:600;width:100%;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s}
  .add-prod-btn:hover{background:rgba(245,158,11,.22)}
  /* login */
  .login-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)}
  .login-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:40px;width:420px}
  .login-logo{text-align:center;margin-bottom:28px}
  .login-logo p{color:var(--muted);font-size:13px;margin-top:8px}
  .role-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px}
  .role-card{padding:16px;border:2px solid var(--border);border-radius:12px;cursor:pointer;text-align:center;transition:all .15s}
  .role-card:hover{border-color:var(--accent)}
  .role-card.selected{border-color:var(--accent);background:rgba(245,158,11,.08)}
  .role-card h4{font-size:14px;font-weight:700;margin-bottom:4px}
  .role-card p{font-size:11px;color:var(--muted)}
  /* rentabilidad */
  .profit-card{border-radius:var(--radius);padding:18px;margin-bottom:14px}
  .profit-positive{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3)}
  .profit-negative{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3)}
  .profit-neutral{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3)}
  .alert-box{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:10px;padding:11px 15px;display:flex;align-items:center;gap:8px;color:var(--red);font-size:13px;margin-bottom:14px}
  .loading{display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;background:var(--bg)}
  .loading p{color:var(--muted);font-size:14px}
  .spinner{animation:spin 1s linear infinite;color:var(--accent)}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .syncing{position:fixed;bottom:20px;right:20px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 14px;font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px}
  /* horario semanal */
  .horario-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;margin-top:4px}
  .dia-col{background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden}
  .dia-header{padding:8px 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;background:rgba(245,158,11,.1);color:var(--accent);border-bottom:1px solid var(--border)}
  .dia-body{padding:8px}
  .dia-maq{font-size:11px;padding:5px 8px;background:var(--surface);border-radius:6px;margin-bottom:5px;color:var(--text);border:1px solid var(--border)}
  .dia-empty{font-size:11px;color:var(--muted);padding:5px 8px;font-style:italic}
  /* precio tag */
  .precio-estimado{font-size:11px;color:var(--muted);text-decoration:line-through}
  .precio-real{font-size:14px;font-weight:700;color:var(--green)}
  /* info box */
  .info-box{background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);border-radius:9px;padding:10px 14px;font-size:12px;color:var(--accent2);margin-bottom:12px}
`;

// ─── FIREBASE HOOK ────────────────────────────────────────────────────────────
function useFirebase() {
  const [data, setData] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const rootRef = ref(db, "gamatic");
    return onValue(rootRef, (snap) => {
      const val = snap.val();
      if (!val) { set(ref(db,"gamatic"), SEED); return; }
      setData({
        productos:   objToArr(val.productos),
        proveedores: objToArr(val.proveedores),
        maquinas:    objToArr(val.maquinas),
        stock:       objToArr(val.stock),
        traslados:   objToArr(val.traslados),
        ventas:      objToArr(val.ventas),
        cobranzas:   objToArr(val.cobranzas),
        horario:     val.horario || SEED.horario,
      });
    });
  }, []);

  const save = async (path, id, value) => {
    setSyncing(true);
    await set(ref(db,`gamatic/${path}/${id}`), value);
    setSyncing(false);
  };

  const saveMulti = async (ops) => {
    setSyncing(true);
    for (const [path, id, value] of ops) await set(ref(db,`gamatic/${path}/${id}`), value);
    setSyncing(false);
  };

  return { data, save, saveMulti, syncing };
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("admin");
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><GamaticLogo size={36}/></div>
          <p>Sistema de gestión de máquinas expendedoras</p>
        </div>
        <p style={{fontSize:13,color:"var(--muted)",marginBottom:14}}>Selecciona tu perfil:</p>
        <div className="role-grid">
          <div className={`role-card ${role==="admin"?"selected":""}`} onClick={()=>setRole("admin")}>
            <div style={{fontSize:28,marginBottom:6}}>👤</div>
            <h4>Administrador</h4>
            <p>Gestión total del sistema</p>
          </div>
          <div className={`role-card ${role==="abastecedor"?"selected":""}`} onClick={()=>setRole("abastecedor")}>
            <div style={{fontSize:28,marginBottom:6}}>🔧</div>
            <h4>Abastecedor</h4>
            <p>Operaciones de campo</p>
          </div>
        </div>
        <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",padding:13}} onClick={()=>onLogin(role)}>
          Ingresar como {role==="admin"?"Administrador":"Abastecedor"}
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ data }) {
  const totalVentas    = data.ventas.reduce((s,v)=>s+(v.ingreso||0),0);
  const totalCobranza  = data.cobranzas.reduce((s,c)=>s+(c.monto||0),0);
  const totalAlquiler  = data.maquinas.reduce((s,m)=>s+(m.alquiler||0),0);
  const costoProductos = data.ventas.reduce((s,v)=>{ const p=data.productos.find(p=>p.id===v.productoId); return s+(p?p.costo*v.cantidad:0); },0);
  const utilidad       = totalVentas - costoProductos - totalAlquiler;
  const stockBajo      = data.stock.filter(s=>s.cantidad<=s.minimo);
  return (
    <div>
      {stockBajo.length>0&&<div className="alert-box"><Icon name="alert" size={15}/>{stockBajo.length} producto(s) con stock bajo mínimo</div>}
      <div className="cards">
        {[["Ventas totales",fmt(totalVentas),"green",`${data.ventas.length} transacciones`],
          ["Cobranza recogida",fmt(totalCobranza),"amber",`${data.cobranzas.length} visitas`],
          ["Alquiler mensual",fmt(totalAlquiler),"blue",`${data.maquinas.length} máquinas`],
          ["Utilidad estimada",fmt(utilidad),utilidad>=0?"green":"red","ventas − costos − alquiler"],
        ].map(([l,v,c,s])=>(
          <div key={l} className="card"><div className="card-label">{l}</div><div className={`card-value ${c}`}>{v}</div><div className="card-sub">{s}</div></div>
        ))}
      </div>
      <div className="section">
        <div className="section-header"><h3>Rendimiento por máquina</h3></div>
        <table>
          <thead><tr><th>Máquina</th><th>Ubicación</th><th>Ventas</th><th>Alquiler</th><th>Rentabilidad</th></tr></thead>
          <tbody>
            {data.maquinas.map(m=>{
              const vm=data.ventas.filter(v=>v.maquinaId===m.id);
              const ing=vm.reduce((s,v)=>s+(v.ingreso||0),0);
              const cost=vm.reduce((s,v)=>{const p=data.productos.find(p=>p.id===v.productoId);return s+(p?p.costo*v.cantidad:0);},0);
              const rent=ing-cost-(m.alquiler||0);
              return(<tr key={m.id}>
                <td><strong>{m.nombre}</strong></td>
                <td style={{color:"var(--muted)"}}>{m.ubicacion}</td>
                <td>{fmt(ing)}</td>
                <td style={{color:"var(--red)"}}>{fmt(m.alquiler)}</td>
                <td><span className={`badge ${rent>=0?"green":"red"}`}>{fmt(rent)}</span></td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RENTABILIDAD ─────────────────────────────────────────────────────────────
function Rentabilidad({ data }) {
  return (
    <div>
      {data.maquinas.map(m=>{
        const vm=data.ventas.filter(v=>v.maquinaId===m.id);
        const ing=vm.reduce((s,v)=>s+(v.ingreso||0),0);
        const cost=vm.reduce((s,v)=>{const p=data.productos.find(p=>p.id===v.productoId);return s+(p?p.costo*v.cantidad:0);},0);
        const util=ing-cost-(m.alquiler||0);
        const roi=ing>0?((util/ing)*100).toFixed(1):0;
        const tipo=util>50?"positive":util>=0?"neutral":"negative";
        return(
          <div key={m.id} className={`profit-card profit-${tipo}`}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div><h4 style={{fontSize:16,fontWeight:700}}>{m.nombre}</h4><p style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{m.ubicacion}</p></div>
              <span className={`badge ${tipo==="positive"?"green":tipo==="negative"?"red":"amber"}`}>ROI: {roi}%</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[["Ingresos",fmt(ing),"var(--green)"],["Costo prod.",fmt(cost),"var(--muted)"],["Alquiler",fmt(m.alquiler),"var(--red)"],["Utilidad",fmt(util),util>=0?"var(--green)":"var(--red)"]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(0,0,0,.2)",padding:"9px 12px",borderRadius:8}}>
                  <div style={{fontSize:10,color:"var(--muted)",marginBottom:3,textTransform:"uppercase"}}>{l}</div>
                  <div style={{fontSize:15,fontWeight:700,color:c,fontFamily:"Syne"}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,padding:"8px 12px",background:"rgba(0,0,0,.2)",borderRadius:8,fontSize:13}}>
              {util>=100&&"✅ Máquina muy rentable — considera expandir"}
              {util>=0&&util<100&&"⚠️ Rentable con margen ajustado — optimizar productos"}
              {util<0&&"❌ No rentable — revisar ubicación o renegociar alquiler"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PRODUCTOS (Admin) ────────────────────────────────────────────────────────
function Productos({ data, save }) {
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null); // producto a editar precio real
  const [form, setForm] = useState({ nombre:"", costo:"", margen:"", precioVenta:"", proveedor:"" });
  const [precioEdit, setPrecioEdit] = useState("");

  const estimado = (costo, margen) => costo && margen ? (parseFloat(costo)*(1+parseFloat(margen)/100)).toFixed(2) : "";

  const abrirModal = () => {
    setForm({ nombre:"", costo:"", margen:"", precioVenta:"", proveedor:"" });
    setModal(true);
  };

  const doSave = () => {
    if (!form.nombre||!form.costo) return;
    const id = uid();
    const est = parseFloat(estimado(form.costo, form.margen));
    save("productos", id, {
      id, nombre:form.nombre, costo:+form.costo, margen:+form.margen,
      precioVenta: form.precioVenta ? +form.precioVenta : est,
      proveedor:form.proveedor
    });
    setModal(false);
  };

  const guardarPrecio = (p) => {
    save("productos", p.id, { ...p, precioVenta: +precioEdit });
    setEditando(null);
  };

  return (
    <div>
      <div className="section">
        <div className="section-header"><h3>Catálogo de productos</h3><button className="btn btn-primary btn-sm" onClick={abrirModal}><Icon name="plus" size={14}/> Agregar</button></div>
        <table>
          <thead><tr><th>Producto</th><th>Proveedor</th><th>Costo</th><th>Margen</th><th>Precio estimado</th><th>Precio real de venta</th><th></th></tr></thead>
          <tbody>
            {data.productos.map(p=>{
              const est = (p.costo*(1+p.margen/100)).toFixed(2);
              return(
                <tr key={p.id}>
                  <td><strong>{p.nombre}</strong></td>
                  <td style={{color:"var(--muted)"}}>{p.proveedor}</td>
                  <td>{fmt(p.costo)}</td>
                  <td><span className="badge amber">{p.margen}%</span></td>
                  <td><span className="precio-estimado">S/ {est}</span></td>
                  <td>
                    {editando===p.id
                      ? <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          <input type="number" step="0.10" value={precioEdit} onChange={e=>setPrecioEdit(e.target.value)}
                            style={{width:90,padding:"5px 8px",background:"var(--surface2)",border:"1px solid var(--accent)",borderRadius:7,color:"var(--text)",fontSize:13}}/>
                          <button className="btn btn-primary btn-sm" onClick={()=>guardarPrecio(p)}>OK</button>
                          <button className="btn btn-secondary btn-sm" onClick={()=>setEditando(null)}>✕</button>
                        </div>
                      : <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span className="precio-real">{fmt(p.precioVenta||est)}</span>
                          <button className="btn btn-secondary btn-sm" onClick={()=>{setEditando(p.id);setPrecioEdit(p.precioVenta||est);}}><Icon name="edit" size={13}/></button>
                        </div>
                    }
                  </td>
                  <td></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal&&(
        <div className="modal-overlay"><div className="modal">
          <h3>Nuevo producto</h3>
          <div className="form-group"><label>Nombre</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Coca Cola 500ml"/></div>
          <div className="form-row">
            <div className="form-group"><label>Costo (S/)</label><input type="number" step="0.01" value={form.costo} onChange={e=>setForm({...form,costo:e.target.value})}/></div>
            <div className="form-group"><label>Margen (%)</label><input type="number" value={form.margen} onChange={e=>setForm({...form,margen:e.target.value})}/></div>
          </div>
          {form.costo&&form.margen&&<div className="info-box">Precio estimado por margen: <strong>S/ {estimado(form.costo,form.margen)}</strong></div>}
          <div className="form-group">
            <label>Precio real de venta (S/) — opcional, puedes redondearlo</label>
            <input type="number" step="0.10" value={form.precioVenta} onChange={e=>setForm({...form,precioVenta:e.target.value})} placeholder={`Ej: ${estimado(form.costo,form.margen)||"2.50"}`}/>
          </div>
          <div className="form-group"><label>Proveedor</label>
            <select value={form.proveedor} onChange={e=>setForm({...form,proveedor:e.target.value})}>
              <option value="">Seleccionar...</option>
              {data.proveedores.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={doSave}>Guardar</button>
          </div>
        </div></div>
      )}
    </div>
  );
}

// ─── LISTA DE PRECIOS (Abastecedor) ───────────────────────────────────────────
function ListaPrecios({ data }) {
  return (
    <div>
      <div className="info-box" style={{marginBottom:16}}>
        Esta es la lista de precios de venta que debes cobrar al cargar las máquinas.
      </div>
      <div className="section">
        <div className="section-header"><h3>Precios de venta</h3></div>
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
  );
}

// ─── PROVEEDORES ──────────────────────────────────────────────────────────────
function Proveedores({ data, save }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre:"", contacto:"", telefono:"" });
  const doSave = () => {
    if(!form.nombre) return;
    const id=uid();
    save("proveedores",id,{id,...form});
    setModal(false); setForm({nombre:"",contacto:"",telefono:""});
  };
  return (
    <div>
      <div className="section">
        <div className="section-header"><h3>Proveedores</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={14}/> Agregar</button></div>
        <table>
          <thead><tr><th>Empresa</th><th>Contacto</th><th>Teléfono</th><th>Productos</th></tr></thead>
          <tbody>
            {data.proveedores.map(p=>(
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td><td>{p.contacto}</td>
                <td style={{color:"var(--muted)"}}>{p.telefono}</td>
                <td><span className="badge blue">{data.productos.filter(pr=>pr.proveedor===p.nombre).length} productos</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal&&(<div className="modal-overlay"><div className="modal">
        <h3>Nuevo proveedor</h3>
        <div className="form-group"><label>Empresa</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div>
        <div className="form-row">
          <div className="form-group"><label>Contacto</label><input value={form.contacto} onChange={e=>setForm({...form,contacto:e.target.value})}/></div>
          <div className="form-group"><label>Teléfono</label><input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>Guardar</button>
        </div>
      </div></div>)}
    </div>
  );
}

// ─── MÁQUINAS (Admin — muestra alquiler) ──────────────────────────────────────
function Maquinas({ data, save, esAdmin }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre:"", ubicacion:"", alquiler:"" });
  const doSave = () => {
    if(!form.nombre||!form.ubicacion) return;
    const id=uid();
    save("maquinas",id,{id,nombre:form.nombre,ubicacion:form.ubicacion,alquiler:+form.alquiler,activa:true});
    setModal(false); setForm({nombre:"",ubicacion:"",alquiler:""});
  };
  return (
    <div>
      <div className="section">
        <div className="section-header">
          <h3>Máquinas registradas</h3>
          {esAdmin&&<button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={14}/> Agregar</button>}
        </div>
        <table>
          <thead>
            <tr>
              <th>Máquina</th><th>Ubicación</th>
              {esAdmin&&<th>Alquiler/mes</th>}
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.maquinas.map(m=>(
              <tr key={m.id}>
                <td><strong>{m.nombre}</strong></td>
                <td><span style={{display:"flex",alignItems:"center",gap:6}}><Icon name="location" size={13}/>{m.ubicacion}</span></td>
                {esAdmin&&<td style={{color:"var(--red)"}}>{fmt(m.alquiler)}</td>}
                <td><span className={`badge ${m.activa?"green":"red"}`}>{m.activa?"Activa":"Inactiva"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal&&esAdmin&&(<div className="modal-overlay"><div className="modal">
        <h3>Nueva máquina</h3>
        <div className="form-group"><label>Nombre / Código</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Máquina D4"/></div>
        <div className="form-group"><label>Ubicación</label><input value={form.ubicacion} onChange={e=>setForm({...form,ubicacion:e.target.value})} placeholder="Ej: CC Real Plaza - Piso 2"/></div>
        <div className="form-group"><label>Alquiler mensual (S/)</label><input type="number" step="0.01" value={form.alquiler} onChange={e=>setForm({...form,alquiler:e.target.value})}/></div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>Guardar</button>
        </div>
      </div></div>)}
    </div>
  );
}

// ─── STOCK ────────────────────────────────────────────────────────────────────
function Stock({ data, save }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productoId:"", cantidad:"", minimo:"" });
  const doSave = () => {
    if(!form.productoId||!form.cantidad) return;
    const existe=data.stock.find(s=>s.productoId===form.productoId);
    if(existe) save("stock",existe.id,{...existe,cantidad:existe.cantidad+ +form.cantidad});
    else { const id=uid(); save("stock",id,{id,productoId:form.productoId,cantidad:+form.cantidad,minimo:+form.minimo||10}); }
    setModal(false); setForm({productoId:"",cantidad:"",minimo:""});
  };
  return (
    <div>
      <div className="section">
        <div className="section-header"><h3>Stock del almacén</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={14}/> Entrada</button></div>
        <table>
          <thead><tr><th>Producto</th><th>Cantidad</th><th>Mínimo</th><th>Estado</th></tr></thead>
          <tbody>
            {data.stock.map(s=>{
              const prod=data.productos.find(p=>p.id===s.productoId);
              const bajo=s.cantidad<=s.minimo;
              return(<tr key={s.id}>
                <td><strong>{prod?.nombre||"—"}</strong></td>
                <td style={{fontSize:18,fontWeight:700,fontFamily:"Syne",color:bajo?"var(--red)":"var(--text)"}}>{s.cantidad}</td>
                <td style={{color:"var(--muted)"}}>{s.minimo}</td>
                <td><span className={`badge ${bajo?"red":s.cantidad>s.minimo*2?"green":"amber"}`}>{bajo?"Stock bajo":s.cantidad>s.minimo*2?"OK":"Moderado"}</span></td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
      {modal&&(<div className="modal-overlay"><div className="modal">
        <h3>Entrada de stock</h3>
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
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>Registrar</button>
        </div>
      </div></div>)}
    </div>
  );
}

// ─── TRASLADOS — multi-producto por máquina ───────────────────────────────────
function Traslados({ data, save, saveMulti, usuario }) {
  const [modal, setModal] = useState(false);
  const [maquinaId, setMaquinaId] = useState("");
  const [items, setItems] = useState([{ productoId:"", cantidad:"" }]);

  const addItem   = () => setItems(i=>[...i,{productoId:"",cantidad:""}]);
  const removeItem= (idx) => setItems(i=>i.filter((_,j)=>j!==idx));
  const setItem   = (idx,field,val) => setItems(i=>i.map((r,j)=>j===idx?{...r,[field]:val}:r));

  const doSave = async () => {
    if(!maquinaId) return;
    const validItems=items.filter(it=>it.productoId&&it.cantidad);
    if(!validItems.length) return;
    const ops=[];
    for(const it of validItems){
      const tId=uid();
      ops.push(["traslados",tId,{id:tId,fecha:today(),maquinaId,productoId:it.productoId,cantidad:+it.cantidad,responsable:usuario}]);
      const stockItem=data.stock.find(s=>s.productoId===it.productoId);
      if(stockItem) ops.push(["stock",stockItem.id,{...stockItem,cantidad:Math.max(0,stockItem.cantidad- +it.cantidad)}]);
    }
    await saveMulti(ops);
    setModal(false); setMaquinaId(""); setItems([{productoId:"",cantidad:""}]);
  };

  // agrupar traslados por (fecha, maquina)
  const grupos = {};
  [...data.traslados].reverse().forEach(t=>{
    const key=`${t.fecha}__${t.maquinaId}`;
    if(!grupos[key]) grupos[key]={fecha:t.fecha,maquinaId:t.maquinaId,responsable:t.responsable,items:[]};
    const prod=data.productos.find(p=>p.id===t.productoId);
    grupos[key].items.push({nombre:prod?.nombre||"—",cantidad:t.cantidad});
  });

  return (
    <div>
      <div className="section">
        <div className="section-header"><h3>Traslados registrados</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={14}/> Registrar traslado</button></div>
        <table>
          <thead><tr><th>Fecha</th><th>Máquina</th><th>Productos trasladados</th><th>Responsable</th></tr></thead>
          <tbody>
            {Object.values(grupos).map((g,i)=>{
              const maq=data.maquinas.find(m=>m.id===g.maquinaId);
              return(<tr key={i}>
                <td style={{color:"var(--muted)"}}>{g.fecha}</td>
                <td><strong>{maq?.nombre}</strong><br/><span style={{fontSize:11,color:"var(--muted)"}}>{maq?.ubicacion}</span></td>
                <td>{g.items.map((it,j)=><div key={j} style={{fontSize:12,marginBottom:2}}><span className="badge blue">{it.cantidad}</span> {it.nombre}</div>)}</td>
                <td style={{color:"var(--muted)"}}>{g.responsable}</td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
      {modal&&(<div className="modal-overlay"><div className="modal" style={{maxWidth:580}}>
        <h3>Registrar traslado</h3>
        <div className="form-group"><label>Máquina destino</label>
          <select value={maquinaId} onChange={e=>setMaquinaId(e.target.value)}>
            <option value="">Seleccionar máquina...</option>
            {data.maquinas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Productos trasladados</label>
          <div style={{background:"var(--surface2)",borderRadius:9,padding:12,border:"1px solid var(--border)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 100px 34px",gap:8,marginBottom:6}}>
              <span style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".05em"}}>Producto</span>
              <span style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".05em"}}>Cantidad</span>
              <span/>
            </div>
            {items.map((it,idx)=>(
              <div key={idx} className="prod-row">
                <select value={it.productoId} onChange={e=>setItem(idx,"productoId",e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {data.productos.map(p=>{const s=data.stock.find(s=>s.productoId===p.id); return <option key={p.id} value={p.id}>{p.nombre} (stock:{s?.cantidad||0})</option>;})}
                </select>
                <input type="number" value={it.cantidad} onChange={e=>setItem(idx,"cantidad",e.target.value)} placeholder="0"/>
                <button className="btn btn-danger btn-sm" style={{padding:"6px 8px"}} onClick={()=>removeItem(idx)} disabled={items.length===1}>✕</button>
              </div>
            ))}
            <button className="add-prod-btn" onClick={addItem}><Icon name="plus" size={13}/> Agregar otro producto</button>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>Registrar traslado</button>
        </div>
      </div></div>)}
    </div>
  );
}

// ─── VENTAS — multi-producto por máquina ──────────────────────────────────────
function Ventas({ data, save }) {
  const [modal, setModal] = useState(false);
  const [maquinaId, setMaquinaId] = useState("");
  const [items, setItems] = useState([{ productoId:"", cantidad:"" }]);

  const addItem   = () => setItems(i=>[...i,{productoId:"",cantidad:""}]);
  const removeItem= (idx) => setItems(i=>i.filter((_,j)=>j!==idx));
  const setItem   = (idx,field,val) => setItems(i=>i.map((r,j)=>j===idx?{...r,[field]:val}:r));

  const totalModal = items.reduce((s,it)=>{
    const p=data.productos.find(p=>p.id===it.productoId);
    return s+(p&&it.cantidad?(p.precioVenta||(p.costo*(1+p.margen/100)))* +it.cantidad:0);
  },0);

  const doSave = async () => {
    if(!maquinaId) return;
    const validItems=items.filter(it=>it.productoId&&it.cantidad);
    if(!validItems.length) return;
    for(const it of validItems){
      const prod=data.productos.find(p=>p.id===it.productoId);
      const precio=prod?(prod.precioVenta||(prod.costo*(1+prod.margen/100))):0;
      const id=uid();
      await save("ventas",id,{id,fecha:today(),maquinaId,productoId:it.productoId,cantidad:+it.cantidad,ingreso:+(precio* +it.cantidad).toFixed(2)});
    }
    setModal(false); setMaquinaId(""); setItems([{productoId:"",cantidad:""}]);
  };

  const hoy=today();
  const ventasHoy=data.ventas.filter(v=>v.fecha===hoy);

  // agrupar por (fecha, maquina)
  const grupos={};
  [...data.ventas].reverse().forEach(v=>{
    const key=`${v.fecha}__${v.maquinaId}`;
    if(!grupos[key]) grupos[key]={fecha:v.fecha,maquinaId:v.maquinaId,items:[],total:0};
    const prod=data.productos.find(p=>p.id===v.productoId);
    grupos[key].items.push({nombre:prod?.nombre||"—",cantidad:v.cantidad,ingreso:v.ingreso});
    grupos[key].total+=(v.ingreso||0);
  });

  return (
    <div>
      <div className="cards">
        <div className="card"><div className="card-label">Ventas hoy</div><div className="card-value amber">{fmt(ventasHoy.reduce((s,v)=>s+(v.ingreso||0),0))}</div><div className="card-sub">{ventasHoy.length} registros</div></div>
        <div className="card"><div className="card-label">Unidades hoy</div><div className="card-value blue">{ventasHoy.reduce((s,v)=>s+(v.cantidad||0),0)}</div><div className="card-sub">Todos los productos</div></div>
      </div>
      <div className="section">
        <div className="section-header"><h3>Registro de ventas</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={14}/> Registrar ventas</button></div>
        <table>
          <thead><tr><th>Fecha</th><th>Máquina</th><th>Productos vendidos</th><th>Total</th></tr></thead>
          <tbody>
            {Object.values(grupos).map((g,i)=>{
              const maq=data.maquinas.find(m=>m.id===g.maquinaId);
              return(<tr key={i}>
                <td style={{color:"var(--muted)"}}>{g.fecha}</td>
                <td><strong>{maq?.nombre}</strong><br/><span style={{fontSize:11,color:"var(--muted)"}}>{maq?.ubicacion}</span></td>
                <td>{g.items.map((it,j)=><div key={j} style={{fontSize:12,marginBottom:2}}><span className="badge blue">{it.cantidad}</span> {it.nombre} — <span style={{color:"var(--green)"}}>{fmt(it.ingreso)}</span></div>)}</td>
                <td style={{color:"var(--green)",fontWeight:700,fontFamily:"Syne"}}>{fmt(g.total)}</td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
      {modal&&(<div className="modal-overlay"><div className="modal" style={{maxWidth:580}}>
        <h3>Registrar ventas del día</h3>
        <div className="form-group"><label>Máquina</label>
          <select value={maquinaId} onChange={e=>setMaquinaId(e.target.value)}>
            <option value="">Seleccionar máquina...</option>
            {data.maquinas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Productos vendidos</label>
          <div style={{background:"var(--surface2)",borderRadius:9,padding:12,border:"1px solid var(--border)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 100px 34px",gap:8,marginBottom:6}}>
              <span style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase"}}>Producto</span>
              <span style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase"}}>Cantidad</span>
              <span/>
            </div>
            {items.map((it,idx)=>{
              const prod=data.productos.find(p=>p.id===it.productoId);
              const precio=prod?(prod.precioVenta||(prod.costo*(1+prod.margen/100))):0;
              return(
                <div key={idx}>
                  <div className="prod-row">
                    <select value={it.productoId} onChange={e=>setItem(idx,"productoId",e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {data.productos.map(p=><option key={p.id} value={p.id}>{p.nombre} — {fmt(p.precioVenta||(p.costo*(1+p.margen/100)))}</option>)}
                    </select>
                    <input type="number" value={it.cantidad} onChange={e=>setItem(idx,"cantidad",e.target.value)} placeholder="0"/>
                    <button className="btn btn-danger btn-sm" style={{padding:"6px 8px"}} onClick={()=>removeItem(idx)} disabled={items.length===1}>✕</button>
                  </div>
                  {prod&&it.cantidad&&<div style={{fontSize:11,color:"var(--green)",marginBottom:6,paddingLeft:4}}>
                    Subtotal: {fmt(precio* +it.cantidad)}
                  </div>}
                </div>
              );
            })}
            <button className="add-prod-btn" onClick={addItem}><Icon name="plus" size={13}/> Agregar otro producto</button>
          </div>
        </div>
        {totalModal>0&&<div style={{padding:"10px 14px",background:"rgba(16,185,129,.1)",borderRadius:8,fontSize:14,color:"var(--green)",fontWeight:700,marginBottom:4}}>Total a registrar: {fmt(totalModal)}</div>}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>Registrar ventas</button>
        </div>
      </div></div>)}
    </div>
  );
}

// ─── COBRANZAS ────────────────────────────────────────────────────────────────
function Cobranzas({ data, save, usuario }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ maquinaId:"", monto:"" });
  const doSave = () => {
    if(!form.maquinaId||!form.monto) return;
    const id=uid();
    save("cobranzas",id,{id,fecha:today(),maquinaId:form.maquinaId,monto:+form.monto,responsable:usuario});
    setModal(false); setForm({maquinaId:"",monto:""});
  };
  return (
    <div>
      <div className="cards">
        <div className="card"><div className="card-label">Total recogido</div><div className="card-value green">{fmt(data.cobranzas.reduce((s,c)=>s+(c.monto||0),0))}</div><div className="card-sub">{data.cobranzas.length} visitas registradas</div></div>
      </div>
      <div className="section">
        <div className="section-header"><h3>Registro de cobranza</h3><button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}><Icon name="plus" size={14}/> Registrar cobro</button></div>
        <table>
          <thead><tr><th>Fecha</th><th>Máquina</th><th>Ubicación</th><th>Monto recogido</th><th>Responsable</th></tr></thead>
          <tbody>
            {[...data.cobranzas].reverse().map(c=>{
              const maq=data.maquinas.find(m=>m.id===c.maquinaId);
              return(<tr key={c.id}>
                <td style={{color:"var(--muted)"}}>{c.fecha}</td>
                <td><strong>{maq?.nombre}</strong></td>
                <td style={{color:"var(--muted)"}}>{maq?.ubicacion}</td>
                <td style={{color:"var(--green)",fontWeight:700,fontFamily:"Syne"}}>{fmt(c.monto)}</td>
                <td style={{color:"var(--muted)"}}>{c.responsable}</td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
      {modal&&(<div className="modal-overlay"><div className="modal">
        <h3>Registrar dinero recogido</h3>
        <div className="form-group"><label>Máquina</label>
          <select value={form.maquinaId} onChange={e=>setForm({...form,maquinaId:e.target.value})}>
            <option value="">Seleccionar...</option>
            {data.maquinas.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.ubicacion}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Monto recogido (S/)</label><input type="number" step="0.01" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})}/></div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={doSave}>Registrar</button>
        </div>
      </div></div>)}
    </div>
  );
}

// ─── HORARIO SEMANAL ──────────────────────────────────────────────────────────
const DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];
const DIAS_LABEL = { lunes:"Lun",martes:"Mar",miercoles:"Mié",jueves:"Jue",viernes:"Vie",sabado:"Sáb",domingo:"Dom" };

function HorarioAdmin({ data, save }) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(null);

  const abrir = () => {
    const d={};
    DIAS.forEach(dia=>{ d[dia]={ maquinas: (data.horario[dia]?.maquinas||[]).slice() }; });
    setDraft(d); setEditando(true);
  };

  const toggleMaq = (dia, maqId) => {
    setDraft(prev=>{
      const lista=[...(prev[dia]?.maquinas||[])];
      const idx=lista.indexOf(maqId);
      if(idx>=0) lista.splice(idx,1); else lista.push(maqId);
      return {...prev,[dia]:{maquinas:lista}};
    });
  };

  const guardar = async () => {
    await save("horario","lunes",draft.lunes);
    await save("horario","martes",draft.martes);
    await save("horario","miercoles",draft.miercoles);
    await save("horario","jueves",draft.jueves);
    await save("horario","viernes",draft.viernes);
    await save("horario","sabado",draft.sabado);
    await save("horario","domingo",draft.domingo);
    setEditando(false);
  };

  const horario = data.horario||{};

  return (
    <div>
      <div className="section">
        <div className="section-header">
          <h3>Horario semanal del abastecedor</h3>
          <button className="btn btn-primary btn-sm" onClick={abrir}><Icon name="edit" size={14}/> Editar</button>
        </div>
        <div style={{padding:16}}>
          <div className="horario-grid">
            {DIAS.map(dia=>{
              const maqIds=horario[dia]?.maquinas||[];
              return(
                <div key={dia} className="dia-col">
                  <div className="dia-header">{DIAS_LABEL[dia]}</div>
                  <div className="dia-body">
                    {maqIds.length===0
                      ? <div className="dia-empty">Libre</div>
                      : maqIds.map(id=>{
                          const m=data.maquinas.find(m=>m.id===id);
                          return <div key={id} className="dia-maq">📍 {m?.nombre||id}<br/><span style={{fontSize:10,color:"var(--muted)"}}>{m?.ubicacion}</span></div>;
                        })
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {editando&&draft&&(<div className="modal-overlay"><div className="modal" style={{maxWidth:660}}>
        <h3>Editar horario semanal</h3>
        <p style={{fontSize:13,color:"var(--muted)",marginBottom:16}}>Marca qué máquinas debe atender el abastecedor cada día.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
          {DIAS.map(dia=>(
            <div key={dia}>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",color:"var(--accent)",marginBottom:8,textAlign:"center"}}>{DIAS_LABEL[dia]}</div>
              {data.maquinas.map(m=>{
                const sel=(draft[dia]?.maquinas||[]).includes(m.id);
                return(
                  <div key={m.id} onClick={()=>toggleMaq(dia,m.id)} style={{
                    padding:"6px 8px",borderRadius:7,marginBottom:5,cursor:"pointer",fontSize:11,
                    background:sel?"rgba(245,158,11,.15)":"var(--surface2)",
                    border:`1px solid ${sel?"var(--accent)":"var(--border)"}`,
                    color:sel?"var(--accent)":"var(--muted)",textAlign:"center",transition:"all .15s"
                  }}>
                    {m.nombre}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={()=>setEditando(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar}>Guardar horario</button>
        </div>
      </div></div>)}
    </div>
  );
}

// ─── HORARIO ABASTECEDOR (solo lectura) ───────────────────────────────────────
function MiHorario({ data }) {
  const hoy = new Date().toLocaleDateString("es-PE",{weekday:"long"}).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace("miércoles","miercoles").replace("sábado","sabado");
  const diaActual = DIAS.find(d=>d===hoy)||null;
  const horario = data.horario||{};

  return (
    <div>
      {diaActual&&(()=>{
        const maqIds=horario[diaActual]?.maquinas||[];
        return(
          <div style={{marginBottom:18,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.25)",borderRadius:12,padding:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <Icon name="calendar" size={16}/>
              <span style={{fontWeight:700,fontSize:14}}>Hoy — {diaActual.charAt(0).toUpperCase()+diaActual.slice(1)}</span>
            </div>
            {maqIds.length===0
              ? <p style={{color:"var(--muted)",fontSize:13}}>No tienes máquinas asignadas hoy.</p>
              : maqIds.map(id=>{
                  const m=data.maquinas.find(m=>m.id===id);
                  return <div key={id} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:9,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                    <Icon name="location" size={15}/>
                    <div><div style={{fontWeight:700,fontSize:13}}>{m?.nombre}</div><div style={{fontSize:11,color:"var(--muted)"}}>{m?.ubicacion}</div></div>
                  </div>;
                })
            }
          </div>
        );
      })()}
      <div className="section">
        <div className="section-header"><h3>Mi horario semanal</h3></div>
        <div style={{padding:16}}>
          <div className="horario-grid">
            {DIAS.map(dia=>{
              const maqIds=horario[dia]?.maquinas||[];
              const esHoy=dia===diaActual;
              return(
                <div key={dia} className="dia-col" style={esHoy?{border:"1px solid var(--accent)"}:{}}>
                  <div className="dia-header" style={esHoy?{background:"rgba(245,158,11,.25)"}:{}}>{DIAS_LABEL[dia]}{esHoy&&" ★"}</div>
                  <div className="dia-body">
                    {maqIds.length===0
                      ? <div className="dia-empty">Libre</div>
                      : maqIds.map(id=>{
                          const m=data.maquinas.find(m=>m.id===id);
                          return <div key={id} className="dia-maq">📍 {m?.nombre||id}</div>;
                        })
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NAVEGACIÓN ───────────────────────────────────────────────────────────────
const ADMIN_NAV = [
  {section:"General"},
  {id:"dashboard",   label:"Dashboard",       icon:"chart"},
  {id:"rentabilidad",label:"Rentabilidad",     icon:"trend"},
  {id:"horario",     label:"Horario semanal",  icon:"calendar"},
  {section:"Catálogo"},
  {id:"productos",   label:"Productos",        icon:"product"},
  {id:"proveedores", label:"Proveedores",      icon:"supplier"},
  {section:"Operaciones"},
  {id:"maquinas",    label:"Máquinas",         icon:"machine"},
  {id:"stock",       label:"Stock almacén",    icon:"stock"},
  {id:"traslados",   label:"Traslados",        icon:"transfer"},
  {id:"ventas",      label:"Ventas",           icon:"chart"},
  {id:"cobranzas",   label:"Cobranzas",        icon:"money"},
];
const ABASTECEDOR_NAV = [
  {section:"Mi semana"},
  {id:"mihorario",   label:"Mi horario",       icon:"calendar"},
  {section:"Operaciones"},
  {id:"ventas",      label:"Ventas del día",   icon:"chart"},
  {id:"cobranzas",   label:"Cobranza",         icon:"money"},
  {id:"traslados",   label:"Traslados",        icon:"transfer"},
  {section:"Consultas"},
  {id:"precios",     label:"Lista de precios", icon:"tag"},
  {id:"stock",       label:"Stock almacén",    icon:"stock"},
  {id:"maquinas",    label:"Mis máquinas",     icon:"machine"},
];
const TITLES = {
  dashboard:"Dashboard general", rentabilidad:"Análisis de rentabilidad",
  horario:"Horario semanal", mihorario:"Mi horario semanal",
  productos:"Productos", proveedores:"Proveedores", maquinas:"Máquinas",
  stock:"Stock del almacén", traslados:"Traslados", ventas:"Ventas",
  cobranzas:"Cobranzas", precios:"Lista de precios de venta",
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { data, save, saveMulti, syncing } = useFirebase();
  const [usuario, setUsuario] = useState(null);
  const [tab, setTab] = useState("dashboard");

  if(!data) return(<><style>{css}</style><div className="loading"><div className="spinner"><Icon name="spin" size={42}/></div><p>Conectando con la base de datos...</p></div></>);
  if(!usuario) return(<><style>{css}</style><LoginScreen onLogin={(role)=>{ setUsuario(role); setTab(role==="admin"?"dashboard":"mihorario"); }}/></>);

  const esAdmin = usuario==="admin";
  const nav = esAdmin ? ADMIN_NAV : ABASTECEDOR_NAV;
  const nombreUsuario = esAdmin?"Administrador":"Abastecedor";
  const dateStr = new Date().toLocaleDateString("es-PE",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  const renderContent = () => {
    switch(tab){
      case "dashboard":    return <Dashboard data={data}/>;
      case "rentabilidad": return <Rentabilidad data={data}/>;
      case "horario":      return <HorarioAdmin data={data} save={save}/>;
      case "mihorario":    return <MiHorario data={data}/>;
      case "productos":    return <Productos data={data} save={save}/>;
      case "precios":      return <ListaPrecios data={data}/>;
      case "proveedores":  return <Proveedores data={data} save={save}/>;
      case "maquinas":     return <Maquinas data={data} save={save} esAdmin={esAdmin}/>;
      case "stock":        return <Stock data={data} save={save}/>;
      case "traslados":    return <Traslados data={data} save={save} saveMulti={saveMulti} usuario={nombreUsuario}/>;
      case "ventas":       return <Ventas data={data} save={save}/>;
      case "cobranzas":    return <Cobranzas data={data} save={save} usuario={nombreUsuario}/>;
      default: return null;
    }
  };

  return(
    <><style>{css}</style>
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo"><GamaticLogo size={28}/></div>
        <div className="sidebar-role">{esAdmin?"👤":"🔧"} <span>{nombreUsuario}</span></div>
        <nav className="nav">
          {nav.map((item,i)=>item.section
            ? <div key={i} className="nav-section">{item.section}</div>
            : <div key={item.id} className={`nav-item ${tab===item.id?"active":""}`} onClick={()=>setTab(item.id)}><Icon name={item.icon} size={15}/>{item.label}</div>
          )}
        </nav>
        <div className="logout-btn" onClick={()=>setUsuario(null)}><Icon name="logout" size={15}/> Cerrar sesión</div>
      </aside>
      <main className="main">
        <div className="topbar"><h1>{TITLES[tab]}</h1><span className="topbar-date">{dateStr}</span></div>
        <div className="content">{renderContent()}</div>
      </main>
    </div>
    {syncing&&<div className="syncing"><Icon name="spin" size={12}/> Guardando...</div>}
    </>
  );
}
