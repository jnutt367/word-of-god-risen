/**
 * YouTube thumbnail as a plain <img>.
 *
 * Deliberately NOT next/image: YouTube serves pre-optimized thumbnails, so
 * the Image Optimization API adds a server round-trip and failure modes for
 * zero visual benefit. loading="lazy" keeps it cheap.
 */
export default function YouTubeThumb({ id }: { id: string }) {
  return (
    <img
      src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
      alt=""
      loading="lazy"
      draggable={false}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}
