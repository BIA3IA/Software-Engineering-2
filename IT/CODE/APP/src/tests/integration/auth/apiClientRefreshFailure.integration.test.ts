const mockApiInstance: any = jest.fn()
let responseErrorHandler: ((error: any) => Promise<any>) | undefined

mockApiInstance.interceptors = {
  request: { use: jest.fn() },
  response: {
    use: jest.fn((_onSuccess: any, onError: any) => {
      responseErrorHandler = onError
    }),
  },
}

const mockRefreshAccessToken = jest.fn()

jest.mock("axios", () => ({
  create: jest.fn(() => mockApiInstance),
}))

jest.mock("@/api/tokenManager", () => ({
  refreshAccessToken: () => mockRefreshAccessToken(),
}))

jest.mock("@/auth/authSession", () => ({
  getAccessToken: () => null,
}))

describe("api client refresh failure flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    responseErrorHandler = undefined
  })

  test("401 triggers refresh attempt and rejects when refresh fails", async () => {
    mockRefreshAccessToken.mockResolvedValueOnce(null)

    jest.isolateModules(() => {
      require("@/api/client")
    })

    expect(responseErrorHandler).toBeDefined()

    const error: any = { response: { status: 401 }, config: {} }
    const out = await responseErrorHandler!(error).catch((err) => err)

    expect(mockRefreshAccessToken).toHaveBeenCalled()
    expect(out).toBe(error)
    expect(error.config._retry).toBe(true)
    expect(mockApiInstance).not.toHaveBeenCalled()
  })

  test("401 triggers refresh and retries request when refresh succeeds", async () => {
    mockRefreshAccessToken.mockResolvedValueOnce("new-token")
    mockApiInstance.mockResolvedValueOnce("ok")

    jest.isolateModules(() => {
      require("@/api/client")
    })

    expect(responseErrorHandler).toBeDefined()

    const error: any = { response: { status: 401 }, config: { headers: {} } }
    const out = await responseErrorHandler!(error)

    expect(mockRefreshAccessToken).toHaveBeenCalled()
    expect(error.config._retry).toBe(true)
    expect(error.config.headers.Authorization).toBe("Bearer new-token")
    expect(mockApiInstance).toHaveBeenCalledWith(error.config)
    expect(out).toBe("ok")
  })
})
