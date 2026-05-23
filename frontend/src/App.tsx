import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./wagmi";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "setWill", type: "function", stateMutability: "nonpayable", inputs: [{ name: "message", type: "string" }, { name: "recipientNotes", type: "string[]" }], outputs: [] },
  { name: "lockWill", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "getWill", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "message", type: "string" }, { name: "recipientNotes", type: "string[]" }, { name: "locked", type: "bool" }, { name: "createdAt", type: "uint256" }, { name: "updatedAt", type: "uint256" }] },
  { name: "hasWill", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "totalWills", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

const AC = "#8b5cf6";

export default function App() {
  const { isConnected, address } = useAccount();
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [lookupAddr, setLookupAddr] = useState("");
  const [done, setDone] = useState(false);

  const { data: myWill, refetch } = useReadContract({ address: ADDR, abi: ABI, functionName: "getWill", args: [address!], query: { enabled: !!address } });
  const { data: total } = useReadContract({ address: ADDR, abi: ABI, functionName: "totalWills" });
  const { data: lookupWill } = useReadContract({ address: ADDR, abi: ABI, functionName: "getWill", args: [lookupAddr as `0x${string}`], query: { enabled: lookupAddr.length === 42 } });
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess && !done) { setDone(true); refetch(); setTimeout(() => setDone(false), 3000); }
  const isLoading = isPending || isConfirming;
  const will = myWill as any;
  const hasWill = will && will[0]?.length > 0;
  const isLocked = will?.[2];

  const doSave = () => {
    const noteArr = notes.split("\n").filter(n => n.trim());
    writeContract({ address: ADDR, abi: ABI, functionName: "setWill", args: [message, noteArr] });
  };
  const doLock = () => writeContract({ address: ADDR, abi: ABI, functionName: "lockWill", args: [] });

  const lw = lookupWill as any;

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: `${AC}18` }} />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📜</span>
          <span className="font-bold text-white text-lg">Arc<span style={{ color: AC }}>Will</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Arc Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>

      <main className="relative z-10 max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📜</div>
          <h1 className="text-4xl font-black text-white mb-3">Your Digital <span style={{ color: AC }}>Will</span></h1>
          <p className="text-slate-400 text-sm">Leave your last message on the blockchain. Permanent, verifiable, forever yours.</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700">
            <span className="text-slate-400 text-sm">{total?.toString() ?? "0"} wills recorded on Arc</span>
          </div>
        </div>

        {!isConnected ? (
          <div className="text-center py-12 text-slate-500">Connect your wallet to write your will</div>
        ) : (
          <div className="space-y-4">
            {hasWill && (
              <div className="rounded-2xl p-5 border" style={{ background: `${AC}10`, borderColor: `${AC}40` }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-white">Your Will</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${isLocked ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}>
                    {isLocked ? "🔒 Locked" : "✏️ Editable"}
                  </span>
                </div>
                <p className="text-slate-300 text-sm whitespace-pre-wrap mb-3">{will[0]}</p>
                {will[1]?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Recipients</p>
                    {will[1].map((n: string, i: number) => <p key={i} className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg">{n}</p>)}
                  </div>
                )}
                {!isLocked && (
                  <button onClick={doLock} disabled={isLoading} className="mt-4 w-full py-2 rounded-xl text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all">
                    🔒 Lock Will (irreversible)
                  </button>
                )}
              </div>
            )}

            {!isLocked && (
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
                <h2 className="font-bold text-white mb-4">{hasWill ? "Update Your Will" : "Write Your Will"}</h2>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Your last message to the world..." rows={5}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/60 resize-none mb-3" />
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={"Recipient notes (one per line):\n0x123...abc: gets my NFTs\n0x456...def: gets my tokens"} rows={4}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/60 resize-none mb-3 font-mono text-xs" />
                {done ? (
                  <div className="py-3 text-center rounded-xl font-bold text-sm" style={{ background: `${AC}20`, color: AC }}>✅ Will saved!</div>
                ) : (
                  <button onClick={doSave} disabled={isLoading || !message} className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50 transition-all" style={{ background: AC }}>
                    {isLoading ? (isPending ? "Confirm in wallet..." : "Saving...") : "📜 Save Will"}
                  </button>
                )}
                {error && <p className="mt-2 text-red-400 text-xs text-center">{error.message?.includes("User rejected") ? "Cancelled" : error.message?.slice(0, 80)}</p>}
              </div>
            )}

            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
              <h2 className="font-bold text-white mb-3">Look Up Any Will</h2>
              <input value={lookupAddr} onChange={e => setLookupAddr(e.target.value)} placeholder="0x... wallet address" className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500/60 font-mono mb-3" />
              {lw && lw[0]?.length > 0 && (
                <div className="bg-slate-800/40 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-500 font-mono">{lookupAddr.slice(0,6)}...{lookupAddr.slice(-4)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lw[2] ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>{lw[2] ? "🔒 Locked" : "Unlocked"}</span>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{lw[0]}</p>
                </div>
              )}
              {lw && lw[0]?.length === 0 && lookupAddr.length === 42 && <p className="text-slate-500 text-sm">No will found for this address</p>}
            </div>
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-slate-600">
          <p>ArcWill · <a href={`https://testnet.arcscan.app/address/${ADDR}`} target="_blank" rel="noreferrer" className="hover:text-slate-400">{ADDR.slice(0,6)}...{ADDR.slice(-4)}</a> · Chain {arcTestnet.id}</p>
        </footer>
      </main>
    </div>
  );
}
