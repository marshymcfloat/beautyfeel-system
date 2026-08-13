"use client";
import { useState } from "react";
export function CopyValueButton({value,label}:{value:string;label:string}){const[copied,setCopied]=useState(false);return <button type="button" onClick={async()=>{await navigator.clipboard.writeText(value);setCopied(true);setTimeout(()=>setCopied(false),1800)}} className="min-h-11 rounded-lg border border-[#e7d6aa] bg-white/70 px-3 text-xs font-semibold text-[#4f3c0d]" aria-live="polite">{copied?"Copied":`Copy ${label}`}</button>}
