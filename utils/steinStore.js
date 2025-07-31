import SteinStore from "stein-js-client";

// Create a singleton instance that can be reused throughout the application
export const steinStore = new SteinStore(
  "https://api.steinhq.com/v1/storages/688b7cadc088333365c51e2a"
);
