import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrolltoTop';

const Layout = () => {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <ScrollToTop />
      <NavBar />
      <main className="pb-16 pt-20">
        <Outlet />
      </main>
      <Footer/>
    </div>
  );
};

export default Layout;