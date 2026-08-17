import { Link } from "react-router";

import AuthRegister from "../authforms/AuthRegister";
import SocialButtons from "../authforms/SocialButtons";

import AuthBrandPanel from "src/layouts/full/shared/auth/AuthBrandPanel";
import FullLogo from "src/layouts/full/shared/logo/FullLogo";

const Register = () => {
  return (
    <div className="theme-light-scope flex h-screen w-full overflow-hidden bg-white">
      <AuthBrandPanel />
      <div className="flex w-full lg:w-1/2 items-center justify-center overflow-y-auto px-4 py-10">
        <div className="w-full md:w-[420px]">
          <div className="mx-auto mb-6 text-center">
            <FullLogo />
          </div>
          <SocialButtons title="or sign up with" />
          <AuthRegister />
          <div className="flex gap-2 text-base text-[#1c2536] font-medium mt-6 items-center justify-start">
            <p>Already have an Account?</p>
            <Link to={"/auth/auth2/login"} className="text-primary text-sm font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
