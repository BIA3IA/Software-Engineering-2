process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.OSRM_BASE_URL = 'https://router.project-osrm.org'; // http://127.0.0.1:5001

import { afterAll } from "@jest/globals";

afterAll(async () => {
    try {
        const { closeRedis } = await import("./src/utils/cache");
        await closeRedis();
    } catch {
        // Ignore teardown errors to avoid masking test failures.
    }
});
