import Link from 'next/link';
import { sections, sites } from '@/data/mock';

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                <span className="text-white font-display font-bold text-xs">WV</span>
              </div>
              <span className="font-display text-lg font-bold">WVNews</span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed">
              West Virginia&apos;s trusted source for local news, sports, business, and community coverage since 1900.
            </p>
          </div>

          {/* Sections */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Sections</h4>
            <div className="space-y-1.5">
              {sections.slice(0, 8).map(s => (
                <Link key={s.id} href={`/section/${s.slug}`} className="block text-sm text-white/60 hover:text-white transition-colors">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Reader Services */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Reader Services</h4>
            <div className="space-y-1.5">
              <Link href="/subscribe" className="block text-sm text-white/60 hover:text-white">Subscribe</Link>
              <Link href="/e-edition" className="block text-sm text-white/60 hover:text-white">E-Edition</Link>
              <Link href="/account" className="block text-sm text-white/60 hover:text-white">My Account</Link>
              <Link href="/submit?form=obituary" className="block text-sm text-white/60 hover:text-white">Submit Obituary</Link>
              <Link href="/submit?form=letter" className="block text-sm text-white/60 hover:text-white">Letter to Editor</Link>
              <Link href="/submit?form=event" className="block text-sm text-white/60 hover:text-white">Post an Event</Link>
              <Link href="/submit?form=classified" className="block text-sm text-white/60 hover:text-white">Place a Classified</Link>
            </div>
          </div>

          {/* Our Sites */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Our Publications</h4>
            <div className="space-y-1.5">
              {sites.map(site => (
                <a key={site.id} href={`https://${site.domain}`} className="block text-sm text-white/60 hover:text-white">
                  {site.name}
                </a>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">About</h4>
            <div className="space-y-1.5">
              <Link href="/submit?form=advertise" className="block text-sm text-white/60 hover:text-white">Advertise</Link>
              <Link href="/submit?form=tip" className="block text-sm text-white/60 hover:text-white">Send a News Tip</Link>
              <a href="#" className="block text-sm text-white/60 hover:text-white">Contact Us</a>
              <a href="#" className="block text-sm text-white/60 hover:text-white">Careers</a>
              <a href="#" className="block text-sm text-white/60 hover:text-white">Privacy Policy</a>
              <a href="#" className="block text-sm text-white/60 hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs">© 2026 WVNews Group. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/40 hover:text-white text-sm">Facebook</a>
            <a href="#" className="text-white/40 hover:text-white text-sm">X / Twitter</a>
            <a href="#" className="text-white/40 hover:text-white text-sm">Instagram</a>
            <a href="#" className="text-white/40 hover:text-white text-sm">TikTok</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
