import { Link } from 'react-router';
import LogoIcon from 'src/assets/images/logos/fikta-symbol.svg';

const Logo = () => {
    const userStr = localStorage.getItem('fikta_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isTechNet = user?.tenantId === 'technet';

    if (isTechNet) {
        return (
            <Link to={'/'} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#F86D72] to-[#51A8B1] flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                    TN
                </div>
                <span className="text-lg font-black tracking-tighter uppercase">
                    <span className="text-[#F86D72]">TECH</span>
                    <span className="text-primary">NET</span>
                </span>
            </Link>
        );
    }

    return (
        <Link to={'/'} className="flex items-center gap-2">
            <img src={LogoIcon} alt="FIKTA" className="h-9 object-contain" />
        </Link>
    );
};

export default Logo;
