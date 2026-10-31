// The Heavenly Company — Gabriel and Michael get their own shelf in
// the URL, rendering the same character page as the Mark cast (their
// data carries its own headings and reader links).
export { default, generateMetadata } from "../../mark/[slug]/page";
import { CHARACTERS } from "@/data/characters";

export function generateStaticParams() {
  return CHARACTERS.filter((c) => c.group === "heavenly").map((c) => ({
    slug: c.slug,
  }));
}
