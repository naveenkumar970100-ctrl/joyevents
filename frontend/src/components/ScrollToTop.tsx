import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scroll to top on every route change (window + dashboard <main> panes). */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    document.querySelectorAll("main").forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
