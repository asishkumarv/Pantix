import { Link, useLocation } from "@/lib/router-compat";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="text-xs uppercase tracking-[0.45em] text-gold/80">
          Pantix
        </p>
        <h1 className="mt-2 font-display text-7xl gradient-text-gold">404</h1>
        <div className="gold-divider mt-4 mx-auto w-24" />
        <p className="mt-6 text-lg text-foreground">
          This page wandered out of the queen's world.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block px-7 py-3.5 bg-gold text-primary-foreground uppercase tracking-wide text-sm font-medium hover:bg-primary-glow shadow-gold"
        >
          Return Home
        </Link>
      </div>
    </div>
    </Layout>
  );
};

export default NotFound;
