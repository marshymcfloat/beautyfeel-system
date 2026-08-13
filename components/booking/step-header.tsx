export function StepHeader({ step, title, description }: { step: 1 | 2 | 3; title: string; description: string }) {
  return <div><div className="flex items-center gap-2" aria-label={`Step ${step} of 3`}>{[1,2,3].map(item=><span key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-brand-900" : "bg-line"}`}/>)}</div><p className="mt-6 text-sm font-semibold text-brand-800">Step {step} of 3</p><h1 className="text-h1 mt-2">{title}</h1><p className="mt-3 max-w-[55ch] leading-6 text-ink-muted">{description}</p></div>;
}

