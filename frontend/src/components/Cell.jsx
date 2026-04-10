export default function Cell({ value, onClick, disabled }) {
  const label = value === 1 ? "X" : value === 2 ? "O" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-white shadow-md rounded-xl text-3xl font-bold hover:scale-105 transition"
    >
      {label}
    </button>
  );
}
