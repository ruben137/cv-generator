import { generateInstitutionalMetadata, InstitutionalPage } from "../institutional-pages";

export const generateMetadata = () => generateInstitutionalMetadata("privacy");
export default function PrivacyPage() { return <InstitutionalPage kind="privacy" />; }
