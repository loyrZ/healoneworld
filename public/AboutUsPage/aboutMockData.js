/* mock data to be replaced at a later time with real data */
import photo from "../images/about/sample-instructor.svg";

export const SAMPLE_NOTICE = "Sample Profiles";

export const OFFERINGS = [
    {
        id: "1",
        name: "Soulful Yoga & Mindful Healing",
        description: `A gentle, heart-centered yoga class roote in traditional Hatha and mindfulness practices.
                    Each session will incorporate breathwork, simple asanas, and guided meditation to support
                    emotional balance, and inner calm. Suitable for all levels, especially those seeking stress
                    relief, grounding, or recovery support.`,
        image: null,
        instructorIds: ["123"], 
    },
    {
        id: "2",
        name: "Yoga for Better Sleep",
        description: `Join us on Wednesday evenings to prepar for a betternight's sleep. Relax your muscles,
                    calm your brain, and make space for breathing to begin the relaxation response. Beginning
                    with breath-based mindfulmovement, we will end our time with supported (bring 2 pillows or 
                    yogablankets) restorative poses... that will welcome you to a better night's sleep.`,
        image: null,
        instructorIds: ["456"], 
    },
    {
        id: "",
        name: "",
        description: ``,
        image: null,
        instructorIds: [""], 
    },
    {
        id: "",
        name: "",
        description: ``,
        image: null,
        instructorIds: [""], 
    },

];
export const INSTRUCTORS = [
    {
        id: "789",
        name: "Bob Sample",
        bio: "This is a placeholder biography for the instructor.",
        photo: photo,
        photoAlt: "",
        isSample: true,
    },
     {
        id: "456",
        name: "Patrick Sample",
        bio: "This is a placeholder biography for the instructor.",
        photo: photo,
        photoAlt: "",
        isSample: true,
    },
     {
        id: "123",
        name: "Barbara Sample",
        bio: "This is a placeholder biography for the instructor.",
        photo: null,
        photoAlt: "",
        isSample: true,
    },
];


