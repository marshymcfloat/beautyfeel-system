"use client";

export default function GlobalError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <html lang="en"><body><main className="grid min-h-[100dvh] place-items-center bg-[#f4f3ef] px-4"><div className="max-w-lg"><p style={{color:"#206263",fontWeight:600}}>Temporary interruption</p><h1 style={{color:"#172322",fontSize:"2rem",lineHeight:1.12}}>Beautyfeel could not load.</h1><p style={{color:"#5f6b68",lineHeight:1.5}}>Try again. No booking information was changed.</p><button onClick={reset} style={{minHeight:52,border:0,borderRadius:12,background:"#174e4f",color:"white",padding:"0 24px",fontWeight:600}}>Try again</button></div></main></body></html>;
}
