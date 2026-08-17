import { Link } from "react-router";
import AuthTwoSteps from "../authforms/AuthTwoSteps";
import AuthBrandPanel from "src/layouts/full/shared/auth/AuthBrandPanel";
import FullLogo from "src/layouts/full/shared/logo/FullLogo";

const TwoSteps = () => {
  return (
    <div className="theme-light-scope flex h-screen w-full overflow-hidden bg-white">
      <AuthBrandPanel />
      <div className="flex w-full lg:w-1/2 items-center justify-center overflow-y-auto px-4 py-10">
        <div className="w-full md:w-[420px]">
          <div className="mx-auto mb-6 text-center">
            <FullLogo />
          </div>
          <p className="text-[#5a6a85] text-sm font-medium text-center">
            Enviamos um código de verificação para o seu celular. Digite o código abaixo.
          </p>
          <h6 className="text-sm font-bold my-4 text-center text-[#1c2536]">******1234</h6>
          <AuthTwoSteps />
          <div className="flex gap-2 text-base text-[#1c2536] font-medium mt-6 items-center justify-left">
            <p>Não recebeu o código?</p>
            <Link to={"/"} className="text-primary text-sm font-medium">
              Reenviar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoSteps;
