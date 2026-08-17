import { ArrowUpRight } from "lucide-react";
import {
  InstagramIcon,
  TikTokIcon,
  FacebookIcon,
} from "@/components/icons/social-icons";
import { fetchTiktokVideos, tiktokProfileUrl } from "@/lib/tiktok-data";
import { ReelLightbox } from "./reel-lightbox";

// Social profiles for the "urmărește-ne" card. URLs mirror business-data sameAs.
const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/epic.mob/",
    Icon: InstagramIcon,
  },
  { label: "TikTok", href: tiktokProfileUrl, Icon: TikTokIcon },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61591804106486",
    Icon: FacebookIcon,
  },
];

// "Din atelier" — a compact social block near the foot of the homepage: an
// espresso "follow us" card on the left, a 2×2 wall of the latest TikTok reels on
// the right, and a "see more" button into the TikTok profile. Server component:
// covers are fetched at build/ISR time; renders `null` when nothing is playable,
// so the section never breaks on prod if the list is empty or TikTok is down.
export async function WarmReels() {
  const videos = await fetchTiktokVideos();
  if (videos.length === 0) return null;

  return (
    <section className="bg-cream">
      <div className="section-shell py-20 sm:py-24">
        <div className="max-w-xl">
          <p className="eyebrow-warm">Pe rețele</p>
          <h2 className="display-font mt-4 text-4xl leading-tight text-espresso sm:text-5xl">
            Ne vezi și în mișcare.
          </h2>
        </div>

        <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Social card */}
          <aside className="flex flex-col justify-between rounded-[2rem] bg-espresso p-8 text-cream shadow-[var(--shadow-warm)] lg:w-80 lg:shrink-0">
            <div>
              <h3 className="display-font text-2xl leading-snug sm:text-3xl">
                Urmărește-ne pe rețele
              </h3>
              <p className="mt-3 text-sm leading-7 text-cream/70">
                Proiecte, idei de amenajare și inspirație pentru casa ta
              </p>
            </div>
            <ul className="mt-8 flex flex-col gap-3">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-full border border-cream/20 px-5 py-3 text-sm font-medium transition hover:border-cream/50 hover:bg-cream/5"
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                    <ArrowUpRight
                      size={16}
                      strokeWidth={2}
                      className="ml-auto text-cream/50 transition group-hover:text-cream"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          {/* Reel wall + see more */}
          <div className="flex-1">
            <ReelLightbox videos={videos} />
            <div className="mt-8 flex justify-center">
              <a
                href={tiktokProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-warm btn-warm--ghost"
              >
                Vezi mai multe pe TikTok
                <ArrowUpRight size={18} strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
