export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-semibold tracking-[-0.04em] text-white">
      <span className="grid size-7 place-items-center rounded-full border border-[#FFC700]/45 text-[#FFC700]">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 fill-current">
          <path d="m8 5 11 7-11 7V5Z" />
        </svg>
      </span>
      {!compact && (
        <span>
          ETEC <span className="text-[#FFC700]">EM CENA</span>
        </span>
      )}
    </span>
  )
}
