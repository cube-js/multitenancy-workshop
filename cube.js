// Cube.js configuration options: https://cube.dev/docs/config

// Default data source credentials.
// See Settings -> Env vars to review or update them
const host     = process.env.CUBEJS_DB_HOST;
const port     = process.env.CUBEJS_DB_PORT;
const database = process.env.CUBEJS_DB_NAME;
const user     = process.env.CUBEJS_DB_USER;
const password = process.env.CUBEJS_DB_PASS;

// NOTE: third-party dependencies and the use of require(...) are disabled for
// CubeCloud users by default.  Please contact support if you need them
// enabled for your account.  You are still allowed to require
// @cubejs-backend/*-driver packages.

const PostgresDriver = require('@cubejs-backend/postgres-driver');

const { Pool } = require('pg');

const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
});

const suppliersQuery = `
  SELECT DISTINCT id
  FROM public.suppliers
`;

fetchSuppliers = async () => {
  const client = await pool.connect();
  const result = await client.query(suppliersQuery);
  client.release();

  return result.rows.map((row) => row.id);
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
        return new PostgresDriver({
          // A separate database used by this tenant:
          database: 'multitenancy_workshop_aux',
          host,
          user,
          password,
          port,
        });
      } else {
        return new PostgresDriver({
          database,
          host,
          user,
          password,
          port,
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
    // dynamic example
    scheduledRefreshContexts: async () => {
      const supplier_ids = await fetchSuppliers()
      return supplier_ids.map((id) => { 
        return { securityContext: { supplier_id: id } }
      })
    }
};
