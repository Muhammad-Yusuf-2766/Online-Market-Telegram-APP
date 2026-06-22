/** Backup when leaving checkout (e.g. browser/TMA back) so phone/name are not lost. */
export const CHECKOUT_FORM_DRAFT_STORAGE_KEY = 'pb.checkout.formDraft.v1';

/** Shipped in router state between checkout ↔ address picker so drafts survive route changes. */
export type CheckoutFormDraft = {
  nationalDigits: string;
  firstName: string;
};

export type CheckoutAddressSelection = {
  addressId?: string;
  addressName: string;
  roadAddressName?: string | null;
  jibunAddressName?: string | null;
  buildingName?: string | null;
  zoneNo?: string | null;
  detailAddress: string;
  latitude?: number | null;
  longitude?: number | null;
};
