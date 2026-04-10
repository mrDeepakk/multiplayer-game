import MatchLobby from "../components/MatchLobby";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-black text-center mb-6 text-white tracking-tight">Tic Tac Toe Arena</h1>
        <MatchLobby />
      </div>
    </div>
  );
}
