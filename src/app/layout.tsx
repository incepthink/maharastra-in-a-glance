import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Tiro_Devanagari_Marathi } from "next/font/google";
import "./globals.css";

/** Body face: a variable Devanagari sans with excellent screen legibility. */
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari", "latin"],
  display: "swap",
});

/** Display face: a serif drawn specifically for Marathi, used for headlines. */
const tiroMarathi = Tiro_Devanagari_Marathi({
  variable: "--font-tiro-marathi",
  subsets: ["devanagari", "latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "महाराष्ट्र एका नजरेत",
    template: "%s | महाराष्ट्र एका नजरेत",
  },
  description:
    "महाराष्ट्रातील विकासविषयक बातम्यांचे संक्षिप्त मराठी सारांश, पोस्टर आणि संपूर्ण लेखाच्या PDF सह.",
  applicationName: "महाराष्ट्र एका नजरेत",
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    title: "महाराष्ट्र एका नजरेत",
    description:
      "महाराष्ट्रातील विकासविषयक बातम्यांचे संक्षिप्त मराठी सारांश एकाच ठिकाणी.",
    locale: "mr_IN",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Notched phones: let the page paint edge to edge, then respect the insets
  // with the `--safe-*` variables from globals.css.
  viewportFit: "cover",
  themeColor: "#faf7f2",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mr"
      className={`${notoDevanagari.variable} ${tiroMarathi.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
