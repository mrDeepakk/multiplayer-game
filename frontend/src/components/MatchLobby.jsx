import { useEffect, useState } from "react";
import useGame, { TURN_TIMER_SECONDS } from "../hooks/useGame";
import GameBoard from "./GameBoard";

export default function MatchLobby() {
  const {
    saveNickname,
    createMatch,
    joinMatch,
    findRandomMatch,
    cancelFindMatch,
    sendMove,
    sendRematch,
    state,
    connectionStatus,
    playerMark,
    playerName,
    myPlayer,
    opponentPlayer,
    leaderboard,
    matchmakingStatus,
    secondsLeft,
    loading,
    matchId,
    error,
    shareJoinUrl,
  } = useGame();

  const [roomId, setRoomId] = useState("");
  const [nicknameInput, setNicknameInput] = useState(playerName || "");
  const [copyHint, setCopyHint] = useState("");

  async function copyText(label, text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint(label);
      setTimeout(() => setCopyHint(""), 2000);
    } catch {
      setCopyHint("Copy failed");
      setTimeout(() => setCopyHint(""), 2000);
    }
  }

  useEffect(() => {
    setRoomId(matchId);
  }, [matchId]);

  useEffect(() => {
    setNicknameInput(playerName || "");
  }, [playerName]);

  const winnerLabel =
    state?.winner === 1 ? "X" : state?.winner === 2 ? "O" : null;
  const myLabel = myPlayer?.mark === 1 ? "X" : myPlayer?.mark === 2 ? "O" : "-";
  const isMatchFinished = state?.status === "finished";
  const isInGame = !!state;
  const isDraw = isMatchFinished && !winnerLabel;
  const scoreX = state?.score?.x ?? 0;
  const scoreO = state?.score?.o ?? 0;
  const iWon = isMatchFinished && playerMark && state?.winner === playerMark;
  const iLost =
    isMatchFinished &&
    playerMark &&
    state?.winner &&
    state?.winner !== playerMark;
  const resultText = isDraw
    ? "Draw"
    : iWon
      ? "You Win"
      : iLost
        ? "You Lose"
        : "Match Finished";
  const pointsText = isDraw ? "+50" : iWon ? "+200" : "-30";
  const turnText =
    state?.status !== "playing"
      ? "Waiting..."
      : state?.turn === playerMark
        ? "Your Turn"
        : "Opponent Turn";
  const timerDanger = secondsLeft <= 5 && state?.status === "playing";

  return (
    <div className="relative bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/70">
      {!playerName ? (
        <div className="fixed inset-0 z-50 bg-slate-900/60 grid place-items-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800">
              Choose Nickname
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Saved for future games on this device.
            </p>
            <input
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              maxLength={20}
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Player name"
            />
            <button
              onClick={() => saveNickname(nicknameInput)}
              className="mt-4 w-full rounded-xl bg-indigo-600 text-white py-2 font-semibold hover:bg-indigo-700"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {!isInGame ? (
        <div className="space-y-3">
          <button
            onClick={async () => {
              await createMatch();
            }}
            className="w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 transition"
          >
            {loading ? "Creating..." : "Create Match"}
          </button>

          <div className="flex gap-2">
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Match ID"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
            />
            <button
              onClick={() => joinMatch(roomId)}
              className="rounded-xl bg-violet-600 text-white px-4 hover:bg-violet-700"
            >
              Join
            </button>
          </div>

          {matchmakingStatus !== "searching" ? (
            <button
              onClick={findRandomMatch}
              className="w-full rounded-xl bg-indigo-600 text-white py-3 font-semibold hover:bg-indigo-700 transition"
            >
              Find Random Match
            </button>
          ) : (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-center">
              <p className="text-indigo-700 font-medium">Finding player...</p>
              <button
                onClick={cancelFindMatch}
                className="mt-2 rounded-lg bg-white px-4 py-1.5 text-sm text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
              >
                Cancel
              </button>
            </div>
          )}

          {connectionStatus !== "idle" ? (
            <p className="text-xs text-slate-500 text-center">
              Connection: {connectionStatus}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-rose-600 text-center">{error}</p>
          ) : null}
        </div>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-slate-600">
            <span className="font-semibold">
              {myPlayer?.username || playerName}
            </span>{" "}
            ({myLabel}) vs{" "}
            <span className="font-semibold">
              {opponentPlayer?.username || "Waiting..."}
            </span>
          </p>
          <p className="text-sm text-slate-500">
            Score - X: {scoreX} | O: {scoreO}
          </p>
          <p className="font-semibold text-slate-800">{turnText}</p>
          {state?.status === "playing" ? (
            <p
              className={`text-sm font-semibold ${timerDanger ? "text-rose-600 animate-pulse" : "text-indigo-600"}`}
            >
              {secondsLeft}s left
            </p>
          ) : null}

          {state?.status === "waiting" && matchId ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-left text-sm">
              <p className="font-semibold text-emerald-900">Invite a friend</p>
              <p className="text-emerald-800/90 mt-1">
                Share this link or code so they join the same match.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyText("link", shareJoinUrl)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white font-medium hover:bg-emerald-700"
                >
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={() => copyText("code", matchId)}
                  className="rounded-lg border border-emerald-600 px-3 py-1.5 text-emerald-800 font-medium hover:bg-emerald-100"
                >
                  Copy match code
                </button>
              </div>
              {copyHint ? (
                <p className="mt-2 text-xs text-emerald-700">
                  {copyHint === "link"
                    ? "Link copied."
                    : copyHint === "code"
                      ? "Code copied."
                      : copyHint}
                </p>
              ) : null}
              <p className="mt-2 break-all rounded-lg bg-white/80 px-2 py-1.5 font-mono text-xs text-slate-700">
                {shareJoinUrl || matchId}
              </p>
            </div>
          ) : null}

          {state?.board ? (
            <GameBoard
              board={state.board}
              onCellClick={sendMove}
              gameStatus={state.status}
              playerMark={playerMark}
              winningLine={state.winningLine}
            />
          ) : (
            <p>Loading game...</p>
          )}

          {isMatchFinished ? (
            <button
              onClick={sendRematch}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600"
            >
              Play Again
            </button>
          ) : null}

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      )}

      {isMatchFinished ? (
        <div className="fixed inset-0 z-40 bg-slate-900/55 grid place-items-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800">{resultText}</h3>
            <p className="text-slate-600 mt-1">
              {winnerLabel ? `Winner: ${winnerLabel}` : "No winner this round"}
            </p>
            <p className="mt-2 inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-sm font-semibold">
              Points: {pointsText}
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Top Players
              </p>
              <div className="space-y-1 max-h-36 overflow-auto">
                {leaderboard.length ? (
                  leaderboard.map((row) => (
                    <div
                      key={row.user_id}
                      className="flex justify-between text-sm text-slate-600"
                    >
                      <span>{row.username || "Player"}</span>
                      <span>
                        W:{row.wins} L:{row.losses} S:{row.score}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    No leaderboard entries yet.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={sendRematch}
              className="mt-4 w-full rounded-xl bg-indigo-600 text-white py-2.5 font-semibold hover:bg-indigo-700"
            >
              Play Again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
