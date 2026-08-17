const AuthBrandPanel = () => {
  return (
    <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-[#0B1D3A] p-12 xl:p-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <svg
        className="pointer-events-none absolute -right-24 -bottom-24 h-[440px] w-[440px] opacity-[0.07]"
        viewBox="0 0 120 120"
        fill="none"
      >
        <path fill="#FFFFFF" d="M20 28 H92 L82 44 H46 V60 H78 L68 76 H46 V112 H20 Z" />
      </svg>

      <svg viewBox="0 0 390 110" className="relative h-16 w-auto shrink-0">
        <g transform="translate(0,8) scale(.72)">
          <polygon fill="#FFC629" points="26,18 78,0 78,22 26,22" />
          <path fill="#FFFFFF" d="M20 28 H92 L82 44 H46 V60 H78 L68 76 H46 V112 H20 Z" />
        </g>
        <line x1="96" y1="12" x2="96" y2="96" stroke="rgba(255,255,255,0.25)" />
        <g transform="translate(118,18) scale(.72)">
          <path fill="#FFFFFF" d="M0 0 H54 V10 H14 V30 H48 V40 H14 V72 H0 Z" />
          <rect fill="#FFFFFF" x="70" y="0" width="12" height="72" />
          <path fill="#FFFFFF" d="M100 0 H114 V28 L142 0 H160 L128 32 L163 72 H145 L118 40 L114 44 V72 H100 Z" />
          <polygon fill="#FFC629" points="124,30 136,19 142,25 130,36" />
          <path fill="#FFFFFF" d="M176 0 H236 V11 H213 V72 H199 V11 H176 Z" />
          <path
            fill="#FFFFFF"
            fillRule="evenodd"
            d="M252 72 L281 0 H297 L326 72 H311 L304 53 H274 L267 72 Z M279 41 H299 L289 15 Z"
          />
        </g>
        <text x="118" y="92" fill="#9BA5BD" fontFamily="Inter, Arial, sans-serif" fontSize="15" letterSpacing="5">
          editora digital
        </text>
      </svg>

      <div className="relative">
        <h2 className="font-[Poppins,sans-serif] text-3xl font-bold leading-tight text-white xl:text-4xl">
          Inteligência editorial.
          <br />
          Imaginação sem limites.
        </h2>
        <p className="mt-4 max-w-sm text-sm text-[#C6CEDD]">
          Publicamos ideias. Transformamos histórias. Conectamos leitores.
        </p>
      </div>

      <p className="relative text-xs text-[#7C8FAC]">© {new Date().getFullYear()} FIKTA — Editora Digital</p>
    </div>
  );
};

export default AuthBrandPanel;
