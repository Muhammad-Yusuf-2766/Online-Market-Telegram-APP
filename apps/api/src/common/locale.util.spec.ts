import { isAppLocale, normalizeUserLocale } from "./locale.util";

describe("locale.util", () => {
  describe("normalizeUserLocale", () => {
    it("maps Russian language codes to ru", () => {
      expect(normalizeUserLocale("ru")).toBe("ru");
      expect(normalizeUserLocale("ru-RU")).toBe("ru");
    });

    it("maps Uzbek language codes to uz", () => {
      expect(normalizeUserLocale("uz")).toBe("uz");
      expect(normalizeUserLocale("uz-UZ")).toBe("uz");
    });

    it("defaults unknown codes to uz", () => {
      expect(normalizeUserLocale("en")).toBe("uz");
      expect(normalizeUserLocale(null)).toBe("uz");
      expect(normalizeUserLocale(undefined)).toBe("uz");
    });
  });

  describe("isAppLocale", () => {
    it("returns true for ru and uz", () => {
      expect(isAppLocale("ru")).toBe(true);
      expect(isAppLocale("uz")).toBe(true);
    });

    it("returns false for other strings", () => {
      expect(isAppLocale("en")).toBe(false);
    });
  });
});
