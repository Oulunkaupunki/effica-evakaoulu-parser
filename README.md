<!--
SPDX-FileCopyrightText: 2021 City of Oulu

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# effica-evakaoulu-parser
Tool for facilitating Effica -> eVaka data migrations

Developed for assisting in the migration of early education data from the old education system to eVakaOulu.

## Configuration
The parser provides some configuration options to make the tool usable in different environments:

| Environmental variable | Description                                                                                           | Default value |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ------------- |
| `MIGRATION_SCHEMA`     | The database schema used to create import and transformation tables                                   | `migration`   |
| `EXTENSION_SCHEMA`     | The database schema used to look for necessary database extensions (UUID generation, gist exclusions) | `ext`         |
| `ISTIMED`              | true/false for enabling per operation timing print outs to console                                    | `false`       |
| `PGHOST`               | The host of the migration database                                                                    | `localhost`   |
| `PGUSER`               | The user used in connecting to the migration database                                                 | `postgres`    |
| `PGDATABASE`           | The name of the database used for migration                                                           | `migration`   |
| `PGPASSWORD`           | The password used to connect to the migration database                                                | `postgres`    |

The necessary database objects for the default configuration on the accompanying docker db are created with the `init.sql` initialization script upon container composition. If using another database, configure parser to match its requirements.

This repository uses the evakaoulu repository as a submodule in order to apply evaka and eVakaOulu flyway migrations to create an authentic and up to date evaka database structure for integration testing the transfer of migrated elements. This stucture is automatically generated when using the accompanying docker compose configurations.
## Integration tests

Start the included docker compose for integration testing DB:
```
docker-compose -f docker-compose-it-db.yml up
```

Run integration tests:
```
npm run integration-test
```
## Importing data

1. Place XML files of table data or CSV files of external data under a directory called `xml` under the project root.
   - this is the directory the application will read by default, individual requests can be configured to target different locations relative to project root
   - all data tables used in XML or CSV data must be typed and described in `src/mapping/sourceMapping.ts`
   - by default the file name without extension is assumed to match the target table in the mapping
2. Prepare a Postgres DB and configure the connection under `migrationDb` in `src/config.ts`
3. Start the application with `npm start` 
4. Send an HTTP GET request to `http://localhost:3000/import`
   - following query parameters are recognized:
     - `path`: default: `/xml`,  directory path relative to project root to read for XML or CSV data
     - `returnAll`: default: false, can be set to true in order to receive all inserted data as JSON in the response (for testing with smaller imports)
     - `importTarget`: default: name of the read file without extension, can be used to give an explicit target table name for all files in the directory described by `path`, by default the table name is assumed to be the file name without extension (this parameter is useful for importing data split into several files with one request)

If the XML source files for the imported data are large (hundreds of megabytes), a partitioning import interface utilizing a buffered line reader can be used to alleviate memory consumption concerns. It functions slightly differently to the basic import.

1. Place the large XML files of table data under a directory called `xml` under the project root.
   - this is the directory the application will read by default, individual requests can be configured to target different locations relative to project root
   - note that only one table can be targeted by a single partitioned import request
     - if you have data for multiple tables, the files must not be in the same directory for reading
   - all data tables used in XML data must be typed and described in `src/mapping/sourceMapping.ts`
     - this description needs to match the element contents of the files exactly
   - the XML file content must be line separated uniformly -> one XML data element must take up the same number of lines for every element in the file
     - by default the element line length is assumed to be the number of columns in the source mapping + 2 (for beginning and end tags)

2. Prepare a Postgres DB and configure the connection under `migrationDb` in `src/config.ts`
3. Start the application with `npm start`
4. Send an HTTP GET request to `http://localhost:3000/import/partition`
   - following query parameters are required:
     - `importTarget`: must be used to give an explicit target table name for all files in the directory described by `path`
   - following query parameters are optional:
   - - `path`: default: `/xml`, directory path relative to project root to read for XML data
     - `bufferSize`: default 60000, the max number of lines in read buffer before persisting
       - default value can be changed in application configuration (`defaultPartitionBufferSize`)
       - in actuality the number of lines used is most likely smaller (divisible by the element line length)

## Transforming imported data

1. Send an HTTP GET request to `http://localhost:3000/transform/<element>` where element is the target of the transformation
   - transformations have per element prerequisites for pre-existing imported and/or transformed data
   - following query strings are recognized:
     - `returnAll`: default false, can be set to true in order to receive all inserted data as JSON in the response (for testing with smaller imports)

An HTTP GET request to `http://localhost:3000/transform` will attempt to transform all migrated data in dependency order
 - this corresponds to calling all transformation element targets sequentially as **each element is transformed in its own transaction**
 - transformations are done until one transformation in the chain fails
   - if all operations were successful, a 200 status code is returned with all transformation results 
   - if an operation failed, a 500 status code is returned with preceding successful transformation results as well as the error for the failed operation

## Transferring transformed data

1. Send an HTTP GET request to `http://localhost:3000/transfer/<element>` where element is the target to be transferred to eVaka
    - transfers require the source element data to be transformed and all element dependencies to have been transferred already 
    - following query strings are recognized:
        - `returnAll`: default false, can be set to true in order to receive all inserted data as JSON in the response (for testing with smaller imports)


## Maintenance operations

### Resetting evaka data

1. Send an HTTP GET request to `http://localhost:3000/maintenance/reset-evaka` in order to truncate migration target data from the configured eVaka database
    - this operation will remove eVaka data using cascading truncations starting from the `person` and `evaka_daycare` tables
    - this means **any interconnected data in the target eVaka database will be removed**
      - consequently, this should only be used to clear a migration performed on a "clean" eVaka environment as any pre-existing data would also be removed

### Running vacuum analyze for migrated eVaka tables

1. Send an HTTP GET request to `http://localhost:3000/maintenance/vacuum-analyze` in order to force vacuum and analyze operations for eVaka database tables affected by the migration
    - this operation will run `VACUUM (ANALYZE, VERBOSE)` for every migration target in the configured eVaka DB
