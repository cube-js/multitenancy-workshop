const {
  securityContext: { merchant_id },
} = COMPILE_CONTEXT;

const customMeasures = {};
if (parseInt(merchant_id, 10) === 1) {
  // Only this tenant has orders with the "processing" status 
  customMeasures[`processingCount`] = {
    type: `count`,
    filters: [
      { sql: (CUBE) => `${CUBE}.status = 'processing'` }
    ]
  }
};

cube(`Orders`, {
  sql: `SELECT * FROM public.orders`,
  preAggregations: {// Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  

    main: {
      measures: [Orders.count],
      dimensions: [Merchants.id],
      timeDimension: Orders.createdAt,
      granularity: `day`
    }
  },
  joins: {
    Products: {
      sql: `${CUBE}.product_id = ${Products}.id`,
      relationship: `belongsTo`
    }
  },
  measures: Object.assign(
    {
      count: {
        type: `count`,
      },
      number: {
        sql: (CUBE) => `number`,
        type: `sum`
      }
    },
    customMeasures
  ),
  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },
    status: {
      sql: `status`,
      type: `string`
    },
    createdAt: {
      sql: `created_at`,
      type: `time`
    },
    completedAt: {
      sql: `completed_at`,
      type: `time`
    }
  }
});