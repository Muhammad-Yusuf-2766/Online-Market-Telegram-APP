/** Backup when leaving checkout (e.g. browser/TMA back) so phone/name are not lost. */
export const CHECKOUT_FORM_DRAFT_STORAGE_KEY = 'pb.checkout.formDraft.v1';

/** Shipped in router state between checkout ↔ address picker so drafts survive route changes. */
export type CheckoutFormDraft = {
  nationalDigits: string;
  firstName: string;
  useCoins: boolean;
};

export type CheckoutAddressSelection = {
  lat: number;
  lng: number;
  label: string;
};
