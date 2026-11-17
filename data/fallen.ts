/**
 * The Fallen — the chiefs of the Watchers named in 1 Enoch 6, shown as the
 * book leaves them: bound. Data for /fallen.
 *
 * Names follow the chiefs-of-tens list in 1 Enoch 6 (Charles translation, as
 * carried in this app's own text). Deeds are from 1 Enoch 8; where chapter 8
 * uses a different spelling of a chief's name, the card notes it. Where the
 * book gives a chief nothing but his name, the card says so — nothing is
 * invented for him. Bindings are from 1 Enoch 10 (Azazel alone in Dudael;
 * Semjaza and the company in the valleys of the earth) and 1 Enoch 18/21
 * (the seven stars).
 *
 * Portraits: Semjaza and Azazel are crowned portraits (Jason, Nov 17, 2026).
 * Every other chamber holds a placeholder silhouette shaped by that one's
 * binding, until his portrait is built and crowned.
 */

export type FallenStatus = "crowned" | "placeholder" | "collective";

export interface FallenChamber {
  slug: string;
  name: string;
  /** Alternate name forms the book itself carries, stated honestly. */
  nameNote?: string;
  /** One line: the staging of his chamber, as the book describes his binding. */
  chamberLine: string;
  /** What he did — 1 Enoch 6/8, in the book's words or plain summary of them. */
  deed: string;
  /** His binding — 1 Enoch 10 (or 18/21 for the seven stars). */
  binding: string;
  /** Scripture echo, where one truly stands (Azazel: Leviticus 16). */
  echo?: string;
  status: FallenStatus;
  /** Square card image (fit-whole, figure complete). */
  image: string;
  /** Tall original, opened by the zoom viewer. */
  imageTall: string;
  alt: string;
}

const COMPANY_BINDING =
  "\u201CBind them fast for seventy generations in the valleys of the earth, till the day of their judgement and of their consummation\u2026 In those days they shall be led off to the abyss of fire\u201D (1 Enoch 10).";

const NAME_ONLY_DEED =
  "The book names him among the chiefs of tens (1 Enoch 6) \u2014 and tells us nothing more of him. We invent nothing for him: he stands as the book leaves the whole company.";

function chamber(
  partial: Omit<FallenChamber, "image" | "imageTall">
): FallenChamber {
  return {
    ...partial,
    image: `/images/fallen/${partial.slug}-sq.jpg`,
    imageTall: `/images/fallen/${partial.slug}-v1.jpg`,
  };
}

