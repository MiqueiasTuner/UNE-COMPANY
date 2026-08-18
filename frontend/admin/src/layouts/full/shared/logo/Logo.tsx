import { Link } from 'react-router';
import LogoIcon from 'src/assets/images/logos/fikta-symbol.svg';
import { getCurrentTenant } from 'src/data/tenants';

const Logo = () => {
    const tenant = getCurrentTenant();

    if (tenant.id !== 'fikta') {
        return (
            <Link to={'/'} className="flex items-center gap-3">
                <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shadow-sm"
                    style={{ backgroundImage: `linear-gradient(to bottom right, ${tenant.colors.primary}, ${tenant.colors.secondary})` }}
                >
                    {tenant.initials}
                </div>
                <span className="text-lg font-black tracking-tighter uppercase">
                    <span style={{ color: tenant.colors.primary }}>{tenant.wordmark.lead}</span>
                    <span style={{ color: tenant.colors.secondary }}>{tenant.wordmark.tail}</span>
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
