import Image from "next/image";

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Certi logo"
      width={size}
      height={size}
      className="shrink-0"
      priority
    />
  );
}
