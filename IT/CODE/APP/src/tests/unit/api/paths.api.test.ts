import {
    createPathApi,
    getMyPathsApi,
    searchPathsApi,
    snapPathApi,
    deletePathApi,
    changePathVisibilityApi,
} from "@/api/paths"
import { api } from "@/api/client"

jest.mock("@/api/client", () => ({
    api: {
        post: jest.fn(),
        get: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    },
}))

describe("api/paths", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("createPathApi posts payload", async () => {
        ; (api.post as jest.Mock).mockResolvedValueOnce({ data: {} })

        await createPathApi({
            visibility: true,
            creationMode: "manual",
            title: "My path",
            description: "desc",
            pathSegments: [
                { start: { lat: 1, lng: 2 }, end: { lat: 3, lng: 4 } },
            ],
        })

        expect(api.post).toHaveBeenCalledWith("/paths", {
            visibility: true,
            creationMode: "manual",
            title: "My path",
            description: "desc",
            pathSegments: [{ start: { lat: 1, lng: 2 }, end: { lat: 3, lng: 4 } }],
        })
    })

    test("getMyPathsApi maps response list", async () => {
        ; (api.get as jest.Mock).mockResolvedValueOnce({
            data: {
                data: {
                    count: 1,
                    paths: [{ pathId: "p1", title: "Title", origin: { lat: 1, lng: 2 }, destination: { lat: 3, lng: 4 } }],
                },
            },
        })

        const out = await getMyPathsApi()

        expect(api.get).toHaveBeenCalledWith("/paths", { params: { owner: "me" } })
        expect(out[0].pathId).toBe("p1")
    })

    test("searchPathsApi passes query params", async () => {
        ; (api.get as jest.Mock).mockResolvedValueOnce({
            data: { data: { count: 0, paths: [] } },
        })

        await searchPathsApi({ origin: "A", destination: "B" })

        expect(api.get).toHaveBeenCalledWith("/paths/search", { params: { origin: "A", destination: "B" } })
    })

    test("snapPathApi returns coordinates list", async () => {
        ; (api.post as jest.Mock).mockResolvedValueOnce({
            data: {
                data: {
                    coordinates: [{ lat: 1, lng: 2 }],
                },
            },
        })

        const out = await snapPathApi({ coordinates: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }] })

        expect(api.post).toHaveBeenCalledWith("/paths/snap", {
            coordinates: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }],
        })
        expect(out).toEqual([{ lat: 1, lng: 2 }])
    })

    test("deletePathApi sends delete request", async () => {
        ; (api.delete as jest.Mock).mockResolvedValueOnce({ data: {} })

        await deletePathApi("p1")

        expect(api.delete).toHaveBeenCalledWith("/paths/p1")
    })

    test("changePathVisibilityApi sends patch request", async () => {
        ; (api.patch as jest.Mock).mockResolvedValueOnce({ data: {} })

        await changePathVisibilityApi("p1", true)

        expect(api.patch).toHaveBeenCalledWith("/paths/p1/visibility", { visibility: true })
    })
})
