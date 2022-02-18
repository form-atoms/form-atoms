// This file is for setting up Jest test environments
import "@testing-library/jest-dom/extend-expect";

jest.useFakeTimers();

afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
