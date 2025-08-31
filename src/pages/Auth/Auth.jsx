import React, { useState } from "react";
import styles from "./Auth.module.css";
import { FaGoogle, FaFacebookF, FaGithub } from "react-icons/fa";
import { FaXTwitter, FaInstagram } from "react-icons/fa6";
import Footer from "../../components/Footer/Footer";

import { auth, googleProvider } from "../../lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import logo from "../../assets/Auralia-logo.png";
import { useNavigate, Link } from "react-router-dom";
import authBg from "../../assets/MovieAuthPoster.jpg";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Google login
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");   // route that renders App.jsx
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  // Email login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // App is routed at "/"
    } catch (error) {
      console.error("Email Sign-In Error:", error);
    }
  };

  return (
    <div className={styles.authPage}>
      {/* Toolbar (simple, no controls) */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <img src={logo} alt="Auralia" className={styles.toolbarLogo} />
          <h1 className={styles.toolbarTitle}>Movie Explorer</h1>
          <Link to="/auth" className={styles.signBtnTop}>Sign In</Link>
        </div>
      </header>

      <div className={styles.authCard}>
        {/* -------- Left Panel -------- */}
        <div
          className={styles.leftPanel}
          style={{
            backgroundImage:
              `linear-gradient(to bottom right, rgba(0,0,0,.25), rgba(0,0,0,.15)), url(${authBg})`
          }}
        >
          <div className={styles.overlayText}>
            <h2>Escape into cinema.</h2>
            <p>
              Discover films you’ll love. Sign in for watch-history, smart filters,
              and personalized picks.
            </p>
          </div>
          <div className={styles.leftSocials}>
            <FaXTwitter />
            <FaFacebookF />
            <FaInstagram />
          </div>
        </div>

        {/* -------- Right Panel -------- */}
        <div className={styles.rightPanel}>
          <img className={styles.authLogo} src={logo} alt="Auralia Movies" />
          <h2 className={styles.authTitle}>
            Auralia <span>Movies</span>
          </h2>

          {/* Social login buttons */}
          <div className={styles.socialRow}>
            <button className={styles.socialIcon} onClick={handleGoogleLogin}>
              <FaGoogle />
            </button>
            <button className={styles.socialIcon}>
              <FaGithub />
            </button>
            <button className={styles.socialIcon}>
              <FaFacebookF />
            </button>
            <button className={styles.socialIcon}>
              <FaXTwitter />
            </button>
          </div>

          <p className={styles.divider}>or use your email account</p>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <a href="#forgot" className={styles.forgotLink}>
              Forgot your password?
            </a>
            <button type="submit" className={styles.signInBtn}>
              SIGN IN
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Auth;
