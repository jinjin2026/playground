export function AdviceList({ advice }: { advice: string[] }) {
  if (advice.length === 0) {
    return (
      <p className="mt-3 text-sm text-white/45">특별히 챙길 건 없어요 🙂</p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {advice.map((item) => (
        <span
          key={item}
          className="whitespace-nowrap rounded-full border border-emerald-300/35 px-3.5 py-1.5 text-[12.5px] text-emerald-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
