import AuthLogin from "../authforms/AuthLogin";
import AuthBrandPanel from "src/layouts/full/shared/auth/AuthBrandPanel";
import FullLogo from "src/layouts/full/shared/logo/FullLogo";

const Login = () => {
  return (
    <div className="theme-light-scope flex h-screen w-full overflow-hidden bg-white">
      <AuthBrandPanel />
      <div className="flex w-full lg:w-1/2 items-center justify-center overflow-y-auto px-4 py-10">
        <div className="w-full md:w-[420px]">
          <div className="mx-auto mb-8 text-center">
            <FullLogo />
            <p className="text-xs text-[#5A6A85] mt-3 uppercase tracking-widest font-semibold">
              Painel do Provedor
            </p>
          </div>
          <AuthLogin />
        </div>
      </div>
    </div>
  );
};

export default Login;
