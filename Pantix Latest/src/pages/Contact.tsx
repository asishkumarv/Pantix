import { Mail, MapPin, MessageCircle, Instagram, Youtube } from "lucide-react";
import { Layout } from "@/components/Layout";

const Contact = () => {
  return (
    <Layout>
      <div className="w-full px-4 md:px-8 lg:px-14 pt-4 md:pt-6 pb-12">
        <p className="text-xs uppercase tracking-[0.4em] text-gold/80 text-center">
          Concierge
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-6xl gradient-text-gold text-center">
          Contact Us
        </h1>
        <div className="gold-divider mt-3 mx-auto w-24" />

        <div className="mt-12 grid md:grid-cols-2 gap-8 lg:gap-12 w-full">
          <div className="space-y-5">
            <Item icon={Mail} title="Email" href="mailto:info@pantix.in">
              info@pantix.in
            </Item>
            <Item icon={MessageCircle} title="WhatsApp" href="https://wa.me/919640369511">
              +91 9640369511
            </Item>
            <Item icon={Instagram} title="Instagram" href="https://www.instagram.com/pantix.in">
              @pantix.in
            </Item>
            <Item icon={Youtube} title="YouTube" href="https://www.youtube.com">
              YouTube Channel
            </Item>
          </div>
          <form
            className="p-6 md:p-8 border border-gold/25 bg-card/60 rounded-lg shadow-royal space-y-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <Field label="Name" />
            <Field label="Email" />
            <Field label="Subject" />
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold/90 font-medium">
                Message
              </span>
              <textarea
                rows={5}
                className="mt-1.5 w-full bg-background/50 border border-gold/25 rounded-md p-3 text-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40"
              />
            </label>
            <button className="px-7 py-3 bg-gold text-primary-foreground uppercase text-sm tracking-wide hover:bg-primary-glow">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

function Item({
  icon: Icon,
  title,
  href,
  children,
}: {
  icon: any;
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="h-10 w-10 grid place-items-center border border-gold/30 text-gold rounded-sm shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold/80">
          {title}
        </p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-gold transition-colors font-medium hover:underline"
          >
            {children}
          </a>
        ) : (
          <p className="text-foreground">{children}</p>
        )}
      </div>
    </div>
  );
}

function Field({ label }: { label: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.25em] text-gold/90 font-medium">
        {label}
      </span>
      <input className="mt-1.5 w-full bg-background/50 border border-gold/25 rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40" />
    </label>
  );
}

export default Contact;
