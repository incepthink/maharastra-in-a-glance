import Link from "next/link";

export const metadata = { title: "पान सापडले नाही" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-5xl text-saffron-deep">४०४</p>
      <h1 className="font-display text-2xl text-ink">पान सापडले नाही</h1>
      <p className="text-[0.9375rem] leading-relaxed text-ink-mute">
        आपण शोधत असलेले पान उपलब्ध नाही. मुख्य पानावर परत जाऊन बातम्यांचा सारांश
        पाहा.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex min-h-12 items-center rounded-xl bg-saffron px-6 text-[0.9375rem] font-semibold text-white shadow-card transition-colors hover:bg-saffron-deep"
      >
        मुख्य पानावर जा
      </Link>
    </main>
  );
}
