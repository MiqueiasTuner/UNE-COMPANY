import { FC, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import Sidebar from './vertical/sidebar/Sidebar';
import Header from './vertical/header/Header';

const FullLayout: FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('fikta_user');
    if (!user) {
      navigate('/auth/auth2/login');
    }
  }, [navigate]);

  return (
    <>
      <div className="flex w-full min-h-screen">
        <div className="page-wrapper flex w-full ">
          {/* Header/sidebar */}
          <div className="xl:block hidden">
            <Sidebar />
          </div>
          <div className="body-wrapper w-full bg-white dark:bg-dark">
            {/* Top Header  */}
            <Header />

            {/* Body Content  */}
            <div className={'container mx-auto px-6 py-30'}>
              <main className="grow">
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FullLayout;
