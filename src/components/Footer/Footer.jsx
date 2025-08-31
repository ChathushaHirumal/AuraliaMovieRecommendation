import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footerFlex">
        <div className="footerLeft">
          <span>
            Contact us:
            <a href="mailto:info@auralia.app"> info@auralia.app</a> | +94 123 456 789
          </span>
          <br />
          <span>© 2025 Auralia — Movie Recommendation</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
