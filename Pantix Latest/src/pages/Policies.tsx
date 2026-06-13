import { Layout } from "@/components/Layout";

const Policies = () => {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-16">
        <h1 className="font-display text-4xl gradient-text-gold">Policies</h1>
        <div className="gold-divider mt-3 w-24" />
        <div className="mt-10 space-y-10 text-muted-foreground">
          <section>
            <h2 className="font-display text-2xl text-foreground">Privacy</h2>
            <p className="mt-3">
              We respect your privacy. Information you share is used only to
              fulfil your orders and improve your experience.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground">
              Refunds &amp; Returns
            </h2>
            <p className="mt-3">
              Easy 7-day returns on most items. Custom and altered pieces are
              final sale.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground">Terms</h2>
            <p className="mt-3">
              By using Pantix you agree to our terms of service and acceptable
              use guidelines.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Policies;
