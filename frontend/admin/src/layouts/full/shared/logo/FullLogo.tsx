import LogoImg from "src/assets/images/logos/fikta-lockup-horizontal.svg";
import LogoImgReverse from "src/assets/images/logos/fikta-lockup-reverse.svg";
import { getCurrentTenant } from "src/data/tenants";

interface FullLogoProps {
  /** Use "reverse" on navy/dark backgrounds (e.g. the sidebar) so the wordmark stays visible. */
  variant?: 'default' | 'reverse';
}

const FullLogo = ({ variant = 'default' }: FullLogoProps) => {
  const tenant = getCurrentTenant();

  if (tenant.id !== 'fikta') {
    return (
      <div className="flex items-center justify-center gap-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-extrabold shadow-sm"
          style={{ backgroundImage: `linear-gradient(to bottom right, ${tenant.colors.primary}, ${tenant.colors.secondary})` }}
        >
          {tenant.initials}
        </div>
        <span className="text-2xl font-black tracking-tighter uppercase">
          <span style={{ color: tenant.colors.primary }}>{tenant.wordmark.lead}</span>
          <span style={{ color: tenant.colors.secondary }}>{tenant.wordmark.tail}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <img
        src={variant === 'reverse' ? LogoImgReverse : LogoImg}
        alt="FIKTA Logo"
        className="h-16 object-contain"
      />
    </div>
  );
};

export default FullLogo;
