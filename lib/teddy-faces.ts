/**
 * Grandpa Teddy's faces — one man, a face for each moment.
 *
 * The six canonical faces (likeness-graded against the locked canon)
 * live in public/images/teddy-faces/. Components pick a face by the
 * moment, never at random: Teddy greets, listens, guides, comforts,
 * and rejoices — and Grandma learns to read him.
 */
export type TeddyFaceKey =
  | "welcome"
  | "wave"
  | "listener"
  | "guide"
  | "laugh"
  | "shepherd";

export const TEDDY_FACES: Record<
  TeddyFaceKey,
  { src: string; alt: string }
> = {
  welcome: {
    src: "/images/teddy-faces/welcome.webp",
    alt: "Grandpa Teddy smiling warmly in welcome, in his straw hat and overalls",
  },
  wave: {
    src: "/images/teddy-faces/wave.webp",
    alt: "Grandpa Teddy waving hello, in his straw hat and overalls",
  },
  listener: {
    src: "/images/teddy-faces/listener.webp",
    alt: "Grandpa Teddy listening kindly, his head tilted, in his straw hat and overalls",
  },
  guide: {
    src: "/images/teddy-faces/guide.webp",
    alt: "Grandpa Teddy pointing the way, in his straw hat and overalls",
  },
  laugh: {
    src: "/images/teddy-faces/laugh.webp",
    alt: "Grandpa Teddy laughing with joy, in his straw hat and overalls",
  },
  shepherd: {
    src: "/images/teddy-faces/shepherd.webp",
    alt: "Grandpa Teddy's calm, reassuring face, in his straw hat and overalls",
  },
};
