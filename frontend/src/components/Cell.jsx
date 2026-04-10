export default function Cell({ value, onClick, disabled }) {
  const label = value === 1 ? "X" : value === 2 ? "O" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label ? `Cell ${label}` : "Empty cell"}
      className="bg-white shadow-md rounded-xl text-2xl sm:text-3xl md:text-4xl font-bold hover:scale-105 transition aspect-square w-full h-full flex items-center justify-center"
    >
      {label}
    </button>
  );
}
