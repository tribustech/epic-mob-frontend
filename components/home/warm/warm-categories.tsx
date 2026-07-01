import Link from "next/link";
import Image from "next/image";
import { roomCategories } from "@/lib/site-data";

export function WarmCategories() {
  return (
    <section className="bg-cream">
      <div className="section-shell py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow-warm">Ce mobilăm</p>
          <h2 className="display-font mt-4 text-4xl leading-tight text-espresso sm:text-5xl">
            Fiecare cameră, gândită separat
          </h2>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
          {roomCategories.map((room) => (
            <li key={room.label}>
              <Link
                href={room.href}
                className="cat-tile flex flex-col items-center text-center"
              >
                <span className="cat-tile__icon">
                  <Image
                    src={`/icons/cat/${room.icon}.png`}
                    alt=""
                    width={44}
                    height={44}
                    className="cat-tile__img"
                  />
                </span>
                <span className="mt-5 text-base font-semibold text-espresso">
                  {room.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
