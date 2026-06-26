export type CreateApartmentStepKey = "details" | "tags" | "photos";

export type CreateApartmentStep = {
  key: CreateApartmentStepKey;
  labelKey: string;
};

export const CREATE_APARTMENT_STEPS: CreateApartmentStep[] = [
  {
    key: "details",
    labelKey: "createApartment.steps.details",
  },
  {
    key: "tags",
    labelKey: "createApartment.steps.tags",
  },
  {
    key: "photos",
    labelKey: "createApartment.steps.photos",
  },
];