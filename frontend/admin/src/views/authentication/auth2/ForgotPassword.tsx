import { Link } from 'react-router';
import AuthForgotPassword from '../authforms/AuthForgotPassword';
import AuthBrandPanel from 'src/layouts/full/shared/auth/AuthBrandPanel';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';
import { Button } from 'src/components/ui/button';

const ForgotPassword = () => {
  return (
    <div className="theme-light-scope flex h-screen w-full overflow-hidden bg-white">
      <AuthBrandPanel />
      <div className="flex w-full lg:w-1/2 items-center justify-center overflow-y-auto px-4 py-10">
        <div className="w-full md:w-[420px]">
          <div className="mx-auto mb-6 text-center">
            <FullLogo />
          </div>
          <p className="text-[#5a6a85] text-sm text-center my-4">
            Informe o e-mail associado à sua conta e enviaremos um link para redefinir sua senha.
          </p>
          <AuthForgotPassword />
          <Button variant={'lightprimary'} className="w-full mt-3" asChild>
            <Link to={'/'}>Voltar ao Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
