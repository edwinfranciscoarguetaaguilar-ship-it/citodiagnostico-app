import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ── Botón ─────────────────────────────────────────────────────
export function Btn({ children, variant='default', size='', icon:Icon, onClick, type='button', disabled, className='' }) {
  const cls = ['btn', variant==='primary'?'btn-primary':'', variant==='danger'?'btn-danger':'',
    size==='sm'?'btn-sm':'', size==='icon'?'btn-icon':'', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {Icon && <Icon size={14}/>} {children}
    </button>
  );
}

// ── Pill ──────────────────────────────────────────────────────
export function Pill({ children, type='default' }) {
  return <span className={`pill pill-${type}`}>{children}</span>;
}

export function EstatusPill({ estatus }) {
  if (estatus === 'REALIZADO')  return <Pill type="done">Realizado</Pill>;
  if (estatus === 'EN PROCESO') return <Pill type="process">En proceso</Pill>;
  return <Pill>{estatus}</Pill>;
}

export function PagoPill({ pago }) {
  if (pago === 'PAGADO')        return <Pill type="pagado">Pagado</Pill>;
  if (pago === 'PENDIENTE')     return <Pill type="pending">Pendiente</Pill>;
  if (pago === 'TRANSFERENCIA') return <Pill type="transfer">Transferencia</Pill>;
  return <Pill>{pago}</Pill>;
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ title, icon:Icon, action, children, className='' }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          {title && <span className="card-title">{Icon && <Icon size={16}/>} {title}</span>}
          {action && <div className="btn-group">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size='' }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className={`modal ${size==='sm'?'modal-sm':''} ${size==='lg'?'modal-lg':''}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Toast global ──────────────────────────────────────────────
export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  const Icon = toast.tipo === 'error' ? AlertCircle : CheckCircle;
  return (
    <div className={`toast ${toast.tipo === 'error' ? 'error' : ''}`}>
      <Icon size={18} color={toast.tipo==='error'?'#fca5a5':'#86efac'}/>
      {toast.mensaje}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner() { return <div className="spinner"/>; }

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({ icon:Icon, title, desc }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={48}/>}
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
    </div>
  );
}

// ── Formulario helpers ────────────────────────────────────────
export function FormGroup({ label, children, span }) {
  return (
    <div className={`form-group ${span==='2'?'span2':''} ${span==='3'?'span3':''}`}>
      {label && <label className="form-label">{label}</label>}
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return <input className={`form-input ${props.highlight?'highlight':''}`} {...props}/>;
}

export function Select({ options=[], value, onChange, name, placeholder }) {
  return (
    <select className="form-select" name={name} value={value} onChange={onChange}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o,i) => (
        <option key={i} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  );
}

export function Textarea({ ...props }) {
  return <textarea className="form-textarea" {...props}/>;
}
