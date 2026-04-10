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

  return (
    <div className="relative mx-auto w-full max-w-[22rem] sm:max-w-[28rem] md:max-w-[34rem]">
      <div className="aspect-square grid grid-cols-3 gap-2 w-full h-full">
        {board.map((cell, i) => {
          const isWinningCell =
            Array.isArray(winningLine) && winningLine.includes(i);
          // Keep UI permissive; server remains authoritative for turn validation.
          const canPlay =
            cell === 0 && playerMark !== null && gameStatus === "playing";
          return (
            <button
              key={i}
              onClick={() => onCellClick(i)}
              disabled={!canPlay}
              className={`rounded-2xl text-3xl sm:text-4xl md:text-5xl font-black transition-all duration-150 shadow-md flex items-center justify-center aspect-square ${
                isWinningCell
                  ? "bg-emerald-300 shadow-emerald-400/60"
                  : "bg-white/90 hover:scale-[1.02]"
              } ${!canPlay ? "cursor-not-allowed opacity-90" : "cursor-pointer"} ${
                cell === 1
                  ? "text-rose-500"
                  : cell === 2
                    ? "text-sky-500"
                    : "text-transparent"
              }`}
            >
              {cell === 1 ? "X" : cell === 2 ? "O" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