export const FALLEN: FallenChamber[] = [
  chamber({
    slug: "semjaza",
    name: "Semjaza",
    nameNote:
      "Named Samlazaz at the head of the chiefs\u2019 list (1 Enoch 6). Underneath both spellings stands the Aramaic Shemihazah \u2014 \u201CThe Name sees.\u201D",
    chamberLine:
      "Bound fast in the valleys of the earth, his company in the dark behind him.",
    deed: "He was their leader. On Mount Hermon he feared he alone would have to pay the penalty of a great sin, so the two hundred bound themselves together by an oath (1 Enoch 6). His own teaching, once they were down: \u201CSemjaza taught enchantments, and root-cuttings\u201D (1 Enoch 8).",
    binding:
      "The Lord said to Michael: \u201CBind Semjaza and his associates\u2026 bind them fast for seventy generations in the valleys of the earth, till the day of their judgement\u201D (1 Enoch 10).",
    status: "crowned",
    alt: "Semjaza bound in the valleys of the earth, chains running from his wrists into the ground, his face lost in shadow \u2014 crowned portrait",
  }),
  chamber({
    slug: "araklba",
    name: "Araklba",
    nameNote: "Named Araqiel in the teaching list of 1 Enoch 8.",
    chamberLine: "Staked in a ring to the earth whose signs he taught.",
    deed: "\u201CAraqiel [taught] the signs of the earth\u201D (1 Enoch 8).",
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Araklba, bound and staked to the earth in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "rameel",
    name: "Rameel",
    chamberLine: "Chained upright against the black rock of the valley wall.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Rameel, chained against the valley rock, his face lost in shadow",
  }),
  chamber({
    slug: "kokablel",
    name: "Kokablel",
    nameNote: "Named Kokabel in the teaching list of 1 Enoch 8.",
    chamberLine:
      "Bound beneath the constellations he taught \u2014 they keep their courses without him.",
    deed: "\u201CKokabel [taught] the constellations\u201D (1 Enoch 8).",
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Kokablel, bound in the valleys of the earth beneath the constellations, his face lost in shadow",
  }),
  chamber({
    slug: "tamlel",
    name: "Tamlel",
    chamberLine:
      "Kneeling, his chains crossed over his chest and anchored in the earth.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Tamlel, kneeling bound in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "ramlel",
    name: "Ramlel",
    chamberLine:
      "Bound with his back to a fallen boulder, the chains wound round the stone.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Ramlel, bound against a fallen boulder in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "danel",
    name: "Danel",
    chamberLine:
      "Seated in a hollow of black rock, chained to the pit walls around him.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Danel, bound in a hollow of rock in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "ezeqeel",
    name: "Ezeqeel",
    chamberLine:
      "Seated in the low cloud that fills his valley, his chains lost in the mist.",
    deed: "\u201CEzeqeel [taught] the knowledge of the clouds\u201D (1 Enoch 8).",
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Ezeqeel, bound in the low clouds of the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "baraqijal",
    name: "Baraqijal",
    chamberLine: "Bowed away from the ordered heavens he once read for men.",
    deed: "\u201CBaraqijal (taught) astrology\u201D (1 Enoch 8).",
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Baraqijal, bound beneath a crowded field of stars in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "azazel",
    name: "Azazel",
    nameNote:
      "Named Asael in the chiefs\u2019 list of 1 Enoch 6. The meaning of his name is debated, and we assert none.",
    chamberLine: "Alone in Dudael, under rough and jagged rocks, his face covered.",
    deed: "\u201CAzazel taught men to make swords, and knives, and shields, and breastplates, and made known to them the metals of the earth and the art of working them\u201D \u2014 and ornaments, and the beautifying of the eyelids, and costly stones, and colouring tinctures (1 Enoch 8). Heaven\u2019s verdict: \u201Cthe whole earth has been corrupted through the works that were taught by Azazel: to him ascribe all sin\u201D (1 Enoch 10).",
    binding:
      "\u201CBind Azazel hand and foot, and cast him into the darkness\u2026 in the desert, which is in Dudael\u2026 place upon him rough and jagged rocks, and cover him with darkness\u2026 and cover his face that he may not see light\u201D (1 Enoch 10).",
    echo: "His name stands in Scripture itself: on the Day of Atonement, one goat was \u201Cfor Azazel,\u201D sent into the wilderness bearing the people\u2019s iniquities (Leviticus 16).",
    status: "crowned",
    alt: "Azazel bound hand and foot in the desert of Dudael, jagged rocks heaped over him, his face covered in darkness \u2014 crowned portrait",
  }),
  chamber({
    slug: "armaros",
    name: "Armaros",
    chamberLine: "Bound twice over, coil upon coil of chain.",
    deed: "\u201CArmaros [taught] the resolving of enchantments\u201D (1 Enoch 8) \u2014 the loosing of bonds. No bond of his has ever loosed his own.",
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Armaros, bound in coils of chain in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "batarel",
    name: "Batarel",
    chamberLine: "Pinned by wrist and ankle to the flat slab of rock he sits on.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Batarel, chained to a flat rock slab in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "ananel",
    name: "Ananel",
    chamberLine: "Bowed lowest of the company, his forehead nearly to the ground.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Ananel, bowed low and bound in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "zaqiel",
    name: "Zaqiel",
    chamberLine: "Wedged in a cleft of the valley wall, the rock closing around him.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Zaqiel, bound in a cleft of rock in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "samsapeel",
    name: "Samsapeel",
    nameNote: "Named Shamsiel in the teaching list of 1 Enoch 8.",
    chamberLine:
      "Bowed away from a dawn that rises without his reading, and not for him.",
    deed: "\u201CShamsiel [taught] the signs of the sun\u201D (1 Enoch 8).",
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Samsapeel, bound in the valleys of the earth, bowed away from a faint dawn, his face lost in shadow",
  }),
  chamber({
    slug: "satarel",
    name: "Satarel",
    chamberLine: "His chains climb both valley walls and are lost in the black.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Satarel, bound in the valleys of the earth, his chains running up both slopes, his face lost in shadow",
  }),
  chamber({
    slug: "turel",
    name: "Turel",
    chamberLine: "Standing bound, chained straight down into the earth at his feet.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Turel, standing bound in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "jomjael",
    name: "Jomjael",
    chamberLine: "Held in the valley\u2019s narrowest pass, chained into both walls.",
    deed: NAME_ONLY_DEED,
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Jomjael, bound in a narrow rock pass in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "sariel",
    name: "Sariel",
    chamberLine:
      "Seated at the edge of the moonlight; the moon keeps its course and passes him by.",
    deed: "\u201CSariel [taught] the course of the moon\u201D (1 Enoch 8).",
    binding: COMPANY_BINDING,
    status: "placeholder",
    alt: "Placeholder silhouette of Sariel, bound beneath a full moon in the valleys of the earth, his face lost in shadow",
  }),
  chamber({
    slug: "seven-stars",
    name: "The Seven Stars",
    nameNote: "No names. The book gives them none, and we give them none.",
    chamberLine:
      "Seven bound star-figures in the abyss of fire, at the end of heaven and earth.",
    deed: "Stars of heaven \u201Cwhich have transgressed the commandment of the Lord\u2026 because they did not come forth at their appointed times\u201D (1 Enoch 18).",
    binding:
      "\u201CThis place is the end of heaven and earth: this has become a prison for the stars and the host of heaven\u2026 bound them till the time when their guilt should be consummated (even) for ten thousand years\u201D (1 Enoch 18). And again: \u201CThis place is the prison of the angels, and here they will be imprisoned for ever\u201D (1 Enoch 21).",
    status: "collective",
    alt: "The seven stars of heaven bound together in the abyss, among columns of fire \u2014 no faces, no names",
  }),
];

export const FALLEN_STATUS_LINES: Record<FallenStatus, string> = {
  crowned: "Portrait crowned \u2014 this chamber holds his true portrait.",
  placeholder:
    "A placeholder silhouette, shaped by his binding. His portrait will stand here when it is built and crowned.",
  collective:
    "A collective chamber \u2014 the book names none of the seven, and gives none of them a face.",
};
