import { concept } from "./factory";

const family = ["accounting"] as const;

export const accountingConcepts = [
  concept({ id: "accounting", category: "skill", es: "Contabilidad", en: "Accounting", families: [...family], esAliases: ["gestión contable"], enAliases: ["accounting management"] }),
  concept({ id: "bookkeeping", category: "responsibility", es: "Registro contable", en: "Bookkeeping", families: [...family], esAliases: ["asientos contables", "registros contables", "asientos de diario", "diario contable"], enAliases: ["ledger entries", "accounting records", "journal entries", "journal entry", "journal"] }),
  concept({ id: "gaap", category: "methodology", es: "Principios contables generalmente aceptados", en: "Generally Accepted Accounting Principles", families: [...family], esAliases: [["PCGA", "abbreviation"], ["GAAP", "abbreviation"]], enAliases: [["GAAP", "abbreviation"], "generally accepted accounting principles"] }),
  concept({ id: "financial-reporting", category: "responsibility", es: "Informes financieros", en: "Financial reporting", families: [...family], esAliases: ["reportes financieros", "estados financieros"], enAliases: ["financial statements"] }),
  concept({ id: "accounts-payable", category: "responsibility", es: "Cuentas por pagar", en: "Accounts payable", families: [...family], esAliases: [["CxP", "abbreviation"]], enAliases: [["AP", "abbreviation"]] }),
  concept({ id: "accounts-receivable", category: "responsibility", es: "Cuentas por cobrar", en: "Accounts receivable", families: [...family], esAliases: [["CxC", "abbreviation"]], enAliases: [["AR", "abbreviation"]] }),
  concept({ id: "tax-compliance", category: "skill", es: "Cumplimiento tributario", en: "Tax compliance", families: [...family], esAliases: ["obligaciones fiscales", "declaración de impuestos"], enAliases: ["tax obligations", "tax filing"] }),
  concept({ id: "bank-reconciliation", category: "responsibility", es: "Conciliación bancaria", en: "Bank reconciliation", families: [...family], esAliases: ["conciliaciones bancarias"], enAliases: ["bank reconciliations"] }),
  concept({ id: "account-reconciliation", category: "responsibility", es: "Conciliación de cuentas", en: "Account reconciliation", families: [...family], esAliases: ["conciliaciones de cuentas", "conciliación de balance", "conciliación del balance general"], enAliases: ["account reconciliations", "balance sheet reconciliation", "balance sheet reconciliations"], relations: [["bank-reconciliation", "related", 0.75]] }),
  concept({ id: "payroll-accounting", category: "responsibility", es: "Contabilidad de nómina", en: "Payroll accounting", families: [...family], esAliases: ["análisis de nómina", "registro de nómina"], enAliases: ["payroll analysis", "payroll entries", "payroll reconciliation"] }),
] as const;
