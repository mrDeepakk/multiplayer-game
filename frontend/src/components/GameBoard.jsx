export default function GameBoard({
  board,
  onCellClick,
  gameStatus,
  playerMark,
  winningLine,
}) {
  if (!board || !Array.isArray(board)) {
    return <p>Loading game...</p>;
  }

  const lineKey = Array.isArray(winningLine) ? winningLine.join("-") : "";
  const lineStyleByKey = {
    "0-1-2": { top: "16.67%", left: "8%", width: "84%", transform: "translateY(-50%) rotate(0deg)" },
    "3-4-5": { top: "50%", left: "8%", width: "84%", transform: "translateY(-50%) rotate(0deg)" },
    "6-7-8": { top: "83.33%", left: "8%", width: "84%", transform: "translateY(-50%) rotate(0deg)" },
    "0-3-6": { top: "8%", left: "16.67%", width: "84%", transform: "translateX(-50%) rotate(90deg)" },
    "1-4-7": { top: "8%", left: "50%", width: "84%", transform: "translateX(-50%) rotate(90deg)" },
    "2-5-8": { top: "8%", left: "83.33%", width: "84%", transform: "translateX(-50%) rotate(90deg)" },
    "0-4-8": { top: "50%", left: "50%", width: "120%", transform: "translate(-50%, -50%) rotate(45deg)" },
    "2-4-6": { top: "50%", left: "50%", width: "120%", transform: "translate(-50%, -50%) rotate(-45deg)" },
  };
  const lineStyle = lineStyleByKey[lineKey];

  return (
    <div className="relative mx-auto w-[min(22rem,92vw)] h-[min(22rem,92vw)]">
      <div className="grid grid-cols-3 gap-2 w-full h-full">
        {board.map((cell, i) => {
          const isWinningCell = Array.isArray(winningLine) && winningLine.includes(i);
          // Keep UI permissive; server remains authoritative for turn validation.
          const canPlay = cell === 0 && playerMark !== null && gameStatus === "playing";
          return (
            <button
              key={i}
              onClick={() => onCellClick(i)}
              disabled={!canPlay}
              className={`rounded-2xl text-4xl font-black transition-all duration-150 shadow-md ${
                isWinningCell ? "bg-emerald-300 shadow-emerald-400/60" : "bg-white/90 hover:scale-[1.02]"
              } ${!canPlay ? "cursor-not-allowed opacity-90" : "cursor-pointer"} ${
                cell === 1 ? "text-rose-500" : cell === 2 ? "text-sky-500" : "text-transparent"
              }`}
            >
              {cell === 1 ? "X" : cell === 2 ? "O" : ""}
            </button>
          );
        })}
      </div>
      {lineStyle ? (
        <div
          className="pointer-events-none absolute h-2 rounded-full bg-emerald-500 animate-pulse"
          style={lineStyle}
        />
      ) : null}
    </div>
  );
}
