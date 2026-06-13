// Compatibility shim — re-exports react-router-dom APIs under the names the
// rest of the codebase expects (Link, useNavigate, useParams, useLocation, NavLink).
// Originally this bridged TanStack Router; now it sits on top of react-router-dom
// so all ported pages and components keep working without changes.

import {
  Link as RLink,
  NavLink as RNavLink,
  useLocation as useRLocation,
  useNavigate as useRNavigate,
  useParams as useRParams,
  type LinkProps as RLinkProps,
  type NavLinkProps as RNavLinkProps,
} from "react-router-dom";
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";

type AnchorAttrs = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export interface LinkProps extends AnchorAttrs {
  to: string;
  replace?: boolean;
  children?: ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, children, ...rest },
  ref
) {
  const props = { to, replace, ref, ...rest } as unknown as RLinkProps;
  return <RLink {...props}>{children}</RLink>;
});

export function useNavigate() {
  const navigate = useRNavigate();
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      navigate(to);
      return;
    }
    navigate(to, { replace: options?.replace });
  };
}

export function useParams<
  T extends Record<string, string> = Record<string, string>
>(): T {
  return useRParams() as unknown as T;
}

export function useLocation() {
  const loc = useRLocation();
  return {
    pathname: loc.pathname,
    search: loc.search ?? "",
    hash: loc.hash ?? "",
    state: loc.state,
    key: loc.key ?? "default",
  };
}

// NavLink — render-prop className/children with { isActive, isPending }.
type NavLinkRenderArgs = { isActive: boolean; isPending: boolean };

export interface NavLinkProps extends Omit<AnchorAttrs, "className" | "children"> {
  to: string;
  end?: boolean;
  replace?: boolean;
  className?: string | ((args: NavLinkRenderArgs) => string | undefined);
  children?: ReactNode | ((args: NavLinkRenderArgs) => ReactNode);
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink({ to, end, replace, className, children, ...rest }, ref) {
    const props = {
      to,
      end,
      replace,
      ref,
      className:
        typeof className === "function"
          ? ({ isActive, isPending }: NavLinkRenderArgs) =>
              className({ isActive, isPending })
          : className,
      children:
        typeof children === "function"
          ? ({ isActive, isPending }: NavLinkRenderArgs) =>
              children({ isActive, isPending })
          : children,
      ...rest,
    } as unknown as RNavLinkProps;
    return <RNavLink {...props} />;
  }
);
