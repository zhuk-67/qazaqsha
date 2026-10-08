// Аватар: сурет болса суретті, болмаса атының бірінші әрпін көрсетеді

export default function Avatar({
  name,
  src,
  className = 'w-9 h-9 text-sm',
}: {
  name: string
  src?: string | null
  className?: string
}) {
  return (
    <span
      className={`${className} rounded-full overflow-hidden shrink-0 inline-flex items-center justify-center bg-teal-500/20 border border-teal-400 text-teal-300 font-bold`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        (name.trim()[0] ?? 'Q').toUpperCase()
      )}
    </span>
  )
}
