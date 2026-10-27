/**
 * Verse of the Day rotation.
 *
 * A curated list of well-loved verses in the app’s own World English
 * Bible wording. Every text below was taken from the app’s canonical
 * chapter data (data/chapters/{slug}_data.json — the same words the
 * reader itself prints) and verified against it verse by verse.
 *
 * The day’s verse is chosen deterministically from the calendar date,
 * so every visitor sees the same verse on the same day — no randomness,
 * no external fetch, nothing cached per device.
 */

export interface DailyVerse {
  /** Display reference, e.g. "John 11:35". */
  ref: string;
  /** The verse itself, WEB wording exactly as the app prints it. */
  text: string;
  /** Book title for the door label, e.g. "John". */
  book: string;
  /** Real chapter number within the book. */
  chapter: number;
  /** Chapter route in the app, e.g. "/book/john/10". */
  href: string;
}

/** The share-card scene art, alternated day by day. */
const BACKGROUNDS = [
  "/images/share-bg/vineyard-dawn.jpg",
  "/images/share-bg/starry-night.jpg",
];

export const DAILY_VERSES: DailyVerse[] = [
  {
    ref: "Genesis 1:1",
    text: "In the beginning, God created the heavens and the earth.",
    book: "Genesis",
    chapter: 1,
    href: "/book/genesis/0",
  },
  {
    ref: "Deuteronomy 31:8",
    text: "Yahweh himself is who goes before you. He will be with you. He will not fail you nor forsake you. Don’t be afraid. Don’t be discouraged.”",
    book: "Deuteronomy",
    chapter: 31,
    href: "/book/deuteronomy/30",
  },
  {
    ref: "Joshua 1:9",
    text: "Haven’t I commanded you? Be strong and courageous. Don’t be afraid. Don’t be dismayed, for Yahweh your God is with you wherever you go.”",
    book: "Joshua",
    chapter: 1,
    href: "/book/joshua/0",
  },
  {
    ref: "Psalms 19:14",
    text: "Let the words of my mouth and the meditation of my heart be acceptable in your sight, Yahweh, my rock, and my redeemer.",
    book: "Psalms",
    chapter: 19,
    href: "/book/psalms/18",
  },
  {
    ref: "Psalms 23:1",
    text: "Yahweh is my shepherd; I shall lack nothing.",
    book: "Psalms",
    chapter: 23,
    href: "/book/psalms/22",
  },
  {
    ref: "Psalms 27:1",
    text: "Yahweh is my light and my salvation. Whom shall I fear? Yahweh is the strength of my life. Of whom shall I be afraid?",
    book: "Psalms",
    chapter: 27,
    href: "/book/psalms/26",
  },
  {
    ref: "Psalms 46:10",
    text: "“Be still, and know that I am God. I will be exalted among the nations. I will be exalted on the earth.”",
    book: "Psalms",
    chapter: 46,
    href: "/book/psalms/45",
  },
  {
    ref: "Psalms 118:24",
    text: "This is the day that Yahweh has made. We will rejoice and be glad in it!",
    book: "Psalms",
    chapter: 118,
    href: "/book/psalms/117",
  },
  {
    ref: "Psalms 139:14",
    text: "I will give thanks to you, for I am fearfully and wonderfully made. Your works are wonderful. My soul knows that very well.",
    book: "Psalms",
    chapter: 139,
    href: "/book/psalms/138",
  },
  {
    ref: "Proverbs 3:5",
    text: "Trust in Yahweh with all your heart, and don’t lean on your own understanding.",
    book: "Proverbs",
    chapter: 3,
    href: "/book/proverbs/2",
  },
  {
    ref: "Isaiah 40:31",
    text: "but those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.",
    book: "Isaiah",
    chapter: 40,
    href: "/book/isaiah/39",
  },
  {
    ref: "Isaiah 41:10",
    text: "Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.",
    book: "Isaiah",
    chapter: 41,
    href: "/book/isaiah/40",
  },
  {
    ref: "Jeremiah 29:11",
    text: "For I know the thoughts that I think toward you,” says Yahweh, “thoughts of peace, and not of evil, to give you hope and a future.",
    book: "Jeremiah",
    chapter: 29,
    href: "/book/jeremiah/28",
  },
  {
    ref: "Lamentations 3:22",
    text: "It is because of Yahweh’s loving kindnesses that we are not consumed, because his mercies don’t fail.",
    book: "Lamentations",
    chapter: 3,
    href: "/book/lamentations/2",
  },
  {
    ref: "Micah 6:8",
    text: "He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?",
    book: "Micah",
    chapter: 6,
    href: "/book/micah/5",
  },
  {
    ref: "Zephaniah 3:17",
    text: "Yahweh, your God, is among you, a mighty one who will save. He will rejoice over you with joy. He will calm you in his love. He will rejoice over you with singing.",
    book: "Zephaniah",
    chapter: 3,
    href: "/book/zephaniah/2",
  },
  {
    ref: "Matthew 5:16",
    text: "Even so, let your light shine before men, that they may see your good works and glorify your Father who is in heaven.",
    book: "Matthew",
    chapter: 5,
    href: "/book/matthew/4",
  },
  {
    ref: "Matthew 6:33",
    text: "But seek first God’s Kingdom and his righteousness; and all these things will be given to you as well.",
    book: "Matthew",
    chapter: 6,
    href: "/book/matthew/5",
  },
  {
    ref: "Matthew 11:28",
    text: "“Come to me, all you who labor and are heavily burdened, and I will give you rest.",
    book: "Matthew",
    chapter: 11,
    href: "/book/matthew/10",
  },
  {
    ref: "Mark 10:27",
    text: "Jesus, looking at them, said, “With men it is impossible, but not with God, for all things are possible with God.”",
    book: "Mark",
    chapter: 10,
    href: "/book/mark/9",
  },
  {
    ref: "Luke 1:37",
    text: "For nothing spoken by God is impossible.”",
    book: "Luke",
    chapter: 1,
    href: "/book/luke/0",
  },
  {
    ref: "Luke 19:10",
    text: "For the Son of Man came to seek and to save that which was lost.”",
    book: "Luke",
    chapter: 19,
    href: "/book/luke/18",
  },
  {
    ref: "John 1:1",
    text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    book: "John",
    chapter: 1,
    href: "/book/john/0",
  },
  {
    ref: "John 3:16",
    text: "For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.",
    book: "John",
    chapter: 3,
    href: "/book/john/2",
  },
  {
    ref: "John 8:12",
    text: "Again, therefore, Jesus spoke to them, saying, “I am the light of the world. He who follows me will not walk in the darkness, but will have the light of life.”",
    book: "John",
    chapter: 8,
    href: "/book/john/7",
  },
  {
    ref: "John 10:11",
    text: "“I am the good shepherd. The good shepherd lays down his life for the sheep.",
    book: "John",
    chapter: 10,
    href: "/book/john/9",
  },
  {
    ref: "John 11:35",
    text: "Jesus wept.",
    book: "John",
    chapter: 11,
    href: "/book/john/10",
  },
  {
    ref: "John 14:6",
    text: "Jesus said to him, “I am the way, the truth, and the life. No one comes to the Father, except through me.",
    book: "John",
    chapter: 14,
    href: "/book/john/13",
  },
  {
    ref: "John 15:1",
    text: "“I am the true vine, and my Father is the farmer.",
    book: "John",
    chapter: 15,
    href: "/book/john/14",
  },
  {
    ref: "John 16:33",
    text: "I have told you these things, that in me you may have peace. In the world you have oppression; but cheer up! I have overcome the world.”",
    book: "John",
    chapter: 16,
    href: "/book/john/15",
  },
  {
    ref: "Acts 1:8",
    text: "But you will receive power when the Holy Spirit has come upon you. You will be witnesses to me in Jerusalem, in all Judea and Samaria, and to the uttermost parts of the earth.”",
    book: "Acts",
    chapter: 1,
    href: "/book/acts/0",
  },
  {
    ref: "Romans 8:28",
    text: "We know that all things work together for good for those who love God, for those who are called according to his purpose.",
    book: "Romans",
    chapter: 8,
    href: "/book/romans/7",
  },
  {
    ref: "Romans 12:2",
    text: "Don’t be conformed to this world, but be transformed by the renewing of your mind, so that you may prove what is the good, well-pleasing, and perfect will of God.",
    book: "Romans",
    chapter: 12,
    href: "/book/romans/11",
  },
  {
    ref: "1 Corinthians 13:13",
    text: "But now faith, hope, and love remain—these three. The greatest of these is love.",
    book: "1 Corinthians",
    chapter: 13,
    href: "/book/corinthians-1/12",
  },
  {
    ref: "Ephesians 2:8",
    text: "for by grace you have been saved through faith, and that not of yourselves; it is the gift of God,",
    book: "Ephesians",
    chapter: 2,
    href: "/book/ephesians/1",
  },
  {
    ref: "Philippians 4:6",
    text: "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.",
    book: "Philippians",
    chapter: 4,
    href: "/book/philippians/3",
  },
  {
    ref: "Philippians 4:13",
    text: "I can do all things through Christ who strengthens me.",
    book: "Philippians",
    chapter: 4,
    href: "/book/philippians/3",
  },
  {
    ref: "Colossians 3:23",
    text: "And whatever you do, work heartily, as for the Lord and not for men,",
    book: "Colossians",
    chapter: 3,
    href: "/book/colossians/2",
  },
  {
    ref: "2 Timothy 1:7",
    text: "For God didn’t give us a spirit of fear, but of power, love, and self-control.",
    book: "2 Timothy",
    chapter: 1,
    href: "/book/timothy-2/0",
  },
  {
    ref: "Hebrews 11:1",
    text: "Now faith is assurance of things hoped for, proof of things not seen.",
    book: "Hebrews",
    chapter: 11,
    href: "/book/hebrews/10",
  },
  {
    ref: "James 1:5",
    text: "But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him.",
    book: "James",
    chapter: 1,
    href: "/book/james/0",
  },
  {
    ref: "1 Peter 5:7",
    text: "casting all your worries on him, because he cares for you.",
    book: "1 Peter",
    chapter: 5,
    href: "/book/peter-1/4",
  },
  {
    ref: "1 John 4:19",
    text: "We love him, because he first loved us.",
    book: "1 John",
    chapter: 4,
    href: "/book/john-1/3",
  },
  {
    ref: "Revelation 21:4",
    text: "He will wipe away every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain any more. The first things have passed away.”",
    book: "Revelation",
    chapter: 21,
    href: "/book/revelation/20",
  },
];

/** Whole days since the epoch for a calendar date (DST-proof). */
function dayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

/** The verse for a given calendar date — the same for every visitor. */
export function dailyVerse(d: Date): { verse: DailyVerse; background: string } {
  const n = dayNumber(d);
  const i = ((n % DAILY_VERSES.length) + DAILY_VERSES.length) % DAILY_VERSES.length;
  return { verse: DAILY_VERSES[i], background: BACKGROUNDS[i % BACKGROUNDS.length] };
}
