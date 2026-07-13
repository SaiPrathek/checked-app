import type { SVGProps } from "react";

/**
 * Checked's core mark: an open C crossed by a check-shaped flight path.
 * The orange tile remains legible from navigation size down to a favicon.
 */
export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#F5A623" />
      <path
        d="M42 17.5C31.5 11.2 17.4 17.2 14.6 29.2C11.4 42.8 25.8 53.5 42 46.5"
        stroke="#0D1626"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M26 32.5L34 40.5L50.5 22"
        stroke="#FFF8E8"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
