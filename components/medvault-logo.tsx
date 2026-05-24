import Image from "next/image";

export function MedVaultLogo({ className = "", imageClassName = "h-10 w-auto" }: { className?: string, imageClassName?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/logo-transparent.png" alt="JJ Hospital Logo" className={imageClassName} />
    </div>
  );
}
