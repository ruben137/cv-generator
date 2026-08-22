# Data sources

CV Simple's job-match dictionary is intentionally curated. External taxonomies generate review candidates; they are never copied wholesale into the browser bundle or treated as automatic equivalences.

## ESCO

The first sourced expansion uses concepts from the European Skills, Competences, Qualifications and Occupations classification (ESCO), version 1.2.0.

- Publisher: European Commission, Directorate-General for Employment, Social Affairs and Inclusion
- Dataset and downloads: https://esco.ec.europa.eu/en/use-esco/download
- API: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api/esco-web-service-api
- Concept identifiers: each sourced concept preserves its original `data.europa.eu/esco/skill` URI in the code
- Changes: labels and alternative terms are selectively adapted into CV Simple's bilingual concept model; unrelated or ambiguous candidates are excluded

The synchronization script writes candidates to `data/job-match/esco-candidates.json`. This generated review file is not imported by the application at runtime.

## Project-authored data

Concepts without an external source were written and reviewed specifically for CV Simple. They remain subject to the repository's license.
