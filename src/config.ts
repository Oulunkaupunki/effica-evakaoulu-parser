// SPDX-FileCopyrightText: 2021 City of Oulu
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export const config = {
    cityVariant: process.env.CITY_VARIANT ?? "oulu",
    mockVtj: process.env.MOCK_VTJ?.toUpperCase() === "TRUE",
    port: process.env.PORT ?? 3000,
    isTimed: process.env.ISTIMED?.toUpperCase() === "TRUE",
    migrationSchema: process.env.MIGRATION_SCHEMA ?? "migration",
    extensionSchema: process.env.EXTENSION_SCHEMA ?? "ext",
    exclusionSuffix: "_exclusion",
    migrationDb: {
        host: process.env.PGHOST ?? "localhost",
        port: 5432,
        user: process.env.PGUSER ?? "postgres",
        password: process.env.PGPASSWORD ?? "postgres",
        database: process.env.PGDATABASE ?? "migration",
    },
    xmlParserOptions: {
        parseNodeValue: true,
        arrayMode: true,
        trimValues: true,
        parseTrueNumberOnly: true
    },
    csvParserOptions: {
        trim: true,
        delimiter: "|"
    },
    defaultPartitionBufferSize: 60000 //line buffer for partitioned file reading and data persisting
}