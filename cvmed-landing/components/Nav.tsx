import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <header className="nav">
      <div className="wrap">
        <Link className="brand" href="/">
          cvmed
        </Link>
        <ul>
          <li><a href="#product">Product</a></li>
          <li><a href="#clocks">Vigilance</a></li>
          <li><a href="#validation">Validation</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="cta">
          <ThemeToggle />
          <Link className="btn btn-ghost btn-sm" href="/login">
            Log in
          </Link>
          <a className="btn btn-primary btn-sm" href="#pricing">
            Book a demo
          </a>
        </div>
      </div>
    </header>
  );
}
