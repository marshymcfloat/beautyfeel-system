"use client";
import { useEffect, useState } from "react";
export function HoldCountdown({expiresAt}:{expiresAt:string}){const[remaining,setRemaining]=useState(()=>Math.max(0,new Date(expiresAt).getTime()-Date.now()));useEffect(()=>{const id=setInterval(()=>setRemaining(Math.max(0,new Date(expiresAt).getTime()-Date.now())),1000);return()=>clearInterval(id)},[expiresAt]);const minutes=Math.floor(remaining/60000);const seconds=Math.floor((remaining%60000)/1000);return <span className="tabular font-semibold">{remaining?`${minutes}:${seconds.toString().padStart(2,"0")}`:"Expired"}</span>}
