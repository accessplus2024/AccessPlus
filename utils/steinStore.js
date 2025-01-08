import SteinStore from "stein-js-client";

// Create a singleton instance that can be reused throughout the application
export const steinStore = new SteinStore(
  "https://api.steinhq.com/v1/storages/67741cf2c088333365603089"
);
