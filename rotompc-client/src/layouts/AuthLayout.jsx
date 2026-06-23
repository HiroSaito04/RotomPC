import { Outlet, useLocation } from 'react-router-dom';

const AuthLayout = () => {
  const location = useLocation(); 

  const loginImg = "https://ik.imagekit.io/ytwzizvepv/RotomPC/Klefki-LogIn.png?updatedAt=1775751142800";
  const signupImg = "https://ik.imagekit.io/ytwzizvepv/RotomPC/RotomPC-SignUp.png?updatedAt=1775751231924";

  const isSignup = location.pathname.includes('signup');
  const currentImage = isSignup ? signupImg : loginImg;

  return (
    <section className="h-screen max-h-screen w-full bg-zinc-100 text-zinc-900 overflow-hidden">
      <div className="grid h-full w-full lg:grid-cols-[1fr_0.95fr]">

        {/* Left Half: Stretches perfectly to full height, handles artwork scaling smoothly */}
        {/* FIXED: Hidden on mobile layouts (h-0) and locked to max full container height on desktops */}
        <div className="relative hidden h-full w- overflow-hidden border-zinc-300 lg:block lg:border-r-2 bg-zinc-200">
          <img 
            src={currentImage}
            alt={isSignup ? "Sign Up Graphic" : "Klefki Login"}
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
            style={{ imageRendering: 'auto' }}
          />
          {/* Subtle Overlay to keep it "Techy" */}
          <div className="absolute inset-0 bg-zinc-900/5 pointer-events-none" />
        </div>

        {/* Right Half: Takes care of long forms by enabling internal vertical scrolling independently */}
        <main className="flex h-full w-full items-center bg-zinc-50 px-6 py-10 sm:px-10 lg:px-16 overflow-y-auto">
          <div className="mx-auto w-full max-w-md my-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </section>
  );
};

export default AuthLayout;