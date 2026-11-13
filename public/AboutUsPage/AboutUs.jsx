import "./AboutUs.css";

function AboutUs() {
    return(
        <div className="bg-[#EFF9F7] flex flex-col lg:flex-row">
            <main className="w-full lg:basis-2/3 px-6 sm:px-10 lg:pl-20 lg:pr-8">
            
                <h1 className="mt-7 mb-7 text-sm text-[#0075B5]">
                    ABOUT
                </h1>

                <h2 className="text-4xl text-[#062F49] sm:text-5xl mb-7">
                    Wellness without barriers.
                </h2>

                    <p className="lg:whitespace-nowrap">
                        Founded in 2009, Heal One World recognizes that our
                        greatest tools for healing lie within our own selves.
                    </p>

                <h2 className="text-3xl mt-7 mb-7">
                    Our mission
                </h2>
                <div className="max-w-150">
                    <p className="mb-7">
                        Heal One World helps people explore different paths toward wellness,
                        regardless of their income, background, or experience. We provide
                        free classes, supportive resources, and a welcoming community where
                        people can discover what works for them.
                    </p>
                    <p className="mb-7">
                        Our current classes include yoga, Reiki, and tai chi, with more
                        opportunities made possible by volunteers who share their knowledge,
                        experience, and skills. Classes are offered at little or no cost, and
                        no one is ever turned away because they cannot afford to participate.
                        Donate whatever you can, whether that is $1, $10, or simply your presence.
                    </p>
                    <p className="mb-7">
                        When professional care is needed, Heal One World also maintains a
                        database of affordable healthcare providers to help people find services
                        that fit their needs and circumstances.
                    </p>
                    <h2 className="text-3xl text-[#062F49] mt-7 mb-7">
                        Our Team
                    </h2>
                    <p>Heal One World is powered entirely by passionate volunteers who believe in 
                        making wellness more accessible. Wherever you are on your path toward 
                        well-being, you are welcome here.
                    </p>                        
                </div> 
                <div className="mt-6 mb-8 flex flex-col sm:flex-row gap-4 font-semibold">
                    <a href="/classes/upcoming.html" className="rounded-full bg-[#8AD324] px-5 py-2 text-center">
                        <p className="text-[#062F49]">
                            Find a class
                        </p>
                    </a>
                    <a href="/volunteer.html" className="rounded-full border-2 border-[#0075B5] text-[#0075B5] px-4 py-2 text-center">
                        Volunteer with us
                    </a>
                </div>
            </main>

            <div className="w-full lg:basis-1/3 my-8 lg:my-50 px-6 sm:px-10 lg:px-6 flex flex-col gap-4 items-center">
                <div className="max-w-full bg-[#FFFFFF] box-border border-1 border-gray-300 rounded-xl w-80 p-6">
                    <div className="ml-2">
                        <h2 className="text-xl mb-2">
                            Founder
                        </h2>
                        <h3 className="mb-2 font-semibold">
                            Sky Kelly, Executive Director
                        </h3>
                        <p>Placeholder for bio</p>
                    </div>
                </div>

                <div className="bg-[#FFFFFF] max-w-full box-border border-1 border-gray-300 rounded-xl align-center w-80 p-6">
                    <div className="ml-2 flex flex-col gap-2">
                        <h2 className="text-xl">
                            Programs
                        </h2>
                            <a href="https://awarenessfestival.org/" className="text-[#0075B5] font-semibold">Awareness Film Festival→</a>
                            <a href="https://mauiresilience.com/" className="text-[#0075B5] font-semibold">Maui Resilience Project→</a>
                            <a href="https://thejoydome.com/" className="text-[#0075B5] font-semibold">The Joy Dome→</a>
                        </div>    
                </div>

                <div className="bg-[#FFFFFF] box-border border-1 border-gray-300 rounded-xl max-w-full w-80 p-6">
                    <div className="ml-2 flex flex-col gap-2">
                        <h2 className="text-xl">
                            Visit
                        </h2>
                        <p className="text-[#29404A]">
                            3505 W Pico Blvd <br />
                            Los Angeles, CA 
                        </p>
                        <p className="text-[#5B6F78]">A 501(c)(3) charity  EIN 26-4646731</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AboutUs