const treatments = [
  { name: "Skin", detail: "Care that starts with listening", className: "col-span-7 row-span-7 bg-brand-900 text-white" },
  { name: "Massage & spa", detail: "Time to slow down", className: "col-span-5 row-span-4 bg-brand-100 text-brand-950" },
  { name: "Lashes", detail: "Considered detail", className: "col-span-5 row-span-3 bg-surface-muted text-ink" },
  { name: "Nails", detail: "A precise finish", className: "col-span-6 row-span-3 bg-surface text-ink" },
  { name: "Your time", detail: "Reserved", className: "col-span-6 row-span-3 bg-brand-950 text-white" },
];

export function TreatmentComposition() {
  return <div className="grid h-[430px] grid-cols-12 grid-rows-10 gap-2 rounded-3xl bg-[#e6e3dc] p-2 sm:h-[540px] sm:gap-3 sm:p-3" aria-label="Beautyfeel treatment categories">
    {treatments.map(item => <div key={item.name} className={`flex flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 ${item.className}`}><span className="text-xs font-semibold opacity-70">{item.name}</span><span className="max-w-[15ch] text-lg font-semibold leading-tight tracking-[-.02em] sm:text-xl">{item.detail}</span></div>)}
  </div>;
}

