import React from 'react';

export const RadioCard = ({ id, name, value, label, checked, onChange }: {id:string, name:string, value:string, label:string, checked:boolean, onChange:(v:string)=>void}) => (
    <div className="relative">
        <input type="radio" id={id} name={name} value={value} checked={checked} onChange={() => onChange(value)} className="peer absolute opacity-0 w-0 h-0" />
        <label htmlFor={id} className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border border-dd-border/60 hover:bg-white/5 peer-checked:border-dd-accent peer-checked:bg-dd-accent/10">
            <div className="flex items-center gap-3"><div className="p-1.5 rounded-lg bg-white/5"><span className="material-symbols-outlined text-dd-muted">military_tech</span></div><span>{label}</span></div>
            <div className={`h-5 w-5 rounded-full border-2 grid place-items-center ${checked ? 'border-dd-accent' : 'border-dd-border'}`}>{checked && <div className="h-2.5 w-2.5 rounded-full bg-dd-accent"></div>}</div>
        </label>
    </div>
);

export const RadioGroup = ({ title, options, name, selected, onChange, gridClass = "sm:grid-cols-3" }: { title: string, options: string[], name: string, selected: string, onChange: (v: string) => void, gridClass?: string }) => (
    <div>
        <h3 className="text-sm font-medium text-dd-muted mb-3">{title}</h3>
        <div className={`grid gap-2 ${gridClass}`}>
            {options.map(opt => (
                <div key={opt} className="relative">
                    <input type="radio" id={`${name}-${opt}`} name={name} value={opt} checked={selected === opt} onChange={() => onChange(opt)} className="peer absolute opacity-0 w-0 h-0" />
                    <label htmlFor={`${name}-${opt}`} className="block p-3 text-center rounded-lg border border-dd-border/60 cursor-pointer hover:bg-white/5 peer-checked:border-dd-accent peer-checked:bg-dd-accent/10">{opt}</label>
                </div>
            ))}
        </div>
    </div>
);