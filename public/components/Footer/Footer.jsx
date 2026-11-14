import logo from "../../images/logo.png";
import "./Footer.css";

const socialLinks = [
    { name: "Instagram", href: "https://www.instagram.com/healoneworld/" },
    { name: "Facebook", href: "https://www.facebook.com/heal1world/" },
    { name: "X", href: "https://x.com/healoneworld" }
];

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="site-footer__inner">
                <section className="site-footer__intro">
                    <h2>Stay in the loop</h2>
                    <p>
                        Visit our announcements for the latest news
                        and the calendar for class schedules.
                    </p>
                    <a href="/PublicAnnouncements">View announcements →</a>
                </section>

                <div className="site-footer__grid">
                    <div>
                        <a href="/home.html">
                            <img
                                className="site-footer__logo"
                                src={logo}
                                alt="Heal One World home"
                                loading="lazy"
                            />
                        </a>
                        <h2>Heal One World</h2>
                        <address>
                            3503 W Pico Blvd<br />
                            Los Angeles, CA
                        </address>
                        <p>A 501(c)(3) charity · EIN 26-4646731</p>
                    </div>

                    <nav aria-label="Footer: Visit">
                        <h2>Visit</h2>
                        <ul>
                            <li><a href="/classes/upcoming.html">Classes</a></li>
                            <li><a href="/calendar/Calendar.html">Calendar</a></li>
                            <li><a href="/home.html#programs">Programs</a></li>
                            <li><a href="/about">About us</a></li>
                            <li><a href="/rent.html">Rent our space</a></li>
                            <li><a href="/account">My account</a></li>
                        </ul>
                    </nav>

                    <nav aria-label="Footer: Get involved">
                        <h2>Get involved</h2>
                        <ul>
                            <li><a href="/volunteer.html">Volunteer</a></li>
                            <li><a href="/donate.html">Donate</a></li>
                            <li><a href="/PublicAnnouncements">Announcements</a></li>
                        </ul>
                    </nav>

                    <div>
                        <h2>Contact</h2>
                        <a href="mailto:skye@healoneworld.org">
                            skye@healoneworld.org
                        </a>

                        <nav aria-label="Social media">
                            <ul>
                                {socialLinks.map(({ name, href }) => (
                                    <li key={name}>
                                        <a href={href}>{name}</a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>

                <p className="site-footer__copyright">
                    &copy; {new Date().getFullYear()} Heal One World
                </p>
            </div>
        </footer>
    );
}