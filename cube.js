// Cube.js configuration options: https://cube.dev/docs/config

// NOTE: third-party dependencies and the use of require(...) are disabled for
// CubeCloud users by default.  Please contact support if you need them
// enabled for your account.  You are still allowed to require
// @cubejs-backend/*-driver packages.

// TODO: Igor will create second database
const PostgresDriver = require('@cubejs-backend/postgres-driver');

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.CUBEJS_DB_HOST,
  port: process.env.CUBEJS_DB_PORT,
  user: process.env.CUBEJS_DB_USER,
  password: process.env.CUBEJS_DB_PASS,
  database: process.env.CUBEJS_DB_NAME,
});

const statusesQuery = `
  SELECT DISTINCT status
  FROM public.orders
`;

exports.fetchStatuses = async () => {
  const client = await pool.connect();
  const result = await client.query(statusesQuery);
  client.release();

  return result.rows.map((row) => row.status);
};

module.exports = {
    queryRewrite: (query, { securityContext }) => {
      // Ensure `securityContext` has an `id` property
      if (!securityContext.supplier_id) {
        throw new Error('No Supplier ID found in Security Context!');
      }

      query.filters.push({
        member: "Suppliers.id", // or id
        operator: "equals",
        values: [securityContext.supplier_id]
      });

      return query;
    },

    contextToAppId: ({ securityContext }) => `CUBEJS_APP_${securityContext.supplier_id}`,

    driverFactory: ({ securityContext }) => {
      if (!securityContext.supplier_id) {
        throw new Error('No Supplier ID found in Security Context!');
      }

      if (securityContext.supplier_id === 1) {
        // TODO: Igor will provide a real database here
        return new PostgresDriver({
          database: 'ecom',
          host: 'demo-db-recipes.cube.dev',
          user: 'cube',
          password: '12345',
          port: '5432',
        });
      } else {
        return new PostgresDriver({
          database: 'ecom',
          host: 'demo-db.cube.dev',
          user: 'cube',
          password: '12345',
          port: '5432',
        });
      }
    },

    // scheduledRefreshContexts should return an array of `securityContext`s
    // If possile to show schema 
    // Static example
    // scheduledRefreshContexts: async () => [
    //   {
    //     securityContext: {
    //       supplier_id: 1,
    //     },
    //   },
    //   {
    //     securityContext: {
    //       supplier_id: 2,
    //     },
    //   },
    // ],
};
