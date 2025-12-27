export { 
  documentControllerCreateDocument,
  documentControllerDeleteDocument,
  documentControllerGetDocument 
} from "@/gen/client";

// Re-export as documentApi for convenience
export const documentApi = {
  create: documentControllerCreateDocument,
  delete: documentControllerDeleteDocument,
  get: documentControllerGetDocument,
};