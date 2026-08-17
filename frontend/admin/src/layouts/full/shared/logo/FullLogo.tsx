import LogoImg from "src/assets/images/logos/fikta-lockup-horizontal.svg";
import LogoImgReverse from "src/assets/images/logos/fikta-lockup-reverse.svg";

interface FullLogoProps {
  /** Use "reverse" on navy/dark backgrounds (e.g. the sidebar) so the wordmark stays visible. */
  variant?: 'default' | 'reverse';
}

const FullLogo = ({ variant = 'default' }: FullLogoProps) => {
  const userStr = localStorage.getItem('fikta_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isTechNet = user?.tenantId === 'technet';

  if (isTechNet) {
    return (
      <div className="flex items-center justify-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#F86D72] to-[#51A8B1] flex items-center justify-center text-white font-extrabold shadow-sm">
          TN
        </div>
        <span className="text-2xl font-black tracking-tighter uppercase">
          <span className="text-[#F86D72]">TECH</span>
          <span className="text-[#51A8B1]">NET</span>
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
