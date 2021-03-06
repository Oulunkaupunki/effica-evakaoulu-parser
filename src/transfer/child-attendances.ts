// SPDX-FileCopyrightText: 2021 City of Oulu
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import migrationDb from "../db/db";
import {
    baseQueryParameters,
    runQuery,
    runQueryFile,
    selectFromTable,
} from "../util/queryTools";

export const transferChildAttendances = async (returnAll: boolean = false) => {
    return await migrationDb.tx(async (t) => {
        await runQueryFile("transfer-child-attendance.sql", t, {
            ...baseQueryParameters,
        });
        return await runQuery(
            selectFromTable("child_attendance", "", returnAll, [
                "arrived",
                "departed",
            ]),
            t,
            true
        );
    });
};
