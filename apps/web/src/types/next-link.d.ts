import type { LinkProps } from "next/link";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

declare module "next/link" {
  export default function Link(
    props: PropsWithChildren<LinkProps> &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>
  ): JSX.Element;
}
