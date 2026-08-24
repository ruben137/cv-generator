import { APPLICATION_STORE_NAME, runStoreRequest } from "./local-database";
import { createJobApplication, normalizeJobApplication, type CreateJobApplicationInput, type JobApplication } from "./job-application";

export async function listJobApplications(): Promise<JobApplication[]> {
  const items = await runStoreRequest<unknown[]>(APPLICATION_STORE_NAME, "readonly", (store) => store.getAll());
  return items.map(normalizeJobApplication).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getJobApplication(id: string): Promise<JobApplication | undefined> {
  const item = await runStoreRequest<unknown>(APPLICATION_STORE_NAME, "readonly", (store) => store.get(id));
  return item ? normalizeJobApplication(item) : undefined;
}

export function putJobApplication(application: JobApplication): Promise<IDBValidKey> {
  return runStoreRequest<IDBValidKey>(APPLICATION_STORE_NAME, "readwrite", (store) => store.put(normalizeJobApplication(application)));
}

export function deleteJobApplication(id: string): Promise<undefined> {
  return runStoreRequest<undefined>(APPLICATION_STORE_NAME, "readwrite", (store) => store.delete(id));
}

export async function addJobApplication(input: CreateJobApplicationInput): Promise<JobApplication> {
  const application = createJobApplication(input);
  await putJobApplication(application);
  return application;
}
