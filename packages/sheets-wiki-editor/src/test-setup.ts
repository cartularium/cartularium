import "@testing-library/jest-dom/vitest"

// vitest's jsdom environment provides a localStorage object, but it lacks the
// standard API methods (getItem, setItem, removeItem, etc.). Define them here.
const store: Record<string, string> = {}
const mockStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    for (const key in store) {
      delete store[key]
    }
  },
  length: 0,
  key: (index: number) => Object.keys(store)[index] || null,
}

Object.defineProperty(window, "localStorage", {
  value: mockStorage,
  writable: true,
})
