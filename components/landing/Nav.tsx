import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import {
  Show,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/nextjs";

export default function Nav() {
  return (
    <header className="nav">
      <div className="wrap">
        <Link className="brand" href="/">
          cvmed
        </Link>
        <ul>
          <li>
            <a href="#product">Product</a>
          </li>
          <li>
            <a href="#clocks">Vigilance</a>
          </li>
          <li>
            <a href="#validation">Validation</a>
          </li>
          <li>
            <a href="#pricing">Pricing</a>
          </li>
        </ul>
        <div className="cta">
          <ThemeToggle />
          <Show when="signed-out">
            <Link className="btn btn-ghost btn-sm" href="/sign-in">
              Log in
            </Link>
            <a className="btn btn-primary btn-sm" href="#pricing">
              Book a demo
            </a>
          </Show>
          <Show when="signed-in">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/"
              afterSelectOrganizationUrl="/"
            />
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
