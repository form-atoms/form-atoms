// This file is for setting up Jest test environments
import '@testing-library/jest-dom/extend-expect'

afterEach(() => {
  jest.clearAllMocks()
})
