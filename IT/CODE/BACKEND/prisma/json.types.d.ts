// Typed json fields for Prisma models (https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields)
// They allow to link a field of prisma model to a specific TypeScript type

declare global {
  namespace PrismaJson {
    type Coordinates = import("../src/types/index.js").Coordinates;
    type TripStatistics = import("../src/types/index.js").TripStatistics;
    type WeatherData = import("../src/types/index.js").WeatherData;
    type PathSegments = import("../src/types/index.js").PathSegments;
  }
}

export {};