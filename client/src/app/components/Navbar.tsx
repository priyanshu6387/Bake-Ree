'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { HiOutlineShoppingCart, HiUser } from 'react-icons/hi';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/product' },
  { name: 'About', href: '/#about' },
  { name: 'Contact', href: '/#contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<number | null>(null);
  const closeTimeout = useRef<number | null>(null);

  const { cart } = useCartStore();
  const hasItems = cart.length > 0;

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [pathname]); // Re-check on route change

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY && currentY > 80) {
        setShow(false);
      } else {
        setShow(true);
      }
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        window.clearTimeout(hoverTimeout.current);
      }
      if (closeTimeout.current) {
        window.clearTimeout(closeTimeout.current);
      }
    };
  }, []);

  const handleMenuEnter = () => {
    if (hoverTimeout.current) {
      window.clearTimeout(hoverTimeout.current);
    }
    if (closeTimeout.current) {
      window.clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    hoverTimeout.current = window.setTimeout(() => {
      setIsMenuOpen(true);
    }, 500);
  };

  const handleMenuLeave = () => {
    if (hoverTimeout.current) {
      window.clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    if (closeTimeout.current) {
      window.clearTimeout(closeTimeout.current);
    }
    closeTimeout.current = window.setTimeout(() => {
      setIsMenuOpen(false);
    }, 200);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-transform duration-300 ${
        show ? 'translate-y-0' : '-translate-y-full'
      } flex justify-center bg-transparent py-1 pt-5`}
    >
      <div className="w-full max-w-7xl flex items-center justify-between bg-white rounded-full px-6 py-3 shadow-sm">
        {/* Logo + Brand Name */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="BakeRee Logo"
              width={40}
              height={40}
              className="rounded-full"
              priority
            />
          </Link>
          <span className="text-lg ml-2 font-semibold text-[#2a2927]">BakeRee</span>
        </div>

        {/* Navigation Links + Icons */}
        <div className="flex items-center space-x-6 text-sm font-medium text-[#2a2927]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors duration-200 hover:text-teal-600 ${
                pathname === link.href ? 'text-teal-600' : ''
              }`}
              scroll={true}
            >
              {link.name}
            </Link>
          ))}

          {/* 🛒 Cart Icon with Dot */}
          <Link href="/cart">
            <div
              id="cart-icon"
              className="relative cursor-pointer hover:text-teal-600 transition-all"
            >
              <HiOutlineShoppingCart className="text-2xl" />
              {hasItems && (
                <>
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </>
              )}
            </div>
          </Link>

          {/* Dashboard/Login Button */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div
                className="relative"
                ref={menuRef}
                onMouseEnter={handleMenuEnter}
                onMouseLeave={handleMenuLeave}
              >
                <button
                  aria-label="Open user menu"
                  className="h-10 w-10 rounded-full flex items-center justify-center text-[#2a2927] hover:text-[#2a2927] transition-all"
                >
                  <HiUser className="text-xl" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-[#e7e3dc] rounded-xl shadow-lg py-2">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-[#2a2927] hover:bg-[#f3f2ec]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-[#2a2927] hover:bg-[#f3f2ec]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  setIsLoggedIn(false);
                  setIsMenuOpen(false);
                  toast.success('Logged out successfully');
                  router.push('/');
                }}
                className="px-5 py-2 rounded-full text-[#2a2927] transition-all duration-200 font-medium bg-transparent border border-[#2a2927] hover:bg-[#2a2927] hover:text-white"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="px-5 py-2 rounded-full text-white transition-all duration-200 font-medium bg-[#2a2927] hover:bg-white hover:text-black hover:border hover:border-[#2a2927]">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
