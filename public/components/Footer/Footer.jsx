import "./AboutUs.css";
import{ FaInstagram, FaFacebook} from "react-icons/fa";
import{ FaXTwitter } from "react-icons/fa6";

const socialMediaLinks = [
    {
        name: "Heal One World on X",
        url: "https://x.com/healoneworld",
        Icon: FaXTwitter,
    },
    {
        name: "Heal One World on Facebook",
        url: "https://www.facebook.com/heal1world/",
        Icon: FaFacebook,
    },
    {
        name: "Heal One World on Instagram",
        url: "https://www.instagram.com/healoneworld/",
        Icon: FaInstagram,
    }
];

function SocialMediaLinks() {
    return(
        <div className="flex items-center gap-4">
            {socialMediaLinks.map(({ name, url, Icon}) => (
                <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="text-white transition-colors hover:text-[#8FD3D9]
                           focus-visible:outline-2 focus-visible:outline-offset-4
                           focus-visible:outline-white">
                <Icon size={24} aria-hidden="true" />
                </a>
            ))}
        </div>
    )
}

function Footer(){
    return(
        
        <footer className="relative bg-[#062F49] p-6 pt-16 pb-20 sm:p-10 lg:p-15">
            <div className="pointer-events-none absolute inset-x-0 bottom-full h-20 overflow-hidden">
                <div className="absolute left-1/2 top-0 h-[400px] w-[140%] -translate-x-1/2 rounded-[50%] bg-[#062F49]" />
            </div>
            <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="container mx-auto flex flex-col text-white gap-2">
                        <h2 className="text-4xl font-serif">
                            Stay in the loop
                        </h2>
                        <p>
                            Subscribe for the most up-to-date info and class schedules.
                        </p>                 
                </div>
                <form className="flex w-full flex-col sm:flex-row lg:max-w-md gap-2">
                    <input 
                        type="email" 
                        name="email"
                        placeholder="you@example.com" 
                        required
                        className="border-gray-400 outline outline-gray-400 text-gray-400 rounded-full px-5 py-2">
                    </input>
                    <button className="shrink-0 rounded-full bg-[#8AD324] px-4 py-2 font-semibold">
                        Subscribe
                    </button>            
                </form>
 
            </section>
                <hr className="mt-8 text-white/15"></hr>   
            <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mt-10">
                <div className="flex flex-col gap-2">
                    <img 
                        src="/howl.png" 
                        className="h-14 w-auto self-start object-contain" 
                        alt="Heal One World" />
                    <h2 className="text-white text-xl">
                        Heal One World
                    </h2>
                    <p className="text-[#8FD3D9]">
                        3503 W Pico Blvd<br />
                        Los Angeles, CA
                    </p>
                    <p className="text-gray-400">
                        A 501(c)(3) charity  EIN 26-4646731
                    </p>
                </div>  

                <div className="flex flex-col gap-2">
                    <h3 className="text-white">
                        Visit 
                    </h3>
                    <div className="flex flex-col gap-2 text-[#8FD3D9]">             
                        <p>Classes</p>
                        <p>Programs</p>
                        <p>Rent Our Space</p>
                        <p>Sign In</p>
                    </div>
                </div> 

                <div className="flex flex-col gap-2">
                    <h3 className="text-white">
                        Get Involved
                    </h3>
                    <div className="flex flex-col gap-2 text-[#8FD3D9]">
                        <p>Volunteer</p>
                        <p>Donate</p>
                        <p>Newsletter</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <h3 className="text-white">
                        Contact
                    </h3>
                    <div className="flex flex-col gap-2 text-[#8FD3D9]">
                        <p>Contact Us</p>
                        <p>skye@healoneworld.org</p>
                    </div>
                </div>
            </section> 
            <div className="mt-8">
                <SocialMediaLinks />
            </div>
            <section className="container mx-auto py-8 flex flex-col sm:justify-between sm:flex-row text-gray-500 text-sm gap-3">
                <p>&copy; 2026 Heal One World</p>
                <p>Terms &middot; Privacy policy</p>
            </section>       
         </footer>
    )
}

export default Footer