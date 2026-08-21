import { generateInstitutionalMetadata, InstitutionalPage } from "../institutional-pages";

export const generateMetadata = () => generateInstitutionalMetadata("about");
export default function AboutPage() { return <InstitutionalPage kind="about" />; }
