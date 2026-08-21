import { generateInstitutionalMetadata, InstitutionalPage } from "../institutional-pages";

export const generateMetadata = () => generateInstitutionalMetadata("terms");
export default function TermsPage() { return <InstitutionalPage kind="terms" />; }
