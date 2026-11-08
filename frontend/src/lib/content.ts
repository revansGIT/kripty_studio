export const works = Array.from({ length: 14 }, (_, i) => ({
  src: `/images/work-${i + 1}.png`,
  alt: `Kripty Studio iGaming platform UI design — case study ${i + 1}`,
}));

export const services = [
  {
    title: "UI/UX Design",
    description: "Creating intuitive and engaging digital experiences users love.",
    icon: { src: "/images/icon-pen-tool.svg", width: 50, height: 50, left: 34.5, top: 35 },
  },
  {
    title: "Frontend Development",
    description: "Building responsive, fast, and seamless web experiences.",
    icon: { src: "/images/icon-frontend.svg", width: 62, height: 38, left: 30.83, top: 41 },
  },
  {
    title: "Animation",
    description: "Bringing ideas to life through engaging motion and visuals.",
    icon: { src: "/images/icon-animation.svg", width: 45.8, height: 46.2, left: 37.75, top: 36.9 },
  },
] as const;

export const testimonials = [
  {
    name: "Snoppy",
    role: "Founder of Sports Degens",
    avatar: "/images/avatar-snoppy.png",
    quote:
      "Kripty Studio understood our vision from day one and turned it into a product our community loves. Fast, reliable and genuinely creative.",
  },
  {
    name: "Tommy",
    role: "CEO of KrushGG",
    avatar: "/images/avatar-tommy.png",
    quote:
      "Great experience working with Kripty Studio. The team paid close attention to the details and created a design that felt both modern and easy to use. They were open to suggestions, understood our requirements, and made the whole collaboration feel straightforward. I’d be happy to work with them again.",
  },
  {
    name: "High Stakes Hugs",
    role: "Co-founder of GETDGN",
    avatar: "/images/avatar-hugs.png",
    quote:
      "The team did a great job bringing our ideas to life. They took the time to understand our brand and delivered visuals that felt consistent, polished, and well thought out. What stood out most was their attention to detail and professional approach throughout the project. Overall, a very positive experience.",
  },
] as const;

export const faqs = [
  {
    q: "What services does Kripty Studio offer?",
    a: "We offer end-to-end creative services, including UI/UX design, website and app development, and animation to help brands bring their digital ideas to life.",
  },
  {
    q: "Can you handle a project from design to development?",
    a: "Yes. Our team covers the full journey — research, UI/UX design, frontend development and motion — so you get one consistent partner from concept to launch.",
  },
  {
    q: "How much does a project cost?",
    a: "Every project is scoped individually. Most engagements fall between $1K and $50K depending on complexity, timeline and deliverables. Share your brief and we’ll send a tailored quote.",
  },
  {
    q: "How long does a project take to complete?",
    a: "Landing pages usually take 2–3 weeks, while full platforms such as casinos or sportsbooks take 6–12 weeks. We agree on milestones before we start.",
  },
  {
    q: "What is your process for starting a new project?",
    a: "We start with a discovery call, then define scope, timeline and budget. After a kickoff we move through wireframes, visual design, development and handoff.",
  },
  {
    q: "How many revisions do you provide?",
    a: "Each design phase includes two rounds of revisions. Additional rounds can be added whenever you need them.",
  },
  {
    q: "How do payments work?",
    a: "We typically work with a 50% upfront payment and the remainder on delivery. Larger projects can be split into milestone-based payments. We accept bank transfer and crypto.",
  },
  {
    q: "What do you need from us to get started?",
    a: "A short brief with your goals, target audience, references you like and any existing brand assets. We’ll handle the rest.",
  },
] as const;

export const budgets = [
  { value: "<1k", label: "Less than $1K" },
  { value: "1k-5k", label: "$1K-$5K" },
  { value: "5k-10k", label: "$5K-$10K" },
  { value: "10k-20k", label: "$10K-$20K" },
  { value: "20k-50k", label: "$20K-$50K" },
  { value: ">50k", label: "More than $50K" },
] as const;
